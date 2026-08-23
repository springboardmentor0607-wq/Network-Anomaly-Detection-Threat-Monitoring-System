const datasetService = require('../services/datasetService');
const { sendSuccess } = require('../utils/response');

const getStatus = async (req, res, next) => {
  try {
    const status = await datasetService.getDatasetStatus();
    return sendSuccess(res, 'Dataset status retrieved', status);
  } catch (error) {
    next(error);
  }
};

const getStatistics = async (req, res, next) => {
  try {
    const dataset = req.query.dataset || 'CICIDS2017';
    const stats = await datasetService.getDatasetStatistics(dataset);
    return sendSuccess(res, `Statistics for ${dataset} retrieved`, stats);
  } catch (error) {
    next(error);
  }
};

const getClassDistribution = async (req, res, next) => {
  try {
    const dataset = req.query.dataset || 'CICIDS2017';
    const dist = await datasetService.getClassDistribution(dataset);
    return sendSuccess(res, `Class distribution for ${dataset} retrieved`, dist);
  } catch (error) {
    next(error);
  }
};

const getFeatures = async (req, res, next) => {
  try {
    const dataset = req.query.dataset || 'CICIDS2017';
    const features = await datasetService.getFeaturesMetadata(dataset);
    return sendSuccess(res, `Feature metadata for ${dataset} retrieved`, features);
  } catch (error) {
    next(error);
  }
};

const getPreprocessingReport = async (req, res, next) => {
  try {
    const dataset = req.query.dataset || 'CICIDS2017';
    const report = await datasetService.getDatasetStatistics(dataset);
    return sendSuccess(res, `Preprocessing report for ${dataset} retrieved`, report);
  } catch (error) {
    next(error);
  }
};

const runPreprocessing = async (req, res, next) => {
  try {
    const dataset = req.body.dataset || 'CICIDS2017';
    const result = await datasetService.runPreprocessingPipeline(dataset);
    return sendSuccess(res, `Preprocessing pipeline executed for ${dataset}`, result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getStatus,
  getStatistics,
  getClassDistribution,
  getFeatures,
  getPreprocessingReport,
  runPreprocessing
};
