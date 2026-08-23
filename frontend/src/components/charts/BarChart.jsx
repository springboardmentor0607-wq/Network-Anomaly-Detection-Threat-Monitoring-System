import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const BarChart = ({ data, title }) => {
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: { color: '#94a3b8', font: { family: 'Inter', size: 12 } }
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
    labels: data?.labels || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Critical / High Severity',
        data: data?.high || [2, 1, 4, 3, 2, 0, 1],
        backgroundColor: '#ef4444'
      },
      {
        label: 'Medium Severity',
        data: data?.medium || [5, 6, 8, 4, 7, 3, 2],
        backgroundColor: '#f59e0b'
      },
      {
        label: 'Low Severity',
        data: data?.low || [12, 14, 11, 15, 18, 9, 7],
        backgroundColor: '#3b82f6'
      }
    ]
  };

  return (
    <div className="w-full h-64">
      <Bar options={options} data={formattedData} />
    </div>
  );
};

export default BarChart;
