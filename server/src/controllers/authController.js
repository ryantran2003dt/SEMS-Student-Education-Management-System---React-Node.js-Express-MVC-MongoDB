const authService = require('../services/authService');
const { sendSuccess, sendError } = require('../utils/response');

class AuthController {
  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return sendError(res, 'Vui lòng cung cấp đầy đủ email và mật khẩu', 400);
      }
      const result = await authService.login(email, password);
      return sendSuccess(res, result, 'Đăng nhập thành công');
    } catch (err) {
      next(err);
    }
  }

  async getMe(req, res, next) {
    try {
      const user = await authService.getCurrentUser(req.user._id);
      return sendSuccess(res, user, 'Thông tin người dùng');
    } catch (err) {
      next(err);
    }
  }

  async changePassword(req, res, next) {
    try {
      const { oldPassword, newPassword } = req.body;
      if (!oldPassword || !newPassword) {
        return sendError(res, 'Vui lòng cung cấp mật khẩu hiện tại và mật khẩu mới', 400);
      }
      const result = await authService.changePassword(req.user._id, oldPassword, newPassword);
      return sendSuccess(res, result, 'Đổi mật khẩu thành công');
    } catch (err) {
      next(err);
    }
  }

  async updateProfile(req, res, next) {
    try {
      const { fullName, phone } = req.body;
      const updated = await authService.updateProfile(req.user._id, { fullName, phone });
      return sendSuccess(res, updated, 'Cập nhật thông tin thành công');
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new AuthController();
