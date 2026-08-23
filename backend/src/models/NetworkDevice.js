const mongoose = require('mongoose');

const networkDeviceSchema = new mongoose.Schema(
  {
    deviceName: { type: String, required: true },
    ipAddress: { type: String, required: true },
    macAddress: { type: String, required: true },
    deviceType: { type: String, required: true }, // Router, Firewall, Server, Workstation
    status: { type: String, enum: ['ONLINE', 'WARNING', 'OFFLINE'], default: 'ONLINE' },
    lastSeen: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

module.exports = mongoose.model('NetworkDevice', networkDeviceSchema);
