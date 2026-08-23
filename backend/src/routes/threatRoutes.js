const express = require('express');
const router = express.Router();
const threatController = require('../controllers/threatController');
const { protect } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleMiddleware');

router.get('/', protect, authorize('analyst', 'admin'), threatController.getThreats);
router.patch('/:id/status', protect, authorize('analyst', 'admin'), threatController.updateStatus);

module.exports = router;
