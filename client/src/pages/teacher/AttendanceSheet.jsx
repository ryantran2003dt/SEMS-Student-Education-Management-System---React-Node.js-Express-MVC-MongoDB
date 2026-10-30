import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { CheckSquare, Calendar, UserCheck, AlertCircle, Save, CheckCircle2 } from 'lucide-react';

export default function AttendanceSheet() {
  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [classDetail, setClassDetail] = useState(null);
  const [selectedSessionId, setSelectedSessionId] = useState('');
  const [attendanceMap, setAttendanceMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      const res = await api.get('/classes');
      setClasses(res.data || []);
      if (res.data?.length > 0) {
        handleSelectClass(res.data[0]._id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectClass = async (classId) => {
    setSelectedClassId(classId);
    try {
      const res = await api.get(`/classes/${classId}`);
      setClassDetail(res.data);
      if (res.data.sessions?.length > 0) {
        handleSelectSession(res.data.sessions[0]._id, res.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelectSession = async (sessionId, currentClassDetail = classDetail) => {
    setSelectedSessionId(sessionId);
    setMsg('');
    try {
      const res = await api.get(`/attendance/sessions/${sessionId}`);
      const existing = res.data || [];
      const map = {};

      const students = currentClassDetail?.studentIds || [];
      students.forEach(st => {
        const found = existing.find(e => e.studentId?._id === st._id || e.studentId === st._id);
        map[st._id] = {
          status: found ? found.status : 'present',
          notes: found ? found.notes : ''
        };
      });
      setAttendanceMap(map);
    } catch (err) {
      console.error(err);
    }
  };

  const setStatusForStudent = (studentId, status) => {
    setAttendanceMap(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status
      }
    }));
  };

  const setNotesForStudent = (studentId, notes) => {
    setAttendanceMap(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        notes
      }
    }));
  };

  const setAllPresent = () => {
    const nextMap = { ...attendanceMap };
    Object.keys(nextMap).forEach(stId => {
      nextMap[stId].status = 'present';
    });
    setAttendanceMap(nextMap);
  };

  const handleSaveAttendance = async () => {
    if (!selectedSessionId) return;
    setSaving(true);
    setMsg('');
    try {
      const records = Object.entries(attendanceMap).map(([studentId, val]) => ({
        studentId,
        status: val.status,
        notes: val.notes
      }));
      await api.post(`/attendance/sessions/${selectedSessionId}`, { attendanceRecords: records });
      setMsg('Đã lưu điểm danh buổi học thành công!');
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Sổ Điểm Danh Buổi Học</h1>
          <p className="text-sm text-slate-500 mt-1">
            Ghi nhận chuyên cần: Có mặt, Đi trễ, Vắng có phép, Vắng không phép theo từng buổi.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={setAllPresent}
            className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold"
          >
            Đánh dấu tất cả Có mặt
          </button>
          <button
            onClick={handleSaveAttendance}
            disabled={saving}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 disabled:opacity-50"
          >
            <Save className="w-4 h-4" /> {saving ? 'Đang lưu...' : 'Lưu Điểm Danh'}
          </button>
        </div>
      </div>

      {msg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" /> {msg}
        </div>
      )}

      {/* Selector bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-wrap gap-4 items-center">
        <div>
          <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Chọn Lớp</label>
          <select
            value={selectedClassId}
            onChange={(e) => handleSelectClass(e.target.value)}
            className="text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 min-w-48"
          >
            {classes.map(c => <option key={c._id} value={c._id}>{c.name} ({c.code})</option>)}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Chọn Buổi Học</label>
          <select
            value={selectedSessionId}
            onChange={(e) => handleSelectSession(e.target.value)}
            className="text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 min-w-64"
          >
            {classDetail?.sessions?.map(s => (
              <option key={s._id} value={s._id}>
                Buổi {s.sessionNumber}: {s.title} ({new Date(s.date).toLocaleDateString('vi-VN')})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Attendance Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
              <th className="py-3.5 px-4">Học Viên</th>
              <th className="py-3.5 px-4">Email</th>
              <th className="py-3.5 px-4 text-center">Trạng Thái Điểm Danh</th>
              <th className="py-3.5 px-4">Ghi Chú Lý Do</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {classDetail?.studentIds?.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-8 text-center text-slate-400">
                  Lớp học chưa có học viên nào.
                </td>
              </tr>
            ) : (
              classDetail?.studentIds?.map((st) => {
                const currentStatus = attendanceMap[st._id]?.status || 'present';
                const currentNote = attendanceMap[st._id]?.notes || '';
                return (
                  <tr key={st._id} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4 font-semibold text-slate-800 flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center">
                        {st.fullName?.charAt(0)}
                      </div>
                      <span>{st.fullName}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">{st.email}</td>
                    <td className="py-3 px-4 text-center">
                      <div className="inline-flex rounded-xl p-1 bg-slate-100 border border-slate-200 gap-1 text-[11px]">
                        <button
                          type="button"
                          onClick={() => setStatusForStudent(st._id, 'present')}
                          className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                            currentStatus === 'present'
                              ? 'bg-emerald-600 text-white shadow-xs font-semibold'
                              : 'text-slate-600 hover:bg-white'
                          }`}
                        >
                          Có mặt
                        </button>
                        <button
                          type="button"
                          onClick={() => setStatusForStudent(st._id, 'late')}
                          className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                            currentStatus === 'late'
                              ? 'bg-amber-500 text-white shadow-xs font-semibold'
                              : 'text-slate-600 hover:bg-white'
                          }`}
                        >
                          Đi trễ
                        </button>
                        <button
                          type="button"
                          onClick={() => setStatusForStudent(st._id, 'excused')}
                          className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                            currentStatus === 'excused'
                              ? 'bg-blue-600 text-white shadow-xs font-semibold'
                              : 'text-slate-600 hover:bg-white'
                          }`}
                        >
                          Có phép
                        </button>
                        <button
                          type="button"
                          onClick={() => setStatusForStudent(st._id, 'unexcused')}
                          className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                            currentStatus === 'unexcused'
                              ? 'bg-rose-600 text-white shadow-xs font-semibold'
                              : 'text-slate-600 hover:bg-white'
                          }`}
                        >
                          Không phép
                        </button>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <input
                        type="text"
                        placeholder="VD: Kẹt xe, ốm, tham gia kỳ thi..."
                        value={currentNote}
                        onChange={(e) => setNotesForStudent(st._id, e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:ring-1 focus:ring-blue-500"
                      />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
