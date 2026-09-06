import { useEffect, useState, useCallback } from 'react';
import api from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import HeaderNav from '../components/HeaderNav';
import { useAuth } from '../context/AuthContext';
import { Bar, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Tooltip, Legend, Filler);

// ─── Severity badge colours ──────────────────────────────────────────────────
const SEV_STYLES = {
  Critical: { bg: 'rgba(239,68,68,0.15)', text: '#fca5a5', border: 'rgba(239,68,68,0.3)' },
  High: { bg: 'rgba(244,63,94,0.15)', text: '#fda4af', border: 'rgba(244,63,94,0.3)' },
  Medium: { bg: 'rgba(245,158,11,0.15)', text: '#fcd34d', border: 'rgba(245,158,11,0.3)' },
  Low: { bg: 'rgba(16,185,129,0.15)', text: '#6ee7b7', border: 'rgba(16,185,129,0.3)' },
  Info: { bg: 'rgba(59,130,246,0.15)', text: '#93c5fd', border: 'rgba(59,130,246,0.3)' },
};

function SeverityBadge({ severity }) {
  const style = SEV_STYLES[severity] || { bg: 'rgba(148,163,184,0.1)', text: '#94a3b8', border: 'rgba(148,163,184,0.2)' };
  return (
    <span
      className="rounded-full border px-2.5 py-0.5 text-xs font-bold uppercase"
      style={{ backgroundColor: style.bg, color: style.text, borderColor: style.border }}
    >
      {severity || 'Unknown'}
    </span>
  );
}

function StatusBadge({ status }) {
  const statusMap = {
    New: { bg: 'rgba(59,130,246,0.15)', text: '#93c5fd', border: 'rgba(59,130,246,0.3)' },
    'In Progress': { bg: 'rgba(245,158,11,0.15)', text: '#fcd34d', border: 'rgba(245,158,11,0.3)' },
    'Under Investigation': { bg: 'rgba(139,92,246,0.15)', text: '#c4b5fd', border: 'rgba(139,92,246,0.3)' },
    Resolved: { bg: 'rgba(16,185,129,0.15)', text: '#6ee7b7', border: 'rgba(16,185,129,0.3)' },
    Closed: { bg: 'rgba(100,116,139,0.15)', text: '#94a3b8', border: 'rgba(100,116,139,0.3)' },
  };
  const style = statusMap[status] || { bg: 'rgba(148,163,184,0.1)', text: '#94a3b8', border: 'rgba(148,163,184,0.2)' };
  return (
    <span
      className="rounded-full border px-2.5 py-0.5 text-xs font-bold uppercase"
      style={{ backgroundColor: style.bg, color: style.text, borderColor: style.border }}
    >
      {status || 'Unknown'}
    </span>
  );
}

function StatCard({ label, value, icon, accent }) {
  return (
    <div
      className="rounded-2xl border p-4 flex flex-col gap-1 shadow-sm"
      style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}
    >
      <div className="flex items-center gap-2">
        <span className="text-xl">{icon}</span>
        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{label}</span>
      </div>
      <p className="text-2xl font-bold mt-1" style={{ color: accent || 'var(--text-heading)' }}>
        {value ?? '—'}
      </p>
    </div>
  );
}

const chartDefaults = (isDark) => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      labels: { color: isDark ? '#cbd5e1' : '#0f172a', font: { size: 11, weight: '600' } },
    },
  },
  scales: {
    x: {
      ticks: { color: isDark ? '#94a3b8' : '#1e293b', font: { weight: '600' }, maxRotation: 45 },
      grid: { color: isDark ? '#1e293b' : '#cbd5e1' },
    },
    y: {
      ticks: { color: isDark ? '#94a3b8' : '#1e293b', font: { weight: '600' } },
      grid: { color: isDark ? '#1e293b' : '#cbd5e1' },
    },
  },
});

export default function Reports() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'Security Administrator';
  const isDark = document.documentElement.getAttribute('data-theme') !== 'light';

  // Admin tabs: executive-summary, threat-intelligence, incidents, security-trends
  // Analyst tabs: threat-intelligence, incidents only
  const allTabs = isAdmin
    ? [
        { id: 'executive', label: '📊 Executive Summary', adminOnly: true },
        { id: 'threat', label: '🧠 Threat Intelligence', adminOnly: false },
        { id: 'incidents', label: '🛡️ Incident Report', adminOnly: false },
        { id: 'trends', label: '📈 Security Trends', adminOnly: true },
      ]
    : [
        { id: 'threat', label: '🧠 Threat Intelligence', adminOnly: false },
        { id: 'incidents', label: '🛡️ Incident Report', adminOnly: false },
      ];

  const [activeTab, setActiveTab] = useState(allTabs[0].id);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Data states
  const [executiveSummary, setExecutiveSummary] = useState(null);
  const [threatIntel, setThreatIntel] = useState(null);
  const [incidentReport, setIncidentReport] = useState(null);
  const [securityTrends, setSecurityTrends] = useState(null);

  const loadReport = useCallback(async (tab) => {
    setLoading(true);
    setError('');
    try {
      if (tab === 'executive' && isAdmin) {
        const res = await api.get('/reports/executive-summary');
        setExecutiveSummary(res.data);
      } else if (tab === 'threat') {
        const res = await api.get('/reports/threat-intelligence?limit=200');
        setThreatIntel(res.data);
      } else if (tab === 'incidents') {
        const res = await api.get('/reports/incidents?limit=200');
        setIncidentReport(res.data);
      } else if (tab === 'trends' && isAdmin) {
        const res = await api.get('/reports/security-trends?days=30');
        setSecurityTrends(res.data);
      }
    } catch (err) {
      const detail = err?.response?.data?.detail;
      setError(typeof detail === 'string' ? detail : 'Unable to load report data.');
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    loadReport(activeTab);
  }, [activeTab, loadReport]);

  const downloadBackendBlob = async (endpoint, defaultFilename) => {
    try {
      const response = await api.get(endpoint, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', defaultFilename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert(`Error downloading ${defaultFilename}. Please try again.`);
    }
  };

  const sectionStyle = {
    backgroundColor: 'var(--bg-secondary)',
    borderColor: 'var(--border-primary)',
  };

  const tableHeaderStyle = {
    backgroundColor: 'var(--bg-card)',
    color: 'var(--text-secondary)',
  };

  const tableCellStyle = { color: 'var(--text-primary)' };

  // ─── Chart data builders ─────────────────────────────────────────────────
  const buildAttackDistChart = (data) => ({
    labels: data.map((d) => d.attack_type),
    datasets: [
      {
        label: 'Count',
        data: data.map((d) => d.count),
        backgroundColor: [
          '#ef4444aa', '#f97316aa', '#eab308aa', '#22c55eaa',
          '#3b82f6aa', '#8b5cf6aa', '#ec4899aa', '#14b8a6aa',
        ],
        borderRadius: 6,
      },
    ],
  });

  const buildTrendsChart = (data) => {
    const labels = data.map((d) => d.date);
    return {
      labels,
      datasets: [
        {
          label: 'Daily Attack Count',
          data: data.map((d) => d.count),
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59,130,246,0.15)',
          fill: true,
          tension: 0.4,
          pointRadius: 3,
        },
      ],
    };
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <HeaderNav
          title="Security Reports"
          subtitle={
            isAdmin
              ? 'Organization-wide security operational reports — executive summary, threat intelligence, incidents, and trends.'
              : 'Your assigned incident reports and related threat intelligence data.'
          }
          onRefresh={() => loadReport(activeTab)}
        />

        {/* Download buttons — admin only */}
        {isAdmin && (
          <section className="mb-6 rounded-3xl border p-5 shadow-xl" style={sectionStyle}>
            <h2 className="text-base font-bold mb-3" style={{ color: 'var(--text-heading)' }}>
              📥 Export Reports
            </h2>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => downloadBackendBlob('/reports/pdf', 'NetShield_Threat_Report.pdf')}
                className="flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-rose-600/20 transition hover:bg-rose-500"
              >
                📄 Executive Report (PDF)
              </button>
              <button
                type="button"
                onClick={() => downloadBackendBlob('/reports/csv', 'NetShield_Threat_Report.csv')}
                className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-500"
              >
                📊 Threat Intelligence (CSV)
              </button>
            </div>
          </section>
        )}

        {/* Tabs */}
        <section className="rounded-3xl border shadow-xl overflow-hidden" style={sectionStyle}>
          {/* Tab bar */}
          <div
            className="flex flex-wrap gap-2 p-4 border-b"
            style={{ borderColor: 'var(--border-primary)', backgroundColor: 'var(--bg-card)' }}
          >
            {allTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className="rounded-xl px-4 py-2 text-xs font-semibold transition"
                style={
                  activeTab === tab.id
                    ? { backgroundColor: 'var(--accent-blue)', color: '#fff', boxShadow: '0 4px 12px rgba(59,130,246,0.3)' }
                    : { border: '1px solid var(--border-primary)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-label)' }
                }
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-5">
            {error && (
              <div className="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
                ⚠️ {error}
              </div>
            )}

            {loading ? (
              <div className="flex items-center justify-center py-16">
                <LoadingSpinner label="Loading report data…" className="justify-center" />
              </div>
            ) : (
              <>
                {/* ── EXECUTIVE SUMMARY ── */}
                {activeTab === 'executive' && executiveSummary && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-bold mb-1" style={{ color: 'var(--text-heading)' }}>Executive Summary</h3>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        Generated: {executiveSummary.generated_at?.slice(0, 19).replace('T', ' ')} UTC
                      </p>
                    </div>

                    {/* KPI Grid */}
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      <StatCard icon="🚨" label="Total Alerts" value={executiveSummary.alerts?.total_alerts} />
                      <StatCard icon="⚔️" label="Attacks Detected" value={executiveSummary.alerts?.total_threats_detected} accent="#ef4444" />
                      <StatCard icon="🔴" label="Critical / High" value={executiveSummary.alerts?.critical_high_count} accent="#f97316" />
                      <StatCard icon="📊" label="Avg Risk Score" value={`${executiveSummary.alerts?.avg_risk_score ?? 0}/100`} accent="#f59e0b" />
                      <StatCard icon="🎯" label="Top Attack" value={executiveSummary.alerts?.top_attack_vector} />
                      <StatCard icon="🛡️" label="Total Incidents" value={executiveSummary.incidents?.total_incidents} />
                      <StatCard icon="🔓" label="Open Incidents" value={executiveSummary.incidents?.open_incidents} accent="#ef4444" />
                      <StatCard icon="✅" label="Resolved" value={executiveSummary.incidents?.resolved_incidents} accent="#10b981" />
                    </div>

                    {/* Attack distribution chart */}
                    {executiveSummary.attack_distribution?.length > 0 && (
                      <div
                        className="rounded-2xl border p-4"
                        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}
                      >
                        <h4 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-heading)' }}>
                          Attack Type Distribution
                        </h4>
                        <div style={{ height: 240 }}>
                          <Bar data={buildAttackDistChart(executiveSummary.attack_distribution)} options={chartDefaults(isDark)} />
                        </div>
                      </div>
                    )}

                    {/* Severity Distribution */}
                    {executiveSummary.severity_distribution?.length > 0 && (
                      <div className="rounded-2xl border overflow-hidden" style={{ borderColor: 'var(--border-primary)' }}>
                        <table className="w-full text-sm">
                          <thead>
                            <tr style={tableHeaderStyle}>
                              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Severity</th>
                              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Count</th>
                              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Share</th>
                            </tr>
                          </thead>
                          <tbody>
                            {executiveSummary.severity_distribution.map((row, i) => {
                              const total = executiveSummary.severity_distribution.reduce((s, r) => s + r.count, 0);
                              const pct = total ? ((row.count / total) * 100).toFixed(1) : '0.0';
                              return (
                                <tr key={i} className="border-t" style={{ borderColor: 'var(--border-primary)' }}>
                                  <td className="px-4 py-2.5" style={tableCellStyle}>
                                    <SeverityBadge severity={row.severity} />
                                  </td>
                                  <td className="px-4 py-2.5 font-semibold" style={tableCellStyle}>{row.count}</td>
                                  <td className="px-4 py-2.5">
                                    <div className="flex items-center gap-2">
                                      <div className="flex-1 rounded-full h-1.5" style={{ backgroundColor: 'var(--border-primary)' }}>
                                        <div
                                          className="h-1.5 rounded-full"
                                          style={{ width: `${pct}%`, backgroundColor: 'var(--accent-blue)' }}
                                        />
                                      </div>
                                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{pct}%</span>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* Incident status summary */}
                    {executiveSummary.incident_status_summary?.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-heading)' }}>Incident Status Summary</h4>
                        <div className="grid gap-3 sm:grid-cols-3">
                          {executiveSummary.incident_status_summary.map((s, i) => (
                            <div key={i} className="rounded-xl border p-3" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}>
                              <StatusBadge status={s.status} />
                              <p className="text-xl font-bold mt-2" style={{ color: 'var(--text-heading)' }}>{s.count}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Recent Threat Activity */}
                    {executiveSummary.recent_threat_activity?.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-heading)' }}>Recent Threat Activity</h4>
                        <div className="rounded-2xl border overflow-x-auto" style={{ borderColor: 'var(--border-primary)' }}>
                          <table className="w-full text-xs">
                            <thead>
                              <tr style={tableHeaderStyle}>
                                {['Alert ID', 'Attack Type', 'Severity', 'Risk Score', 'Source IP', 'Timestamp'].map((h) => (
                                  <th key={h} className="px-4 py-3 text-left font-semibold uppercase tracking-wider whitespace-nowrap">{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {executiveSummary.recent_threat_activity.map((row, i) => (
                                <tr key={i} className="border-t" style={{ borderColor: 'var(--border-primary)' }}>
                                  <td className="px-4 py-2.5 font-mono" style={tableCellStyle}>{row.alert_id}</td>
                                  <td className="px-4 py-2.5 font-semibold" style={tableCellStyle}>{row.attack_type}</td>
                                  <td className="px-4 py-2.5"><SeverityBadge severity={row.severity} /></td>
                                  <td className="px-4 py-2.5" style={tableCellStyle}>{row.risk_score}</td>
                                  <td className="px-4 py-2.5 font-mono text-xs" style={tableCellStyle}>{row.source_ip}</td>
                                  <td className="px-4 py-2.5 text-xs whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>
                                    {row.timestamp?.slice(0, 19).replace('T', ' ')}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ── THREAT INTELLIGENCE ── */}
                {activeTab === 'threat' && threatIntel && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-bold" style={{ color: 'var(--text-heading)' }}>Threat Intelligence Report</h3>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                          {threatIntel.total_records} record{threatIntel.total_records !== 1 ? 's' : ''} —
                          Generated: {threatIntel.generated_at?.slice(0, 19).replace('T', ' ')} UTC
                        </p>
                        {threatIntel.note && (
                          <p className="text-xs mt-1 text-amber-400">ℹ️ {threatIntel.note}</p>
                        )}
                      </div>
                    </div>

                    {threatIntel.alerts?.length === 0 ? (
                      <div
                        className="rounded-2xl border py-12 text-center"
                        style={{ borderColor: 'var(--border-primary)' }}
                      >
                        <p className="text-4xl mb-3">🔍</p>
                        <p className="font-semibold" style={{ color: 'var(--text-secondary)' }}>No threat data found</p>
                        <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                          {isAdmin ? 'No alerts in the system yet.' : 'No alerts related to your assigned incidents.'}
                        </p>
                      </div>
                    ) : (
                      <div className="rounded-2xl border overflow-x-auto" style={{ borderColor: 'var(--border-primary)' }}>
                        <table className="w-full text-xs">
                          <thead>
                            <tr style={tableHeaderStyle}>
                              {['Alert ID', 'Attack Type', 'Severity', 'Risk Score', 'Confidence', 'Source IP', 'Protocol', 'Status', 'Timestamp'].map((h) => (
                                <th key={h} className="px-4 py-3 text-left font-semibold uppercase tracking-wider whitespace-nowrap">{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {threatIntel.alerts.map((row, i) => (
                              <tr
                                key={i}
                                className="border-t"
                                style={{ borderColor: 'var(--border-primary)' }}
                              >
                                <td className="px-4 py-2.5 font-mono" style={tableCellStyle}>{row.alert_id}</td>
                                <td className="px-4 py-2.5 font-semibold whitespace-nowrap" style={tableCellStyle}>{row.attack_type}</td>
                                <td className="px-4 py-2.5"><SeverityBadge severity={row.severity} /></td>
                                <td className="px-4 py-2.5" style={tableCellStyle}>{row.risk_score}</td>
                                <td className="px-4 py-2.5" style={tableCellStyle}>
                                  {row.confidence != null
                                    ? `${(row.confidence <= 1 ? row.confidence * 100 : row.confidence).toFixed(1)}%`
                                    : '—'}
                                </td>
                                <td className="px-4 py-2.5 font-mono" style={tableCellStyle}>{row.source_ip}</td>
                                <td className="px-4 py-2.5" style={tableCellStyle}>{row.protocol || '—'}</td>
                                <td className="px-4 py-2.5" style={tableCellStyle}>{row.status || 'Active'}</td>
                                <td className="px-4 py-2.5 whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>
                                  {row.timestamp?.slice(0, 19).replace('T', ' ')}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {/* ── INCIDENT REPORT ── */}
                {activeTab === 'incidents' && incidentReport && (
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-bold" style={{ color: 'var(--text-heading)' }}>Incident Report</h3>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                        {incidentReport.total_records} incident{incidentReport.total_records !== 1 ? 's' : ''} —
                        Generated: {incidentReport.generated_at?.slice(0, 19).replace('T', ' ')} UTC
                        {!isAdmin && <span className="ml-2 text-blue-400">· Showing your assigned incidents only</span>}
                      </p>
                    </div>

                    {incidentReport.incidents?.length === 0 ? (
                      <div
                        className="rounded-2xl border py-12 text-center"
                        style={{ borderColor: 'var(--border-primary)' }}
                      >
                        <p className="text-4xl mb-3">🛡️</p>
                        <p className="font-semibold" style={{ color: 'var(--text-secondary)' }}>No incidents found</p>
                        <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                          {isAdmin ? 'No incidents in the system.' : 'No incidents are currently assigned to you.'}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {incidentReport.incidents.map((inc, i) => (
                          <div
                            key={i}
                            className="rounded-2xl border p-4"
                            style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}
                          >
                            <div className="flex flex-wrap items-start gap-3 justify-between mb-3">
                              <div>
                                <p className="font-semibold text-sm" style={{ color: 'var(--text-heading)' }}>
                                  {inc.title || `Incident #${inc.incident_id}`}
                                </p>
                                <p className="text-xs mt-0.5 font-mono" style={{ color: 'var(--text-muted)' }}>
                                  ID: {inc.incident_id}
                                </p>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                <StatusBadge status={inc.status} />
                                {inc.priority && (
                                  <SeverityBadge severity={inc.priority} />
                                )}
                              </div>
                            </div>

                            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 text-xs mb-3">
                              <div>
                                <span style={{ color: 'var(--text-muted)' }}>Assigned Analyst:</span>{' '}
                                <span className="font-semibold" style={{ color: 'var(--text-label)' }}>
                                  {inc.assigned_analyst_name || inc.assigned_analyst || 'Unassigned'}
                                </span>
                              </div>
                              {inc.alert_id && (
                                <div>
                                  <span style={{ color: 'var(--text-muted)' }}>Related Alert:</span>{' '}
                                  <span className="font-mono" style={{ color: 'var(--text-label)' }}>{inc.alert_id}</span>
                                </div>
                              )}
                              <div>
                                <span style={{ color: 'var(--text-muted)' }}>Created:</span>{' '}
                                <span style={{ color: 'var(--text-label)' }}>
                                  {inc.created_at?.slice(0, 19).replace('T', ' ')}
                                </span>
                              </div>
                              {inc.resolved_at && (
                                <div>
                                  <span style={{ color: 'var(--text-muted)' }}>Resolved:</span>{' '}
                                  <span className="text-emerald-400">
                                    {inc.resolved_at?.slice(0, 19).replace('T', ' ')}
                                  </span>
                                </div>
                              )}
                            </div>

                            {inc.notes?.length > 0 && (
                              <div
                                className="rounded-xl border p-3 mt-2"
                                style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-primary)' }}
                              >
                                <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>
                                  Investigation Notes ({inc.notes.length})
                                </p>
                                {inc.notes.slice(0, 3).map((note, ni) => (
                                  <div key={ni} className="text-xs mb-1.5">
                                    <span className="font-semibold" style={{ color: 'var(--text-label)' }}>
                                      {note.author}:
                                    </span>{' '}
                                    <span style={{ color: 'var(--text-secondary)' }}>{note.text}</span>
                                    <span className="ml-2" style={{ color: 'var(--text-muted)' }}>
                                      ({note.timestamp?.slice(0, 16).replace('T', ' ')})
                                    </span>
                                  </div>
                                ))}
                                {inc.notes.length > 3 && (
                                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                    +{inc.notes.length - 3} more notes
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* ── SECURITY TRENDS ── */}
                {activeTab === 'trends' && securityTrends && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-bold" style={{ color: 'var(--text-heading)' }}>Security Trends</h3>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                        Last {securityTrends.period_days} days —
                        Generated: {securityTrends.generated_at?.slice(0, 19).replace('T', ' ')} UTC
                      </p>
                    </div>

                    {/* Daily trend chart */}
                    {securityTrends.daily_attack_counts?.length > 0 ? (
                      <div
                        className="rounded-2xl border p-4"
                        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}
                      >
                        <h4 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-heading)' }}>
                          Daily Attack Count (last {securityTrends.period_days} days)
                        </h4>
                        <div style={{ height: 260 }}>
                          <Line data={buildTrendsChart(securityTrends.daily_attack_counts)} options={chartDefaults(isDark)} />
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-2xl border py-10 text-center" style={{ borderColor: 'var(--border-primary)' }}>
                        <p className="text-4xl mb-2">📈</p>
                        <p style={{ color: 'var(--text-secondary)' }}>No trend data available for the selected period</p>
                      </div>
                    )}

                    {/* Weekly attack counts table */}
                    {securityTrends.weekly_attack_counts?.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-heading)' }}>
                          Weekly Attack Summary
                        </h4>
                        <div className="rounded-2xl border overflow-hidden" style={{ borderColor: 'var(--border-primary)' }}>
                          <table className="w-full text-sm">
                            <thead>
                              <tr style={tableHeaderStyle}>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Week</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Attack Count</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Trend Bar</th>
                              </tr>
                            </thead>
                            <tbody>
                              {securityTrends.weekly_attack_counts.map((row, i) => {
                                const maxCount = Math.max(...securityTrends.weekly_attack_counts.map((r) => r.count), 1);
                                const pct = ((row.count / maxCount) * 100).toFixed(0);
                                return (
                                  <tr key={i} className="border-t" style={{ borderColor: 'var(--border-primary)' }}>
                                    <td className="px-4 py-2.5 font-mono text-xs" style={tableCellStyle}>{row.week}</td>
                                    <td className="px-4 py-2.5 font-semibold" style={tableCellStyle}>{row.count}</td>
                                    <td className="px-4 py-2.5">
                                      <div className="flex items-center gap-2">
                                        <div className="flex-1 rounded-full h-2" style={{ backgroundColor: 'var(--border-primary)' }}>
                                          <div
                                            className="h-2 rounded-full transition-all"
                                            style={{ width: `${pct}%`, backgroundColor: 'var(--accent-blue)' }}
                                          />
                                        </div>
                                        <span className="text-xs w-8 text-right" style={{ color: 'var(--text-muted)' }}>{pct}%</span>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
