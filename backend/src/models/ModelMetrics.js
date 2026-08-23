const mongoose = require('mongoose');

const modelMetricsSchema = new mongoose.Schema(
  {
    modelName: { type: String, required: true },
    datasetName: { type: String, required: true },
    accuracy: { type: Number, required: true },
    precision: { type: Number, required: true },
    recall: { type: Number, required: true },
    f1Score: { type: Number, required: true },
    rocAuc: { type: Number, default: 0 },
    trainingTimeMs: { type: Number, default: 0 },
    inferenceTimeMs: { type: Number, default: 0 },
    memoryUsageMb: { type: Number, default: 0 },
    confusionMatrix: { type: mongoose.Schema.Types.Mixed },
    classificationReport: { type: mongoose.Schema.Types.Mixed },
    featureImportance: { type: mongoose.Schema.Types.Mixed },
    isRecommended: { type: Boolean, default: false },
    timestamp: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

module.exports = mongoose.model('ModelMetrics', modelMetricsSchema);
