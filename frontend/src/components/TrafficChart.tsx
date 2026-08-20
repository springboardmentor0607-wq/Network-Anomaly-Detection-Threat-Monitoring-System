"use client";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend
);

export const options = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top' as const,
    },
    title: {
      display: false,
    },
  },
  scales: {
    y: {
      beginAtZero: true,
      grid: {
        color: 'rgba(0, 0, 0, 0.05)',
      }
    },
    x: {
      grid: {
        display: false,
      }
    }
  }
};

const labels = ['10:00', '10:05', '10:10', '10:15', '10:20', '10:25', '10:30'];

export const data = {
  labels,
  datasets: [
    {
      fill: true,
      label: 'Network Traffic (MB/s)',
      data: [12, 19, 15, 25, 22, 30, 28],
      borderColor: 'rgb(59, 130, 246)',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      tension: 0.4,
    },
    {
      fill: true,
      label: 'Anomalous Packets',
      data: [0, 1, 0, 5, 2, 8, 3],
      borderColor: 'rgb(239, 68, 68)',
      backgroundColor: 'rgba(239, 68, 68, 0.1)',
      tension: 0.4,
    },
  ],
};

export default function TrafficChart() {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-80">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Live Traffic Overview</h3>
      <div className="h-64">
        <Line options={options} data={data} />
      </div>
    </div>
  );
}
