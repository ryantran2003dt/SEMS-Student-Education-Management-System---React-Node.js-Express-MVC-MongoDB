const express = require('express');
const router = express.Router();
const assignmentController = require('../controllers/assignmentController');
const { authenticate, authorize } = require('../middlewares/auth');

router.use(authenticate);

router.get('/', assignmentController.listAssignments);
router.post('/', authorize('admin', 'teacher'), assignmentController.createAssignment);
router.get('/:id', assignmentController.getAssignmentById);
router.put('/:id', authorize('admin', 'teacher'), assignmentController.updateAssignment);
router.delete('/:id', authorize('admin', 'teacher'), assignmentController.deleteAssignment);

// Workflow endpoints
router.post('/:id/validate', authorize('admin', 'teacher'), assignmentController.validateAssignment);
router.post('/:id/approve', authorize('admin', 'teacher'), assignmentController.approveAssignment);
router.post('/:id/publish', authorize('admin', 'teacher'), assignmentController.publishAssignment);

module.exports = router;
