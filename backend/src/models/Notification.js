const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    notificationId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    userId: {
      type: String,
      default: 'ALL',
      index: true
    },
    type: {
      type: String,
      enum: ['CRITICAL_ALERT', 'HIGH_ALERT', 'INCIDENT_ASSIGNMENT', 'INCIDENT_UPDATE', 'SYSTEM_WARNING', 'REPORT_GENERATED'],
      default: 'CRITICAL_ALERT'
    },
    title: {
      type: String,
      required: true
    },
    message: {
      type: String,
      required: true
    },
    severity: {
      type: String,
      enum: ['INFO', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      default: 'HIGH'
    },
    relatedAlert: {
      type: String,
      default: null
    },
    relatedIncident: {
      type: String,
      default: null
    },
    read: {
      type: Boolean,
      default: false,
      index: true
    },
    isDemoData: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

notificationSchema.index({ userId: 1, read: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
