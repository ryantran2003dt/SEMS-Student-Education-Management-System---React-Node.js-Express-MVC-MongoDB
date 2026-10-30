import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import StatCard from '../../components/StatCard';
import { BookOpen, Calendar, CheckSquare, Sparkles, ClipboardList, Clock, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function TeacherDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTeacherOverview();
  }, []);

  const fetchTeacherOverview = async () => {
    try {
      const res = await api.get('/analytics/overview');
      setData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Đang tải dữ liệu giảng dạy...</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Bảng Điều Khiển Giáo Viên</h1>
          <p className="text-sm text-slate-500 mt-1">
            Theo dõi lớp học phụ trách, điểm danh buổi học và bài tập cần chấm điểm.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/teacher/assignments"
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-semibold shadow-xs flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" /> AI Assignment Studio
          </Link>
          <Link
            to="/teacher/attendance"
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs flex items-center gap-2"
          >
            <CheckSquare className="w-4 h-4" /> Điểm Danh Buổi Học
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Lớp Phụ Trách"
          value={data?.classesCount || 0}
          subtitle="Các lớp đang trong kỳ học"
          icon={BookOpen}
          color="blue"
        />
        <StatCard
          title="Tổng Học Viên"
          value={data?.totalStudents || 0}
          subtitle="Học viên theo học trực tiếp"
          icon={Calendar}
          color="emerald"
        />
        <StatCard
          title="Bài Tập Cần Chấm"
          value={data?.pendingGradingCount || 0}
          subtitle="Bài nộp đang chờ chấm điểm"
          icon={ClipboardList}
          color="amber"
        />
        <StatCard
          title="Bài Đã Công Bố"
          value={data?.assignmentsCount || 0}
          subtitle="Bài tập đang mở cho học viên"
          icon={Sparkles}
          color="purple"
        />
      </div>

      {/* Sessions and Pending Grading */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Upcoming Sessions */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
          <h2 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-600" />
            <span>Lịch Dạy Sắp Tới & Điểm Danh</span>
          </h2>
          <div className="space-y-3">
            {data?.upcomingSessions?.length === 0 ? (
              <p className="text-xs text-slate-400 py-4">Không có buổi học nào sắp tới.</p>
            ) : (
              data?.upcomingSessions?.map((sess) => (
                <div
                  key={sess._id}
                  className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-bold text-slate-800">{sess.title}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {sess.classId?.name} • {new Date(sess.date).toLocaleDateString('vi-VN')} ({sess.startTime} - {sess.endTime})
                    </div>
                  </div>
                  <Link
                    to="/teacher/attendance"
                    className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 font-semibold text-[11px] transition-colors"
                  >
                    Điểm danh
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Submissions needing grading */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-amber-600" />
              <span>Bài Nộp Chờ Chấm Điểm</span>
            </h2>
            <Link to="/teacher/grading" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
              Xem tất cả <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="space-y-3">
            {data?.pendingSubmissions?.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">
                Tuyệt vời! Hiện không còn bài nộp nào tồn đọng cần chấm.
              </p>
            ) : (
              data?.pendingSubmissions?.map((sub) => (
                <div
                  key={sub._id}
                  className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-bold text-slate-800">{sub.studentId?.fullName}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">{sub.assignmentId?.title}</div>
                  </div>
                  <Link
                    to="/teacher/grading"
                    className="px-3 py-1.5 rounded-lg bg-amber-50 text-amber-800 hover:bg-amber-100 font-semibold text-[11px] transition-colors"
                  >
                    Chấm bài
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
