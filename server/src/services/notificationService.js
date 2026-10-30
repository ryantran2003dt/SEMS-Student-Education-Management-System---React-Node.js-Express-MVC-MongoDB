const { Notification } = require('../models/Certificate');

class NotificationService {
  async createNotification({ recipientId, title, message, type = 'system', link = '' }) {
    if (!recipientId) return null;
    return await Notification.create({
      recipientId,
      title,
      message,
      type,
      link,
      isRead: false
    });
  }

  async createBulkNotifications(recipientIds, { title, message, type = 'system', link = '' }) {
    if (!recipientIds || recipientIds.length === 0) return [];
    const docs = recipientIds.map(recipientId => ({
      recipientId,
      title,
      message,
      type,
      link,
      isRead: false
    }));
    return await Notification.insertMany(docs);
  }

  async getUserNotifications(userId, { limit = 30 } = {}) {
    return await Notification.find({ recipientId: userId })
      .sort({ createdAt: -1 })
      .limit(limit);
  }

  async getUnreadCount(userId) {
    return await Notification.countDocuments({ recipientId: userId, isRead: false });
  }

  async markAsRead(notificationId, userId) {
    return await Notification.findOneAndUpdate(
      { _id: notificationId, recipientId: userId },
      { isRead: true },
      { new: true }
    );
  }

  async markAllAsRead(userId) {
    await Notification.updateMany(
      { recipientId: userId, isRead: false },
      { isRead: true }
    );
    return { success: true };
  }
}

module.exports = new NotificationService();
