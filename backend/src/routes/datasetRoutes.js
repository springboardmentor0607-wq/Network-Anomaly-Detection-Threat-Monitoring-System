const express = require('express');
const router = express.Router();
const datasetController = require('../controllers/datasetController');
const { protect } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleMiddleware');

router.use(protect);

router.get('/status', datasetController.getStatus);
router.get('/statistics', datasetController.getStatistics);
router.get('/class-distribution', datasetController.getClassDistribution);
router.get('/features', datasetController.getFeatures);
router.get('/preprocessing-report', datasetController.getPreprocessingReport);
router.post('/run-preprocessing', authorize('admin'), datasetController.runPreprocessing);

module.exports = router;
