const dashboardService = require('../services/dashboardService');
const { sendSuccess } = require('../utils/response');

const getAnalystDashboard = async (req, res, next) => {
  try {
    const data = await dashboardService.getAnalystDashboardData();
    return sendSuccess(res, 'Security Analyst Dashboard metrics retrieved successfully', data);
  } catch (error) {
    next(error);
  }
};

const getAdminDashboard = async (req, res, next) => {
  try {
    const data = await dashboardService.getAdminDashboardData();
    return sendSuccess(res, 'Administrator Dashboard metrics retrieved successfully', data);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAnalystDashboard,
  getAdminDashboard
};
