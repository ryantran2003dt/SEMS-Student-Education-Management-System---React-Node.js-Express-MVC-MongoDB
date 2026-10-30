import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { CheckSquare, Calendar, AlertCircle } from 'lucide-react';

export default function ParentAttendance() {
  const [data, setData] = useState(null);
  const [attendance, setAttendance] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadParentAttendance();
  }, []);

  const loadParentAttendance = async () => {
    try {
      const overviewRes = await api.get('/analytics/overview');
      setData(overviewRes.data);
      const childId = overviewRes.data?.selectedChild?._id;
      if (childId) {
        const attRes = await api.get(`/attendance/student/${childId}`);
        setAttendance(attRes.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Theo Dõi Điểm Danh Của Con</h1>
        <p className="text-sm text-slate-500 mt-1">
          Học viên: <strong className="text-slate-800">{data?.selectedChild?.fullName}</strong> • Tỷ lệ chuyên cần:{' '}
          <strong className="text-emerald-600">{attendance?.stats?.attendanceRate || 95}%</strong>
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
              <th className="py-3 px-4">Buổi Học</th>
              <th className="py-3 px-4">Lớp</th>
              <th className="py-3 px-4">Ngày Học</th>
              <th className="py-3 px-4 text-center">Tình Trạng</th>
              <th className="py-3 px-4">Ghi Chú</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {attendance?.records?.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-400">
                  Chưa có dữ liệu điểm danh nào.
                </td>
              </tr>
            ) : (
              attendance?.records?.map((rec) => (
                <tr key={rec._id} className="hover:bg-slate-50/50">
                  <td className="py-3 px-4 font-semibold text-slate-800">
                    {rec.sessionId?.title || 'Buổi học'}
                  </td>
                  <td className="py-3 px-4 text-slate-600">{rec.classId?.name}</td>
                  <td className="py-3 px-4 text-slate-500">
                    {new Date(rec.createdAt).toLocaleDateString('vi-VN')}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                      rec.status === 'present'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : rec.status === 'late'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}>
                      {rec.status === 'present' ? 'Có mặt' : rec.status === 'late' ? 'Đi trễ' : 'Vắng'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-500">{rec.notes || '--'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
