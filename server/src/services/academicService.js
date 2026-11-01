const { Subject, Course, Curriculum, Lesson } = require('../models/Academic');
const { Class, ClassSession } = require('../models/Class');
const Assignment = require('../models/Assignment');

function createCodePrefix(prefix, name) {
  const slug = String(name || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 36)
    .replace(/-$/g, '') || 'MOI';

  return `${prefix}-${slug}`;
}

async function createWithGeneratedCode(Model, data, prefix) {
  const codePrefix = createCodePrefix(prefix, data.name);
  const codePattern = new RegExp(`^${codePrefix}-\\d+$`);

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const existingCodes = await Model.find({ code: codePattern }).distinct('code');
    const nextNumber = existingCodes.reduce((max, code) => {
      const suffix = Number(code.slice(codePrefix.length + 1));
      return Number.isInteger(suffix) ? Math.max(max, suffix) : max;
    }, 0) + 1;
    const code = `${codePrefix}-${String(nextNumber).padStart(3, '0')}`;

    try {
      return await Model.create({ ...data, code });
    } catch (err) {
      if (err.code !== 11000 || attempt === 4) {
        throw err;
      }
    }
  }
}

class AcademicService {
  // Subjects
  async listSubjects() {
    return await Subject.find().sort({ createdAt: -1 });
  }

  async createSubject(data) {
    return createWithGeneratedCode(Subject, data, 'MON');
  }

  async updateSubject(id, data) {
    return await Subject.findByIdAndUpdate(id, data, { new: true });
  }

  // Courses
  async listCourses(subjectId = null) {
    const query = {};
    if (subjectId) query.subjectId = subjectId;
    return await Course.find(query).populate('subjectId', 'name code').sort({ createdAt: -1 });
  }

  async getCourseById(id) {
    return await Course.findById(id).populate('subjectId', 'name code');
  }

  async createCourse(data) {
    const saved = await createWithGeneratedCode(Course, data, 'KHOA');

    // Automatically create version 1.0 curriculum
    await Curriculum.create({
      courseId: saved._id,
      version: '1.0',
      learningOutcomes: [
        'Nắm vững kiến thức nền tảng và phương pháp thực hành',
        'Có khả năng giải quyết các bài toán thực tế',
        'Hoàn thành đồ án cuối khóa đạt chuẩn đầu ra'
      ],
      topics: ['Khởi động và Nhập môn', 'Kiến thức cốt lõi', 'Ứng dụng nâng cao', 'Đồ án thực chiến']
    });

    return saved;
  }

  async updateCourse(id, data) {
    return await Course.findByIdAndUpdate(id, data, { new: true, runValidators: true })
      .populate('subjectId', 'name code');
  }

  async deleteCourse(id) {
    const course = await Course.findById(id);
    if (!course) return null;

    const linkedClass = await Class.exists({ courseId: id });
    if (linkedClass) {
      const error = new Error('Không thể xóa khóa học đang được sử dụng bởi lớp học. Hãy lưu trữ hoặc chỉnh sửa khóa học thay thế.');
      error.statusCode = 409;
      throw error;
    }

    const lessons = await Lesson.find({ courseId: id }).select('_id');
    const lessonIds = lessons.map((lesson) => lesson._id);
    if (lessonIds.length > 0) {
      const linkedAssignment = await Assignment.exists({ lessonId: { $in: lessonIds } });
      if (linkedAssignment) {
        const error = new Error('Không thể xóa khóa học đang có bài tập tham chiếu đến bài học của khóa học.');
        error.statusCode = 409;
        throw error;
      }
      const linkedSession = await ClassSession.exists({ lessonId: { $in: lessonIds } });
      if (linkedSession) {
        const error = new Error('Không thể xóa khóa học đang có buổi học tham chiếu đến bài học của khóa học.');
        error.statusCode = 409;
        throw error;
      }
    }

    await Lesson.deleteMany({ courseId: id });
    await Curriculum.deleteMany({ courseId: id });
    await Course.findByIdAndDelete(id);
    return course;
  }

  // Curriculums
  async getCurriculumsByCourse(courseId) {
    return await Curriculum.find({ courseId }).sort({ createdAt: -1 });
  }

  async createCurriculumVersion(courseId, data) {
    // Set old versions isCurrent to false
    await Curriculum.updateMany({ courseId }, { isCurrent: false });
    return await Curriculum.create({
      courseId,
      version: data.version || '1.1',
      learningOutcomes: data.learningOutcomes || [],
      topics: data.topics || [],
      changeLog: data.changeLog || 'Cập nhật phiên bản mới',
      isCurrent: true
    });
  }

  // Lessons
  async listLessonsByCourse(courseId) {
    return await Lesson.find({ courseId }).sort({ sessionNumber: 1 });
  }

  async createLesson(data) {
    const lesson = new Lesson(data);
    return await lesson.save();
  }

  async updateLesson(id, data) {
    return await Lesson.findByIdAndUpdate(id, data, { new: true });
  }

  async deleteLesson(id) {
    return await Lesson.findByIdAndDelete(id);
  }
}

module.exports = new AcademicService();
