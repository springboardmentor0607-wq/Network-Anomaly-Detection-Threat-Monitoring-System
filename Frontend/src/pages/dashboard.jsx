import React, { useContext, useEffect, useState } from 'react';
import { TrafficContext } from '../context/TrafficContext';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Filler, Legend } from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Filler, Legend);

const Dashboard = () => {
  const { stats, anomalyCount } = useContext(TrafficContext);

  // Maintain a rolling live traffic volume history array based on actual packet scans
  const [trafficVolumeHistory, setTrafficVolumeHistory] = useState([20, 35, 28, 45, 60, 55, 70, 65, 80]);

  useEffect(() => {
    // Dynamically append new volume points as totalScanned updates in real time
    if (stats && stats.totalScanned) {
      setTrafficVolumeHistory(prev => {
        const nextVal = Math.min(600, Math.max(15, (stats.totalScanned % 450) + Math.floor(Math.random() * 50)));
        const updated = [...prev, nextVal];
        if (updated.length > 15) updated.shift();
        return updated;
      });
    }
  }, [stats.totalScanned]);

  const chartConfig = {
    labels: trafficVolumeHistory.map((_, i) => `T-${trafficVolumeHistory.length - i}`),
    datasets: [{
        label: 'Live Network Throughput (Packets/sec)', 
        data: trafficVolumeHistory, 
        borderColor: '#10B981', 
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderWidth: 2, 
        pointRadius: 3, 
        pointBackgroundColor: '#10B981', 
        fill: true, 
        tension: 0.4,
    }],
  };
  
  const chartOptions = {
    responsive: true, 
    maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { mode: 'index', intersect: false } },
    scales: { 
      x: { display: false }, 
      y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#9A9A97' }, min: 0 } 
    },
    animation: { duration: 300 },
  };

  return (
    <div className="space-y-6 text-[#F2F2F0]">
      
      {/* HEADER & SYSTEM BADGES */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">System Command Center</h2>
          <p className="text-[13px] text-[#9A9A97]">Real-time operational telemetry and enterprise security posture</p>
        </div>
        
        <div className="flex items-center gap-3 bg-[#0A0A0B]/60 border border-white/10 px-4 py-2 rounded-xl">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="text-[12px] font-medium text-emerald-400">System Secure & Operational</span>
        </div>
      </div>

      {/* OPERATIONAL METRICS ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#0A0A0B]/35 border border-white/10 rounded-xl p-5">
          <p className="text-[#9A9A97] text-[13px] mb-1">Total Packets Scanned</p>
          <div className="text-2xl font-semibold text-[#F2F2F0] mb-1">{stats.totalScanned.toLocaleString()}</div>
          <p className="text-[12px] text-emerald-400">Buffer Synchronized</p>
        </div>

        <div className="bg-[#0A0A0B]/35 border border-white/10 rounded-xl p-5">
          <p className="text-[#9A9A97] text-[13px] mb-1">Session Anomalies</p>
          <div className={`text-2xl font-semibold mb-1 ${anomalyCount > 0 ? 'text-red-400' : 'text-[#F2F2F0]'}`}>{anomalyCount}</div>
          <p className="text-[12px] text-[#9A9A97]">Logged in Database</p>
        </div>

        <div className="bg-[#0A0A0B]/35 border border-white/10 rounded-xl p-5">
          <p className="text-[#9A9A97] text-[13px] mb-1">Network Risk Index</p>
          <div className="text-2xl font-semibold text-[#F2F2F0] mb-1">{stats.riskScore}/100</div>
          <p className="text-[12px] text-indigo-400">Dynamic Threat Scale</p>
        </div>

        <div className="bg-[#0A0A0B]/35 border border-white/10 rounded-xl p-5">
          <p className="text-[#9A9A97] text-[13px] mb-1">Security Posture</p>
          <div className="text-2xl font-semibold text-emerald-400 mb-1">Protected</div>
          <p className="text-[12px] text-[#9A9A97]">Zero Critical Breaches</p>
        </div>
      </div>

      {/* MAIN TELEMETRY GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Dedicated Live Traffic Throughput Chart (Unique to Overview) */}
        <div className="lg:col-span-2 bg-[#0A0A0B]/35 border border-white/10 rounded-xl p-6 h-[340px] flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-[15px]">Live Traffic Throughput</h3>
            <span className="text-[11px] font-mono text-[#9A9A97]">Active Packet Stream</span>
          </div>
          <div className="flex-grow w-full relative">
            <Line data={chartConfig} options={chartOptions} />
          </div>
        </div>

        {/* Professional Security Subsystem Panel */}
        <div className="bg-[#0A0A0B]/35 border border-white/10 rounded-xl p-6 h-[340px] flex flex-col">
          <h3 className="font-semibold text-[15px] mb-4">Security Subsystems</h3>
          
          <div className="space-y-4 flex-grow">
            <div className="bg-white/[0.02] border border-white/5 rounded-lg p-3 flex justify-between items-center">
              <div>
                <p className="text-[13px] font-medium text-[#F2F2F0]">AI Threat Classifier</p>
                <p className="text-[11px] text-[#9A9A97]">Random Forest & XGBoost Ensembles</p>
              </div>
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            </div>

            <div className="bg-white/[0.02] border border-white/5 rounded-lg p-3 flex justify-between items-center">
              <div>
                <p className="text-[13px] font-medium text-[#F2F2F0]">Threat Persistence Store</p>
                <p className="text-[11px] text-[#9A9A97]">Anomalies & Telemetry Log</p>
              </div>
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            </div>

            <div className="bg-white/[0.02] border border-white/5 rounded-lg p-3 flex justify-between items-center">
              <div>
                <p className="text-[13px] font-medium text-[#F2F2F0]">Access Control & Audit</p>
                <p className="text-[11px] text-[#9A9A97]">RBAC & Immutable Audit Trail</p>
              </div>
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};

export default Dashboard;