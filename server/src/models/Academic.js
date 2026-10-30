const mongoose = require('mongoose');

// Môn học (Subject)
const subjectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    description: String,
    level: { type: String, default: 'Cơ bản - Nâng cao' },
    status: { type: String, enum: ['active', 'archived'], default: 'active' }
  },
  { timestamps: true }
);

// Khóa học (Course)
const courseSchema = new mongoose.Schema(
  {
    subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    targetAudience: String,
    objective: String,
    durationHours: { type: Number, default: 36 },
    expectedSessions: { type: Number, default: 12 },
    status: { type: String, enum: ['active', 'draft', 'archived'], default: 'active' }
  },
  { timestamps: true }
);

// Chương trình học & Phiên bản (Curriculum)
const curriculumSchema = new mongoose.Schema(
  {
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    version: { type: String, required: true, default: '1.0' },
    learningOutcomes: [String],
    topics: [String],
    isCurrent: { type: Boolean, default: true },
    changeLog: String
  },
  { timestamps: true }
);

// Bài học (Lesson)
const lessonSchema = new mongoose.Schema(
  {
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    curriculumId: { type: mongoose.Schema.Types.ObjectId, ref: 'Curriculum' },
    sessionNumber: { type: Number, required: true },
    title: { type: String, required: true, trim: true },
    topic: { type: String, required: true },
    objectives: [String],
    materials: [
      {
        title: String,
        url: String,
        type: { type: String, default: 'link' }
      }
    ]
  },
  { timestamps: true }
);

lessonSchema.index({ courseId: 1, sessionNumber: 1 }, { unique: true });

const Subject = mongoose.model('Subject', subjectSchema);
const Course = mongoose.model('Course', courseSchema);
const Curriculum = mongoose.model('Curriculum', curriculumSchema);
const Lesson = mongoose.model('Lesson', lessonSchema);

module.exports = {
  Subject,
  Course,
  Curriculum,
  Lesson
};
