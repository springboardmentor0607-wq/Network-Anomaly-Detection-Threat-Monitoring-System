const mongoose = require('mongoose');

const incidentSchema = new mongoose.Schema(
  {
    incidentId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    title: {
      type: String,
      required: true
    },
    description: {
      type: String,
      default: ''
    },
    severity: {
      type: String,
      enum: ['INFO', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      default: 'HIGH',
      index: true
    },
    priority: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      default: 'HIGH'
    },
    status: {
      type: String,
      enum: ['OPEN', 'ACKNOWLEDGED', 'INVESTIGATING', 'CONTAINED', 'RESOLVED', 'CLOSED'],
      default: 'OPEN',
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
    team: {
      type: String,
      default: 'Tier-1 SOC'
    },
    relatedAlerts: {
      type: [String],
      default: []
    },
    attackTypes: {
      type: [String],
      default: []
    },
    affectedAssets: {
      type: [String],
      default: []
    },
    sourceIps: {
      type: [String],
      default: []
    },
    destinationIps: {
      type: [String],
      default: []
    },
    timeline: [
      {
        timestamp: { type: Date, default: Date.now },
        action: { type: String, required: true },
        user: { type: String, default: 'System' },
        details: { type: String, default: '' }
      }
    ],
    notes: [
      {
        timestamp: { type: Date, default: Date.now },
        user: { type: String, required: true },
        note: { type: String, required: true }
      }
    ],
    resolvedAt: {
      type: Date,
      default: null
    },
    closedAt: {
      type: Date,
      default: null
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

incidentSchema.index({ status: 1, severity: 1 });
incidentSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Incident', incidentSchema);
