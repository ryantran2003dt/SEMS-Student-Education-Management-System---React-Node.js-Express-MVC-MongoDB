const express = require('express');
const multer = require('multer');
const messageController = require('../controllers/messageController');
const { authenticate } = require('../middlewares/auth');
const chatUpload = require('../middlewares/chatUpload');
const { sendError } = require('../utils/response');

const router = express.Router();
router.use(authenticate);

router.get('/contacts', messageController.getContacts);
router.get('/conversations', messageController.getConversations);
router.get('/files/:filename', messageController.ensureAttachmentAccess, messageController.getAttachment);
router.get('/:userId', messageController.ensureContact, messageController.getThread);
router.post(
  '/:userId',
  messageController.ensureContact,
  chatUpload.single('file'),
  messageController.sendMessage,
  (err, _req, res, next) => {
    if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
      return sendError(res, 'Kích thước tệp không được vượt quá 20 MB', 413);
    }
    if (err.statusCode) {
      return sendError(res, err.message, err.statusCode);
    }
    return next(err);
  }
);

module.exports = router;
