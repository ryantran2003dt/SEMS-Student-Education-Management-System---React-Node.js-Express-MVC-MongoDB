import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Award, FileText, CheckCircle, MessageSquare, Paperclip, Download } from 'lucide-react';

export default function ParentGrades() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGrades();
  }, []);

  const loadGrades = async () => {
    try {
      const res = await api.get('/analytics/overview');
      setData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const progress = data?.progress;
  const submissions = progress?.recentSubmissions || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Bảng Điểm & Nhận Xét Của Con</h1>
        <p className="text-sm text-slate-500 mt-1">
          Học viên: <strong className="text-slate-800">{data?.selectedChild?.fullName}</strong> • Điểm trung bình:{' '}
          <strong className="text-blue-600">{progress?.averageScore || 0}/100</strong>
        </p>
      </div>

      <div className="space-y-4">
        {submissions.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center text-slate-400 border border-slate-200">
            Chưa có bài tập nào được chấm điểm.
          </div>
        ) : (
          submissions.map((sub) => (
            <div
              key={sub._id}
              className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-base font-bold text-slate-800">{sub.assignmentId?.title}</h3>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Thời gian nộp: {new Date(sub.submittedAt).toLocaleDateString('vi-VN')}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-black text-blue-600">{sub.score}</span>
                  <span className="text-xs font-bold text-slate-400">/ {sub.maxScore || 100} điểm</span>
                </div>
              </div>

              {sub.feedback && (
                <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-200/60 text-xs text-blue-950 space-y-1">
                  <span className="font-bold flex items-center gap-1.5 text-blue-900">
                    <MessageSquare className="w-3.5 h-3.5 text-blue-600" /> Nhận xét của Giảng viên:
                  </span>
                  <p className="text-blue-900 leading-relaxed pl-5">
                    "{sub.feedback}"
                  </p>
                </div>
              )}

              {sub.attachmentUrl && (
                <div className="pt-2 flex items-center justify-between text-xs border-t border-slate-100">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <Paperclip className="w-3.5 h-3.5 text-blue-600" /> Tệp bài làm con đã nộp
                  </span>
                  <a
                    href={sub.attachmentUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 hover:text-blue-800 font-semibold text-[11px] flex items-center gap-1"
                  >
                    <Download className="w-3.5 h-3.5" /> Xem tệp
                  </a>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
