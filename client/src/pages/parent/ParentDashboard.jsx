import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import StatCard from '../../components/StatCard';
import { Users, CheckSquare, Award, Clock, HeartHandshake, CheckCircle2, MessageSquare, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ParentDashboard() {
  const [data, setData] = useState(null);
  const [selectedChildId, setSelectedChildId] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchParentOverview();
  }, [selectedChildId]);

  const fetchParentOverview = async () => {
    setLoading(true);
    try {
      const res = await api.get('/analytics/overview', {
        params: { childId: selectedChildId || undefined }
      });
      setData(res.data);
      if (res.data?.selectedChild?._id && !selectedChildId) {
        setSelectedChildId(res.data.selectedChild._id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Đang tải dữ liệu học tập của con...</div>;

  const child = data?.selectedChild;
  const progress = data?.progress;

  return (
    <div className="space-y-6">
      {/* Header & Child switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <span>Sổ Liên Lạc Điện Tử</span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
              Phụ huynh
            </span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Nắm bắt kịp thời tình hình học tập, chuyên cần và phối hợp đồng hành cùng con tại nhà.
          </p>
        </div>

        {/* Children dropdown */}
        {data?.children?.length > 1 && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400">Chọn con:</span>
            <select
              value={selectedChildId}
              onChange={(e) => setSelectedChildId(e.target.value)}
              className="text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 bg-white"
            >
              {data.children.map(c => (
                <option key={c._id} value={c._id}>{c.fullName}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Child Card Header */}
      {child && (
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-3xl p-6 text-white shadow-lg shadow-amber-500/15 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center font-black text-2xl text-white border border-white/30">
              {child.fullName?.charAt(0)}
            </div>
            <div>
              <span className="text-xs uppercase tracking-wider text-amber-100 font-bold">Hồ sơ học viên</span>
              <h2 className="text-2xl font-black mt-0.5">{child.fullName}</h2>
              <p className="text-xs text-amber-100">
                Lớp: {progress?.enrolledClasses?.[0]?.name || 'Chưa xếp lớp'} • GVCN: {progress?.enrolledClasses?.[0]?.teacherId?.fullName}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/parent/attendance"
              className="px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white font-semibold text-xs backdrop-blur-xs transition-colors"
            >
              Chi tiết điểm danh
            </Link>
            <Link
              to="/parent/grades"
              className="px-4 py-2 rounded-xl bg-white text-amber-800 font-bold text-xs shadow-md transition-colors"
            >
              Xem bảng điểm
            </Link>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Tỷ Lệ Chuyên Cần"
          value={`${progress?.attendanceRate || 95}%`}
          subtitle="Chuyên cần các buổi học"
          icon={CheckSquare}
          color="emerald"
        />
        <StatCard
          title="Điểm Số Trung Bình"
          value={`${progress?.averageScore || 0} / 100`}
          subtitle="Kết quả bài tập thực hành"
          icon={Award}
          color="blue"
        />
        <StatCard
          title="Bài Chưa Hoàn Thành"
          value={progress?.pendingAssignmentsCount || 0}
          subtitle="Nhiệm vụ cần nhắc nhở con"
          icon={Clock}
          color="amber"
        />
      </div>

      {/* Grid: Teacher Notes & Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Home Collaboration Guidance */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <HeartHandshake className="w-4 h-4 text-amber-600" />
            <span>Khuyến Nghị Phối Hợp Tại Nhà</span>
          </h3>

          <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/60 text-xs text-amber-900 leading-relaxed space-y-2">
            <p className="font-semibold">Nhận xét tổng quát từ Giảng viên:</p>
            <p>
              Em <strong>{child?.fullName}</strong> có tư duy logic tốt và nghiêm túc trong giờ học. Phụ huynh nên tiếp tục khích lệ em dành 30 phút mỗi tối để thực hành viết mã và ôn lại các câu hỏi tự luận.
            </p>
          </div>

          <div className="space-y-2 text-xs text-slate-600">
            <span className="font-bold text-slate-700 block">Kế hoạch hỗ trợ con:</span>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>Nhắc nhở con kiểm tra hạn nộp bài tập trên SEMS trước mỗi buổi học.</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>Động viên con xem lại nhận xét chi tiết của thầy/cô ở các bài nộp đã chấm.</span>
            </div>
          </div>
        </div>

        {/* Recent Submissions */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Award className="w-4 h-4 text-blue-600" />
              <span>Kết Quả Bài Nộp Gần Nhất</span>
            </h3>
            <Link to="/parent/grades" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
              Xem tất cả <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {progress?.recentSubmissions?.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">Chưa có bài tập nào được nộp.</p>
            ) : (
              progress?.recentSubmissions?.map((sub) => (
                <div
                  key={sub._id}
                  className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/40 flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-bold text-slate-800">{sub.assignmentId?.title}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Nộp ngày: {new Date(sub.submittedAt).toLocaleDateString('vi-VN')}
                    </div>
                    {sub.feedback && (
                      <p className="text-[11px] text-blue-800 mt-1 italic">
                        "{sub.feedback}"
                      </p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-base font-black text-blue-600">
                      {sub.score !== null ? `${sub.score}đ` : 'Chờ chấm'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
