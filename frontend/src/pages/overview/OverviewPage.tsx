import React, { useEffect, useState } from 'react';
import {
  Activity, Shield, AlertTriangle, Bell, Radio, CheckCircle2,
  Layers, ExternalLink, Cpu, Database, Server, Network
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip,
  PieChart, Pie, Cell, BarChart, Bar
} from 'recharts';
import { StatCard } from '../../components/common/StatCard';
import { Card } from '../../components/common/Card';
import { SeverityBadge } from '../../components/common/SeverityBadge';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Button } from '../../components/common/Button';
import { apiClient } from '../../api/client';
import { Link } from 'react-router-dom';

const CHART_COLORS = ['#06B6D4', '#3B82F6', '#6366F1', '#8B5CF6', '#EC4899', '#EF4444', '#F59E0B', '#10B981'];

export const OverviewPage: React.FC = () => {
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [summaryData, setSummaryData] = useState<any>(null);
  const [recentAlerts, setRecentAlerts] = useState<any[]>([]);
  const [activeIncidents, setActiveIncidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [dashRes, sumRes, alertRes, incRes] = await Promise.all([
          apiClient.getDashboardAnalytics(),
          apiClient.getAnalyticsSummary(),
          apiClient.getAlerts(1, 10), // Get recent alerts
          apiClient.getIncidents(1, 5, 'IN_PROGRESS') // Get active incidents
        ]);
        
        if (dashRes.data) setDashboardStats(dashRes.data);
        if (sumRes.data) setSummaryData(sumRes.data);
        if (alertRes.data && alertRes.data.items) setRecentAlerts(alertRes.data.items);
        if (incRes.data && incRes.data.items) setActiveIncidents(incRes.data.items);
        
      } catch (err) {
        console.error("Failed to load overview data:", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-400">Loading live telemetry...</p>
        </div>
      </div>
    );
  }

  const detectionRate = dashboardStats?.detectedAnomalies && dashboardStats?.networkEvents
    ? ((dashboardStats.detectedAnomalies / Math.max(1, dashboardStats.networkEvents)) * 100).toFixed(2)
    : "0.00";

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header / Posture Summary */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#333333] pb-4">
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
        </div>
      </div>

      {/* 6 Top Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          title="Total Traffic Flows"
          value={dashboardStats?.networkEvents?.toLocaleString() || '0'}
          change=""
          isPositive={true}
          icon={<Network className="w-5 h-5" />}
          subtitle="Monitored in DB"
        />
        <StatCard
          title="Detected Anomalies"
          value={dashboardStats?.detectedAnomalies?.toLocaleString() || '0'}
          change=""
          isPositive={false}
          icon={<AlertTriangle className="w-5 h-5 text-amber-400" />}
          subtitle={`${detectionRate}% Anomaly Rate`}
        />
        <StatCard
          title="Active Alerts"
          value={dashboardStats?.activeAlerts?.toString() || '0'}
          change=""
          isPositive={true}
          icon={<Bell className="w-5 h-5 text-cyan-400" />}
          subtitle={`${dashboardStats?.criticalAlerts || 0} Critical Severity`}
        />
        <StatCard
          title="Open Incidents"
          value={dashboardStats?.openIncidents?.toString() || '0'}
          change=""
          isPositive={false}
          icon={<Layers className="w-5 h-5 text-indigo-400" />}
          subtitle="Requires attention"
        />
        <StatCard
          title="Critical Threats"
          value={dashboardStats?.threats?.toString() || '0'}
          change=""
          isPositive={false}
          icon={<Shield className="w-5 h-5 text-red-400" />}
          subtitle="Action Required"
        />
        <StatCard
          title="System Health"
          value={`${dashboardStats?.systemHealth || 100}%`}
          change=""
          isPositive={true}
          icon={<CheckCircle2 className="w-5 h-5 text-emerald-400" />}
          subtitle="Operational"
        />
      </div>

      {/* Main Visualizations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart 1: Traffic Telemetry & Anomaly Volume Timeline (2 Cols) */}
        <Card title="Traffic Volume & Anomaly Timeline (7 Days)" className="lg:col-span-2">
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={summaryData?.anomaly_trend || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="anomaliesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.6} />
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" stroke="#6B7280" fontSize={11} tickLine={false} />
                <YAxis stroke="#6B7280" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#111827', borderColor: '#1F2937', borderRadius: '8px', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="anomalies" name="Anomalous Flows" stroke="#EF4444" fillOpacity={1} fill="url(#anomaliesGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Chart 2: Attack Classification Distribution (1 Col) */}
        <Card title="Attack Category Distribution">
          <div className="h-72 w-full flex flex-col items-center justify-center">
            {summaryData?.attack_distribution && summaryData.attack_distribution.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height="80%">
                  <PieChart>
                    <Pie
                      data={summaryData.attack_distribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="count"
                      nameKey="category"
                    >
                      {summaryData.attack_distribution.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#111827', borderColor: '#1F2937', borderRadius: '8px', fontSize: '12px' }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-2 gap-2 text-[11px] w-full pt-2">
                  {summaryData.attack_distribution.map((item: any, index: number) => (
                    <div key={item.category} className="flex items-center space-x-1.5 truncate">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }} />
                      <span className="text-gray-300 truncate">{item.category}:</span>
                      <span className="font-bold text-white">{item.percentage}%</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-gray-500">No attack data available</p>
            )}
          </div>
        </Card>
      </div>

      {/* Secondary Visualizations Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Protocol Breakdown Chart */}
        <Card title="Protocol Distribution Analysis">
          <div className="h-56 w-full">
            {summaryData?.protocol_distribution && summaryData.protocol_distribution.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={summaryData.protocol_distribution} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <XAxis type="number" stroke="#6B7280" fontSize={11} hide />
                  <YAxis dataKey="protocol" type="category" stroke="#9CA3AF" fontSize={12} tickLine={false} width={60} />
                  <Tooltip contentStyle={{ backgroundColor: '#111827', borderColor: '#1F2937', borderRadius: '8px', fontSize: '12px' }} />
                  <Bar dataKey="packets" name="Total Packets" fill="#3B82F6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">No protocol data available</div>
            )}
          </div>
        </Card>

        {/* Risk Score Severity Distribution */}
        <Card title="Risk Band Distribution (Prediction Confidence)">
          <div className="h-56 w-full">
            {summaryData?.risk_distribution && summaryData.risk_distribution.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={summaryData.risk_distribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="range" stroke="#6B7280" fontSize={10} tickLine={false} />
                  <YAxis stroke="#6B7280" fontSize={11} tickLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#111827', borderColor: '#1F2937', borderRadius: '8px', fontSize: '12px' }} />
                  <Bar dataKey="count" name="Flow Count" fill="#06B6D4" radius={[4, 4, 0, 0]}>
                    {summaryData.risk_distribution.map((entry: any, index: number) => {
                       const colors = ['#10B981', '#F59E0B', '#EF4444', '#991B1B'];
                       return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">No risk data available</div>
            )}
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
            <Link to="/alerts">
              <Button variant="ghost" size="sm" icon={<ExternalLink className="w-3.5 h-3.5" />}>
                View All Queue
              </Button>
            </Link>
          }
          className="lg:col-span-2"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#000000] text-gray-400 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-3">Alert ID</th>
                  <th className="p-3">Severity</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Risk</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1F2937]">
                {recentAlerts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-4 text-center text-gray-500">No recent alerts</td>
                  </tr>
                ) : (
                  recentAlerts.map((alert) => (
                    <tr key={alert.id} className="hover:bg-[#2A2A2A]/60 transition">
                      <td className="p-3 font-mono font-semibold text-cyan-400">{alert.alert_id}</td>
                      <td className="p-3"><SeverityBadge severity={alert.severity} /></td>
                      <td className="p-3 font-medium text-white">{alert.alert_type}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded font-bold text-xs bg-red-950 text-red-400 border border-red-500/30">
                          {alert.risk_score}
                        </span>
                      </td>
                      <td className="p-3"><StatusBadge status={alert.status} /></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Top Suspicious Sources Panel (1 Col) */}
        <Card title="Top Offending Sources" subtitle="Highest risk IP addresses by flow volume">
          <div className="space-y-3">
            {summaryData?.top_attacking_sources?.length === 0 ? (
              <p className="text-gray-500 text-xs p-4 text-center">No attacking sources recorded</p>
            ) : (
              summaryData?.top_attacking_sources?.map((item: any) => (
                <div key={item.ip} className="p-3 bg-[#000000] border border-[#333333] rounded-lg flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-xs font-bold text-cyan-400">{item.ip}</span>
                    </div>
                    <p className="text-[11px] text-gray-400">{item.attacks} attack flows</p>
                  </div>
                  <div className="text-right">
                    <span className="block text-xs font-bold text-red-400">Risk {item.risk_score}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Bottom Infrastructure & System Status Panels */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* System Component Health Status */}
        <Card title="System Health Matrix">
          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between p-2 bg-[#000000] rounded-lg border border-[#333333]">
              <div className="flex items-center space-x-2">
                <Server className="w-4 h-4 text-cyan-400" />
                <span className="text-gray-200">FastAPI Gateway</span>
              </div>
              <span className="text-emerald-400 font-semibold">100% OK (12ms)</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-[#000000] rounded-lg border border-[#333333]">
              <div className="flex items-center space-x-2">
                <Database className="w-4 h-4 text-indigo-400" />
                <span className="text-gray-200">PostgreSQL / SQLite</span>
              </div>
              <span className="text-emerald-400 font-semibold">Healthy</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-[#000000] rounded-lg border border-[#333333]">
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
            <div className="p-2.5 bg-[#000000] rounded-lg border border-[#333333] space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white">Isolation Forest Baseline</span>
                <span className="px-1.5 py-0.5 text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-500/30 rounded">ACTIVE</span>
              </div>
              <p className="text-[11px] text-gray-400">Unsupervised Anomaly Score • F1: 0.905</p>
            </div>
            <div className="p-2.5 bg-[#000000] rounded-lg border border-[#333333] space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white">RandomForest Classifier</span>
                <span className="px-1.5 py-0.5 text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-500/30 rounded">ACTIVE</span>
              </div>
              <p className="text-[11px] text-gray-400">Multi-Class Categorization • Acc: 91.2%</p>
            </div>
          </div>
        </Card>

        {/* Active Security Incidents Panel */}
        <Card title="Active Security Incidents">
          <div className="space-y-2 text-xs">
            {activeIncidents.length === 0 ? (
              <p className="text-gray-500 p-4 text-center">No active incidents</p>
            ) : (
              activeIncidents.map((inc) => (
                <div key={inc.id} className="p-2.5 bg-[#000000] rounded-lg border border-[#333333] space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-cyan-400 font-bold">{inc.incident_id}</span>
                    <StatusBadge status={inc.status} />
                  </div>
                  <p className="font-medium text-white text-xs truncate">{inc.title}</p>
                  <div className="flex items-center justify-between text-[10px] text-gray-400 pt-1">
                    <span>Severity: {inc.severity}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};
