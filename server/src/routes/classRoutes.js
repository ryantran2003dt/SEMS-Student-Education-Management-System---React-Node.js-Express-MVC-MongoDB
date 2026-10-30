const express = require('express');
const router = express.Router();
const classController = require('../controllers/classController');
const { authenticate, authorize } = require('../middlewares/auth');

router.use(authenticate);

router.get('/', classController.listClasses);
router.post('/', authorize('admin'), classController.createClass);
router.get('/:id', classController.getClassById);
router.put('/:id', authorize('admin', 'teacher'), classController.updateClass);
router.post('/:id/enroll', authorize('admin'), classController.enrollStudent);
router.post('/:id/remove-student', authorize('admin'), classController.removeStudent);
router.post('/:id/sessions', authorize('admin', 'teacher'), classController.createSession);

module.exports = router;
