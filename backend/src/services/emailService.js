const logger = require('../utils/logger');

const sendAlertEmail = async ({ to, subject, text, html }) => {
  const isEnabled = process.env.ALERT_EMAIL_ENABLED === 'true';

  if (!isEnabled) {
    logger.info(`Email notifications disabled (ALERT_EMAIL_ENABLED!=true). Skipped sending email to ${to}`);
    return { success: false, reason: 'Email disabled in environment configuration' };
  }

  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT || 587;
  const smtpUser = process.env.SMTP_USER;

  if (!smtpHost || !smtpUser) {
    logger.warn(`SMTP credentials unconfigured (SMTP_HOST / SMTP_USER missing). Skipped email to ${to}`);
    return { success: false, reason: 'SMTP credentials missing' };
  }

  try {
    // Abstracted Email Provider Execution
    logger.info(`[Email Service Abstraction] Simulating SMTP dispatch to ${to} via ${smtpHost}:${smtpPort}. Subject: "${subject}"`);
    return { success: true, timestamp: new Date().toISOString() };
  } catch (err) {
    logger.error(`Failed to send email to ${to}: ${err.message}`);
    return { success: false, error: err.message };
  }
};

module.exports = {
  sendAlertEmail
};
