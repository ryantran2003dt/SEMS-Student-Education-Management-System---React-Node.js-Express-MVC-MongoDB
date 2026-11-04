import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import Modal from '../../components/Modal';
import {
  ClipboardList,
  CheckCircle,
  Clock,
  Send,
  MessageSquare,
  AlertTriangle,
  FileText,
  Paperclip,
  Download,
  Sparkles,
  Bot,
  Check,
  LoaderCircle,
  Users
} from 'lucide-react';

export default function GradingSubmissions() {
  const [assignments, setAssignments] = useState([]);
  const [selectedAssId, setSelectedAssId] = useState('');
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bulkGrading, setBulkGrading] = useState(null);
  const pendingSubmissions = submissions.filter(
    (submission) => submission.status === 'submitted' || submission.status === 'resubmit_requested'
  );

  // Grading Modal
  const [activeSubmission, setActiveSubmission] = useState(null);
  const [isGradingOpen, setIsGradingOpen] = useState(false);
  const [gradeForm, setGradeForm] = useState({
    score: 85,
    feedback: 'Bài làm rất tốt, nắm vững kiến thức.'
  });

  // AI Assistant Auto-grading state
  const [aiGradingLoading, setAiGradingLoading] = useState(false);
  const [aiEngineUsed, setAiEngineUsed] = useState('');
  const [aiGradingNotes, setAiGradingNotes] = useState([]);

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    try {
      const res = await api.get('/assignments?status=published');
      setAssignments(res.data || []);
      if (res.data?.length > 0) {
        handleSelectAssignment(res.data[0]._id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAssignment = async (assignmentId) => {
    setSelectedAssId(assignmentId);
    setBulkGrading(null);
    try {
      const res = await api.get(`/submissions/assignments/${assignmentId}`);
      setSubmissions(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const openGradingModal = (sub) => {
    setActiveSubmission(sub);
    setAiEngineUsed('');
    setAiGradingNotes([]);
    setGradeForm({
      score: sub.score !== null ? sub.score : 85,
      feedback: sub.feedback || 'Bài làm tốt, trình bày rõ ràng.'
    });
    setIsGradingOpen(true);
  };

  const handleAIAssistGrade = async () => {
    if (!activeSubmission) return;
    setAiGradingLoading(true);
    try {
      const res = await api.post(`/ai/grade-submission/${activeSubmission._id}`);
      const data = res.data;
      setGradeForm({
        score: typeof data.score === 'number' ? data.score : 85,
        feedback: data.feedback || ''
      });
      setAiEngineUsed(data.engineUsed || 'AI Engine');
      setAiGradingNotes(data.answersFeedback || []);
    } catch (err) {
      alert(`Lỗi AI chấm bài: ${err.message}`);
    } finally {
      setAiGradingLoading(false);
    }
  };

  const handleBulkAIGrade = async () => {
    if (!pendingSubmissions.length || bulkGrading?.active) return;

    const confirmed = window.confirm(
      `AI sẽ chấm, tự động lưu điểm và gửi nhận xét cho ${pendingSubmissions.length} học viên chưa được chấm trong bài tập này. Bạn có muốn tiếp tục không?`
    );
    if (!confirmed) return;

    setBulkGrading({
      active: true,
      completed: 0,
      total: pendingSubmissions.length,
      results: []
    });

    const concurrency = 2;
    for (let index = 0; index < pendingSubmissions.length; index += concurrency) {
      const batch = pendingSubmissions.slice(index, index + concurrency);
      const batchResults = await Promise.all(batch.map(async (submission) => {
        try {
          const aiResponse = await api.post(`/ai/grade-submission/${submission._id}`);
          const grade = aiResponse.data;
          if (typeof grade?.score !== 'number' || !Number.isFinite(grade.score)) {
            throw new Error('AI không trả về điểm số hợp lệ');
          }

          await api.post(`/submissions/${submission._id}/grade`, {
            score: Math.max(0, Math.min(100, grade.score)),
            feedback: grade.feedback || '',
            answersFeedback: grade.answersFeedback || []
          });

          setSubmissions((current) => current.map((item) => item._id === submission._id
            ? {
                ...item,
                status: 'graded',
                score: Math.max(0, Math.min(100, grade.score)),
                feedback: grade.feedback || ''
              }
            : item
          ));

          return {
            studentName: submission.studentId?.fullName || 'Học viên',
            score: Math.max(0, Math.min(100, grade.score)),
            success: true
          };
        } catch (err) {
          return {
            studentName: submission.studentId?.fullName || 'Học viên',
            error: err.message || 'Không thể chấm bài này',
            success: false
          };
        }
      }));

      setBulkGrading((current) => ({
        ...current,
        completed: current.completed + batchResults.length,
        results: [...current.results, ...batchResults]
      }));
    }

    setBulkGrading((current) => ({ ...current, active: false }));
  };

  const handleSaveGrade = async (e) => {
    e.preventDefault();
    if (!activeSubmission) return;
    try {
      await api.post(`/submissions/${activeSubmission._id}/grade`, {
        score: Number(gradeForm.score),
        feedback: gradeForm.feedback
      });
      setIsGradingOpen(false);
      handleSelectAssignment(selectedAssId);
      alert('Đã lưu điểm và gửi nhận xét thành công!');
    } catch (err) {
      alert(err.message);
    }
  };

  const handleRequestResubmit = async () => {
    if (!activeSubmission) return;
    const comment = prompt('Nhập lý do hoặc hướng dẫn học viên làm lại:');
    if (!comment) return;
    try {
      await api.post(`/submissions/${activeSubmission._id}/resubmit`, { comment });
      setIsGradingOpen(false);
      handleSelectAssignment(selectedAssId);
      alert('Đã gửi yêu cầu làm lại cho học viên.');
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <span>Chấm Điểm & Đánh Giá Bài Nộp</span>
            <span className="text-xs bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Tích hợp AI Trợ Giảng</span>
            </span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Xem bài làm của học viên, sử dụng AI hỗ trợ chấm bài tự động và gửi nhận xét chi tiết.
          </p>
        </div>
      </div>

      {/* Assignment selector */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center gap-3">
        <label className="text-xs font-bold text-slate-500 uppercase">Chọn Bài Tập:</label>
        <select
          value={selectedAssId}
          onChange={(e) => handleSelectAssignment(e.target.value)}
          disabled={bulkGrading?.active}
          className="w-full min-w-0 sm:min-w-80 sm:w-auto text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 bg-slate-50"
        >
          {assignments.map(a => (
            <option key={a._id} value={a._id}>
              {a.title} ({a.classId?.name})
            </option>
          ))}
        </select>
      </div>

      {bulkGrading && (
        <section
          aria-live="polite"
          className="rounded-2xl border border-indigo-200 bg-indigo-50/70 p-4 space-y-3"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex items-center gap-2 text-sm font-bold text-indigo-900">
              {bulkGrading.active
                ? <LoaderCircle className="w-4 h-4 animate-spin" />
                : <Check className="w-4 h-4 text-emerald-600" />}
              <span>
                {bulkGrading.active
                  ? `Đang chấm bài bằng AI: ${bulkGrading.completed}/${bulkGrading.total}`
                  : `Đã xử lý ${bulkGrading.completed}/${bulkGrading.total} bài nộp`}
              </span>
            </div>
            {!bulkGrading.active && (
              <span className="text-xs text-slate-600">
                Thành công: {bulkGrading.results.filter((result) => result.success).length}
                {' • '}
                Lỗi: {bulkGrading.results.filter((result) => !result.success).length}
              </span>
            )}
          </div>
          <div
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={bulkGrading.total}
            aria-valuenow={bulkGrading.completed}
            className="h-2 overflow-hidden rounded-full bg-indigo-100"
          >
            <div
              className="h-full rounded-full bg-indigo-600 transition-all"
              style={{ width: `${(bulkGrading.completed / bulkGrading.total) * 100}%` }}
            />
          </div>
          {!bulkGrading.active && bulkGrading.results.some((result) => !result.success) && (
            <ul className="max-h-40 overflow-y-auto space-y-1 text-xs text-rose-700">
              {bulkGrading.results.filter((result) => !result.success).map((result, index) => (
                <li key={`${result.studentName}-${index}`}>
                  {result.studentName}: {result.error}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {/* Submissions Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h2 className="text-sm font-bold text-slate-800">
            Danh Sách Bài Nộp ({submissions.length})
          </h2>
          <button
            type="button"
            onClick={handleBulkAIGrade}
            disabled={
              bulkGrading?.active ||
              !pendingSubmissions.length
            }
            className="w-full sm:w-auto justify-center px-3.5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-semibold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {bulkGrading?.active
              ? <LoaderCircle className="w-4 h-4 animate-spin" />
              : <Users className="w-4 h-4" />}
            {bulkGrading?.active
              ? 'Đang chấm tất cả...'
              : `AI chấm tất cả bài chưa chấm (${pendingSubmissions.length})`}
          </button>
        </div>

        <div className="overflow-x-auto">
        <table className="w-full min-w-[680px] text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
              <th className="py-3 px-4">Học Viên</th>
              <th className="py-3 px-4">Thời Gian Nộp</th>
              <th className="py-3 px-4">Trạng Thái</th>
              <th className="py-3 px-4 text-center">Điểm Số</th>
              <th className="py-3 px-4">Nhận Xét</th>
              <th className="py-3 px-4 text-right">Thao Tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {submissions.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-400">
                  Chưa có học viên nào nộp bài tập này.
                </td>
              </tr>
            ) : (
              submissions.map((sub) => (
                <tr key={sub._id} className="hover:bg-slate-50/50">
                  <td className="py-3 px-4 font-semibold text-slate-800 flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center">
                      {sub.studentId?.fullName?.charAt(0)}
                    </div>
                    <span>{sub.studentId?.fullName}</span>
                  </td>
                  <td className="py-3 px-4 text-slate-500">
                    {new Date(sub.submittedAt).toLocaleString('vi-VN')}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                      sub.status === 'graded'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : sub.status === 'resubmit_requested'
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}>
                      {sub.status === 'graded' ? 'Đã chấm' : sub.status === 'resubmit_requested' ? 'Yêu cầu làm lại' : 'Chờ chấm'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center font-bold text-xs">
                    {sub.score !== null ? (
                      <span className="text-blue-600">{sub.score} / {sub.maxScore || 100}</span>
                    ) : (
                      <span className="text-slate-400">--</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-slate-600 max-w-xs truncate">
                    {sub.feedback || sub.resubmitComment || 'Chưa có'}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => openGradingModal(sub)}
                      disabled={bulkGrading?.active}
                      className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-[11px] transition-colors cursor-pointer"
                    >
                      {sub.status === 'graded' ? 'Xem & Chấm lại' : 'Chấm điểm'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        </div>
      </div>

      {/* Modal: Grade Submission */}
      <Modal
        isOpen={isGradingOpen}
        onClose={() => setIsGradingOpen(false)}
        title={`Chấm Điểm Bài Nộp - ${activeSubmission?.studentId?.fullName}`}
        maxWidth="max-w-2xl"
      >
        {activeSubmission && (
          <form onSubmit={handleSaveGrade} className="space-y-4 text-xs">
            {/* AI Auto-grading Trigger Button */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-purple-50 via-indigo-50 to-blue-50 border border-purple-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <div className="font-bold text-purple-900 flex items-center gap-1.5">
                  <Bot className="w-4 h-4 text-purple-600" />
                  <span>Trợ Lý AI Chấm Bài (Miễn phí 100%)</span>
                </div>
                <p className="text-[11px] text-purple-700 mt-0.5">
                  Tự động so khớp câu trả lời với barem chấm, tính điểm và đề xuất nhận xét sư phạm.
                </p>
              </div>
              <button
                type="button"
                disabled={aiGradingLoading}
                onClick={handleAIAssistGrade}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-md shadow-purple-500/20 disabled:opacity-50 cursor-pointer shrink-0 transition-all"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>{aiGradingLoading ? 'AI đang phân tích...' : '✨ AI Chấm Tự Động'}</span>
              </button>
            </div>

            {/* AI badge if loaded */}
            {aiEngineUsed && (
              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-medium flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Đã chấm đề xuất bởi <strong>{aiEngineUsed}</strong>. Bạn có thể kiểm tra và chỉnh sửa điểm / nhận xét bên dưới trước khi lưu.</span>
              </div>
            )}

            {/* Student answers */}
            <div className="space-y-3">
              <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                Câu Trả Lời Của Học Viên:
              </h4>

              {activeSubmission.answers?.map((ans, idx) => {
                const aiNote = aiGradingNotes.find(n => n.questionIndex === idx);
                return (
                  <div key={idx} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-blue-600">Câu {idx + 1}:</span>
                      {aiNote?.pointsAwarded !== undefined && (
                        <span className="text-[11px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                          AI chấm: {aiNote.pointsAwarded} điểm
                        </span>
                      )}
                    </div>
                    <div className="text-slate-800 bg-white p-2.5 rounded-lg border border-slate-200 font-medium">
                      {ans.studentAnswer || '(Không có câu trả lời)'}
                    </div>
                    {aiNote?.teacherNote && (
                      <div className="text-[11px] text-purple-800 italic bg-purple-50/50 p-1.5 rounded">
                        <strong>AI ghi chú:</strong> {aiNote.teacherNote}
                      </div>
                    )}
                    {ans.pointsAwarded !== null && !aiNote && (
                      <div className="text-[11px] text-emerald-600 font-bold">
                        Điểm tự động: {ans.pointsAwarded} điểm
                      </div>
                    )}
                  </div>
                );
              })}

              {activeSubmission.submittedText && (
                <div className="p-3 rounded-xl border bg-white">
                  <strong className="block text-slate-600 mb-1">Bài làm dạng văn bản / mã nguồn:</strong>
                  <pre className="whitespace-pre-wrap break-words font-mono text-slate-800">{activeSubmission.submittedText}</pre>
                </div>
              )}

              {activeSubmission.attachmentUrl && (
                <div className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/60 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-blue-900 font-semibold text-xs">
                    <Paperclip className="w-4 h-4 text-blue-600" />
                    <span>Tệp đính kèm bài làm của học viên</span>
                  </div>
                  <a
                    href={activeSubmission.attachmentUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-[11px] transition-colors flex items-center gap-1.5 shadow-xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Xem / Tải tệp</span>
                  </a>
                </div>
              )}
            </div>

            {/* Score & Feedback Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-100">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Điểm số (Thang 100) *</label>
                <input
                  type="number"
                  required
                  min={0}
                  max={100}
                  value={gradeForm.score}
                  onChange={(e) => setGradeForm({ ...gradeForm, score: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold text-sm text-blue-600 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">Nhận xét của Giáo viên</label>
                <textarea
                  rows={2}
                  value={gradeForm.feedback}
                  onChange={(e) => setGradeForm({ ...gradeForm, feedback: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="Khen ngợi hoặc góp ý cải thiện..."
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={handleRequestResubmit}
                className="px-3.5 py-2 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-xs transition-colors cursor-pointer"
              >
                Yêu cầu làm lại bài
              </button>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsGradingOpen(false)}
                  className="px-4 py-2 border rounded-xl text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl cursor-pointer"
                >
                  Hoàn Tất Chấm Điểm
                </button>
              </div>
            </div>
          </form>
        )}
      </Modal>

    </div>
  );
}
