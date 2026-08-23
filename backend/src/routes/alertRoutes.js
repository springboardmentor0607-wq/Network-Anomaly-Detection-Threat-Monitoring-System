const express = require('express');
const router = express.Router();
const alertController = require('../controllers/alertController');
const { protect } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleMiddleware');

router.get('/', protect, alertController.getAlerts);
router.post('/', protect, alertController.createAlert);
router.get('/:id', protect, alertController.getAlertById);
router.patch('/:id/status', protect, alertController.updateAlertStatus);
router.patch('/:id/assign', protect, authorize('admin', 'analyst'), alertController.assignAlert);

module.exports = router;
