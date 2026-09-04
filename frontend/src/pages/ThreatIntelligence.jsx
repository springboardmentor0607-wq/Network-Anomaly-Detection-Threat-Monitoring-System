import React, { useEffect, useState } from 'react';
import { socAPI } from '../services/api';
import { Globe } from 'lucide-react';

export default function ThreatIntelligence() {
  const [indicators, setIndicators] = useState([]);

  useEffect(() => {
    socAPI.getThreatIntel().then(res => setIndicators(res.data)).catch(console.error);
  }, []);

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Globe className="w-6 h-6 text-[#00f0ff]" /> Threat Intelligence & Telemetry Indicators
        </h1>
        <p className="text-sm text-slate-400">Attacking host intelligence mapping internal occurrence telemetry and external enrichment providers.</p>
      </div>

      <div className="bg-[#0d1527] border border-[#1b2a4a] rounded-2xl overflow-hidden">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-[#111936] text-slate-400 border-b border-[#1b2a4a]">
              <th className="p-4">Source IP</th>
              <th>Attack Vector</th>
              <th>Occurrences</th>
              <th>Max Risk</th>
              <th>Severity</th>
              <th>Provider Source</th>
              <th>Last Seen</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1b2a4a]">
            {indicators.map((ind) => (
              <tr key={ind.id} className="hover:bg-[#131f38] text-slate-300">
                <td className="p-4 font-mono font-bold text-[#00f0ff]">{ind.source_ip}</td>
                <td className="font-semibold text-white">{ind.attack_vector}</td>
                <td className="font-bold">{ind.occurrence_count}</td>
                <td className="font-bold">{ind.max_risk_score} / 100</td>
                <td>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    ind.severity === 'CRITICAL' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-amber-500/20 text-amber-400'
                  }`}>
                    {ind.severity}
                  </span>
                </td>
                <td>
                  <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
                    {ind.source}
                  </span>
                </td>
                <td>{ind.last_seen}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
