import { useEffect, useMemo, useState } from 'react';
import { Bar, Doughnut, Line, Pie } from 'react-chartjs-2';
import { ArcElement, BarElement, CategoryScale, Chart as ChartJS, Legend, LineElement, LinearScale, PointElement, Tooltip } from 'chart.js';
import api from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import HeaderNav from '../components/HeaderNav';

import { useTheme } from '../context/ThemeContext';

ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

export default function Analytics() {
  const { isDark } = useTheme();
  const [analytics, setAnalytics] = useState(null);
  const [threatIntelligence, setThreatIntelligence] = useState(null);
  const [loading, setLoading] = useState(true);

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

  const pieChartOptions = useMemo(
    () => ({
      ...chartOptions,
      scales: {
        x: { display: false },
        y: { display: false },
      },
    }),
    [chartOptions]
  );
  const [error, setError] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [analyticsRes, intelRes] = await Promise.allSettled([
        api.get('/network/analytics'),
        api.get('/threat-intelligence/analytics'),
      ]);

      if (analyticsRes.status === 'fulfilled') {
        setAnalytics(analyticsRes.value.data);
      }
      if (intelRes.status === 'fulfilled') {
        setThreatIntelligence(intelRes.value.data);
      }
    } catch (err) {
      console.warn('Error loading analytics:', err);
      setError('Unable to load analytics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalTraffic = analytics?.total_traffic || 0;
  const attackCount = analytics?.attack_traffic || 0;
  const benignCount = analytics?.normal_traffic || 0;
  const attackPercentage = totalTraffic > 0 ? ((attackCount / totalTraffic) * 100).toFixed(1) : '0.0';
  const uniqueSrcIPs = analytics?.unique_source_ips || 0;
  const uniqueDstIPs = analytics?.unique_destination_ips || 0;

  // Pie Chart: Attack Distribution
  const pieChartData = useMemo(() => {
    const dist = threatIntelligence?.attack_distribution || [];
    if (dist.length === 0) return null;
    return {
      labels: dist.map((d) => d.attack_type),
      datasets: [
        {
          data: dist.map((d) => d.count),
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
  }, [threatIntelligence]);

  // Line Chart: Threat Trend over time
  const lineChartData = useMemo(() => {
    const trend = threatIntelligence?.threat_trend || [];
    if (trend.length === 0) return null;
    return {
      labels: trend.map((t) => t.time),
      datasets: [
        {
          label: 'Threat Trend',
          data: trend.map((t) => t.count),
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.15)',
          fill: true,
          tension: 0.4,
        },
      ],
    };
  }, [threatIntelligence]);

  // Bar Chart: Severity Distribution
  const severityChartData = useMemo(() => {
    const riskDist = analytics?.threat_level_distribution || [];
    if (riskDist.length === 0) return null;
    return {
      labels: riskDist.map((r) => r.level || r.name || r._id || 'Unknown'),
      datasets: [
        {
          label: 'Severity Count',
          data: riskDist.map((r) => r.count),
          backgroundColor: 'rgba(244, 63, 94, 0.75)',
          borderRadius: 8,
        },
      ],
    };
  }, [analytics]);

  // Doughnut Chart: Protocol Distribution
  const protocolChartData = useMemo(() => {
    const protoDist = analytics?.protocol_distribution || [];
    if (protoDist.length === 0) return null;
    return {
      labels: protoDist.map((p) => p.protocol || p.name || p._id || 'Unknown'),
      datasets: [
        {
          data: protoDist.map((p) => p.count),
          backgroundColor: [
            'rgba(59, 130, 246, 0.8)',
            'rgba(168, 85, 247, 0.8)',
            'rgba(16, 185, 129, 0.8)',
            'rgba(245, 158, 11, 0.8)',
          ],
          borderColor: '#0f172a',
          borderWidth: 2,
        },
      ],
    };
  }, [analytics]);

  const renderEmptyState = (message) => (
    <div className="flex h-full items-center justify-center text-slate-500 text-sm">
      {message}
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
      <div className="mx-auto max-w-7xl">
        <HeaderNav
          title="Network Analytics"
          subtitle="Real-time network traffic analysis, attack distribution, and protocol breakdowns."
          onRefresh={loadData}
        />

        {loading ? (
          <div className="p-16 text-center">
            <LoadingSpinner />
            <p className="mt-2 text-xs text-slate-400">Loading Analytics Data...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-rose-400 text-sm">{error}</div>
        ) : (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6 mb-6">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 backdrop-blur">
                <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Total Traffic</p>
                <p className="mt-2 text-2xl font-bold text-white stat-value-default">{totalTraffic}</p>
              </div>
              <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-5 backdrop-blur">
                <p className="text-[10px] uppercase tracking-wider text-rose-400 font-semibold">Attack Count</p>
                <p className="mt-2 text-2xl font-bold text-rose-300 stat-value-rose">{attackCount}</p>
              </div>
              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5 backdrop-blur">
                <p className="text-[10px] uppercase tracking-wider text-emerald-400 font-semibold">Benign Count</p>
                <p className="mt-2 text-2xl font-bold text-emerald-300 stat-value-emerald">{benignCount}</p>
              </div>
              <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 backdrop-blur">
                <p className="text-[10px] uppercase tracking-wider text-amber-400 font-semibold">Attack %</p>
                <p className="mt-2 text-2xl font-bold text-amber-300 stat-value-amber">{attackPercentage}%</p>
              </div>
              <div className="rounded-2xl border border-blue-500/30 bg-blue-500/10 p-5 backdrop-blur">
                <p className="text-[10px] uppercase tracking-wider text-blue-400 font-semibold">Unique Src IPs</p>
                <p className="mt-2 text-2xl font-bold text-blue-300 stat-value-blue">{uniqueSrcIPs}</p>
              </div>
              <div className="rounded-2xl border border-purple-500/30 bg-purple-500/10 p-5 backdrop-blur">
                <p className="text-[10px] uppercase tracking-wider text-purple-400 font-semibold">Unique Dst IPs</p>
                <p className="mt-2 text-2xl font-bold text-purple-300 stat-value-purple">{uniqueDstIPs}</p>
              </div>
            </div>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 mb-6">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 backdrop-blur">
                <h3 className="text-base font-bold text-white mb-1">Attack Distribution</h3>
                <p className="text-xs text-slate-400 mb-4">Breakdown by attack category.</p>
                <div className="h-64">
                  {pieChartData ? (
                    <Pie data={pieChartData} options={pieChartOptions} />
                  ) : renderEmptyState('No attack distribution data available')}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 backdrop-blur">
                <h3 className="text-base font-bold text-white mb-1">Threat Detection Trend</h3>
                <p className="text-xs text-slate-400 mb-4">Detection volume across time intervals.</p>
                <div className="h-64">
                  {lineChartData ? (
                    <Line data={lineChartData} options={chartOptions} />
                  ) : renderEmptyState('No threat trend data available')}
                </div>
              </div>
            </div>

            {/* Charts Row 2 */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 mb-6">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 backdrop-blur">
                <h3 className="text-base font-bold text-white mb-1">Severity Distribution</h3>
                <p className="text-xs text-slate-400 mb-4">Frequency of threat detections grouped by severity level.</p>
                <div className="h-64">
                  {severityChartData ? (
                    <Bar data={severityChartData} options={chartOptions} />
                  ) : renderEmptyState('No severity distribution data available')}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 backdrop-blur">
                <h3 className="text-base font-bold text-white mb-1">Protocol Distribution</h3>
                <p className="text-xs text-slate-400 mb-4">Network protocol usage breakdown across all traffic.</p>
                <div className="h-64">
                  {protocolChartData ? (
                    <Doughnut data={protocolChartData} options={pieChartOptions} />
                  ) : renderEmptyState('No protocol data available')}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
