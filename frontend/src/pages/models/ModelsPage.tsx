import React, { useState, useEffect } from 'react';
import { Card } from '../../components/common/Card';
import { BrainCircuit, CheckCircle, RefreshCw, BarChart2, Award, Zap, TrendingUp, AlertCircle, Power } from 'lucide-react';
import { apiClient } from '../../api/client';

interface ModelItem {
  id: string;
  name: string;
  version: string;
  type: string;
  dataset: string;
  trainedAt: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  isActive: boolean;
  status: string;
  confusionMatrix: {
    labels: string[];
    matrix: number[][];
  };
}

export const ModelsPage: React.FC = () => {
  const [models, setModels] = useState<ModelItem[]>([
    {
      id: 'mdl-xgb-01',
      name: 'NetShield XGBoost Classifier',
      version: 'v2.4.1',
      type: 'XGBoost Supervised',
      dataset: 'CICIDS2017 & UNSW-NB15',
      trainedAt: '2026-08-01T14:30:00Z',
      accuracy: 0.9842,
      precision: 0.9785,
      recall: 0.9810,
      f1Score: 0.9797,
      isActive: true,
      status: 'DEPLOYED IN PRODUCTION',
      confusionMatrix: {
        labels: ['Normal', 'DoS', 'Brute Force', 'Scan', 'Web Attack'],
        matrix: [
          [9850, 42, 12, 8, 3],
          [18, 2450, 5, 2, 1],
          [8, 4, 1180, 2, 0],
          [15, 6, 4, 1890, 2],
          [5, 1, 0, 3, 410],
        ],
      },
    },
    {
      id: 'mdl-rf-02',
      name: 'Random Forest Intrusion Detector',
      version: 'v1.9.0',
      type: 'Random Forest',
      dataset: 'UNSW-NB15',
      trainedAt: '2026-07-20T09:15:00Z',
      accuracy: 0.9675,
      precision: 0.9610,
      recall: 0.9650,
      f1Score: 0.9630,
      isActive: false,
      status: 'STANDBY',
      confusionMatrix: {
        labels: ['Normal', 'DoS', 'Brute Force', 'Scan'],
        matrix: [
          [9600, 110, 50, 40],
          [45, 2380, 15, 10],
          [20, 10, 1120, 8],
          [30, 15, 12, 1840],
        ],
      },
    },
    {
      id: 'mdl-iso-03',
      name: 'Isolation Forest Anomaly Engine',
      version: 'v3.0.0',
      type: 'Isolation Forest (Unsupervised)',
      dataset: 'Live Telemetry Baseline',
      trainedAt: '2026-08-05T18:00:00Z',
      accuracy: 0.9410,
      precision: 0.9280,
      recall: 0.9520,
      f1Score: 0.9398,
      isActive: true,
      status: 'ACTIVE UNSUPERVISED',
      confusionMatrix: {
        labels: ['Normal', 'Anomaly'],
        matrix: [
          [14200, 310],
          [180, 1240],
        ],
      },
    },
  ]);

  const [selectedModel, setSelectedModel] = useState<ModelItem>(models[0]);

  const handleActivate = (id: string) => {
    setModels((prev) =>
      prev.map((mdl) => {
        if (mdl.id === id) return { ...mdl, isActive: true, status: 'DEPLOYED IN PRODUCTION' };
        if (mdl.type.includes('XGBoost') || mdl.type.includes('Random Forest')) return { ...mdl, isActive: false, status: 'STANDBY' };
        return mdl;
      })
    );
    if (selectedModel.id === id) {
      setSelectedModel((prev) => ({ ...prev, isActive: true, status: 'DEPLOYED IN PRODUCTION' }));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">AI Model Registry & Lifecycle</h1>
          <p className="text-gray-400 mt-2">Manage, evaluate, and activate machine-learning inference engines</p>
        </div>
      </div>

      {/* Active Model Summary */}
      <div className="bg-gradient-to-r from-emerald-950/30 to-cyan-950/30 border border-emerald-500/30 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-emerald-950/50 rounded-lg">
              <CheckCircle className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Active Model in Production</h2>
              <p className="text-emerald-400 font-semibold">{models.find(m => m.isActive)?.name || 'No active model'}</p>
              <p className="text-sm text-gray-400">Accuracy: {(models.find(m => m.isActive)?.accuracy || 0) * 100}%</p>
            </div>
          </div>
          <TrendingUp className="w-8 h-8 text-emerald-400" />
        </div>
      </div>

      {/* Model Cards Grid */}
      <div>
        <h2 className="text-lg font-bold text-white mb-4">Available Models</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {models.map((mdl) => (
            <div
              key={mdl.id}
              className={`rounded-lg border p-6 cursor-pointer transition-all ${
                selectedModel.id === mdl.id
                  ? 'bg-cyan-950/50 border-cyan-500 shadow-lg shadow-cyan-500/20'
                  : 'bg-[#222222] border-[#444444] hover:border-cyan-500/50'
              }`}
              onClick={() => setSelectedModel(mdl)}
            >
              {/* Status Badge */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <BrainCircuit className="w-5 h-5 text-cyan-400" />
                  <span className="text-sm font-semibold text-white">{mdl.type}</span>
                </div>
                <span
                  className={`px-3 py-1 text-xs font-bold rounded-full ${
                    mdl.isActive
                      ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-500'
                      : 'bg-gray-700/50 text-gray-300 border border-gray-600'
                  }`}
                >
                  {mdl.isActive ? 'ACTIVE' : 'STANDBY'}
                </span>
              </div>

              {/* Model Info */}
              <h3 className="font-bold text-white mb-2">{mdl.name}</h3>
              <p className="text-xs text-gray-400 mb-4">{mdl.version} • Trained: {new Date(mdl.trainedAt).toLocaleDateString()}</p>

              {/* Metrics Row */}
              <div className="grid grid-cols-2 gap-3 mb-4 pt-4 border-t border-[#444444]">
                <div>
                  <p className="text-xs text-gray-400">Accuracy</p>
                  <p className="text-lg font-bold text-emerald-400">{(mdl.accuracy * 100).toFixed(1)}%</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">F1 Score</p>
                  <p className="text-lg font-bold text-cyan-400">{(mdl.f1Score * 100).toFixed(1)}%</p>
                </div>
              </div>

              {/* Action Button */}
              {!mdl.isActive && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleActivate(mdl.id);
                  }}
                  className="w-full py-2.5 bg-cyan-950/400 hover:bg-cyan-600 text-white font-semibold text-sm rounded-lg transition flex items-center justify-center space-x-2"
                >
                  <Power className="w-4 h-4" />
                  <span>Activate Model</span>
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Performance Details */}
      <div className="bg-[#222222] border border-[#444444] rounded-lg p-6">
        <h2 className="text-lg font-bold text-white mb-6">Performance Metrics</h2>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-[#121212] rounded-lg p-4 border border-[#444444]">
            <p className="text-gray-400 text-sm mb-2">Accuracy</p>
            <p className="text-3xl font-bold text-emerald-400">{(selectedModel.accuracy * 100).toFixed(2)}%</p>
            <p className="text-xs text-gray-500 mt-2">{selectedModel.name}</p>
          </div>
          <div className="bg-[#121212] rounded-lg p-4 border border-[#444444]">
            <p className="text-gray-400 text-sm mb-2">Precision</p>
            <p className="text-3xl font-bold text-cyan-400">{(selectedModel.precision * 100).toFixed(2)}%</p>
            <p className="text-xs text-gray-500 mt-2">True Positives Ratio</p>
          </div>
          <div className="bg-[#121212] rounded-lg p-4 border border-[#444444]">
            <p className="text-gray-400 text-sm mb-2">Recall</p>
            <p className="text-3xl font-bold text-blue-400">{(selectedModel.recall * 100).toFixed(2)}%</p>
            <p className="text-xs text-gray-500 mt-2">Detection Rate</p>
          </div>
          <div className="bg-[#121212] rounded-lg p-4 border border-[#444444]">
            <p className="text-gray-400 text-sm mb-2">F1 Score</p>
            <p className="text-3xl font-bold text-purple-400">{(selectedModel.f1Score * 100).toFixed(2)}%</p>
            <p className="text-xs text-gray-500 mt-2">Balanced Score</p>
          </div>
        </div>

        {/* Confusion Matrix */}
        <div>
          <h3 className="font-bold text-white mb-4">Confusion Matrix</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-center text-sm border-collapse">
              <thead>
                <tr className="bg-[#121212] border-b border-[#444444]">
                  <th className="py-3 px-4 text-left text-gray-400">Actual \ Predicted</th>
                  {selectedModel.confusionMatrix.labels.map((lbl, idx) => (
                    <th key={idx} className="py-3 px-4 text-gray-400">{lbl}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {selectedModel.confusionMatrix.matrix.map((row, rIdx) => (
                  <tr key={rIdx} className="border-b border-[#444444] hover:bg-[#121212] transition">
                    <td className="py-3 px-4 text-left text-white font-semibold">{selectedModel.confusionMatrix.labels[rIdx]}</td>
                    {row.map((cell, cIdx) => (
                      <td
                        key={cIdx}
                        className={`py-3 px-4 font-mono font-bold ${
                          rIdx === cIdx ? 'bg-emerald-950/50 text-emerald-400 border-l border-r border-emerald-500/30' : 'text-gray-300'
                        }`}
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-950/30 border border-blue-500/30 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-blue-300">Model Information</p>
            <p className="text-sm text-gray-400 mt-1">Only one model can be active at a time. Activating a new model will automatically deactivate the previous one.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
