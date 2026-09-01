import React, { useState } from 'react';
import { Card } from '../../components/common/Card';
import { BrainCircuit, CheckCircle, RefreshCw, BarChart2, Award, Zap } from 'lucide-react';

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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">AI Model Registry & Lifecycle</h2>
          <p className="text-xs text-gray-400">Manage, evaluate, and activate machine-learning inference engines.</p>
        </div>
      </div>

      {/* Model Selection Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {models.map((mdl) => (
          <Card
            key={mdl.id}
            className={`p-5 cursor-pointer transition border ${
              selectedModel.id === mdl.id
                ? 'bg-cyan-950/40 border-cyan-500/60 shadow-lg'
                : 'bg-[#0F172A] border-[#1F2937] hover:border-gray-700'
            }`}
            onClick={() => setSelectedModel(mdl)}
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="p-2.5 bg-cyan-950/80 border border-cyan-500/30 rounded-xl text-cyan-400">
                  <BrainCircuit className="w-5 h-5" />
                </div>
                <span
                  className={`px-2.5 py-0.5 text-[10px] font-bold rounded ${
                    mdl.isActive
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/40'
                      : 'bg-gray-800 text-gray-400 border border-gray-700'
                  }`}
                >
                  {mdl.status}
                </span>
              </div>

              <div>
                <h3 className="text-base font-bold text-white">{mdl.name}</h3>
                <p className="text-xs text-gray-400">{mdl.version} • {mdl.type}</p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-[#1F2937]">
                <div><span className="text-gray-400 block">Accuracy</span><strong className="text-emerald-400">{(mdl.accuracy * 100).toFixed(2)}%</strong></div>
                <div><span className="text-gray-400 block">F1 Score</span><strong className="text-cyan-400">{(mdl.f1Score * 100).toFixed(2)}%</strong></div>
              </div>

              {!mdl.isActive && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleActivate(mdl.id);
                  }}
                  className="w-full py-2 bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs rounded-xl shadow transition"
                >
                  Activate Model
                </button>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Selected Model Performance Matrix Inspector */}
      <Card title={`Performance Metrics Inspector: ${selectedModel.name}`}>
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div className="p-4 bg-[#0B0F17] rounded-xl border border-[#1F2937]">
              <span className="text-xs text-gray-400 block mb-1">Accuracy</span>
              <p className="text-2xl font-bold text-emerald-400">{(selectedModel.accuracy * 100).toFixed(2)}%</p>
            </div>
            <div className="p-4 bg-[#0B0F17] rounded-xl border border-[#1F2937]">
              <span className="text-xs text-gray-400 block mb-1">Precision</span>
              <p className="text-2xl font-bold text-cyan-400">{(selectedModel.precision * 100).toFixed(2)}%</p>
            </div>
            <div className="p-4 bg-[#0B0F17] rounded-xl border border-[#1F2937]">
              <span className="text-xs text-gray-400 block mb-1">Recall</span>
              <p className="text-2xl font-bold text-blue-400">{(selectedModel.recall * 100).toFixed(2)}%</p>
            </div>
            <div className="p-4 bg-[#0B0F17] rounded-xl border border-[#1F2937]">
              <span className="text-xs text-gray-400 block mb-1">F1 Score</span>
              <p className="text-2xl font-bold text-purple-400">{(selectedModel.f1Score * 100).toFixed(2)}%</p>
            </div>
          </div>

          {/* Confusion Matrix Table */}
          <div>
            <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider mb-3">Confusion Matrix Evaluation Grid</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-center text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#1F2937] text-gray-400 font-bold uppercase">
                    <th className="py-2.5 px-3 text-left">Actual \ Predicted</th>
                    {selectedModel.confusionMatrix.labels.map((lbl, idx) => (
                      <th key={idx} className="py-2.5 px-3">{lbl}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1F2937] text-gray-200">
                  {selectedModel.confusionMatrix.matrix.map((row, rIdx) => (
                    <tr key={rIdx}>
                      <td className="py-3 px-3 font-bold text-white text-left">{selectedModel.confusionMatrix.labels[rIdx]}</td>
                      {row.map((cell, cIdx) => (
                        <td
                          key={cIdx}
                          className={`py-3 px-3 font-mono font-bold ${
                            rIdx === cIdx ? 'bg-emerald-950/70 text-emerald-400 border border-emerald-500/30' : 'text-gray-400'
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
      </Card>
    </div>
  );
};
