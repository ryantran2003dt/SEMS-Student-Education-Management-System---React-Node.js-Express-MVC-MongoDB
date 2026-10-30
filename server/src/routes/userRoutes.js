const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate, authorize } = require('../middlewares/auth');

router.use(authenticate);

router.get('/', authorize('admin'), userController.listUsers);
router.post('/', authorize('admin'), userController.createUser);
router.patch('/:id/status', authorize('admin'), userController.updateStatus);
router.patch('/:id/password', authorize('admin'), userController.resetPassword);
router.post('/link-parent', authorize('admin'), userController.linkParentStudent);
router.get('/parent/children', authorize('parent', 'admin'), userController.getLinkedChildren);

module.exports = router;
