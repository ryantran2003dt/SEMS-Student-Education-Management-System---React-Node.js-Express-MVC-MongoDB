const { Class, ClassSession } = require('../models/Class');
const { Course, Lesson } = require('../models/Academic');
const User = require('../models/User');

class ClassService {
  async listClasses({ teacherId, studentId, studentIds, status }) {
    const query = {};
    if (teacherId) query.teacherId = teacherId;
    if (studentId) query.studentIds = studentId;
    if (studentIds && Array.isArray(studentIds)) query.studentIds = { $in: studentIds };
    if (status) query.status = status;

    return await Class.find(query)
      .populate('courseId', 'name code durationHours expectedSessions')
      .populate('teacherId', 'fullName email phone')
      .populate('studentIds', 'fullName email phone')
      .sort({ createdAt: -1 });
  }

  async getClassById(id, requestingUser = null) {
    const classItem = await Class.findById(id)
      .populate({
        path: 'courseId',
        populate: { path: 'subjectId' }
      })
      .populate('teacherId', 'fullName email phone avatar')
      .populate('studentIds', 'fullName email phone avatar');

    if (!classItem) throw new Error('Không tìm thấy lớp học');

    // Strict Role-Based Object Access Control
    if (requestingUser && requestingUser.role !== 'admin') {
      const userId = (requestingUser.id || requestingUser._id).toString();

      if (requestingUser.role === 'teacher') {
        const classTeacherId = classItem.teacherId?._id ? classItem.teacherId._id.toString() : classItem.teacherId?.toString();
        if (classTeacherId !== userId) {
          throw new Error('Bạn không có quyền truy cập lớp học của giáo viên khác');
        }
      } else if (requestingUser.role === 'student') {
        const isEnrolled = classItem.studentIds?.some(s => (s._id || s).toString() === userId);
        if (!isEnrolled) {
          throw new Error('Bạn không tham gia lớp học này');
        }
      } else if (requestingUser.role === 'parent') {
        const { ParentStudentLink } = require('../models/Profiles');
        const links = await ParentStudentLink.find({ parentUserId: userId, status: 'verified' });
        const childIds = links.map(l => l.studentUserId.toString());
        const hasChildInClass = classItem.studentIds?.some(s => childIds.includes((s._id || s).toString()));
        if (!hasChildInClass) {
          throw new Error('Bạn không có quyền truy cập lớp học này vì không có học viên được liên kết theo học');
        }
      }
    }

    const sessions = await ClassSession.find({ classId: id })
      .populate('lessonId')
      .sort({ sessionNumber: 1 });

    return {
      ...classItem.toObject(),
      sessions
    };
  }

  async createClass(data) {
    const course = await Course.findById(data.courseId);
    if (!course) {
      const error = new Error('Không tìm thấy khóa học để mở lớp');
      error.statusCode = 404;
      throw error;
    }

    let saved;
    const codePrefix = `${course.code}-L`;
    const codePattern = new RegExp(`^${codePrefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(\\d+)$`);
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const existingCodes = await Class.find({ code: codePattern }).distinct('code');
      const nextNumber = existingCodes.reduce((max, code) => {
        const suffix = Number(code.slice(codePrefix.length));
        return Number.isInteger(suffix) ? Math.max(max, suffix) : max;
      }, 0) + 1;
      const classNumber = String(nextNumber).padStart(2, '0');

      try {
        saved = await Class.create({
          ...data,
          code: `${codePrefix}${classNumber}`,
          name: `${course.name} - Lớp ${classNumber}`
        });
        break;
      } catch (err) {
        if (err.code !== 11000 || attempt === 4) {
          throw err;
        }
      }
    }

    // Generate sessions automatically if lessons exist for the course
    const lessons = await Lesson.find({ courseId: saved.courseId }).sort({ sessionNumber: 1 });
    
    if (lessons.length > 0) {
      const sessionDocs = lessons.map((lesson, idx) => {
        const sessionDate = new Date(saved.startDate || Date.now());
        sessionDate.setDate(sessionDate.getDate() + idx * 3); // 3 days between sessions
        return {
          classId: saved._id,
          lessonId: lesson._id,
          sessionNumber: lesson.sessionNumber,
          title: `Buổi ${lesson.sessionNumber}: ${lesson.title}`,
          date: sessionDate,
          startTime: '18:00',
          endTime: '20:00',
          room: saved.room || 'Phòng Lab 01',
          status: 'scheduled'
        };
      });
      await ClassSession.insertMany(sessionDocs);
    } else {
      // Create at least 1 session
      await ClassSession.create({
        classId: saved._id,
        sessionNumber: 1,
        title: 'Buổi 1: Giới thiệu khóa học và tổng quan môn học',
        date: saved.startDate || new Date(),
        startTime: '18:00',
        endTime: '20:00',
        room: saved.room || 'Phòng Lab 01',
        status: 'scheduled'
      });
    }

    return saved;
  }

  async updateClass(id, data, requestingUser = null) {
    const classItem = await Class.findById(id);
    if (!classItem) throw new Error('Không tìm thấy lớp học');

    if (requestingUser && requestingUser.role === 'teacher') {
      const classTeacherId = classItem.teacherId?.toString();
      const currentUserId = (requestingUser.id || requestingUser._id).toString();
      if (classTeacherId !== currentUserId) {
        throw new Error('Bạn chỉ có quyền cập nhật lớp học do chính mình phụ trách');
      }
    }

    return await Class.findByIdAndUpdate(id, data, { new: true });
  }

  async enrollStudent(classId, studentId) {
    const classObj = await Class.findById(classId);
    if (!classObj) throw new Error('Lớp học không tồn tại');

    if (!classObj.studentIds.includes(studentId)) {
      classObj.studentIds.push(studentId);
      await classObj.save();
    }
    return classObj;
  }

  async removeStudent(classId, studentId) {
    return await Class.findByIdAndUpdate(
      classId,
      { $pull: { studentIds: studentId } },
      { new: true }
    );
  }

  async createSession(classId, sessionData, requestingUser = null) {
    const classItem = await Class.findById(classId);
    if (!classItem) throw new Error('Không tìm thấy lớp học');

    if (requestingUser && requestingUser.role === 'teacher') {
      const classTeacherId = classItem.teacherId?.toString();
      const currentUserId = (requestingUser.id || requestingUser._id).toString();
      if (classTeacherId !== currentUserId) {
        throw new Error('Bạn chỉ có quyền thêm buổi học cho lớp do chính mình phụ trách');
      }
    }

    const count = await ClassSession.countDocuments({ classId });
    const session = new ClassSession({
      classId,
      sessionNumber: sessionData.sessionNumber || count + 1,
      ...sessionData
    });
    return await session.save();
  }

  async updateSession(sessionId, sessionData) {
    return await ClassSession.findByIdAndUpdate(sessionId, sessionData, { new: true });
  }
}

module.exports = new ClassService();
