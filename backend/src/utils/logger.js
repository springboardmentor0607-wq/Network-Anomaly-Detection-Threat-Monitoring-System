// backend/src/utils/logger.js
const winston = require('winston');
const path = require('path');

// Absolute directory for logs inside the container
const LOG_DIR = path.join(__dirname, '../../logs'); // resolves to /app/logs

const logFormat = winston.format.printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} [${level.toUpperCase()}]: ${stack || message}`;
});

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'netshield-backend' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        logFormat
      )
    }),
    // Error‑only file
    new winston.transports.File({
      filename: path.join(LOG_DIR, 'error.log'),
      level: 'error'
    }),
    // Combined log file
    new winston.transports.File({
      filename: path.join(LOG_DIR, 'combined.log')
    })
  ]
});

module.exports = logger;
