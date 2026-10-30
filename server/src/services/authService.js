const User = require('../models/User');
const { StudentProfile, TeacherProfile, ParentProfile, ParentStudentLink } = require('../models/Profiles');
const { generateToken } = require('../utils/jwt');

class AuthService {
  async login(email, password) {
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      throw new Error('Email hoặc mật khẩu không chính xác');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new Error('Email hoặc mật khẩu không chính xác');
    }

    if (user.status !== 'active') {
      throw new Error('Tài khoản của bạn đã bị khóa hoặc chưa kích hoạt');
    }

    const token = generateToken({
      id: user._id,
      role: user.role,
      email: user.email
    });

    const userProfile = await this.getUserProfileData(user);

    return {
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        phone: user.phone,
        avatar: user.avatar,
        status: user.status,
        profile: userProfile
      }
    };
  }

  async getUserProfileData(user) {
    if (user.role === 'student') {
      return await StudentProfile.findOne({ userId: user._id });
    }
    if (user.role === 'teacher') {
      return await TeacherProfile.findOne({ userId: user._id });
    }
    if (user.role === 'parent') {
      const parentProfile = await ParentProfile.findOne({ userId: user._id });
      const linkedStudents = await ParentStudentLink.find({ parentUserId: user._id, status: 'verified' })
        .populate('studentUserId', 'fullName email phone');
      return {
        ...parentProfile?.toObject(),
        children: linkedStudents.map(link => ({
          student: link.studentUserId,
          relationship: link.relationship
        }))
      };
    }
    return null;
  }

  async getCurrentUser(userId) {
    const user = await User.findById(userId);
    if (!user) throw new Error('Người dùng không tồn tại');
    const profile = await this.getUserProfileData(user);
    return {
      id: user._id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      phone: user.phone,
      avatar: user.avatar,
      status: user.status,
      profile
    };
  }

  async changePassword(userId, oldPassword, newPassword) {
    if (!newPassword || newPassword.length < 6) {
      throw new Error('Mật khẩu mới phải có tối thiểu 6 ký tự');
    }
    const user = await User.findById(userId).select('+password');
    if (!user) throw new Error('Người dùng không tồn tại');

    const isMatch = await user.comparePassword(oldPassword);
    if (!isMatch) {
      throw new Error('Mật khẩu hiện tại không chính xác');
    }

    user.password = newPassword;
    await user.save();
    return { success: true, message: 'Đổi mật khẩu thành công' };
  }

  async updateProfile(userId, { fullName, phone }) {
    const user = await User.findById(userId);
    if (!user) throw new Error('Người dùng không tồn tại');

    if (fullName) user.fullName = fullName.trim();
    if (phone !== undefined) user.phone = phone.trim();
    await user.save();

    return await this.getCurrentUser(userId);
  }
}

module.exports = new AuthService();
