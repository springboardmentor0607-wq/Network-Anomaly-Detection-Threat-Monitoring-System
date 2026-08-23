const alertService = require('../services/alertService');
const { sendSuccess, sendError } = require('../utils/response');

const getAlerts = async (req, res) => {
  try {
    const result = await alertService.getAlerts(req.query);
    return sendSuccess(res, 'Alerts retrieved successfully', result, 200);
  } catch (err) {
    return sendError(res, err.message, null, 500);
  }
};

const getAlertById = async (req, res) => {
  try {
    const alert = await alertService.getAlertById(req.params.id);
    return sendSuccess(res, 'Alert details retrieved', alert, 200);
  } catch (err) {
    return sendError(res, err.message, null, 404);
  }
};

const createAlert = async (req, res) => {
  try {
    const alert = await alertService.processPrediction(req.body);
    return sendSuccess(res, 'Alert created/updated successfully', alert, 201);
  } catch (err) {
    return sendError(res, err.message, null, 500);
  }
};

const updateAlertStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) {
      return sendError(res, 'Status is required', null, 400);
    }
    const alert = await alertService.updateAlertStatus(req.params.id, status, req.user);
    return sendSuccess(res, 'Alert status updated successfully', alert, 200);
  } catch (err) {
    return sendError(res, err.message, null, 400);
  }
};

const assignAlert = async (req, res) => {
  try {
    const { assignedTo, assignedToName } = req.body;
    if (!assignedTo) {
      return sendError(res, 'assignedTo is required', null, 400);
    }
    const alert = await alertService.assignAlert(req.params.id, assignedTo, assignedToName, req.user);
    return sendSuccess(res, 'Alert assigned successfully', alert, 200);
  } catch (err) {
    return sendError(res, err.message, null, 400);
  }
};

module.exports = {
  getAlerts,
  getAlertById,
  createAlert,
  updateAlertStatus,
  assignAlert
};
