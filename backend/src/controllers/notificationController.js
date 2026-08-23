const notificationService = require('../services/notificationService');
const { sendSuccess, sendError } = require('../utils/response');

const getNotifications = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id || 'ALL';
    const result = await notificationService.getNotifications(userId, req.query);
    return sendSuccess(res, 'Notifications retrieved', result, 200);
  } catch (err) {
    return sendError(res, err.message, null, 500);
  }
};

const markAsRead = async (req, res) => {
  try {
    const notif = await notificationService.markAsRead(req.params.id);
    return sendSuccess(res, 'Notification marked as read', notif, 200);
  } catch (err) {
    return sendError(res, err.message, null, 400);
  }
};

const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id || 'ALL';
    const result = await notificationService.markAllAsRead(userId);
    return sendSuccess(res, 'All notifications marked as read', result, 200);
  } catch (err) {
    return sendError(res, err.message, null, 500);
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead
};
