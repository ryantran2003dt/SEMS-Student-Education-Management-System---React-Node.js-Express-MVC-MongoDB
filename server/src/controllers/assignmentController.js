const assignmentService = require('../services/assignmentService');
const { sendSuccess } = require('../utils/response');

class AssignmentController {
  async listAssignments(req, res, next) {
    try {
      const { classId, status } = req.query;
      let teacherId = null;
      let studentId = null;

      if (req.user.role === 'teacher') {
        teacherId = req.user._id;
      } else if (req.user.role === 'student') {
        studentId = req.user._id;
      }

      const assignments = await assignmentService.listAssignments({
        classId,
        teacherId,
        status,
        userRole: req.user.role,
        studentId,
        userId: req.user._id
      });
      return sendSuccess(res, assignments);
    } catch (err) {
      next(err);
    }
  }

  async getAssignmentById(req, res, next) {
    try {
      const assignment = await assignmentService.getAssignmentById(req.params.id, req.user);
      return sendSuccess(res, assignment);
    } catch (err) {
      next(err);
    }
  }

  async createAssignment(req, res, next) {
    try {
      const assignment = await assignmentService.createAssignment(req.body, req.user._id);
      return sendSuccess(res, assignment, 'Tạo bài tập thành công', 201);
    } catch (err) {
      next(err);
    }
  }

  async updateAssignment(req, res, next) {
    try {
      const teacherId = req.user.role === 'admin' ? null : req.user._id;
      const updated = await assignmentService.updateAssignment(req.params.id, req.body, teacherId);
      return sendSuccess(res, updated, 'Cập nhật bài tập thành công');
    } catch (err) {
      next(err);
    }
  }

  async validateAssignment(req, res, next) {
    try {
      const result = await assignmentService.validateAndScore(req.params.id);
      return sendSuccess(res, result, 'Kiểm định bài tập hoàn tất');
    } catch (err) {
      next(err);
    }
  }

  async approveAssignment(req, res, next) {
    try {
      const teacherId = req.user.role === 'admin' ? null : req.user._id;
      const approved = await assignmentService.approveAssignment(req.params.id, teacherId);
      return sendSuccess(res, approved, 'Phê duyệt bài tập thành công');
    } catch (err) {
      next(err);
    }
  }

  async publishAssignment(req, res, next) {
    try {
      const teacherId = req.user.role === 'admin' ? null : req.user._id;
      const published = await assignmentService.publishAssignment(req.params.id, teacherId);
      return sendSuccess(res, published, 'Xuất bản bài tập cho học viên thành công');
    } catch (err) {
      next(err);
    }
  }

  async deleteAssignment(req, res, next) {
    try {
      const teacherId = req.user.role === 'admin' ? null : req.user._id;
      await assignmentService.deleteAssignment(req.params.id, teacherId);
      return sendSuccess(res, null, 'Xóa bài tập thành công');
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new AssignmentController();
