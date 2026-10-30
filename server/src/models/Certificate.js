const mongoose = require('mongoose');

// Chứng nhận (Certificate)
const certificateSchema = new mongoose.Schema(
  {
    certificateCode: { type: String, required: true, unique: true, uppercase: true },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
    issueDate: { type: Date, default: Date.now },
    averageScore: Number,
    attendanceRate: Number,
    status: {
      type: String,
      enum: ['valid', 'revoked'],
      default: 'valid'
    },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    revokedReason: String
  },
  { timestamps: true }
);

certificateSchema.index({ studentId: 1, courseId: 1 });

// Thông báo (Notification)
const notificationSchema = new mongoose.Schema(
  {
    recipientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: {
      type: String,
      enum: ['assignment', 'attendance', 'grade', 'certificate', 'system'],
      default: 'system'
    },
    isRead: { type: Boolean, default: false },
    link: String
  },
  { timestamps: true }
);

notificationSchema.index({ recipientId: 1, isRead: 1 });

const Certificate = mongoose.model('Certificate', certificateSchema);
const Notification = mongoose.model('Notification', notificationSchema);

module.exports = {
  Certificate,
  Notification
};
