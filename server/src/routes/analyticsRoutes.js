const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { authenticate } = require('../middlewares/auth');

router.use(authenticate);

router.get('/overview', analyticsController.getOverview);
router.get('/students/:studentId/progress', analyticsController.getStudentProgress);
router.get('/rankings', analyticsController.getRankings);

module.exports = router;
