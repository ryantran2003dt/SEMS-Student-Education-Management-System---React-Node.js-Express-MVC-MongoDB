const Assignment = require('../models/Assignment');
const Submission = require('../models/Submission');
const { Class } = require('../models/Class');
const { ParentStudentLink } = require('../models/Profiles');
const aiService = require('./aiService');
const notificationService = require('./notificationService');

class AssignmentService {
  async listAssignments({ classId, teacherId, status, userRole, studentId, userId }) {
    const query = {};
    if (classId) query.classId = classId;
    if (teacherId) query.teacherId = teacherId;
    if (status) query.status = status;

    // Security rule: Students & Parents can only see published or archived assignments
    if (userRole === 'student' || userRole === 'parent') {
      query.status = { $in: ['published', 'archived'] };
    }

    // If student, strictly filter by classes they are enrolled in
    if (userRole === 'student' && studentId) {
      const studentClasses = await Class.find({ studentIds: studentId }).select('_id');
      query.classId = { $in: studentClasses.map(c => c._id) };
    }

    // If parent, strictly filter by classes their verified children are enrolled in
    if (userRole === 'parent' && userId) {
      const links = await ParentStudentLink.find({ parentUserId: userId, status: 'verified' });
      const childIds = links.map(l => l.studentUserId);
      const childClasses = await Class.find({ studentIds: { $in: childIds } }).select('_id');
      query.classId = { $in: childClasses.map(c => c._id) };
    }

    // If teacher, strictly filter by classes they teach
    if (userRole === 'teacher' && teacherId) {
      const teacherClasses = await Class.find({ teacherId }).select('_id');
      query.$or = [
        { teacherId },
        { classId: { $in: teacherClasses.map(c => c._id) } }
      ];
      delete query.teacherId;
    }

    const assignments = await Assignment.find(query)
      .populate('classId', 'name code')
      .populate('teacherId', 'fullName email')
      .populate('lessonId', 'title sessionNumber')
      .sort({ createdAt: -1 });

    // If studentId provided, also check submission status for each assignment
    if (studentId) {
      const submissions = await Submission.find({
        studentId,
        assignmentId: { $in: assignments.map(a => a._id) }
      });
      const submissionMap = new Map(submissions.map(s => [s.assignmentId.toString(), s]));

      return assignments.map(a => {
        const sub = submissionMap.get(a._id.toString());
        return {
          ...a.toObject(),
          mySubmission: sub || null,
          isSubmitted: !!sub,
          isGraded: sub?.status === 'graded',
          myScore: sub?.score ?? null
        };
      });
    }

    return assignments;
  }

  async getAssignmentById(id, requestingUser = null) {
    const assignment = await Assignment.findById(id)
      .populate({
        path: 'classId',
        select: 'name code studentIds teacherId courseId',
        populate: {
          path: 'courseId',
          select: 'name subjectId',
          populate: { path: 'subjectId', select: 'name code' }
        }
      })
      .populate('teacherId', 'fullName email phone')
      .populate('lessonId');

    if (!assignment) throw new Error('Không tìm thấy bài tập');

    // Strict Object-level Access Control
    if (requestingUser && requestingUser.role !== 'admin') {
      const userId = (requestingUser.id || requestingUser._id).toString();

      if (requestingUser.role === 'student') {
        if (assignment.status !== 'published' && assignment.status !== 'archived') {
          throw new Error('Bạn không có quyền xem bài tập chưa được công bố');
        }
        const isEnrolled = assignment.classId?.studentIds?.some(s => s.toString() === userId);
        if (!isEnrolled) {
          throw new Error('Bạn không có quyền xem bài tập của lớp học này');
        }
      } else if (requestingUser.role === 'parent') {
        if (assignment.status !== 'published' && assignment.status !== 'archived') {
          throw new Error('Bạn không có quyền xem bài tập chưa được công bố');
        }
        const links = await ParentStudentLink.find({ parentUserId: userId, status: 'verified' });
        const childIds = links.map(l => l.studentUserId.toString());
        const hasChildInClass = assignment.classId?.studentIds?.some(s => childIds.includes(s.toString()));
        if (!hasChildInClass) {
          throw new Error('Bạn không có quyền xem bài tập này');
        }
      } else if (requestingUser.role === 'teacher') {
        const isTeacherOfClass = assignment.classId?.teacherId?.toString() === userId;
        const isCreator = assignment.teacherId?._id?.toString() === userId || assignment.teacherId?.toString() === userId;
        if (!isTeacherOfClass && !isCreator) {
          throw new Error('Bạn không có quyền xem bài tập thuộc lớp của giáo viên khác');
        }
      }
    }

    let submission = null;
    if (requestingUser && requestingUser.role === 'student') {
      submission = await Submission.findOne({
        assignmentId: id,
        studentId: requestingUser.id || requestingUser._id
      });
    }

    const assignmentObj = assignment.toObject();

    // Anti-Cheating Protection: Hide correct answers and explanations from students unless graded
    if (requestingUser && requestingUser.role === 'student') {
      const isGraded = submission && submission.status === 'graded';
      if (!isGraded && assignmentObj.questions && Array.isArray(assignmentObj.questions)) {
        assignmentObj.questions = assignmentObj.questions.map(q => {
          const { correctAnswer, explanation, ...sanitized } = q;
          return sanitized;
        });
      }
    }

    return {
      ...assignmentObj,
      mySubmission: submission
    };
  }

  async createAssignment(data, teacherId) {
    const assignment = new Assignment({
      ...data,
      teacherId,
      status: data.status || 'draft'
    });
    return await assignment.save();
  }

  async updateAssignment(id, updateData, teacherId) {
    const assignment = await Assignment.findById(id);
    if (!assignment) throw new Error('Không tìm thấy bài tập');

    // Check ownership if teacher
    if (teacherId && assignment.teacherId.toString() !== teacherId.toString()) {
      throw new Error('Bạn chỉ có thể chỉnh sửa bài tập do chính mình tạo');
    }

    Object.assign(assignment, updateData);
    return await assignment.save();
  }

  async validateAndScore(id) {
    const assignment = await Assignment.findById(id);
    if (!assignment) throw new Error('Không tìm thấy bài tập');

    const validation = await aiService.validateAssignment(assignment);
    
    assignment.aiMetadata = {
      ...(assignment.aiMetadata || {}),
      validationScore: validation.validationScore,
      validationReport: {
        alignmentValid: validation.alignmentValid,
        difficultyAppropriate: validation.difficultyAppropriate,
        rubricComplete: validation.rubricComplete,
        suggestions: validation.suggestions
      }
    };

    if (assignment.status === 'draft') {
      assignment.status = 'pending_review';
    }

    await assignment.save();

    return {
      assignment,
      validation
    };
  }

  async approveAssignment(id, teacherId) {
    const assignment = await Assignment.findById(id);
    if (!assignment) throw new Error('Không tìm thấy bài tập');

    if (teacherId && assignment.teacherId.toString() !== teacherId.toString()) {
      throw new Error('Bạn không có quyền duyệt bài tập của giáo viên khác');
    }

    assignment.status = 'approved';
    if (assignment.aiMetadata) {
      assignment.aiMetadata.verifiedByTeacher = true;
    }
    return await assignment.save();
  }

  async publishAssignment(id, teacherId) {
    const assignment = await Assignment.findById(id);
    if (!assignment) throw new Error('Không tìm thấy bài tập');

    if (teacherId && assignment.teacherId.toString() !== teacherId.toString()) {
      throw new Error('Bạn không có quyền xuất bản bài tập của giáo viên khác');
    }

    assignment.status = 'published';
    if (assignment.aiMetadata) {
      assignment.aiMetadata.verifiedByTeacher = true;
    }
    const saved = await assignment.save();

    // Notify students & parents
    try {
      const classObj = await Class.findById(assignment.classId);
      if (classObj && classObj.studentIds?.length > 0) {
        await notificationService.createBulkNotifications(classObj.studentIds, {
          title: 'Bài tập mới được công bố',
          message: `Giáo viên đã công bố bài tập: "${assignment.title}". Hạn nộp: ${new Date(assignment.dueDate).toLocaleDateString('vi-VN')}`,
          type: 'assignment',
          link: `/student/assignments/${assignment._id}`
        });

        const parentLinks = await ParentStudentLink.find({
          studentUserId: { $in: classObj.studentIds },
          status: 'verified'
        });
        const parentIds = [...new Set(parentLinks.map(l => l.parentUserId.toString()))];
        if (parentIds.length > 0) {
          await notificationService.createBulkNotifications(parentIds, {
            title: 'Thông báo bài tập mới của con',
            message: `Lớp ${classObj.name} có bài tập mới: "${assignment.title}". Hạn nộp: ${new Date(assignment.dueDate).toLocaleDateString('vi-VN')}`,
            type: 'assignment',
            link: '/parent'
          });
        }
      }
    } catch (notifErr) {
      console.warn('[Notification Error]', notifErr.message);
    }

    return saved;
  }

  async deleteAssignment(id, teacherId) {
    const assignment = await Assignment.findById(id);
    if (!assignment) throw new Error('Không tìm thấy bài tập');

    if (teacherId && assignment.teacherId.toString() !== teacherId.toString()) {
      throw new Error('Bạn không có quyền xóa bài tập của giáo viên khác');
    }

    await Submission.deleteMany({ assignmentId: id });
    return await Assignment.findByIdAndDelete(id);
  }
}

module.exports = new AssignmentService();
