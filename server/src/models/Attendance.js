const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema(
  {
    classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
    sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'ClassSession', required: true },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
      type: String,
      enum: ['present', 'late', 'excused', 'unexcused'],
      default: 'present'
    },
    notes: { type: String, default: '' },
    markedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    markedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

attendanceSchema.index({ sessionId: 1, studentId: 1 }, { unique: true });
attendanceSchema.index({ classId: 1, studentId: 1 });

module.exports = mongoose.model('Attendance', attendanceSchema);
