const { verifyToken } = require('../utils/jwt');
const { sendError } = require('../utils/response');
const User = require('../models/User');

async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendError(res, 'Chưa được ủy quyền, vui lòng đăng nhập', 401);
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return sendError(res, 'Người dùng không tồn tại hoặc tài khoản đã bị xóa', 401);
    }

    if (user.status !== 'active') {
      return sendError(res, 'Tài khoản của bạn đã bị khóa hoặc chưa kích hoạt', 403);
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return sendError(res, 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại', 401);
    }
    return sendError(res, 'Token không hợp lệ', 401);
  }
}

function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, 'Chưa đăng nhập', 401);
    }
    if (!roles.includes(req.user.role)) {
      return sendError(res, `Bạn không có quyền thực hiện hành động này. Yêu cầu quyền: [${roles.join(', ')}]`, 403);
    }
    next();
  };
}

module.exports = {
  authenticate,
  authorize
};
