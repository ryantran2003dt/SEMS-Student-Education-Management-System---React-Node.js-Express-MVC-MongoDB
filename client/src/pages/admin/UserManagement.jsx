import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import RoleBadge from '../../components/RoleBadge';
import Modal from '../../components/Modal';
import { Users, UserPlus, Search, ShieldCheck, Lock, Unlock, Link2, CheckCircle, RefreshCw, KeyRound } from 'lucide-react';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('');
  const [search, setSearch] = useState('');

  // Modal states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isLinkOpen, setIsLinkOpen] = useState(false);
  const [emailEdited, setEmailEdited] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '123456@Abc',
    role: 'student',
    phone: '',
    specialization: '',
    studentCode: '',
    relationship: 'Mẹ'
  });

  const [linkData, setLinkData] = useState({
    parentUserId: '',
    studentUserId: '',
    relationship: 'Mẹ'
  });

  const [resetModalUser, setResetModalUser] = useState(null);
  const [resetPasswordInput, setResetPasswordInput] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  const [notification, setNotification] = useState('');

  const resetCreateForm = () => {
    setEmailEdited(false);
    setFormData({
      fullName: '',
      email: '',
      password: '123456@Abc',
      role: 'student',
      phone: '',
      specialization: '',
      studentCode: '',
      relationship: 'Mẹ'
    });
  };

  const generateEmail = (fullName, role) => {
    const words = fullName
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D')
      .toLowerCase()
      .match(/[a-z0-9]+/g) || [];
    if (!words.length) return '';

    const name = `${words.slice(0, -1).map(word => word[0]).join('')}${words[words.length - 1]}`;
    const roleSuffix = { student: 'hv', teacher: 'gv', parent: 'ph', admin: '' }[role];
    return roleSuffix !== undefined ? `${name}${roleSuffix}@sems.edu.vn` : '';
  };

  useEffect(() => {
    fetchUsers();
  }, [roleFilter]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/users', {
        params: { role: roleFilter || undefined, search: search || undefined }
      });
      setUsers(res.data?.users || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/users', {
        fullName: formData.fullName,
        email: formData.email,
        password: formData.password || '123456@Abc',
        emailGenerated: !emailEdited,
        role: formData.role,
        phone: formData.phone,
        profileData: {
          specialization: formData.specialization,
          studentCode: formData.studentCode
        }
      });
      setIsCreateOpen(false);
      resetCreateForm();
      setNotification(`Tạo tài khoản thành công! Email: ${res.data.email} | Mật khẩu khởi tạo: ${formData.password || '123456@Abc'}`);
      fetchUsers();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleToggleStatus = async (user) => {
    const nextStatus = user.status === 'active' ? 'locked' : 'active';
    try {
      await api.patch(`/users/${user._id}/status`, { status: nextStatus });
      setUsers(users.map(u => u._id === user._id ? { ...u, status: nextStatus } : u));
    } catch (err) {
      alert(err.message);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!resetModalUser || !resetPasswordInput) return;
    setResetLoading(true);
    try {
      await api.patch(`/users/${resetModalUser._id}/password`, { password: resetPasswordInput });
      setNotification(`Đã đặt lại mật khẩu cho tài khoản ${resetModalUser.email} thành công!`);
      setResetModalUser(null);
      setResetPasswordInput('');
    } catch (err) {
      alert(err.message);
    } finally {
      setResetLoading(false);
    }
  };

  const handleLinkParent = async (e) => {
    e.preventDefault();
    try {
      await api.post('/users/link-parent', linkData);
      setIsLinkOpen(false);
      setNotification('Đã liên kết phụ huynh và học viên thành công!');
    } catch (err) {
      alert(err.message);
    }
  };

  const parents = users.filter(u => u.role === 'parent');
  const students = users.filter(u => u.role === 'student');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Quản Lý Người Dùng & Phân Quyền</h1>
          <p className="text-sm text-slate-500 mt-1">
            Quản trị tài khoản, phân quyền 4 vai trò (Admin, GV, Học viên, Phụ huynh) và liên kết gia đình.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsLinkOpen(true)}
            className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold transition-colors flex items-center gap-2"
          >
            <Link2 className="w-4 h-4 text-blue-600" />
            <span>Liên Kết Phụ Huynh</span>
          </button>
          <button
            onClick={() => {
              resetCreateForm();
              setIsCreateOpen(true);
            }}
            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold shadow-xs transition-colors flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            <span>Tạo Tài Khoản Mới</span>
          </button>
        </div>
      </div>

      {notification && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
          <span>{notification}</span>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-bold text-slate-500 uppercase">Lọc vai trò:</span>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="text-xs font-medium px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="">Tất cả vai trò ({users.length})</option>
            <option value="admin">Quản trị viên (Admin)</option>
            <option value="teacher">Giáo viên (Teacher)</option>
            <option value="student">Học viên (Student)</option>
            <option value="parent">Phụ huynh (Parent)</option>
          </select>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Tìm theo tên, email, sđt..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchUsers()}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <button
            onClick={fetchUsers}
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600"
            title="Làm mới"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold">
                <th className="py-3.5 px-4">Họ và Tên</th>
                <th className="py-3.5 px-4">Email</th>
                <th className="py-3.5 px-4">Số điện thoại</th>
                <th className="py-3.5 px-4">Vai trò</th>
                <th className="py-3.5 px-4">Trạng thái</th>
                <th className="py-3.5 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">Đang tải danh sách...</td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">Không tìm thấy người dùng phù hợp.</td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-800 flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600 text-xs">
                        {u.fullName?.charAt(0)}
                      </div>
                      <span>{u.fullName}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">{u.email}</td>
                    <td className="py-3 px-4 text-slate-600">{u.phone || 'Chưa cập nhật'}</td>
                    <td className="py-3 px-4">
                      <RoleBadge role={u.role} />
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium ${
                        u.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                      }`}>
                        {u.status === 'active' ? 'Đang hoạt động' : 'Đã khóa'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5 justify-end">
                        <button
                          onClick={() => {
                            setResetModalUser(u);
                            setResetPasswordInput('123456@Abc');
                          }}
                          className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          title="Đặt lại mật khẩu"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(u)}
                          className={`p-1.5 rounded-lg border text-xs font-medium transition-colors ${
                            u.status === 'active'
                              ? 'border-rose-200 text-rose-600 hover:bg-rose-50'
                              : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
                          }`}
                          title={u.status === 'active' ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
                        >
                          {u.status === 'active' ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Create User */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => {
          setIsCreateOpen(false);
          resetCreateForm();
        }}
        title="Thêm Người Dùng Mới"
      >
        <form onSubmit={handleCreateUser} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Họ và tên *</label>
            <input
              type="text"
              required
              value={formData.fullName}
              onChange={(e) => {
                const fullName = e.target.value;
                setFormData(current => ({
                  ...current,
                  fullName,
                  email: emailEdited ? current.email : generateEmail(fullName, current.role)
                }));
              }}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-purple-500"
              placeholder="VD: Nguyễn Văn An"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Email đăng nhập *</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => {
                  setEmailEdited(true);
                  setFormData(current => ({ ...current, email: e.target.value }));
                }}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-purple-500"
                placeholder="Email tự sinh theo họ tên và vai trò"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Mật khẩu khởi tạo</label>
              <input
                type="text"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-purple-500"
                placeholder="Mặc định: 123456@Abc"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Vai trò hệ thống *</label>
              <select
                value={formData.role}
                onChange={(e) => {
                  const role = e.target.value;
                  setFormData(current => ({
                    ...current,
                    role,
                    email: emailEdited ? current.email : generateEmail(current.fullName, role)
                  }));
                }}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-purple-500"
              >
                <option value="student">Học viên (Student)</option>
                <option value="teacher">Giáo viên (Teacher)</option>
                <option value="parent">Phụ huynh (Parent)</option>
                <option value="admin">Quản trị viên (Admin)</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Số điện thoại</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-purple-500"
                placeholder="09xxxxxxxx"
              />
            </div>
          </div>

          {formData.role === 'teacher' && (
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Chuyên môn giảng dạy</label>
              <input
                type="text"
                value={formData.specialization}
                onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-purple-500"
                placeholder="VD: Lập trình Web Fullstack, Tin học Văn phòng"
              />
            </div>
          )}

          {formData.role === 'student' && (
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Mã học viên (tùy chọn)</label>
              <input
                type="text"
                value={formData.studentCode}
                onChange={(e) => setFormData({ ...formData, studentCode: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-purple-500"
                placeholder="Để trống để tự động sinh mã"
              />
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                setIsCreateOpen(false);
                resetCreateForm();
              }}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-purple-600 text-white font-semibold hover:bg-purple-700"
            >
              Tạo Tài Khoản
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Link Parent to Student */}
      <Modal isOpen={isLinkOpen} onClose={() => setIsLinkOpen(false)} title="Liên Kết Phụ Huynh & Học Viên">
        <form onSubmit={handleLinkParent} className="space-y-4 text-xs">
          <p className="text-slate-500 text-xs">
            Xác minh quan hệ bảo mật giữa phụ huynh và học viên để phụ huynh theo dõi tiến độ đúng quyền.
          </p>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Chọn Phụ Huynh *</label>
            <select
              required
              value={linkData.parentUserId}
              onChange={(e) => setLinkData({ ...linkData, parentUserId: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-purple-500"
            >
              <option value="">-- Chọn phụ huynh --</option>
              {parents.map(p => (
                <option key={p._id} value={p._id}>{p.fullName} ({p.email})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Chọn Học Viên Được Liên Kết *</label>
            <select
              required
              value={linkData.studentUserId}
              onChange={(e) => setLinkData({ ...linkData, studentUserId: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-purple-500"
            >
              <option value="">-- Chọn học viên --</option>
              {students.map(s => (
                <option key={s._id} value={s._id}>{s.fullName} ({s.email})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Mối Quan Hệ</label>
            <select
              value={linkData.relationship}
              onChange={(e) => setLinkData({ ...linkData, relationship: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-purple-500"
            >
              <option value="Bố">Bố</option>
              <option value="Mẹ">Mẹ</option>
              <option value="Người giám hộ">Người giám hộ</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsLinkOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700"
            >
              Xác Nhận Liên Kết
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Reset User Password */}
      <Modal
        isOpen={!!resetModalUser}
        onClose={() => setResetModalUser(null)}
        title={`Đặt Lại Mật Khẩu - ${resetModalUser?.fullName}`}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleResetPassword} className="space-y-4 text-xs">
          <p className="text-slate-500 text-xs">
            Bạn đang thực hiện cấp lại mật khẩu cho tài khoản <strong>{resetModalUser?.email}</strong>.
          </p>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Mật khẩu mới *</label>
            <input
              type="text"
              required
              value={resetPasswordInput}
              onChange={(e) => setResetPasswordInput(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-purple-500 font-mono"
              placeholder="Tối thiểu 6 ký tự"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setResetModalUser(null)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={resetLoading}
              className="px-4 py-2 rounded-xl bg-purple-600 text-white font-semibold hover:bg-purple-700 disabled:opacity-50"
            >
              {resetLoading ? 'Đang cập nhật...' : 'Xác Nhận Đặt Lại'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
