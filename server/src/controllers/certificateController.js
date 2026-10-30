const certificateService = require('../services/certificateService');
const { sendSuccess } = require('../utils/response');

class CertificateController {
  async listCertificates(req, res, next) {
    try {
      const { studentId, courseId } = req.query;
      let finalStudentId = studentId;

      if (req.user.role === 'student') {
        finalStudentId = req.user._id;
      }

      const certificates = await certificateService.listCertificates({
        studentId: finalStudentId,
        courseId
      });
      return sendSuccess(res, certificates);
    } catch (err) {
      next(err);
    }
  }

  async checkEligibility(req, res, next) {
    try {
      const { studentId, classId } = req.params;
      const result = await certificateService.checkEligibility(studentId, classId);
      return sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  async issueCertificate(req, res, next) {
    try {
      const { studentId, classId } = req.body;
      const cert = await certificateService.issueCertificate({
        studentId,
        classId,
        approvedByUserId: req.user._id
      });
      return sendSuccess(res, cert, 'Cấp chứng nhận thành công', 201);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new CertificateController();
