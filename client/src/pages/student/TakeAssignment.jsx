import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import {
  ArrowLeft,
  CheckCircle,
  Send,
  Clock,
  Award,
  MessageSquare,
  Paperclip,
  FileText,
  X,
  AlertTriangle,
  Upload,
  Download
} from 'lucide-react';

export default function TakeAssignment() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [assignment, setAssignment] = useState(null);
  const [submission, setSubmission] = useState(null);
  const [answers, setAnswers] = useState({});
  const [submittedText, setSubmittedText] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchAssignmentDetail();
  }, [id]);

  const fetchAssignmentDetail = async () => {
    try {
      const res = await api.get(`/assignments/${id}`);
      setAssignment(res.data);
      if (res.data.mySubmission) {
        setSubmission(res.data.mySubmission);
        setSubmittedText(res.data.mySubmission.submittedText || '');
        const map = {};
        res.data.mySubmission.answers?.forEach(a => {
          map[a.questionIndex] = {
            studentAnswer: a.studentAnswer,
            selectedOption: a.selectedOption
          };
        });
        setAnswers(map);
      }
    } catch (err) {
      alert(err.message);
      navigate('/student/assignments');
    } finally {
      setLoading(false);
    }
  };

  const isLocked = submission && submission.status !== 'resubmit_requested';

  const handleSelectOption = (qIdx, opt, optIdx) => {
    if (isLocked) return;
    setAnswers(prev => ({
      ...prev,
      [qIdx]: {
        studentAnswer: opt,
        selectedOption: optIdx
      }
    }));
  };

  const handleTextAnswerChange = (qIdx, text) => {
    if (isLocked) return;
    setAnswers(prev => ({
      ...prev,
      [qIdx]: {
        studentAnswer: text,
        selectedOption: null
      }
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 25 * 1024 * 1024) {
        alert('Dung lượng tệp tối đa cho phép là 25MB');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!window.confirm('Bạn có chắc chắn muốn nộp bài tập này?')) return;
    setSubmitting(true);
    try {
      const answersArray = assignment.questions.map((q, idx) => ({
        questionIndex: idx,
        studentAnswer: answers[idx]?.studentAnswer || '',
        selectedOption: answers[idx]?.selectedOption ?? null
      }));

      let res;
      if (selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('submittedText', submittedText);
        formData.append('answers', JSON.stringify(answersArray));
        res = await api.post(`/submissions/assignments/${id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        res = await api.post(`/submissions/assignments/${id}`, {
          answers: answersArray,
          submittedText
        });
      }

      setSubmission(res.data);
      setSelectedFile(null);
      alert('Nộp bài tập thành công!');
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Đang tải đề bài...</div>;
  if (!assignment) return null;

  const isGraded = submission?.status === 'graded';
  const isResubmit = submission?.status === 'resubmit_requested';

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Back button */}
      <button
        onClick={() => navigate('/student/assignments')}
        className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" /> Quay lại danh sách bài tập
      </button>

      {/* Assignment Header Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded uppercase">
            {assignment.classId?.name}
          </span>
          <span className="text-xs font-semibold text-slate-500">
            Hạn nộp: {new Date(assignment.dueDate).toLocaleDateString('vi-VN')}
          </span>
        </div>
        <h1 className="text-xl font-bold text-slate-800 mt-2">{assignment.title}</h1>
        <p className="text-xs text-slate-600 mt-1 leading-relaxed">{assignment.description}</p>

        {/* Resubmit Requested Banner */}
        {isResubmit && (
          <div className="mt-4 p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs space-y-1">
            <div className="font-bold text-rose-800 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <span>Yêu Cầu Làm Lại Bài Tập</span>
            </div>
            <p className="text-rose-900 leading-relaxed">
              <strong>Góp ý của Giáo viên:</strong> "{submission.resubmitComment || 'Vui lòng hoàn thiện lại các câu trả lời và nộp lại bài.'}"
            </p>
          </div>
        )}

        {/* Grade Banner if graded */}
        {isGraded && (
          <div className="mt-4 p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs">
            <div>
              <div className="font-bold text-emerald-900 flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span>Kết Quả Đã Chấm Điểm</span>
              </div>
              {submission.feedback && (
                <p className="mt-1 text-emerald-800 text-[11px] leading-relaxed">{submission.feedback}</p>
              )}
            </div>
            <div className="text-right shrink-0 pl-4">
              <span className="text-2xl font-black text-emerald-700">{submission.score}</span>
              <span className="text-slate-500 font-bold"> / {submission.maxScore}</span>
            </div>
          </div>
        )}

        {/* Existing attachment if submitted */}
        {submission?.attachmentUrl && (
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-slate-600">
              <Paperclip className="w-4 h-4 text-blue-600" />
              <span>Tệp bài làm đã nộp</span>
            </div>
            <a
              href={submission.attachmentUrl}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-[11px] transition-colors flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Tải về / Xem tệp</span>
            </a>
          </div>
        )}
      </div>

      {/* Questions Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {assignment.questions?.map((q, idx) => {
          const studentAns = answers[idx]?.studentAnswer;
          const isMultipleChoice = q.type === 'multiple_choice';

          return (
            <div key={idx} className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold font-mono text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                  Câu hỏi {idx + 1}
                </span>
                <span className="text-xs font-semibold text-slate-400">{q.points} điểm</span>
              </div>

              <h3 className="text-sm font-semibold text-slate-800 leading-relaxed">
                {q.questionText}
              </h3>

              {isMultipleChoice ? (
                <div className="space-y-2 pt-1">
                  {q.options?.map((opt, oIdx) => {
                    const isSelected = studentAns === opt;
                    return (
                      <div
                        key={oIdx}
                        onClick={() => handleSelectOption(idx, opt, oIdx)}
                        className={`p-3.5 rounded-xl border text-xs font-medium cursor-pointer transition-all flex items-center gap-3 ${
                          isSelected
                            ? 'border-blue-600 bg-blue-50/70 text-blue-900 ring-1 ring-blue-500 font-semibold'
                            : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                        } ${isLocked ? 'cursor-default' : ''}`}
                      >
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                          isSelected ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300'
                        }`}>
                          {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                        <span>{opt}</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="pt-1">
                  <textarea
                    rows={4}
                    disabled={isLocked}
                    value={studentAns || ''}
                    onChange={(e) => handleTextAnswerChange(idx, e.target.value)}
                    placeholder="Nhập câu trả lời hoặc lời giải của bạn..."
                    className="w-full p-3 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:bg-slate-50"
                  />
                </div>
              )}

              {/* Show explanation if graded */}
              {isGraded && q.explanation && (
                <div className="p-3 rounded-xl bg-slate-50 text-[11px] text-slate-600 border border-slate-100">
                  <strong className="text-slate-700">Đáp án chuẩn / Hướng dẫn:</strong> {q.explanation}
                </div>
              )}
            </div>
          );
        })}

        {/* Text Area & File Attachment Section */}
        {(!submission || isResubmit) && (
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Paperclip className="w-4 h-4 text-blue-600" />
              <span>Đính Kèm Tệp Bài Làm & Ghi Chú</span>
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Ghi chú hoặc lời nhắn gửi giảng viên (tùy chọn)
              </label>
              <textarea
                rows={2}
                value={submittedText}
                onChange={(e) => setSubmittedText(e.target.value)}
                placeholder="VD: Em gửi kèm mã nguồn đồ án và slide thuyết trình..."
                className="w-full p-3 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Tệp đính kèm (PDF, Word, Zip, Ảnh, Code... tối đa 25MB)
              </label>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept=".pdf,.doc,.docx,.zip,.rar,.png,.jpg,.jpeg,.txt,.js,.py,.html,.css"
              />

              {!selectedFile ? (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full p-4 border-2 border-dashed border-slate-200 hover:border-blue-400 rounded-2xl flex flex-col items-center justify-center gap-1.5 text-xs text-slate-500 hover:text-blue-600 transition-colors cursor-pointer bg-slate-50/50 hover:bg-blue-50/30"
                >
                  <Upload className="w-5 h-5 text-slate-400" />
                  <span className="font-semibold">Nhấn để chọn tệp từ máy tính</span>
                  <span className="text-[10px] text-slate-400">Hỗ trợ PDF, Word, Zip, Hình ảnh, Mã nguồn</span>
                </button>
              ) : (
                <div className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/50 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <FileText className="w-5 h-5 text-blue-600" />
                    <div>
                      <div className="font-semibold text-blue-950">{selectedFile.name}</div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Button */}
        {(!submission || isResubmit) ? (
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-lg shadow-blue-500/25 flex items-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>{submitting ? 'Đang gửi bài...' : isResubmit ? 'Nộp Lại Bài Tập' : 'Nộp Bài Tập'}</span>
            </button>
          </div>
        ) : (
          <div className="text-center p-4 bg-white rounded-xl border text-xs text-slate-500">
            Bạn đã nộp bài tập này vào ngày {new Date(submission.submittedAt).toLocaleString('vi-VN')}.
          </div>
        )}
      </form>
    </div>
  );
}
