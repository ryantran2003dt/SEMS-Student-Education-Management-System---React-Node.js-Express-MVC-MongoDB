const submissionService = require('../services/submissionService');
const { sendSuccess } = require('../utils/response');

class SubmissionController {
  async submitAssignment(req, res, next) {
    try {
      const { assignmentId } = req.params;
      let { answers, submittedText, attachmentUrl } = req.body;
      if (typeof answers === 'string') {
        try {
          answers = JSON.parse(answers);
        } catch (e) {
          answers = [];
        }
      }
      const submission = await submissionService.submitAssignment({
        assignmentId,
        studentId: req.user._id,
        answers,
        submittedText,
        attachmentUrl: req.file ? `/uploads/${req.file.filename}` : attachmentUrl || null
      });
      return sendSuccess(res, submission, 'Nộp bài tập thành công');
    } catch (err) {
      next(err);
    }
  }

  async getSubmissions(req, res, next) {
    try {
      const { assignmentId } = req.params;
      const submissions = await submissionService.getSubmissionsByAssignment(assignmentId, req.user);
      return sendSuccess(res, submissions);
    } catch (err) {
      next(err);
    }
  }

  async gradeSubmission(req, res, next) {
    try {
      const { id } = req.params;
      const { score, feedback, answersFeedback } = req.body;
      const graded = await submissionService.gradeSubmission(id, {
        score,
        feedback,
        answersFeedback,
        gradedByTeacherId: req.user._id,
        requestingUser: req.user
      });
      return sendSuccess(res, graded, 'Chấm điểm và gửi nhận xét thành công');
    } catch (err) {
      next(err);
    }
  }

  async requestResubmit(req, res, next) {
    try {
      const { id } = req.params;
      const { comment } = req.body;
      const result = await submissionService.requestResubmit(id, comment, req.user);
      return sendSuccess(res, result, 'Đã gửi yêu cầu làm lại bài tập');
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new SubmissionController();
