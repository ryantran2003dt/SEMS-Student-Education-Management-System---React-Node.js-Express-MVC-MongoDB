const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const { authenticate, authorize } = require('../middlewares/auth');

router.use(authenticate);

// Record attendance for a session
router.post('/sessions/:sessionId', authorize('admin', 'teacher'), attendanceController.recordAttendance);

// Get attendance for a session
router.get('/sessions/:sessionId', authorize('admin', 'teacher'), attendanceController.getSessionAttendance);

// Get student attendance stats
router.get('/student/:studentId?', attendanceController.getStudentAttendance);

// Get class attendance statistics
router.get('/classes/:classId/stats', attendanceController.getClassAttendanceStats);

module.exports = router;
