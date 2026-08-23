const systemService = require('../services/systemService');
const { sendSuccess } = require('../utils/response');

const getSystemStatus = async (req, res, next) => {
  try {
    const status = await systemService.getSystemMetrics();
    return sendSuccess(res, 'System status metrics retrieved', status);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSystemStatus
};
