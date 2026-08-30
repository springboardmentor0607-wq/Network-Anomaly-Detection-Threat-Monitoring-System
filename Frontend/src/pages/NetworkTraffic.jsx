import React, { useContext } from 'react';
import { useOutletContext } from 'react-router-dom';
import { TrafficContext } from '../context/TrafficContext';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Filler, Legend } from 'chart.js';
import { Line } from 'react-chartjs-2';
import ProtocolBreakdown from '../components/ProtocolBreakdown'; 

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Filler, Legend);

const NetworkTraffic = () => {
  // Royal Upgrade: Wired into the master theme toggle
  const { theme } = useOutletContext() || { theme: 'dark' };
  const { selectedDataset, setSelectedDataset, packets, chartData, status, stats } = useContext(TrafficContext);

  const trueAnomalyCount = stats?.totalDeviations || 0;

  // Dynamic Chart Colors
  const gridColor = theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';
  const textColor = theme === 'dark' ? '#9A9A97' : '#86868B';
  const chartLineColor = theme === 'dark' ? '#10B981' : '#059669';
  const chartBgColor = theme === 'dark' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(5, 150, 105, 0.1)';

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
    scales: { x: { display: false }, y: { grid: { color: gridColor }, ticks: { color: textColor } } },
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

  return (
    <div className="w-full max-w-[calc(100vw-300px)] overflow-hidden p-6 space-y-6 transition-colors duration-300">

      {/* HEADER */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight apple-text-primary">Network Traffic</h2>
          <p className="text-[13px] apple-text-muted">Real-time packet inspection and live AI classification stream</p>
        </div>
        <div className="flex items-center gap-3 bg-white dark:bg-[#0A0A0B]/60 border border-black/5 dark:border-white/[0.07] px-4 py-2 rounded-lg transition-colors">
          <span className="text-[12px] apple-text-muted">Active Mode:</span>
          
          <select 
            value={selectedDataset} 
            onChange={(e) => setSelectedDataset(e.target.value)} 
            className="bg-transparent text-[13px] apple-text-primary font-medium outline-none cursor-pointer"
          >
            <option value="cicids2017" className="bg-white dark:bg-[#0A0A0B]">CICIDS2017 Dataset</option>
            <option value="unsw-nb15" className="bg-white dark:bg-[#0A0A0B]">UNSW-NB15 Dataset</option>
            <option value="live_network" className="bg-white dark:bg-[#0A0A0B] text-emerald-600 dark:text-emerald-400 font-bold">Live Network (Mac Wi-Fi)</option>
          </select>
        </div>
      </div>

      {/* STATS ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
        <div className="apple-card bg-white dark:bg-[#0A0A0B] border border-black/5 dark:border-white/5 p-5 transition-colors">
          <p className="apple-text-muted text-[13px] mb-1">Current Status</p>
          <h3 className={`text-lg font-semibold truncate ${status.includes('Active') || status.includes('Live') ? 'text-emerald-600 dark:text-emerald-500' : 'text-amber-500'}`}>{status}</h3>
        </div>
        <div className="apple-card bg-white dark:bg-[#0A0A0B] border border-black/5 dark:border-white/5 p-5 transition-colors">
          <p className="apple-text-muted text-[13px] mb-1">Session Anomalies</p>
          <h3 className={`text-lg font-semibold truncate ${trueAnomalyCount > 0 ? 'text-red-600 dark:text-red-500' : 'apple-text-primary'}`}>{trueAnomalyCount} Detected</h3>
        </div>
        <div className="apple-card bg-white dark:bg-[#0A0A0B] border border-black/5 dark:border-white/5 p-5 transition-colors">
          <p className="apple-text-muted text-[13px] mb-1">Data Source</p>
          <h3 className="text-lg font-semibold apple-text-primary truncate uppercase">
            {selectedDataset === 'live_network' ? 'Live Mac Interface' : selectedDataset}
          </h3>
        </div>
      </div>

      {/* CHARTS ROW */}
      <div className="flex flex-col lg:flex-row gap-6 w-full">
        
        {/* Live Traffic Throughput */}
        <div className="apple-card bg-white dark:bg-[#0A0A0B] border border-black/5 dark:border-white/5 p-6 w-full lg:w-2/3 h-[280px] flex flex-col transition-colors">
           <div className="flex items-center justify-between mb-4">
               <h3 className="font-semibold text-[15px] apple-text-primary">Live Traffic Throughput</h3>
           </div>
           <div className="flex-grow w-full relative">
              <Line key={theme} data={chartConfig} options={chartOptions} />
           </div>
        </div>

        {/* Protocol Breakdown Chart */}
        <div className="w-full lg:w-1/3 h-[280px]">
          <ProtocolBreakdown />
        </div>
        
      </div>

      {/* TRUE UNIFIED SOC PACKET STREAM TABLE */}
      <div className="apple-card bg-white dark:bg-[#0A0A0B] border border-black/5 dark:border-white/5 p-6 w-full max-w-full overflow-hidden transition-colors">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-semibold text-[15px] apple-text-primary">Live Packet Stream & AI Diagnostics</h3>
          <div className="flex items-center gap-2">
             <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
             <span className="text-[12px] apple-text-muted">AI Engine Online</span>
          </div>
        </div>

        <div className="w-full overflow-x-auto rounded-lg border border-black/5 dark:border-white/5">
          <table className="w-full text-left text-[12px] whitespace-nowrap">
            
            <thead className="bg-black/[0.02] dark:bg-white/5 border-b border-black/5 dark:border-white/10 apple-text-muted transition-colors">
              <tr>
                <th className="p-3 font-semibold uppercase tracking-wider">Source IP</th>
                <th className="p-3 font-semibold uppercase tracking-wider">Destination IP</th>
                <th className="p-3 font-semibold uppercase tracking-wider">Protocol</th>
                <th className="p-3 font-semibold uppercase tracking-wider">Duration (s)</th>
                <th className="p-3 font-semibold uppercase tracking-wider">Port / Service</th>
                <th className="p-3 font-semibold uppercase tracking-wider text-right">AI Verdict</th>
              </tr>
            </thead>
            
            <tbody className="divide-y divide-black/[0.05] dark:divide-white/[0.03]">
              {packets.length === 0 ? (
                <tr><td colSpan={6} className="py-8 text-center apple-text-muted">Waiting for network stream...</td></tr>
              ) : (
                packets.map((packet, index) => {
                  const data = parsePacketData(packet); 
                  
                  return (
                    <tr key={index} className={`border-b border-black/5 dark:border-white/5 transition-colors ${data.isAnomaly ? 'bg-red-50 dark:bg-red-500/5 hover:bg-red-100 dark:hover:bg-red-500/10' : 'hover:bg-black/[0.02] dark:hover:bg-white/[0.04]'}`}>
                      <td className="p-3 text-[#1D1D1F] dark:text-[#D6D6D3] font-mono">{data.source}</td>
                      <td className="p-3 text-[#1D1D1F] dark:text-[#D6D6D3] font-mono">{data.dest}</td>
                      <td className="p-3 apple-text-primary font-bold">{data.proto}</td>
                      <td className="p-3 text-[#1D1D1F] dark:text-[#D6D6D3] font-mono">{data.duration}</td>
                      <td className="p-3 apple-text-muted font-mono">{data.service}</td>
                      
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
      </div>
      
    </div>
  );
};

export default NetworkTraffic;