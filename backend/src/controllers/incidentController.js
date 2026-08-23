const incidentService = require('../services/incidentService');
const { sendSuccess, sendError } = require('../utils/response');

const getIncidents = async (req, res) => {
  try {
    const result = await incidentService.getIncidents(req.query);
    return sendSuccess(res, 'Incidents retrieved successfully', result, 200);
  } catch (err) {
    return sendError(res, err.message, null, 500);
  }
};

const getIncidentById = async (req, res) => {
  try {
    const incident = await incidentService.getIncidentById(req.params.id);
    return sendSuccess(res, 'Incident details retrieved', incident, 200);
  } catch (err) {
    return sendError(res, err.message, null, 404);
  }
};

const createIncident = async (req, res) => {
  try {
    const incident = await incidentService.createIncident(req.body, req.user);
    return sendSuccess(res, 'Incident created successfully', incident, 201);
  } catch (err) {
    return sendError(res, err.message, null, 500);
  }
};

const updateIncidentStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) {
      return sendError(res, 'Status is required', null, 400);
    }
    const incident = await incidentService.updateIncidentStatus(req.params.id, status, req.user);
    return sendSuccess(res, 'Incident status updated', incident, 200);
  } catch (err) {
    return sendError(res, err.message, null, 400);
  }
};

const assignIncident = async (req, res) => {
  try {
    const { assignedTo, assignedToName } = req.body;
    if (!assignedTo) {
      return sendError(res, 'assignedTo is required', null, 400);
    }
    const incident = await incidentService.assignIncident(req.params.id, assignedTo, assignedToName, req.user);
    return sendSuccess(res, 'Incident assigned successfully', incident, 200);
  } catch (err) {
    return sendError(res, err.message, null, 400);
  }
};

const addIncidentNote = async (req, res) => {
  try {
    const { note } = req.body;
    if (!note) {
      return sendError(res, 'Note text is required', null, 400);
    }
    const incident = await incidentService.addIncidentNote(req.params.id, note, req.user);
    return sendSuccess(res, 'Note added to incident', incident, 200);
  } catch (err) {
    return sendError(res, err.message, null, 400);
  }
};

module.exports = {
  getIncidents,
  getIncidentById,
  createIncident,
  updateIncidentStatus,
  assignIncident,
  addIncidentNote
};
