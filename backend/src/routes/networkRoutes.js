const express = require('express');
const router = express.Router();
const networkController = require('../controllers/networkController');
const { protect } = require('../middlewares/authMiddleware');

router.get('/stats', protect, networkController.getNetworkStats);

module.exports = router;
