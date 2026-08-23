const path = require('path');
const fs = require('fs');
const reportingService = require('../services/reportingService');
const monitoringService = require('../services/monitoringService');
const { sendSuccess, sendError } = require('../utils/response');

const getReports = async (req, res) => {
  try {
    const reports = await reportingService.getReportsList(req.query);
    return sendSuccess(res, 'Reports list retrieved', reports, 200);
  } catch (err) {
    return sendError(res, err.message, null, 500);
  }
};

const generateReport = async (req, res) => {
  try {
    const userName = req.user?.name || req.user?.email || 'SOC Admin';
    const report = await reportingService.generateReport({ ...req.body, generatedBy: userName });
    return sendSuccess(res, 'Report generated successfully', report, 201);
  } catch (err) {
    return sendError(res, err.message, null, 500);
  }
};

const getReportById = async (req, res) => {
  try {
    const report = await reportingService.getReportById(req.params.id);
    return sendSuccess(res, 'Report details retrieved', report, 200);
  } catch (err) {
    return sendError(res, err.message, null, 404);
  }
};

const downloadReport = async (req, res) => {
  try {
    const filename = req.params.filename;
    const reportsDir = path.join(__dirname, '../../ai/reports');
    const filePath = path.join(reportsDir, filename);

    if (!fs.existsSync(filePath)) {
      return sendError(res, 'Report file not found', null, 404);
    }
    return res.download(filePath);
  } catch (err) {
    return sendError(res, err.message, null, 500);
  }
};

const getServicesHealth = async (req, res) => {
  try {
    const health = await monitoringService.getSystemHealth();
    return sendSuccess(res, 'System services health retrieved', health, 200);
  } catch (err) {
    return sendError(res, err.message, null, 500);
  }
};

module.exports = {
  getReports,
  generateReport,
  getReportById,
  downloadReport,
  getServicesHealth
};
