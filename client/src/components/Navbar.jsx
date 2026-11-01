import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../stores/authStore';
import RoleBadge from './RoleBadge';
import Modal from './Modal';
import api from '../services/api';
import {
  LogOut,
  KeyRound,
  CheckCircle,
  AlertCircle,
  Bell,
  User,
  Check,
  FileText,
  Award,
  CheckSquare,
  Sparkles,
  ExternalLink
} from 'lucide-react';

export default function Navbar() {
  const { user, logout, checkAuth } = useAuthStore();
  const navigate = useNavigate();

  // Password Modal
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdMsg, setPwdMsg] = useState({ text: '', type: '' });

  // Profile Modal
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileName, setProfileName] = useState(user?.fullName || '');
  const [profilePhone, setProfilePhone] = useState(user?.phone || '');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMsg, setProfileMsg] = useState({ text: '', type: '' });

  // Notifications
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const notifRef = useRef(null);

  useEffect(() => {
    if (user) {
      setProfileName(user.fullName || '');
      setProfilePhone(user.phone || '');
      fetchNotifications();
    }
  }, [user]);

  // Click outside to close notification dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setIsNotifOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data?.notifications || []);
      setUnreadCount(res.data?.unreadCount || 0);
    } catch (err) {
      console.warn('Failed to load notifications:', err.message);
    }
  };

  const handleMarkAsRead = async (notif) => {
    if (!notif.isRead) {
      try {
        await api.patch(`/notifications/${notif._id}/read`);
        setNotifications(prev => prev.map(n => n._id === notif._id ? { ...n, isRead: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
      } catch (err) {
        console.warn(err);
      }
    }
    if (notif.link) {
      setIsNotifOpen(false);
      navigate(notif.link);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.warn(err);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwdMsg({ text: '', type: '' });

    if (newPassword.length < 6) {
      setPwdMsg({ text: 'Mật khẩu mới phải có ít nhất 6 ký tự', type: 'error' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwdMsg({ text: 'Xác nhận mật khẩu mới không khớp', type: 'error' });
      return;
    }

    setPwdLoading(true);
    try {
      await api.post('/auth/change-password', { oldPassword, newPassword });
      setPwdMsg({ text: 'Đổi mật khẩu thành công!', type: 'success' });
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        setIsPasswordModalOpen(false);
        setPwdMsg({ text: '', type: '' });
      }, 1500);
    } catch (err) {
      setPwdMsg({ text: err.message || 'Đổi mật khẩu không thành công', type: 'error' });
    } finally {
      setPwdLoading(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileMsg({ text: '', type: '' });
    try {
      await api.patch('/auth/profile', {
        fullName: profileName,
        phone: profilePhone
      });
      await checkAuth();
      setProfileMsg({ text: 'Cập nhật hồ sơ thành công!', type: 'success' });
      setTimeout(() => {
        setIsProfileModalOpen(false);
        setProfileMsg({ text: '', type: '' });
      }, 1500);
    } catch (err) {
      setProfileMsg({ text: err.message || 'Cập nhật không thành công', type: 'error' });
    } finally {
      setProfileLoading(false);
    }
  };

  const renderNotifIcon = (type) => {
    switch (type) {
      case 'assignment':
        return <FileText className="w-4 h-4 text-blue-600" />;
      case 'grade':
        return <Award className="w-4 h-4 text-emerald-600" />;
      case 'attendance':
        return <CheckSquare className="w-4 h-4 text-amber-600" />;
      case 'certificate':
        return <Award className="w-4 h-4 text-purple-600" />;
      default:
        return <Sparkles className="w-4 h-4 text-indigo-600" />;
    }
  };

  return (
    <>
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex min-w-0 items-center justify-between gap-2">
          {/* Brand */}
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <img
              src="/logo-tin-hoc-de-hieu.png"
              alt="Tin Học Dễ Hiểu"
              className="w-10 h-10 sm:w-11 sm:h-11 shrink-0 rounded-full object-contain border border-slate-100"
            />
            <div className="min-w-0">
              <span className="block truncate font-extrabold text-base sm:text-xl tracking-tight text-slate-800">
                Tin Học <span className="text-blue-600 font-semibold text-sm">Dễ Hiểu</span>
              </span>
              <p className="text-[11px] text-slate-400 font-medium hidden md:block">
                Hệ thống Quản lý Giáo dục & Đào tạo
              </p>
            </div>
          </div>

          {/* User profile & actions */}
          <div className="flex shrink-0 items-center gap-0.5 sm:gap-2">
            {/* Notification Bell */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => {
                  setIsNotifOpen(!isNotifOpen);
                  if (!isNotifOpen) fetchNotifications();
                }}
                title="Thông báo"
                className="relative p-2 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center animate-pulse">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown Panel */}
              {isNotifOpen && (
                <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-1.5rem)] sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-800">Thông Báo</span>
                      {unreadCount > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-semibold">
                          {unreadCount} mới
                        </span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
                      >
                        Đọc tất cả
                      </button>
                    )}
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center text-xs text-slate-400">
                        Chưa có thông báo nào.
                      </div>
                    ) : (
                      notifications.map((notif) => (
                        <div
                          key={notif._id}
                          onClick={() => handleMarkAsRead(notif)}
                          className={`p-3.5 flex items-start gap-3 cursor-pointer transition-colors ${
                            notif.isRead ? 'bg-white hover:bg-slate-50' : 'bg-blue-50/40 hover:bg-blue-50/70'
                          }`}
                        >
                          <div className="p-2 rounded-xl bg-slate-100 shrink-0 mt-0.5">
                            {renderNotifIcon(notif.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <h4 className={`text-xs truncate ${notif.isRead ? 'text-slate-700 font-medium' : 'text-slate-900 font-bold'}`}>
                                {notif.title}
                              </h4>
                              {!notif.isRead && (
                                <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5 leading-relaxed">
                              {notif.message}
                            </p>
                            <span className="text-[10px] text-slate-400 mt-1 block font-mono">
                              {new Date(notif.createdAt).toLocaleString('vi-VN')}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Info clickable to Profile */}
            <div
              onClick={() => setIsProfileModalOpen(true)}
              className="flex items-center gap-1.5 sm:gap-2.5 cursor-pointer p-1 sm:p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
              title="Xem và chỉnh sửa hồ sơ cá nhân"
            >
              <div className="text-right hidden sm:block">
                <div className="text-xs font-bold text-slate-800">{user?.fullName || 'Người dùng'}</div>
                <div className="flex items-center justify-end gap-1.5 mt-0.5">
                  <RoleBadge role={user?.role} />
                </div>
              </div>

              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-slate-200 to-slate-300 border-2 border-white shadow-xs flex items-center justify-center font-bold text-slate-700 text-sm">
                {user?.fullName?.charAt(0) || 'U'}
              </div>
            </div>

            <button
              onClick={() => setIsPasswordModalOpen(true)}
              title="Đổi mật khẩu tài khoản"
              className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors cursor-pointer"
            >
              <KeyRound className="w-4 h-4" />
            </button>

            <button
              onClick={handleLogout}
              title="Đăng xuất"
              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Modal: View & Update Profile */}
      <Modal
        isOpen={isProfileModalOpen}
        onClose={() => {
          setIsProfileModalOpen(false);
          setProfileMsg({ text: '', type: '' });
        }}
        title="Hồ Sơ Tài Khoản"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleUpdateProfile} className="space-y-4 text-xs">
          {profileMsg.text && (
            <div className={`p-3 rounded-xl flex items-center gap-2 font-medium ${
              profileMsg.type === 'success'
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border border-rose-200 text-rose-700'
            }`}>
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>{profileMsg.text}</span>
            </div>
          )}

          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white font-black text-lg flex items-center justify-center shrink-0">
              {user?.fullName?.charAt(0)}
            </div>
            <div>
              <div className="font-bold text-slate-800 text-sm">{user?.fullName}</div>
              <div className="text-slate-500 text-[11px] font-mono">{user?.email}</div>
              <div className="mt-1"><RoleBadge role={user?.role} /></div>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Họ và tên *</label>
            <input
              type="text"
              required
              value={profileName}
              onChange={(e) => setProfileName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Số điện thoại</label>
            <input
              type="text"
              value={profilePhone}
              onChange={(e) => setProfilePhone(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="09xxxxxxxx"
            />
          </div>

          {user?.profile && (
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 text-[11px] text-slate-600">
              <span className="font-bold text-slate-700 block mb-1">Thông tin bổ sung:</span>
              {user.profile.studentCode && <div>Mã học viên: <strong className="font-mono text-slate-800">{user.profile.studentCode}</strong></div>}
              {user.profile.teacherCode && <div>Mã giáo viên: <strong className="font-mono text-slate-800">{user.profile.teacherCode}</strong></div>}
              {user.profile.specialization && <div>Chuyên môn: <strong className="text-slate-800">{user.profile.specialization}</strong></div>}
              {user.profile.school && <div>Trường/Đơn vị: <strong className="text-slate-800">{user.profile.school}</strong></div>}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsProfileModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold"
            >
              Đóng
            </button>
            <button
              type="submit"
              disabled={profileLoading}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-xs disabled:opacity-50"
            >
              {profileLoading ? 'Đang lưu...' : 'Lưu Thay Đổi'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Change Password */}
      <Modal
        isOpen={isPasswordModalOpen}
        onClose={() => {
          setIsPasswordModalOpen(false);
          setPwdMsg({ text: '', type: '' });
        }}
        title="Đổi Mật Khẩu Cá Nhân"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleChangePassword} className="space-y-4 text-xs">
          {pwdMsg.text && (
            <div className={`p-3 rounded-xl flex items-center gap-2 font-medium ${
              pwdMsg.type === 'success'
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border border-rose-200 text-rose-700'
            }`}>
              {pwdMsg.type === 'success' ? (
                <CheckCircle className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{pwdMsg.text}</span>
            </div>
          )}

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Mật khẩu hiện tại *</label>
            <input
              type="password"
              required
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="Nhập mật khẩu đang dùng"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Mật khẩu mới *</label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="Tối thiểu 6 ký tự"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Xác nhận mật khẩu mới *</label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="Nhập lại mật khẩu mới"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsPasswordModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={pwdLoading}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-xs disabled:opacity-50"
            >
              {pwdLoading ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
