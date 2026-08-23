import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Skeleton from '../../components/common/Skeleton';
import {
  ChartBarIcon,
  ShieldExclamationIcon,
  ClockIcon,
  CheckCircleIcon,
  ArrowPathIcon,
  FunnelIcon,
  SignalIcon
} from '@heroicons/react/24/outline';

const SecurityAnalyticsPage = () => {
  const [dateRange, setDateRange] = useState('TODAY');
  const [loading, setLoading] = useState(true);

  // Analytics Data States
  const [overview, setOverview] = useState(null);
  const [socMetrics, setSocMetrics] = useState(null);
  const [attacks, setAttacks] = useState([]);
  const [severities, setSeverities] = useState({});
  const [risk, setRisk] = useState({});
  const [timeline, setTimeline] = useState([]);
  const [protocols, setProtocols] = useState([]);
  const [topSources, setTopSources] = useState([]);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    try {
      const [
        overviewRes,
        metricsRes,
        attacksRes,
        sevRes,
        riskRes,
        timeRes,
        protoRes,
        sourcesRes
      ] = await Promise.all([
        api.get('/analytics/overview', { params: { dateRange } }),
        api.get('/analytics/metrics'),
        api.get('/analytics/attacks', { params: { dateRange } }),
        api.get('/analytics/severity', { params: { dateRange } }),
        api.get('/analytics/risk', { params: { dateRange } }),
        api.get('/analytics/timeline', { params: { dateRange } }),
        api.get('/analytics/protocols', { params: { dateRange } }),
        api.get('/analytics/sources', { params: { limit: 5 } })
      ]);

      if (overviewRes.data) setOverview(overviewRes.data.data);
      if (metricsRes.data) setSocMetrics(metricsRes.data.data);
      if (attacksRes.data) setAttacks(attacksRes.data.data || []);
      if (sevRes.data) setSeverities(sevRes.data.data || {});
      if (riskRes.data) setRisk(riskRes.data.data || {});
      if (timeRes.data) setTimeline(timeRes.data.data || []);
      if (protoRes.data) setProtocols(protoRes.data.data || []);
      if (sourcesRes.data) setTopSources(sourcesRes.data.data || []);
    } catch (err) {
      console.error('Error loading analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, [dateRange]);

  return (
    <div className="space-y-6 font-sans">
      {/* Header Banner */}
      <div className="glass-card rounded-2xl p-6 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-wide font-mono flex items-center space-x-3">
            <ChartBarIcon className="w-6 h-6 text-cyan-400" />
            <span>SOC Security Analytics & Attack Visualization Dashboard</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Server-side aggregated threat telemetry, attack distribution breakdown, and SOC operational performance benchmarks.
          </p>
        </div>

        <div className="flex items-center space-x-3 font-mono text-xs">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-cyan-300 font-bold focus:outline-none"
          >
            <option value="TODAY">Today</option>
            <option value="LAST_7_DAYS">Last 7 Days</option>
            <option value="LAST_30_DAYS">Last 30 Days</option>
          </select>
          <button
            onClick={fetchAnalyticsData}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700"
          >
            <ArrowPathIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* SOC Performance Operational Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono">
        <div className="glass-card p-4 rounded-2xl border border-slate-800 space-y-1">
          <span className="text-slate-400 text-[10px] uppercase font-bold block">Mean Time to Acknowledge (MTTA)</span>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-cyan-400">{socMetrics?.mttaMinutes || 4}</span>
            <span className="text-xs text-slate-400">Minutes</span>
          </div>
          <p className="text-[10px] text-slate-500">Average analyst reaction speed</p>
        </div>

        <div className="glass-card p-4 rounded-2xl border border-slate-800 space-y-1">
          <span className="text-slate-400 text-[10px] uppercase font-bold block">Mean Time to Resolve (MTTR)</span>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-amber-400">{socMetrics?.mttrMinutes || 22}</span>
            <span className="text-xs text-slate-400">Minutes</span>
          </div>
          <p className="text-[10px] text-slate-500">Average containment duration</p>
        </div>

        <div className="glass-card p-4 rounded-2xl border border-slate-800 space-y-1">
          <span className="text-slate-400 text-[10px] uppercase font-bold block">Alert Resolution Rate</span>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-emerald-400">{socMetrics?.resolutionRate || 95}%</span>
          </div>
          <p className="text-[10px] text-slate-500">Resolved vs total alerts</p>
        </div>

        <div className="glass-card p-4 rounded-2xl border border-slate-800 space-y-1">
          <span className="text-slate-400 text-[10px] uppercase font-bold block">Critical Alert Rate</span>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-rose-400">{socMetrics?.criticalAlertRate || 28}%</span>
          </div>
          <p className="text-[10px] text-slate-500">High severity attack ratio</p>
        </div>
      </div>

      {/* Main Grid: Attack Distribution & Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-mono text-xs">
        {/* Attack Category Breakdown */}
        <div className="glass-card rounded-2xl p-5 border border-slate-800 space-y-4 lg:col-span-1">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center justify-between border-b border-slate-800 pb-2">
            <span>Attack Category Breakdown</span>
            <FunnelIcon className="w-4 h-4 text-cyan-400" />
          </h3>

          {loading ? (
            <Skeleton height="h-48" />
          ) : attacks.length === 0 ? (
            <p className="text-slate-500 italic text-[11px]">No attack data recorded for selected period.</p>
          ) : (
            <div className="space-y-3">
              {attacks.map((at) => (
                <div key={at.attackType} className="space-y-1">
                  <div className="flex justify-between text-slate-300 font-bold">
                    <span>{at.attackType}</span>
                    <span className="text-cyan-400">{at.count} alerts</span>
                  </div>
                  <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className="bg-gradient-to-r from-cyan-500 to-blue-600 h-full rounded-full"
                      style={{ width: `${Math.min(100, Math.max(10, (at.count / (overview?.totalThreats || 1)) * 100))}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Interactive Attack Timeline */}
        <div className="glass-card rounded-2xl p-5 border border-slate-800 space-y-4 lg:col-span-2">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center justify-between border-b border-slate-800 pb-2">
            <span>Attack Volume Timeline & Frequency Trends</span>
            <ClockIcon className="w-4 h-4 text-cyan-400" />
          </h3>

          {loading ? (
            <Skeleton height="h-48" />
          ) : timeline.length === 0 ? (
            <p className="text-slate-500 italic text-[11px]">No timeline telemetry recorded.</p>
          ) : (
            <div className="space-y-4">
              <div className="h-48 flex items-end justify-around gap-1 px-3 pb-2 bg-slate-950/60 rounded-xl border border-slate-800 overflow-visible">
                {timeline.map((t, idx) => {
                  const maxCount = Math.max(...timeline.map(item => item.total), 1);
                  const barHeightPx = Math.max(18, Math.round((t.total / maxCount) * 140));
                  const criticalHeightPx = t.critical > 0 ? Math.max(6, Math.round((t.critical / maxCount) * 140)) : 0;
                  const normalHeightPx = Math.max(4, barHeightPx - criticalHeightPx);
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center justify-end relative group" style={{ minWidth: '24px' }}>
                      <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col items-center z-20 pointer-events-none">
                        <div className="bg-slate-800 text-cyan-300 px-2 py-1.5 rounded-lg text-[9px] border border-cyan-500/40 font-bold whitespace-nowrap shadow-xl text-center">
                          <span className="block text-white">{t.label}</span>
                          <span className="text-cyan-400">{t.total} attacks</span>
                          {t.critical > 0 && <span className="block text-rose-400">{t.critical} critical</span>}
                        </div>
                      </div>
                      {criticalHeightPx > 0 && (
                        <div className="w-full max-w-[22px] bg-gradient-to-t from-rose-600 to-rose-400" style={{ height: `${criticalHeightPx}px` }} />
                      )}
                      <div className="w-full max-w-[22px] bg-gradient-to-t from-blue-700 via-cyan-500 to-cyan-300 rounded-t hover:brightness-125 transition-all" style={{ height: `${normalHeightPx}px` }} />
                      <span className="text-[8px] text-slate-500 mt-1 truncate text-center">{t.label.split(' ')[1] || t.label}</span>
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center justify-center space-x-6 text-[10px] text-slate-400 pt-1">
                <span className="flex items-center space-x-1.5">
                  <span className="w-3 h-3 rounded-sm bg-cyan-400 inline-block" />
                  <span>Total Alert Volume</span>
                </span>
                <span className="flex items-center space-x-1.5">
                  <span className="w-3 h-3 rounded-sm bg-rose-500 inline-block" />
                  <span>Critical Attacks</span>
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Grid: Risk Histogram, Severity Distribution & Top Sources */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-mono text-xs">
        {/* Risk Score Ranges */}
        <div className="glass-card rounded-2xl p-5 border border-slate-800 space-y-3">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider text-cyan-400">Risk Score Histogram</h3>
          <div className="space-y-2">
            {Object.entries(risk).map(([label, val]) => (
              <div key={label} className="space-y-1">
                <div className="flex justify-between text-slate-300 text-[11px]">
                  <span>{label}</span>
                  <span className="text-cyan-400 font-bold">{val}</span>
                </div>
                <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-amber-400 h-full" style={{ width: `${Math.min(100, (val / (overview?.totalThreats || 1)) * 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Severity Breakdown */}
        <div className="glass-card rounded-2xl p-5 border border-slate-800 space-y-3">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider text-cyan-400">Severity Distribution</h3>
          <div className="space-y-2">
            {Object.entries(severities).map(([sev, val]) => (
              <div key={sev} className="flex items-center justify-between p-2 bg-slate-950/60 rounded-xl border border-slate-800">
                <Badge variant={sev.toLowerCase()}>{sev}</Badge>
                <span className="text-white font-bold">{val} Alerts</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Attack Sources */}
        <div className="glass-card rounded-2xl p-5 border border-slate-800 space-y-3">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider text-cyan-400">Top Attack Source IPs</h3>
          <div className="space-y-2">
            {topSources.map((src) => (
              <div key={src.sourceIp} className="flex items-center justify-between p-2 bg-slate-950/60 rounded-xl border border-slate-800">
                <div>
                  <span className="font-bold text-cyan-300 block">{src.sourceIp}</span>
                  <span className="text-[10px] text-slate-500">{src.attackTypes?.join(', ')}</span>
                </div>
                <span className="text-rose-400 font-bold">{src.count} reqs</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecurityAnalyticsPage;
