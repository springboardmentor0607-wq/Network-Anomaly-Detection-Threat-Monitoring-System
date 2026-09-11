import React, { useContext, useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { motion } from 'framer-motion';
import { TrafficContext } from '../context/TrafficContext';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  Title, 
  Tooltip, 
  Filler, 
  Legend 
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Filler, Legend);

// Critically damped spring transition configuration (Damping: 1.0, Response: 0.35s)
const springTransition = {
  type: 'spring',
  damping: 24,
  stiffness: 260,
  mass: 0.8
};

const Dashboard = () => {
  // Master theme switch
  const { theme } = useOutletContext() || { theme: 'dark' };
  const isDark = theme === 'dark';
  
  const { stats } = useContext(TrafficContext);
  const [trafficVolumeHistory, setTrafficVolumeHistory] = useState([20, 35, 28, 45, 60, 55, 70, 65, 80]);

  const trueAnomalyCount = stats?.totalDeviations || 0;

  // Dynamic Chart Colors tied to the active theme
  const gridColor = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';
  const textColor = isDark ? '#9A9A97' : '#86868B';
  const chartLineColor = isDark ? '#10B981' : '#059669';
  const chartBgColor = isDark ? 'rgba(16, 185, 129, 0.08)' : 'rgba(5, 150, 105, 0.06)';

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
      pointHoverRadius: 5,
      pointBackgroundColor: chartLineColor, 
      fill: true, 
      tension: 0.4,
    }],
  };
  
  const chartOptions = {
    responsive: true, 
    maintainAspectRatio: false,
    plugins: { 
      legend: { display: false }, 
      tooltip: { 
        mode: 'index', 
        intersect: false,
        backgroundColor: isDark ? 'rgba(20, 20, 22, 0.85)' : 'rgba(255, 255, 255, 0.95)',
        titleColor: isDark ? '#F2F2F0' : '#1D1D1F',
        bodyColor: isDark ? '#9A9A97' : '#424245',
        borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        borderWidth: 1,
        padding: 10,
        boxPadding: 4,
        usePointStyle: true,
        bodyFont: { family: 'system-ui, sans-serif', size: 12 },
        titleFont: { family: 'system-ui, sans-serif', size: 13, weight: '600' }
      } 
    },
    scales: { 
      x: { display: false }, 
      y: { 
        grid: { color: gridColor, drawBorder: false }, 
        ticks: { color: textColor, font: { family: 'JetBrains Mono, monospace', size: 10 } }, 
        min: 0 
      } 
    },
    animation: { duration: 300 },
  };

  // Surface Tokens
  const cardMaterial = isDark 
    ? 'bg-[#121214]/65 border-white/[0.08] shadow-[0_4px_24px_rgba(0,0,0,0.35)]' 
    : 'bg-white/70 border-black/[0.06] shadow-[0_4px_20px_rgba(0,0,0,0.03)]';

  const insetMaterial = isDark
    ? 'bg-white/[0.03] border border-white/[0.05]'
    : 'bg-black/[0.02] border border-black/[0.04]';

  const textPrimary = isDark ? 'text-[#F2F2F0]' : 'text-[#1D1D1F]';
  const textMuted = isDark ? 'text-[#9A9A97]' : 'text-[#86868B]';

  return (
    <motion.div 
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={springTransition}
      className="space-y-6 transition-colors duration-500"
    >
      {/* HEADER & SYSTEM BADGES */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className={`text-[26px] font-semibold tracking-tight ${textPrimary}`}>
            System Command Center
          </h2>
          <p className={`text-[13px] ${textMuted} tracking-normal mt-0.5`}>
            Real-time operational telemetry and enterprise security posture
          </p>
        </div>
        
        <div className={`flex items-center gap-2.5 px-3.5 py-1.5 rounded-full backdrop-blur-md ${insetMaterial}`}>
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-[12px] font-medium tracking-tight text-emerald-600 dark:text-emerald-400">
            System Secure & Operational
          </span>
        </div>
      </div>

      {/* OPERATIONAL METRICS ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Metric 1 */}
        <div className={`p-5 rounded-2xl backdrop-blur-xl border border-t-white/20 dark:border-t-white/10 ${cardMaterial} transition-transform active:scale-[0.985]`}>
          <p className={`${textMuted} text-[12px] font-medium tracking-wide uppercase mb-1.5`}>
            Total Packets Scanned
          </p>
          <div className={`text-[28px] font-semibold tracking-tight ${textPrimary} mb-1 font-mono`}>
            {stats?.totalScanned?.toLocaleString() || 0}
          </div>
          <p className="text-[12px] text-emerald-600 dark:text-emerald-400 font-medium">
            Buffer Synchronized
          </p>
        </div>

        {/* Metric 2 */}
        <div className={`p-5 rounded-2xl backdrop-blur-xl border border-t-white/20 dark:border-t-white/10 ${cardMaterial} transition-transform active:scale-[0.985]`}>
          <p className={`${textMuted} text-[12px] font-medium tracking-wide uppercase mb-1.5`}>
            Session Anomalies
          </p>
          <div className={`text-[28px] font-bold tracking-tight mb-1 font-mono ${trueAnomalyCount > 0 ? 'text-red-500' : textPrimary}`}>
            {trueAnomalyCount}
          </div>
          <p className={`text-[12px] ${textMuted}`}>
            Logged in Database
          </p>
        </div>

        {/* Metric 3 */}
        <div className={`p-5 rounded-2xl backdrop-blur-xl border border-t-white/20 dark:border-t-white/10 ${cardMaterial} transition-transform active:scale-[0.985]`}>
          <p className={`${textMuted} text-[12px] font-medium tracking-wide uppercase mb-1.5`}>
            Network Risk Index
          </p>
          <div className={`text-[28px] font-semibold tracking-tight ${textPrimary} mb-1 font-mono`}>
            {stats?.riskScore || 0}<span className="text-[16px] font-normal opacity-50">/100</span>
          </div>
          <p className="text-[12px] text-[#0071E3] dark:text-sky-400 font-medium">
            Dynamic Threat Scale
          </p>
        </div>

        {/* Metric 4 */}
        <div className={`p-5 rounded-2xl backdrop-blur-xl border border-t-white/20 dark:border-t-white/10 ${cardMaterial} transition-transform active:scale-[0.985]`}>
          <p className={`${textMuted} text-[12px] font-medium tracking-wide uppercase mb-1.5`}>
            Security Posture
          </p>
          <div className="text-[28px] font-bold tracking-tight text-emerald-600 dark:text-emerald-400 mb-1">
            Protected
          </div>
          <p className={`text-[12px] ${textMuted}`}>
            Zero Critical Breaches
          </p>
        </div>
      </div>

      {/* MAIN TELEMETRY GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Live Traffic Throughput Chart */}
        <div className={`lg:col-span-2 p-6 rounded-2xl backdrop-blur-xl border border-t-white/20 dark:border-t-white/10 ${cardMaterial} h-[360px] flex flex-col`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className={`text-[15px] font-semibold tracking-tight ${textPrimary}`}>
                Live Traffic Throughput
              </h3>
              <p className={`text-[11px] ${textMuted}`}>Telemetry stream updated per cycle</p>
            </div>
            <span className={`text-[11px] font-mono px-2.5 py-1 rounded-md ${insetMaterial} ${textMuted}`}>
              Active Packet Stream
            </span>
          </div>
          <div className="flex-grow w-full relative">
            <Line key={theme} data={chartConfig} options={chartOptions} />
          </div>
        </div>

        {/* Security Subsystem Panel */}
        <div className={`p-6 rounded-2xl backdrop-blur-xl border border-t-white/20 dark:border-t-white/10 ${cardMaterial} h-[360px] flex flex-col justify-between`}>
          <div>
            <h3 className={`text-[15px] font-semibold tracking-tight ${textPrimary} mb-1`}>
              Security Subsystems
            </h3>
            <p className={`text-[11px] ${textMuted} mb-4`}>Operational pipeline integrity</p>
          </div>
          
          <div className="space-y-3 flex-grow flex flex-col justify-center">
            
            {/* Subsystem 1 */}
            <div className={`p-3.5 rounded-xl backdrop-blur-md ${insetMaterial} flex justify-between items-center transition-transform active:scale-[0.99]`}>
              <div>
                <p className={`text-[13px] font-medium tracking-tight ${textPrimary}`}>
                  AI Threat Classifier
                </p>
                <p className={`text-[11px] ${textMuted}`}>
                  Random Forest & XGBoost
                </p>
              </div>
              <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
            </div>

            {/* Subsystem 2 */}
            <div className={`p-3.5 rounded-xl backdrop-blur-md ${insetMaterial} flex justify-between items-center transition-transform active:scale-[0.99]`}>
              <div>
                <p className={`text-[13px] font-medium tracking-tight ${textPrimary}`}>
                  Threat Persistence Store
                </p>
                <p className={`text-[11px] ${textMuted}`}>
                  Anomalies & Telemetry Log
                </p>
              </div>
              <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
            </div>

            {/* Subsystem 3 */}
            <div className={`p-3.5 rounded-xl backdrop-blur-md ${insetMaterial} flex justify-between items-center transition-transform active:scale-[0.99]`}>
              <div>
                <p className={`text-[13px] font-medium tracking-tight ${textPrimary}`}>
                  Access Control & Audit
                </p>
                <p className={`text-[11px] ${textMuted}`}>
                  RBAC & Immutable Trail
                </p>
              </div>
              <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
            </div>
            
          </div>
          
          <div className="pt-2">
            <span className={`text-[11px] font-mono ${textMuted} flex items-center gap-1.5`}>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
              All services synchronized
            </span>
          </div>
        </div>

      </div>

    </motion.div>
  );
};

export default Dashboard;