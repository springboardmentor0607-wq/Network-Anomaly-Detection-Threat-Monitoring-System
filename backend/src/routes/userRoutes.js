const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleMiddleware');

router.use(protect);

router.get('/', authorize('admin'), userController.getUsers);
router.post('/', authorize('admin'), userController.createUser);
router.put('/:id', authorize('admin'), userController.updateUser);
router.delete('/:id', authorize('admin'), userController.deleteUser);
router.get('/audit-logs', authorize('admin'), userController.getAuditLogs);
router.get('/teams', authorize('admin'), userController.getTeams);

module.exports = router;
