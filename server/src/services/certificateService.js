const { Certificate } = require('../models/Certificate');
const { Class } = require('../models/Class');
const { ParentStudentLink } = require('../models/Profiles');
const attendanceService = require('./attendanceService');
const analyticsService = require('./analyticsService');
const notificationService = require('./notificationService');

class CertificateService {
  async listCertificates({ studentId, courseId }) {
    const query = {};
    if (studentId) query.studentId = studentId;
    if (courseId) query.courseId = courseId;

    return await Certificate.find(query)
      .populate('studentId', 'fullName email phone')
      .populate('courseId', 'name code')
      .populate('classId', 'name code')
      .populate('approvedBy', 'fullName')
      .sort({ createdAt: -1 });
  }

  async checkEligibility(studentId, classId) {
    const classObj = await Class.findById(classId).populate('courseId');
    if (!classObj) throw new Error('Không tìm thấy lớp học');

    const attendanceStats = await attendanceService.getStudentAttendance(studentId, classId);
    const progress = await analyticsService.getStudentProgress(studentId);

    const attendanceRate = attendanceStats.stats.attendanceRate;
    const avgScore = progress.averageScore;

    const isAttendanceEligible = attendanceRate >= 75;
    const isScoreEligible = avgScore >= 60;
    const isEligible = isAttendanceEligible && isScoreEligible;

    return {
      isEligible,
      criteria: {
        attendanceRate: { required: 75, actual: attendanceRate, passed: isAttendanceEligible },
        averageScore: { required: 60, actual: avgScore, passed: isScoreEligible }
      },
      class: classObj
    };
  }

  async issueCertificate({ studentId, classId, approvedByUserId }) {
    const classObj = await Class.findById(classId);
    if (!classObj) throw new Error('Lớp học không tồn tại');

    const eligibility = await this.checkEligibility(studentId, classId);
    if (!eligibility.isEligible) {
      throw new Error('Học viên chưa đủ điều kiện cấp chứng nhận (chuyên cần >= 75% và điểm TB >= 60)');
    }

    // Check if certificate already issued
    const existing = await Certificate.findOne({ studentId, classId });
    if (existing) {
      return existing;
    }

    const certCount = await Certificate.countDocuments();
    const certificateCode = `SEMS-CERT-${new Date().getFullYear()}-${String(certCount + 1).padStart(5, '0')}`;

    const cert = new Certificate({
      certificateCode,
      studentId,
      courseId: classObj.courseId,
      classId,
      issueDate: new Date(),
      averageScore: eligibility.criteria.averageScore.actual,
      attendanceRate: eligibility.criteria.attendanceRate.actual,
      approvedBy: approvedByUserId,
      status: 'valid'
    });

    const saved = await cert.save();

    // Notify student and parent
    try {
      await notificationService.createNotification({
        recipientId: studentId,
        title: 'Chứng nhận tốt nghiệp đã được cấp',
        message: `Chúc mừng bạn đã hoàn thành khóa học! Mã chứng nhận của bạn: ${certificateCode}`,
        type: 'certificate',
        link: '/student/certificates'
      });

      const parentLinks = await ParentStudentLink.find({ studentUserId: studentId, status: 'verified' });
      for (const link of parentLinks) {
        await notificationService.createNotification({
          recipientId: link.parentUserId,
          title: 'Chứng nhận tốt nghiệp của con',
          message: `Chúc mừng! Con bạn đã hoàn thành khóa học và được cấp chứng nhận ${certificateCode}.`,
          type: 'certificate',
          link: '/parent'
        });
      }
    } catch (notifErr) {
      console.warn('[Notification Error]', notifErr.message);
    }

    return saved;
  }
}

module.exports = new CertificateService();
