const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema({
  questionIndex: Number,
  studentAnswer: String,
  selectedOption: Number,
  pointsAwarded: Number,
  teacherNote: String
});

const submissionSchema = new mongoose.Schema(
  {
    assignmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Assignment', required: true },
    classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    answers: [answerSchema],
    submittedText: String,
    attachmentUrl: String,
    status: {
      type: String,
      enum: ['submitted', 'graded', 'resubmit_requested'],
      default: 'submitted'
    },
    submittedAt: { type: Date, default: Date.now },
    score: { type: Number, default: null },
    maxScore: { type: Number, default: 100 },
    feedback: String,
    gradedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    gradedAt: Date,
    resubmitComment: String
  },
  { timestamps: true }
);

submissionSchema.index({ assignmentId: 1, studentId: 1 }, { unique: true });
submissionSchema.index({ classId: 1, studentId: 1 });

module.exports = mongoose.model('Submission', submissionSchema);
