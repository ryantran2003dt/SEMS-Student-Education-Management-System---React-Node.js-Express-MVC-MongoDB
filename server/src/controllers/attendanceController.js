const attendanceService = require('../services/attendanceService');
const { sendSuccess, sendError } = require('../utils/response');
const { ParentStudentLink } = require('../models/Profiles');

class AttendanceController {
  async recordAttendance(req, res, next) {
    try {
      const { sessionId } = req.params;
      const { attendanceRecords } = req.body; // array of { studentId, status, notes }
      const results = await attendanceService.recordAttendance(sessionId, attendanceRecords, req.user);
      return sendSuccess(res, results, 'Ghi nhận điểm danh thành công');
    } catch (err) {
      next(err);
    }
  }

  async getSessionAttendance(req, res, next) {
    try {
      const { sessionId } = req.params;
      const records = await attendanceService.getSessionAttendance(sessionId, req.user);
      return sendSuccess(res, records);
    } catch (err) {
      next(err);
    }
  }

  async getStudentAttendance(req, res, next) {
    try {
      let targetStudentId = req.params.studentId || req.user._id;

      // Strict role isolation:
      if (req.user.role === 'student') {
        targetStudentId = req.user._id;
      } else if (req.user.role === 'parent') {
        const links = await ParentStudentLink.find({ parentUserId: req.user._id, status: 'verified' });
        const childIds = links.map(l => l.studentUserId.toString());
        if (!req.params.studentId || req.params.studentId === req.user._id.toString()) {
          targetStudentId = childIds[0];
        } else if (!childIds.includes(req.params.studentId.toString())) {
          return sendError(res, 'Bạn không có quyền xem thông tin điểm danh của học viên này', 403);
        }
      }

      const { classId } = req.query;
      const stats = await attendanceService.getStudentAttendance(targetStudentId, classId);
      return sendSuccess(res, stats);
    } catch (err) {
      next(err);
    }
  }

  async getClassAttendanceStats(req, res, next) {
    try {
      const { classId } = req.params;
      const stats = await attendanceService.getClassAttendanceStats(classId);
      return sendSuccess(res, stats);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new AttendanceController();
