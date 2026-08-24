import React, { useContext } from 'react';
import { TrafficContext } from '../context/TrafficContext';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

const ProtocolBreakdown = () => {
  const { packets } = useContext(TrafficContext);

  // Dynamically compute protocol counts from live packets
  const protocolCounts = packets.reduce((acc, pkt) => {
    const proto = pkt[' Protocol'] || pkt['Protocol'] || pkt['proto'] || 'TCP';
    const cleanProto = String(proto).toUpperCase().includes('17') || String(proto).toUpperCase().includes('UDP') ? 'UDP' 
                     : String(proto).toUpperCase().includes('6') || String(proto).toUpperCase().includes('TCP') ? 'TCP' 
                     : 'HTTP/HTTPS';
    acc[cleanProto] = (acc[cleanProto] || 0) + 1;
    return acc;
  }, { TCP: 14, UDP: 8, 'HTTP/HTTPS': 6 }); // Initial seed data

  const doughnutData = {
    labels: Object.keys(protocolCounts),
    datasets: [{
      data: Object.values(protocolCounts),
      backgroundColor: ['#6366F1', '#34D399', '#FBBF24', '#F87171'],
      borderWidth: 0,
      hoverOffset: 4
    }]
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { 
      legend: { position: 'bottom', labels: { color: '#9A9A97', font: { size: 11 } } } 
    },
    cutout: '70%'
  };

  return (
    <div className="bg-[#0A0A0B]/35 border border-white/10 rounded-xl p-6 w-full h-[280px] flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-[15px]">Protocol Breakdown</h3>
      </div>
      <div className="flex-grow relative flex items-center justify-center pb-2">
        <Doughnut data={doughnutData} options={doughnutOptions} />
      </div>
    </div>
  );
};

export default ProtocolBreakdown;