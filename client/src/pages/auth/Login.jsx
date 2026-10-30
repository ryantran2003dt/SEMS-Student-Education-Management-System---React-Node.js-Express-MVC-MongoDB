import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../stores/authStore';
import { GraduationCap, Lock, Mail, ArrowRight, Eye, EyeOff, ShieldCheck, UserCheck, BookOpen } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState('');

  const { login } = useAuthStore();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e?.preventDefault();
    if (!email.trim() || !password) {
      setErrMsg('Vui lòng nhập đầy đủ email và mật khẩu');
      return;
    }

    setLoading(true);
    setErrMsg('');
    try {
      const user = await login(email.trim(), password);
      navigate(`/${user.role}`);
    } catch (err) {
      setErrMsg(err.message || 'Email hoặc mật khẩu không chính xác');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100">
        
        {/* Left Side: Brand & Feature Highlights */}
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-8 sm:p-10 text-white flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center mb-6 border border-white/20 shadow-inner">
              <GraduationCap className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              SEMS
            </h1>
            <p className="text-blue-100 text-sm mt-1">
              Hệ Thống Quản Lý Giáo Dục & Đào Tạo
            </p>
            <p className="text-blue-200/90 text-xs mt-4 leading-relaxed">
              Giải pháp toàn diện quản lý học viên, lớp học, điểm danh và bài tập tích hợp AI hỗ trợ giảng viên kiểm định chất lượng đào tạo.
            </p>
          </div>

          <div className="space-y-3.5 my-8">
            <div className="flex items-center gap-3 text-xs text-blue-50 bg-white/10 p-3 rounded-xl backdrop-blur-xs border border-white/10">
              <ShieldCheck className="w-5 h-5 text-emerald-300 shrink-0" />
              <span>Phân quyền 4 vai trò độc lập & bảo mật dữ liệu ở mức đối tượng</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-blue-50 bg-white/10 p-3 rounded-xl backdrop-blur-xs border border-white/10">
              <BookOpen className="w-5 h-5 text-amber-300 shrink-0" />
              <span>Theo dõi chuyên cần, tiến độ học tập và cấp chứng nhận tự động</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-blue-50 bg-white/10 p-3 rounded-xl backdrop-blur-xs border border-white/10">
              <UserCheck className="w-5 h-5 text-cyan-300 shrink-0" />
              <span>AI Assignment Studio: Sinh nháp bài tập và giáo viên duyệt</span>
            </div>
          </div>

          <div className="text-[11px] text-blue-200/60 font-medium">
            © 2026 SEMS Educational System • Production Ready
          </div>
        </div>

        {/* Right Side: Clean Login Form */}
        <div className="p-8 sm:p-10 flex flex-col justify-center bg-white">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-800">Đăng Nhập</h2>
            <p className="text-sm text-slate-500 mt-1">
              Nhập email và mật khẩu được cấp để truy cập hệ thống:
            </p>
          </div>

          {errMsg && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              {errMsg}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Email tài khoản *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Mật khẩu *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-11 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-4 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 transition-all disabled:opacity-70 cursor-pointer"
            >
              <span>{loading ? 'Đang xác thực thông tin...' : 'Đăng Nhập'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <p className="text-center text-[11px] text-slate-400 mt-8">
            Nếu bạn quên mật khẩu hoặc chưa có tài khoản, vui lòng liên hệ quản trị viên trung tâm.
          </p>
        </div>

      </div>
    </div>
  );
}
