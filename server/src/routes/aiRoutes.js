const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const { authenticate, authorize } = require('../middlewares/auth');

router.use(authenticate);

// Get AI status and engine info
router.get('/status', aiController.getAIStatus);

// Configure runtime API key
router.post('/config-key', authorize('admin', 'teacher'), aiController.updateApiKey);

// Generate assignment draft via AI (restricted to teacher & admin)
router.post('/assignments/generate', authorize('admin', 'teacher'), aiController.generateAssignment);

// Validate assignment via AI
router.post('/assignments/:id/validate', authorize('admin', 'teacher'), aiController.validateAssignment);

// AI Assistant Auto-Grading & Feedback for a submission
router.post('/grade-submission/:submissionId', authorize('admin', 'teacher'), aiController.gradeSubmission);

module.exports = router;
