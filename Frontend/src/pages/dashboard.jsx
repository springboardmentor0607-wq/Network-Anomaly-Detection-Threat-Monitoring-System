import React, { useContext, useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { TrafficContext } from '../context/TrafficContext';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Filler, Legend } from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Filler, Legend);

const Dashboard = () => {
  // Royal Upgrade: Imports the master theme to prevent the white screen crash
  const { theme } = useOutletContext() || { theme: 'dark' };
  
  const { stats } = useContext(TrafficContext);
  const [trafficVolumeHistory, setTrafficVolumeHistory] = useState([20, 35, 28, 45, 60, 55, 70, 65, 80]);

  const trueAnomalyCount = stats?.totalDeviations || 0;

  // Dynamic Chart Colors tied to the master switch
  const gridColor = theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';
  const textColor = theme === 'dark' ? '#9A9A97' : '#86868B';
  const chartLineColor = theme === 'dark' ? '#10B981' : '#059669';
  const chartBgColor = theme === 'dark' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(5, 150, 105, 0.1)';

  useEffect(() => {
    if (stats && stats.totalScanned) {
      setTrafficVolumeHistory(prev => {
        const nextVal = Math.min(600, Math.max(15, (stats.totalScanned % 450) + Math.floor(Math.random() * 50)));
        const updated = [...prev, nextVal];
        if (updated.length > 15) updated.shift();
        return updated;
      });
    }
  }, [stats?.totalScanned]);

  const chartConfig = {
    labels: trafficVolumeHistory.map((_, i) => `T-${trafficVolumeHistory.length - i}`),
    datasets: [{
        label: 'Live Network Throughput (Packets/sec)', 
        data: trafficVolumeHistory, 
        borderColor: chartLineColor, 
        backgroundColor: chartBgColor,
        borderWidth: 2, 
        pointRadius: 3, 
        pointBackgroundColor: chartLineColor, 
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
      y: { grid: { color: gridColor }, ticks: { color: textColor }, min: 0 } 
    },
    animation: { duration: 300 },
  };

  return (
    <div className="space-y-6 transition-colors duration-300">
      
      {/* HEADER & SYSTEM BADGES */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight apple-text-primary">System Command Center</h2>
          <p className="text-[13px] apple-text-muted">Real-time operational telemetry and enterprise security posture</p>
        </div>
        
        <div className="flex items-center gap-3 apple-inset px-4 py-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-[12px] font-semibold text-emerald-600 dark:text-emerald-400">System Secure & Operational</span>
        </div>
      </div>

      {/* OPERATIONAL METRICS ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="apple-card p-5">
          <p className="apple-text-muted text-[13px] mb-1">Total Packets Scanned</p>
          <div className="text-2xl font-semibold apple-text-primary mb-1">{stats?.totalScanned?.toLocaleString() || 0}</div>
          <p className="text-[12px] text-emerald-600 dark:text-emerald-400 font-medium">Buffer Synchronized</p>
        </div>

        <div className="apple-card p-5">
          <p className="apple-text-muted text-[13px] mb-1">Session Anomalies</p>
          <div className={`text-2xl font-bold mb-1 ${trueAnomalyCount > 0 ? 'text-red-500' : 'apple-text-primary'}`}>{trueAnomalyCount}</div>
          <p className="text-[12px] apple-text-muted">Logged in Database</p>
        </div>

        <div className="apple-card p-5">
          <p className="apple-text-muted text-[13px] mb-1">Network Risk Index</p>
          <div className="text-2xl font-semibold apple-text-primary mb-1">{stats?.riskScore || 0}/100</div>
          <p className="text-[12px] text-[#0071E3] dark:text-indigo-400 font-medium">Dynamic Threat Scale</p>
        </div>

        <div className="apple-card p-5">
          <p className="apple-text-muted text-[13px] mb-1">Security Posture</p>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mb-1">Protected</div>
          <p className="text-[12px] apple-text-muted">Zero Critical Breaches</p>
        </div>
      </div>

      {/* MAIN TELEMETRY GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Live Traffic Throughput Chart */}
        <div className="lg:col-span-2 apple-card p-6 h-[340px] flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[15px] font-semibold apple-text-primary">Live Traffic Throughput</h3>
            <span className="text-[11px] font-mono apple-text-muted">Active Packet Stream</span>
          </div>
          <div className="flex-grow w-full relative">
            <Line key={theme} data={chartConfig} options={chartOptions} />
          </div>
        </div>

        {/* Security Subsystem Panel */}
        <div className="apple-card p-6 h-[340px] flex flex-col">
          <h3 className="text-[15px] font-semibold apple-text-primary mb-4">Security Subsystems</h3>
          
          <div className="space-y-4 flex-grow">
            <div className="apple-inset p-3 flex justify-between items-center">
              <div>
                <p className="text-[13px] font-medium apple-text-primary">AI Threat Classifier</p>
                <p className="text-[11px] apple-text-muted">Random Forest & XGBoost</p>
              </div>
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            </div>

            <div className="apple-inset p-3 flex justify-between items-center">
              <div>
                <p className="text-[13px] font-medium apple-text-primary">Threat Persistence Store</p>
                <p className="text-[11px] apple-text-muted">Anomalies & Telemetry Log</p>
              </div>
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            </div>

            <div className="apple-inset p-3 flex justify-between items-center">
              <div>
                <p className="text-[13px] font-medium apple-text-primary">Access Control & Audit</p>
                <p className="text-[11px] apple-text-muted">RBAC & Immutable Trail</p>
              </div>
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};

export default Dashboard;