import React, { useState } from 'react';

const ThreatDetection = () => {
  const [timeframe, setTimeframe] = useState('24h');

  // Mock data for forecasted threats and intrusion predictions
  const predictions = [
    { id: 'thr_101', vector: 'DDoS Amplification', target: '10.0.1.1 (Web Gateway)', probability: 94, riskScore: 9.8, timeframe: 'Within 2 hours', status: 'High Alert' },
    { id: 'thr_102', vector: 'Ransomware Payload Drop', target: '10.0.4.50 (DB Server)', probability: 82, riskScore: 8.5, timeframe: 'Within 6 hours', status: 'Monitoring' },
    { id: 'thr_103', vector: 'Credential Stuffing', target: 'Auth API endpoint', probability: 76, riskScore: 6.2, timeframe: 'Ongoing', status: 'Mitigating' },
    { id: 'thr_104', vector: 'Lateral Movement (SMB)', target: 'Internal Subnet 192.168.2.x', probability: 64, riskScore: 7.1, timeframe: 'Within 12 hours', status: 'Monitoring' },
    { id: 'thr_105', vector: 'SQL Injection Sweep', target: 'Public-facing forms', probability: 45, riskScore: 4.5, timeframe: 'Within 24 hours', status: 'Low Risk' },
  ];

  const getRiskColor = (score) => {
    if (score >= 8.0) return 'text-red-400';
    if (score >= 6.0) return 'text-orange-400';
    if (score >= 4.0) return 'text-yellow-400';
    return 'text-emerald-400';
  };

  const getProbabilityBarColor = (prob) => {
    if (prob >= 80) return 'bg-red-500';
    if (prob >= 60) return 'bg-orange-500';
    return 'bg-blue-500';
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header & Global Risk Score */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-[18px] font-semibold text-[#F2F2F0]">Intrusion Prediction Engine</h2>
          <p className="text-[13px] text-[#9A9A97]">AI-driven threat forecasting and attack probability analysis</p>
        </div>
        <div className="flex items-center gap-4 bg-red-500/10 border border-red-500/20 px-5 py-3 rounded-xl">
          <div className="flex flex-col">
            <span className="text-[11px] text-red-400/80 uppercase tracking-wider font-semibold">Global Risk Score</span>
            <div className="flex items-baseline gap-1">
              <span className="text-[24px] font-bold text-red-400 leading-none">84</span>
              <span className="text-[13px] text-red-400/60">/100</span>
            </div>
          </div>
          <div className="w-px h-10 bg-red-500/20 mx-2"></div>
          <div className="text-[12px] text-red-400/80 max-w-[120px] leading-tight">
            Elevated risk of inbound volumetric attacks detected.
          </div>
        </div>
      </div>

      {/* Predictive Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Forecasted Intrusions', value: '12', subtext: 'Predicted in next 24h' },
          { label: 'Active Threat Actors', value: '3', subtext: 'Known APTs identified' },
          { label: 'Most Vulnerable Asset', value: 'Web Gateway', subtext: '10.0.1.1 (94% attack prob)' },
          { label: 'Auto-Mitigation Readiness', value: '98%', subtext: 'Systems armed and ready' },
        ].map((metric, i) => (
          <div key={i} className="bg-[#0A0A0B]/60 backdrop-blur-sm border border-white/[0.07] rounded-xl p-5 flex flex-col justify-between">
            <h3 className="text-[13px] font-medium text-[#9A9A97] mb-3">{metric.label}</h3>
            <div>
              <div className="text-[20px] font-semibold tracking-tight text-[#F2F2F0]">{metric.value}</div>
              <div className="text-[12px] text-[#9A9A97] mt-1">{metric.subtext}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Forecasting Visualizations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attack Probability Matrix */}
        <div className="bg-[#0A0A0B]/60 backdrop-blur-sm border border-white/[0.07] rounded-xl p-6 h-80 flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-[15px] font-medium">Attack Probability Matrix</h2>
            <div className="text-[12px] text-[#9A9A97] bg-white/[0.04] px-2 py-1 rounded">Next 7 Days</div>
          </div>
          <div className="flex-1 border border-white/[0.03] border-dashed rounded-lg flex flex-col items-center justify-center text-[#9A9A97]">
            <span className="text-[13px] mb-2">[ Heatmap Visualization ]</span>
            <span className="text-[11px] opacity-60">Mapping target assets vs. predicted threat vectors</span>
          </div>
        </div>

        {/* Threat Trajectory */}
        <div className="bg-[#0A0A0B]/60 backdrop-blur-sm border border-white/[0.07] rounded-xl p-6 h-80 flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-[15px] font-medium">Risk Score Trajectory</h2>
            <div className="flex gap-2">
              <button onClick={() => setTimeframe('24h')} className={`text-[11px] px-2 py-1 rounded ${timeframe === '24h' ? 'bg-white/10 text-white' : 'text-[#9A9A97]'}`}>24h</button>
              <button onClick={() => setTimeframe('7d')} className={`text-[11px] px-2 py-1 rounded ${timeframe === '7d' ? 'bg-white/10 text-white' : 'text-[#9A9A97]'}`}>7d</button>
            </div>
          </div>
          <div className="flex-1 border border-white/[0.03] border-dashed rounded-lg flex flex-col items-center justify-center text-[#9A9A97]">
            <span className="text-[13px] mb-2">[ Forecasting Line Chart ]</span>
            <span className="text-[11px] opacity-60">Historical risk score + AI projected trajectory</span>
          </div>
        </div>
      </div>

      {/* Predictive Threat Feed Table */}
      <div className="bg-[#0A0A0B]/60 backdrop-blur-sm border border-white/[0.07] rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-white/[0.07] flex justify-between items-center bg-white/[0.01]">
          <h2 className="text-[15px] font-medium">Forecasted Threats Feed</h2>
          <button className="text-[12px] text-[#D6D6D3] bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.1] px-3 py-1.5 rounded transition-colors">
            Export Report
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/[0.02] border-b border-white/[0.07] text-[#9A9A97] text-[11px] uppercase tracking-wider">
                <th className="px-6 py-3 font-semibold">Threat Vector</th>
                <th className="px-6 py-3 font-semibold">Target Asset</th>
                <th className="px-6 py-3 font-semibold">Attack Probability</th>
                <th className="px-6 py-3 font-semibold">Risk (0-10)</th>
                <th className="px-6 py-3 font-semibold">Est. Timeframe</th>
                <th className="px-6 py-3 font-semibold">Status</th>
                <th className="px-6 py-3 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.03]">
              {predictions.map((threat) => (
                <tr key={threat.id} className="hover:bg-white/[0.02] transition-colors group text-[13px]">
                  <td className="px-6 py-4 font-medium text-[#F2F2F0]">{threat.vector}</td>
                  <td className="px-6 py-4 font-mono text-[#D6D6D3] text-[12px]">{threat.target}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 w-32">
                      <span className="text-[12px] text-[#9A9A97] w-8">{threat.probability}%</span>
                      <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${getProbabilityBarColor(threat.probability)}`} 
                          style={{ width: `${threat.probability}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`font-semibold ${getRiskColor(threat.riskScore)}`}>
                      {threat.riskScore.toFixed(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-[#9A9A97]">{threat.timeframe}</td>
                  <td className="px-6 py-4">
                    <span className={`text-[11px] px-2 py-1 rounded border ${
                      threat.status === 'High Alert' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                      threat.status === 'Mitigating' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                      'bg-white/[0.05] text-[#9A9A97] border-white/10'
                    }`}>
                      {threat.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-[12px] text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
                      Investigate
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
    </div>
  );
};

export default ThreatDetection;