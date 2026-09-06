import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { useNotifications } from '../context/NotificationContext';

// ── Constants ──────────────────────────────────────────────────────────────────
const PAGE_SIZE = 15;

const SEVERITY_STYLES = {
  Critical: 'bg-red-500/20 text-red-300 border border-red-500/40 shadow-[0_0_10px_rgba(239,68,68,0.2)] font-bold',
  High: 'bg-rose-500/15 text-rose-300 border border-rose-500/30 shadow-[0_0_8px_rgba(244,63,94,0.15)] font-semibold',
  Medium: 'bg-amber-500/15 text-amber-300 border border-amber-500/30 font-semibold',
  Low: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-semibold',
  Safe: 'bg-slate-800 text-slate-400 border border-slate-700',
};

const STATUS_STYLES = {
  Open: 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse font-semibold',
  Acknowledged: 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold',
  Investigating: 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold',
  Resolved: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-semibold',
};

const SORT_FIELDS = [
  { key: 'timestamp', label: 'Timestamp' },
  { key: 'source_ip', label: 'Source IP' },
  { key: 'destination_ip', label: 'Destination IP' },
  { key: 'severity', label: 'Severity' },
  { key: 'protocol', label: 'Protocol' },
  { key: 'attack_type', label: 'Attack Type' },
];

const THREAT_ORDER = { Critical: 0, High: 1, Medium: 2, Low: 3, Safe: 4 };

// ── Helpers ────────────────────────────────────────────────────────────────────
function resolveStatus(row) {
  if (row.status) return row.status;
  const level = String(row.threat_level || row.severity || '').toLowerCase();
  if (level === 'critical' || level === 'high') return 'Open';
  if (level === 'medium') return 'Acknowledged';
  return 'Resolved';
}

function escapeCSV(value) {
  if (value == null) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function downloadCSV(rows) {
  const headers = [
    'Timestamp', 'Source IP', 'Destination IP', 'Source Port', 'Destination Port',
    'Protocol', 'Packet Size', 'Attack Type', 'Severity', 'Status',
  ];
  const lines = [
    headers.join(','),
    ...rows.map((r) =>
      [
        r.timestamp, r.source_ip, r.destination_ip,
        r.source_port, r.destination_port, r.protocol,
        r.packet_size, r.attack_type || r.traffic_label, r.severity || r.threat_level, resolveStatus(r),
      ].map(escapeCSV).join(',')
    ),
  ];
  const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `netshield_alerts_${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function downloadPDF(rows) {
  const escape = (v) => String(v ?? '—').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const rowsHTML = rows.map((r) => `
    <tr>
      <td>${escape(r.timestamp)}</td>
      <td>${escape(r.source_ip)}</td>
      <td>${escape(r.destination_ip)}</td>
      <td>${escape(r.protocol)}</td>
      <td>${escape(r.attack_type || r.traffic_label)}</td>
      <td>${escape(r.severity || r.threat_level)}</td>
      <td>${escape(resolveStatus(r))}</td>
    </tr>`).join('');

  const html = `<!DOCTYPE html>
<html><head><title>NetShield Alerts Export</title>
<style>
  body { font-family: Arial, sans-serif; font-size: 11px; }
  h1 { font-size: 16px; margin-bottom: 4px; }
  p { color: #666; margin-bottom: 12px; font-size: 10px; }
  table { width: 100%; border-collapse: collapse; }
  th { background: #1e293b; color: #94a3b8; text-align: left; padding: 6px 8px; font-size: 10px; text-transform: uppercase; }
  td { padding: 5px 8px; border-bottom: 1px solid #e2e8f0; }
  tr:nth-child(even) td { background: #f8fafc; }
</style></head>
<body>
<h1>NetShield AI — Security Alerts Report</h1>
<p>Generated: ${new Date().toLocaleString()} | Total: ${rows.length} records</p>
<table>
  <thead><tr>
    <th>Timestamp</th><th>Source IP</th><th>Destination IP</th>
    <th>Protocol</th><th>Attack Type</th><th>Severity</th><th>Status</th>
  </tr></thead>
  <tbody>${rowsHTML}</tbody>
</table>
</body></html>`;

  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, '_blank');
  if (win) {
    win.onload = () => {
      win.print();
      URL.revokeObjectURL(url);
    };
  }
}

// ── Detail Modal ───────────────────────────────────────────────────────────────
function AlertDetailModal({ row, onClose, onAcknowledge, onResolve, onPromote }) {
  if (!row) return null;

  const status = resolveStatus(row);
  const fields = [
    ['Alert ID', row.alert_id || row.id],
    ['Timestamp', row.timestamp],
    ['Source IP', row.source_ip],
    ['Destination IP', row.destination_ip],
    ['Source Port', row.source_port],
    ['Destination Port', row.destination_port],
    ['Protocol', row.protocol],
    ['Packet Size', row.packet_size != null ? `${row.packet_size} bytes` : null],
    ['Attack Type', row.attack_type || row.traffic_label],
    ['Severity', row.severity || row.threat_level],
    ['Status', status],
    ['Confidence', row.confidence != null ? `${(row.confidence <= 1.0 ? row.confidence * 100 : row.confidence).toFixed(1)}%` : null],
    ['Risk Score', row.risk_score != null ? `${row.risk_score} / 100` : null],
    ['Source', row.source || 'Live Network'],
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-blue-400 font-bold mb-1">Alert Detail</p>
            <h2 className="text-lg font-bold text-white">Incident Inspection</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-400 hover:text-white transition"
          >
            ✕ Close
          </button>
        </div>

        <div className="space-y-2">
          {fields.map(([label, value]) => (
            <div key={label} className="flex justify-between items-start border-b border-slate-800 pb-2 last:border-0">
              <span className="text-xs text-slate-400 font-medium">{label}</span>
              <span className="text-xs text-right font-mono text-slate-200 max-w-[60%] break-all">
                {value != null && value !== '' ? String(value) : '—'}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-4 flex flex-col gap-4 border-t border-slate-800 pt-4">
          <div className="flex gap-2 flex-wrap">
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${SEVERITY_STYLES[row.severity || row.threat_level] || 'bg-slate-800 text-slate-300'}`}>
              {row.severity || row.threat_level || 'Unknown'} Severity
            </span>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_STYLES[status] || 'bg-slate-800 text-slate-300'}`}>
              {status}
            </span>
          </div>

          <div className="flex gap-2">
            {status === 'Open' && (
              <button
                type="button"
                onClick={() => onAcknowledge(row.alert_id || row.id)}
                className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-500 transition shadow-[0_0_10px_rgba(217,119,6,0.3)]"
              >
                Acknowledge
              </button>
            )}
            {(status === 'Open' || status === 'Acknowledged' || status === 'Investigating') && (
              <button
                type="button"
                onClick={() => onResolve(row.alert_id || row.id)}
                className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 transition shadow-[0_0_10px_rgba(5,150,105,0.3)]"
              >
                Resolve
              </button>
            )}
            <button
              type="button"
              onClick={() => onPromote(row.alert_id || row.id)}
              className="rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-purple-500 transition shadow-[0_0_10px_rgba(147,51,234,0.3)]"
            >
              Promote to Incident
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function Alerts() {
  const [rows, setRows] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [datasetStatus, setDatasetStatus] = useState('loading');
  const pollRef = useRef(null);

  // Filters & search
  const [search, setSearch] = useState('');
  const [threatFilter, setThreatFilter] = useState('All');
  const [protocolFilter, setProtocolFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // Sorting
  const [sortKey, setSortKey] = useState('timestamp');
  const [sortDir, setSortDir] = useState('desc');

  // Pagination (client-side)
  const [page, setPage] = useState(1);

  // Detail modal
  const [selectedRow, setSelectedRow] = useState(null);

  const { realtimeAlerts } = useNotifications();

  // Listen to WebSocket real-time alerts and auto-refresh table
  useEffect(() => {
    if (realtimeAlerts && realtimeAlerts.length > 0) {
      const newest = realtimeAlerts[0];
      setRows((prevRows) => {
        if (prevRows.some((r) => (r.alert_id && r.alert_id === newest.alert_id) || (r.id && r.id === newest.id))) {
          return prevRows;
        }
        const formatted = {
          id: newest.id,
          alert_id: newest.alert_id || newest.id,
          timestamp: newest.timestamp,
          created_at: newest.created_at || newest.timestamp,
          source_ip: newest.source_ip,
          destination_ip: newest.destination_ip,
          source_port: newest.source_port,
          destination_port: newest.destination_port,
          protocol: newest.protocol || 'TCP',
          attack_type: newest.attack_type || newest.traffic_label || 'Attack',
          traffic_label: newest.attack_type || newest.traffic_label || 'Attack',
          severity: newest.severity || newest.threat_level || 'Medium',
          threat_level: newest.severity || newest.threat_level || 'Medium',
          confidence: newest.confidence,
          risk_score: newest.risk_score,
          status: newest.status || 'Open',
          assigned_to: newest.assigned_to,
          source: newest.source || 'Live Network',
          detection_details: newest.detection_details || {},
        };
        return [formatted, ...prevRows];
      });
      setTotalRecords((prev) => prev + 1);
    }
  }, [realtimeAlerts]);

  const handleAcknowledge = async (id) => {
    try {
      await api.patch(`/alerts/${id}/acknowledge`);
      loadAlerts();
      setSelectedRow(null);
    } catch (e) {
      alert('Failed to acknowledge alert.');
    }
  };

  const handleResolve = async (id) => {
    try {
      await api.patch(`/alerts/${id}/resolve`);
      loadAlerts();
      setSelectedRow(null);
    } catch (e) {
      alert('Failed to resolve alert.');
    }
  };

  const handlePromote = async (id) => {
    try {
      await api.post(`/incidents/from-alert/${id}`);
      alert('Successfully promoted to Incident!');
      loadAlerts();
      setSelectedRow(null);
    } catch (e) {
      alert('Failed to promote to incident (it may already exist).');
    }
  };

  // ── Data Loading ─────────────────────────────────────────────────────────────
  const loadAlerts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      let data = [];
      let total = 0;

      // 1. Primary: Fetch alerts from MongoDB /alerts API endpoint
      try {
        const resAlerts = await api.get('/alerts', { params: { limit: 100 } });
        if (resAlerts.data) {
          data = resAlerts.data.map((a) => ({
            ...a,
            attack_type: a.attack_type || a.traffic_label || 'Attack',
            traffic_label: a.attack_type || a.traffic_label || 'Attack',
            severity: a.severity || a.threat_level || 'Medium',
            threat_level: a.severity || a.threat_level || 'Medium',
            status: a.status || resolveStatus(a),
          }));
          total = data.length;
        }
      } catch (e) {
        console.warn('Alerts API fetch note:', e);
      }
      setDatasetStatus('ready');

      setRows(data);
      setTotalRecords(total);
      setPage(1);
      return 'ready';
    } catch (err) {
      if (err?.response?.status === 503) {
        setDatasetStatus('loading');
        return 'loading';
      }
      setError(err?.response?.data?.detail || 'Unable to load alerts. Check backend connectivity.');
      return 'failed';
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    const startPolling = async () => {
      const status = await loadAlerts();
      if (!mounted) return;
      if (status !== 'loading') return;

      if (pollRef.current) return;
      pollRef.current = setInterval(async () => {
        try {
          const res = await api.get('/health');
          const ds = res.data.dataset_status || res.data.dataset || 'loading';
          if (ds !== 'loading' && pollRef.current) {
            clearInterval(pollRef.current);
            pollRef.current = null;
            await loadAlerts();
          }
        } catch (e) {
          // ignore
        }
      }, 3000);
    };

    startPolling();
    return () => {
      mounted = false;
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [loadAlerts]);

  // ── Protocol Options ──────────────────────────────────────────────────────────
  const protocolOptions = useMemo(() => {
    const defaultProtos = ['All', 'TCP', 'UDP', 'ICMP'];
    const unique = [...new Set(rows.map((r) => r.protocol).filter(Boolean))];
    return [...new Set([...defaultProtos, ...unique])].sort();
  }, [rows]);

  // ── Filtered + Sorted + Paginated ─────────────────────────────────────────────
  const processedRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    let result = rows.filter((row) => {
      const atk = String(row.attack_type || row.traffic_label || '');
      const sev = String(row.severity || row.threat_level || '');
      const st = resolveStatus(row);

      const matchSearch = !q || [
        row.source_ip, row.destination_ip, row.protocol, atk, sev, st, row.alert_id, row.id,
      ].some((v) => String(v ?? '').toLowerCase().includes(q));

      const matchThreat = threatFilter === 'All' || sev.toLowerCase() === threatFilter.toLowerCase();
      const matchProtocol = protocolFilter === 'All' || String(row.protocol || '').toLowerCase() === protocolFilter.toLowerCase();
      const matchStatus = statusFilter === 'All' || st.toLowerCase() === statusFilter.toLowerCase();

      return matchSearch && matchThreat && matchProtocol && matchStatus;
    });

    // Sort
    result = [...result].sort((a, b) => {
      const aSev = a.severity || a.threat_level;
      const bSev = b.severity || b.threat_level;

      if (sortKey === 'severity' || sortKey === 'threat_level') {
        const aVal = THREAT_ORDER[aSev] ?? 99;
        const bVal = THREAT_ORDER[bSev] ?? 99;
        return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
      }

      if (sortKey === 'timestamp' || sortKey === 'created_at') {
        const aTime = new Date(a.created_at || a.timestamp || 0).getTime();
        const bTime = new Date(b.created_at || b.timestamp || 0).getTime();
        if (!isNaN(aTime) && !isNaN(bTime) && aTime !== bTime) {
          return sortDir === 'asc' ? aTime - bTime : bTime - aTime;
        }
      }

      let aVal = a[sortKey] ?? '';
      let bVal = b[sortKey] ?? '';
      if (sortKey === 'attack_type') aVal = a.attack_type || a.traffic_label || '';
      if (sortKey === 'attack_type') bVal = b.attack_type || b.traffic_label || '';

      aVal = String(aVal).toLowerCase();
      bVal = String(bVal).toLowerCase();
      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [rows, search, threatFilter, protocolFilter, statusFilter, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(processedRows.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageRows = processedRows.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const handleSortChange = (key) => {
    if (key === sortKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
    setPage(1);
  };

  const handleFilterChange = () => setPage(1);

  const SortIndicator = ({ col }) => {
    if (sortKey !== col) return <span className="ml-1 text-slate-600">⇅</span>;
    return <span className="ml-1 text-blue-400">{sortDir === 'asc' ? '↑' : '↓'}</span>;
  };

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      <AlertDetailModal 
        row={selectedRow} 
        onClose={() => setSelectedRow(null)} 
        onAcknowledge={handleAcknowledge}
        onResolve={handleResolve}
        onPromote={handlePromote}
      />

      <div className="mx-auto flex min-h-screen max-w-screen-2xl flex-col px-4 py-6 sm:px-6 lg:px-8 space-y-5">

        {/* Header */}
        <header className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5 shadow-2xl backdrop-blur">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-ping" />
                <p className="text-xs uppercase tracking-[0.35em] text-blue-400 font-bold">SOC Alert Console</p>
              </div>
              <h1 className="text-2xl font-bold text-white">Security Alerts Feed</h1>
              <p className="mt-1 text-sm text-slate-400">
                Live threat alert monitoring from the active network traffic inspection queue.
                {totalRecords > 0 && (
                  <span className="ml-2 text-slate-300 font-semibold">{totalRecords.toLocaleString()} total records.</span>
                )}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => downloadCSV(processedRows)}
                disabled={processedRows.length === 0}
                className="rounded-lg border border-emerald-700/50 bg-emerald-900/20 px-3 py-2 text-sm font-semibold text-emerald-300 transition hover:bg-emerald-900/40 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                ↓ Export CSV
              </button>
              <button
                type="button"
                onClick={() => downloadPDF(processedRows)}
                disabled={processedRows.length === 0}
                className="rounded-lg border border-blue-700/50 bg-blue-900/20 px-3 py-2 text-sm font-semibold text-blue-300 transition hover:bg-blue-900/40 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                ↓ Export PDF
              </button>
              <button
                type="button"
                onClick={loadAlerts}
                className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-500 shadow-[0_0_12px_rgba(37,99,235,0.3)]"
              >
                ↺ Refresh
              </button>
              <Link
                to="/dashboard"
                className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300 transition hover:border-slate-600 hover:text-white"
              >
                ← Dashboard
              </Link>
            </div>
          </div>
        </header>

        {/* Filters & Search */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {/* Search */}
            <div className="lg:col-span-1 flex gap-2">
              <input
                value={search}
                onChange={(e) => { setSearch(e.target.value); handleFilterChange(); }}
                onKeyDown={(e) => e.key === 'Enter' && handleFilterChange()}
                placeholder="Search IP, protocol, attack type…"
                className="flex-1 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-blue-500 transition"
              />
            </div>

            {/* Severity Level */}
            <select
              value={threatFilter}
              onChange={(e) => { setThreatFilter(e.target.value); handleFilterChange(); }}
              className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
            >
              <option value="All">All Severities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>

            {/* Protocol */}
            <select
              value={protocolFilter}
              onChange={(e) => { setProtocolFilter(e.target.value); handleFilterChange(); }}
              className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
            >
              {protocolOptions.map((p) => (
                <option key={p} value={p}>{p === 'All' ? 'All Protocols' : p}</option>
              ))}
            </select>

            {/* Status */}
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); handleFilterChange(); }}
              className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
            >
              <option value="All">All Statuses</option>
              <option value="Open">Open</option>
              <option value="Acknowledged">Acknowledged</option>
              <option value="Resolved">Resolved</option>
            </select>
          </div>

          {/* Sort Controls */}
          <div className="mt-3 flex flex-wrap gap-2 items-center">
            <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Sort:</span>
            {SORT_FIELDS.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => handleSortChange(f.key)}
                className={`rounded-lg px-3 py-1 text-xs font-semibold transition border ${
                  sortKey === f.key
                    ? 'bg-blue-600/20 border-blue-500/40 text-blue-300'
                    : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white hover:border-slate-600'
                }`}
              >
                {f.label}
                {sortKey === f.key && <span className="ml-1">{sortDir === 'asc' ? '↑' : '↓'}</span>}
              </button>
            ))}
            <span className="ml-auto text-xs text-slate-400 font-semibold">
              {processedRows.length.toLocaleString()} filtered alerts
            </span>
          </div>
        </section>

        {/* Error Banner */}
        {error && (
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300 flex items-start gap-3">
            <span className="text-rose-400 text-base">⚠</span>
            <div>
              <p className="font-semibold">Error loading alerts</p>
              <p className="text-rose-400 text-xs mt-0.5">{error}</p>
            </div>
            <button
              type="button"
              onClick={loadAlerts}
              className="ml-auto text-xs text-rose-300 underline hover:text-rose-200"
            >
              Retry
            </button>
          </div>
        )}

        {/* Table */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 sm:p-5 backdrop-blur">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-xs font-sans">
              <thead>
                <tr className="border-b border-slate-700 text-slate-400 uppercase tracking-wider">
                  {[
                    { key: 'timestamp', label: 'Time' },
                    { key: 'source_ip', label: 'Source IP' },
                    { key: 'destination_ip', label: 'Destination IP' },
                    { key: 'protocol', label: 'Protocol' },
                    { key: 'attack_type', label: 'Attack Type' },
                    { key: 'severity', label: 'Severity' },
                    { key: 'status', label: 'Status' },
                    { key: 'source', label: 'Source' },
                    { key: null, label: 'Action' },
                  ].map(({ key, label }) => (
                    <th
                      key={label || 'action'}
                      className={`pb-3 pr-4 font-semibold whitespace-nowrap ${key ? 'cursor-pointer select-none hover:text-white transition' : ''}`}
                      onClick={() => key && handleSortChange(key)}
                    >
                      {label}
                      {key && <SortIndicator col={key} />}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="font-mono">
                {loading ? (
                  <tr>
                    <td colSpan="9" className="py-12 text-center">
                      <LoadingSpinner
                        label={datasetStatus === 'loading' ? 'Ingesting network telemetry...' : 'Loading security alerts...'}
                      />
                    </td>
                  </tr>
                ) : pageRows.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="h-12 w-12 rounded-full bg-slate-800 flex items-center justify-center text-2xl">
                          🛡️
                        </div>
                        <p className="text-slate-400 font-sans font-medium">
                          {rows.length === 0
                            ? datasetStatus === 'loading'
                              ? 'Dataset pipeline is loading. Please wait…'
                              : 'No alert data available. Ensure dataset is loaded.'
                            : 'No alerts match the current filters.'}
                        </p>
                        {rows.length > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              setSearch(''); setThreatFilter('All');
                              setProtocolFilter('All'); setStatusFilter('All');
                              setPage(1);
                            }}
                            className="text-xs text-blue-400 underline hover:text-blue-300 font-sans"
                          >
                            Clear all filters
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  pageRows.map((row, index) => {
                    const status = resolveStatus(row);
                    const severity = row.severity || row.threat_level || 'Medium';
                    const attack = row.attack_type || row.traffic_label || 'Attack';

                    return (
                      <tr
                        key={`${row.timestamp}-${row.source_ip}-${index}`}
                        className="border-b border-slate-800/60 text-slate-300 hover:bg-slate-900/40 transition-colors"
                      >
                        {/* Time */}
                        <td className="py-3 pr-4 text-slate-400 text-[11px] whitespace-nowrap">
                          {row.timestamp || '—'}
                        </td>
                        {/* Source IP */}
                        <td className="py-3 pr-4 font-bold text-slate-200 whitespace-nowrap">
                          {row.source_ip || '—'}
                        </td>
                        {/* Destination IP */}
                        <td className="py-3 pr-4 whitespace-nowrap">
                          {row.destination_ip || '—'}
                        </td>
                        {/* Protocol */}
                        <td className="py-3 pr-4 text-blue-400 font-semibold">
                          {row.protocol || '—'}
                        </td>
                        {/* Attack Type */}
                        <td className="py-3 pr-4 text-rose-400 font-semibold max-w-[180px] truncate">
                          {attack}
                        </td>
                        {/* Severity */}
                        <td className="py-3 pr-4 font-sans">
                          <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${SEVERITY_STYLES[severity] || 'bg-slate-800 text-slate-300 border border-slate-700'}`}>
                            {severity}
                          </span>
                        </td>
                        {/* Status */}
                        <td className="py-3 pr-4 font-sans">
                          <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${STATUS_STYLES[status] || 'bg-slate-800 text-slate-300'}`}>
                            {status}
                          </span>
                        </td>
                        {/* Source */}
                        <td className="py-3 pr-4 font-sans">
                          <span className={`rounded px-2 py-0.5 text-[10px] font-semibold border ${
                            String(row.source || '').toLowerCase() === 'dataset'
                              ? 'bg-purple-500/10 text-purple-300 border-purple-500/30'
                              : 'bg-blue-500/10 text-blue-300 border-blue-500/30'
                          }`}>
                            {row.source || 'Live Network'}
                          </span>
                        </td>
                        {/* View / details action */}
                        <td className="py-3 font-sans">
                          <button
                            type="button"
                            onClick={() => setSelectedRow(row)}
                            className="rounded-lg border border-slate-700 px-2.5 py-1 text-[11px] text-slate-300 hover:border-blue-500/50 hover:text-blue-300 transition"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between text-xs font-sans">
            <p className="text-slate-400">
              Page <span className="font-semibold text-slate-200">{safePage}</span> of{' '}
              <span className="font-semibold text-slate-200">{totalPages}</span> —{' '}
              showing <span className="font-semibold text-slate-200">{pageRows.length}</span> of{' '}
              <span className="font-semibold text-slate-200">{processedRows.length.toLocaleString()}</span> filtered results
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage(1)}
                disabled={safePage === 1}
                className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-slate-300 transition hover:border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed font-semibold"
              >
                «
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={safePage === 1}
                className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-slate-300 transition hover:border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed font-semibold"
              >
                Previous
              </button>
              <span className="px-3 py-2 text-slate-400 font-mono font-semibold">
                {safePage} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage >= totalPages}
                className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-slate-300 transition hover:border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed font-semibold"
              >
                Next
              </button>
              <button
                type="button"
                onClick={() => setPage(totalPages)}
                disabled={safePage >= totalPages}
                className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-slate-300 transition hover:border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed font-semibold"
              >
                »
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
