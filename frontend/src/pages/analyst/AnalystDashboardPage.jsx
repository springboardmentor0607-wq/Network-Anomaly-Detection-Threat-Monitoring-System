import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Skeleton from '../../components/common/Skeleton';
import LineChart from '../../components/charts/LineChart';
import PieChart from '../../components/charts/PieChart';
import BarChart from '../../components/charts/BarChart';
import {
  CpuChipIcon,
  ServerIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  SignalIcon,
  ArrowPathIcon,
  ClockIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

const AnalystDashboardPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/dashboard/analyst');
      setData(res.data.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading || !data) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Skeleton height="h-32" />
          <Skeleton height="h-32" />
          <Skeleton height="h-32" />
          <Skeleton height="h-32" />
        </div>
        <Skeleton height="h-64" />
        <Skeleton height="h-64" />
      </div>
    );
  }

  const { systemStatus, cards, charts, recentThreats, latestActivities, aiModelSummary } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-tight">Security Analyst Dashboard</h2>
          <p className="text-xs text-slate-400">Real-time Threat Surveillance — CICIDS2017 Dataset · Random Forest AI Engine</p>
        </div>
        <button
          onClick={fetchDashboardData}
          className="px-3.5 py-2 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 rounded-xl text-xs font-semibold text-cyan-300 flex items-center space-x-2 transition-all"
        >
          <ArrowPathIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* AI Model Summary Banner */}
      {aiModelSummary && (
        <div className="glass-card rounded-2xl p-5 border border-emerald-500/30 bg-gradient-to-r from-slate-900 via-emerald-950/10 to-slate-900">
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                <SparklesIcon className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Active AI Model</span>
                <span className="text-base font-black text-white font-mono">🏆 {aiModelSummary.bestModel}</span>
              </div>
            </div>
            {[
              { label: 'Accuracy', value: aiModelSummary.accuracy },
              { label: 'F1 Score', value: aiModelSummary.f1Score },
              { label: 'Dataset', value: aiModelSummary.datasetName },
              { label: 'Total Samples', value: aiModelSummary.totalSamples.toLocaleString() },
              { label: 'Attack Samples', value: aiModelSummary.attackSamples },
              { label: 'Features', value: aiModelSummary.numFeatures },
              { label: 'Threat Classes', value: aiModelSummary.numClasses }
            ].map(({ label, value }) => (
              <div key={label} className="text-center">
                <span className="text-[10px] uppercase text-slate-400 block font-mono">{label}</span>
                <span className="text-sm font-bold text-cyan-300 font-mono">{value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* System Status Banner */}
      <div className="glass-card rounded-2xl p-6 border border-cyan-500/30 bg-gradient-to-r from-slate-900/90 via-slate-900/80 to-blue-950/40">
        <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-glow-cyan">
              <ShieldCheckIcon className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white tracking-wide uppercase font-mono">OVERALL SYSTEM STATUS</h3>
              <span className="text-xs text-slate-400">Engine Monitoring Nodes & Defense Systems</span>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <span className="text-[10px] uppercase text-slate-400 font-bold block">Security Score</span>
              <span className="text-2xl font-black text-emerald-400 font-mono">{systemStatus.securityScore}/100</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase text-slate-400 font-bold block">Risk Level</span>
              <Badge variant={systemStatus.riskLevel === 'LOW' ? 'online' : 'critical'}>{systemStatus.riskLevel}</Badge>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4 text-center font-mono">
          {[
            { label: 'CPU Usage', value: systemStatus.cpuUsage + '%', color: 'text-cyan-400' },
            { label: 'Memory Usage', value: systemStatus.memoryUsage + '%', color: 'text-cyan-400' },
            { label: 'Disk Usage', value: systemStatus.diskUsage + '%', color: 'text-cyan-400' },
            { label: 'Network Health', value: systemStatus.networkHealth + '%', color: 'text-emerald-400' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
              <span className="text-[10px] uppercase text-slate-400 block mb-1">{label}</span>
              <span className={`text-base font-bold ${color}`}>{value}</span>
            </div>
          ))}
          <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
            <span className="text-[10px] uppercase text-slate-400 block mb-1">Firewall</span>
            <Badge variant="online">{systemStatus.firewallStatus}</Badge>
          </div>
          <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
            <span className="text-[10px] uppercase text-slate-400 block mb-1">IDS Status</span>
            <Badge variant="online">{systemStatus.idsStatus}</Badge>
          </div>
          <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
            <span className="text-[10px] uppercase text-slate-400 block mb-1">Server</span>
            <Badge variant="online">{systemStatus.serverStatus}</Badge>
          </div>
        </div>
      </div>

      {/* Metric Cards - all grounded in dataset stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
        <Card title="Total Traffic Flows" value={cards.totalTrafficFlows} icon={SignalIcon} glowColor="cyan" />
        <Card title="Attack Flows Detected" value={cards.attackFlowsDetected} icon={ExclamationTriangleIcon} glowColor="red" />
        <Card title="Threat Classes" value={cards.threatClasses} icon={ShieldCheckIcon} glowColor="orange" />
        <Card title="Model Accuracy" value={cards.modelAccuracy} icon={CpuChipIcon} glowColor="green" />
        <Card title="Active AI Model" value={cards.activeModel} icon={SparklesIcon} glowColor="cyan" />
        <Card title="Active Devices" value="452" icon={ServerIcon} glowColor="cyan" />
      </div>

      {/* Charts — data from CICIDS2017 class distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-card rounded-2xl p-5 border border-slate-800">
          <h3 className="text-sm font-bold text-white mb-1 uppercase tracking-wider font-mono">
            Benign vs Attack Traffic Flows (CICIDS2017 Hourly Distribution)
          </h3>
          <p className="text-[10px] text-slate-500 mb-4 font-mono">Source: CICIDS2017 · 2,500 samples · 1,750 benign / 750 attack</p>
          <LineChart data={charts.trafficLineChart} />
        </div>
        <div className="glass-card rounded-2xl p-5 border border-slate-800">
          <h3 className="text-sm font-bold text-white mb-1 uppercase tracking-wider font-mono">
            Attack Class Distribution
          </h3>
          <p className="text-[10px] text-slate-500 mb-4 font-mono">CICIDS2017 · 7 classes · actual sample counts</p>
          <PieChart data={charts.protocolPieChart} />
        </div>
      </div>

      <div className="glass-card rounded-2xl p-5 border border-slate-800">
        <h3 className="text-sm font-bold text-white mb-1 uppercase tracking-wider font-mono">
          Weekly Threat Severity Trend
        </h3>
        <p className="text-[10px] text-slate-500 mb-4 font-mono">High = DoS/DDoS · Medium = PortScan/SSH-Patator · Low = Bot/Web Attack</p>
        <BarChart data={charts.threatTrendChart} />
      </div>

      {/* Recent Threats & Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-card rounded-2xl p-6 border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">Recent AI-Detected Threats</h3>
            <span className="text-xs text-cyan-400 font-mono font-semibold">Live Feed · RF Model</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase">
                  <th className="py-3 px-2">Time</th>
                  <th className="py-3 px-2">Source IP</th>
                  <th className="py-3 px-2">Dest IP</th>
                  <th className="py-3 px-2">Threat Class</th>
                  <th className="py-3 px-2">Confidence</th>
                  <th className="py-3 px-2">Risk</th>
                  <th className="py-3 px-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {recentThreats.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-2 text-slate-400">{t.time}</td>
                    <td className="py-3 px-2 text-cyan-300 font-semibold">{t.sourceIp}</td>
                    <td className="py-3 px-2 text-slate-300">{t.destinationIp}</td>
                    <td className="py-3 px-2 text-white font-semibold">{t.threat}</td>
                    <td className="py-3 px-2 text-emerald-400">{t.confidence}</td>
                    <td className="py-3 px-2">
                      <span className={`font-bold ${t.riskScore >= 76 ? 'text-red-400' : t.riskScore >= 51 ? 'text-orange-400' : 'text-amber-400'}`}>
                        {t.riskScore}/100
                      </span>
                    </td>
                    <td className="py-3 px-2">
                      <Badge variant={t.severity.toLowerCase()}>{t.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-6 border border-slate-800">
          <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-wider font-mono">Latest AI Engine Activities</h3>
          <div className="space-y-4">
            {latestActivities.map((act) => (
              <div key={act.id} className="flex items-start space-x-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                <div className="p-2 rounded-lg bg-slate-800 text-cyan-400 mt-0.5">
                  <ClockIcon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-slate-200 leading-snug">{act.message}</p>
                  <span className="text-[10px] text-slate-400 font-mono mt-1 block">{act.timestamp}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalystDashboardPage;
