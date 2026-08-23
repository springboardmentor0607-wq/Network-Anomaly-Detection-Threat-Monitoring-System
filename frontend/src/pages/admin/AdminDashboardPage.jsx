import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Skeleton from '../../components/common/Skeleton';
import {
  UsersIcon,
  ServerIcon,
  ExclamationTriangleIcon,
  SignalIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ShieldCheckIcon,
  CpuChipIcon
} from '@heroicons/react/24/outline';

const AdminDashboardPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/dashboard/admin');
      setData(res.data.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  if (loading || !data) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <Skeleton height="h-28" />
          <Skeleton height="h-28" />
          <Skeleton height="h-28" />
          <Skeleton height="h-28" />
        </div>
        <Skeleton height="h-64" />
      </div>
    );
  }

  const { cards, networkStatus, criticalAlertsPanel, systemHealthServices } = data;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-tight">Administrator Control Center</h2>
          <p className="text-xs text-slate-400">Enterprise Infrastructure & System Administration</p>
        </div>
        <button
          onClick={fetchAdminData}
          className="px-3.5 py-2 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 rounded-xl text-xs font-semibold text-cyan-300 flex items-center space-x-2 transition-all"
        >
          <ArrowPathIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Metrics</span>
        </button>
      </div>

      {/* Admin Dashboard Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card title="Registered Users" value={cards.registeredUsers} icon={UsersIcon} glowColor="cyan" />
        <Card title="Online Analysts" value={cards.onlineAnalysts} icon={UsersIcon} glowColor="green" />
        <Card title="Infrastructure Servers" value={cards.servers} icon={ServerIcon} glowColor="cyan" />
        <Card title="Critical Alerts" value={cards.criticalAlerts} icon={ExclamationTriangleIcon} glowColor="red" />
      </div>

      {/* Network Status Overview Banner */}
      <div className="glass-card rounded-2xl p-6 border border-cyan-500/30">
        <div className="flex items-center space-x-3 mb-4 border-b border-slate-800 pb-3">
          <SignalIcon className="w-5 h-5 text-cyan-400" />
          <h3 className="text-sm font-extrabold text-white uppercase tracking-wider font-mono">
            Network Telemetry & Infrastructure Status
          </h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 font-mono text-center">
          <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 block uppercase">Bandwidth</span>
            <span className="text-xs font-bold text-white mt-1 block">{networkStatus.bandwidth}</span>
          </div>
          <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 block uppercase">Avg Latency</span>
            <span className="text-xs font-bold text-emerald-400 mt-1 block">{networkStatus.latency}</span>
          </div>
          <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 block uppercase">Connected Devices</span>
            <span className="text-xs font-bold text-cyan-400 mt-1 block">{networkStatus.connectedDevices}</span>
          </div>
          <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 block uppercase">Packet Rate</span>
            <span className="text-xs font-bold text-white mt-1 block">{networkStatus.packetRate}</span>
          </div>
          <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 block uppercase">Server Availability</span>
            <span className="text-xs font-bold text-emerald-400 mt-1 block">{networkStatus.serverAvailability}</span>
          </div>
          <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 block uppercase">Traffic Health</span>
            <Badge variant="online">{networkStatus.trafficHealth}</Badge>
          </div>
        </div>
      </div>

      {/* Grid: System Health & Critical Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* System Health Services */}
        <div className="lg:col-span-2 glass-card rounded-2xl p-6 border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
              System Health & Microservice Nodes
            </h3>
            <span className="text-xs text-emerald-400 font-mono font-semibold">ALL SERVICES OPERATIONAL</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {systemHealthServices.map((srv) => (
              <div key={srv.name} className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900/70 border border-slate-800">
                <div className="flex items-center space-x-3">
                  <CpuChipIcon className="w-5 h-5 text-cyan-400" />
                  <div>
                    <span className="text-xs font-bold text-white block">{srv.name}</span>
                    <span className="text-[10px] text-slate-400 font-mono">Latency: {srv.latency} | Uptime: {srv.uptime}</span>
                  </div>
                </div>
                <Badge variant={srv.status === 'ONLINE' ? 'online' : (srv.status === 'WARNING' ? 'warning' : 'critical')}>
                  {srv.status}
                </Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Critical Alerts Panel */}
        <div className="glass-card rounded-2xl p-6 border border-slate-800">
          <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-wider font-mono">
            Critical Alerts Summary
          </h3>
          <div className="space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between p-3 rounded-xl bg-red-950/30 border border-red-900/50">
              <span className="text-red-300 font-bold">High Severity Alerts</span>
              <span className="px-2.5 py-0.5 rounded-md bg-red-900/60 text-red-200 font-bold">{criticalAlertsPanel.high}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-amber-950/30 border border-amber-900/50">
              <span className="text-amber-300 font-bold">Medium Severity Alerts</span>
              <span className="px-2.5 py-0.5 rounded-md bg-amber-900/60 text-amber-200 font-bold">{criticalAlertsPanel.medium}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-blue-950/30 border border-blue-900/50">
              <span className="text-blue-300 font-bold">Low Severity Alerts</span>
              <span className="px-2.5 py-0.5 rounded-md bg-blue-900/60 text-blue-200 font-bold">{criticalAlertsPanel.low}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-950/30 border border-emerald-900/50">
              <span className="text-emerald-300 font-bold">Resolved Incidents</span>
              <span className="px-2.5 py-0.5 rounded-md bg-emerald-900/60 text-emerald-200 font-bold">{criticalAlertsPanel.resolved}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-slate-300 font-bold">Pending Triage</span>
              <span className="px-2.5 py-0.5 rounded-md bg-slate-800 text-slate-300 font-bold">{criticalAlertsPanel.pending}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
