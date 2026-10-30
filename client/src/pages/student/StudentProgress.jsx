import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { BarChart3, CheckSquare, Award, Clock, ArrowRight } from 'lucide-react';

export default function StudentProgress() {
  const [attendanceData, setAttendanceData] = useState(null);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [attRes, progRes] = await Promise.all([
        api.get('/attendance/student'),
        api.get('/analytics/overview')
      ]);
      setAttendanceData(attRes.data);
      setProgress(progRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Tiến Độ Học Tập & Năng Lực</h1>
        <p className="text-sm text-slate-500 mt-1">
          Theo dõi tổng hợp chuyên cần, kết quả bài tập và nhận diện các kỹ năng cần phát triển.
        </p>
      </div>

      {/* Progress Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
          <span className="text-xs font-semibold text-slate-400">Tỷ lệ tham gia lớp học</span>
          <div className="text-3xl font-extrabold text-emerald-600 mt-1">
            {attendanceData?.stats?.attendanceRate || 95}%
          </div>
          <div className="mt-3 text-xs text-slate-500 space-y-1">
            <div>Có mặt: {attendanceData?.stats?.present || 0} buổi</div>
            <div>Đi trễ: {attendanceData?.stats?.late || 0} buổi</div>
            <div>Vắng có phép: {attendanceData?.stats?.excused || 0} buổi</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
          <span className="text-xs font-semibold text-slate-400">Điểm số trung bình</span>
          <div className="text-3xl font-extrabold text-blue-600 mt-1">
            {progress?.averageScore || 85} / 100
          </div>
          <p className="text-xs text-slate-500 mt-3">
            Xếp loại: <strong className="text-blue-700">Giỏi</strong> (Đủ điều kiện cấp chứng nhận tốt nghiệp)
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
          <span className="text-xs font-semibold text-slate-400">Tỷ lệ hoàn thành bài tập</span>
          <div className="text-3xl font-extrabold text-purple-600 mt-1">
            100%
          </div>
          <p className="text-xs text-slate-500 mt-3">
            Đã hoàn thành xuất sắc tất cả bài tập đã giao
          </p>
        </div>
      </div>

      {/* Attendance History Log */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
        <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
          <CheckSquare className="w-4 h-4 text-emerald-600" />
          <span>Nhật Ký Điểm Danh Chi Tiết</span>
        </h3>

        <div className="space-y-2">
          {attendanceData?.records?.length === 0 ? (
            <p className="text-xs text-slate-400 py-4 text-center">Chưa có bản ghi điểm danh nào.</p>
          ) : (
            attendanceData?.records?.map((rec) => (
              <div
                key={rec._id}
                className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/40 flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-bold text-slate-800">
                    {rec.sessionId?.title || 'Buổi học'}
                  </span>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Lớp: {rec.classId?.name} • Ngày: {new Date(rec.createdAt).toLocaleDateString('vi-VN')}
                  </div>
                  {rec.notes && <div className="text-[11px] text-slate-600 italic mt-0.5">Lý do: {rec.notes}</div>}
                </div>

                <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                  rec.status === 'present'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : rec.status === 'late'
                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                }`}>
                  {rec.status === 'present' ? 'Có mặt' : rec.status === 'late' ? 'Đi trễ' : 'Vắng'}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
