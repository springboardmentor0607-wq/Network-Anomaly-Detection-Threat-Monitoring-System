const mongoose = require('mongoose');

const threatSchema = new mongoose.Schema(
  {
    sourceIp: {
      type: String,
      required: true
    },
    destinationIp: {
      type: String,
      required: true
    },
    protocol: {
      type: String,
      required: true
    },
    threatName: {
      type: String,
      required: true
    },
    severity: {
      type: String,
      enum: ['High', 'Medium', 'Low', 'Critical'],
      default: 'Medium'
    },
    status: {
      type: String,
      enum: ['Pending', 'Resolved', 'Investigating', 'Active'],
      default: 'Pending'
    },
    detectedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Threat', threatSchema);
