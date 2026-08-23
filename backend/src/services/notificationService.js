const Notification = require('../models/Notification');
const emailService = require('./emailService');

const createNotification = async (data = {}) => {
  const notificationId = `NOTIF-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;

  const {
    userId = 'ALL',
    type = 'CRITICAL_ALERT',
    title = 'Security Alert',
    message = '',
    severity = 'HIGH',
    relatedAlert = null,
    relatedIncident = null
  } = data;

  const notification = await Notification.create({
    notificationId,
    userId,
    type,
    title,
    message,
    severity,
    relatedAlert,
    relatedIncident,
    read: false
  });

  // Dispatch email for High or Critical notifications
  if (['CRITICAL', 'HIGH'].includes(severity)) {
    emailService.sendAlertEmail({
      to: process.env.ALERT_NOTIFICATION_EMAIL || 'soc-alerts@netshield.ai',
      subject: `[NetShield SOC Alert] ${severity}: ${title}`,
      text: `${title}\n\n${message}\n\nSeverity: ${severity}\nTimestamp: ${new Date().toISOString()}`
    }).catch(err => console.warn('Email dispatch notice:', err.message));
  }

  return notification;
};

const getNotifications = async (userId = 'ALL', query = {}) => {
  const limit = parseInt(query.limit) || 20;
  const filter = {
    $or: [{ userId }, { userId: 'ALL' }]
  };

  if (query.read !== undefined) {
    filter.read = query.read === 'true';
  }

  const [data, unreadCount] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1 }).limit(limit).lean(),
    Notification.countDocuments({ ...filter, read: false })
  ]);

  return {
    data,
    unreadCount
  };
};

const markAsRead = async (notificationId) => {
  const notif = await Notification.findOneAndUpdate(
    { notificationId },
    { $set: { read: true } },
    { new: true }
  );
  return notif;
};

const markAllAsRead = async (userId = 'ALL') => {
  const filter = {
    $or: [{ userId }, { userId: 'ALL' }],
    read: false
  };

  await Notification.updateMany(filter, { $set: { read: true } });
  return { success: true };
};

module.exports = {
  createNotification,
  getNotifications,
  markAsRead,
  markAllAsRead
};
