const mongoose = require('mongoose');

const studentProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },
    studentCode: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    dateOfBirth: Date,
    gender: {
      type: String,
      enum: ['Nam', 'Nữ', 'Khác'],
      default: 'Nam'
    },
    address: String,
    school: String,
    target: String,
    notes: String
  },
  { timestamps: true }
);

const teacherProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },
    teacherCode: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    specialization: String,
    degree: String,
    biography: String
  },
  { timestamps: true }
);

const parentProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },
    occupation: String,
    emergencyPhone: String,
    address: String
  },
  { timestamps: true }
);

const parentStudentLinkSchema = new mongoose.Schema(
  {
    parentUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    studentUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    relationship: {
      type: String,
      enum: ['Bố', 'Mẹ', 'Người giám hộ', 'Khác'],
      default: 'Phụ huynh'
    },
    status: {
      type: String,
      enum: ['verified', 'pending', 'rejected'],
      default: 'verified'
    }
  },
  { timestamps: true }
);

parentStudentLinkSchema.index({ parentUserId: 1, studentUserId: 1 }, { unique: true });

const StudentProfile = mongoose.model('StudentProfile', studentProfileSchema);
const TeacherProfile = mongoose.model('TeacherProfile', teacherProfileSchema);
const ParentProfile = mongoose.model('ParentProfile', parentProfileSchema);
const ParentStudentLink = mongoose.model('ParentStudentLink', parentStudentLinkSchema);

module.exports = {
  StudentProfile,
  TeacherProfile,
  ParentProfile,
  ParentStudentLink
};
