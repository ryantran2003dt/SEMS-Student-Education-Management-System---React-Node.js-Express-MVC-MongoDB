const { Subject, Course, Curriculum, Lesson } = require('../models/Academic');

class AcademicService {
  // Subjects
  async listSubjects() {
    return await Subject.find().sort({ createdAt: -1 });
  }

  async createSubject(data) {
    const subject = new Subject(data);
    return await subject.save();
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
    const course = new Course(data);
    const saved = await course.save();

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
    return await Course.findByIdAndUpdate(id, data, { new: true });
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
