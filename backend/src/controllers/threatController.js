const threatService = require('../services/threatService');
const { sendSuccess } = require('../utils/response');

const getThreats = async (req, res, next) => {
  try {
    const threats = await threatService.getThreats(req.query);
    return sendSuccess(res, 'Threat alerts list retrieved', threats);
  } catch (error) {
    next(error);
  }
};

const updateStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const updated = await threatService.updateThreatStatus(id, status);
    return sendSuccess(res, 'Threat status updated', updated);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getThreats,
  updateStatus
};
