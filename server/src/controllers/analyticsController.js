const analyticsService = require('../services/analyticsService');
const { sendSuccess, sendError } = require('../utils/response');
const { ParentStudentLink } = require('../models/Profiles');

class AnalyticsController {
  async getOverview(req, res, next) {
    try {
      const role = req.user.role;
      let data = null;

      if (role === 'admin') {
        data = await analyticsService.getAdminOverview();
      } else if (role === 'teacher') {
        data = await analyticsService.getTeacherOverview(req.user._id);
      } else if (role === 'student') {
        data = await analyticsService.getStudentProgress(req.user._id);
      } else if (role === 'parent') {
        const { childId } = req.query;
        data = await analyticsService.getParentOverview(req.user._id, childId);
      }

      return sendSuccess(res, data);
    } catch (err) {
      next(err);
    }
  }

  async getStudentProgress(req, res, next) {
    try {
      let targetStudentId = req.params.studentId || req.user._id;

      if (req.user.role === 'student') {
        targetStudentId = req.user._id;
      } else if (req.user.role === 'parent') {
        const links = await ParentStudentLink.find({ parentUserId: req.user._id, status: 'verified' });
        const childIds = links.map(l => l.studentUserId.toString());
        if (!req.params.studentId || req.params.studentId === req.user._id.toString()) {
          targetStudentId = childIds[0];
        } else if (!childIds.includes(req.params.studentId.toString())) {
          return sendError(res, 'Bạn không có quyền xem tiến độ của học viên này', 403);
        }
      }

      const progress = await analyticsService.getStudentProgress(targetStudentId);
      return sendSuccess(res, progress);
    } catch (err) {
      next(err);
    }
  }

  async getRankings(req, res, next) {
    try {
      const { classId } = req.query;
      const rankings = await analyticsService.getRankings(classId);
      return sendSuccess(res, rankings);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new AnalyticsController();
