import React from 'react';
import {
  Activity,
  Shield,
  AlertTriangle,
  Bell,
  Radio,
  CheckCircle2,
  TrendingUp,
  Brain,
  Layers,
  ExternalLink,
  Cpu,
  Database,
  Server,
  Network
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from 'recharts';
import { StatCard } from '../../components/common/StatCard';
import { Card } from '../../components/common/Card';
import { SeverityBadge } from '../../components/common/SeverityBadge';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Button } from '../../components/common/Button';
import {
  MOCK_TRAFFIC_TIMELINE,
  MOCK_ATTACK_DISTRIBUTION,
  MOCK_PROTOCOL_DISTRIBUTION,
  MOCK_SEVERITY_DISTRIBUTION,
  MOCK_RECENT_ALERTS,
  MOCK_SUSPICIOUS_IPS,
  MOCK_INCIDENTS,
} from '../../constants/mockDashboardData';

export const OverviewPage: React.FC = () => {
  return (
    <div className="space-y-6 pb-12">
      {/* Top Header / Posture Summary */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1F2937] pb-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center space-x-2">
            <span>SOC Security Operations Center</span>
            <span className="px-2 py-0.5 text-[10px] font-bold bg-cyan-950 text-cyan-400 border border-cyan-500/30 rounded uppercase">
              Live Monitor Active
            </span>
          </h2>
          <p className="text-xs text-gray-400">
            Real-time traffic telemetry analysis, AI anomaly detection, and risk triage dashboard.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" size="sm" icon={<Radio className="w-4 h-4 text-cyan-400 animate-pulse" />}>
            Stream Status: Online
          </Button>
          <Button variant="primary" size="sm" icon={<Activity className="w-4 h-4" />}>
            Export Telemetry Summary
          </Button>
        </div>
      </div>

      {/* 6 Top Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          title="Total Traffic"
          value="4.82 GB"
          change="+14.2%"
          isPositive={true}
          icon={<Network className="w-5 h-5" />}
          subtitle="1,428,920 Total Packets"
        />
        <StatCard
          title="Analyzed Flows"
          value="142,850"
          change="+8.6%"
          isPositive={true}
          icon={<Layers className="w-5 h-5" />}
          subtitle="Normalized telemetry flows"
        />
        <StatCard
          title="Detected Anomalies"
          value="1,284"
          change="+3.4%"
          isPositive={false}
          icon={<AlertTriangle className="w-5 h-5 text-amber-400" />}
          subtitle="0.90% Anomaly Rate"
        />
        <StatCard
          title="Active Alerts"
          value="38"
          change="-5.2%"
          isPositive={true}
          icon={<Bell className="w-5 h-5 text-cyan-400" />}
          subtitle="12 Critical Severity"
        />
        <StatCard
          title="Critical Threats"
          value="14"
          change="+2"
          isPositive={false}
          icon={<Shield className="w-5 h-5 text-red-400" />}
          subtitle="Action Required"
        />
        <StatCard
          title="Detection Rate"
          value="94.8%"
          change="+0.6%"
          isPositive={true}
          icon={<CheckCircle2 className="w-5 h-5 text-emerald-400" />}
          subtitle="Model Confidence Target"
        />
      </div>

      {/* Main Visualizations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart 1: Traffic Telemetry & Anomaly Volume Timeline (2 Cols) */}
        <Card title="Traffic Volume & Anomaly Timeline (24h)" className="lg:col-span-2">
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={MOCK_TRAFFIC_TIMELINE} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="totalFlowsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#06B6D4" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="anomaliesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.6} />
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" stroke="#6B7280" fontSize={11} tickLine={false} />
                <YAxis stroke="#6B7280" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#111827', borderColor: '#1F2937', borderRadius: '8px', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="totalFlows" name="Total Flows" stroke="#06B6D4" fillOpacity={1} fill="url(#totalFlowsGrad)" />
                <Area type="monotone" dataKey="anomalies" name="Anomalous Flows" stroke="#EF4444" fillOpacity={1} fill="url(#anomaliesGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Chart 2: Attack Classification Distribution (1 Col) */}
        <Card title="Attack Category Distribution">
          <div className="h-72 w-full flex flex-col items-center justify-center">
            <ResponsiveContainer width="100%" height="80%">
              <PieChart>
                <Pie
                  data={MOCK_ATTACK_DISTRIBUTION}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {MOCK_ATTACK_DISTRIBUTION.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#111827', borderColor: '#1F2937', borderRadius: '8px', fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-2 text-[11px] w-full pt-2">
              {MOCK_ATTACK_DISTRIBUTION.map((item) => (
                <div key={item.name} className="flex items-center space-x-1.5 truncate">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="text-gray-300 truncate">{item.name}:</span>
                  <span className="font-bold text-white">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* Secondary Visualizations Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Protocol Breakdown Chart */}
        <Card title="Protocol Distribution Analysis">
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={MOCK_PROTOCOL_DISTRIBUTION} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <XAxis type="number" stroke="#6B7280" fontSize={11} hide />
                <YAxis dataKey="protocol" type="category" stroke="#9CA3AF" fontSize={12} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#111827', borderColor: '#1F2937', borderRadius: '8px', fontSize: '12px' }} />
                <Bar dataKey="flows" name="Total Flows" fill="#3B82F6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Risk Score Severity Distribution */}
        <Card title="Risk Band Distribution (0 - 100 Score)">
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={MOCK_SEVERITY_DISTRIBUTION} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="severity" stroke="#6B7280" fontSize={10} tickLine={false} />
                <YAxis stroke="#6B7280" fontSize={11} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#111827', borderColor: '#1F2937', borderRadius: '8px', fontSize: '12px' }} />
                <Bar dataKey="count" name="Flow Count" fill="#06B6D4" radius={[4, 4, 0, 0]}>
                  {MOCK_SEVERITY_DISTRIBUTION.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Operational SOC Panels Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Alerts Queue Panel (2 Cols) */}
        <Card
          title="Recent Security Alerts Queue"
          subtitle="Real-time triaged alerts exceeding risk thresholds"
          action={
            <Button variant="ghost" size="sm" icon={<ExternalLink className="w-3.5 h-3.5" />}>
              View All Queue
            </Button>
          }
          className="lg:col-span-2"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#131C2E] text-gray-400 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-3">Alert ID</th>
                  <th className="p-3">Severity</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Source → Target</th>
                  <th className="p-3">Risk</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1F2937]">
                {MOCK_RECENT_ALERTS.map((alert) => (
                  <tr key={alert.id} className="hover:bg-[#131C2E]/60 transition">
                    <td className="p-3 font-mono font-semibold text-cyan-400">{alert.alert_id}</td>
                    <td className="p-3"><SeverityBadge severity={alert.severity} /></td>
                    <td className="p-3 font-medium text-white">{alert.type}</td>
                    <td className="p-3 font-mono text-gray-300">{alert.source_ip} → {alert.destination_ip}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded font-bold text-xs bg-red-950 text-red-400 border border-red-500/30">
                        {alert.risk_score}
                      </span>
                    </td>
                    <td className="p-3"><StatusBadge status={alert.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Top Suspicious Sources Panel (1 Col) */}
        <Card title="Top Offending Sources" subtitle="Highest risk IP addresses by flow volume">
          <div className="space-y-3">
            {MOCK_SUSPICIOUS_IPS.map((item) => (
              <div key={item.ip} className="p-3 bg-[#131C2E] border border-[#1F2937] rounded-lg flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-bold text-cyan-400">{item.ip}</span>
                    <span className="text-[10px] text-gray-400">({item.countryCode})</span>
                  </div>
                  <p className="text-[11px] text-gray-400">{item.primaryAttack} • {item.attackCount} flows</p>
                </div>
                <div className="text-right">
                  <span className="block text-xs font-bold text-red-400">Risk {item.threatScore}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Bottom Infrastructure & System Status Panels */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* System Component Health Status */}
        <Card title="System Health Matrix">
          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between p-2 bg-[#131C2E] rounded-lg border border-[#1F2937]">
              <div className="flex items-center space-x-2">
                <Server className="w-4 h-4 text-cyan-400" />
                <span className="text-gray-200">FastAPI Gateway</span>
              </div>
              <span className="text-emerald-400 font-semibold">100% OK (12ms)</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-[#131C2E] rounded-lg border border-[#1F2937]">
              <div className="flex items-center space-x-2">
                <Database className="w-4 h-4 text-indigo-400" />
                <span className="text-gray-200">PostgreSQL 15</span>
              </div>
              <span className="text-emerald-400 font-semibold">Healthy (14MB)</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-[#131C2E] rounded-lg border border-[#1F2937]">
              <div className="flex items-center space-x-2">
                <Cpu className="w-4 h-4 text-purple-400" />
                <span className="text-gray-200">Inference Engine</span>
              </div>
              <span className="text-emerald-400 font-semibold">Loaded in RAM</span>
            </div>
          </div>
        </Card>

        {/* Active ML Models Status */}
        <Card title="Active ML Models">
          <div className="space-y-2.5 text-xs">
            <div className="p-2.5 bg-[#131C2E] rounded-lg border border-[#1F2937] space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white">Isolation Forest Baseline</span>
                <span className="px-1.5 py-0.5 text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-500/30 rounded">ACTIVE</span>
              </div>
              <p className="text-[11px] text-gray-400">Unsupervised Anomaly Score • F1: 0.931</p>
            </div>
            <div className="p-2.5 bg-[#131C2E] rounded-lg border border-[#1F2937] space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white">XGBoost Attack Classifier</span>
                <span className="px-1.5 py-0.5 text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-500/30 rounded">ACTIVE</span>
              </div>
              <p className="text-[11px] text-gray-400">Multi-Class Categorization • Acc: 96.1%</p>
            </div>
          </div>
        </Card>

        {/* Active Security Incidents Panel */}
        <Card title="Active Security Incidents">
          <div className="space-y-2 text-xs">
            {MOCK_INCIDENTS.map((inc) => (
              <div key={inc.id} className="p-2.5 bg-[#131C2E] rounded-lg border border-[#1F2937] space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-cyan-400 font-bold">{inc.incident_id}</span>
                  <StatusBadge status={inc.status} />
                </div>
                <p className="font-medium text-white text-xs truncate">{inc.title}</p>
                <div className="flex items-center justify-between text-[10px] text-gray-400 pt-1">
                  <span>Owner: {inc.owner}</span>
                  <span>{inc.alert_count} Related Alerts</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};
