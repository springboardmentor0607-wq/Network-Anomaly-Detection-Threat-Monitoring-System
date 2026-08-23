const analyticsService = require('../services/analyticsService');
const { sendSuccess, sendError } = require('../utils/response');

const getOverview = async (req, res) => {
  try {
    const data = await analyticsService.getOverview(req.query.dateRange);
    return sendSuccess(res, 'Analytics overview retrieved', data, 200);
  } catch (err) {
    return sendError(res, err.message, null, 500);
  }
};

const getAttackDistribution = async (req, res) => {
  try {
    const data = await analyticsService.getAttackDistribution(req.query.dateRange);
    return sendSuccess(res, 'Attack category distribution retrieved', data, 200);
  } catch (err) {
    return sendError(res, err.message, null, 500);
  }
};

const getSeverityDistribution = async (req, res) => {
  try {
    const data = await analyticsService.getSeverityDistribution(req.query.dateRange);
    return sendSuccess(res, 'Severity distribution retrieved', data, 200);
  } catch (err) {
    return sendError(res, err.message, null, 500);
  }
};

const getRiskDistribution = async (req, res) => {
  try {
    const data = await analyticsService.getRiskDistribution(req.query.dateRange);
    return sendSuccess(res, 'Risk distribution retrieved', data, 200);
  } catch (err) {
    return sendError(res, err.message, null, 500);
  }
};

const getTimeline = async (req, res) => {
  try {
    const data = await analyticsService.getTimeline(req.query.dateRange);
    return sendSuccess(res, 'Attack volume timeline retrieved', data, 200);
  } catch (err) {
    return sendError(res, err.message, null, 500);
  }
};

const getProtocolDistribution = async (req, res) => {
  try {
    const data = await analyticsService.getProtocolDistribution(req.query.dateRange);
    return sendSuccess(res, 'Protocol distribution retrieved', data, 200);
  } catch (err) {
    return sendError(res, err.message, null, 500);
  }
};

const getTopSources = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    const data = await analyticsService.getTopSources(limit);
    return sendSuccess(res, 'Top attack source IPs retrieved', data, 200);
  } catch (err) {
    return sendError(res, err.message, null, 500);
  }
};

const getTopDestinations = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    const data = await analyticsService.getTopDestinations(limit);
    return sendSuccess(res, 'Top target destination IPs retrieved', data, 200);
  } catch (err) {
    return sendError(res, err.message, null, 500);
  }
};

const getSocMetrics = async (req, res) => {
  try {
    const data = await analyticsService.getSocMetrics();
    return sendSuccess(res, 'SOC operational metrics (MTTA/MTTR) retrieved', data, 200);
  } catch (err) {
    return sendError(res, err.message, null, 500);
  }
};

module.exports = {
  getOverview,
  getAttackDistribution,
  getSeverityDistribution,
  getRiskDistribution,
  getTimeline,
  getProtocolDistribution,
  getTopSources,
  getTopDestinations,
  getSocMetrics
};
