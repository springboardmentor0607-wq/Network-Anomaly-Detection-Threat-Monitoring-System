const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema(
  {
    alertId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true
    },
    sourceIp: {
      type: String,
      default: '0.0.0.0',
      index: true
    },
    destinationIp: {
      type: String,
      default: '0.0.0.0'
    },
    sourcePort: {
      type: Number,
      default: 0
    },
    destinationPort: {
      type: Number,
      default: 0
    },
    protocol: {
      type: String,
      default: 'TCP'
    },
    attackType: {
      type: String,
      required: true,
      index: true
    },
    category: {
      type: String,
      default: 'General Anomaly'
    },
    severity: {
      type: String,
      enum: ['INFO', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      default: 'MEDIUM',
      index: true
    },
    confidenceScore: {
      type: Number,
      default: 0.90
    },
    riskScore: {
      type: Number,
      default: 50
    },
    modelUsed: {
      type: String,
      default: 'Random Forest'
    },
    status: {
      type: String,
      enum: ['DETECTED', 'NEW', 'ACKNOWLEDGED', 'INVESTIGATING', 'RESOLVED', 'CLOSED'],
      default: 'NEW',
      index: true
    },
    assignedTo: {
      type: String,
      default: null
    },
    assignedToName: {
      type: String,
      default: null
    },
    incidentId: {
      type: String,
      default: null,
      index: true
    },
    description: {
      type: String,
      default: ''
    },
    recommendation: {
      type: String,
      default: ''
    },
    firstDetectedAt: {
      type: Date,
      default: Date.now
    },
    lastDetectedAt: {
      type: Date,
      default: Date.now
    },
    occurrenceCount: {
      type: Number,
      default: 1
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

// Compound indexes for query optimization
alertSchema.index({ timestamp: -1, severity: 1 });
alertSchema.index({ sourceIp: 1, attackType: 1, status: 1 });

module.exports = mongoose.model('Alert', alertSchema);
