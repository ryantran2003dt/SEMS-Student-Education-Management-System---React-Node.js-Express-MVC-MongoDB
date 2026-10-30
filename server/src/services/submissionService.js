const Submission = require('../models/Submission');
const Assignment = require('../models/Assignment');
const { Class } = require('../models/Class');
const User = require('../models/User');
const { ParentStudentLink } = require('../models/Profiles');
const notificationService = require('./notificationService');

class SubmissionService {
  async submitAssignment({ assignmentId, studentId, answers, submittedText, attachmentUrl }) {
    const assignment = await Assignment.findById(assignmentId).populate('classId');
    if (!assignment) throw new Error('Không tìm thấy bài tập');

    if (assignment.status !== 'published') {
      throw new Error('Bài tập chưa được mở để nộp');
    }

    // Strict enrollment verification
    const isEnrolled = assignment.classId?.studentIds?.some(s => s.toString() === studentId.toString());
    if (!isEnrolled) {
      throw new Error('Bạn không thể nộp bài vì không thuộc danh sách học viên của lớp này');
    }

    // Auto-grade multiple-choice questions if possible
    let autoScore = 0;
    const processedAnswers = (answers || []).map((ans, idx) => {
      const q = assignment.questions[idx];
      let pointsAwarded = null;

      if (q && q.type === 'multiple_choice' && q.correctAnswer) {
        // Compare option string or index
        const isMatch = ans.studentAnswer?.trim()?.toLowerCase() === q.correctAnswer?.trim()?.toLowerCase()
          || (typeof ans.selectedOption === 'number' && q.options[ans.selectedOption]?.trim()?.toLowerCase() === q.correctAnswer?.trim()?.toLowerCase());

        pointsAwarded = isMatch ? (q.points || 10) : 0;
        autoScore += pointsAwarded;
      }

      return {
        questionIndex: idx,
        studentAnswer: ans.studentAnswer,
        selectedOption: ans.selectedOption,
        pointsAwarded,
        teacherNote: ''
      };
    });

    const isAllMultipleChoice = assignment.questions.length > 0 &&
      assignment.questions.every(q => q.type === 'multiple_choice');

    const submissionStatus = isAllMultipleChoice ? 'graded' : 'submitted';

    const submission = await Submission.findOneAndUpdate(
      { assignmentId, studentId },
      {
        classId: assignment.classId?._id || assignment.classId,
        answers: processedAnswers,
        submittedText,
        attachmentUrl,
        status: submissionStatus,
        submittedAt: new Date(),
        score: isAllMultipleChoice ? autoScore : null,
        maxScore: assignment.maxScore || 100,
        feedback: isAllMultipleChoice ? 'Hệ thống đã tự động chấm điểm bài trắc nghiệm.' : null
      },
      { upsert: true, new: true }
    );

    // Notify teacher
    try {
      const studentUser = await User.findById(studentId);
      const teacherTarget = assignment.teacherId || assignment.classId?.teacherId;
      if (teacherTarget) {
        await notificationService.createNotification({
          recipientId: teacherTarget,
          title: 'Học viên nộp bài tập',
          message: `${studentUser?.fullName || 'Học viên'} đã nộp bài tập: "${assignment.title}"`,
          type: 'assignment',
          link: '/teacher/grading'
        });
      }
    } catch (notifErr) {
      console.warn('[Notification Error]', notifErr.message);
    }

    return submission;
  }

  async getSubmissionsByAssignment(assignmentId, requestingUser = null) {
    const assignment = await Assignment.findById(assignmentId).populate('classId');
    if (!assignment) throw new Error('Không tìm thấy bài tập');

    if (requestingUser && requestingUser.role === 'teacher') {
      const teacherId = (requestingUser.id || requestingUser._id).toString();
      const isTeacherOfClass = assignment.classId?.teacherId?.toString() === teacherId;
      const isCreator = assignment.teacherId?.toString() === teacherId;
      if (!isTeacherOfClass && !isCreator) {
        throw new Error('Bạn không có quyền xem bài nộp của lớp khác');
      }
    }

    return await Submission.find({ assignmentId })
      .populate('studentId', 'fullName email phone avatar')
      .populate('gradedBy', 'fullName')
      .sort({ submittedAt: -1 });
  }

  async gradeSubmission(submissionId, { score, feedback, answersFeedback, gradedByTeacherId, requestingUser = null }) {
    const submission = await Submission.findById(submissionId).populate({
      path: 'assignmentId',
      populate: { path: 'classId' }
    });
    if (!submission) throw new Error('Không tìm thấy bài nộp');

    if (requestingUser && requestingUser.role === 'teacher') {
      const teacherId = (requestingUser.id || requestingUser._id).toString();
      const classTeacher = submission.assignmentId?.classId?.teacherId?.toString();
      const assignTeacher = submission.assignmentId?.teacherId?.toString();
      if (classTeacher !== teacherId && assignTeacher !== teacherId) {
        throw new Error('Bạn không có quyền chấm bài nộp của lớp khác');
      }
    }

    submission.score = score;
    submission.feedback = feedback;
    submission.gradedBy = gradedByTeacherId;
    submission.gradedAt = new Date();
    submission.status = 'graded';

    if (answersFeedback && Array.isArray(answersFeedback)) {
      answersFeedback.forEach(af => {
        const targetAns = submission.answers.find(a => a.questionIndex === af.questionIndex);
        if (targetAns) {
          if (af.pointsAwarded !== undefined) targetAns.pointsAwarded = af.pointsAwarded;
          if (af.teacherNote !== undefined) targetAns.teacherNote = af.teacherNote;
        }
      });
    }

    const saved = await submission.save();

    // Notify student and parent about grade
    try {
      const assignmentTitle = submission.assignmentId?.title || 'Bài tập';
      await notificationService.createNotification({
        recipientId: submission.studentId,
        title: 'Bài tập đã được chấm điểm',
        message: `Bạn nhận được ${score}/${submission.maxScore} điểm cho bài: "${assignmentTitle}". ${feedback ? `Nhận xét: ${feedback}` : ''}`,
        type: 'grade',
        link: `/student/assignments/${submission.assignmentId?._id || submission.assignmentId}`
      });

      const parentLinks = await ParentStudentLink.find({ studentUserId: submission.studentId, status: 'verified' });
      for (const link of parentLinks) {
        await notificationService.createNotification({
          recipientId: link.parentUserId,
          title: 'Kết quả học tập mới của con',
          message: `Bài tập "${assignmentTitle}" của con bạn đã được chấm: ${score}/${submission.maxScore} điểm.`,
          type: 'grade',
          link: '/parent/grades'
        });
      }
    } catch (notifErr) {
      console.warn('[Notification Error]', notifErr.message);
    }

    return saved;
  }

  async requestResubmit(submissionId, teacherComment, requestingUser = null) {
    const submission = await Submission.findById(submissionId).populate({
      path: 'assignmentId',
      populate: { path: 'classId' }
    });
    if (!submission) throw new Error('Không tìm thấy bài nộp');

    if (requestingUser && requestingUser.role === 'teacher') {
      const teacherId = (requestingUser.id || requestingUser._id).toString();
      const classTeacher = submission.assignmentId?.classId?.teacherId?.toString();
      const assignTeacher = submission.assignmentId?.teacherId?.toString();
      if (classTeacher !== teacherId && assignTeacher !== teacherId) {
        throw new Error('Bạn không có quyền yêu cầu làm lại bài của lớp khác');
      }
    }

    submission.status = 'resubmit_requested';
    submission.resubmitComment = teacherComment;
    const saved = await submission.save();

    // Notify student and parent
    try {
      const assignmentTitle = submission.assignmentId?.title || 'Bài tập';
      await notificationService.createNotification({
        recipientId: submission.studentId,
        title: 'Yêu cầu làm lại bài tập',
        message: `Giáo viên yêu cầu làm lại bài: "${assignmentTitle}". Hướng dẫn: "${teacherComment}"`,
        type: 'assignment',
        link: `/student/assignments/${submission.assignmentId?._id || submission.assignmentId}`
      });

      const parentLinks = await ParentStudentLink.find({ studentUserId: submission.studentId, status: 'verified' });
      for (const link of parentLinks) {
        await notificationService.createNotification({
          recipientId: link.parentUserId,
          title: 'Yêu cầu hoàn thiện bài tập của con',
          message: `Giáo viên đã gửi góp ý và yêu cầu con hoàn thiện lại bài: "${assignmentTitle}".`,
          type: 'assignment',
          link: '/parent'
        });
      }
    } catch (notifErr) {
      console.warn('[Notification Error]', notifErr.message);
    }

    return saved;
  }
}

module.exports = new SubmissionService();
