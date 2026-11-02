import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import Modal from '../../components/Modal';
import { Calendar, Plus, Users, UserCheck, BookOpen, Clock, MapPin, CheckCircle } from 'lucide-react';

export default function ClassManagement() {
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedClass, setSelectedClass] = useState(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEnrollOpen, setIsEnrollOpen] = useState(false);
  const [enrollStudentId, setEnrollStudentId] = useState('');

  const [formData, setFormData] = useState({
    courseId: '',
    teacherId: '',
    scheduleDescription: 'Thứ 2 - Thứ 4 (18:30 - 20:30)',
    room: 'Phòng Lab 02 - Tầng 3',
    startDate: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [classRes, teacherRes, studentRes, courseRes] = await Promise.all([
        api.get('/classes'),
        api.get('/users?role=teacher'),
        api.get('/users?role=student'),
        api.get('/academic/courses')
      ]);
      setClasses(classRes.data || []);
      setTeachers(teacherRes.data?.users || []);
      setStudents(studentRes.data?.users || []);
      setCourses(courseRes.data || []);
      if (classRes.data?.length > 0) {
        handleSelectClass(classRes.data[0]._id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectClass = async (classId) => {
    try {
      const res = await api.get(`/classes/${classId}`);
      setSelectedClass(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateClass = async (e) => {
    e.preventDefault();
    try {
      await api.post('/classes', {
        ...formData,
        code: selectedCourse ? `${selectedCourse.code}-L${generatedClassNumber}` : '',
        name: selectedCourse ? `${selectedCourse.name} - Lớp ${generatedClassNumber}` : ''
      });
      setIsCreateOpen(false);
      setFormData((current) => ({
        ...current,
        courseId: '',
        teacherId: ''
      }));
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const selectedCourse = courses.find((course) => course._id === formData.courseId);
  const nextClassNumber = selectedCourse
    ? classes.reduce((max, classItem) => {
        const course = classItem.courseId;
        const courseId = course?._id || course;
        if (String(courseId) !== String(selectedCourse._id)) return max;
        const prefix = `${selectedCourse.code}-L`;
        if (!classItem.code?.startsWith(prefix)) return max;
        const number = Number(classItem.code.slice(prefix.length));
        return Number.isInteger(number) ? Math.max(max, number) : max;
      }, 0) + 1
    : null;
  const generatedClassNumber = nextClassNumber === null
    ? ''
    : String(nextClassNumber).padStart(2, '0');

  const handleEnrollStudent = async (e) => {
    e.preventDefault();
    if (!enrollStudentId || !selectedClass) return;
    try {
      await api.post(`/classes/${selectedClass._id}/enroll`, { studentId: enrollStudentId });
      setIsEnrollOpen(false);
      setEnrollStudentId('');
      handleSelectClass(selectedClass._id);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleRemoveStudent = async (studentId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa học viên khỏi lớp này?')) return;
    try {
      await api.post(`/classes/${selectedClass._id}/remove-student`, { studentId });
      handleSelectClass(selectedClass._id);
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Quản Lý Lớp Học & Buổi Học</h1>
          <p className="text-sm text-slate-500 mt-1">
            Thiết lập lịch học, phân công giáo viên phụ trách, xếp lớp và theo dõi danh sách học viên.
          </p>
        </div>
        <button
          onClick={() => setIsCreateOpen(true)}
          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Mở Lớp Học Mới
        </button>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left: Class Cards List */}
        <div className="space-y-3">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            Danh Sách Lớp ({classes.length})
          </div>
          {classes.map((cls) => {
            const isSelected = selectedClass?._id === cls._id;
            return (
              <div
                key={cls._id}
                onClick={() => handleSelectClass(cls._id)}
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50/50 shadow-xs ring-1 ring-blue-500'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                    {cls.code}
                  </span>
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {cls.status === 'ongoing' ? 'Đang diễn ra' : cls.status}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-slate-800 mt-2">{cls.name}</h3>
                <div className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                  <span>GV: {cls.teacherId?.fullName || 'Chưa phân công'}</span>
                </div>
                <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Sĩ số: {cls.studentIds?.length || 0} học viên</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right: Selected Class Detailed View */}
        <div className="lg:col-span-2 space-y-5">
          {selectedClass ? (
            <>
              {/* Header Card */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded uppercase">
                      {selectedClass.code}
                    </span>
                    <h2 className="text-xl font-bold text-slate-800 mt-1">{selectedClass.name}</h2>
                    <p className="text-xs text-slate-500 mt-0.5">Khóa: {selectedClass.courseId?.name}</p>
                  </div>
                  <button
                    onClick={() => setIsEnrollOpen(true)}
                    className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" /> Gán Thêm Học Viên
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 pt-4 border-t border-slate-100 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-blue-600" />
                    <div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase">Giáo viên</div>
                      <div className="font-semibold text-slate-800">{selectedClass.teacherId?.fullName}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-600" />
                    <div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase">Lịch học</div>
                      <div className="font-semibold text-slate-800">{selectedClass.scheduleDescription}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-rose-600" />
                    <div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase">Phòng học</div>
                      <div className="font-semibold text-slate-800">{selectedClass.room}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Students in Class */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
                <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center justify-between">
                  <span>Danh Sách Học Viên Trong Lớp ({selectedClass.studentIds?.length || 0})</span>
                  <Users className="w-4 h-4 text-emerald-600" />
                </h3>
                {selectedClass.studentIds?.length === 0 ? (
                  <div className="text-center py-6 text-slate-400 text-xs">
                    Chưa có học viên nào. Hãy nhấn 'Gán Thêm Học Viên'.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {selectedClass.studentIds.map((st) => (
                      <div
                        key={st._id}
                        className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center">
                            {st.fullName?.charAt(0)}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-800">{st.fullName}</div>
                            <div className="text-[10px] text-slate-500 font-mono">{st.email}</div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveStudent(st._id)}
                          className="text-rose-500 hover:text-rose-700 text-[11px] font-medium"
                        >
                          Xóa
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Sessions List */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
                <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center justify-between">
                  <span>Tiến Trình Các Buổi Học ({selectedClass.sessions?.length || 0})</span>
                  <Calendar className="w-4 h-4 text-blue-600" />
                </h3>
                <div className="space-y-2">
                  {selectedClass.sessions?.map((sess) => (
                    <div
                      key={sess._id}
                      className="p-3 rounded-xl border border-slate-100 flex items-center justify-between text-xs bg-slate-50/30"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                          Buổi {sess.sessionNumber}
                        </span>
                        <div>
                          <div className="font-semibold text-slate-800">{sess.title}</div>
                          <div className="text-[11px] text-slate-500">
                            {new Date(sess.date).toLocaleDateString('vi-VN')} • {sess.startTime} - {sess.endTime}
                          </div>
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        sess.status === 'completed'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {sess.status === 'completed' ? 'Đã học' : 'Dự kiến'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="p-12 text-center text-slate-400 bg-white rounded-2xl border">
              Chọn lớp học để xem chi tiết.
            </div>
          )}
        </div>
      </div>

      {/* Modal: Create Class */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Tạo Lớp Học Mới">
        <form onSubmit={handleCreateClass} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Thuộc Khóa Học *</label>
            <select
              required
              value={formData.courseId}
              onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
            >
              <option value="">-- Chọn khóa học --</option>
              {courses.map(c => <option key={c._id} value={c._id}>{c.name} ({c.code})</option>)}
            </select>
          </div>

          <div className="rounded-xl border border-blue-100 bg-blue-50 p-3 text-xs">
            <p className="font-semibold text-blue-900">Mã lớp và tên lớp được tạo tự động</p>
            {selectedCourse ? (
              <div className="mt-1.5 space-y-1 text-blue-800">
                <p>Mã lớp dự kiến: <span className="font-mono font-bold">{selectedCourse.code}-L{generatedClassNumber}</span></p>
                <p>Tên hiển thị: <span className="font-semibold">{selectedCourse.name} - Lớp {generatedClassNumber}</span></p>
              </div>
            ) : (
              <p className="mt-1 text-blue-700">Chọn khóa học để xem mã lớp và tên hiển thị dự kiến.</p>
            )}
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Phân công Giáo viên phụ trách *</label>
            <select
              required
              value={formData.teacherId}
              onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
            >
              <option value="">-- Chọn giáo viên --</option>
              {teachers.map(t => <option key={t._id} value={t._id}>{t.fullName} ({t.email})</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Lịch học</label>
              <input
                type="text"
                value={formData.scheduleDescription}
                onChange={(e) => setFormData({ ...formData, scheduleDescription: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                placeholder="Thứ 3 - Thứ 5 (18:30 - 20:30)"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Phòng học</label>
              <input
                type="text"
                value={formData.room}
                onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                placeholder="Phòng Lab 01"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Ngày bắt đầu</label>
            <input
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <button type="button" onClick={() => setIsCreateOpen(false)} className="px-4 py-2 border rounded-xl">Hủy</button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-xl">Tạo Lớp</button>
          </div>
        </form>
      </Modal>

      {/* Modal: Enroll Student */}
      <Modal isOpen={isEnrollOpen} onClose={() => setIsEnrollOpen(false)} title={`Gán Học Viên vào ${selectedClass?.name}`}>
        <form onSubmit={handleEnrollStudent} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Chọn Học Viên *</label>
            <select
              required
              value={enrollStudentId}
              onChange={(e) => setEnrollStudentId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
            >
              <option value="">-- Chọn học viên --</option>
              {students
                .filter(s => !selectedClass?.studentIds?.some(st => st._id === s._id))
                .map(s => (
                  <option key={s._id} value={s._id}>{s.fullName} ({s.email})</option>
                ))}
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <button type="button" onClick={() => setIsEnrollOpen(false)} className="px-4 py-2 border rounded-xl">Hủy</button>
            <button type="submit" className="px-4 py-2 bg-purple-600 text-white font-semibold rounded-xl">Thêm Học Viên</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
