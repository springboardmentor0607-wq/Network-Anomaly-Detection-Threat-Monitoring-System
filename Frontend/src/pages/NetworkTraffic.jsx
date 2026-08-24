import React, { useContext } from 'react';
import { TrafficContext } from '../context/TrafficContext';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Filler, Legend } from 'chart.js';
import { Line } from 'react-chartjs-2';
import ProtocolBreakdown from '../components/ProtocolBreakdown'; 

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Filler, Legend);

const NetworkTraffic = () => {
  const { selectedDataset, setSelectedDataset, packets, columns, chartData, status, anomalyCount } = useContext(TrafficContext);

  const chartConfig = {
    labels: chartData.map((_, i) => `T-${15 - i}`),
    datasets: [{
        label: 'Metric Value', data: chartData, borderColor: '#10B981', backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderWidth: 2, pointRadius: 2, pointBackgroundColor: '#10B981', fill: true, tension: 0.4,
    }],
  };
  
  const chartOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { mode: 'index', intersect: false } },
    scales: { x: { display: false }, y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#9A9A97' } } },
    animation: { duration: 0 },
  };

  return (
    <div className="w-full max-w-[calc(100vw-300px)] overflow-hidden p-6 text-[#F2F2F0] space-y-6">

      {/* HEADER */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Network Traffic</h2>
          <p className="text-[13px] text-[#9A9A97]">Real-time packet inspection and live AI classification stream</p>
        </div>
        <div className="flex items-center gap-3 bg-[#0A0A0B]/60 border border-white/10 px-4 py-2 rounded-xl">
          <span className="text-[12px] text-[#9A9A97]">Active Mode:</span>
          
          <select 
            value={selectedDataset} 
            onChange={(e) => setSelectedDataset(e.target.value)} 
            className="bg-transparent text-[13px] text-white font-medium outline-none cursor-pointer"
          >
            <option value="cicids2017" className="bg-[#0A0A0B]">CICIDS2017 Dataset</option>
            <option value="unsw-nb15" className="bg-[#0A0A0B]">UNSW-NB15 Dataset</option>
            <option value="live_network" className="bg-[#0A0A0B] text-emerald-400 font-bold">Live Network (Mac Wi-Fi)</option>
          </select>
          
        </div>
      </div>

      {/* STATS ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
        <div className="bg-[#0A0A0B]/35 border border-white/10 rounded-xl p-5">
          <p className="text-[#9A9A97] text-[13px] mb-1">Current Status</p>
          <h3 className={`text-lg font-semibold truncate ${status.includes('Active') || status.includes('Live') ? 'text-green-500' : 'text-yellow-500'}`}>{status}</h3>
        </div>
        <div className="bg-[#0A0A0B]/35 border border-white/10 rounded-xl p-5">
          <p className="text-[#9A9A97] text-[13px] mb-1">Session Anomalies</p>
          <h3 className={`text-lg font-semibold truncate ${anomalyCount > 0 ? 'text-red-400' : 'text-[#F2F2F0]'}`}>{anomalyCount} Detected</h3>
        </div>
        <div className="bg-[#0A0A0B]/35 border border-white/10 rounded-xl p-5">
          <p className="text-[#9A9A97] text-[13px] mb-1">Data Source</p>
          <h3 className="text-lg font-semibold truncate uppercase">
            {selectedDataset === 'live_network' ? 'Live Mac Interface' : selectedDataset}
          </h3>
        </div>
      </div>

      {/* CHARTS ROW: Throughput Line Chart + Protocol Doughnut */}
      <div className="flex flex-col lg:flex-row gap-6 w-full">
        
        {/* Live Traffic Throughput */}
        <div className="bg-[#0A0A0B]/35 border border-white/10 rounded-xl p-6 w-full lg:w-2/3 h-[280px] flex flex-col">
           <div className="flex items-center justify-between mb-4">
               <h3 className="font-semibold text-[15px]">Live Traffic Throughput</h3>
           </div>
           <div className="flex-grow w-full relative">
              <Line data={chartConfig} options={chartOptions} />
           </div>
        </div>

        {/* Protocol Breakdown Chart */}
        <div className="w-full lg:w-1/3 h-[280px]">
          <ProtocolBreakdown />
        </div>
        
      </div>

      {/* LIVE PACKET STREAM TABLE */}
      <div className="bg-[#0A0A0B]/35 border border-white/10 rounded-xl p-6 w-full max-w-full overflow-hidden">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-semibold text-[15px]">Live Packet Stream & AI Diagnostics</h3>
          <div className="flex items-center gap-2">
             <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
             <span className="text-[12px] text-[#9A9A97]">AI Engine Online</span>
          </div>
        </div>

        <div className="w-full overflow-x-auto rounded-lg border border-white/5">
          <table className="w-full text-left text-[12px] whitespace-nowrap">
            <thead className="bg-white/5 border-b border-white/10 text-[#9A9A97]">
              <tr>
                {columns.map((col) => (
                  <th key={col} className="p-3 font-medium uppercase tracking-wider">{col}</th>
                ))}
                <th className="p-3 font-medium uppercase tracking-wider text-right">AI Verdict</th>
              </tr>
            </thead>
            <tbody>
              {packets.length === 0 ? (
                <tr><td colSpan={columns.length + 1} className="py-8 text-center text-[#9A9A97]">Waiting for data stream...</td></tr>
              ) : (
                packets.map((packet, index) => (
                  <tr key={index} className={`border-b border-white/5 transition-colors ${packet.is_anomaly ? 'hover:bg-red-500/5' : 'hover:bg-white/[0.04]'}`}>
                    {columns.map((col) => (
                      <td key={col} className="p-3 text-[#D6D6D3]">
                        {typeof packet[col] === 'number' && packet[col] % 1 !== 0 ? packet[col].toFixed(4) : packet[col]}
                      </td>
                    ))}
                    <td className="p-3 text-right">
                      <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wide border ${
                        packet.is_anomaly ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      }`}>{packet.ai_classification}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      
    </div>
  );
};

export default NetworkTraffic;