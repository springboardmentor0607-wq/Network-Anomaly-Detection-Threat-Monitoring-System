const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { protect } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleMiddleware');

router.get('/analyst', protect, authorize('analyst', 'admin'), dashboardController.getAnalystDashboard);
router.get('/admin', protect, authorize('admin'), dashboardController.getAdminDashboard);

module.exports = router;
