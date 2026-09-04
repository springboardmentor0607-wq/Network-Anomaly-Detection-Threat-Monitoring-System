import React, { useEffect, useState } from 'react';
import { Brain, Play, Database, CheckCircle, Clock } from 'lucide-react';
import { socAPI } from '../services/api';

const ModelTraining = () => {
  const [training, setTraining] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [metrics, setMetrics] = useState(null);
  const [config, setConfig] = useState({ algorithm: 'Random Forest Classifier', dataset: 'NSL-KDD', target_column: 'label', test_size: 0.2, random_state: 42 });
  const [lastResult, setLastResult] = useState(null);

  useEffect(() => {
    socAPI.getModels().then((response) => {
      const trained = response.data.find((model) => model.metrics_json || model.accuracy != null);
      if (trained) setLastResult(trained);
    }).catch(() => {});
  }, []);

  const handleStartTraining = async () => {
    setTraining(true);
    setMessage('');
    setError('');
    setMetrics(null);

    try {
      const response = await socAPI.trainModel(config);

      setMessage(
        response.data?.message || 'Training completed successfully.'
      );

      setMetrics(response.data?.metrics || null);
      setLastResult(response.data?.model || null);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        'Training failed. Please check the backend.'
      );
    } finally {
      setTraining(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-white p-6">
      <div className="max-w-7xl mx-auto">

        <div className="mb-8">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30">
              <Brain className="w-7 h-7 text-cyan-400" />
            </div>

            <div>
              <h1 className="text-3xl font-bold">Model Training</h1>
              <p className="text-slate-400 text-sm">
                Train and manage AI intrusion detection models
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">

          <div className="bg-[#0d1527] border border-[#1b2a4a] rounded-2xl p-5">
            <Database className="text-cyan-400 mb-3" />
            <p className="text-xs text-slate-400">Training Dataset</p>
            <h2 className="text-xl font-bold mt-2">NSL-KDD</h2>
          </div>

          <div className="bg-[#0d1527] border border-[#1b2a4a] rounded-2xl p-5">
            <CheckCircle className="text-green-400 mb-3" />
            <p className="text-xs text-slate-400">Model Status</p>
            <h2 className="text-xl font-bold mt-2 text-green-400">
              {training ? 'Training...' : error ? 'Failed' : metrics ? 'Completed' : 'Ready'}
            </h2>
          </div>

          <div className="bg-[#0d1527] border border-[#1b2a4a] rounded-2xl p-5">
            <Clock className="text-cyan-400 mb-3" />
            <p className="text-xs text-slate-400">Training Status</p>
            <h2 className="text-xl font-bold mt-2">
              {training ? 'In Progress' : error ? 'Failed' : metrics ? 'Completed' : 'Ready'}
            </h2>
          </div>

        </div>

        <div className="bg-[#0d1527] border border-[#1b2a4a] rounded-2xl p-6">

          <h2 className="text-xl font-bold mb-2">
            Train AI Detection Model
          </h2>

          <p className="text-slate-400 text-sm mb-6">
            Start the machine learning training process using the NSL-KDD
            network traffic dataset.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <label className="text-xs text-slate-400">Algorithm
              <select value={config.algorithm} onChange={(e) => setConfig({ ...config, algorithm: e.target.value })} className="w-full mt-2 bg-[#070b14] border border-[#1b2a4a] rounded-xl px-4 py-3 text-sm text-white">
                <option>Random Forest Classifier</option><option>Logistic Regression</option><option>Decision Tree</option>
              </select>
            </label>
            <label className="text-xs text-slate-400">Target Column
              <input value={config.target_column} onChange={(e) => setConfig({ ...config, target_column: e.target.value })} className="w-full mt-2 bg-[#070b14] border border-[#1b2a4a] rounded-xl px-4 py-3 text-sm text-white" />
            </label>
            <label className="text-xs text-slate-400">Test Split
              <input type="number" min="0.1" max="0.5" step="0.05" value={config.test_size} onChange={(e) => setConfig({ ...config, test_size: Number(e.target.value) })} className="w-full mt-2 bg-[#070b14] border border-[#1b2a4a] rounded-xl px-4 py-3 text-sm text-white" />
            </label>
            <label className="text-xs text-slate-400">Random State
              <input type="number" value={config.random_state} onChange={(e) => setConfig({ ...config, random_state: Number(e.target.value) })} className="w-full mt-2 bg-[#070b14] border border-[#1b2a4a] rounded-xl px-4 py-3 text-sm text-white" />
            </label>
            <div className="text-xs text-slate-400 md:col-span-2">Features: automatically selected from the NSL-KDD schema. Dataset: NSL-KDD.</div>
          </div>

          <button
            type="button"
            onClick={handleStartTraining}
            disabled={training}
            className="flex items-center gap-2 bg-cyan-400 hover:bg-cyan-300 disabled:opacity-50 disabled:cursor-not-allowed text-[#070b14] font-bold px-6 py-3 rounded-xl transition"
          >
            <Play className="w-5 h-5" />
            {training ? 'Training...' : 'Start Training'}
          </button>

          {message && (
            <div className="mt-5 p-4 rounded-xl border border-green-500/30 bg-green-500/10 text-green-400">
              {message}
            </div>
          )}

          {error && (
            <div className="mt-5 p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400">
              {error}
            </div>
          )}

          {metrics && (
            <div className="mt-5 p-4 rounded-xl border border-cyan-500/30 bg-cyan-500/10">
              <h3 className="font-bold mb-3">Training Metrics</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm text-slate-300">
                {['accuracy', 'precision', 'recall', 'f1_score', 'roc_auc'].map((key) => <div key={key}><span className="block text-xs text-slate-500 uppercase">{key}</span>{metrics[key] == null ? 'Not available' : `${(metrics[key] * 100).toFixed(2)}%`}</div>)}
              </div>
              <div className="mt-4 text-sm text-slate-300">Confusion Matrix: {JSON.stringify(metrics.confusion_matrix)}</div>
            </div>
          )}

          {!metrics && lastResult?.accuracy != null && <div className="mt-5 text-sm text-slate-400">Last persisted result: {(lastResult.accuracy * 100).toFixed(2)}% accuracy.</div>}

        </div>

      </div>
    </div>
  );
};

export default ModelTraining;