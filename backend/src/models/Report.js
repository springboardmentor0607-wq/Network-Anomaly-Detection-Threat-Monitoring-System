const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema(
  {
    reportId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    title: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['THREAT_INTEL', 'SECURITY_ANALYTICS', 'ALERT_SUMMARY', 'INCIDENT_REPORT', 'ATTACK_TREND', 'EXECUTIVE_SUMMARY'],
      default: 'EXECUTIVE_SUMMARY'
    },
    format: {
      type: String,
      enum: ['JSON', 'CSV', 'PDF'],
      default: 'JSON'
    },
    dateRange: {
      type: String,
      enum: ['TODAY', 'LAST_7_DAYS', 'LAST_30_DAYS', 'CUSTOM'],
      default: 'LAST_7_DAYS'
    },
    generatedBy: {
      type: String,
      default: 'System'
    },
    fileUrl: {
      type: String,
      required: true
    },
    fileSize: {
      type: String,
      default: '1 KB'
    },
    summary: {
      type: String,
      default: ''
    },
    metricsData: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
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

reportSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Report', reportSchema);
