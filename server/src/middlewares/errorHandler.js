const { sendError } = require('../utils/response');

function errorHandler(err, req, res, next) {
  console.error('[Error Handler]', err);

  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(val => val.message);
    return sendError(res, 'Lỗi xác thực dữ liệu', 400, messages);
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return sendError(res, `Giá trị '${field}' đã tồn tại trong hệ thống`, 409);
  }

  if (err.name === 'JsonWebTokenError') {
    return sendError(res, 'Token không hợp lệ', 401);
  }

  if (err.name === 'TokenExpiredError') {
    return sendError(res, 'Phiên đăng nhập đã hết hạn', 401);
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Đã có lỗi xảy ra trên máy chủ';
  return sendError(res, message, statusCode);
}

module.exports = errorHandler;
