const threatIntelService = require('../services/threatIntelService');
const { sendSuccess, sendError } = require('../utils/response');

const getOverview = async (req, res) => {
  try {
    const data = await threatIntelService.getThreatIntelOverview();
    return sendSuccess(res, 'Threat intelligence overview retrieved', data, 200);
  } catch (err) {
    return sendError(res, err.message, null, 500);
  }
};

const getReports = async (req, res) => {
  try {
    const result = await threatIntelService.getThreatIntelList(req.query);
    return sendSuccess(res, 'Threat intelligence reports retrieved', result, 200);
  } catch (err) {
    return sendError(res, err.message, null, 500);
  }
};

const getById = async (req, res) => {
  try {
    const item = await threatIntelService.getThreatIntelById(req.params.id);
    return sendSuccess(res, 'Threat intelligence detail retrieved', item, 200);
  } catch (err) {
    return sendError(res, err.message, null, 404);
  }
};

const enrichIndicator = async (req, res) => {
  try {
    const item = await threatIntelService.enrichThreatIntel(req.params.id);
    return sendSuccess(res, 'Indicator enriched via external threat intelligence provider', item, 200);
  } catch (err) {
    return sendError(res, err.message, null, 400);
  }
};

module.exports = {
  getOverview,
  getReports,
  getById,
  enrichIndicator
};
