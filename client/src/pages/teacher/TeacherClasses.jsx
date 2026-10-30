import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { BookOpen, Users, Calendar, Clock, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function TeacherClasses() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyClasses();
  }, []);

  const fetchMyClasses = async () => {
    try {
      const res = await api.get('/classes');
      setClasses(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Lớp Học Phụ Trách</h1>
        <p className="text-sm text-slate-500 mt-1">
          Danh sách các lớp học được phân công giảng dạy và theo dõi chuyên cần.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {classes.map((cls) => (
          <div
            key={cls._id}
            className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                  {cls.code}
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {cls.status === 'ongoing' ? 'Đang giảng dạy' : cls.status}
                </span>
              </div>
              <h3 className="text-lg font-bold text-slate-800 mt-2">{cls.name}</h3>
              <p className="text-xs text-slate-500 mt-1">{cls.courseId?.name}</p>

              <div className="mt-4 pt-4 border-t border-slate-100 space-y-2 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>{cls.scheduleDescription}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>{cls.room}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-3.5 h-3.5 text-slate-400" />
                  <span>Sĩ số: {cls.studentIds?.length || 0} học viên</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-2">
              <Link
                to="/teacher/attendance"
                className="flex-1 py-2 text-center rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold transition-colors"
              >
                Điểm danh lớp
              </Link>
              <Link
                to="/teacher/assignments"
                className="flex-1 py-2 text-center rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold transition-colors"
              >
                Giao bài tập AI
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
