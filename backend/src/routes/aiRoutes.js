// backend/src/routes/aiRoutes.js
const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const { protect } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleMiddleware');

const multer = require('multer');
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB max file size
});

// Public or Protected AI Endpoints
router.post('/predict', aiController.predict);
router.post('/predict/batch', aiController.predictBatch);
router.get('/dataset-info', aiController.getDatasetInfo);
router.get('/metrics', aiController.getMetrics);
router.get('/models', aiController.getModels);
router.get('/reports', aiController.listReports); // Updated to new endpoint
router.get('/reports/download/:filename', aiController.downloadReport);
router.get('/confusion-matrix', aiController.getConfusionMatrix);
router.get('/classification-report', aiController.getClassificationReport);
router.get('/risk-score', aiController.getRiskScore);
router.get('/model-status', aiController.getModelStatus);

// New admin endpoint for uploading a dataset and testing the model
router.post('/test-upload', protect, authorize('admin', 'analyst'), upload.single('dataset'), aiController.testUpload);

// Protected Admin / Analyst Management Endpoints
router.post('/train', protect, authorize('admin', 'analyst'), aiController.train);
router.post('/evaluate', protect, authorize('admin', 'analyst'), aiController.evaluate);

module.exports = router;
