import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';

// Register Chart.js components
ChartJS.register(
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler
);

const defaultTrafficLimit = 8;
const threatBadgeStyles = {
  high: 'bg-rose-500/10 text-rose-400 border border-rose-500/30 font-semibold shadow-[0_0_8px_rgba(244,63,94,0.1)]',
  medium: 'bg-amber-500/10 text-amber-400 border border-amber-500/30 font-semibold',
  low: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-semibold',
};

const statusBadgeStyles = {
  open: 'bg-rose-500/20 text-rose-300 border border-rose-500/40 px-2 py-0.5 rounded-full text-xs font-semibold uppercase animate-pulse',
  investigating: 'bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full text-xs font-semibold uppercase',
  resolved: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full text-xs font-semibold uppercase',
};

export default function Dashboard() {
  const [dbStatus, setDbStatus] = useState('Checking...');
  const [analyticsData, setAnalyticsData] = useState(null);
  const [statisticsData, setStatisticsData] = useState(null);
  const [trafficRows, setTrafficRows] = useState([]);
  const [trafficPage, setTrafficPage] = useState(1);
  const [trafficTotal, setTrafficTotal] = useState(0);
  const [trafficLoading, setTrafficLoading] = useState(true);
  const [trafficError, setTrafficError] = useState('');
  const [analyticsError, setAnalyticsError] = useState('');
  const [usersError, setUsersError] = useState('');
  const [reportsError, setReportsError] = useState('');
  const [search, setSearch] = useState('');
  const [protocolFilter, setProtocolFilter] = useState('');
  const [threatFilter, setThreatFilter] = useState('');
  const [datasetStatus, setDatasetStatus] = useState('loading');
  const pollRef = useRef(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleDownloadReport = async (type) => {
    try {
      const endpoint = type === 'pdf' ? '/reports/pdf' : '/reports/csv';
      const filename = type === 'pdf' ? 'NetShield_Threat_Report.pdf' : 'NetShield_Threat_Report.csv';
      const response = await api.get(endpoint, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download report:', err);
      alert('Error downloading report. Please try again.');
    }
  };

  // Admin-specific States
  const [usersData, setUsersData] = useState([]);
  const [reportsData, setReportsData] = useState(null);
  const [usersLoading, setUsersLoading] = useState(false);
  const [reportsLoading, setReportsLoading] = useState(false);

  // ML Model & Prediction History States (Milestone 2)
  const [modelMetrics, setModelMetrics] = useState(null);
  const [predictionHistory, setPredictionHistory] = useState([]);
  
  // Real-time live capture status
  const [captureStatus, setCaptureStatus] = useState({ is_capturing: false, packet_count: 0 });
  const [livePps, setLivePps] = useState(0);
  const [incidentsData, setIncidentsData] = useState([]);

  const isAdmin = useMemo(() => user?.role === 'Security Administrator', [user?.role]);

  const analystNavigation = [
    { label: 'Dashboard', path: '/dashboard', icon: '🏠' },
    { label: 'Attack Visualization', path: '/attack-visualization', icon: '📈' },
    { label: 'Incidents', path: '/incidents', icon: '🛡️' },
    { label: 'Alerts', path: '/alerts', icon: '🚨' },
    { label: 'Network Monitoring', path: '/network-monitoring', icon: '🌐' },
    { label: 'Network Analytics', path: '/analytics', icon: '📊' },
    { label: 'AI Threat Analysis', path: '/threat-analysis', icon: '🧠' },
    { label: 'Model Performance', path: '/model-performance', icon: '⚡' },
    { label: 'Threat Reports', path: '/reports', icon: '📝' },
    { label: 'Profile', path: '/profile', icon: '👤' },
  ];

  const adminNavigation = [
    { label: 'Dashboard', path: '/dashboard', icon: '🏠' },
    { label: 'Attack Visualization', path: '/attack-visualization', icon: '📈' },
    { label: 'Incidents', path: '/incidents', icon: '🛡️' },
    { label: 'Alerts', path: '/alerts', icon: '🚨' },
    { label: 'Network Monitoring', path: '/network-monitoring', icon: '🌐' },
    { label: 'Network Analytics', path: '/analytics', icon: '📊' },
    { label: 'AI Threat Analysis', path: '/threat-analysis', icon: '🧠' },
    { label: 'Model Performance', path: '/model-performance', icon: '⚡' },
    { label: 'Threat Reports', path: '/reports', icon: '📝' },
    { label: 'User Management', path: '/user-management', icon: '👥' },
    { label: 'Audit Logs', path: '/audit-logs', icon: '📋' },
    { label: 'System Logs', path: '/system-logs', icon: '🖥️' },
    { label: 'Settings', path: '/settings', icon: '⚙️' },
  ];

  const navigationItems = isAdmin ? adminNavigation : analystNavigation;

  const formatThreatLevel = (value) => String(value ?? '').trim().toLowerCase();
  const getThreatClasses = (value) => threatBadgeStyles[formatThreatLevel(value)] || 'bg-slate-800 text-slate-300 border border-slate-700';

  const getStatus = (threatLevel) => {
    const level = formatThreatLevel(threatLevel);
    if (level === 'high') return 'open';
    if (level === 'medium') return 'investigating';
    return 'resolved';
  };

  const getStatusClasses = (threatLevel) => statusBadgeStyles[getStatus(threatLevel)] || 'bg-slate-800 text-slate-300';

  // =========================================================================
  // Data Fetchers
  // =========================================================================

  const withRetry = async (fn) => {
    try {
      return await fn();
    } catch (err) {
      const status = err?.response?.status;
      if (status && (status === 401 || status === 403 || status === 400)) throw err;
      if (status === 503 || status === 429 || !status) {
        await new Promise((resolve) => setTimeout(resolve, 800));
        return fn();
      }
      throw err;
    }
  };

  const loadTraffic = useCallback(
    async (nextPage = 1, nextSearch = '', nextProtocol = '', nextThreat = '') => {
      setTrafficLoading(true);
      setTrafficError('');

      const doFetch = () =>
        api.get('/network/traffic', {
          params: {
            page: nextPage,
            limit: defaultTrafficLimit,
            search: nextSearch,
            protocol: nextProtocol,
            threat_level: nextThreat,
          },
        });

      try {
        const response = await withRetry(doFetch);
        const payload = response.data;
        
        console.log("[DEBUG] /network/traffic Response:", payload);
        console.log("[DEBUG] /network/traffic Received Records:", payload.data?.length);
        
        setDatasetStatus(payload.dataset_status || 'ready');
        setTrafficRows(payload.data || []);
        setTrafficPage(payload.page || 1);
        setTrafficTotal(payload.total_records || 0);
        return payload.dataset_status;
      } catch (err) {
        const msg = err?.response?.data?.detail || 'Unable to load traffic data.';
        setTrafficError(msg);
        setDatasetStatus('failed');
        return 'failed';
      } finally {
        setTrafficLoading(false);
      }
    },
    []
  );

  const loadAnalytics = useCallback(async () => {
    setAnalyticsError('');
    try {
      const response = await withRetry(() => api.get('/network/analytics'));
      console.log("[DEBUG] /network/analytics Response:", response.data);
      setDatasetStatus(response.data.dataset_status || 'ready');
      setAnalyticsData(response.data);
      return response.data.dataset_status;
    } catch (err) {
      const msg = err?.response?.data?.detail || 'Unable to load analytics.';
      setAnalyticsError(msg);
      setDatasetStatus('failed');
      return 'failed';
    }
  }, []);

  const loadStatistics = useCallback(async () => {
    try {
      const response = await withRetry(() => api.get('/network/statistics'));
      console.log("[DEBUG] /network/statistics Response:", response.data);
      setDatasetStatus(response.data.dataset_status || 'ready');
      setStatisticsData(response.data);
      return response.data.dataset_status;
    } catch (err) {
      const msg = err?.response?.data?.detail || 'Unable to load statistics.';
      setAnalyticsError(msg);
      setDatasetStatus('failed');
      return 'failed';
    }
  }, []);

  const loadUsers = useCallback(async () => {
    if (!isAdmin) return;
    setUsersLoading(true);
    setUsersError('');
    try {
      const response = await withRetry(() => api.get('/admin/users'));
      console.log("[DEBUG] /admin/users Response:", response.data);
      setUsersData(response.data.users || []);
    } catch (err) {
      setUsersError(err?.response?.data?.detail || 'Unable to load user accounts.');
    } finally {
      setUsersLoading(false);
    }
  }, [isAdmin]);

  const loadReports = useCallback(async () => {
    if (!isAdmin) return;
    setReportsLoading(true);
    setReportsError('');
    try {
      const response = await withRetry(() => api.get(isAdmin ? '/admin/reports' : '/network/analytics'));
      console.log("[DEBUG] /admin/reports Response:", response.data);
      setReportsData(response.data || null);
    } catch (err) {
      setReportsError(err?.response?.data?.detail || 'Unable to load reports.');
    } finally {
      setReportsLoading(false);
    }
  }, [isAdmin]);

  const loadModelMetrics = useCallback(async () => {
    try {
      const response = await api.get('/reports/metrics.json');
      setModelMetrics(response.data);
    } catch (err) {
      setModelMetrics(null);
    }
  }, []);

  const loadPredictionHistory = useCallback(async () => {
    try {
      const response = await api.get('/network/predictions/history');
      setPredictionHistory(response.data?.history || []);
    } catch (err) {
      setPredictionHistory([]);
    }
  }, []);

  const loadIncidents = useCallback(async () => {
    try {
      const response = await api.get('/incidents');
      setIncidentsData(response.data || []);
    } catch (err) {
      setIncidentsData([]);
    }
  }, []);

  const refreshDashboard = useCallback(async () => {
    const tasks = [
      loadAnalytics(),
      loadStatistics(),
      loadTraffic(1, search, protocolFilter, threatFilter),
      loadModelMetrics(),
      loadPredictionHistory(),
      loadIncidents(),
    ];

    if (isAdmin) {
      tasks.push(loadUsers(), loadReports());
    }

    const results = await Promise.allSettled(tasks);
    const statuses = results
      .filter((r) => r.status === 'fulfilled')
      .map((r) => r.value);
    return statuses.some((status) => status === 'loading') ? 'loading' : 'ready';
  }, [isAdmin, loadAnalytics, loadStatistics, loadTraffic, loadModelMetrics, loadPredictionHistory, loadIncidents, loadUsers, loadReports, search, protocolFilter, threatFilter]);

  const handleApplyFilters = () => {
    loadTraffic(1, search, protocolFilter, threatFilter);
  };

  // Real-time live capture status poller
  const prevCaptureRef = useRef({ packet_count: 0, time: Date.now() });
  useEffect(() => {
    if (!user) return;
    
    const interval = setInterval(async () => {
      try {
        const response = await api.get('/network/live-capture/status');
        const data = response.data;
        setCaptureStatus(data);
        
        const now = Date.now();
        const elapsed = (now - prevCaptureRef.current.time) / 1000;
        if (data.is_capturing && elapsed > 0) {
          const diff = data.packet_count - prevCaptureRef.current.packet_count;
          const pps = diff > 0 ? Math.round(diff / elapsed) : 0;
          setLivePps(pps);
        } else {
          setLivePps(0);
        }
        prevCaptureRef.current = { packet_count: data.packet_count, time: now };
      } catch (err) {
        setCaptureStatus({ is_capturing: false, packet_count: 0 });
        setLivePps(0);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    if (!user) return;

    let mounted = true;
    api.get('/health')
      .then((res) => {
        if (!mounted) return;
        console.log("[DEBUG] /health Response:", res.data);
        setDbStatus(res.data.database === 'connected' ? 'Healthy' : 'Disconnected');
        if (res.data.dataset_status) {
          setDatasetStatus(res.data.dataset_status);
        }
      })
      .catch((err) => {
        if (!mounted) return;
        console.error("[DEBUG] /health Error:", err);
        setDbStatus('Offline (Backend unreachable)');
      });

    const startPolling = async () => {
      const status = await refreshDashboard();
      if (status !== 'loading') return;

      if (pollRef.current) return;
      pollRef.current = setInterval(async () => {
        try {
          const res = await api.get('/health', { params: { _t: Date.now() } });
          const ds = res.data.dataset_status || res.data.dataset || 'loading';
          if (ds !== 'loading' && pollRef.current) {
            clearInterval(pollRef.current);
            pollRef.current = null;
            await refreshDashboard();
          }
        } catch (e) {
          // ignore transient errors
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
  }, [refreshDashboard, user]);

  // =========================================================================
  // Analyst Computed Metrics & Chart Data
  // =========================================================================

  const analystKpis = useMemo(() => {
    const total = analyticsData?.total_traffic || 0;
    const highAlerts = analyticsData?.high_threat_alerts || 0;
    const datasetAlerts = analyticsData?.dataset_alerts_count || 0;
    const liveAlerts = analyticsData?.live_alerts_count || 0;
    const totalAlerts = analyticsData?.total_alerts || (datasetAlerts + liveAlerts);
    const activeThreats = highAlerts;
    const uniqueIps = (analyticsData?.unique_source_ips || 0) + (analyticsData?.unique_destination_ips || 0);

    let securityStatus = 'SECURE';
    let securityStatusColor = 'text-emerald-400';
    let securityStatusBg = 'bg-emerald-500/10 border-emerald-500/20';

    if (activeThreats > 100 || liveAlerts > 0) {
      securityStatus = 'THREAT DETECTED';
      securityStatusColor = 'text-rose-400';
      securityStatusBg = 'bg-rose-500/10 border-rose-500/20 animate-pulse';
    } else if (activeThreats > 0 || totalAlerts > 0) {
      securityStatus = 'WARNING';
      securityStatusColor = 'text-amber-400';
      securityStatusBg = 'bg-amber-500/10 border-amber-500/20';
    }

    return {
      totalTraffic: total.toLocaleString(),
      liveTraffic: `${livePps.toLocaleString()} pps`,
      activeConnections: uniqueIps.toLocaleString(),
      totalAlerts: totalAlerts.toLocaleString(),
      datasetAlerts: datasetAlerts.toLocaleString(),
      liveAlerts: liveAlerts.toLocaleString(),
      activeThreats: activeThreats.toLocaleString(),
      securityStatus,
      securityStatusColor,
      securityStatusBg,
    };
  }, [analyticsData, livePps]);

  const trendChartData = useMemo(() => {
    const sizes = trafficRows.slice(0, 10).map((row) => Number(row.packet_size) || 0).reverse();
    const labels = trafficRows.slice(0, 10).map((row) => (row.timestamp ? row.timestamp.split(' ')[1] || row.timestamp : '')).reverse();

    return {
      labels: labels,
      datasets: [
        {
          label: 'Packet Size (Bytes)',
          data: sizes,
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.08)',
          fill: true,
          tension: 0.4,
          borderWidth: 2,
          pointBackgroundColor: '#60a5fa',
          pointBorderColor: '#1e3a8a',
          pointHoverBackgroundColor: '#fff',
          pointRadius: 3,
        },
      ],
    };
  }, [trafficRows]);

  const threatChartData = useMemo(() => {
    const dist = analyticsData?.threat_level_distribution || [];
    const low = dist.find((d) => String(d.name).toLowerCase() === 'low')?.count || 0;
    const medium = dist.find((d) => String(d.name).toLowerCase() === 'medium')?.count || 0;
    const high = dist.find((d) => String(d.name).toLowerCase() === 'high')?.count || 0;

    return {
      labels: ['Low Risk', 'Medium Risk', 'High Critical'],
      datasets: [
        {
          data: [low, medium, high],
          backgroundColor: ['#10b981', '#f59e0b', '#f43f5e'],
          borderColor: '#0f172a',
          borderWidth: 2,
          hoverOffset: 8,
        },
      ],
    };
  }, [analyticsData]);

  const attackChartData = useMemo(() => {
    const dist = analyticsData?.traffic_label_distribution || [];
    const attackTypes = dist.filter((d) => !['benign', 'normal', '0'].includes(String(d.name).toLowerCase()));
    const labels = attackTypes.map((d) => d.name);
    const counts = attackTypes.map((d) => d.count);

    return {
      labels: labels,
      datasets: [
        {
          label: 'Incident Volume',
          data: counts,
          backgroundColor: 'rgba(244, 63, 94, 0.85)',
          hoverBackgroundColor: '#f43f5e',
          borderColor: '#ef4444',
          borderWidth: 1,
          borderRadius: 4,
        },
      ],
    };
  }, [analyticsData]);

  const protocolChartData = useMemo(() => {
    const dist = analyticsData?.protocol_distribution || [];
    const labels = dist.map((d) => d.name);
    const counts = dist.map((d) => d.count);

    return {
      labels: labels,
      datasets: [
        {
          data: counts,
          backgroundColor: ['#06b6d4', '#6366f1', '#ec4899', '#3b82f6'],
          borderColor: '#0f172a',
          borderWidth: 2,
        },
      ],
    };
  }, [analyticsData]);

  const datasetChartData = useMemo(() => {
    const dist = analyticsData?.alerts_by_dataset || [];
    const labels = dist.map((d) => d.dataset_name);
    const counts = dist.map((d) => d.alert_count);

    return {
      labels: labels,
      datasets: [
        {
          label: 'Detected Threats',
          data: counts,
          backgroundColor: 'rgba(59, 130, 246, 0.85)',
          hoverBackgroundColor: '#3b82f6',
          borderColor: '#2563eb',
          borderWidth: 1,
          borderRadius: 4,
        },
      ],
    };
  }, [analyticsData]);

  const sourceChartData = useMemo(() => {
    const dist = analyticsData?.alerts_by_source || [];
    const labels = dist.map((d) => d.source);
    const counts = dist.map((d) => d.count);

    return {
      labels: labels,
      datasets: [
        {
          data: counts,
          backgroundColor: ['#3b82f6', '#f43f5e'],
          borderColor: '#0f172a',
          borderWidth: 2,
          hoverOffset: 8,
        },
      ],
    };
  }, [analyticsData]);

  const liveAlertsLog = useMemo(() => {
    return trafficRows.filter((r) => ['high', 'medium'].includes(String(r.threat_level).toLowerCase())).slice(0, 5);
  }, [trafficRows]);

  const topAttackTypes = useMemo(() => {
    const dist = analyticsData?.traffic_label_distribution || [];
    return dist
      .filter((d) => !['benign', 'normal', '0'].includes(String(d.name).toLowerCase()))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [analyticsData]);

  const topAttackedIPs = useMemo(() => {
    return (analyticsData?.top_10_destination_ips || []).slice(0, 5);
  }, [analyticsData]);

  // =========================================================================
  // Administrator Computed Metrics & Chart Data
  // =========================================================================

  const adminKpis = useMemo(() => {
    const totalUsers = usersData.length;
    const activeAnalysts = usersData.filter((u) => u.role === 'Security Analyst' && u.is_active !== false).length;
    const criticalAlerts = analyticsData?.high_threat_alerts || 0;
    const activeThreats = criticalAlerts;

    return {
      totalUsers: totalUsers.toLocaleString(),
      activeAnalysts: activeAnalysts.toLocaleString(),
      criticalAlerts: criticalAlerts.toLocaleString(),
      activeThreats: activeThreats.toLocaleString(),
      systemHealth: dbStatus === 'Healthy' && datasetStatus === 'ready' ? 'Healthy' : 'Warning',
      networkStatus: datasetStatus === 'ready' ? 'Ready' : 'Loading',
      databaseStatus: dbStatus === 'Healthy' ? 'Connected' : 'Disconnected',
      apiStatus: 'Active',
    };
  }, [usersData, analyticsData, dbStatus, datasetStatus]);

  const userRoleChartData = useMemo(() => {
    const admins = usersData.filter((u) => u.role === 'Security Administrator').length;
    const analysts = usersData.filter((u) => u.role === 'Security Analyst').length;

    return {
      labels: ['Administrators', 'Analysts'],
      datasets: [
        {
          data: [admins, analysts],
          backgroundColor: ['#3b82f6', '#8b5cf6'],
          borderColor: '#0f172a',
          borderWidth: 2,
        },
      ],
    };
  }, [usersData]);

  const datasetSummaryChartData = useMemo(() => {
    const total = statisticsData?.rows_loaded || 0;
    const processed = statisticsData?.rows_after_preprocessing || 0;
    const duplicates = statisticsData?.duplicates_removed || 0;
    const missing = statisticsData?.missing_values_removed || 0;

    return {
      labels: ['Raw Log Ingest', 'Cleaned Telemetry', 'Duplicates Removed', 'Missing Cleared'],
      datasets: [
        {
          label: 'Telemetry Rows',
          data: [total, processed, duplicates, missing],
          backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'],
          borderColor: '#0f172a',
          borderWidth: 1,
          borderRadius: 4,
        },
      ],
    };
  }, [statisticsData]);

  const systemPerformanceChartData = useMemo(() => {
    const memory = statisticsData?.memory_usage_mb || 0;
    const bootstrap = statisticsData?.startup_time_seconds || 0;

    return {
      labels: ['Memory Footprint (MB)', 'Loader Latency (Seconds)'],
      datasets: [
        {
          label: 'SOC Cluster Metrics',
          data: [memory, bootstrap],
          backgroundColor: ['#06b6d4', '#6366f1'],
          borderColor: '#0f172a',
          borderWidth: 1,
          borderRadius: 4,
        },
      ],
    };
  }, [statisticsData]);

  const latestUsers = useMemo(() => {
    return [...usersData].slice(0, 5);
  }, [usersData]);

  const latestReports = useMemo(() => {
    if (!reportsData) return [];
    return [
      { title: 'Ingested Log Analysis Summary', count: `${reportsData.rows_processed?.toLocaleString() || 0} rows`, source: 'Dataset Pipeline', status: 'Ready' },
      { title: 'Incident Response Severity Audit', count: `${reportsData.attack_records?.toLocaleString() || 0} hits`, source: 'Threat Console', status: 'Ready' },
      { title: 'Protocol Composition Map', count: `${reportsData.protocols?.length || 0} protocols`, source: 'Network Stack', status: 'Ready' },
    ];
  }, [reportsData]);

  const latestAlerts = useMemo(() => {
    return trafficRows.filter((r) => String(r.threat_level).toLowerCase() === 'high').slice(0, 5);
  }, [trafficRows]);

  const mostActiveAnalysts = useMemo(() => {
    const analysts = usersData.filter((u) => u.role === 'Security Analyst');
    return analysts.map((analyst) => {
      // Dynamic mapping: count incidents assigned to this analyst in MongoDB
      const assignedCount = incidentsData.filter(
        (inc) => inc.assigned_analyst === analyst.email || inc.assigned_analyst === analyst.full_name
      ).length;
      return {
        ...analyst,
        casesChecked: assignedCount,
        status: analyst.is_active !== false ? 'Active' : 'Standby',
      };
    }).sort((a, b) => b.casesChecked - a.casesChecked).slice(0, 5);
  }, [usersData, incidentsData]);

  // =========================================================================
  // Chart Configs & UI Helpers
  // =========================================================================

  const protocolOptions = useMemo(() => {
    const values = new Set();
    trafficRows.forEach((row) => {
      if (row.protocol) {
        values.add(String(row.protocol));
      }
    });

    if (analyticsData?.protocol_distribution?.length) {
      analyticsData.protocol_distribution.forEach((item) => values.add(item.name));
    }

    return Array.from(values).sort();
  }, [analyticsData, trafficRows]);

  const threatOptions = useMemo(() => {
    const values = new Set(['High', 'Medium', 'Low']);
    if (analyticsData?.threat_level_distribution?.length) {
      analyticsData.threat_level_distribution.forEach((item) =>
        values.add(String(item.name).charAt(0).toUpperCase() + String(item.name).slice(1))
      );
    }
    return Array.from(values).sort();
  }, [analyticsData]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: '#cbd5e1',
          boxWidth: 12,
          font: { size: 11 },
        },
      },
    },
    scales: {
      x: {
        ticks: { color: '#94a3b8', font: { size: 10 } },
        grid: { color: 'rgba(148, 163, 184, 0.08)' },
      },
      y: {
        ticks: { color: '#94a3b8', font: { size: 10 } },
        grid: { color: 'rgba(148, 163, 184, 0.08)' },
      },
    },
  };

  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          color: '#cbd5e1',
          boxWidth: 12,
          font: { size: 10 },
        },
      },
    },
  };

  // =========================================================================
  // Dashboard JSX Render Block
  // =========================================================================

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      <div className="flex min-h-screen flex-col lg:flex-row">
        {/* Sidebar */}
        <aside className="w-full border-b border-slate-900 bg-slate-950/80 p-5 lg:w-72 lg:border-b-0 lg:border-r lg:border-slate-900 lg:px-6 lg:py-8 backdrop-blur">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 font-semibold text-white shadow-[0_0_25px_rgba(37,99,235,0.45)]">
              N
            </div>
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-blue-400 font-bold">NetShield</p>
              <p className="text-xs text-slate-400">SOC Security Console</p>
            </div>
          </div>

          <nav className="space-y-2">
            {navigationItems.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => {
                  if (item.path) {
                    navigate(item.path);
                  }
                }}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition ${
                  item.label === 'Dashboard'
                    ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.1)]'
                    : 'text-slate-400 hover:bg-slate-900/60 hover:text-white'
                }`}
              >
                <span className="text-base">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </nav>

          <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
              {isAdmin ? 'System Administrator' : 'Security Analyst'}
            </p>
            <p className="mt-2 text-sm font-medium text-white">{user?.full_name || 'Security Operator'}</p>
            <p className="text-xs text-slate-500">{user?.role || 'SOC Level 1'}</p>
            <button
              type="button"
              onClick={logout}
              className="mt-4 w-full rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-400 transition hover:border-slate-600 hover:text-white"
            >
              Terminate Session
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 overflow-y-auto">
          {/* Header */}
          <header className="flex flex-col gap-4 rounded-3xl border border-slate-900 bg-slate-900/20 p-6 shadow-2xl backdrop-blur md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full bg-blue-500 animate-ping`} />
                <p className="text-xs uppercase tracking-[0.35em] text-blue-400 font-bold">
                  {isAdmin ? 'SOC SYSTEM ADMINISTRATION' : 'SOC THREAT OPERATIONS'}
                </p>
              </div>
              <h1 className="mt-2 text-2xl font-bold text-white tracking-tight">
                {isAdmin ? 'SOC Management and Control Center' : 'Cyber Defense Command Center'}
              </h1>
              <p className="mt-1 text-sm text-slate-400">
                {isAdmin
                  ? 'Configure user credentials, view system boots, and review dataset profiles.'
                  : 'Real-time ingestion, traffic preprocessing, and security posture monitoring.'}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleDownloadReport('pdf')}
                  className="flex items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3.5 py-2.5 text-xs font-semibold text-rose-300 transition hover:bg-rose-500 hover:text-white shadow-lg shadow-rose-500/20"
                  title="Export Executive PDF Threat Report"
                >
                  <span>📄</span> PDF Report
                </button>
                <button
                  type="button"
                  onClick={() => handleDownloadReport('csv')}
                  className="flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2.5 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-500 hover:text-white shadow-lg shadow-emerald-500/20"
                  title="Export Threat Intelligence CSV Data"
                >
                  <span>📊</span> CSV Report
                </button>
              </div>

              <div className="flex items-center gap-3 rounded-2xl border border-slate-900 bg-slate-950/50 px-4 py-3">
                <div
                  className={`h-2.5 w-2.5 rounded-full ${
                    dbStatus === 'Healthy'
                      ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]'
                      : 'bg-rose-400 shadow-[0_0_8px_#f87171] animate-pulse'
                  }`}
                />
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500 font-bold">Database Feed</p>
                  <p className="text-sm font-semibold text-slate-200">{dbStatus}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-2xl border border-slate-900 bg-slate-950/50 px-4 py-3">
                <div className={`h-2.5 w-2.5 rounded-full ${captureStatus.is_capturing ? 'bg-blue-400 shadow-[0_0_8px_#60a5fa] animate-pulse' : 'bg-slate-600'}`} />
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500 font-bold">Live Capture</p>
                  <p className="text-sm font-semibold text-slate-200">{captureStatus.is_capturing ? 'Capturing' : 'Inactive'}</p>
                </div>
              </div>
            </div>
          </header>

          {/* Dataset Statistics */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-slate-900 bg-slate-900/20 p-4">
              <p className="text-xs text-slate-400 font-medium uppercase">Datasets Loaded</p>
              <p className="mt-2 text-2xl font-bold text-white">{statisticsData?.datasets_loaded ?? '—'}</p>
            </div>
            <div className="rounded-2xl border border-slate-900 bg-slate-900/20 p-4">
              <p className="text-xs text-slate-400 font-medium uppercase">Total Rows Ingested</p>
              <p className="mt-2 text-2xl font-bold text-white">{statisticsData?.rows_loaded?.toLocaleString?.() ?? statisticsData?.rows_loaded ?? '—'}</p>
            </div>
            <div className="rounded-2xl border border-slate-900 bg-slate-900/20 p-4">
              <p className="text-xs text-slate-400 font-medium uppercase">Rows After Preprocessing</p>
              <p className="mt-2 text-2xl font-bold text-white">{statisticsData?.rows_after_preprocessing?.toLocaleString?.() ?? statisticsData?.rows_after_preprocessing ?? '—'}</p>
            </div>
          </section>

          {/* AI Model Evaluation Metrics (Milestone 2 Requirement) */}
          <section className="rounded-2xl border border-slate-900 bg-slate-900/20 p-5 shadow-lg backdrop-blur space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-900/80 pb-3 gap-2">
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-white">AI Model Performance Metrics</h2>
                <p className="text-xs text-slate-400">RandomForest intrusion classifiers trained on CICIDS2017 &amp; UNSW-NB15</p>
              </div>
              <span className="self-start sm:self-auto rounded-full bg-blue-500/10 border border-blue-500/30 px-3 py-1 text-xs font-semibold text-blue-400">
                Milestone 2 Models Active
              </span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
                <p className="text-[10px] uppercase font-bold text-slate-400">Model Accuracy</p>
                <p className="mt-1 text-xl font-bold text-blue-400">
                  {modelMetrics?.accuracy !== undefined && modelMetrics?.accuracy !== null ? `${(modelMetrics.accuracy * 100).toFixed(4)}%` : 'N/A'}
                </p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
                <p className="text-[10px] uppercase font-bold text-slate-400">Precision</p>
                <p className="mt-1 text-xl font-bold text-indigo-400">
                  {modelMetrics?.precision !== undefined && modelMetrics?.precision !== null ? `${(modelMetrics.precision * 100).toFixed(4)}%` : 'N/A'}
                </p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
                <p className="text-[10px] uppercase font-bold text-slate-400">Recall</p>
                <p className="mt-1 text-xl font-bold text-emerald-400">
                  {modelMetrics?.recall !== undefined && modelMetrics?.recall !== null ? `${(modelMetrics.recall * 100).toFixed(4)}%` : 'N/A'}
                </p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
                <p className="text-[10px] uppercase font-bold text-slate-400">F1 Score</p>
                <p className="mt-1 text-xl font-bold text-purple-400">
                  {modelMetrics?.f1_score !== undefined && modelMetrics?.f1_score !== null ? `${(modelMetrics.f1_score * 100).toFixed(4)}%` : 'N/A'}
                </p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
                <p className="text-[10px] uppercase font-bold text-slate-400">ROC-AUC</p>
                <p className="mt-1 text-xl font-bold text-amber-400">
                  {modelMetrics?.roc_auc !== undefined && modelMetrics?.roc_auc !== null ? `${(modelMetrics.roc_auc * 100).toFixed(4)}%` : 'N/A'}
                </p>
              </div>
            </div>
          </section>

          {/* Errors */}
          {(analyticsError || usersError || reportsError) && (
            <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 px-4 py-3 text-sm text-rose-400 space-y-1">
              {analyticsError && <p>{analyticsError}</p>}
              {usersError && <p>{usersError}</p>}
              {reportsError && <p>{reportsError}</p>}
            </div>
          )}

          {/* Conditional Layouts based on Role */}
          {isAdmin ? (
            // =================================================================
            // SECURITY ADMINISTRATOR DASHBOARD
            // =================================================================
            <div className="space-y-6">
              {/* Admin KPI Cards Grid */}
              <section className="grid gap-4 grid-cols-2 md:grid-cols-4 xl:grid-cols-8">
                <div className="rounded-2xl border border-slate-900 bg-slate-900/20 p-4 shadow-lg backdrop-blur">
                  <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Total Users</p>
                  <p className="mt-2 text-2xl font-bold text-white tracking-tight">{adminKpis.totalUsers}</p>
                  <p className="mt-1 text-slate-500 text-[10px]">Registered accounts</p>
                </div>
                <div className="rounded-2xl border border-slate-900 bg-slate-900/20 p-4 shadow-lg backdrop-blur">
                  <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Active Analysts</p>
                  <p className="mt-2 text-2xl font-bold text-violet-400 tracking-tight">{adminKpis.activeAnalysts}</p>
                  <p className="mt-1 text-slate-500 text-[10px]">SOC operators active</p>
                </div>
                <div className="rounded-2xl border border-slate-900 bg-slate-900/20 p-4 shadow-lg backdrop-blur">
                  <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Critical Alerts</p>
                  <p className="mt-2 text-2xl font-bold text-rose-500 tracking-tight">{adminKpis.criticalAlerts}</p>
                  <p className="mt-1 text-slate-500 text-[10px]">High risk packets</p>
                </div>
                <div className="rounded-2xl border border-slate-900 bg-slate-900/20 p-4 shadow-lg backdrop-blur">
                  <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Active Threats</p>
                  <p className="mt-2 text-2xl font-bold text-rose-400 tracking-tight">{adminKpis.activeThreats}</p>
                  <p className="mt-1 text-slate-500 text-[10px]">Incidents currently open</p>
                </div>
                <div className="rounded-2xl border border-slate-900 bg-slate-900/20 p-4 shadow-lg backdrop-blur">
                  <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">System Health</p>
                  <p className={`mt-2 text-2xl font-bold ${adminKpis.systemHealth === 'Healthy' ? 'text-emerald-400' : 'text-amber-500'} tracking-tight`}>
                    {adminKpis.systemHealth}
                  </p>
                  <p className="mt-1 text-slate-500 text-[10px]">Overall status state</p>
                </div>
                <div className="rounded-2xl border border-slate-900 bg-slate-900/20 p-4 shadow-lg backdrop-blur">
                  <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Network Status</p>
                  <p className="mt-2 text-2xl font-bold text-blue-400 tracking-tight">{adminKpis.networkStatus}</p>
                  <p className="mt-1 text-slate-500 text-[10px]">Ingest engine state</p>
                </div>
                <div className="rounded-2xl border border-slate-900 bg-slate-900/20 p-4 shadow-lg backdrop-blur">
                  <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Database Status</p>
                  <p className={`mt-2 text-2xl font-bold ${adminKpis.databaseStatus === 'Connected' ? 'text-emerald-400' : 'text-rose-500'} tracking-tight`}>
                    {adminKpis.databaseStatus}
                  </p>
                  <p className="mt-1 text-slate-500 text-[10px]">MongoDB client feed</p>
                </div>
                <div className="rounded-2xl border border-slate-900 bg-slate-900/20 p-4 shadow-lg backdrop-blur">
                  <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">API Status</p>
                  <p className="mt-2 text-2xl font-bold text-cyan-400 tracking-tight">{adminKpis.apiStatus}</p>
                  <p className="mt-1 text-slate-500 text-[10px]">Gateway status</p>
                </div>
              </section>

              {/* Admin Charts Section */}
              <section className="grid gap-6 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-900 bg-slate-900/25 p-5 backdrop-blur">
                  <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-300 mb-3">User Role Composition</h2>
                  <div className="h-60">
                    {usersData.length > 0 ? (
                      <Doughnut data={userRoleChartData} options={pieChartOptions} />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-slate-500 font-medium">No user data available</div>
                    )}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-900 bg-slate-900/25 p-5 backdrop-blur">
                  <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-300 mb-3">Ingested Dataset Profile Summary</h2>
                  <div className="h-60">
                    {statisticsData?.rows_loaded > 0 ? (
                      <Bar data={datasetSummaryChartData} options={chartOptions} />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-slate-500 font-medium">No dataset profile telemetry loaded</div>
                    )}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-900 bg-slate-900/25 p-5 backdrop-blur">
                  <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-300 mb-3">Operational Threat Latency Trend</h2>
                  <div className="h-60">
                    {trafficRows.length > 0 ? (
                      <Line data={trendChartData} options={chartOptions} />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-slate-500 font-medium">No traffic throughput telemetry available</div>
                    )}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-900 bg-slate-900/25 p-5 backdrop-blur">
                  <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-300 mb-3">SOC Cluster Hardware Performance</h2>
                  <div className="h-60">
                    {statisticsData?.memory_usage_mb > 0 || statisticsData?.startup_time_seconds > 0 ? (
                      <Bar data={systemPerformanceChartData} options={chartOptions} />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-slate-500 font-medium">No system cluster statistics available</div>
                    )}
                  </div>
                </div>
              </section>

              {/* Admin Tables Section */}
              <section className="grid gap-6 xl:grid-cols-2">
                {/* Table 1: Latest Registered Users */}
                <div className="rounded-2xl border border-slate-900 bg-slate-900/20 p-5 backdrop-blur">
                  <h3 className="text-sm font-bold text-white mb-3">Latest Registered Users</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-left text-xs font-sans">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase pb-2">
                          <th className="pb-2">Full Name</th>
                          <th className="pb-2">Email</th>
                          <th className="pb-2">Role</th>
                          <th className="pb-2">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {usersLoading ? (
                          <tr>
                            <td colSpan="4" className="py-4 text-center text-slate-500">Querying credentials...</td>
                          </tr>
                        ) : latestUsers.length === 0 ? (
                          <tr>
                            <td colSpan="4" className="py-4 text-center text-slate-500">No users found.</td>
                          </tr>
                        ) : (
                          latestUsers.map((item, idx) => (
                            <tr key={idx} className="border-b border-slate-900/60 text-slate-300">
                              <td className="py-2.5 font-semibold text-slate-200">{item.full_name}</td>
                              <td className="py-2.5 font-mono">{item.email}</td>
                              <td className="py-2.5">{item.role}</td>
                              <td className="py-2.5 text-xs">
                                <span className={`rounded-full px-2 py-0.5 text-[10px] ${item.is_active !== false ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
                                  {item.is_active !== false ? 'ACTIVE' : 'INACTIVE'}
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Table 2: Latest System Reports */}
                <div className="rounded-2xl border border-slate-900 bg-slate-900/20 p-5 backdrop-blur">
                  <h3 className="text-sm font-bold text-white mb-3">Operational Assessment Reports</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-left text-xs font-sans">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase pb-2">
                          <th className="pb-2">Report Profile</th>
                          <th className="pb-2">Volume/Metric</th>
                          <th className="pb-2">Module Source</th>
                          <th className="pb-2">State</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reportsLoading ? (
                          <tr>
                            <td colSpan="4" className="py-4 text-center text-slate-500">Compiling report data...</td>
                          </tr>
                        ) : latestReports.length === 0 ? (
                          <tr>
                            <td colSpan="4" className="py-4 text-center text-slate-500">No report metrics loaded.</td>
                          </tr>
                        ) : (
                          latestReports.map((item, idx) => (
                            <tr key={idx} className="border-b border-slate-900/60 text-slate-300">
                              <td className="py-2.5 font-semibold text-slate-200">{item.title}</td>
                              <td className="py-2.5 font-mono">{item.count}</td>
                              <td className="py-2.5">{item.source}</td>
                              <td className="py-2.5">
                                <span className="bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-full text-[10px] border border-blue-500/20">
                                  {item.status}
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Table 3: Latest Critical Incident Alarms */}
                <div className="rounded-2xl border border-slate-900 bg-slate-900/20 p-5 backdrop-blur">
                  <h3 className="text-sm font-bold text-white mb-3">Latest Critical Incident Alarms</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-left text-xs font-sans">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase pb-2">
                          <th className="pb-2">Timestamp</th>
                          <th className="pb-2">Connection IPs</th>
                          <th className="pb-2">Incident Category</th>
                          <th className="pb-2">Risk</th>
                        </tr>
                      </thead>
                      <tbody className="font-mono">
                        {latestAlerts.length === 0 ? (
                          <tr>
                            <td colSpan="4" className="py-4 text-center text-slate-500 font-sans italic">No critical threat alerts in feed buffer.</td>
                          </tr>
                        ) : (
                          latestAlerts.map((item, idx) => (
                            <tr key={idx} className="border-b border-slate-900/60 text-slate-300">
                              <td className="py-2.5 text-slate-400 text-[10px]">{item.timestamp}</td>
                              <td className="py-2.5 text-xs text-slate-200">
                                {item.source_ip} &rarr; {item.destination_ip}
                              </td>
                              <td className="py-2.5 text-rose-400 font-semibold">{item.traffic_label}</td>
                              <td className="py-2.5 font-sans">
                                <span className="bg-rose-500/20 text-rose-300 border border-rose-500/40 px-2 py-0.5 rounded text-[10px] font-bold">
                                  CRITICAL
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Table 4: Active SOC Analysts */}
                <div className="rounded-2xl border border-slate-900 bg-slate-900/20 p-5 backdrop-blur">
                  <h3 className="text-sm font-bold text-white mb-3">Active SOC Analysts</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-left text-xs font-sans">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase pb-2">
                          <th className="pb-2">Analyst Operator</th>
                          <th className="pb-2">Email</th>
                          <th className="pb-2">Alarms Verified</th>
                          <th className="pb-2">Presence</th>
                        </tr>
                      </thead>
                      <tbody>
                        {mostActiveAnalysts.length === 0 ? (
                          <tr>
                            <td colSpan="4" className="py-4 text-center text-slate-500 italic">No Security Analysts registered.</td>
                          </tr>
                        ) : (
                          mostActiveAnalysts.map((item, idx) => (
                            <tr key={idx} className="border-b border-slate-900/60 text-slate-300 font-medium">
                              <td className="py-2.5 font-semibold text-slate-200">{item.full_name}</td>
                              <td className="py-2.5 font-mono">{item.email}</td>
                              <td className="py-2.5 font-mono">{item.casesChecked} checks</td>
                              <td className="py-2.5">
                                <span className={`rounded-full px-2 py-0.5 text-[9px] uppercase font-bold ${item.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-800 text-slate-500 border border-slate-700'}`}>
                                  {item.status}
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>
            </div>
          ) : (
            // =================================================================
            // SECURITY ANALYST DASHBOARD (EXISTING)
            // =================================================================
            <div className="space-y-6">
              {/* KPI Cards Grid */}
              <section className="grid gap-4 grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
                <div className="rounded-2xl border border-slate-900 bg-slate-900/20 p-4 shadow-lg backdrop-blur">
                  <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Total Traffic</p>
                  <p className="mt-2 text-2xl font-bold text-white tracking-tight">{analystKpis.totalTraffic}</p>
                  <p className="mt-1 text-xs text-slate-500">Ingested Telemetry</p>
                </div>
                <div className="rounded-2xl border border-slate-900 bg-slate-900/20 p-4 shadow-lg backdrop-blur relative overflow-hidden">
                  <div className="absolute top-0 right-0 h-1.5 w-1.5 bg-blue-500 rounded-full m-3 animate-ping" />
                  <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Live Traffic</p>
                  <p className="mt-2 text-2xl font-bold text-blue-400 tracking-tight">{analystKpis.liveTraffic}</p>
                  <p className="mt-1 text-xs text-slate-500">Real-time pps</p>
                </div>
                <div className="rounded-2xl border border-slate-900 bg-slate-900/20 p-4 shadow-lg backdrop-blur">
                  <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Dataset Alerts</p>
                  <p className="mt-2 text-2xl font-bold text-blue-400 tracking-tight">{analystKpis.datasetAlerts}</p>
                  <p className="mt-1 text-xs text-slate-500">12 Datasets ML Detections</p>
                </div>
                <div className="rounded-2xl border border-slate-900 bg-slate-900/20 p-4 shadow-lg backdrop-blur">
                  <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Live Alerts</p>
                  <p className="mt-2 text-2xl font-bold text-rose-400 tracking-tight">{analystKpis.liveAlerts}</p>
                  <p className="mt-1 text-xs text-slate-500">Live Network Threat Hits</p>
                </div>
                <div className="rounded-2xl border border-slate-900 bg-slate-900/20 p-4 shadow-lg backdrop-blur">
                  <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Total Alerts</p>
                  <p className="mt-2 text-2xl font-bold text-amber-400 tracking-tight">{analystKpis.totalAlerts}</p>
                  <p className="mt-1 text-xs text-slate-500">Combined Threat Incidents</p>
                </div>
                <div className={`rounded-2xl border p-4 shadow-lg backdrop-blur transition-all ${analystKpis.securityStatusBg}`}>
                  <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Security Status</p>
                  <p className={`mt-2 text-xl font-black ${analystKpis.securityStatusColor} tracking-tighter`}>
                    {analystKpis.securityStatus}
                  </p>
                  <p className="mt-1.5 text-xs text-slate-500">System state assessment</p>
                </div>
              </section>

              {/* Charts Section */}
              <section className="grid gap-6 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-900 bg-slate-900/25 p-5 backdrop-blur">
                  <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-300 mb-3">Traffic Throughput Trend</h2>
                  <div className="h-64">
                    {trafficRows.length > 0 ? (
                      <Line data={trendChartData} options={chartOptions} />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-slate-500 font-medium pb-8">No traffic throughput data available</div>
                    )}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-900 bg-slate-900/25 p-5 backdrop-blur">
                  <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-300 mb-3">Alerts by Source (Dataset vs Live Network)</h2>
                  <div className="h-64">
                    {analyticsData?.alerts_by_source?.length > 0 ? (
                      <Doughnut data={sourceChartData} options={pieChartOptions} />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-slate-500 font-medium pb-8">No alert source distribution data available</div>
                    )}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-900 bg-slate-900/25 p-5 backdrop-blur">
                  <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-300 mb-3">Threat Risk Level Distribution</h2>
                  <div className="h-64">
                    {analyticsData?.threat_level_distribution?.some(d => d.count > 0) ? (
                      <Doughnut data={threatChartData} options={pieChartOptions} />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-slate-500 font-medium pb-8">No threat risk level distribution data available</div>
                    )}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-900 bg-slate-900/25 p-5 backdrop-blur">
                  <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-300 mb-3">Attack Category Distribution</h2>
                  <div className="h-64">
                    {analyticsData?.traffic_label_distribution?.some(d => !['benign', 'normal', '0'].includes(String(d.name).toLowerCase()) && d.count > 0) ? (
                      <Bar data={attackChartData} options={chartOptions} />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-slate-500 font-medium pb-8">No malicious attack categories detected</div>
                    )}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-900 bg-slate-900/25 p-5 backdrop-blur">
                  <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-300 mb-3">IP Traffic Protocol Distribution</h2>
                  <div className="h-64">
                    {analyticsData?.protocol_distribution?.length > 0 ? (
                      <Doughnut data={protocolChartData} options={pieChartOptions} />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-slate-500 font-medium pb-8">No protocol distribution data available</div>
                    )}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-900 bg-slate-900/25 p-5 backdrop-blur md:col-span-2">
                  <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-300 mb-3">Threat Alerts by Dataset (All 12 Datasets)</h2>
                  <div className="h-64">
                    {analyticsData?.alerts_by_dataset?.length > 0 ? (
                      <Bar data={datasetChartData} options={chartOptions} />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-slate-500 font-medium pb-8">No dataset telemetry alerts found</div>
                    )}
                  </div>
                </div>
              </section>

              {/* Widgets Section */}
              <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl border border-slate-900 bg-slate-900/25 p-5 backdrop-blur space-y-4">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Network & System Health</h3>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between border-b border-slate-900/60 pb-1.5">
                      <span className="text-slate-400">Database node</span>
                      <span className={`font-semibold ${dbStatus === 'Healthy' ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {dbStatus === 'Healthy' ? 'CONNECTED' : 'DISCONNECTED'}
                      </span>
                    </div>
                    <div className="flex justify-between border-b border-slate-900/60 pb-1.5">
                      <span className="text-slate-400">Pipeline loading</span>
                      <span className="font-semibold text-blue-400 uppercase">{datasetStatus}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-900/60 pb-1.5">
                      <span className="text-slate-400">Memory footprint</span>
                      <span className="font-semibold text-slate-200">
                        {statisticsData?.memory_usage_mb ? `${statisticsData.memory_usage_mb.toFixed(1)} MB` : '0 MB'}
                      </span>
                    </div>
                    <div className="flex justify-between border-b border-slate-900/60 pb-1.5">
                      <span className="text-slate-400">Ingested rows</span>
                      <span className="font-semibold text-slate-200">
                        {statisticsData?.rows_loaded?.toLocaleString() || '0'}
                      </span>
                    </div>
                    <div className="flex justify-between pb-1">
                      <span className="text-slate-400">Server Latency</span>
                      <span className="font-semibold text-slate-200">
                        {statisticsData?.startup_time_seconds ? `${statisticsData.startup_time_seconds}s` : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-900 bg-slate-900/25 p-5 backdrop-blur flex flex-col">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">Live Alerts Log</h3>
                  <div className="flex-1 space-y-2.5 overflow-y-auto max-h-48 text-xs">
                    {liveAlertsLog.length === 0 ? (
                      <p className="text-slate-500 italic py-4 text-center">No critical incident alerts logged in buffer.</p>
                    ) : (
                      liveAlertsLog.map((alert, index) => (
                        <div key={index} className="border-l-2 border-rose-500 bg-rose-500/5 p-2 rounded-r-md space-y-1">
                          <div className="flex justify-between font-medium">
                            <span className="text-rose-300">{alert.traffic_label || 'Malicious Attack'}</span>
                            <span className="text-[10px] text-slate-500">{alert.timestamp?.split(' ')[1] || alert.timestamp}</span>
                          </div>
                          <p className="text-[10px] text-slate-400">
                            {alert.source_ip} &rarr; {alert.destination_ip}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-900 bg-slate-900/25 p-5 backdrop-blur">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">Top Attack Classes</h3>
                  <div className="space-y-2 text-xs">
                    {topAttackTypes.length === 0 ? (
                      <p className="text-slate-500 italic py-4 text-center">No attack categories loaded.</p>
                    ) : (
                      topAttackTypes.map((type, index) => (
                        <div key={index} className="flex justify-between items-center border-b border-slate-900/60 pb-1.5 last:border-0 last:pb-0">
                          <span className="text-slate-300 truncate max-w-[140px] font-medium">{type.name}</span>
                          <span className="bg-rose-500/10 text-rose-400 px-2 py-0.5 rounded font-mono text-[10px] border border-rose-500/20">
                            {type.count.toLocaleString()}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-900 bg-slate-900/25 p-5 backdrop-blur">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">Top Targeted IPs</h3>
                  <div className="space-y-2 text-xs">
                    {topAttackedIPs.length === 0 ? (
                      <p className="text-slate-500 italic py-4 text-center">No victim IP analytics loaded.</p>
                    ) : (
                      topAttackedIPs.map((item, index) => (
                        <div key={index} className="flex justify-between items-center border-b border-slate-900/60 pb-1.5 last:border-0 last:pb-0 font-mono font-medium">
                          <span className="text-slate-300">{item.ip}</span>
                          <span className="bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded text-[10px]">
                            {item.count.toLocaleString()} hits
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </section>
            </div>
          )}

          {/* 4. Recent Threat Table (Available on Both Dashboards) */}
          <section className="rounded-3xl border border-slate-900 bg-slate-900/20 p-6 backdrop-blur font-medium">
            <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between font-sans">
              <div>
                <h2 className="text-lg font-bold text-white tracking-tight">Recent Threat Feed</h2>
                <p className="text-sm text-slate-400 font-normal">Processed network telemetry alerts from the active inspection queue</p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      handleApplyFilters();
                    }
                  }}
                  placeholder="Search IP / Attack"
                  className="rounded-lg border border-slate-800 bg-slate-950 px-3.5 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-blue-500 transition-colors"
                />
                <select
                  value={protocolFilter}
                  onChange={(event) => setProtocolFilter(event.target.value)}
                  className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-blue-500 transition-colors animate-none"
                >
                  <option value="">All Protocols</option>
                  {protocolOptions.map((protocol) => (
                    <option key={protocol} value={protocol}>
                      {protocol}
                    </option>
                  ))}
                </select>
                <select
                  value={threatFilter}
                  onChange={(event) => setThreatFilter(event.target.value)}
                  className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-blue-500 transition-colors animate-none"
                >
                  <option value="">All Threat Levels</option>
                  {threatOptions.map((level) => (
                    <option key={level} value={level}>
                      {level}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={handleApplyFilters}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500 shadow-[0_0_15px_rgba(37,99,235,0.3)] hover:shadow-[0_0_20px_rgba(37,99,235,0.5)]"
                >
                  Apply Filters
                </button>
              </div>
            </div>

            {trafficError && (
              <div className="mb-4 rounded-xl border border-rose-500/20 bg-rose-500/5 px-4 py-3 text-sm text-rose-400 font-sans">
                {trafficError}
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-xs font-sans">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                    <th className="pb-3 font-semibold">Timestamp</th>
                    <th className="pb-3 font-semibold">Source IP</th>
                    <th className="pb-3 font-semibold">Destination IP</th>
                    <th className="pb-3 font-semibold">Source Port</th>
                    <th className="pb-3 font-semibold">Destination Port</th>
                    <th className="pb-3 font-semibold">Protocol</th>
                    <th className="pb-3 font-semibold">Attack Type</th>
                    <th className="pb-3 font-semibold">Threat Level</th>
                    <th className="pb-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="font-mono">
                  {trafficLoading ? (
                    <tr>
                      <td className="py-8 text-slate-400 text-center" colSpan="9">
                        <LoadingSpinner label={datasetStatus === 'loading' ? 'Ingesting traffic logs...' : 'Querying telemetry...'} />
                      </td>
                    </tr>
                  ) : trafficRows.length === 0 ? (
                    <tr>
                      <td className="py-8 text-slate-400 text-center" colSpan="9">
                        No threat traffic logs registered for current filters.
                      </td>
                    </tr>
                  ) : (
                    trafficRows.map((row, index) => (
                      <tr
                        key={`${row.timestamp}-${row.source_ip}-${row.destination_ip}-${index}`}
                        className="border-b border-slate-900/60 hover:bg-slate-900/20 text-slate-300 transition-colors"
                      >
                        <td className="py-3 text-slate-400 text-[11px]">{row.timestamp || '—'}</td>
                        <td className="py-3 font-bold text-slate-200">{row.source_ip || '—'}</td>
                        <td className="py-3 text-slate-200">{row.destination_ip || '—'}</td>
                        <td className="py-3">{row.source_port ?? '—'}</td>
                        <td className="py-3">{row.destination_port ?? '—'}</td>
                        <td className="py-3 text-blue-400 font-semibold">{row.protocol || '—'}</td>
                        <td className="py-3 text-rose-400 font-semibold">{row.traffic_label || 'BENIGN'}</td>
                        <td className="py-3 font-sans">
                          <span className={`rounded px-2.5 py-0.5 text-[10px] ${getThreatClasses(row.threat_level)}`}>
                            {row.threat_level || 'Low'}
                          </span>
                        </td>
                        <td className="py-3 font-sans">
                          <span className={`rounded-full px-2 py-0.5 text-[9px] ${getStatusClasses(row.threat_level)}`}>
                            {getStatus(row.threat_level)}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between text-xs font-sans">
              <p className="text-slate-400">
                Displaying <span className="font-semibold text-slate-200">{trafficRows.length}</span> of{' '}
                <span className="font-semibold text-slate-200">{trafficTotal.toLocaleString()}</span> alarms
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => loadTraffic(Math.max(1, trafficPage - 1), search, protocolFilter, threatFilter)}
                  disabled={trafficPage === 1}
                  className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-slate-300 transition hover:border-slate-700 disabled:cursor-not-allowed disabled:opacity-40 font-semibold"
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() => loadTraffic(trafficPage + 1, search, protocolFilter, threatFilter)}
                  disabled={trafficRows.length < defaultTrafficLimit}
                  className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-slate-300 transition hover:border-slate-700 disabled:cursor-not-allowed disabled:opacity-40 font-semibold"
                >
                  Next
                </button>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
