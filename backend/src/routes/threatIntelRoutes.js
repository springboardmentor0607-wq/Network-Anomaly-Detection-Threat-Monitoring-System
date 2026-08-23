const express = require('express');
const router = express.Router();
const threatIntelController = require('../controllers/threatIntelController');
const { protect } = require('../middlewares/authMiddleware');

router.get('/overview', protect, threatIntelController.getOverview);
router.get('/reports', protect, threatIntelController.getReports);
router.get('/:id', protect, threatIntelController.getById);
router.post('/:id/enrich', protect, threatIntelController.enrichIndicator);

module.exports = router;
