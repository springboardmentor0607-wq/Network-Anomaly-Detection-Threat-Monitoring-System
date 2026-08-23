const mongoose = require('mongoose');

const threatIntelSchema = new mongoose.Schema(
  {
    intelId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    indicatorValue: {
      type: String,
      required: true,
      index: true
    },
    type: {
      type: String,
      enum: ['IP', 'DOMAIN', 'HASH', 'MALWARE_FAMILY', 'ATTACK_PATTERN'],
      default: 'IP'
    },
    category: {
      type: String,
      default: 'Malicious Host'
    },
    threatLevel: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      default: 'HIGH'
    },
    confidence: {
      type: Number,
      default: 85
    },
    description: {
      type: String,
      default: ''
    },
    firstObserved: {
      type: Date,
      default: Date.now
    },
    lastObserved: {
      type: Date,
      default: Date.now
    },
    occurrenceCount: {
      type: Number,
      default: 1
    },
    targetIndustries: {
      type: [String],
      default: ['Financial', 'Enterprise', 'Government']
    },
    mitigation: {
      type: String,
      default: ''
    },
    isExternalEnriched: {
      type: Boolean,
      default: false
    },
    source: {
      type: String,
      default: 'Internal Telemetry Observed'
    },
    rawTelemetryStats: {
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

threatIntelSchema.index({ indicatorValue: 1, type: 1 });

module.exports = mongoose.model('ThreatIntelligence', threatIntelSchema);
