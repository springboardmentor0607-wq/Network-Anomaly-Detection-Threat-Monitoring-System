const mongoose = require('mongoose');

const trainingHistorySchema = new mongoose.Schema(
  {
    trainingId: { type: String, required: true, unique: true },
    datasetName: { type: String, required: true },
    modelsTrained: [{ type: String }],
    bestModel: { type: String, required: true },
    durationSeconds: { type: Number, required: true },
    status: { type: String, enum: ['STARTED', 'COMPLETED', 'FAILED'], default: 'COMPLETED' },
    metricsSummary: { type: mongoose.Schema.Types.Mixed },
    timestamp: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

module.exports = mongoose.model('TrainingHistory', trainingHistorySchema);
