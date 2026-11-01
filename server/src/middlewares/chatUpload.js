const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const uploadDir = path.resolve(__dirname, '../../private-uploads/chat');
fs.mkdirSync(uploadDir, { recursive: true });

const allowedTypes = new Map([
  ['.jpg', ['image/jpeg']],
  ['.jpeg', ['image/jpeg']],
  ['.png', ['image/png']],
  ['.gif', ['image/gif']],
  ['.webp', ['image/webp']],
  ['.pdf', ['application/pdf']],
  ['.doc', ['application/msword']],
  ['.docx', ['application/vnd.openxmlformats-officedocument.wordprocessingml.document']],
  ['.txt', ['text/plain']],
  ['.zip', ['application/zip', 'application/x-zip-compressed']]
]);

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => callback(null, uploadDir),
  filename: (_req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    callback(null, `${crypto.randomUUID()}${extension}`);
  }
});

module.exports = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    const mimeTypes = allowedTypes.get(extension);
    if (!mimeTypes || !mimeTypes.includes(file.mimetype)) {
      const error = new Error('Tệp không được hỗ trợ. Chỉ nhận ảnh JPG, PNG, GIF, WEBP hoặc PDF, DOC, DOCX, TXT, ZIP.');
      error.statusCode = 400;
      return callback(error);
    }
    return callback(null, true);
  }
});
