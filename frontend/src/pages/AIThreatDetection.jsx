import React, { useState, useEffect } from 'react';
import { socAPI } from '../services/api';
import { Play, Cpu, History, Upload } from 'lucide-react';

const SCENARIOS = {
  'DoS Hulk': { duration: 0.1, protocol_type: 'tcp', service: 'http', flag: 'SF', src_bytes: 84000, dst_bytes: 40, count: 350 },
  'DDoS': { duration: 0.05, protocol_type: 'tcp', service: 'http', flag: 'SF', src_bytes: 120000, dst_bytes: 0, count: 500 },
  'PortScan': { duration: 0.0, protocol_type: 'icmp', service: 'eco_i', flag: 'SF', src_bytes: 40, dst_bytes: 0, count: 80 },
  'Web Attack': { duration: 0.2, protocol_type: 'tcp', service: 'http', flag: 'SF', src_bytes: 4500, dst_bytes: 8200, root_shell: 1 },
  'Botnet': { duration: 1.2, protocol_type: 'tcp', service: 'smtp', flag: 'SF', src_bytes: 12000, dst_bytes: 5400, count: 180 },
  'SSH Patator': { duration: 0.5, protocol_type: 'tcp', service: 'ssh', flag: 'SF', src_bytes: 1200, dst_bytes: 900, num_failed_logins: 4 },
  'Normal Traffic': { duration: 0.1, protocol_type: 'tcp', service: 'http', flag: 'SF', src_bytes: 250, dst_bytes: 1400, count: 1 }
};

export default function AIThreatDetection() {
  const [selectedScenario, setSelectedScenario] = useState('DoS Hulk');
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [batchStats, setBatchStats] = useState(null);

  const fetchHistory = () => {
    socAPI.getPredictionHistory().then(res => setHistory(res.data)).catch(console.error);
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const runScenarioPrediction = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...SCENARIOS[selectedScenario],
        source_ip: '192.168.1.105',
        destination_ip: '10.0.0.15'
      };
      const res = await socAPI.predictTraffic(payload);
      setResult(res.data);
      fetchHistory();
    } catch (err) {
      alert('Inference error: ' + err.message);
    }
  };

  const handleBatchUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await socAPI.predictBatchCSV(formData);
      setBatchStats(res.data);
    } catch (err) {
      alert('Batch evaluation failed: ' + (err.response?.data?.detail || err.message));
    }
  };

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Cpu className="w-6 h-6 text-[#00f0ff]" /> AI Threat Detection & Packet Simulator
        </h1>
        <p className="text-sm text-slate-400">Execute live inferences through the Random Forest Classifier + Isolation Forest ensemble.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <form onSubmit={runScenarioPrediction} className="bg-[#0d1527] border border-[#1b2a4a] p-6 rounded-2xl space-y-4">
          <label className="text-xs text-slate-400 font-bold">Attack Scenario Generator</label>
          <select 
            value={selectedScenario} 
            onChange={(e) => setSelectedScenario(e.target.value)}
            className="w-full bg-[#070b14] border border-[#1b2a4a] text-sm text-white p-3 rounded-xl outline-none"
          >
            {Object.keys(SCENARIOS).map(k => <option key={k} value={k}>{k}</option>)}
          </select>

          <button type="submit" className="w-full flex items-center justify-center gap-2 bg-[#00f0ff] hover:bg-cyan-400 text-[#070b14] font-bold py-3 rounded-xl transition">
            <Play className="w-4 h-4" /> Execute Live Model Inference
          </button>

          {result && (
            <div className="p-4 bg-[#070b14] border border-[#1b2a4a] rounded-xl space-y-2 text-xs">
              <div className="flex justify-between"><span className="text-slate-400">Class:</span><span className="font-bold text-white">{result.predicted_class}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Confidence:</span><span className="font-bold text-[#00f0ff]">{result.confidence}%</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Risk Score:</span><span className="font-bold text-amber-400">{result.risk_score} / 100</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Latency:</span><span className="font-bold text-emerald-400">{result.inference_latency}</span></div>
            </div>
          )}

          <div className="pt-4 border-t border-[#1b2a4a] space-y-2">
            <label className="text-xs text-slate-400 font-bold flex items-center gap-2">
              <Upload className="w-4 h-4" /> Batch CSV Analysis
            </label>
            <input type="file" accept=".csv" onChange={handleBatchUpload} className="text-xs text-slate-400 w-full" />
          </div>
        </form>

        <div className="lg:col-span-2 bg-[#0d1527] border border-[#1b2a4a] p-6 rounded-2xl space-y-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <History className="w-4 h-4 text-[#00f0ff]" /> Real Model Inference History Timeline
          </h2>
          <div className="max-h-96 overflow-y-auto space-y-2 pr-1">
            {history.map((p) => (
              <div key={p.id} className="p-3 bg-[#070b14] border border-[#1b2a4a] rounded-xl flex justify-between items-center text-xs">
                <div>
                  <span className="font-bold text-white">{p.attack_class}</span>
                  <span className="text-slate-500 ml-2 font-mono">({p.source_ip})</span>
                </div>
                <div className="flex gap-3 items-center">
                  <span className="text-slate-400">{p.inference_latency_ms}ms</span>
                  <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                    p.risk_level === 'CRITICAL' ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'
                  }`}>
                    {p.risk_score}/100
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
