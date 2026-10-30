const userService = require('../services/userService');
const { sendSuccess, sendError } = require('../utils/response');

class UserController {
  async listUsers(req, res, next) {
    try {
      const { role, search, status, page, limit } = req.query;
      const result = await userService.listUsers({ role, search, status, page, limit });
      return sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  async createUser(req, res, next) {
    try {
      const user = await userService.createUser(req.body);
      return sendSuccess(res, user, 'Tạo tài khoản thành công', 201);
    } catch (err) {
      next(err);
    }
  }

  async updateStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const user = await userService.updateUserStatus(id, status);
      return sendSuccess(res, user, 'Cập nhật trạng thái thành công');
    } catch (err) {
      next(err);
    }
  }

  async resetPassword(req, res, next) {
    try {
      const { id } = req.params;
      const { password } = req.body;
      if (!password || password.length < 6) {
        return sendError(res, 'Mật khẩu mới phải có tối thiểu 6 ký tự', 400);
      }
      const result = await userService.resetUserPassword(id, password);
      return sendSuccess(res, result, 'Đặt lại mật khẩu người dùng thành công');
    } catch (err) {
      next(err);
    }
  }

  async linkParentStudent(req, res, next) {
    try {
      const { parentUserId, studentUserId, relationship } = req.body;
      const link = await userService.linkParentStudent(parentUserId, studentUserId, relationship);
      return sendSuccess(res, link, 'Liên kết phụ huynh - học viên thành công');
    } catch (err) {
      next(err);
    }
  }

  async getLinkedChildren(req, res, next) {
    try {
      // Security: If parent, force parentId to req.user._id so they cannot query another parent's children
      const parentId = req.user.role === 'parent' ? req.user._id : (req.query.parentId || req.user._id);
      const children = await userService.getLinkedChildren(parentId);
      return sendSuccess(res, children);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new UserController();
