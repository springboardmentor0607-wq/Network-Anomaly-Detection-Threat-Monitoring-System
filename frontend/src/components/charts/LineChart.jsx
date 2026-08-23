import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const LineChart = ({ data, title }) => {
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#94a3b8',
          font: { family: 'Inter', size: 12 }
        }
      },
      title: {
        display: !!title,
        text: title || '',
        color: '#f8fafc',
        font: { family: 'Inter', size: 14, weight: 'bold' }
      }
    },
    scales: {
      x: {
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: '#64748b', font: { family: 'Inter', size: 11 } }
      },
      y: {
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: '#64748b', font: { family: 'Inter', size: 11 } }
      }
    }
  };

  const formattedData = {
    labels: data?.labels || ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00'],
    datasets: (data?.datasets || []).map((ds, index) => ({
      label: ds.label,
      data: ds.data,
      borderColor: index === 0 ? '#00f0ff' : '#10b981',
      backgroundColor: index === 0 ? 'rgba(0, 240, 255, 0.15)' : 'rgba(16, 185, 129, 0.15)',
      tension: 0.4,
      fill: true
    }))
  };

  return (
    <div className="w-full h-64">
      <Line options={options} data={formattedData} />
    </div>
  );
};

export default LineChart;
