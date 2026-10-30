import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Award, BarChart3, Trophy, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';

export default function AnalyticsReport() {
  const [rankings, setRankings] = useState([]);
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [selectedClass]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [rankRes, classRes, certRes] = await Promise.all([
        api.get('/analytics/rankings', { params: { classId: selectedClass || undefined } }),
        api.get('/classes'),
        api.get('/certificates')
      ]);
      setRankings(rankRes.data || []);
      setClasses(classRes.data || []);
      setCertificates(certRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleIssueCertificate = async (studentId, classId) => {
    try {
      await api.post('/certificates/issue', { studentId, classId });
      alert('Đã cấp chứng nhận tốt nghiệp thành công!');
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Báo Cáo & Xếp Hạng Năng Lực Học Viên</h1>
          <p className="text-sm text-slate-500 mt-1">
            Tổng hợp kết quả học tập, xếp hạng có kiểm soát quyền riêng tư và cấp chứng nhận hoàn thành khóa học.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="text-xs font-medium px-3 py-2 rounded-xl border border-slate-200 bg-white"
          >
            <option value="">Tất cả các lớp</option>
            {classes.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
          <button
            onClick={loadData}
            className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Leaderboard */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-500" />
              <span>Bảng Xếp Hạng Kết Quả Học Tập (Nội Bộ)</span>
            </h2>
            <span className="text-[11px] text-slate-400 font-medium">Cập nhật theo điểm trung bình</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <th className="py-2.5 px-3">Hạng</th>
                  <th className="py-2.5 px-3">Học Viên</th>
                  <th className="py-2.5 px-3">Bài đã nộp</th>
                  <th className="py-2.5 px-3 text-center">Điểm TB</th>
                  <th className="py-2.5 px-3 text-right">Chứng nhận</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rankings.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      Chưa có đủ dữ liệu bài tập đã chấm điểm.
                    </td>
                  </tr>
                ) : (
                  rankings.map((item, idx) => {
                    const isCertIssued = certificates.some(c => c.studentId?._id === item.student?._id);
                    return (
                      <tr key={item.student?._id || idx} className="hover:bg-slate-50/50">
                        <td className="py-3 px-3 font-bold font-mono">
                          {idx === 0 ? '🥇 #1' : idx === 1 ? '🥈 #2' : idx === 2 ? '🥉 #3' : `#${idx + 1}`}
                        </td>
                        <td className="py-3 px-3 font-semibold text-slate-800 flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold">
                            {item.student?.fullName?.charAt(0)}
                          </div>
                          <span>{item.student?.fullName}</span>
                        </td>
                        <td className="py-3 px-3 text-slate-600">{item.completedCount} bài</td>
                        <td className="py-3 px-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full font-bold text-xs ${
                            item.averageScore >= 85
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-blue-50 text-blue-700'
                          }`}>
                            {item.averageScore} / 100
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          {isCertIssued ? (
                            <span className="text-[11px] text-emerald-600 font-semibold flex items-center justify-end gap-1">
                              <CheckCircle className="w-3.5 h-3.5" /> Đã cấp
                            </span>
                          ) : item.averageScore >= 60 ? (
                            <button
                              onClick={() => handleIssueCertificate(item.student?._id, classes[0]?._id)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-[11px] transition-colors"
                            >
                              Cấp chứng nhận
                            </button>
                          ) : (
                            <span className="text-slate-400 text-[11px]">Chưa đạt</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Col: Issued Certificates */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Award className="w-4 h-4 text-purple-600" />
              <span>Chứng Nhận Đã Cấp ({certificates.length})</span>
            </h2>
          </div>

          <div className="space-y-3">
            {certificates.map((cert) => (
              <div
                key={cert._id}
                className="p-3.5 rounded-xl border border-purple-100 bg-purple-50/30 text-xs space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-purple-700 text-[11px]">
                    {cert.certificateCode}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {new Date(cert.issueDate).toLocaleDateString('vi-VN')}
                  </span>
                </div>
                <div className="font-bold text-slate-800">{cert.studentId?.fullName}</div>
                <div className="text-[11px] text-slate-500">Khóa: {cert.courseId?.name}</div>
                <div className="pt-1.5 border-t border-purple-100 flex items-center justify-between text-[11px] text-slate-600">
                  <span>Điểm TB: <strong className="text-purple-700">{cert.averageScore}</strong></span>
                  <span>Chuyên cần: <strong className="text-purple-700">{cert.attendanceRate}%</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
