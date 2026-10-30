import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Award, CheckCircle, GraduationCap, Printer } from 'lucide-react';

export default function StudentCertificates() {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCertificates();
  }, []);

  const fetchCertificates = async () => {
    try {
      const res = await api.get('/certificates');
      setCertificates(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 no-print">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Chứng Nhận Tốt Nghiệp Khóa Học</h1>
          <p className="text-sm text-slate-500 mt-1">
            Ghi nhận kết quả học tập và năng lực đầu ra khi đạt chuẩn chuyên cần và điểm số quy định.
          </p>
        </div>
        {certificates.length > 0 && (
          <button
            onClick={() => window.print()}
            className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-xs flex items-center gap-2 cursor-pointer transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>In / Lưu PDF Chứng Nhận</span>
          </button>
        )}
      </div>

      <div className="space-y-6">
        {certificates.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center text-slate-400 border border-slate-200">
            Bạn chưa có chứng nhận nào được cấp. Hãy hoàn thành đủ các bài tập và duy trì chuyên cần &gt; 75% nhé!
          </div>
        ) : (
          certificates.map((cert) => (
            <div
              key={cert._id}
              className="print-certificate relative overflow-hidden bg-gradient-to-br from-amber-50 via-white to-orange-50 rounded-3xl p-8 sm:p-12 border-2 border-amber-300 shadow-xl max-w-2xl mx-auto text-center space-y-5"
            >
              <div className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span>Xác thực hợp lệ</span>
              </div>

              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center mx-auto shadow-md">
                <GraduationCap className="w-9 h-9" />
              </div>

              <div>
                <span className="text-xs font-bold tracking-widest text-amber-700 uppercase">
                  Chứng Nhận Hoàn Thành Khóa Học
                </span>
                <h2 className="text-2xl font-extrabold text-slate-800 mt-1 font-serif">
                  {cert.courseId?.name}
                </h2>
              </div>

              <div className="py-2">
                <p className="text-xs text-slate-500">Trân trọng trao tặng học viên</p>
                <h3 className="text-xl font-bold text-slate-900 mt-0.5">{cert.studentId?.fullName}</h3>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  Đã hoàn thành xuất sắc toàn bộ nội dung chương trình với điểm trung bình{' '}
                  <strong className="text-amber-700">{cert.averageScore}/100</strong> và tỷ lệ chuyên cần{' '}
                  <strong className="text-amber-700">{cert.attendanceRate}%</strong>.
                </p>
              </div>

              <div className="pt-6 border-t border-amber-200/80 flex items-center justify-between text-xs text-slate-600">
                <div className="text-left">
                  <span className="text-[10px] text-slate-400 block uppercase font-mono">Mã chứng nhận</span>
                  <strong className="font-mono text-slate-800">{cert.certificateCode}</strong>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block uppercase">Ngày cấp</span>
                  <strong className="text-slate-800">{new Date(cert.issueDate).toLocaleDateString('vi-VN')}</strong>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
