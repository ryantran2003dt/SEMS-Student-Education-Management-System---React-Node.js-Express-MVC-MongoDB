import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import Modal from '../../components/Modal';
import { BookOpen, Plus, Layers, FileText, CheckCircle2, ChevronRight, Tag } from 'lucide-react';

export default function AcademicManagement() {
  const [subjects, setSubjects] = useState([]);
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [curriculums, setCurriculums] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [isLessonModalOpen, setIsLessonModalOpen] = useState(false);

  const [subjectForm, setSubjectForm] = useState({ name: '', code: '', description: '', level: 'Cơ bản - Nâng cao' });
  const [courseForm, setCourseForm] = useState({ subjectId: '', name: '', code: '', targetAudience: '', objective: '', durationHours: 36, expectedSessions: 12 });
  const [lessonForm, setLessonForm] = useState({ title: '', topic: '', sessionNumber: 1, objectives: '' });

  useEffect(() => {
    fetchAcademicData();
  }, []);

  const fetchAcademicData = async () => {
    setLoading(true);
    try {
      const [subjRes, courseRes] = await Promise.all([
        api.get('/academic/subjects'),
        api.get('/academic/courses')
      ]);
      setSubjects(subjRes.data || []);
      setCourses(courseRes.data || []);
      if (courseRes.data?.length > 0) {
        selectCourse(courseRes.data[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const selectCourse = async (course) => {
    setSelectedCourse(course);
    try {
      const [lessonRes, currRes] = await Promise.all([
        api.get(`/academic/courses/${course._id}/lessons`),
        api.get(`/academic/courses/${course._id}/curriculums`)
      ]);
      setLessons(lessonRes.data || []);
      setCurriculums(currRes.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateSubject = async (e) => {
    e.preventDefault();
    try {
      await api.post('/academic/subjects', subjectForm);
      setIsSubjectModalOpen(false);
      fetchAcademicData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCreateCourse = async (e) => {
    e.preventDefault();
    try {
      await api.post('/academic/courses', courseForm);
      setIsCourseModalOpen(false);
      fetchAcademicData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCreateLesson = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/academic/courses/${selectedCourse._id}/lessons`, {
        ...lessonForm,
        objectives: lessonForm.objectives.split('\n').filter(Boolean)
      });
      setIsLessonModalOpen(false);
      selectCourse(selectedCourse);
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Quản Lý Chương Trình & Đào Tạo</h1>
          <p className="text-sm text-slate-500 mt-1">
            Môn học → Khóa học → Chương trình phiên bản → Bài học & Chuẩn đầu ra (Chuẩn bị dữ liệu cho AI sinh bài tập).
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsSubjectModalOpen(true)}
            className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" /> Thêm Môn Học
          </button>
          <button
            onClick={() => setIsCourseModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" /> Mở Khóa Học
          </button>
        </div>
      </div>

      {/* Grid: Courses Left + Lesson/Curriculum Details Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left: Courses list */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
            <h2 className="text-sm font-bold text-slate-800 mb-3 flex items-center justify-between">
              <span>Danh Sách Khóa Học ({courses.length})</span>
              <BookOpen className="w-4 h-4 text-blue-600" />
            </h2>
            <div className="space-y-2">
              {courses.map((course) => {
                const isSelected = selectedCourse?._id === course._id;
                return (
                  <button
                    key={course._id}
                    onClick={() => selectCourse(course)}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50/50 shadow-xs ring-1 ring-blue-500'
                        : 'border-slate-100 hover:border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-mono">
                        {course.code}
                      </span>
                      <span className="text-[10px] text-blue-600 font-medium">
                        {course.expectedSessions} buổi
                      </span>
                    </div>
                    <div className="text-xs font-bold text-slate-800 mt-1">{course.name}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Môn: {course.subjectId?.name || 'Chung'}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Selected Course Curriculum & Lessons */}
        <div className="lg:col-span-2 space-y-4">
          {selectedCourse ? (
            <>
              {/* Course Info Card */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs font-mono font-bold text-blue-600 uppercase bg-blue-50 px-2 py-0.5 rounded">
                      {selectedCourse.code}
                    </span>
                    <h2 className="text-xl font-bold text-slate-800 mt-2">{selectedCourse.name}</h2>
                    <p className="text-xs text-slate-600 mt-1">{selectedCourse.objective}</p>
                  </div>
                  <button
                    onClick={() => {
                      setLessonForm({ ...lessonForm, sessionNumber: lessons.length + 1 });
                      setIsLessonModalOpen(true);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" /> Thêm Bài Học
                  </button>
                </div>

                {/* Curriculum version info */}
                {curriculums.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-700">Phiên bản chương trình:</span>
                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 font-bold rounded border border-emerald-200">
                        v{curriculums[0].version} (Hiện hành)
                      </span>
                    </div>
                    <span>{curriculums[0].topics?.length || 0} chủ đề đầu ra</span>
                  </div>
                )}
              </div>

              {/* Lessons List */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
                <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-600" />
                  <span>Danh Sách Bài Học Theo Buổi & Chuẩn Đầu Ra</span>
                </h3>

                {lessons.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-xs">
                    Chưa có bài học nào trong khóa học này. Hãy nhấn 'Thêm Bài Học'.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {lessons.map((lesson) => (
                      <div
                        key={lesson._id}
                        className="p-4 rounded-xl border border-slate-100 hover:border-slate-200 bg-slate-50/50 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-indigo-600 font-mono">
                            Buổi {lesson.sessionNumber}
                          </span>
                          <span className="text-[11px] text-slate-500 px-2 py-0.5 rounded bg-white border border-slate-200">
                            Chủ đề: {lesson.topic}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-slate-800 mt-1">{lesson.title}</h4>
                        
                        {lesson.objectives?.length > 0 && (
                          <div className="mt-2.5 space-y-1">
                            <span className="text-[11px] font-semibold text-slate-600 block">Mục tiêu chuẩn đầu ra:</span>
                            {lesson.objectives.map((obj, i) => (
                              <div key={i} className="text-xs text-slate-600 flex items-start gap-1.5 pl-1">
                                <span className="text-emerald-500 font-bold">•</span>
                                <span>{obj}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="bg-white rounded-2xl p-12 text-center text-slate-400 border border-slate-200">
              Vui lòng chọn khóa học ở danh sách bên trái.
            </div>
          )}
        </div>
      </div>

      {/* Modal: Add Subject */}
      <Modal isOpen={isSubjectModalOpen} onClose={() => setIsSubjectModalOpen(false)} title="Thêm Môn Học Mới">
        <form onSubmit={handleCreateSubject} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Tên môn học *</label>
            <input
              type="text"
              required
              value={subjectForm.name}
              onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
              placeholder="VD: Lập trình Python & Phân tích Dữ liệu"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Mã môn học *</label>
              <input
                type="text"
                required
                value={subjectForm.code}
                onChange={(e) => setSubjectForm({ ...subjectForm, code: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono uppercase"
                placeholder="PYTHON-DS"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Cấp độ</label>
              <input
                type="text"
                value={subjectForm.level}
                onChange={(e) => setSubjectForm({ ...subjectForm, level: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                placeholder="Cơ bản - Nâng cao"
              />
            </div>
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Mô tả tổng quát</label>
            <textarea
              rows={3}
              value={subjectForm.description}
              onChange={(e) => setSubjectForm({ ...subjectForm, description: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
              placeholder="Mô tả mục tiêu và nội dung chính của môn học..."
            />
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <button type="button" onClick={() => setIsSubjectModalOpen(false)} className="px-4 py-2 border rounded-xl">Hủy</button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-xl">Lưu Môn Học</button>
          </div>
        </form>
      </Modal>

      {/* Modal: Add Course */}
      <Modal isOpen={isCourseModalOpen} onClose={() => setIsCourseModalOpen(false)} title="Mở Khóa Học Mới">
        <form onSubmit={handleCreateCourse} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Thuộc Môn Học *</label>
            <select
              required
              value={courseForm.subjectId}
              onChange={(e) => setCourseForm({ ...courseForm, subjectId: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
            >
              <option value="">-- Chọn môn học --</option>
              {subjects.map(s => <option key={s._id} value={s._id}>{s.name} ({s.code})</option>)}
            </select>
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Tên khóa học *</label>
            <input
              type="text"
              required
              value={courseForm.name}
              onChange={(e) => setCourseForm({ ...courseForm, name: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
              placeholder="VD: Fullstack React & Node.js Chuyên Sâu"
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Mã khóa *</label>
              <input
                type="text"
                required
                value={courseForm.code}
                onChange={(e) => setCourseForm({ ...courseForm, code: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono uppercase"
                placeholder="FS-REACT-01"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Số buổi học</label>
              <input
                type="number"
                value={courseForm.expectedSessions}
                onChange={(e) => setCourseForm({ ...courseForm, expectedSessions: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Thời lượng (giờ)</label>
              <input
                type="number"
                value={courseForm.durationHours}
                onChange={(e) => setCourseForm({ ...courseForm, durationHours: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
              />
            </div>
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Mục tiêu đầu ra của khóa học</label>
            <textarea
              rows={3}
              value={courseForm.objective}
              onChange={(e) => setCourseForm({ ...courseForm, objective: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
              placeholder="Mô tả kỹ năng và kiến thức người học sẽ đạt được sau khóa học..."
            />
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <button type="button" onClick={() => setIsCourseModalOpen(false)} className="px-4 py-2 border rounded-xl">Hủy</button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-xl">Tạo Khóa Học</button>
          </div>
        </form>
      </Modal>

      {/* Modal: Add Lesson */}
      <Modal isOpen={isLessonModalOpen} onClose={() => setIsLessonModalOpen(false)} title={`Thêm Bài Học - ${selectedCourse?.name}`}>
        <form onSubmit={handleCreateLesson} className="space-y-4 text-xs">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Buổi số *</label>
              <input
                type="number"
                required
                value={lessonForm.sessionNumber}
                onChange={(e) => setLessonForm({ ...lessonForm, sessionNumber: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
              />
            </div>
            <div className="col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">Chủ đề (Topic) *</label>
              <input
                type="text"
                required
                value={lessonForm.topic}
                onChange={(e) => setLessonForm({ ...lessonForm, topic: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                placeholder="VD: Kiến trúc MVC & Schemas"
              />
            </div>
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Tiêu đề bài học *</label>
            <input
              type="text"
              required
              value={lessonForm.title}
              onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
              placeholder="VD: Buổi 1: Thiết kế Cơ sở Dữ liệu và Xây dựng Mongoose Models"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Mục tiêu chuẩn đầu ra (mỗi dòng 1 mục tiêu - giúp AI sinh đúng câu hỏi)</label>
            <textarea
              rows={4}
              value={lessonForm.objectives}
              onChange={(e) => setLessonForm({ ...lessonForm, objectives: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
              placeholder="- Hiểu cấu trúc MongoDB Document
- Viết Schema và Validation với Mongoose
- Tối ưu hóa Index cho truy vấn"
            />
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <button type="button" onClick={() => setIsLessonModalOpen(false)} className="px-4 py-2 border rounded-xl">Hủy</button>
            <button type="submit" className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-xl">Lưu Bài Học</button>
          </div>
        </form>
      </Modal>

    </div>
  );
}
