const logger = require('../utils/logger');
const { sendError } = require('../utils/response');

const errorHandler = (err, req, res, next) => {
  logger.error(err.stack || err.message);

  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  return sendError(res, err.message || 'Internal Server Error', null, statusCode);
};

const notFound = (req, res, next) => {
  return sendError(res, `Route not found - ${req.originalUrl}`, null, 404);
};

module.exports = { errorHandler, notFound };
