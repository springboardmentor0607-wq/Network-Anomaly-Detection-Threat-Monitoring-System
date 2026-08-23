import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Skeleton from '../../components/common/Skeleton';
import LineChart from '../../components/charts/LineChart';
import {
  CpuChipIcon,
  ShieldExclamationIcon,
  PlayIcon,
  ClockIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowUpTrayIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';

const AnalystAIDetectionPage = () => {
  const [prediction, setPrediction] = useState(null);
  const [predicting, setPredicting] = useState(false);
  const [history, setHistory] = useState([]);
  const [selectedModel, setSelectedModel] = useState('Random Forest');

  // CSV Batch Upload
  const [csvFile, setCsvFile] = useState(null);
  const [csvUploading, setCsvUploading] = useState(false);
  const [csvResult, setCsvResult] = useState(null);

  // Input simulation packet features
  const [packetFeatures, setPacketFeatures] = useState({
    flowDuration: 4500,
    totalFwdPackets: 28,
    totalBwdPackets: 22,
    flowBytesSec: 18500,
    flowPacketsSec: 120,
    protocol: 'TCP',
    threatScenario: 'DoS Hulk'
  });

  const runPrediction = async (scenario = packetFeatures.threatScenario) => {
    setPredicting(true);
    try {
      let customFlowBytes = 18500;
      if (scenario === 'DDoS') customFlowBytes = 1450000;
      if (scenario === 'PortScan') customFlowBytes = 850;
      if (scenario === 'BENIGN') customFlowBytes = 1200;

      const payload = {
        features: { ...packetFeatures, threatScenario: scenario, flowBytesSec: customFlowBytes },
        modelName: selectedModel
      };

      const res = await api.post('/ai/predict', payload);
      const resData = res.data.data;
      setPrediction(resData);

      setHistory((prev) => [
        {
          id: `pred-${Date.now()}`,
          time: new Date().toLocaleTimeString(),
          attack: resData.predictedClass,
          probability: resData.probability,
          confidence: resData.confidenceScore,
          riskScore: resData.riskScore,
          riskLevel: resData.riskLevel,
          model: resData.modelUsed
        },
        ...prev.slice(0, 9)
      ]);
    } catch (e) {
      console.error(e);
    } finally {
      setPredicting(false);
    }
  };

  const handleCsvUpload = async (e) => {
    e.preventDefault();
    if (!csvFile) return;
    setCsvUploading(true);
    setCsvResult(null);
    try {
      const formData = new FormData();
      formData.append('file', csvFile);
      const res = await api.post('/ai/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setCsvResult(res.data.data);
    } catch (err) {
      setCsvResult({ error: err.response?.data?.message || 'CSV upload failed' });
    } finally {
      setCsvUploading(false);
    }
  };

  useEffect(() => {
    runPrediction();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <CpuChipIcon className="w-7 h-7 text-cyan-400" />
            <h2 className="text-xl font-extrabold text-white tracking-tight">AI Threat Detection & Live Prediction</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">Real-time Machine Learning Intrusion Forecasting & Risk Scoring Engine</p>
        </div>

        <div className="flex items-center space-x-3">
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-semibold text-cyan-300 focus:outline-none focus:border-cyan-500 font-mono"
          >
            <option value="Random Forest">Model: Random Forest</option>
            <option value="XGBoost">Model: XGBoost</option>
            <option value="Decision Tree">Model: Decision Tree</option>
            <option value="Isolation Forest">Model: Isolation Forest</option>
            <option value="One-Class SVM">Model: One-Class SVM</option>
          </select>
        </div>
      </div>

      {/* Main Prediction & Risk Score Banner */}
      {prediction && (
        <div className={`glass-card rounded-2xl p-6 border ${
          prediction.riskLevel === 'CRITICAL' ? 'border-red-500/50 bg-gradient-to-r from-slate-900 via-red-950/20 to-slate-900' :
          prediction.riskLevel === 'HIGH' ? 'border-orange-500/50 bg-gradient-to-r from-slate-900 via-orange-950/20 to-slate-900' :
          'border-cyan-500/30 bg-slate-900/90'
        }`}>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-center">
            {/* Risk Gauge */}
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-center font-mono space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">REAL-TIME RISK SCORE</span>
              <div className="text-4xl font-black text-white">
                {prediction.riskScore} <span className="text-xs text-slate-500">/ 100</span>
              </div>
              <Badge variant={prediction.riskLevel.toLowerCase()}>{prediction.riskLevel} RISK</Badge>
            </div>

            {/* Attack Classification */}
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 font-mono block">DETECTED THREAT CLASS</span>
              <h3 className="text-2xl font-black text-white font-mono">{prediction.predictedClass}</h3>
              <div className="text-xs text-slate-400 font-mono">
                Model: <span className="text-cyan-400">{prediction.modelUsed}</span>
              </div>
            </div>

            {/* Probability & Confidence */}
            <div className="space-y-2 font-mono">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Attack Probability</span>
                <span className="text-base font-bold text-cyan-300">{(prediction.probability * 100).toFixed(1)}%</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Model Confidence</span>
                <span className="text-base font-bold text-emerald-400">{(prediction.confidenceScore * 100).toFixed(1)}%</span>
              </div>
            </div>

            {/* Execution Latency */}
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-right font-mono space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Inference Latency</span>
              <span className="text-xl font-bold text-cyan-400 block">{prediction.latencyMs} ms</span>
              <span className="text-[10px] text-emerald-400 block">⚡ Real-Time Engine</span>
            </div>
          </div>
        </div>
      )}

      {/* Grid: Live Packet Inspector Simulator & Prediction History */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Packet Inspector Tool */}
        <div className="lg:col-span-1 glass-card rounded-2xl p-6 border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
            Live Network Packet Simulator
          </h3>

          <div className="space-y-3 font-mono text-xs">
            <div>
              <label className="text-slate-400 block mb-1">Simulate Attack Scenario:</label>
              <select
                value={packetFeatures.threatScenario}
                onChange={(e) => {
                  setPacketFeatures({ ...packetFeatures, threatScenario: e.target.value });
                  runPrediction(e.target.value);
                }}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-cyan-300 focus:outline-none focus:border-cyan-500"
              >
                <option value="BENIGN">Normal / BENIGN Traffic</option>
                <option value="DoS Hulk">DoS Hulk Attack</option>
                <option value="DDoS">DDoS Volumetric Flood</option>
                <option value="PortScan">PortScan Probe</option>
                <option value="Bot">Botnet Command & Control</option>
                <option value="SSH-Patator">SSH Brute Force Attack</option>
                <option value="Web Attack">Web Injection Attack</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-slate-400 block mb-1">Flow Duration:</label>
                <input
                  type="number"
                  value={packetFeatures.flowDuration}
                  onChange={(e) => setPacketFeatures({ ...packetFeatures, flowDuration: Number(e.target.value) })}
                  className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-200"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Fwd Packets:</label>
                <input
                  type="number"
                  value={packetFeatures.totalFwdPackets}
                  onChange={(e) => setPacketFeatures({ ...packetFeatures, totalFwdPackets: Number(e.target.value) })}
                  className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-200"
                />
              </div>
            </div>
          </div>

          <button
            onClick={() => runPrediction()}
            disabled={predicting}
            className="w-full py-3 bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold rounded-xl text-xs uppercase tracking-wider flex items-center justify-center space-x-2 shadow-glow-cyan transition-all"
          >
            <PlayIcon className="w-4 h-4 stroke-[3]" />
            <span>{predicting ? 'Analyzing Packet...' : 'Run AI Prediction'}</span>
          </button>
        </div>

        {/* Recent AI Prediction Timeline Table */}
        <div className="lg:col-span-2 glass-card rounded-2xl p-6 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
              AI Prediction Timeline & History Log
            </h3>
            <span className="text-xs text-cyan-400 font-mono">Live Stream</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase">
                  <th className="py-2.5 px-2">Time</th>
                  <th className="py-2.5 px-2">Threat Class</th>
                  <th className="py-2.5 px-2">Prob / Conf</th>
                  <th className="py-2.5 px-2">Risk Score</th>
                  <th className="py-2.5 px-2">Risk Level</th>
                  <th className="py-2.5 px-2">Model Used</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {history.map((h) => (
                  <tr key={h.id} className="hover:bg-slate-800/40">
                    <td className="py-2.5 px-2 text-slate-400">{h.time}</td>
                    <td className="py-2.5 px-2 font-bold text-white">{h.attack}</td>
                    <td className="py-2.5 px-2 text-cyan-300">{(h.probability * 100).toFixed(1)}% / {(h.confidence * 100).toFixed(1)}%</td>
                    <td className="py-2.5 px-2 font-bold text-cyan-400">{h.riskScore} / 100</td>
                    <td className="py-2.5 px-2">
                      <Badge variant={h.riskLevel.toLowerCase()}>{h.riskLevel}</Badge>
                    </td>
                    <td className="py-2.5 px-2 text-slate-400">{h.model}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* CSV Batch Upload Section */}
      <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-4">
        <div className="flex items-center space-x-3 border-b border-slate-800 pb-3">
          <ArrowUpTrayIcon className="w-5 h-5 text-cyan-400" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
            Batch CSV Network Traffic Analysis
          </h3>
          <span className="text-[10px] text-slate-400 font-mono ml-auto">Upload CICIDS2017-format CSV for bulk AI prediction</span>
        </div>

        <form onSubmit={handleCsvUpload} className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <label className="flex-1 cursor-pointer">
            <div className={`flex items-center space-x-3 px-4 py-3 rounded-xl border-2 border-dashed transition-colors ${csvFile ? 'border-cyan-500/60 bg-cyan-500/5' : 'border-slate-700 hover:border-slate-600 bg-slate-900/60'}`}>
              <DocumentTextIcon className="w-5 h-5 text-slate-400 flex-shrink-0" />
              <div>
                <span className="text-xs font-semibold text-slate-300 font-mono block">
                  {csvFile ? csvFile.name : 'Choose CSV file...'}
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  {csvFile ? `${(csvFile.size / 1024).toFixed(1)} KB` : 'CICIDS2017 format • max 50MB'}
                </span>
              </div>
            </div>
            <input
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => { setCsvFile(e.target.files[0]); setCsvResult(null); }}
            />
          </label>

          <button
            type="submit"
            disabled={!csvFile || csvUploading}
            className="px-6 py-3 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-black font-extrabold rounded-xl text-xs uppercase tracking-wider flex items-center space-x-2 shadow-glow-cyan transition-all flex-shrink-0"
          >
            <ArrowUpTrayIcon className="w-4 h-4" />
            <span>{csvUploading ? 'Analyzing...' : 'Run Batch Analysis'}</span>
          </button>
        </form>

        {/* CSV Result */}
        {csvResult && (
          <div className={`p-4 rounded-xl border font-mono text-xs space-y-2 ${csvResult.error ? 'border-red-500/40 bg-red-500/10' : 'border-emerald-500/40 bg-emerald-500/5'}`}>
            {csvResult.error ? (
              <p className="text-red-400 font-bold">❌ {csvResult.error}</p>
            ) : (
              <>
                <div className="flex items-center space-x-2 text-emerald-400 font-bold">
                  <CheckCircleIcon className="w-4 h-4" />
                  <span>Batch Analysis Complete — {csvResult.totalRecords || csvResult.predictions?.length || 0} records processed</span>
                </div>
                {csvResult.summary && (
                  <div className="grid grid-cols-3 gap-3 pt-2">
                    {Object.entries(csvResult.summary).slice(0, 6).map(([k, v]) => (
                      <div key={k} className="p-2 bg-slate-950/60 rounded-lg border border-slate-800">
                        <span className="text-slate-500 text-[10px] block">{k}</span>
                        <span className="text-white font-bold">{typeof v === 'number' ? v.toLocaleString() : String(v)}</span>
                      </div>
                    ))}
                  </div>
                )}
                {csvResult.alertsGenerated > 0 && (
                  <p className="text-cyan-400 font-bold pt-1">🚨 {csvResult.alertsGenerated} new threat alerts generated — check Threat Alerts page.</p>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalystAIDetectionPage;
