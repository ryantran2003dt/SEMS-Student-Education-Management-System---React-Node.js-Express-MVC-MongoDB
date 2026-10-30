import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { FileText, CheckCircle, Clock, AlertCircle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function StudentAssignments() {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    try {
      const res = await api.get('/assignments');
      setAssignments(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Nhiệm Vụ & Bài Tập</h1>
        <p className="text-sm text-slate-500 mt-1">
          Hoàn thành các bài tập và thử thách thực hành để củng cố kiến thức và tích lũy điểm chuyên cần.
        </p>
      </div>

      <div className="space-y-4">
        {assignments.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center text-slate-400 border border-slate-200">
            Hiện chưa có bài tập nào được giao.
          </div>
        ) : (
          assignments.map((ass) => {
            const isSubmitted = ass.isSubmitted;
            const isGraded = ass.isGraded;
            const score = ass.myScore;

            return (
              <div
                key={ass._id}
                className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded uppercase">
                      {ass.classId?.name}
                    </span>
                    <span className="text-xs text-slate-400">• Độ khó: {ass.difficulty}</span>
                  </div>
                  <h3 className="text-base font-bold text-slate-800">{ass.title}</h3>
                  <p className="text-xs text-slate-500 line-clamp-1">{ass.description}</p>
                  <div className="text-[11px] text-slate-400 pt-1">
                    Hạn nộp: <strong className="text-slate-600">{new Date(ass.dueDate).toLocaleDateString('vi-VN')}</strong> • Thang điểm: {ass.maxScore}
                  </div>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0">
                  {isGraded ? (
                    <div className="text-right">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle className="w-3.5 h-3.5" /> {score} / {ass.maxScore} điểm
                      </span>
                    </div>
                  ) : isSubmitted ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                      <Clock className="w-3.5 h-3.5" /> Đã nộp (Chờ chấm)
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                      <AlertCircle className="w-3.5 h-3.5" /> Chưa nộp
                    </span>
                  )}

                  <Link
                    to={`/student/assignments/${ass._id}`}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                      isGraded
                        ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        : 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs'
                    }`}
                  >
                    <span>{isGraded ? 'Xem bài làm & nhận xét' : isSubmitted ? 'Xem lại bài nộp' : 'Làm bài ngay'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
