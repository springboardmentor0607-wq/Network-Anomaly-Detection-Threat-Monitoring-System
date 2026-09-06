import { useEffect, useMemo, useState } from 'react';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import { ArcElement, BarElement, CategoryScale, Chart as ChartJS, Legend, LineElement, LinearScale, PointElement, Tooltip } from 'chart.js';
import api from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import HeaderNav from '../components/HeaderNav';

import { useTheme } from '../context/ThemeContext';

ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

const getSeverityClass = (sev) => {
  const normalized = String(sev ?? '').trim().toLowerCase();
  if (normalized.includes('critical')) {
    return 'bg-red-500/20 text-red-400 border-red-500/40 font-bold';
  }
  if (normalized.includes('high')) {
    return 'bg-rose-500/20 text-rose-400 border-rose-500/40 font-semibold';
  }
  if (normalized.includes('medium') || normalized.includes('moderate')) {
    return 'bg-amber-500/20 text-amber-400 border-amber-500/40 font-semibold';
  }
  if (normalized.includes('low') || normalized.includes('info') || normalized.includes('safe')) {
    return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 font-semibold';
  }
  return 'bg-slate-700/50 text-slate-300 border-slate-600/50';
};

const getHeatmapColor = (intensity) => {
  const val = Number(intensity) || 0;
  if (val >= 80) return 'bg-red-600/90 text-white';
  if (val >= 60) return 'bg-rose-500/80 text-white';
  if (val >= 40) return 'bg-amber-500/80 text-slate-900';
  if (val >= 20) return 'bg-yellow-500/70 text-slate-900';
  if (val > 0) return 'bg-emerald-500/60 text-slate-900';
  return 'bg-slate-800/40 text-slate-500';
};

export default function AttackVisualization() {
  const { isDark } = useTheme();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const chartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: isDark ? '#cbd5e1' : '#0f172a',
            font: { size: 11, weight: '600' },
          },
        },
        tooltip: {
          backgroundColor: isDark ? '#0f172a' : '#ffffff',
          titleColor: isDark ? '#ffffff' : '#020617',
          bodyColor: isDark ? '#cbd5e1' : '#0f172a',
          borderColor: isDark ? '#334155' : '#cbd5e1',
          borderWidth: 1,
        },
      },
      scales: {
        x: {
          ticks: { color: isDark ? '#94a3b8' : '#1e293b', font: { weight: '600' } },
          grid: { color: isDark ? 'rgba(148, 163, 184, 0.15)' : 'rgba(15, 23, 42, 0.08)' },
        },
        y: {
          ticks: { color: isDark ? '#94a3b8' : '#1e293b', font: { weight: '600' } },
          grid: { color: isDark ? 'rgba(148, 163, 184, 0.15)' : 'rgba(15, 23, 42, 0.08)' },
        },
      },
    }),
    [isDark]
  );

  // Interactive Filters
  const [severityFilter, setSeverityFilter] = useState('All');
  const [attackTypeFilter, setAttackTypeFilter] = useState('All');
  const [dateRangeFilter, setDateRangeFilter] = useState('All');

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (severityFilter !== 'All') params.severity = severityFilter;
      if (attackTypeFilter !== 'All') params.attack_type = attackTypeFilter;
      
      if (dateRangeFilter !== 'All') {
        const now = new Date();
        let startDate;
        if (dateRangeFilter === '24h') {
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        } else if (dateRangeFilter === '7d') {
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        } else if (dateRangeFilter === '30d') {
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        }
        if (startDate) {
          params.start_date = startDate.toISOString();
        }
      }

      const response = await api.get('/threat-intelligence/analytics', { params });
      setData(response.data);
    } catch (err) {
      console.warn('Error loading attack visualization data:', err);
      setError(err?.response?.data?.detail || 'Unable to load attack visualization data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [severityFilter, attackTypeFilter, dateRangeFilter]);

  // 1. Attack Timeline Graph Data
  const timelineChartData = useMemo(() => {
    const trend = data?.threat_trend || [];
    return {
      labels: trend.map((t) => t.time),
      datasets: [
        {
          label: 'Attack Events Over Time',
          data: trend.map((t) => t.count),
          borderColor: '#f43f5e',
          backgroundColor: 'rgba(244, 63, 94, 0.15)',
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#fb7185',
        },
      ],
    };
  }, [data]);

  // 2. Protocol Distribution Data
  const protocolChartData = useMemo(() => {
    const protos = data?.protocol_distribution || [];
    return {
      labels: protos.map((p) => p.name || p.protocol || 'Unknown'),
      datasets: [
        {
          data: protos.map((p) => p.count),
          backgroundColor: [
            'rgba(59, 130, 246, 0.8)',
            'rgba(168, 85, 247, 0.8)',
            'rgba(245, 158, 11, 0.8)',
            'rgba(16, 185, 129, 0.8)',
            'rgba(148, 163, 184, 0.8)',
          ],
          borderColor: '#0f172a',
          borderWidth: 2,
        },
      ],
    };
  }, [data]);

  // 3. Top Attacker IPs Chart Data
  const attackerIpsChartData = useMemo(() => {
    const ips = data?.top_attacker_ips || [];
    return {
      labels: ips.map((item) => item.ip),
      datasets: [
        {
          label: 'Attack Count',
          data: ips.map((item) => item.count),
          backgroundColor: 'rgba(239, 68, 68, 0.75)',
          borderRadius: 6,
        },
      ],
    };
  }, [data]);

  // 4. Network Traffic Flow Visualization Data
  const trafficFlowChartData = useMemo(() => {
    const flow = data?.traffic_flow || [];
    return {
      labels: flow.map((f) => f.time),
      datasets: [
        {
          label: 'Traffic Throughput (Mbps)',
          data: flow.map((f) => f.bandwidth_mbps),
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.2)',
          fill: true,
          tension: 0.3,
        },
      ],
    };
  }, [data]);

  // 5. Attack Distribution Bar Chart Data
  const attackDistributionChartData = useMemo(() => {
    const dist = data?.attack_distribution || [];
    const attacksOnly = dist.filter((item) => !['benign', 'normal', 'safe'].includes(item.attack_type.toLowerCase()));
    
    return {
      labels: attacksOnly.map((item) => item.attack_type),
      datasets: [
        {
          label: 'Attack Count',
          data: attacksOnly.map((item) => item.count),
          backgroundColor: 'rgba(244, 63, 94, 0.75)',
          borderColor: '#f43f5e',
          borderWidth: 1,
          borderRadius: 6,
        },
      ],
    };
  }, [data]);

  const riskHeatmap = data?.risk_heatmap || [];
  const topIps = data?.top_attacker_ips || [];
  const detectionTimeline = data?.detection_timeline || [];

  const totalThreats = data?.kpis?.total_threats || 0;
  const hasTimelineData = data?.threat_trend?.some((t) => t.count > 0);
  const hasProtocolData = data?.protocol_distribution?.some((p) => p.count > 0);
  const hasHeatmapData = riskHeatmap.some((row) => row.slots?.some((s) => s.intensity > 0));
  const hasAttackerIpData = topIps.length > 0;
  const hasTrafficFlowData = data?.traffic_flow?.some((f) => f.bandwidth_mbps > 0 || f.packet_count > 0);
  const hasAttackDistData = data?.attack_distribution?.some((item) => !['benign', 'normal', 'safe'].includes(item.attack_type.toLowerCase()) && item.count > 0);

  const renderEmptyState = (message) => (
    <div className="flex h-full min-h-[180px] items-center justify-center text-slate-500 text-sm">
      {message}
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
      <div className="mx-auto max-w-7xl">
        <HeaderNav
          title="Attack Visualization Engine"
          subtitle="Interactive threat timeline, risk heatmaps, top attacker IPs, protocol ratios, and network flow dynamics."
          onRefresh={loadData}
        />

        {/* Interactive Filter Bar */}
        <div className="mb-6 flex flex-wrap items-center gap-4 rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-xl backdrop-blur">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-400">Filters:</span>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-400">Severity:</label>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-slate-200 focus:border-blue-500 focus:outline-none"
            >
              <option value="All">All Severities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
              <option value="Safe">Safe</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-400">Attack Type:</label>
            <select
              value={attackTypeFilter}
              onChange={(e) => setAttackTypeFilter(e.target.value)}
              className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-slate-200 focus:border-blue-500 focus:outline-none"
            >
              <option value="All">All Attack Types</option>
              <option value="DDoS">DDoS</option>
              <option value="DoS">DoS</option>
              <option value="PortScan">PortScan</option>
              <option value="Malware">Malware</option>
              <option value="Infiltration">Infiltration</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-400">Time Range:</label>
            <select
              value={dateRangeFilter}
              onChange={(e) => setDateRangeFilter(e.target.value)}
              className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-slate-200 focus:border-blue-500 focus:outline-none"
            >
              <option value="All">All Time</option>
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
            </select>
          </div>

          <button
            type="button"
            onClick={() => {
              setSeverityFilter('All');
              setAttackTypeFilter('All');
              setDateRangeFilter('All');
            }}
            className="ml-auto rounded-xl border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs font-semibold text-slate-400 hover:text-white transition"
          >
            Reset Filters
          </button>
        </div>

        {loading ? (
          <div className="p-16 text-center">
            <LoadingSpinner />
            <p className="mt-2 text-xs text-slate-400">Rendering attack visualizations...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-rose-400 text-sm">{error}</div>
        ) : (
          <>
            {/* Section 1: Attack Timeline & Protocol Distribution */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 mb-6">
              {/* Attack Timeline Graph */}
              <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/80 p-5 backdrop-blur">
                <h3 className="text-base font-bold text-white mb-1">Attack Event Timeline</h3>
                <p className="text-xs text-slate-400 mb-4">Attack frequency progression over time.</p>
                <div className="h-64">
                  {hasTimelineData ? (
                    <Line data={timelineChartData} options={chartOptions} />
                  ) : renderEmptyState('No attack timeline data available')}
                </div>
              </div>

              {/* Protocol Distribution */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 backdrop-blur flex flex-col justify-between">
                <div>
                  <h3 className="text-base font-bold text-white mb-1">Protocol Distribution</h3>
                  <p className="text-xs text-slate-400 mb-4">Transport protocol breakdown.</p>
                </div>
                <div className="h-56 flex items-center justify-center">
                  {hasProtocolData ? (
                    <Doughnut data={protocolChartData} options={chartOptions} />
                  ) : renderEmptyState('No protocol data available')}
                </div>
              </div>
            </div>

            {/* Attack Distribution Bar Chart */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 backdrop-blur mb-6 shadow-xl">
              <div>
                <h3 className="text-base font-bold text-white mb-1">Attack Type Distribution (Volume)</h3>
                <p className="text-xs text-slate-400 mb-4">Total attack count grouped dynamically by predicted classification category.</p>
              </div>
              <div className="h-64">
                {hasAttackDistData ? (
                  <Bar data={attackDistributionChartData} options={chartOptions} />
                ) : renderEmptyState('No attack distribution data available')}
              </div>
            </div>

            {/* Section 2: Risk Heatmap Matrix */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 backdrop-blur mb-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-white">Risk Score Heatmap</h3>
                  <p className="text-xs text-slate-400">Threat risk intensity across attack categories and time intervals.</p>
                </div>
                <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-400">
                  <span>Low</span>
                  <span className="h-3 w-3 rounded bg-emerald-500/60 inline-block" />
                  <span className="h-3 w-3 rounded bg-yellow-500/70 inline-block" />
                  <span className="h-3 w-3 rounded bg-amber-500/80 inline-block" />
                  <span className="h-3 w-3 rounded bg-rose-500/80 inline-block" />
                  <span className="h-3 w-3 rounded bg-red-600/90 inline-block" />
                  <span>Critical</span>
                </div>
              </div>

              <div className="overflow-x-auto">
                {hasHeatmapData ? (
                  <table className="w-full text-center text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400">
                        <th className="py-2.5 px-4 text-left">Attack Category</th>
                        {['00:00', '04:00', '08:00', '12:00', '16:00', '20:00'].map((slot) => (
                          <th key={slot} className="py-2.5 px-4 font-mono">{slot}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/40">
                      {riskHeatmap.map((row, idx) => (
                        <tr key={idx}>
                          <td className="py-3 px-4 text-left font-bold text-white">{row.category}</td>
                          {row.slots?.map((s, sIdx) => {
                            const colorClass = getHeatmapColor(s.intensity);
                            return (
                              <td key={sIdx} className="py-2 px-2">
                                <div
                                  className={`rounded-xl py-2 px-3 font-mono font-bold text-xs transition duration-200 hover:scale-105 ${colorClass}`}
                                  title={`Category: ${row.category} | Time: ${s.time} | Intensity: ${s.intensity}`}
                                >
                                  {s.intensity}
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : renderEmptyState('No risk heatmap data available')}
              </div>
            </div>

            {/* Section 3: Top Attacker IPs & Network Traffic Flow */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 mb-6">
              {/* Top Attacker IPs Ranking */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 backdrop-blur">
                <h3 className="text-base font-bold text-white mb-1">Top Malicious Source IPs</h3>
                <p className="text-xs text-slate-400 mb-4">Ranked source IP addresses generating high threat volume.</p>
                
                <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                  {hasAttackerIpData ? (
                    topIps.map((item, idx) => {
                      const sevClass = getSeverityClass(item.max_severity);
                      return (
                        <div
                          key={idx}
                          className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs"
                        >
                          <div className="flex items-center gap-3">
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-800 font-bold text-blue-400">
                              #{idx + 1}
                            </span>
                            <div>
                              <p className="font-mono font-bold text-white">{item.ip}</p>
                              <div className="flex gap-2 text-[11px] text-slate-400">
                                <span>{Array.isArray(item.attack_types) ? item.attack_types.join(', ') : 'Threat'}</span>
                                <span>•</span>
                                <span className="text-slate-500 font-semibold">{item.location || 'Location unavailable'}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${sevClass}`}>
                              {item.max_severity}
                            </span>
                            <span className="font-bold text-rose-400">{item.count} attacks</span>
                          </div>
                        </div>
                      );
                    })
                  ) : renderEmptyState('No malicious source IPs recorded')}
                </div>
              </div>

              {/* Network Traffic Flow Visualization */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 backdrop-blur">
                <h3 className="text-base font-bold text-white mb-1">Network Throughput Visualization</h3>
                <p className="text-xs text-slate-400 mb-4">Real-time bandwidth throughput (Mbps) over time.</p>
                <div className="h-64">
                  {hasTrafficFlowData ? (
                    <Line data={trafficFlowChartData} options={chartOptions} />
                  ) : renderEmptyState('No traffic throughput data available')}
                </div>
              </div>
            </div>

            {/* Section 4: Recent Attack Events Table */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 backdrop-blur mb-6">
              <h3 className="text-base font-bold text-white mb-1">Recent Attack Events</h3>
              <p className="text-xs text-slate-400 mb-4">Real-time stream of latest detected network intrusions and anomalies.</p>
              
              <div className="overflow-x-auto">
                {detectionTimeline.length > 0 ? (
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="border-b border-slate-800 bg-slate-950/70 text-[11px] uppercase tracking-wider text-slate-400">
                      <tr>
                        <th className="px-4 py-3">Timestamp</th>
                        <th className="px-4 py-3">Alert ID</th>
                        <th className="px-4 py-3">Attack Type</th>
                        <th className="px-4 py-3">Severity</th>
                        <th className="px-4 py-3">Confidence</th>
                        <th className="px-4 py-3">Risk Score</th>
                        <th className="px-4 py-3">Source IP</th>
                        <th className="px-4 py-3">Destination IP</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {detectionTimeline.map((item, idx) => {
                        const sevClass = getSeverityClass(item.severity);
                        const confPct = typeof item.confidence === 'number'
                          ? `${(item.confidence * (item.confidence <= 1 ? 100 : 1)).toFixed(1)}%`
                          : `${item.confidence}`;

                        return (
                          <tr key={idx} className="hover:bg-slate-800/40 transition">
                            <td className="px-4 py-3 font-mono text-slate-400">
                              {new Date(item.timestamp).toLocaleString()}
                            </td>
                            <td className="px-4 py-3 font-mono font-bold text-blue-400">{item.alert_id}</td>
                            <td className="px-4 py-3 font-bold text-white">{item.attack_type}</td>
                            <td className="px-4 py-3">
                              <span className={`inline-block rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${sevClass}`}>
                                {item.severity}
                              </span>
                            </td>
                            <td className="px-4 py-3 font-semibold text-blue-400">{confPct}</td>
                            <td className="px-4 py-3 font-bold text-amber-300">{item.risk_score}</td>
                            <td className="px-4 py-3 font-mono text-slate-300">
                              {item.source_ip}
                              <span className="block text-[10px] text-slate-500">{item.source_location || 'Location unavailable'}</span>
                            </td>
                            <td className="px-4 py-3 font-mono text-slate-300">
                              {item.destination_ip}
                              <span className="block text-[10px] text-slate-500">{item.destination_location || 'Location unavailable'}</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                ) : renderEmptyState('No recent attack events available')}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
