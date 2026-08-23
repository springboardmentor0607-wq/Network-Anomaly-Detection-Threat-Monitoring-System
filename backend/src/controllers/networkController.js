const networkService = require('../services/networkService');
const { sendSuccess } = require('../utils/response');

const getNetworkStats = async (req, res, next) => {
  try {
    const stats = await networkService.getNetworkStats();
    return sendSuccess(res, 'Network telemetry and device metrics retrieved', stats);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getNetworkStats
};
