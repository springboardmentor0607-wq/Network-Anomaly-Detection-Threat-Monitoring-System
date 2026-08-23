const express = require('express');
const router = express.Router();
const systemController = require('../controllers/systemController');
const { protect } = require('../middlewares/authMiddleware');

router.get('/status', protect, systemController.getSystemStatus);

module.exports = router;
