const academicService = require('../services/academicService');
const { sendSuccess, sendError } = require('../utils/response');

class AcademicController {
  // Subjects
  async listSubjects(req, res, next) {
    try {
      const subjects = await academicService.listSubjects();
      return sendSuccess(res, subjects);
    } catch (err) {
      next(err);
    }
  }

  async createSubject(req, res, next) {
    try {
      const subject = await academicService.createSubject(req.body);
      return sendSuccess(res, subject, 'Tạo môn học thành công', 201);
    } catch (err) {
      next(err);
    }
  }

  // Courses
  async listCourses(req, res, next) {
    try {
      const { subjectId } = req.query;
      const courses = await academicService.listCourses(subjectId);
      return sendSuccess(res, courses);
    } catch (err) {
      next(err);
    }
  }

  async createCourse(req, res, next) {
    try {
      const course = await academicService.createCourse(req.body);
      return sendSuccess(res, course, 'Tạo khóa học thành công', 201);
    } catch (err) {
      next(err);
    }
  }

  async getCourse(req, res, next) {
    try {
      const course = await academicService.getCourseById(req.params.id);
      if (!course) {
        return sendError(res, 'Không tìm thấy khóa học', 404);
      }
      return sendSuccess(res, course);
    } catch (err) {
      next(err);
    }
  }

  async updateCourse(req, res, next) {
    try {
      const { subjectId, name, targetAudience, objective, durationHours, expectedSessions } = req.body;
      const course = await academicService.updateCourse(req.params.id, {
        subjectId,
        name,
        targetAudience,
        objective,
        durationHours,
        expectedSessions
      });
      if (!course) {
        return sendError(res, 'Không tìm thấy khóa học', 404);
      }
      return sendSuccess(res, course, 'Cập nhật khóa học thành công');
    } catch (err) {
      next(err);
    }
  }

  async deleteCourse(req, res, next) {
    try {
      const course = await academicService.deleteCourse(req.params.id);
      if (!course) {
        return sendError(res, 'Không tìm thấy khóa học', 404);
      }
      return sendSuccess(res, course, 'Xóa khóa học thành công');
    } catch (err) {
      next(err);
    }
  }

  // Curriculums
  async getCurriculums(req, res, next) {
    try {
      const curriculums = await academicService.getCurriculumsByCourse(req.params.courseId);
      return sendSuccess(res, curriculums);
    } catch (err) {
      next(err);
    }
  }

  async createCurriculumVersion(req, res, next) {
    try {
      const curriculum = await academicService.createCurriculumVersion(req.params.courseId, req.body);
      return sendSuccess(res, curriculum, 'Tạo phiên bản chương trình học thành công', 201);
    } catch (err) {
      next(err);
    }
  }

  // Lessons
  async listLessons(req, res, next) {
    try {
      const lessons = await academicService.listLessonsByCourse(req.params.courseId);
      return sendSuccess(res, lessons);
    } catch (err) {
      next(err);
    }
  }

  async createLesson(req, res, next) {
    try {
      const lesson = await academicService.createLesson({
        ...req.body,
        courseId: req.params.courseId || req.body.courseId
      });
      return sendSuccess(res, lesson, 'Tạo bài học thành công', 201);
    } catch (err) {
      next(err);
    }
  }

  async updateLesson(req, res, next) {
    try {
      const { sessionNumber, title, topic, objectives } = req.body;
      const lesson = await academicService.updateLesson(
        req.params.courseId,
        req.params.lessonId,
        { sessionNumber, title, topic, objectives }
      );
      if (!lesson) {
        return sendError(res, 'Không tìm thấy buổi học trong khóa học này', 404);
      }
      return sendSuccess(res, lesson, 'Cập nhật buổi học thành công');
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new AcademicController();
