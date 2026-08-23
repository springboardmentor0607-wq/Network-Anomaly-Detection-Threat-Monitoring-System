import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import { SignalIcon, CpuChipIcon, ServerIcon } from '@heroicons/react/24/outline';

const NetworkStatusPage = () => {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get('/network/stats').then(res => setStats(res.data.data));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-extrabold text-white tracking-tight">Enterprise Network Status</h2>
        <p className="text-xs text-slate-400">Router, Firewall, & Backbone Node Monitoring</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card title="Bandwidth Usage" value={stats?.bandwidth.currentUsageGbps + ' / ' + stats?.bandwidth.totalCapacityGbps + ' Gbps'} icon={SignalIcon} glowColor="cyan" />
        <Card title="Avg Network Latency" value={stats?.latencyMs + ' ms'} icon={CpuChipIcon} glowColor="green" />
        <Card title="Connected Nodes" value={stats?.deviceCount.total} icon={ServerIcon} glowColor="cyan" />
      </div>

      <div className="glass-card rounded-2xl p-6 border border-slate-800">
        <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-wider font-mono">Infrastructure Connected Devices Breakdown</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono text-xs text-center">
          <div className="p-4 bg-slate-900 rounded-xl border border-slate-800">
            <span className="text-slate-400 block uppercase">Core Servers</span>
            <span className="text-lg font-bold text-cyan-400 mt-1 block">{stats?.deviceCount.servers}</span>
          </div>
          <div className="p-4 bg-slate-900 rounded-xl border border-slate-800">
            <span className="text-slate-400 block uppercase">NextGen Firewalls</span>
            <span className="text-lg font-bold text-emerald-400 mt-1 block">{stats?.deviceCount.firewalls}</span>
          </div>
          <div className="p-4 bg-slate-900 rounded-xl border border-slate-800">
            <span className="text-slate-400 block uppercase">Core Routers</span>
            <span className="text-lg font-bold text-white mt-1 block">{stats?.deviceCount.routers}</span>
          </div>
          <div className="p-4 bg-slate-900 rounded-xl border border-slate-800">
            <span className="text-slate-400 block uppercase">Workstations</span>
            <span className="text-lg font-bold text-slate-300 mt-1 block">{stats?.deviceCount.workstations}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NetworkStatusPage;
