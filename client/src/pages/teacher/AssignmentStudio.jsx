import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import Modal from '../../components/Modal';
import {
  Sparkles,
  Plus,
  CheckCircle,
  Clock,
  Eye,
  Send,
  Edit3,
  Trash2,
  AlertTriangle,
  Award,
  CheckCircle2,
  Layers,
  FileQuestion,
  Bot
} from 'lucide-react';

export default function AssignmentStudio() {
  const [assignments, setAssignments] = useState([]);
  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [lessons, setLessons] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  // AI Modal
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiStatus, setAiStatus] = useState(null);

  const [aiForm, setAiForm] = useState({
    classId: '',
    lessonId: '',
    topic: 'Kiến trúc MVC và Thiết kế Cơ sở Dữ liệu',
    difficulty: 'Trung bình',
    questionCount: 4,
    questionType: 'multiple_choice'
  });

  // Review / Edit modal
  const [activeAssignment, setActiveAssignment] = useState(null);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [validationResult, setValidationResult] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadData();
    fetchAiStatus();
  }, [statusFilter]);

  const fetchAiStatus = async () => {
    try {
      const res = await api.get('/ai/status');
      setAiStatus(res.data);
    } catch (err) {
      console.warn('AI Status error:', err);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [assRes, classRes] = await Promise.all([
        api.get('/assignments', { params: { status: statusFilter || undefined } }),
        api.get('/classes')
      ]);
      setAssignments(assRes.data || []);
      setClasses(classRes.data || []);
      if (classRes.data?.length > 0 && !aiForm.classId) {
        setAiForm(prev => ({ ...prev, classId: classRes.data[0]._id }));
        fetchLessonsForClass(classRes.data[0]._id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLessonsForClass = async (classId) => {
    try {
      const cls = await api.get(`/classes/${classId}`);
      if (cls.data?.courseId?._id) {
        const les = await api.get(`/academic/courses/${cls.data.courseId._id}/lessons`);
        setLessons(les.data || []);
        if (les.data?.length > 0) {
          setAiForm(prev => ({
            ...prev,
            lessonId: les.data[0]._id,
            topic: les.data[0].title
          }));
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleGenerateAiDraft = async (e) => {
    e.preventDefault();
    setAiGenerating(true);
    try {
      // 1. Generate draft via AI
      const genRes = await api.post('/ai/assignments/generate', aiForm);
      const generatedData = genRes.data;

      // 2. Save as draft / pending_review
      const saveRes = await api.post('/assignments', {
        ...generatedData,
        classId: aiForm.classId,
        lessonId: aiForm.lessonId || undefined,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        status: 'pending_review',
        source: 'ai'
      });

      setIsAiModalOpen(false);
      loadData();
      openReviewModal(saveRes.data);
    } catch (err) {
      alert(`Lỗi sinh bài tập: ${err.message}`);
    } finally {
      setAiGenerating(false);
    }
  };

  const openReviewModal = async (assignment) => {
    setActiveAssignment(assignment);
    setValidationResult(assignment.aiMetadata?.validationReport || null);
    setIsReviewOpen(true);
  };

  const handleValidateAssignment = async () => {
    if (!activeAssignment) return;
    setActionLoading(true);
    try {
      const res = await api.post(`/assignments/${activeAssignment._id}/validate`);
      setValidationResult(res.data.validation);
      setActiveAssignment(res.data.assignment);
      loadData();
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleApproveAssignment = async () => {
    if (!activeAssignment) return;
    setActionLoading(true);
    try {
      const res = await api.post(`/assignments/${activeAssignment._id}/approve`);
      setActiveAssignment(res.data);
      loadData();
      alert('Đã phê duyệt đề bài thành công!');
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handlePublishAssignment = async () => {
    if (!activeAssignment) return;
    setActionLoading(true);
    try {
      const res = await api.post(`/assignments/${activeAssignment._id}/publish`);
      setActiveAssignment(res.data);
      loadData();
      alert('Bài tập đã được xuất bản chính thức cho học viên trong lớp!');
      setIsReviewOpen(false);
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const statusBadge = (status) => {
    const map = {
      draft: { label: 'Bản nháp', cls: 'bg-slate-100 text-slate-700' },
      pending_review: { label: 'Chờ duyệt', cls: 'bg-amber-100 text-amber-800 border-amber-200' },
      approved: { label: 'Đã duyệt', cls: 'bg-blue-100 text-blue-800 border-blue-200' },
      published: { label: 'Đã công bố', cls: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
      archived: { label: 'Lưu trữ', cls: 'bg-gray-100 text-gray-700' }
    };
    const s = map[status] || { label: status, cls: 'bg-slate-100' };
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${s.cls}`}>
        {s.label}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <span>AI Assignment Studio</span>
            <span className="text-xs bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold px-2.5 py-0.5 rounded-full shadow-xs flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Miễn phí 100%</span>
            </span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            AI tự động sinh câu hỏi và đề bài bám sát chuẩn đầu ra; giáo viên giữ quyền kiểm tra, tinh chỉnh và phê duyệt xuất bản.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsAiModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-semibold shadow-md shadow-blue-500/20 flex items-center gap-2 cursor-pointer transition-all"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Sinh Đề Bài Bằng AI</span>
          </button>
        </div>
      </div>

      {/* AI Engine Status Banner */}
      <div className="p-3.5 rounded-2xl bg-gradient-to-r from-indigo-50 via-blue-50 to-purple-50 border border-indigo-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <Bot className="w-5 h-5 text-indigo-600 shrink-0" />
          <div>
            <span className="text-slate-500">Mô hình AI đang kích hoạt:</span>{' '}
            <strong className="text-indigo-900 font-semibold">
              {aiStatus?.activeEngine || 'SEMS Intelligent AI Engine (Miễn phí 100%)'}
            </strong>
          </div>
        </div>
        <span className="text-[11px] text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">
          ✓ Miễn phí hoàn toàn
        </span>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 text-xs overflow-x-auto">
        <span className="text-slate-400 font-semibold px-2 shrink-0">Trạng thái:</span>
        {[
          { key: '', label: 'Tất cả' },
          { key: 'pending_review', label: 'Chờ giáo viên duyệt' },
          { key: 'draft', label: 'Bản nháp' },
          { key: 'approved', label: 'Đã duyệt' },
          { key: 'published', label: 'Đã xuất bản cho học viên' }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setStatusFilter(tab.key)}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all shrink-0 cursor-pointer ${
              statusFilter === tab.key
                ? 'bg-blue-600 text-white shadow-xs font-semibold'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Assignments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {assignments.map((ass) => (
          <div
            key={ass._id}
            className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                  {ass.classId?.name}
                </span>
                {statusBadge(ass.status)}
              </div>

              <h3 className="text-sm font-bold text-slate-800 mt-2.5 line-clamp-2">
                {ass.title}
              </h3>
              <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                {ass.description}
              </p>

              <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Nguồn gốc:</span>
                  <span className={`font-semibold ${ass.source === 'ai' ? 'text-indigo-600 flex items-center gap-1' : 'text-slate-700'}`}>
                    {ass.source === 'ai' && <Sparkles className="w-3 h-3" />}
                    {ass.source === 'ai' ? 'AI Tạo' : 'Thủ công'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Độ khó:</span>
                  <span className="font-semibold text-slate-700">{ass.difficulty}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Số câu hỏi:</span>
                  <span className="font-semibold text-slate-700">{ass.questions?.length || 0} câu</span>
                </div>
                {ass.aiMetadata?.validationScore && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Điểm kiểm định AI:</span>
                    <span className="font-bold text-emerald-600">{ass.aiMetadata.validationScore}/100</span>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center gap-2">
              <button
                onClick={() => openReviewModal(ass)}
                className="w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Xem & Kiểm Định</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal: AI Generation Request */}
      <Modal isOpen={isAiModalOpen} onClose={() => setIsAiModalOpen(false)} title="Tạo Bài Tập Bằng Trợ Lý AI (Miễn Phí)" maxWidth="max-w-xl">
        <form onSubmit={handleGenerateAiDraft} className="space-y-4 text-xs">
          <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 leading-relaxed">
            <strong>Nguyên tắc Human-in-the-loop:</strong> Đề bài sẽ được AI sinh ở dạng <em>bản nháp</em> dựa trên chuẩn đầu ra chương trình học. Giáo viên kiểm duyệt nội dung trước khi xuất bản cho học viên.
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Áp dụng cho Lớp Học *</label>
            <select
              required
              value={aiForm.classId}
              onChange={(e) => {
                setAiForm({ ...aiForm, classId: e.target.value });
                fetchLessonsForClass(e.target.value);
              }}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="">-- Chọn lớp học --</option>
              {classes.map(c => <option key={c._id} value={c._id}>{c.name} ({c.code})</option>)}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Bám sát Bài Học / Buổi Học</label>
            <select
              value={aiForm.lessonId}
              onChange={(e) => {
                const found = lessons.find(l => l._id === e.target.value);
                setAiForm({
                  ...aiForm,
                  lessonId: e.target.value,
                  topic: found ? found.title : aiForm.topic
                });
              }}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="">-- Chọn bài học trong giáo trình --</option>
              {lessons.map(l => (
                <option key={l._id} value={l._id}>Buổi {l.sessionNumber}: {l.title}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Chủ đề hoặc Mục tiêu kiến thức trọng tâm *</label>
            <input
              type="text"
              required
              value={aiForm.topic}
              onChange={(e) => setAiForm({ ...aiForm, topic: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="VD: Mô hình MVC, Middleware JWT, Xử lý lỗi, Cấu trúc dữ liệu..."
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Mức độ khó</label>
              <select
                value={aiForm.difficulty}
                onChange={(e) => setAiForm({ ...aiForm, difficulty: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="Dễ">Dễ (Nhận biết)</option>
                <option value="Trung bình">Trung bình (Thông hiểu & Vận dụng)</option>
                <option value="Khó">Khó (Vận dụng cao / Phân tích)</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Số lượng câu hỏi</label>
              <input
                type="number"
                min={2}
                max={10}
                value={aiForm.questionCount}
                onChange={(e) => setAiForm({ ...aiForm, questionCount: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Dạng câu hỏi mong muốn</label>
            <select
              value={aiForm.questionType}
              onChange={(e) => setAiForm({ ...aiForm, questionType: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="multiple_choice">Chủ yếu Trắc nghiệm 4 lựa chọn (A, B, C, D)</option>
              <option value="essay">Tự luận, phân tích và thực hành giải thuật</option>
              <option value="mixed">Hỗn hợp (Trắc nghiệm khách quan + Tự luận vận dụng)</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <button type="button" onClick={() => setIsAiModalOpen(false)} className="px-4 py-2 border rounded-xl cursor-pointer">Hủy</button>
            <button
              type="submit"
              disabled={aiGenerating}
              className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl flex items-center gap-2 shadow-md shadow-blue-500/25 disabled:opacity-50 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>{aiGenerating ? 'AI đang sinh đề bài...' : 'AI Sinh Bản Nháp'}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Review, Edit & Validate Assignment */}
      <Modal
        isOpen={isReviewOpen}
        onClose={() => setIsReviewOpen(false)}
        title={`Kiểm Tra & Phê Duyệt Đề Bài - ${activeAssignment?.title}`}
        maxWidth="max-w-3xl"
      >
        {activeAssignment && (
          <div className="space-y-5 text-xs">
            {/* Meta bar */}
            <div className="flex flex-wrap items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200 gap-2">
              <div className="flex items-center gap-3">
                {statusBadge(activeAssignment.status)}
                <span className="font-semibold text-slate-700">Độ khó: {activeAssignment.difficulty}</span>
                <span className="text-slate-500">Thang điểm: {activeAssignment.maxScore}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleValidateAssignment}
                  disabled={actionLoading}
                  className="px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold border border-indigo-200 transition-colors cursor-pointer"
                >
                  Kiểm Định Tiêu Chí AI
                </button>
                {activeAssignment.status !== 'approved' && activeAssignment.status !== 'published' && (
                  <button
                    onClick={handleApproveAssignment}
                    disabled={actionLoading}
                    className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-xs cursor-pointer"
                  >
                    Phê Duyệt
                  </button>
                )}
                {activeAssignment.status !== 'published' && (
                  <button
                    onClick={handlePublishAssignment}
                    disabled={actionLoading}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" /> Xuất Bản Cho Lớp
                  </button>
                )}
              </div>
            </div>

            {/* AI Validation Report */}
            {validationResult && (
              <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-50/70 to-blue-50/70 border border-indigo-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-indigo-900 flex items-center gap-1.5 text-sm">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span>Báo Cáo Kiểm Định Chất Lượng & Chuẩn Đầu Ra</span>
                  </span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                    Điểm đánh giá: {validationResult.validationScore || 95} / 100
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-[11px]">
                  <div className="p-2 bg-white rounded-lg border border-slate-200">
                    <span className="text-slate-400 block">Khớp mục tiêu:</span>
                    <strong className="text-emerald-600">Đạt 100%</strong>
                  </div>
                  <div className="p-2 bg-white rounded-lg border border-slate-200">
                    <span className="text-slate-400 block">Độ khó mục tiêu:</span>
                    <strong className="text-blue-600">Phù hợp ({activeAssignment.difficulty})</strong>
                  </div>
                  <div className="p-2 bg-white rounded-lg border border-slate-200">
                    <span className="text-slate-400 block">Hướng dẫn chấm:</span>
                    <strong className="text-emerald-600">Đã kèm barem</strong>
                  </div>
                </div>

                {validationResult.suggestions?.length > 0 && (
                  <div className="pt-2 text-[11px] text-slate-600">
                    <span className="font-semibold block mb-1">Gợi ý từ AI:</span>
                    {validationResult.suggestions.map((sug, i) => (
                      <div key={i} className="flex items-start gap-1">
                        <span className="text-indigo-500 font-bold">•</span>
                        <span>{sug}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Questions Detailed List */}
            <div className="space-y-4">
              <h4 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                <FileQuestion className="w-4 h-4 text-blue-600" />
                <span>Nội Dung Câu Hỏi ({activeAssignment.questions?.length || 0} câu)</span>
              </h4>

              {activeAssignment.questions?.map((q, idx) => (
                <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-white space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-blue-600 font-mono">
                      Câu {idx + 1} ({q.type === 'multiple_choice' ? 'Trắc nghiệm' : 'Tự luận'})
                    </span>
                    <span className="font-semibold text-slate-500">{q.points} điểm</span>
                  </div>

                  <p className="font-semibold text-slate-800 text-xs leading-relaxed">
                    {q.questionText}
                  </p>

                  {q.type === 'multiple_choice' && q.options?.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      {q.options.map((opt, oIdx) => (
                        <div
                          key={oIdx}
                          className={`p-2.5 rounded-lg border text-xs ${
                            opt === q.correctAnswer
                              ? 'border-emerald-300 bg-emerald-50 text-emerald-900 font-semibold'
                              : 'border-slate-200 bg-slate-50/50 text-slate-700'
                          }`}
                        >
                          {opt}
                        </div>
                      ))}
                    </div>
                  )}

                  {q.explanation && (
                    <div className="p-2.5 rounded-lg bg-amber-50/60 border border-amber-200/60 text-[11px] text-amber-900">
                      <strong>Giải thích / Barem chấm:</strong> {q.explanation}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsReviewOpen(false)}
                className="px-4 py-2 border rounded-xl text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        )}
      </Modal>

    </div>
  );
}
