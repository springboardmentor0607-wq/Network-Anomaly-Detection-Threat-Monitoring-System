const express = require('express');
const router = express.Router();
const incidentController = require('../controllers/incidentController');
const { protect } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleMiddleware');

router.get('/', protect, incidentController.getIncidents);
router.post('/', protect, incidentController.createIncident);
router.get('/:id', protect, incidentController.getIncidentById);
router.patch('/:id/status', protect, incidentController.updateIncidentStatus);
router.patch('/:id/assign', protect, authorize('admin', 'analyst'), incidentController.assignIncident);
router.post('/:id/notes', protect, incidentController.addIncidentNote);

module.exports = router;
