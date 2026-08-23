const mongoose = require('mongoose');

const systemStatusSchema = new mongoose.Schema(
  {
    cpuUsage: Number,
    memoryUsage: Number,
    diskUsage: Number,
    networkHealth: Number,
    firewallStatus: String,
    idsStatus: String,
    serverStatus: String,
    securityScore: Number,
    riskLevel: String,
    lastUpdated: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

module.exports = mongoose.model('SystemStatus', systemStatusSchema);
