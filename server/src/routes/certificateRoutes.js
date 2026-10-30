const express = require('express');
const router = express.Router();
const certificateController = require('../controllers/certificateController');
const { authenticate, authorize } = require('../middlewares/auth');

router.use(authenticate);

router.get('/', certificateController.listCertificates);
router.get('/eligibility/:studentId/:classId', authorize('admin', 'teacher'), certificateController.checkEligibility);
router.post('/issue', authorize('admin'), certificateController.issueCertificate);

module.exports = router;
