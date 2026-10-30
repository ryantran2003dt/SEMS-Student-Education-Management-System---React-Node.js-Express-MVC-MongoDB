const mongoose = require('mongoose');

// Lớp học (Class)
const classSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    studentIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    scheduleDescription: { type: String, default: 'Thứ 2, Thứ 4 (18:00 - 20:00)' },
    room: { type: String, default: 'Phòng Lab 01' },
    startDate: { type: Date, default: Date.now },
    endDate: Date,
    status: {
      type: String,
      enum: ['upcoming', 'ongoing', 'completed', 'cancelled'],
      default: 'ongoing'
    }
  },
  { timestamps: true }
);

// Buổi học (ClassSession)
const classSessionSchema = new mongoose.Schema(
  {
    classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
    lessonId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson' },
    sessionNumber: { type: Number, required: true },
    title: { type: String, required: true },
    date: { type: Date, required: true },
    startTime: { type: String, default: '18:00' },
    endTime: { type: String, default: '20:00' },
    room: { type: String, default: 'Phòng Lab 01' },
    status: {
      type: String,
      enum: ['scheduled', 'ongoing', 'completed', 'cancelled'],
      default: 'scheduled'
    },
    notes: String
  },
  { timestamps: true }
);

classSessionSchema.index({ classId: 1, sessionNumber: 1 });

const Class = mongoose.model('Class', classSchema);
const ClassSession = mongoose.model('ClassSession', classSessionSchema);

module.exports = {
  Class,
  ClassSession
};
