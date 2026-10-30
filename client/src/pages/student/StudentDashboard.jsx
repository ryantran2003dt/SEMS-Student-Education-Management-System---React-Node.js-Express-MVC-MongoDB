import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import StatCard from '../../components/StatCard';
import { BookOpen, CheckSquare, Award, Clock, ArrowRight, CheckCircle2, AlertCircle, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function StudentDashboard() {
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStudentProgress();
  }, []);

  const fetchStudentProgress = async () => {
    try {
      const res = await api.get('/analytics/overview');
      setProgress(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Đang tải dữ liệu học tập...</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Góc Học Tập Của Bạn</h1>
          <p className="text-sm text-slate-500 mt-1">
            Theo dõi nhiệm vụ học tập, bài tập cần nộp, chuyên cần và nhận xét từ giảng viên.
          </p>
        </div>
        <Link
          to="/student/assignments"
          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs flex items-center gap-2"
        >
          <FileText className="w-4 h-4" /> Làm Bài Tập Ngay
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Tỷ Lệ Chuyên Cần"
          value={`${progress?.attendanceRate || 100}%`}
          subtitle="Tỷ lệ tham gia các buổi học"
          icon={CheckSquare}
          color="emerald"
        />
        <StatCard
          title="Điểm Trung Bình"
          value={`${progress?.averageScore || 0} / 100`}
          subtitle="Đánh giá qua các bài tập"
          icon={Award}
          color="blue"
        />
        <StatCard
          title="Nhiệm Vụ Cần Làm"
          value={progress?.pendingAssignmentsCount || 0}
          subtitle="Bài tập chưa hoàn thành"
          icon={Clock}
          color="amber"
        />
        <StatCard
          title="Lớp Đang Học"
          value={progress?.totalEnrolled || 0}
          subtitle="Khóa học đang diễn ra"
          icon={BookOpen}
          color="purple"
        />
      </div>

      {/* Grid: Pending homework & Strengths */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Pending Assignments */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" />
              <span>Bài Tập Sắp Đến Hạn</span>
            </h2>
            <Link to="/student/assignments" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
              Xem tất cả <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {progress?.pendingAssignments?.length === 0 ? (
              <div className="text-center py-6 text-slate-400 text-xs">
                Tuyệt vời! Bạn đã hoàn thành tất cả các bài tập hiện có.
              </div>
            ) : (
              progress?.pendingAssignments?.map((a) => (
                <div
                  key={a._id}
                  className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-bold text-slate-800">{a.title}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Hạn nộp: {new Date(a.dueDate).toLocaleDateString('vi-VN')} • Độ khó: {a.difficulty}
                    </div>
                  </div>
                  <Link
                    to={`/student/assignments/${a._id}`}
                    className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-[11px] transition-colors"
                  >
                    Làm bài
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Strengths & Recommendations */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Đánh Giá Năng Lực & Khuyến Nghị</span>
          </h2>

          <div className="space-y-2">
            <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block">
              Điểm Mạnh Nổi Bật:
            </span>
            {progress?.strengths?.map((str, idx) => (
              <div key={idx} className="flex items-start gap-2 text-xs text-slate-700 bg-emerald-50/60 p-2 rounded-lg border border-emerald-100">
                <span className="text-emerald-600 font-bold">•</span>
                <span>{str}</span>
              </div>
            ))}
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-100">
            <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider block">
              Nội Dung Cần Ôn Tập Thêm:
            </span>
            {progress?.improvementAreas?.map((area, idx) => (
              <div key={idx} className="flex items-start gap-2 text-xs text-slate-700 bg-amber-50/60 p-2 rounded-lg border border-amber-100">
                <span className="text-amber-600 font-bold">•</span>
                <span>{area}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
