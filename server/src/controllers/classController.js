const classService = require('../services/classService');
const userService = require('../services/userService');
const { sendSuccess } = require('../utils/response');

class ClassController {
  async listClasses(req, res, next) {
    try {
      const { teacherId, studentId, status } = req.query;
      let finalTeacherId = teacherId;
      let finalStudentId = studentId;
      let finalStudentIds = null;

      // Role isolation & strict authorization
      if (req.user.role === 'teacher') {
        finalTeacherId = req.user._id;
      } else if (req.user.role === 'student') {
        finalStudentId = req.user._id;
      } else if (req.user.role === 'parent') {
        const children = await userService.getLinkedChildren(req.user._id);
        finalStudentIds = children.map(c => c._id);
      }

      const classes = await classService.listClasses({
        teacherId: finalTeacherId,
        studentId: finalStudentId,
        studentIds: finalStudentIds,
        status
      });
      return sendSuccess(res, classes);
    } catch (err) {
      next(err);
    }
  }

  async getClassById(req, res, next) {
    try {
      const classItem = await classService.getClassById(req.params.id, req.user);
      return sendSuccess(res, classItem);
    } catch (err) {
      next(err);
    }
  }

  async createClass(req, res, next) {
    try {
      const newClass = await classService.createClass(req.body);
      return sendSuccess(res, newClass, 'Tạo lớp học thành công', 201);
    } catch (err) {
      next(err);
    }
  }

  async updateClass(req, res, next) {
    try {
      const updated = await classService.updateClass(req.params.id, req.body, req.user);
      return sendSuccess(res, updated, 'Cập nhật lớp học thành công');
    } catch (err) {
      next(err);
    }
  }

  async enrollStudent(req, res, next) {
    try {
      const { studentId } = req.body;
      const updated = await classService.enrollStudent(req.params.id, studentId);
      return sendSuccess(res, updated, 'Thêm học viên vào lớp thành công');
    } catch (err) {
      next(err);
    }
  }

  async removeStudent(req, res, next) {
    try {
      const { studentId } = req.body;
      const updated = await classService.removeStudent(req.params.id, studentId);
      return sendSuccess(res, updated, 'Đã chuyển học viên ra khỏi lớp');
    } catch (err) {
      next(err);
    }
  }

  async createSession(req, res, next) {
    try {
      const session = await classService.createSession(req.params.id, req.body, req.user);
      return sendSuccess(res, session, 'Tạo buổi học thành công', 201);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new ClassController();
