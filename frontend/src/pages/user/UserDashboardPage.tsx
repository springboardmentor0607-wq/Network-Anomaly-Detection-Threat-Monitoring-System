import React from 'react';
import { useNavigate } from 'react-router-dom';
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
  Network,
  Zap,
  Target,
  FolderLock
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
} from '../../constants/mockDashboardData';

export const UserDashboardPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6 pb-12">
      {/* Operator Header / Posture Summary */}
      <div className="p-6 bg-gradient-to-r from-cyan-950/60 via-[#111827] to-[#0B0F17] border border-cyan-500/40 rounded-2xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3 mb-1">
            <div className="p-2.5 bg-cyan-500/20 border border-cyan-500/50 rounded-xl text-cyan-400">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center space-x-2">
                <span>USER SOC DASHBOARD — SECURITY OPERATIONS CENTER</span>
                <span className="px-2.5 py-0.5 text-[10px] font-black bg-cyan-500 text-black rounded uppercase tracking-widest">
                  OPERATOR PORTAL
                </span>
              </h1>
              <p className="text-xs text-gray-300">
                Real-time traffic telemetry analysis, AI anomaly detection, risk triage queue, and threat monitoring.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <Button variant="outline" size="sm" onClick={() => navigate('/monitoring')} icon={<Radio className="w-4 h-4 text-cyan-400 animate-pulse" />}>
            Stream Status: Online
          </Button>
          <Button variant="primary" size="sm" onClick={() => navigate('/alerts')} icon={<Bell className="w-4 h-4" />}>
            View Triage Queue
          </Button>
        </div>
      </div>

      {/* 6 Metric Cards Grid */}
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

      {/* Visualizations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card title="Traffic Volume & Anomaly Timeline (24h)" className="lg:col-span-2">
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={MOCK_TRAFFIC_TIMELINE} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="totalFlowsGradUser" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#06B6D4" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="anomaliesGradUser" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.6} />
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" stroke="#6B7280" fontSize={11} tickLine={false} />
                <YAxis stroke="#6B7280" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#111827', borderColor: '#1F2937', borderRadius: '8px', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="totalFlows" name="Total Flows" stroke="#06B6D4" fillOpacity={1} fill="url(#totalFlowsGradUser)" />
                <Area type="monotone" dataKey="anomalies" name="Anomalous Flows" stroke="#EF4444" fillOpacity={1} fill="url(#anomaliesGradUser)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

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

      {/* Triage Queue Row */}
      <Card
        title="Active Security Alerts Queue"
        subtitle="Real-time triaged alerts exceeding risk thresholds"
        action={
          <Button variant="ghost" size="sm" onClick={() => navigate('/alerts')} icon={<ExternalLink className="w-3.5 h-3.5" />}>
            View Full Queue
          </Button>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#131C2E] text-gray-400 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-3">Alert ID</th>
                <th className="p-3">Severity</th>
                <th className="p-3">Type</th>
                <th className="p-3">Source → Target</th>
                <th className="p-3">Risk Score</th>
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
    </div>
  );
};
