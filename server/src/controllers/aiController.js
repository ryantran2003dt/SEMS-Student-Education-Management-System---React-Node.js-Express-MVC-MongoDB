const aiService = require('../services/aiService');
const assignmentService = require('../services/assignmentService');
const { Class } = require('../models/Class');
const Assignment = require('../models/Assignment');
const Submission = require('../models/Submission');
const { sendSuccess, sendError } = require('../utils/response');

class AIController {
  async getAIStatus(req, res, next) {
    try {
      const status = aiService.getAIStatus();
      return sendSuccess(res, status);
    } catch (err) {
      next(err);
    }
  }

  async generateAssignment(req, res, next) {
    try {
      const { classId, lessonId, topic, difficulty, questionCount, questionType } = req.body;

      if (req.user.role === 'teacher') {
        const classObj = await Class.findById(classId);
        if (!classObj || classObj.teacherId.toString() !== req.user._id.toString()) {
          return sendError(res, 'Bạn chỉ có thể tạo bài tập cho lớp mình phụ trách', 403);
        }
      }

      const draft = await aiService.generateAssignmentDraft({
        classId,
        lessonId,
        topic,
        difficulty,
        questionCount: Number(questionCount) || 4,
        questionType
      });
      return sendSuccess(res, draft, 'AI đã sinh bản nháp bài tập thành công');
    } catch (err) {
      next(err);
    }
  }

  async gradeSubmission(req, res, next) {
    try {
      const { submissionId } = req.params;

      const submission = await Submission.findById(submissionId).populate({
        path: 'assignmentId',
        populate: { path: 'classId' }
      });

      if (!submission) {
        return sendError(res, 'Không tìm thấy bài nộp', 404);
      }

      // Check teacher authority
      if (req.user.role === 'teacher') {
        const teacherId = (req.user.id || req.user._id).toString();
        const classTeacher = submission.assignmentId?.classId?.teacherId?.toString();
        const assignTeacher = submission.assignmentId?.teacherId?.toString();
        if (classTeacher !== teacherId && assignTeacher !== teacherId) {
          return sendError(res, 'Bạn không có quyền chấm bài nộp của lớp khác', 403);
        }
      }

      const result = await aiService.gradeSubmissionWithAI({ submissionId });

      return sendSuccess(res, result, 'AI đã phân tích và đề xuất kết quả chấm điểm');
    } catch (err) {
      next(err);
    }
  }

  async validateAssignment(req, res, next) {
    try {
      const { id } = req.params;

      if (req.user.role === 'teacher') {
        const assignment = await Assignment.findById(id);
        if (!assignment || assignment.teacherId.toString() !== req.user._id.toString()) {
          return sendError(res, 'Bạn chỉ có thể kiểm định bài tập của chính mình', 403);
        }
      }

      const result = await assignmentService.validateAndScore(id);
      return sendSuccess(res, result, 'Kiểm định bài tập AI thành công');
    } catch (err) {
      next(err);
    }
  }

  /**
   * AI Chat - Hỗ trợ hỏi đáp học thuật cho học sinh & giáo viên
   */
  async chat(req, res, next) {
    try {
      const { message, history = [], context = '' } = req.body;

      if (!message || !message.trim()) {
        return sendError(res, 'Tin nhắn không được để trống', 400);
      }

      const result = await aiService.chatWithAI({
        message: message.trim(),
        history,
        context,
        userRole: req.user.role,
        userName: req.user.fullName || req.user.username
      });

      return sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new AIController();
