const express = require('express');
const router = express.Router();
const academicController = require('../controllers/academicController');
const { authenticate, authorize } = require('../middlewares/auth');

router.use(authenticate);

// Subjects
router.get('/subjects', academicController.listSubjects);
router.post('/subjects', authorize('admin'), academicController.createSubject);

// Courses
router.get('/courses', academicController.listCourses);
router.post('/courses', authorize('admin'), academicController.createCourse);
router.get('/courses/:id', academicController.getCourse);
router.put('/courses/:id', authorize('admin'), academicController.updateCourse);
router.delete('/courses/:id', authorize('admin'), academicController.deleteCourse);

// Curriculums
router.get('/courses/:courseId/curriculums', academicController.getCurriculums);
router.post('/courses/:courseId/curriculums', authorize('admin'), academicController.createCurriculumVersion);

// Lessons
router.get('/courses/:courseId/lessons', academicController.listLessons);
router.post('/courses/:courseId/lessons', authorize('admin', 'teacher'), academicController.createLesson);

module.exports = router;
