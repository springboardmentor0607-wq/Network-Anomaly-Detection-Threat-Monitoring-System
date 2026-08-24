import { useEffect, useMemo, useState } from 'react';
import { Bar, Doughnut, Line, Pie } from 'react-chartjs-2';
import { ArcElement, BarElement, CategoryScale, Chart as ChartJS, Legend, LineElement, LinearScale, PointElement, Tooltip } from 'chart.js';
import api from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import HeaderNav from '../components/HeaderNav';

ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom',
      labels: {
        color: '#cbd5e1',
        font: { size: 11 },
      },
    },
  },
  scales: {
    x: {
      ticks: { color: '#94a3b8' },
      grid: { color: 'rgba(148, 163, 184, 0.15)' },
    },
    y: {
      ticks: { color: '#94a3b8' },
      grid: { color: 'rgba(148, 163, 184, 0.15)' },
    },
  },
};

const getSeverityBadgeClass = (severity) => {
  const sev = String(severity || '').toLowerCase();
  switch (sev) {
    case 'critical':
      return 'bg-red-500/20 text-red-400 border-red-500/40';
    case 'high':
      return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
    case 'medium':
      return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
    default:
      return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
  }
};

export default function ThreatAnalysis() {
  const [threatAnalytics, setThreatAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/threat-intelligence/analytics');
      setThreatAnalytics(response.data);
    } catch (err) {
      console.warn('Failed to load threat intelligence analytics:', err);
      setError(err?.response?.data?.detail || 'Unable to load threat intelligence analytics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const kpis = threatAnalytics?.kpis || {
    total_threats: 0,
    critical_high_count: 0,
    avg_risk_score: 0,
    top_attack_vector: 'N/A',
    active_incidents: 0,
  };

  // 1. Pie / Doughnut Chart: Attack Distribution
  const pieChartData = useMemo(() => {
    const dist = threatAnalytics?.attack_distribution || [];

    return {
      labels: dist.map((item) => item.attack_type),
      datasets: [
        {
          data: dist.map((item) => item.count),
          backgroundColor: [
            'rgba(244, 63, 94, 0.8)',
            'rgba(245, 158, 11, 0.8)',
            'rgba(168, 85, 247, 0.8)',
            'rgba(59, 130, 246, 0.8)',
            'rgba(16, 185, 129, 0.8)',
          ],
          borderColor: '#0f172a',
          borderWidth: 2,
        },
      ],
    };
  }, [threatAnalytics]);

  // 2. Line Chart: Threat Trend over time
  const lineChartData = useMemo(() => {
    const trend = threatAnalytics?.threat_trend || [];

    return {
      labels: trend.map((item) => item.time),
      datasets: [
        {
          label: 'Threat Detections',
          data: trend.map((item) => item.count),
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.15)',
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#60a5fa',
        },
      ],
    };
  }, [threatAnalytics]);

  // 3. Bar Chart: Risk Score Binned Distribution
  const barChartData = useMemo(() => {
    const riskDist = threatAnalytics?.risk_score_distribution || [];

    return {
      labels: riskDist.map((item) => item.range),
      datasets: [
        {
          label: 'Risk Score Frequency',
          data: riskDist.map((item) => item.count),
          backgroundColor: [
            'rgba(16, 185, 129, 0.7)',
            'rgba(59, 130, 246, 0.7)',
            'rgba(245, 158, 11, 0.7)',
            'rgba(244, 63, 94, 0.7)',
            'rgba(225, 29, 72, 0.9)',
          ],
          borderRadius: 8,
        },
      ],
    };
  }, [threatAnalytics]);

  // 4. Most Common Attacks Bar Chart
  const commonAttacksChartData = useMemo(() => {
    const common = threatAnalytics?.most_common_attacks || [];

    return {
      labels: common.map((item) => item.attack_type),
      datasets: [
        {
          label: 'Occurrences',
          data: common.map((item) => item.count),
          backgroundColor: 'rgba(168, 85, 247, 0.7)',
          borderRadius: 8,
        },
      ],
    };
  }, [threatAnalytics]);

  // 5. Line Chart: Weekly Security Trend
  const weeklyTrendChartData = useMemo(() => {
    const weeklyTrend = threatAnalytics?.weekly_threat_trend || [];

    return {
      labels: weeklyTrend.map((item) => item.label),
      datasets: [
        {
          label: 'Weekly Attack Count',
          data: weeklyTrend.map((item) => item.count),
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.15)',
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#34d399',
        },
      ],
    };
  }, [threatAnalytics]);

  const timeline = threatAnalytics?.detection_timeline || [];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
      <div className="mx-auto max-w-7xl">
        <HeaderNav
          title="Threat Intelligence Dashboard"
          subtitle="Real-time threat analytics, attack distribution, risk trends, and detection timeline."
          onRefresh={loadData}
        />

        {loading ? (
          <div className="p-16 text-center">
            <LoadingSpinner />
            <p className="mt-2 text-xs text-slate-400">Computing Threat Intelligence Analytics...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-rose-400 text-sm">{error}</div>
        ) : (
          <>
            {/* KPI Cards Row */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5 mb-6">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 backdrop-blur">
                <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Total Threats</p>
                <p className="mt-2 text-3xl font-bold text-white">{kpis.total_threats}</p>
                <span className="text-[11px] text-blue-400 mt-1 block">Recorded in database</span>
              </div>

              <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-5 backdrop-blur">
                <p className="text-xs uppercase tracking-wider text-rose-400 font-semibold">Critical & High Risk</p>
                <p className="mt-2 text-3xl font-bold text-rose-300">{kpis.critical_high_count}</p>
                <span className="text-[11px] text-rose-400/80 mt-1 block">Requires immediate action</span>
              </div>

              <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 backdrop-blur">
                <p className="text-xs uppercase tracking-wider text-amber-400 font-semibold">Avg Risk Score</p>
                <p className="mt-2 text-3xl font-bold text-amber-300">{kpis.avg_risk_score} / 100</p>
                <span className="text-[11px] text-amber-400/80 mt-1 block">Calculated risk level</span>
              </div>

              <div className="rounded-2xl border border-purple-500/30 bg-purple-500/10 p-5 backdrop-blur">
                <p className="text-xs uppercase tracking-wider text-purple-400 font-semibold">Top Threat Vector</p>
                <p className="mt-2 text-2xl font-bold text-purple-300 truncate">{kpis.top_attack_vector}</p>
                <span className="text-[11px] text-purple-400/80 mt-1 block">Most frequent category</span>
              </div>

              <div className="rounded-2xl border border-blue-500/30 bg-blue-500/10 p-5 backdrop-blur">
                <p className="text-xs uppercase tracking-wider text-blue-400 font-semibold">Active Incidents</p>
                <p className="mt-2 text-3xl font-bold text-blue-300">{kpis.active_incidents}</p>
                <span className="text-[11px] text-blue-400/80 mt-1 block">Under investigation</span>
              </div>
            </div>

            {/* Charts Section 1: Pie Chart & Line Chart */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 mb-6">
              {/* Pie / Doughnut Chart */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 backdrop-blur flex flex-col justify-between">
                <div>
                  <h3 className="text-base font-bold text-white mb-1">Attack Type Distribution</h3>
                  <p className="text-xs text-slate-400 mb-4">Percentage breakdown of threat categories detected by NetShield AI.</p>
                </div>
                <div className="h-64 relative flex items-center justify-center">
                  <Pie data={pieChartData} options={chartOptions} />
                </div>
              </div>

              {/* Line Chart */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 backdrop-blur flex flex-col justify-between">
                <div>
                  <h3 className="text-base font-bold text-white mb-1">Threat Detection Trend Over Time</h3>
                  <p className="text-xs text-slate-400 mb-4">Volume of threat events identified across time intervals.</p>
                </div>
                <div className="h-64">
                  <Line data={lineChartData} options={chartOptions} />
                </div>
              </div>
            </div>

            {/* Charts Section 2: Bar Charts (Risk Score Binned & Most Common Attacks) */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 mb-6">
              {/* Bar Chart: Risk Score Binned */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 backdrop-blur">
                <h3 className="text-base font-bold text-white mb-1">Risk Score Distribution (Binned)</h3>
                <p className="text-xs text-slate-400 mb-4">Threat counts grouped across risk score ranges (0 to 100).</p>
                <div className="h-64">
                  <Bar data={barChartData} options={chartOptions} />
                </div>
              </div>

              {/* Bar Chart: Most Common Attacks */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 backdrop-blur">
                <h3 className="text-base font-bold text-white mb-1">Most Common Attack Vectors</h3>
                <p className="text-xs text-slate-400 mb-4">Top threat categories ranked by total detection frequency.</p>
                <div className="h-64">
                  <Bar data={commonAttacksChartData} options={chartOptions} />
                </div>
              </div>
            </div>

            {/* Weekly Security Trend Chart */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 backdrop-blur mb-6 shadow-xl">
              <div>
                <h3 className="text-base font-bold text-white mb-1">Weekly Security Trend Analysis</h3>
                <p className="text-xs text-slate-400 mb-4">Chronological progression of weekly attack counts computed from alert timestamps in MongoDB.</p>
              </div>
              <div className="h-64">
                <Line data={weeklyTrendChartData} options={chartOptions} />
              </div>
            </div>

            {/* Detection Timeline */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 backdrop-blur">
              <h3 className="text-base font-bold text-white mb-1">Real-Time Threat Detection Timeline</h3>
              <p className="text-xs text-slate-400 mb-4">Chronological stream of recent threat detections and risk assessments.</p>

              <div className="overflow-x-auto">
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
                    {timeline.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-4 py-6 text-center text-slate-500">
                          No detection events recorded.
                        </td>
                      </tr>
                    ) : (
                      timeline.map((item, idx) => {
                        const sevClass = getSeverityBadgeClass(item.severity);
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
                            <td className="px-4 py-3 font-mono text-slate-300">{item.source_ip}</td>
                            <td className="px-4 py-3 font-mono text-slate-300">{item.destination_ip}</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
