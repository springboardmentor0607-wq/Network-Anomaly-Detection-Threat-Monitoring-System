import React from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

const PieChart = ({ data, title }) => {
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
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
    }
  };

  const formattedData = {
    labels: data?.labels || ['HTTPS', 'DNS', 'SSH', 'FTP', 'UDP'],
    datasets: [
      {
        data: data?.data || [54, 18, 12, 6, 10],
        backgroundColor: [
          '#00f0ff',
          '#10b981',
          '#3b82f6',
          '#f59e0b',
          '#ef4444',
          '#8b5cf6'
        ],
        borderColor: '#0a0d14',
        borderWidth: 2
      }
    ]
  };

  return (
    <div className="w-full h-64 flex items-center justify-center">
      <Doughnut options={options} data={formattedData} />
    </div>
  );
};

export default PieChart;
