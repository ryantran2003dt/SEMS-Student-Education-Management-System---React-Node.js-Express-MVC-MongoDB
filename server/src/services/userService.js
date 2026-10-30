const User = require('../models/User');
const { StudentProfile, TeacherProfile, ParentProfile, ParentStudentLink } = require('../models/Profiles');

class UserService {
  async listUsers({ role, search, status, page = 1, limit = 50 }) {
    const query = {};
    if (role) query.role = role;
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return {
      users,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async createUser({ fullName, email, password, role, phone, profileData }) {
    const existing = await User.findOne({ email });
    if (existing) {
      throw new Error(`Email ${email} đã được sử dụng.`);
    }

    const user = new User({
      fullName,
      email,
      password: password || '123456@Abc',
      role,
      phone
    });
    await user.save();

    // Create role-specific profile
    if (role === 'student') {
      const count = await StudentProfile.countDocuments();
      const studentCode = profileData?.studentCode || `HV${String(count + 1).padStart(4, '0')}`;
      await StudentProfile.create({
        userId: user._id,
        studentCode,
        dateOfBirth: profileData?.dateOfBirth,
        gender: profileData?.gender || 'Nam',
        school: profileData?.school || '',
        address: profileData?.address || ''
      });
    } else if (role === 'teacher') {
      const count = await TeacherProfile.countDocuments();
      const teacherCode = profileData?.teacherCode || `GV${String(count + 1).padStart(3, '0')}`;
      await TeacherProfile.create({
        userId: user._id,
        teacherCode,
        specialization: profileData?.specialization || 'Công Nghệ Thông Tin',
        degree: profileData?.degree || 'Cử nhân Sư phạm Tin'
      });
    } else if (role === 'parent') {
      await ParentProfile.create({
        userId: user._id,
        occupation: profileData?.occupation || '',
        address: profileData?.address || ''
      });
    }

    return user;
  }

  async updateUserStatus(userId, status) {
    const user = await User.findByIdAndUpdate(userId, { status }, { new: true });
    if (!user) throw new Error('Không tìm thấy người dùng');
    return user;
  }

  async resetUserPassword(userId, newPassword) {
    if (!newPassword || newPassword.length < 6) {
      throw new Error('Mật khẩu mới phải có tối thiểu 6 ký tự');
    }
    const user = await User.findById(userId).select('+password');
    if (!user) throw new Error('Không tìm thấy người dùng');
    user.password = newPassword;
    await user.save();
    return { success: true, message: `Đã đặt lại mật khẩu cho tài khoản ${user.email}` };
  }

  async linkParentStudent(parentUserId, studentUserId, relationship = 'Bố') {
    const parent = await User.findById(parentUserId);
    const student = await User.findById(studentUserId);
    if (!parent || parent.role !== 'parent') throw new Error('Tài khoản phụ huynh không hợp lệ');
    if (!student || student.role !== 'student') throw new Error('Tài khoản học viên không hợp lệ');

    const link = await ParentStudentLink.findOneAndUpdate(
      { parentUserId, studentUserId },
      { relationship, status: 'verified' },
      { upsert: true, new: true }
    );
    return link;
  }

  async getLinkedChildren(parentUserId) {
    const links = await ParentStudentLink.find({ parentUserId, status: 'verified' })
      .populate('studentUserId', 'fullName email phone avatar');
    return links.map(link => ({
      ...link.studentUserId.toObject(),
      relationship: link.relationship,
      linkId: link._id
    }));
  }
}

module.exports = new UserService();
