const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  questionText: { type: String, required: true },
  type: {
    type: String,
    enum: ['multiple_choice', 'short_answer', 'essay', 'code'],
    default: 'multiple_choice'
  },
  options: [String],
  correctAnswer: String,
  points: { type: Number, default: 10 },
  explanation: String,
  targetObjective: String
});

const assignmentSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: String,
    classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
    lessonId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson' },
    teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    difficulty: {
      type: String,
      enum: ['Dễ', 'Trung bình', 'Khó'],
      default: 'Trung bình'
    },
    topic: String,
    curriculumAlignment: String,
    source: {
      type: String,
      enum: ['manual', 'ai'],
      default: 'manual'
    },
    status: {
      type: String,
      enum: ['draft', 'pending_review', 'approved', 'published', 'archived'],
      default: 'draft'
    },
    dueDate: { type: Date, required: true },
    durationMinutes: { type: Number, default: 45 },
    maxScore: { type: Number, default: 100 },
    questions: [questionSchema],
    aiMetadata: {
      modelUsed: String,
      generatedPrompt: String,
      validationScore: Number, // 0 - 100
      validationReport: {
        alignmentValid: Boolean,
        difficultyAppropriate: Boolean,
        rubricComplete: Boolean,
        suggestions: [String]
      },
      verifiedByTeacher: Boolean
    }
  },
  { timestamps: true }
);

assignmentSchema.index({ classId: 1, status: 1 });
assignmentSchema.index({ teacherId: 1 });

module.exports = mongoose.model('Assignment', assignmentSchema);
