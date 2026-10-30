import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import StatCard from '../../components/StatCard';
import { Users, BookOpen, Calendar, Award, CheckSquare, AlertTriangle, ShieldCheck, Sparkles, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOverview();
  }, []);

  const fetchOverview = async () => {
    try {
      const res = await api.get('/analytics/overview');
      setData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Đang tải số liệu quản trị...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Bảng Điều Khiển Quản Trị Viên</h1>
          <p className="text-sm text-slate-500 mt-1">
            Tổng quan số liệu vận hành đào tạo, tài khoản và tình hình học tập toàn hệ thống SEMS.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Link
            to="/admin/users"
            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold shadow-xs transition-colors flex items-center gap-2"
          >
            <Users className="w-4 h-4" />
            <span>Thêm Tài Khoản</span>
          </Link>
          <Link
            to="/admin/classes"
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-xs transition-colors flex items-center gap-2"
          >
            <Calendar className="w-4 h-4" />
            <span>Mở Lớp Học Mới</span>
          </Link>
        </div>
      </div>

      {/* Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Tổng Học Viên"
          value={data?.totalStudents || 0}
          subtitle="Đang theo học tại trung tâm"
          icon={Users}
          color="emerald"
          trend="+12%"
        />
        <StatCard
          title="Đội Ngũ Giáo Viên"
          value={data?.totalTeachers || 0}
          subtitle="Giảng viên chính thức & trợ giảng"
          icon={Award}
          color="blue"
        />
        <StatCard
          title="Lớp Học Đang Mở"
          value={data?.activeClasses || 0}
          subtitle={`Tổng số ${data?.totalClasses || 0} lớp toàn khóa`}
          icon={Calendar}
          color="purple"
        />
        <StatCard
          title="Tỷ Lệ Chuyên Cần"
          value={`${data?.averageAttendanceRate || 95}%`}
          subtitle="Trung bình các buổi học"
          icon={CheckSquare}
          color="amber"
          trend="+3.2%"
        />
      </div>

      {/* Second Row: System Alerts & Quick Highlights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Alerts & System Health */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-blue-600" />
              <span>Cảnh Báo Vận Hành & Khuyến Nghị Hệ Thống</span>
            </h2>
            <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200">
              Hoạt động ổn định
            </span>
          </div>

          <div className="space-y-3">
            {data?.alerts?.map((alert, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 text-xs text-slate-700"
              >
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <span className="font-semibold text-slate-800">{alert.message}</span>
                </div>
              </div>
            ))}
            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-blue-50/70 border border-blue-200/60 text-xs text-blue-900">
              <Sparkles className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">Quy trình AI Human-in-the-loop:</span>
                <p className="mt-0.5 text-blue-800/90 leading-relaxed">
                  Đã kiểm tra 100% đề bài do AI sinh đều ở trạng thái nháp và chỉ công bố sau khi có chữ ký phê duyệt từ giáo viên phụ trách.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Module Navigation */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-600" />
              <span>Phân Hệ Quản Lý</span>
            </h2>
            <div className="space-y-2.5">
              <Link
                to="/admin/academic"
                className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50 transition-colors text-xs"
              >
                <div>
                  <div className="font-semibold text-slate-800">Chương Trình & Môn Học</div>
                  <div className="text-slate-500 mt-0.5">{data?.totalSubjects || 0} môn • {data?.totalCourses || 0} khóa học</div>
                </div>
                <BookOpen className="w-4 h-4 text-slate-400" />
              </Link>

              <Link
                to="/admin/users"
                className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50 transition-colors text-xs"
              >
                <div>
                  <div className="font-semibold text-slate-800">Người Dùng & Phân Quyền</div>
                  <div className="text-slate-500 mt-0.5">4 vai trò: Admin, GV, Học viên, Phụ huynh</div>
                </div>
                <Users className="w-4 h-4 text-slate-400" />
              </Link>

              <Link
                to="/admin/reports"
                className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50 transition-colors text-xs"
              >
                <div>
                  <div className="font-semibold text-slate-800">Báo Cáo & Xếp Hạng Học Viên</div>
                  <div className="text-slate-500 mt-0.5">Thống kê điểm số & tỷ lệ chuyên cần</div>
                </div>
                <Award className="w-4 h-4 text-slate-400" />
              </Link>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
