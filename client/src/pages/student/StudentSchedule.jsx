import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Calendar, Clock, MapPin, UserCheck, CheckCircle2 } from 'lucide-react';

export default function StudentSchedule() {
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
        <h1 className="text-2xl font-bold text-slate-800">Lịch Học & Lớp Của Tôi</h1>
        <p className="text-sm text-slate-500 mt-1">
          Theo dõi thời khóa biểu, phòng học và tiến trình các buổi học trong khóa.
        </p>
      </div>

      <div className="space-y-6">
        {classes.map((cls) => (
          <div key={cls._id} className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-4">
              <div>
                <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded uppercase">
                  {cls.code}
                </span>
                <h2 className="text-lg font-bold text-slate-800 mt-1">{cls.name}</h2>
                <p className="text-xs text-slate-500">{cls.courseId?.name}</p>
              </div>
              <div className="flex items-center gap-4 text-xs text-slate-600">
                <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-slate-400" /> {cls.scheduleDescription}</span>
                <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-slate-400" /> {cls.room}</span>
              </div>
            </div>

            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Kế Hoạch Các Buổi Học
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {[
                { num: 1, title: 'Tổng quan Kiến trúc MVC', status: 'completed' },
                { num: 2, title: 'REST API & Middleware Bảo mật', status: 'completed' },
                { num: 3, title: 'Quy trình AI Tạo & Kiểm định Bài tập', status: 'upcoming' },
                { num: 4, title: 'Frontend ReactJS & Tích hợp State', status: 'upcoming' },
                { num: 5, title: 'Đồ án Thực chiến & Đánh giá Năng lực', status: 'upcoming' }
              ].map((sess) => (
                <div
                  key={sess.num}
                  className={`p-3.5 rounded-xl border text-xs space-y-1 ${
                    sess.status === 'completed'
                      ? 'border-emerald-200 bg-emerald-50/40 text-emerald-900'
                      : 'border-slate-200 bg-slate-50/50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold">Buổi {sess.num}</span>
                    {sess.status === 'completed' ? (
                      <span className="text-[10px] font-bold text-emerald-700 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Đã học
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400 font-medium">Sắp tới</span>
                    )}
                  </div>
                  <div className="font-semibold">{sess.title}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
