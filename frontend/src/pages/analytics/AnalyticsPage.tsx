import React from 'react';
import { Card } from '../../components/common/Card';
import { BarChart3, TrendingUp, PieChart, Activity, ShieldAlert, Globe } from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart as RechartsPie,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';

export const AnalyticsPage: React.FC = () => {
  const timeSeriesData = [
    { time: '00:00', critical: 12, high: 25, medium: 45, low: 80 },
    { time: '04:00', critical: 8, high: 18, medium: 38, low: 95 },
    { time: '08:00', critical: 24, high: 42, medium: 65, low: 120 },
    { time: '12:00', critical: 35, high: 58, medium: 82, low: 150 },
    { time: '16:00', critical: 18, high: 31, medium: 55, low: 110 },
    { time: '20:00', critical: 29, high: 47, medium: 70, low: 135 },
  ];

  const attackDistData = [
    { name: 'DDoS / SYN Flood', value: 412, color: '#EF4444' },
    { name: 'Port Scan', value: 298, color: '#F59E0B' },
    { name: 'SSH Brute Force', value: 184, color: '#06B6D4' },
    { name: 'SQL Injection', value: 142, color: '#8B5CF6' },
    { name: 'DNS Tunneling', value: 96, color: '#10B981' },
  ];

  const protocolData = [
    { protocol: 'TCP', percentage: 58.2, packets: 1420000 },
    { protocol: 'UDP', percentage: 24.5, packets: 598000 },
    { protocol: 'HTTPS', percentage: 11.8, packets: 288000 },
    { protocol: 'DNS', percentage: 4.1, packets: 100000 },
    { protocol: 'ICMP', percentage: 1.4, packets: 34000 },
  ];

  const topTalkerIps = [
    { ip: '42.112.98.14', country: 'US', attacks: 1420, risk: 96 },
    { ip: '185.220.101.5', country: 'DE', attacks: 980, risk: 88 },
    { ip: '194.26.29.112', country: 'RU', attacks: 765, risk: 84 },
    { ip: '103.251.140.2', country: 'CN', attacks: 540, risk: 79 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Security Analytics & Telemetry Dashboard</h2>
          <p className="text-xs text-gray-400">Aggregated threat distributions, bandwidth trends, and risk metrics.</p>
        </div>
      </div>

      {/* Main Threat Volume Over Time Chart */}
      <Card title="Threat Anomaly Volume Over Time (24h Window)">
        <div className="h-72 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={timeSeriesData}>
              <defs>
                <linearGradient id="colorCrit" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#EF4444" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorHigh" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="time" stroke="#6B7280" fontSize={11} />
              <YAxis stroke="#6B7280" fontSize={11} />
              <Tooltip contentStyle={{ backgroundColor: '#0F172A', borderColor: '#1F2937', borderRadius: '12px', fontSize: '12px' }} />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              <Area type="monotone" dataKey="critical" stroke="#EF4444" fillOpacity={1} fill="url(#colorCrit)" name="Critical Threats" />
              <Area type="monotone" dataKey="high" stroke="#F59E0B" fillOpacity={1} fill="url(#colorHigh)" name="High Risk Threats" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Grid of Secondary Visualizations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attack Classification Pie Chart */}
        <Card title="Attack Classification Ratio">
          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPie>
                <Pie data={attackDistData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {attackDistData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#0F172A', borderColor: '#1F2937', borderRadius: '12px', fontSize: '12px' }} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
              </RechartsPie>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Protocol Distribution Bar Chart */}
        <Card title="Protocol Bandwidth Distribution">
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={protocolData}>
                <XAxis dataKey="protocol" stroke="#6B7280" fontSize={11} />
                <YAxis stroke="#6B7280" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#0F172A', borderColor: '#1F2937', borderRadius: '12px', fontSize: '12px' }} />
                <Bar dataKey="percentage" fill="#06B6D4" radius={[6, 6, 0, 0]} name="Traffic Share %" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Top Attacking Sources Table */}
      <Card title="Top Malicious Source IPs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#1F2937] text-gray-400 font-bold uppercase">
                <th className="py-2.5 px-4">Source IP</th>
                <th className="py-2.5 px-4">Origin Country</th>
                <th className="py-2.5 px-4">Total Attack Events</th>
                <th className="py-2.5 px-4">Risk Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1F2937] text-gray-200">
              {topTalkerIps.map((talker) => (
                <tr key={talker.ip} className="hover:bg-[#131C2E]">
                  <td className="py-3 px-4 font-mono font-bold text-cyan-400">{talker.ip}</td>
                  <td className="py-3 px-4 text-gray-300">{talker.country}</td>
                  <td className="py-3 px-4 font-semibold text-white">{talker.attacks}</td>
                  <td className="py-3 px-4 font-bold text-red-400">{talker.risk}/100</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
