const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { protect } = require('../middlewares/authMiddleware');

router.get('/', protect, reportController.getReports);
router.post('/generate', protect, reportController.generateReport);
router.get('/:id', protect, reportController.getReportById);
router.get('/:filename/download', reportController.downloadReport);
router.get('/health/services', reportController.getServicesHealth);

module.exports = router;
