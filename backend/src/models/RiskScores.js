const mongoose = require('mongoose');

const riskScoresSchema = new mongoose.Schema(
  {
    threatClass: { type: String, required: true, unique: true },
    baseRiskScore: { type: Number, required: true },
    severity: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], default: 'MEDIUM' },
    description: { type: String },
    updatedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

module.exports = mongoose.model('RiskScores', riskScoresSchema);
