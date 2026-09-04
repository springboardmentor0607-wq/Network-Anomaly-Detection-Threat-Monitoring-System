import React, { useEffect, useState } from 'react';
import API from '../services/api';
import { Eye, ShieldAlert, Activity, Play } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const AnomalyDetection = () => {
  const [summary, setSummary] = useState(null);
  const [recent, setRecent] = useState([]);

  useEffect(() => {
    API.get('/anomaly/summary').then(res => setSummary(res.data)).catch(console.error);
    API.get('/anomaly/recent').then(res => setRecent(res.data)).catch(console.error);
  }, []);

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Eye className="w-6 h-6 text-[#00f0ff]" /> Anomaly Detection
          </h1>
          <p className="text-sm text-slate-400">Detect unusual patterns and deviations in network traffic behavior.</p>
        </div>
        <button className="flex items-center gap-2 bg-[#00f0ff] hover:bg-cyan-400 text-[#070b14] px-4 py-2 rounded-xl font-bold text-sm transition">
          <Play className="w-4 h-4" /> Run Detection
        </button>
      </div>

      {/* Top 4 Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {[
          { label: "Anomalies Detected", val: summary?.anomalies_detected || "248", change: "+18.4% from yesterday", color: "rose" },
          { label: "Anomaly Rate", val: summary?.anomaly_rate || "2.35%", change: "+0.48% from yesterday", color: "amber" },
          { label: "Affected Hosts", val: summary?.affected_hosts || "32", change: "+6 from yesterday", color: "blue" },
          { label: "False Positive Rate", val: summary?.false_positive_rate || "0.34%", change: "-0.12% from yesterday", color: "emerald" }
        ].map((c, i) => (
          <div key={i} className="bg-[#0d1527] border border-[#1b2a4a] p-4 rounded-xl">
            <span className="text-xs text-slate-400">{c.label}</span>
            <div className="text-2xl font-bold text-white mt-1">{c.val}</div>
            <span className="text-[10px] text-slate-500">{c.change}</span>
          </div>
        ))}
      </div>

      {/* Anomaly Distribution & Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#0d1527] border border-[#1b2a4a] p-6 rounded-2xl space-y-4">
          <h2 className="text-base font-bold text-white">Anomaly Score Distribution</h2>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={summary?.distribution || []}>
                <XAxis dataKey="range" stroke="#475569" />
                <YAxis stroke="#475569" />
                <Tooltip contentStyle={{ backgroundColor: '#0d1527', borderColor: '#1b2a4a', color: '#fff' }} />
                <Bar dataKey="count" fill="#00f0ff" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-[#0d1527] border border-[#1b2a4a] p-6 rounded-2xl space-y-3">
          <h2 className="text-base font-bold text-white">Anomaly Detection Engine</h2>
          <div className="bg-[#070b14] border border-[#1b2a4a] p-4 rounded-xl space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-[#1b2a4a]">
              <span className="text-slate-400">Detection Model</span>
              <span className="font-bold text-[#00f0ff]">{summary?.metadata?.detection_model}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#1b2a4a]">
              <span className="text-slate-400">Contamination Rate</span>
              <span className="font-bold text-white">{summary?.metadata?.contamination}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#1b2a4a]">
              <span className="text-slate-400">Training Samples</span>
              <span className="font-bold text-white">{summary?.metadata?.training_data_size}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400">Model State</span>
              <span className="font-bold text-emerald-400">Active</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnomalyDetection;