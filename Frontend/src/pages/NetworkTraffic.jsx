import React, { useContext } from 'react';
import { useOutletContext } from 'react-router-dom';
import { TrafficContext } from '../context/TrafficContext';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Filler, Legend } from 'chart.js';
import { Line } from 'react-chartjs-2';
import ProtocolBreakdown from '../components/ProtocolBreakdown'; 
import { motion } from 'framer-motion';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Filler, Legend);

const fadeInUp = {
  initial: { opacity: 0, y: 15 },
  animate: { opacity: 1, y: 0 },
  transition: { type: 'spring', damping: 24, stiffness: 260 }
};

const NetworkTraffic = () => {
  const { theme } = useOutletContext() || { theme: 'dark' };
  const isDark = theme === 'dark';
  
  const { selectedDataset, setSelectedDataset, packets, chartData, status, stats } = useContext(TrafficContext);

  const trueAnomalyCount = stats?.totalDeviations || 0;

  // Dynamic Chart Colors
  const gridColor = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';
  const textColor = isDark ? '#9A9A97' : '#86868B';
  const chartLineColor = isDark ? '#10B981' : '#059669';
  const chartBgColor = isDark ? 'rgba(16, 185, 129, 0.1)' : 'rgba(5, 150, 105, 0.1)';

  const chartConfig = {
    labels: chartData.map((_, i) => `T-${15 - i}`),
    datasets: [{
        label: 'Metric Value', 
        data: chartData, 
        borderColor: chartLineColor, 
        backgroundColor: chartBgColor,
        borderWidth: 2, 
        pointRadius: 2, 
        pointBackgroundColor: chartLineColor, 
        fill: true, 
        tension: 0.4,
    }],
  };
  
  const chartOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { mode: 'index', intersect: false } },
    scales: { 
      x: { display: false }, 
      y: { grid: { color: gridColor, drawBorder: false }, ticks: { color: textColor, font: { family: 'JetBrains Mono, monospace', size: 10 } } } 
    },
    animation: { duration: 0 },
  };

  const parsePacketData = (p) => {
    const source = p['Source IP'] || p['srcip'] || p['id.orig_h'] || '192.168.x.x';
    const dest = p['Destination IP'] || p['dstip'] || p['id.resp_h'] || 'External Asset';
    const rawProto = p['Protocol'] || p['proto'] || 'TCP';
    const proto = rawProto === 6 ? 'TCP' : rawProto === 17 ? 'UDP' : String(rawProto).toUpperCase();
    const durationRaw = p['Flow Duration'] || p['dur'] || p['duration'] || 0;
    const duration = Number(durationRaw).toFixed(4);
    const service = p['Destination Port'] || p['service'] || p['id.resp_p'] || p['spkts'] || '-';

    return { source, dest, proto, duration, service, verdict: p.ai_classification, isAnomaly: p.is_anomaly };
  };

  // Surface Tokens
  const cardMaterial = isDark 
    ? 'bg-[#121214]/65 border border-white/[0.08] shadow-[0_4px_24px_rgba(0,0,0,0.35)] backdrop-blur-xl rounded-2xl' 
    : 'bg-white/70 border border-black/[0.06] shadow-[0_4px_20px_rgba(0,0,0,0.03)] backdrop-blur-xl rounded-2xl';
  const textPrimary = isDark ? 'text-[#F2F2F0]' : 'text-[#1D1D1F]';
  const textMuted = isDark ? 'text-[#9A9A97]' : 'text-[#86868B]';

  return (
    <div className="w-full max-w-[calc(100vw-300px)] overflow-hidden p-6 space-y-6 transition-colors duration-500">

      {/* HEADER */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className={`text-[24px] font-semibold tracking-tight ${textPrimary}`}>Network Traffic</h2>
          <p className={`text-[13px] ${textMuted} mt-0.5`}>Real-time packet inspection and live AI classification stream</p>
        </div>
        <div className={`flex items-center gap-3 px-4 py-2 rounded-xl transition-colors ${cardMaterial}`}>
          <span className={`text-[12px] ${textMuted} font-medium`}>Active Mode:</span>
          <select 
            value={selectedDataset} 
            onChange={(e) => setSelectedDataset(e.target.value)} 
            className={`bg-transparent text-[13px] ${textPrimary} font-semibold outline-none cursor-pointer`}
          >
            <option value="cicids2017" className={isDark ? 'bg-[#1C1C1E]' : 'bg-white'}>CICIDS2017 Dataset</option>
            <option value="unsw-nb15" className={isDark ? 'bg-[#1C1C1E]' : 'bg-white'}>UNSW-NB15 Dataset</option>
            <option value="live_network" className={`${isDark ? 'bg-[#1C1C1E]' : 'bg-white'} text-emerald-600 dark:text-emerald-400 font-bold`}>Live Network (Mac Wi-Fi)</option>
          </select>
        </div>
      </div>

      {/* STATS ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
        <motion.div {...fadeInUp} className={`${cardMaterial} p-5 transition-transform hover:scale-[1.01]`}>
          <p className={`text-[12px] font-medium tracking-wide uppercase mb-1.5 ${textMuted}`}>Current Status</p>
          <h3 className={`text-[22px] font-semibold tracking-tight truncate ${status.includes('Active') || status.includes('Live') ? 'text-emerald-600 dark:text-emerald-500' : 'text-amber-500'}`}>{status}</h3>
        </motion.div>
        
        <motion.div {...fadeInUp} transition={{ delay: 0.1 }} className={`${cardMaterial} p-5 transition-transform hover:scale-[1.01]`}>
          <p className={`text-[12px] font-medium tracking-wide uppercase mb-1.5 ${textMuted}`}>Session Anomalies</p>
          <h3 className={`text-[22px] font-semibold tracking-tight truncate ${trueAnomalyCount > 0 ? 'text-red-600 dark:text-red-500' : textPrimary}`}>{trueAnomalyCount} Detected</h3>
        </motion.div>
        
        <motion.div {...fadeInUp} transition={{ delay: 0.2 }} className={`${cardMaterial} p-5 transition-transform hover:scale-[1.01]`}>
          <p className={`text-[12px] font-medium tracking-wide uppercase mb-1.5 ${textMuted}`}>Data Source</p>
          <h3 className={`text-[22px] font-semibold tracking-tight truncate uppercase ${textPrimary}`}>
            {selectedDataset === 'live_network' ? 'Live Mac Interface' : selectedDataset}
          </h3>
        </motion.div>
      </div>

      {/* CHARTS ROW */}
      <div className="flex flex-col lg:flex-row gap-6 w-full">
        
        {/* Live Traffic Throughput */}
        <motion.div {...fadeInUp} className={`${cardMaterial} p-6 w-full lg:w-2/3 h-[300px] flex flex-col`}>
           <div className="flex items-center justify-between mb-4">
               <h3 className={`font-semibold tracking-tight text-[15px] ${textPrimary}`}>Live Traffic Throughput</h3>
           </div>
           <div className="flex-grow w-full relative">
              <Line key={theme} data={chartConfig} options={chartOptions} />
           </div>
        </motion.div>

        {/* Protocol Breakdown Chart */}
        <motion.div {...fadeInUp} className="w-full lg:w-1/3 h-[300px]">
          {/* ProtocolBreakdown should ideally be wrapped in cardMaterial inside its own file */}
          <ProtocolBreakdown />
        </motion.div>
        
      </div>

      {/* TRUE UNIFIED SOC PACKET STREAM TABLE */}
      <motion.div {...fadeInUp} className={`${cardMaterial} p-6 w-full max-w-full overflow-hidden`}>
        <div className="flex items-center justify-between mb-6">
          <h3 className={`font-semibold tracking-tight text-[15px] ${textPrimary}`}>Live Packet Stream & AI Diagnostics</h3>
          <div className="flex items-center gap-2">
             <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
             <span className={`text-[12px] font-medium ${textMuted}`}>AI Engine Online</span>
          </div>
        </div>

        <div className={`w-full overflow-x-auto rounded-xl border ${isDark ? 'border-white/10' : 'border-black/5'}`}>
          <table className="w-full text-left text-[12px] whitespace-nowrap">
            
            <thead className={`border-b ${isDark ? 'bg-white/5 border-white/10' : 'bg-black/[0.02] border-black/5'} transition-colors`}>
              <tr>
                <th className={`p-3 font-semibold uppercase tracking-wider ${textMuted}`}>Source IP</th>
                <th className={`p-3 font-semibold uppercase tracking-wider ${textMuted}`}>Destination IP</th>
                <th className={`p-3 font-semibold uppercase tracking-wider ${textMuted}`}>Protocol</th>
                <th className={`p-3 font-semibold uppercase tracking-wider ${textMuted}`}>Duration (s)</th>
                <th className={`p-3 font-semibold uppercase tracking-wider ${textMuted}`}>Port / Service</th>
                <th className={`p-3 font-semibold uppercase tracking-wider text-right ${textMuted}`}>AI Verdict</th>
              </tr>
            </thead>
            
            <tbody className={`divide-y ${isDark ? 'divide-white/[0.03]' : 'divide-black/[0.05]'}`}>
              {packets.length === 0 ? (
                <tr><td colSpan={6} className={`py-12 text-center ${textMuted}`}>Waiting for network stream...</td></tr>
              ) : (
                packets.map((packet, index) => {
                  const data = parsePacketData(packet); 
                  
                  return (
                    <tr key={index} className={`transition-colors ${data.isAnomaly ? (isDark ? 'bg-red-500/10 hover:bg-red-500/20' : 'bg-red-50 hover:bg-red-100') : (isDark ? 'hover:bg-white/[0.04]' : 'hover:bg-black/[0.02]')}`}>
                      <td className={`p-3 font-mono ${textPrimary}`}>{data.source}</td>
                      <td className={`p-3 font-mono ${textPrimary}`}>{data.dest}</td>
                      <td className={`p-3 font-bold ${textPrimary}`}>{data.proto}</td>
                      <td className={`p-3 font-mono ${textPrimary}`}>{data.duration}</td>
                      <td className={`p-3 font-mono ${textMuted}`}>{data.service}</td>
                      
                      <td className="p-3 text-right">
                        <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wide border ${
                          data.isAnomaly ? 'bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-500/20' : 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                        }`}>{data.verdict}</span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
      
    </div>
  );
};

export default NetworkTraffic;