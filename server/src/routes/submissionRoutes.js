const express = require('express');
const router = express.Router();
const submissionController = require('../controllers/submissionController');
const { authenticate, authorize } = require('../middlewares/auth');
const upload = require('../middlewares/upload');

router.use(authenticate);

// Student submits homework (supports optional file upload)
router.post('/assignments/:assignmentId', authorize('student'), upload.single('file'), submissionController.submitAssignment);

// Teacher views submissions for an assignment
router.get('/assignments/:assignmentId', authorize('admin', 'teacher'), submissionController.getSubmissions);

// Teacher grades a submission
router.post('/:id/grade', authorize('admin', 'teacher'), submissionController.gradeSubmission);

// Teacher requests resubmission
router.post('/:id/resubmit', authorize('admin', 'teacher'), submissionController.requestResubmit);

module.exports = router;
