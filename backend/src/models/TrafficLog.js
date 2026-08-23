const mongoose = require('mongoose');

const trafficLogSchema = new mongoose.Schema(
  {
    totalTrafficMb: Number,
    packetsProcessed: Number,
    suspiciousActivitiesCount: Number,
    bandwidthUsageGbps: Number,
    latencyMs: Number,
    timestamp: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

module.exports = mongoose.model('TrafficLog', trafficLogSchema);
