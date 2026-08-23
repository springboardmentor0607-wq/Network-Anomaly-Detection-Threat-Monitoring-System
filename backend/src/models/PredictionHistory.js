const mongoose = require('mongoose');

const predictionHistorySchema = new mongoose.Schema(
  {
    features: { type: mongoose.Schema.Types.Mixed, required: true },
    predictedClass: { type: String, required: true },
    probability: { type: Number, required: true },
    confidenceScore: { type: Number, required: true },
    riskScore: { type: Number, required: true },
    riskLevel: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], default: 'LOW' },
    modelUsed: { type: String, default: 'Random Forest' },
    latencyMs: { type: Number, default: 0 },
    timestamp: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

module.exports = mongoose.model('PredictionHistory', predictionHistorySchema);
