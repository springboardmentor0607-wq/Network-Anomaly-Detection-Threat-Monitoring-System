const mongoose = require('mongoose');

const threatPredictionsSchema = new mongoose.Schema(
  {
    sourceIp: { type: String, required: true },
    destinationIp: { type: String, required: true },
    protocol: { type: String, required: true },
    threatName: { type: String, required: true },
    probability: { type: Number, required: true },
    confidence: { type: Number, required: true },
    riskScore: { type: Number, required: true },
    riskLevel: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], default: 'LOW' },
    status: { type: String, enum: ['Active', 'Investigating', 'Pending', 'Resolved'], default: 'Active' },
    timestamp: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

module.exports = mongoose.model('ThreatPredictions', threatPredictionsSchema);
