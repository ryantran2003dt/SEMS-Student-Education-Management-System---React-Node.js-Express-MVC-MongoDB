const notificationService = require('../services/notificationService');
const { sendSuccess } = require('../utils/response');

class NotificationController {
  async getMyNotifications(req, res, next) {
    try {
      const notifications = await notificationService.getUserNotifications(req.user._id);
      const unreadCount = await notificationService.getUnreadCount(req.user._id);
      return sendSuccess(res, { notifications, unreadCount });
    } catch (err) {
      next(err);
    }
  }

  async getUnreadCount(req, res, next) {
    try {
      const count = await notificationService.getUnreadCount(req.user._id);
      return sendSuccess(res, { count });
    } catch (err) {
      next(err);
    }
  }

  async markAsRead(req, res, next) {
    try {
      const updated = await notificationService.markAsRead(req.params.id, req.user._id);
      return sendSuccess(res, updated, 'Đã đánh dấu là đã đọc');
    } catch (err) {
      next(err);
    }
  }

  async markAllAsRead(req, res, next) {
    try {
      const result = await notificationService.markAllAsRead(req.user._id);
      return sendSuccess(res, result, 'Đã đánh dấu tất cả thông báo là đã đọc');
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new NotificationController();
