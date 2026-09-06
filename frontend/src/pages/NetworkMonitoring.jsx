import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import LoadingSpinner from '../components/LoadingSpinner';

// ── Constants ──────────────────────────────────────────────────────────────────
const BATCH_SIZE = 100;   // rows fetched per server request
const PAGE_SIZE  = 15;    // rows shown per page in the table

const THREAT_STYLES = {
  High:   'bg-rose-500/15 text-rose-300 border border-rose-500/30 shadow-[0_0_6px_rgba(244,63,94,0.2)]',
  Medium: 'bg-amber-500/15 text-amber-300 border border-amber-500/30',
  Low:    'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30',
};

const PREDICTION_STYLES = {
  Normal:  'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30',
  Attack:  'bg-rose-500/15 text-rose-300 border border-rose-500/30 shadow-[0_0_6px_rgba(244,63,94,0.2)]',
  Unknown: 'bg-slate-700/50 text-slate-400 border border-slate-600',
};

const THREAT_ORDER = { High: 0, Medium: 1, Low: 2 };

// Columns available for sorting in the table header
const TABLE_COLUMNS = [
  { key: 'source_ip',        label: 'Source IP'       },
  { key: 'destination_ip',   label: 'Destination IP'  },
  { key: 'source_port',      label: 'Src Port'        },
  { key: 'destination_port', label: 'Dst Port'        },
  { key: 'protocol',         label: 'Protocol'        },
  { key: 'total_packets',    label: 'Packets'         },
  { key: 'flow_duration',    label: 'Flow Duration'   },
  { key: 'total_bytes',      label: 'Bytes'           },
  { key: 'prediction',       label: 'Prediction'      },
  { key: 'confidence',       label: 'Confidence'      },
  { key: 'threat_level',     label: 'Threat Level'    },
  { key: 'risk_score',       label: 'Risk Score'      },
  { key: 'traffic_label',    label: 'Ground Truth'    },
];

// ── Helpers ────────────────────────────────────────────────────────────────────

/** Get prediction label directly from backend row */
function getPredictionLabel(row) {
  const pred = String(row.prediction ?? '').trim().toLowerCase();
  if (!pred || pred === '' || pred === 'benign' || pred === 'normal' || pred === '0' || pred === 'safe') {
    return 'Normal';
  }
  return 'Attack';
}

/** Get the real confidence percentage from the ML model output */
function getConfidencePct(row) {
  if (row.confidence != null) {
    const confRaw = Number(row.confidence);
    return confRaw <= 1.0 ? Math.round(confRaw * 100) : Math.round(confRaw);
  }
  return null; // Return null instead of fake fallback
}

function fmtBytes(val) {
  const n = Number(val);
  if (isNaN(n) || val == null) return '—';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)} MB`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)} KB`;
  return `${n} B`;
}

function fmtDuration(val) {
  const n = Number(val);
  if (isNaN(n) || val == null) return '—';
  if (n >= 1) return `${n.toFixed(3)} s`;
  return `${(n * 1000).toFixed(1)} ms`;
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function NetworkMonitoring() {
  const { user } = useAuth();
  const { livePackets, clearLivePackets, realtimeAlerts, isConnected } = useNotifications();
  const [activeStreamTab, setActiveStreamTab] = useState('packets'); // 'packets' | 'alerts'

  // Dataset Promoted Alerts States
  const [creatingAlertIdx, setCreatingAlertIdx] = useState(null);
  const [alertStates, setAlertStates] = useState({}); // stateKey -> 'created' | 'duplicate' | 'error: <msg>'

  const getAlertStateKey = useCallback((row) => {
    return `${row.source_ip}_${row.destination_ip}_${row.prediction || row.traffic_label || "Attack"}_${row.flow_duration || row.timestamp}`;
  }, []);

  const handleCreateDatasetAlert = useCallback(async (row, idx) => {
    setCreatingAlertIdx(idx);
    const stateKey = getAlertStateKey(row);
    
    // Normalize confidence to 0-1 scale, parsing safely to prevent NaN
    let confVal = 0.95;
    if (row.confidence != null) {
      const parsed = parseFloat(String(row.confidence).replace('%', ''));
      if (!isNaN(parsed)) {
        confVal = parsed;
      }
    }
    const normConf = confVal > 1.0 ? confVal / 100.0 : confVal;
    
    // Parse risk_score safely to prevent NaN
    let riskScoreVal = 85;
    if (row.risk_score != null) {
      const parsed = parseInt(String(row.risk_score), 10);
      if (!isNaN(parsed)) {
        riskScoreVal = parsed;
      }
    }

    // Parse ports safely to prevent NaN
    let srcPortVal = 80;
    if (row.source_port != null) {
      const parsed = parseInt(String(row.source_port), 10);
      if (!isNaN(parsed)) {
        srcPortVal = parsed;
      }
    }
    let dstPortVal = 80;
    if (row.destination_port != null) {
      const parsed = parseInt(String(row.destination_port), 10);
      if (!isNaN(parsed)) {
        dstPortVal = parsed;
      }
    }
    
    // Extract real attack label from row
    const attackTypeVal = row.traffic_label || row.attack_type || row.prediction || "Attack";

    // Build payload using actual row values, matching backend Pydantic schema
    const nowIso = new Date().toISOString();
    const payload = {
      source: "Dataset",
      source_ip: row.source_ip || "192.168.1.100",
      destination_ip: row.destination_ip || "10.0.0.1",
      src_port: srcPortVal,
      dst_port: dstPortVal,
      protocol: row.protocol || "TCP",
      attack_type: attackTypeVal,
      prediction: "Attack",
      confidence: normConf,
      risk_score: riskScoreVal,
      severity: row.threat_level || row.severity || "High",
      timestamp: nowIso,
      created_at: nowIso,
      detection_details: {
        dataset_timestamp: row.timestamp || null,
      }
    };

    try {
      await api.post('/alerts/from-dataset', payload);
      setAlertStates(prev => ({ ...prev, [stateKey]: 'created' }));
    } catch (err) {
      const status = err?.response?.status;
      const detail = err?.response?.data?.detail;
      
      if (status === 409) {
        setAlertStates(prev => ({ ...prev, [stateKey]: 'duplicate' }));
      } else {
        const errorMsg = typeof detail === 'string' 
          ? detail 
          : (Array.isArray(detail) && detail.length > 0 && detail[0].msg) 
            ? `${detail[0].loc.join('.')}: ${detail[0].msg}` 
            : err.message;
        setAlertStates(prev => ({ ...prev, [stateKey]: `error: ${errorMsg}` }));
      }
    } finally {
      setCreatingAlertIdx(null);
    }
  }, [getAlertStateKey]);

  // Raw data from API
  const [rows, setRows] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [datasetStatus, setDatasetStatus] = useState('loading');
  const pollRef = useRef(null);

  // Filter / search state (sent to backend)
  const [search, setSearch] = useState('');
  const [protocolFilter, setProtocolFilter] = useState('');
  const [threatFilter, setThreatFilter] = useState('');

  // Draft values bound to the input fields (applied only on Search click / Enter)
  const [draftSearch, setDraftSearch] = useState('');
  const [draftProtocol, setDraftProtocol] = useState('');
  const [draftThreat, setDraftThreat] = useState('');

  // Sorting (client-side within the loaded batch)
  const [sortKey, setSortKey] = useState('');
  const [sortDir, setSortDir] = useState('desc');

  // Server-side page (each page = BATCH_SIZE rows from backend)
  const [serverPage, setServerPage] = useState(1);

  // Client-side page within the loaded + filtered + sorted batch
  const [clientPage, setClientPage] = useState(1);

  // Live Packet Capture state (PyShark / TShark)
  const [captureMode, setCaptureMode] = useState('dataset'); // 'dataset' | 'live'
  const [liveStatus, setLiveStatus] = useState({ is_capturing: false, packet_count: 0, threats_detected: 0, tshark_available: false });
  const [capturingLoading, setCapturingLoading] = useState(false);

  const fetchLiveStatus = useCallback(async () => {
    try {
      const res = await api.get('/network/live-capture/status');
      setLiveStatus(res.data);
    } catch (e) {
      console.warn('Failed to fetch live capture status:', e);
    }
  }, []);

  const handleStartCapture = async () => {
    setCapturingLoading(true);
    try {
      await api.post('/network/live-capture/start', { duration: 300 });
      await fetchLiveStatus();
    } catch (err) {
      alert('Error starting live packet capture');
    } finally {
      setCapturingLoading(false);
    }
  };

  const handleStopCapture = async () => {
    setCapturingLoading(true);
    try {
      await api.post('/network/live-capture/stop');
      await fetchLiveStatus();
    } catch (err) {
      alert('Error stopping live packet capture');
    } finally {
      setCapturingLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveStatus();
    const interval = setInterval(fetchLiveStatus, 2000);
    return () => clearInterval(interval);
  }, [fetchLiveStatus]);

  // ── Data Loading ─────────────────────────────────────────────────────────────
  const loadTraffic = useCallback(async (
    nextServerPage = 1,
    nextSearch = '',
    nextProtocol = '',
    nextThreat = '',
  ) => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/network/traffic', {
        params: {
          page:         nextServerPage,
          limit:        BATCH_SIZE,
          search:       nextSearch,
          protocol:     nextProtocol,
          threat_level: nextThreat,
        },
      });
      const payload = response.data;
      setDatasetStatus(payload.dataset_status || 'ready');
      setRows(payload.data || []);
      setServerPage(payload.page || nextServerPage);
      setTotalRecords(payload.total_records || 0);
      setClientPage(1);
      return payload.dataset_status;
    } catch (err) {
      if (err?.response?.status === 503) {
        setDatasetStatus('loading');
        return 'loading';
      }
      setError(err?.response?.data?.detail || 'Unable to load traffic data.');
      return 'failed';
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load + polling while dataset is still ingesting
  useEffect(() => {
    let mounted = true;
    const startPolling = async () => {
      const status = await loadTraffic(1, '', '', '');
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
            await loadTraffic(1, search, protocolFilter, threatFilter);
          }
        } catch (e) {
          // ignore transient errors
        }
      }, 3000);
    };

    startPolling();
    return () => { mounted = false; if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; } };
  }, [loadTraffic]);

  // Apply filters → fetch page 1 from server
  const applyFilters = useCallback(() => {
    setSearch(draftSearch);
    setProtocolFilter(draftProtocol);
    setThreatFilter(draftThreat);
    loadTraffic(1, draftSearch, draftProtocol, draftThreat);
  }, [draftSearch, draftProtocol, draftThreat, loadTraffic]);

  const clearFilters = useCallback(() => {
    setDraftSearch(''); setDraftProtocol(''); setDraftThreat('');
    setSearch(''); setProtocolFilter(''); setThreatFilter('');
    loadTraffic(1, '', '', '');
  }, [loadTraffic]);

  // ── Protocol options derived from loaded batch ────────────────────────────────
  const protocolOptions = useMemo(() => {
    const unique = [...new Set(rows.map((r) => r.protocol).filter(Boolean))].sort();
    return unique;
  }, [rows]);

  // ── Augment rows with derived prediction + confidence ─────────────────────────
  const augmentedRows = useMemo(() => {
    return rows.map((row) => ({
      ...row,
      prediction_label: getPredictionLabel(row),
      confidence_pct: getConfidencePct(row),
    }));
  }, [rows]);

  // ── Client-side sort (applied within the loaded batch) ────────────────────────
  const sortedRows = useMemo(() => {
    if (!sortKey) return augmentedRows;

    return [...augmentedRows].sort((a, b) => {
      // Threat level uses a custom order
      if (sortKey === 'threat_level') {
        const aOrd = THREAT_ORDER[a.threat_level] ?? 99;
        const bOrd = THREAT_ORDER[b.threat_level] ?? 99;
        return sortDir === 'asc' ? aOrd - bOrd : bOrd - aOrd;
      }
      // Confidence (numeric)
      if (sortKey === 'confidence') {
        const aNum = Number(a.confidence_pct ?? -1);
        const bNum = Number(b.confidence_pct ?? -1);
        return sortDir === 'asc' ? aNum - bNum : bNum - aNum;
      }
      // Risk Score
      if (sortKey === 'risk_score') {
        const aNum = Number(a.risk_score ?? -1);
        const bNum = Number(b.risk_score ?? -1);
        return sortDir === 'asc' ? aNum - bNum : bNum - aNum;
      }
      // Prediction Label
      if (sortKey === 'prediction') {
        const aVal = a.prediction_label;
        const bVal = b.prediction_label;
        return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      // Ground Truth Label
      if (sortKey === 'traffic_label') {
        const aVal = String(a.traffic_label ?? '');
        const bVal = String(b.traffic_label ?? '');
        return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      // Pure numeric columns
      if (['source_port', 'destination_port', 'total_packets', 'flow_duration', 'total_bytes'].includes(sortKey)) {
        const aNum = Number(a[sortKey] ?? NaN);
        const bNum = Number(b[sortKey] ?? NaN);
        if (isNaN(aNum) && isNaN(bNum)) return 0;
        if (isNaN(aNum)) return 1;
        if (isNaN(bNum)) return -1;
        return sortDir === 'asc' ? aNum - bNum : bNum - aNum;
      }
      // String columns
      const aVal = String(a[sortKey] ?? '').toLowerCase();
      const bVal = String(b[sortKey] ?? '').toLowerCase();
      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [augmentedRows, sortKey, sortDir]);

  // ── Pagination math ───────────────────────────────────────────────────────────
  const totalClientPages = Math.max(1, Math.ceil(sortedRows.length / PAGE_SIZE));
  const safeClientPage   = Math.min(clientPage, totalClientPages);
  const pageRows         = sortedRows.slice((safeClientPage - 1) * PAGE_SIZE, safeClientPage * PAGE_SIZE);

  const canPrevServer = serverPage > 1;
  const canNextServer = serverPage * BATCH_SIZE < totalRecords;

  // ── Sort helpers ──────────────────────────────────────────────────────────────
  const handleSortClick = (key) => {
    if (key === sortKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
    setClientPage(1);
  };

  const SortIcon = ({ col }) => {
    if (sortKey !== col) return <span className="ml-0.5 text-slate-700">⇅</span>;
    return <span className="ml-0.5 text-blue-400">{sortDir === 'asc' ? '↑' : '↓'}</span>;
  };

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      <div className="mx-auto flex min-h-screen max-w-screen-2xl flex-col px-4 py-6 sm:px-6 lg:px-8 space-y-5">

        {/* ── Header ── */}
        <header className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5 shadow-2xl backdrop-blur">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
                <p className="text-xs uppercase tracking-[0.35em] text-blue-400 font-bold">Network Monitoring</p>
              </div>
              <h1 className="text-2xl font-bold text-white">Processed Traffic Telemetry</h1>
              <p className="mt-1 text-sm text-slate-400">
                Packet-level flow records from the ingestion pipeline with threat classification.
                {captureMode === 'dataset' && totalRecords > 0 && (
                  <span className="ml-2 text-slate-300 font-semibold">
                    {totalRecords.toLocaleString()} total records in dataset.
                  </span>
                )}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2">
                <span className="text-xs text-slate-500">Role</span>
                <span className="text-xs font-semibold text-white">{user?.role || 'Authenticated'}</span>
              </div>
              {captureMode === 'dataset' && (
                <button
                  type="button"
                  onClick={() => loadTraffic(serverPage, search, protocolFilter, threatFilter)}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500 shadow-[0_0_12px_rgba(37,99,235,0.3)]"
                >
                  ↺ Refresh
                </button>
              )}
              <Link
                to="/dashboard"
                className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 transition hover:border-slate-600 hover:text-white"
              >
                ← Dashboard
              </Link>
            </div>
          </div>
        </header>

        {/* ── Mode Selector ── */}
        <section className="flex justify-center">
          <div className="flex items-center rounded-2xl bg-slate-900/90 p-1.5 border border-slate-800 text-xs font-semibold shadow-lg backdrop-blur">
            <button
              type="button"
              onClick={() => setCaptureMode('dataset')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl transition ${
                captureMode === 'dataset'
                  ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.45)]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>📊</span> Dataset Telemetry (Historical)
            </button>
            <button
              type="button"
              onClick={() => setCaptureMode('live')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl transition ${
                captureMode === 'live'
                  ? 'bg-emerald-600 text-white shadow-[0_0_15px_rgba(16,185,129,0.45)]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>📡</span> PyShark Live Capture (Real-Time)
            </button>
          </div>
        </section>

        {/* ── Conditionally Render Live Mode vs Dataset Mode ── */}
        {captureMode === 'live' ? (
          <>
            {/* ── Live PyShark Capture Control Bar ── */}
            <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-xl backdrop-blur flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className={`h-3 w-3 rounded-full ${liveStatus.is_capturing ? 'bg-emerald-500 animate-ping shadow-[0_0_10px_#10b981]' : 'bg-slate-600'}`} />
                  <span className="text-sm font-bold text-white">
                    {liveStatus.is_capturing ? 'PyShark Live Packet Sniffing Active' : 'Live Capture Idle'}
                  </span>
                </div>

                <span className="rounded-full border border-slate-700 bg-slate-950 px-2.5 py-0.5 text-[11px] font-semibold text-slate-300">
                  {liveStatus.mode}
                </span>
              </div>

              <div className="flex items-center gap-4 text-xs">
                <div>
                  <span className="text-slate-400">Packets Captured: </span>
                  <span className="font-mono font-bold text-blue-400">{liveStatus.packet_count.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-slate-400">Threats Detected: </span>
                  <span className="font-mono font-bold text-rose-400">{liveStatus.threats_detected.toLocaleString()}</span>
                </div>

                {liveStatus.is_capturing ? (
                  <button
                    type="button"
                    onClick={handleStopCapture}
                    disabled={capturingLoading}
                    className="rounded-xl border border-rose-500/40 bg-rose-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-rose-600/30 transition hover:bg-rose-500 disabled:opacity-50"
                  >
                    ■ Stop PyShark Capture
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleStartCapture}
                    disabled={capturingLoading}
                    className="rounded-xl border border-emerald-500/40 bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-emerald-600/30 transition hover:bg-emerald-500 disabled:opacity-50"
                  >
                    ▶ Start PyShark Capture
                  </button>
                )}
              </div>
            </section>

            {/* ── Live AI Predictions Stream ── */}
            <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-2xl backdrop-blur space-y-4">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 border-b border-slate-800 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${liveStatus.is_capturing ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'}`} />
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                      <span>⚡ Live AI Predictions Stream</span>
                      <span className="text-xs font-mono font-normal text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-md border border-blue-500/20">
                        PyShark + Random Forest
                      </span>
                    </h2>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Real-time model inferences on live packets passing through <code className="text-blue-300 font-mono">predict_network_traffic()</code>.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {/* Stream Tabs */}
                  <div className="flex items-center rounded-xl bg-slate-950 p-1 border border-slate-800 text-xs font-semibold">
                    <button
                      type="button"
                      onClick={() => setActiveStreamTab('packets')}
                      className={`px-3 py-1.5 rounded-lg transition ${
                        activeStreamTab === 'packets'
                          ? 'bg-blue-600 text-white shadow'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Live Packets ({livePackets.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveStreamTab('alerts')}
                      className={`px-3 py-1.5 rounded-lg transition ${
                        activeStreamTab === 'alerts'
                          ? 'bg-rose-600 text-white shadow'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Real-Time Attack Alerts ({realtimeAlerts.length})
                    </button>
                  </div>

                  {livePackets.length > 0 && (
                    <button
                      type="button"
                      onClick={clearLivePackets}
                      className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-slate-400 hover:text-white hover:border-slate-600 transition"
                    >
                      Clear Stream
                    </button>
                  )}
                </div>
              </div>

              {/* TAB 1: LIVE PACKET PREDICTIONS TABLE */}
              {activeStreamTab === 'packets' && (
                <div>
                  {livePackets.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-800 bg-slate-950/50 py-10 px-4 text-center">
                      <div className="mx-auto h-12 w-12 rounded-full bg-slate-800/80 flex items-center justify-center text-2xl mb-2">
                        {liveStatus.is_capturing ? '📡' : '⏸'}
                      </div>
                      <p className="text-sm font-semibold text-slate-300">
                        {liveStatus.is_capturing
                          ? 'Waiting for live network packets…'
                          : 'Live packet capture is currently idle'}
                      </p>
                      <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                        {liveStatus.is_capturing
                          ? 'Packets sniffed on your Wi-Fi interface are being feature-extracted and scored by the Random Forest model in real time.'
                          : 'Click "▶ Start PyShark Capture" above to initiate sniffing on your active network interface.'}
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950 max-h-96 overflow-y-auto">
                      <table className="min-w-full text-left text-[11px] font-sans">
                        <thead className="sticky top-0 z-10 bg-slate-900 border-b border-slate-800">
                          <tr className="text-slate-400 font-semibold uppercase tracking-wider">
                            <th className="px-4 py-2.5">Time</th>
                            <th className="px-4 py-2.5">Source IP</th>
                            <th className="px-4 py-2.5">Destination IP</th>
                            <th className="px-4 py-2.5">Protocol</th>
                            <th className="px-4 py-2.5">Prediction</th>
                            <th className="px-4 py-2.5">Attack Type (RF Model)</th>
                            <th className="px-4 py-2.5">Confidence</th>
                            <th className="px-4 py-2.5">Risk Score</th>
                          </tr>
                        </thead>
                        <tbody className="font-mono divide-y divide-slate-800/50 text-slate-300">
                          {livePackets.map((pkt, idx) => {
                            const atkType = String(pkt.attack_type || 'Benign').trim();
                            const isAttack = !['benign', 'normal', 'safe'].includes(atkType.toLowerCase());
                            const confRaw = Number(pkt.confidence ?? 0.95);
                            const confPct = confRaw <= 1.0 ? Math.round(confRaw * 100) : Math.round(confRaw);
                            const riskScore = Number(pkt.risk_score ?? (isAttack ? 85 : 10));

                            let timeStr = '—';
                            if (pkt.timestamp) {
                              try {
                                const d = new Date(pkt.timestamp);
                                timeStr = d.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }) + '.' + String(d.getMilliseconds()).padStart(3, '0');
                              } catch (e) {
                                timeStr = String(pkt.timestamp);
                              }
                            }

                            return (
                              <tr
                                key={`live-${pkt.packet_number || idx}-${idx}`}
                                className={`transition-colors ${isAttack ? 'bg-rose-500/10 hover:bg-rose-500/15' : 'hover:bg-slate-800/40'}`}
                              >
                                <td className="px-4 py-2 text-slate-400 whitespace-nowrap font-mono text-[10px]">
                                  {timeStr}
                                </td>
                                <td className="px-4 py-2 font-bold text-slate-200 whitespace-nowrap">
                                  {pkt.source_ip || '192.168.1.100'}
                                </td>
                                <td className="px-4 py-2 text-slate-300 whitespace-nowrap">
                                  {pkt.destination_ip || '10.0.0.1'}
                                </td>
                                <td className="px-4 py-2 text-cyan-400 font-semibold">
                                  {pkt.protocol || 'TCP'}
                                </td>
                                <td className="px-4 py-2">
                                  <span
                                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wide uppercase ${
                                      isAttack
                                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-[0_0_8px_rgba(244,63,94,0.3)]'
                                        : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                                    }`}
                                  >
                                    {isAttack ? '⚠️ Attack' : '✓ Benign'}
                                  </span>
                                </td>
                                <td className="px-4 py-2">
                                  <span className={`font-semibold ${isAttack ? 'text-rose-300 font-bold' : 'text-slate-400'}`}>
                                    {atkType}
                                  </span>
                                </td>
                                <td className="px-4 py-2">
                                  <div className="flex items-center gap-2">
                                    <div className="w-14 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                                      <div
                                        className={`h-full rounded-full ${
                                          confPct >= 90 ? 'bg-rose-500' : confPct >= 75 ? 'bg-amber-500' : 'bg-emerald-500'
                                        }`}
                                        style={{ width: `${confPct}%` }}
                                      />
                                    </div>
                                    <span className="text-[10px] text-slate-300 font-semibold">
                                      {confPct}%
                                    </span>
                                  </div>
                                </td>
                                <td className="px-4 py-2">
                                  <span
                                    className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
                                      riskScore >= 75
                                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                        : riskScore >= 40
                                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                    }`}
                                  >
                                    {riskScore} / 100
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: REAL-TIME ATTACK ALERTS VIEW */}
              {activeStreamTab === 'alerts' && (
                <div>
                  {realtimeAlerts.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-800 bg-slate-950/50 py-10 px-4 text-center">
                      <div className="mx-auto h-12 w-12 rounded-full bg-slate-800/80 flex items-center justify-center text-2xl mb-2">
                        🛡️
                      </div>
                      <p className="text-sm font-semibold text-slate-300">No real-time attack alerts yet</p>
                      <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                        When <code className="text-blue-300 font-mono">predict_network_traffic()</code> classifies a live packet as an attack, an alert is automatically generated, persisted, and pushed here over WebSocket.
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950 max-h-96 overflow-y-auto">
                      <table className="min-w-full text-left text-[11px] font-sans">
                        <thead className="sticky top-0 z-10 bg-slate-900 border-b border-slate-800">
                          <tr className="text-slate-400 font-semibold uppercase tracking-wider">
                            <th className="px-4 py-2.5">Alert ID</th>
                            <th className="px-4 py-2.5">Timestamp</th>
                            <th className="px-4 py-2.5">Attack Type</th>
                            <th className="px-4 py-2.5">Severity</th>
                            <th className="px-4 py-2.5">Source IP</th>
                            <th className="px-4 py-2.5">Destination IP</th>
                            <th className="px-4 py-2.5">Risk Score</th>
                            <th className="px-4 py-2.5">Status</th>
                          </tr>
                        </thead>
                        <tbody className="font-mono divide-y divide-slate-800/50 text-slate-300">
                          {realtimeAlerts.map((alt, idx) => {
                            const sev = String(alt.severity || 'Medium').trim();
                            const isHigh = ['high', 'critical'].includes(sev.toLowerCase());

                            let timeStr = '—';
                            if (alt.timestamp) {
                              try {
                                const d = new Date(alt.timestamp);
                                timeStr = d.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
                              } catch (e) {
                                timeStr = String(alt.timestamp);
                              }
                            }

                            return (
                              <tr key={`alt-${alt.alert_id || idx}-${idx}`} className="hover:bg-slate-800/40 transition-colors">
                                <td className="px-4 py-2 font-mono text-blue-400 font-bold">
                                  {alt.alert_id || `ALT-${idx + 1}`}
                                </td>
                                <td className="px-4 py-2 text-slate-400 text-[10px]">
                                  {timeStr}
                                </td>
                                <td className="px-4 py-2 font-bold text-rose-300">
                                  {alt.attack_type || 'Malicious Traffic'}
                                </td>
                                <td className="px-4 py-2">
                                  <span
                                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                                      isHigh
                                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-[0_0_6px_rgba(244,63,94,0.3)]'
                                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                    }`}
                                  >
                                    {sev}
                                  </span>
                                </td>
                                <td className="px-4 py-2 font-bold text-slate-200">
                                  {alt.source_ip || '192.168.1.100'}
                                </td>
                                <td className="px-4 py-2 text-slate-300">
                                  {alt.destination_ip || '10.0.0.1'}
                                </td>
                                <td className="px-4 py-2 text-rose-400 font-bold">
                                  {alt.risk_score != null ? `${alt.risk_score} / 100` : '—'}
                                </td>
                                <td className="px-4 py-2">
                                  <span className="rounded-md border border-slate-700 bg-slate-900 px-2 py-0.5 text-[10px] text-slate-300">
                                    {alt.status || 'Open'}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </section>
          </>
        ) : (
          <>
            {/* ── Filter / Search Bar ── */}
            <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur space-y-3">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                <div className="lg:col-span-2 flex gap-2">
                  <input
                    value={draftSearch}
                    onChange={(e) => setDraftSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                    placeholder="Search IP, port, protocol, label…"
                    className="flex-1 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-blue-500 transition"
                  />
                </div>

                <select
                  value={draftProtocol}
                  onChange={(e) => setDraftProtocol(e.target.value)}
                  className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
                >
                  <option value="">All Protocols</option>
                  {protocolOptions.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>

                <select
                  value={draftThreat}
                  onChange={(e) => setDraftThreat(e.target.value)}
                  className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
                >
                  <option value="">All Threat Levels</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={applyFilters}
                    className="flex-1 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 transition shadow-[0_0_10px_rgba(37,99,235,0.25)]"
                  >
                    Search
                  </button>
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="rounded-xl border border-slate-700 px-3 py-2 text-sm text-slate-400 hover:text-white hover:border-slate-600 transition"
                  >
                    Clear
                  </button>
                </div>
              </div>

              {(search || protocolFilter || threatFilter) && (
                <div className="flex flex-wrap gap-2 items-center text-xs">
                  <span className="text-slate-500 font-semibold uppercase tracking-wider">Active filters:</span>
                  {search && (
                    <span className="rounded-full border border-blue-500/40 bg-blue-500/10 text-blue-300 px-3 py-0.5">
                      Search: &ldquo;{search}&rdquo;
                    </span>
                  )}
                  {protocolFilter && (
                    <span className="rounded-full border border-cyan-500/40 bg-cyan-500/10 text-cyan-300 px-3 py-0.5">
                      Protocol: {protocolFilter}
                    </span>
                  )}
                  {threatFilter && (
                    <span className="rounded-full border border-rose-500/40 bg-rose-500/10 text-rose-300 px-3 py-0.5">
                      Threat: {threatFilter}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="text-slate-500 underline hover:text-slate-300"
                  >
                    Clear all
                  </button>
                </div>
              )}

              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>
                  Showing batch <span className="font-semibold text-slate-400">{serverPage}</span> — 
                  loaded <span className="font-semibold text-slate-400">{rows.length}</span> rows from{' '}
                  <span className="font-semibold text-slate-400">{totalRecords.toLocaleString()}</span> total
                </span>
                {sortKey && (
                  <span>
                    Sorted by <span className="font-semibold text-blue-400">{TABLE_COLUMNS.find(c => c.key === sortKey)?.label}</span>{' '}
                    {sortDir === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </div>
            </section>

            {/* ── Error Banner ── */}
            {error && (
              <div className="rounded-xl border border-rose-500/30 bg-rose-500/8 px-4 py-3 text-sm text-rose-300 flex items-start gap-3">
                <span className="text-rose-400 mt-0.5">⚠</span>
                <div className="flex-1">
                  <p className="font-semibold">Error loading traffic data</p>
                  <p className="text-rose-400 text-xs mt-0.5">{error}</p>
                </div>
                <button
                  type="button"
                  onClick={() => loadTraffic(1, search, protocolFilter, threatFilter)}
                  className="text-xs text-rose-300 underline hover:text-rose-200 whitespace-nowrap"
                >
                  Retry
                </button>
              </div>
            )}

            {/* ── Data Table ── */}
            <section className="rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-[11px] font-sans">
                  <thead>
                    <tr className="border-b border-slate-700 bg-slate-900/80">
                      {TABLE_COLUMNS.map((col) => (
                        <th
                          key={col.key}
                          onClick={() => handleSortClick(col.key)}
                          className="px-4 py-3 text-slate-400 font-semibold uppercase tracking-wider whitespace-nowrap cursor-pointer select-none hover:text-white transition"
                        >
                          {col.label}
                          <SortIcon col={col.key} />
                        </th>
                      ))}
                      <th className="px-4 py-3 text-slate-400 font-semibold uppercase tracking-wider whitespace-nowrap">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="font-mono divide-y divide-slate-800/60">
                    {loading ? (
                      <tr>
                        <td colSpan={TABLE_COLUMNS.length + 1} className="px-4 py-14 text-center">
                          <LoadingSpinner
                            label={
                              datasetStatus === 'loading'
                                ? 'Ingesting network dataset — this may take a moment…'
                                : 'Loading traffic records…'
                            }
                          />
                        </td>
                      </tr>
                    ) : pageRows.length === 0 ? (
                      <tr>
                        <td colSpan={TABLE_COLUMNS.length + 1} className="px-4 py-16 text-center">
                          <div className="flex flex-col items-center gap-3">
                            <div className="h-14 w-14 rounded-full bg-slate-800/80 flex items-center justify-center text-3xl">
                              📡
                            </div>
                            <p className="text-slate-400 font-sans font-medium text-sm">
                              {rows.length === 0
                                ? datasetStatus === 'loading'
                                  ? 'Dataset is still loading — please wait…'
                                  : 'No traffic data found. Ensure dataset CSV files are present in backend/data.'
                                : 'No records match your current filters.'}
                            </p>
                            {rows.length > 0 && (
                              <button
                                type="button"
                                onClick={clearFilters}
                                className="text-xs text-blue-400 underline hover:text-blue-300 font-sans"
                              >
                                Clear all filters
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ) : (
                      pageRows.map((row, idx) => {
                        const predVal = getPredictionLabel(row);
                        const predStyle = PREDICTION_STYLES[predVal] || PREDICTION_STYLES.Unknown;
                        const confPct = getConfidencePct(row);
                        const riskScore = row.risk_score;

                        return (
                          <tr
                            key={`${row.source_ip}-${row.source_port}-${idx}`}
                            className="hover:bg-slate-800/30 transition-colors text-slate-300"
                          >
                            <td className="px-4 py-3 font-bold text-slate-200 whitespace-nowrap">
                              {row.source_ip || '—'}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              {row.destination_ip || '—'}
                            </td>
                            <td className="px-4 py-3 text-cyan-400 font-semibold">
                              {row.source_port != null ? Number(row.source_port).toLocaleString() : '—'}
                            </td>
                            <td className="px-4 py-3 text-cyan-400 font-semibold">
                              {row.destination_port != null ? Number(row.destination_port).toLocaleString() : '—'}
                            </td>
                            <td className="px-4 py-3 text-blue-400 font-semibold">
                              {row.protocol || '—'}
                            </td>
                            <td className="px-4 py-3 text-slate-300">
                              {row.total_packets != null ? Number(row.total_packets).toLocaleString() : '—'}
                            </td>
                            <td className="px-4 py-3 text-violet-400">
                              {fmtDuration(row.flow_duration)}
                            </td>
                            <td className="px-4 py-3 text-indigo-400">
                              {fmtBytes(row.total_bytes)}
                            </td>
                            <td className="px-4 py-3">
                              <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${predStyle}`}>
                                {predVal}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              {confPct !== null ? (
                                <div className="flex items-center gap-2">
                                  <div className="w-16 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                                    <div
                                      className={`h-full rounded-full ${
                                        confPct >= 90
                                          ? 'bg-rose-500'
                                          : confPct >= 75
                                          ? 'bg-amber-500'
                                          : 'bg-emerald-500'
                                      }`}
                                      style={{ width: `${confPct}%` }}
                                    />
                                  </div>
                                  <span className="text-[10px] text-slate-400 font-semibold">
                                    {confPct}%
                                  </span>
                                </div>
                              ) : (
                                <span className="text-slate-500">—</span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                                THREAT_STYLES[row.threat_level] || 'bg-slate-800 text-slate-300 border border-slate-700'
                              }`}>
                                {row.threat_level || 'Unknown'}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              {riskScore != null ? (
                                <span
                                  className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
                                    riskScore >= 75
                                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                      : riskScore >= 40
                                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                  }`}
                                >
                                  {riskScore} / 100
                                </span>
                              ) : (
                                <span className="text-slate-500">—</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-xs font-semibold text-slate-300">
                              {row.traffic_label || '—'}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap font-sans">
                              {predVal === 'Attack' ? (
                                <div className="flex flex-col gap-1 items-center min-w-[150px]">
                                  <button
                                    type="button"
                                    onClick={() => handleCreateDatasetAlert(row, idx)}
                                    disabled={creatingAlertIdx === idx || alertStates[getAlertStateKey(row)] === 'created' || alertStates[getAlertStateKey(row)] === 'duplicate'}
                                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold tracking-wide shadow-md transition-all duration-200 ${
                                      alertStates[getAlertStateKey(row)] === 'created'
                                        ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 cursor-default'
                                        : alertStates[getAlertStateKey(row)] === 'duplicate'
                                        ? 'bg-amber-600/20 text-amber-400 border border-amber-500/30 cursor-default'
                                        : creatingAlertIdx === idx
                                        ? 'bg-slate-800 text-slate-400 border border-slate-700 cursor-wait'
                                        : 'bg-rose-600 hover:bg-rose-700 text-white hover:scale-[1.02] active:scale-[0.98]'
                                    }`}
                                  >
                                    {alertStates[getAlertStateKey(row)] === 'created'
                                      ? '✓ Alert Created'
                                      : alertStates[getAlertStateKey(row)] === 'duplicate'
                                      ? '✓ Already Created'
                                      : creatingAlertIdx === idx
                                      ? 'Creating...'
                                      : 'Create Alert'}
                                  </button>
                                  <span className="text-[9px] block text-center max-w-[150px] whitespace-normal">
                                    {alertStates[getAlertStateKey(row)] === 'created'
                                      ? <span className="text-emerald-400 font-bold">Security alert created successfully</span>
                                      : alertStates[getAlertStateKey(row)] === 'duplicate'
                                      ? <span className="text-amber-400 font-bold">Alert already exists</span>
                                      : alertStates[getAlertStateKey(row)]?.startsWith('error:')
                                      ? <span className="text-rose-400">{alertStates[getAlertStateKey(row)].substring(6)}</span>
                                      : <span className="text-slate-500">Attack prediction available — alert not created</span>}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-slate-500 text-[10px]">Normal traffic</span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* ── Pagination ── */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-5 py-4 border-t border-slate-800 text-xs font-sans bg-slate-900/40">
                <div className="text-slate-400 space-y-0.5">
                  <p>
                    Page{' '}
                    <span className="font-semibold text-slate-200">{safeClientPage}</span>
                    {' '}of{' '}
                    <span className="font-semibold text-slate-200">{totalClientPages}</span>
                    {' '}—{' '}
                    <span className="font-semibold text-slate-200">{pageRows.length}</span>
                    {' '}of{' '}
                    <span className="font-semibold text-slate-200">{sortedRows.length}</span>
                    {' '}rows in current batch
                  </p>
                  <p>
                    Dataset total:{' '}
                    <span className="font-semibold text-slate-200">{totalRecords.toLocaleString()}</span>
                    {' '}records · Batch{' '}
                    <span className="font-semibold text-slate-200">{serverPage}</span>
                    {' '}of{' '}
                    <span className="font-semibold text-slate-200">
                      {Math.ceil(totalRecords / BATCH_SIZE) || 1}
                    </span>
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setClientPage((p) => Math.max(1, p - 1))}
                    disabled={safeClientPage === 1}
                    className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-slate-300 hover:border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed font-semibold transition"
                  >
                    ‹ Prev
                  </button>
                  <span className="flex items-center px-2 text-slate-400 font-mono">
                    {safeClientPage} / {totalClientPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => setClientPage((p) => Math.min(totalClientPages, p + 1))}
                    disabled={safeClientPage >= totalClientPages}
                    className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-slate-300 hover:border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed font-semibold transition"
                  >
                    Next ›
                  </button>

                  <div className="flex gap-1 items-center border-l border-slate-800 pl-3">
                    <span className="text-[10px] text-slate-500 uppercase tracking-wide pr-1">Batch:</span>
                    <button
                      type="button"
                      onClick={() => {
                        const next = Math.max(1, serverPage - 1);
                        setServerPage(next);
                        loadTraffic(next, search, protocolFilter, threatFilter);
                      }}
                      disabled={!canPrevServer || loading}
                      className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-300 hover:border-slate-600 disabled:opacity-40 disabled:cursor-not-allowed font-semibold transition"
                    >
                      « Prev 100
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const next = serverPage + 1;
                        setServerPage(next);
                        loadTraffic(next, search, protocolFilter, threatFilter);
                      }}
                      disabled={!canNextServer || loading}
                      className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-300 hover:border-slate-600 disabled:opacity-40 disabled:cursor-not-allowed font-semibold transition"
                    >
                      Next 100 »
                    </button>
                  </div>
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
