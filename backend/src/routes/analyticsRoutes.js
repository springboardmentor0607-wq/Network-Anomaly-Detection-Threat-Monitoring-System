const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { protect } = require('../middlewares/authMiddleware');

router.get('/overview', protect, analyticsController.getOverview);
router.get('/threats', protect, analyticsController.getOverview);
router.get('/attacks', protect, analyticsController.getAttackDistribution);
router.get('/severity', protect, analyticsController.getSeverityDistribution);
router.get('/risk', protect, analyticsController.getRiskDistribution);
router.get('/timeline', protect, analyticsController.getTimeline);
router.get('/protocols', protect, analyticsController.getProtocolDistribution);
router.get('/sources', protect, analyticsController.getTopSources);
router.get('/destinations', protect, analyticsController.getTopDestinations);
router.get('/metrics', protect, analyticsController.getSocMetrics);

module.exports = router;
