import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
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
  const { theme, toggleTheme, isDark } = useTheme();
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
      const endpoint = isAdmin ? '/incidents' : '/incidents/my-assigned';
      const response = await api.get(endpoint);
      setIncidentsData(response.data || []);
    } catch (err) {
      setIncidentsData([]);
    }
  }, [isAdmin]);

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

  // Analyst Personal Assigned Incident Workload Metrics & Charts
  const analystWorkloadKpis = useMemo(() => {
    const totalAssigned = incidentsData.length;
    const openIncidents = incidentsData.filter((i) => String(i.status || '').toLowerCase() === 'open').length;
    const investigatingIncidents = incidentsData.filter((i) => String(i.status || '').toLowerCase() === 'investigating').length;
    const resolvedIncidents = incidentsData.filter((i) => ['resolved', 'closed'].includes(String(i.status || '').toLowerCase())).length;
    const criticalHighAssigned = incidentsData.filter((i) => ['critical', 'high'].includes(String(i.severity || i.threat_level || '').toLowerCase())).length;

    let statusLabel = 'ALL CLEAR';
    let statusColor = 'text-emerald-400';
    let statusBg = 'bg-emerald-500/10 border-emerald-500/20';

    if (openIncidents > 5) {
      statusLabel = 'HEAVY LOAD';
      statusColor = 'text-rose-400';
      statusBg = 'bg-rose-500/10 border-rose-500/20 animate-pulse';
    } else if (openIncidents > 0 || investigatingIncidents > 0) {
      statusLabel = 'ACTIVE CASES';
      statusColor = 'text-amber-400';
      statusBg = 'bg-amber-500/10 border-amber-500/20';
    }

    return {
      totalAssigned: totalAssigned.toLocaleString(),
      openIncidents: openIncidents.toLocaleString(),
      investigatingIncidents: investigatingIncidents.toLocaleString(),
      resolvedIncidents: resolvedIncidents.toLocaleString(),
      criticalHighAssigned: criticalHighAssigned.toLocaleString(),
      statusLabel,
      statusColor,
      statusBg,
    };
  }, [incidentsData]);

  const assignedSeverityChartData = useMemo(() => {
    const normalizeSev = (val) => {
      const s = String(val || '').trim().toLowerCase();
      if (s.includes('critical')) return 'Critical';
      if (s.includes('high')) return 'High';
      if (s.includes('medium')) return 'Medium';
      if (s.includes('low')) return 'Low';
      return null;
    };

    const critical = incidentsData.filter((i) => normalizeSev(i.priority || i.severity || i.threat_level) === 'Critical').length;
    const high = incidentsData.filter((i) => normalizeSev(i.priority || i.severity || i.threat_level) === 'High').length;
    const medium = incidentsData.filter((i) => normalizeSev(i.priority || i.severity || i.threat_level) === 'Medium').length;
    const low = incidentsData.filter((i) => normalizeSev(i.priority || i.severity || i.threat_level) === 'Low').length;
    const totalCount = critical + high + medium + low;

    return {
      totalCount,
      chartData: {
        labels: ['Critical', 'High', 'Medium', 'Low'],
        datasets: [
          {
            data: [critical, high, medium, low],
            backgroundColor: ['#ef4444', '#f43f5e', '#f59e0b', '#10b981'],
            borderColor: isDark ? '#0f172a' : '#ffffff',
            borderWidth: 2,
            hoverOffset: 8,
          },
        ],
      },
    };
  }, [incidentsData, isDark]);

  const assignedStatusChartData = useMemo(() => {
    const normalizeStat = (val) => {
      const s = String(val || '').trim().toLowerCase();
      if (['open', 'new'].includes(s)) return 'Open';
      if (['acknowledged', 'ack'].includes(s)) return 'Acknowledged';
      if (['investigating', 'investigation', 'in progress', 'in_progress', 'under investigation', 'under_investigation'].includes(s)) return 'Investigating';
      if (['resolved', 'resolve'].includes(s)) return 'Resolved';
      if (['closed', 'close'].includes(s)) return 'Closed';
      return 'Open';
    };

    const open = incidentsData.filter((i) => normalizeStat(i.status) === 'Open').length;
    const acknowledged = incidentsData.filter((i) => normalizeStat(i.status) === 'Acknowledged').length;
    const investigating = incidentsData.filter((i) => normalizeStat(i.status) === 'Investigating').length;
    const resolved = incidentsData.filter((i) => normalizeStat(i.status) === 'Resolved').length;
    const closed = incidentsData.filter((i) => normalizeStat(i.status) === 'Closed').length;
    const totalCount = open + acknowledged + investigating + resolved + closed;

    return {
      totalCount,
      chartData: {
        labels: ['Open', 'Acknowledged', 'Investigating', 'Resolved', 'Closed'],
        datasets: [
          {
            label: 'Assigned Cases Status',
            data: [open, acknowledged, investigating, resolved, closed],
            backgroundColor: ['#ef4444', '#3b82f6', '#f59e0b', '#10b981', '#64748b'],
            borderColor: isDark ? '#0f172a' : '#ffffff',
            borderWidth: 1,
            borderRadius: 4,
          },
        ],
      },
    };
  }, [incidentsData, isDark]);

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
      const analystId = String(analyst.id || analyst._id || '');
      const assignedCount = incidentsData.filter(
        (inc) =>
          (inc.assigned_analyst_id && String(inc.assigned_analyst_id) === analystId) ||
          inc.assigned_analyst === analyst.email ||
          inc.assigned_analyst === analyst.full_name ||
          inc.assigned_analyst_name === analyst.full_name
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

  const chartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: isDark ? '#cbd5e1' : '#0f172a',
            boxWidth: 12,
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
          ticks: { color: isDark ? '#94a3b8' : '#1e293b', font: { size: 10, weight: '600' } },
          grid: { color: isDark ? 'rgba(148, 163, 184, 0.08)' : 'rgba(15, 23, 42, 0.08)' },
        },
        y: {
          ticks: { color: isDark ? '#94a3b8' : '#1e293b', font: { size: 10, weight: '600' } },
          grid: { color: isDark ? 'rgba(148, 163, 184, 0.08)' : 'rgba(15, 23, 42, 0.08)' },
        },
      },
    }),
    [isDark]
  );

  const pieChartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right',
          labels: {
            color: isDark ? '#cbd5e1' : '#0f172a',
            boxWidth: 12,
            font: { size: 10, weight: '600' },
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
    }),
    [isDark]
  );

  // =========================================================================
  // Dashboard JSX Render Block
  // =========================================================================

  return (
    <div className="min-h-screen font-sans" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      <div className="flex min-h-screen flex-col lg:flex-row">
        {/* Sidebar */}
        <aside
          className="w-full border-b p-5 lg:w-72 lg:border-b-0 lg:border-r lg:px-6 lg:py-8 backdrop-blur"
          style={{ backgroundColor: 'var(--bg-sidebar)', borderColor: 'var(--border-primary)' }}
        >
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 font-semibold text-white shadow-[0_0_25px_rgba(37,99,235,0.45)]">
              N
            </div>
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-blue-400 font-bold">NetShield</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>SOC Security Console</p>
            </div>
          </div>

          <nav className="space-y-1">
            {navigationItems.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => {
                  if (item.path) {
                    navigate(item.path);
                  }
                }}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition"
                style={item.label === 'Dashboard'
                  ? { backgroundColor: 'var(--accent-blue-bg)', color: 'var(--accent-blue)', border: '1px solid var(--border-accent)', fontWeight: 700 }
                  : { color: 'var(--text-secondary)' }
                }
              >
                <span className="text-base">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </nav>

          {/* Theme Toggle */}
          <div className="mt-6">
            <button
              type="button"
              onClick={toggleTheme}
              className="theme-toggle-btn w-full justify-center"
              id="dashboard-theme-toggle"
            >
              <span>{isDark ? '☀️' : '🌙'}</span>
              <span>{isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}</span>
            </button>
          </div>

          <div
            className="mt-4 rounded-2xl border p-4"
            style={{ borderColor: 'var(--border-primary)', backgroundColor: 'var(--bg-card)' }}
          >
            <p className="text-xs uppercase tracking-[0.3em]" style={{ color: 'var(--text-muted)' }}>
              {isAdmin ? 'System Administrator' : 'Security Analyst'}
            </p>
            <p className="mt-2 text-sm font-medium" style={{ color: 'var(--text-heading)' }}>
              {user?.full_name || 'Security Operator'}
            </p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{user?.role || 'SOC Level 1'}</p>
            <button
              type="button"
              onClick={logout}
              className="mt-4 w-full rounded-lg border px-3 py-2 text-sm transition hover:bg-rose-600 hover:text-white hover:border-rose-600"
              style={{ borderColor: 'var(--border-secondary)', color: 'var(--text-label)' }}
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
              <p className="mt-2 text-2xl font-bold text-white stat-value-default">{statisticsData?.datasets_loaded ?? '—'}</p>
            </div>
            <div className="rounded-2xl border border-slate-900 bg-slate-900/20 p-4">
              <p className="text-xs text-slate-400 font-medium uppercase">Total Rows Ingested</p>
              <p className="mt-2 text-2xl font-bold text-white stat-value-default">{statisticsData?.rows_loaded?.toLocaleString?.() ?? statisticsData?.rows_loaded ?? '—'}</p>
            </div>
            <div className="rounded-2xl border border-slate-900 bg-slate-900/20 p-4">
              <p className="text-xs text-slate-400 font-medium uppercase">Rows After Preprocessing</p>
              <p className="mt-2 text-2xl font-bold text-white stat-value-default">{statisticsData?.rows_after_preprocessing?.toLocaleString?.() ?? statisticsData?.rows_after_preprocessing ?? '—'}</p>
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
                <p className="mt-1 text-xl font-bold text-blue-400 stat-value-blue">
                  {modelMetrics?.accuracy !== undefined && modelMetrics?.accuracy !== null ? `${(modelMetrics.accuracy * 100).toFixed(4)}%` : 'N/A'}
                </p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
                <p className="text-[10px] uppercase font-bold text-slate-400">Precision</p>
                <p className="mt-1 text-xl font-bold text-indigo-400 stat-value-indigo">
                  {modelMetrics?.precision !== undefined && modelMetrics?.precision !== null ? `${(modelMetrics.precision * 100).toFixed(4)}%` : 'N/A'}
                </p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
                <p className="text-[10px] uppercase font-bold text-slate-400">Recall</p>
                <p className="mt-1 text-xl font-bold text-emerald-400 stat-value-emerald">
                  {modelMetrics?.recall !== undefined && modelMetrics?.recall !== null ? `${(modelMetrics.recall * 100).toFixed(4)}%` : 'N/A'}
                </p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
                <p className="text-[10px] uppercase font-bold text-slate-400">F1 Score</p>
                <p className="mt-1 text-xl font-bold text-purple-400 stat-value-purple">
                  {modelMetrics?.f1_score !== undefined && modelMetrics?.f1_score !== null ? `${(modelMetrics.f1_score * 100).toFixed(4)}%` : 'N/A'}
                </p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
                <p className="text-[10px] uppercase font-bold text-slate-400">ROC-AUC</p>
                <p className="mt-1 text-xl font-bold text-amber-400 stat-value-amber">
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
                  <p className="mt-2 text-2xl font-bold text-white tracking-tight stat-value-default">{adminKpis.totalUsers}</p>
                  <p className="mt-1 text-slate-500 text-[10px]">Registered accounts</p>
                </div>
                <div className="rounded-2xl border border-slate-900 bg-slate-900/20 p-4 shadow-lg backdrop-blur">
                  <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Active Analysts</p>
                  <p className="mt-2 text-2xl font-bold text-violet-400 tracking-tight stat-value-purple">{adminKpis.activeAnalysts}</p>
                  <p className="mt-1 text-slate-500 text-[10px]">SOC operators active</p>
                </div>
                <div className="rounded-2xl border border-slate-900 bg-slate-900/20 p-4 shadow-lg backdrop-blur">
                  <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Critical Alerts</p>
                  <p className="mt-2 text-2xl font-bold text-rose-500 tracking-tight stat-value-rose">{adminKpis.criticalAlerts}</p>
                  <p className="mt-1 text-slate-500 text-[10px]">High risk packets</p>
                </div>
                <div className="rounded-2xl border border-slate-900 bg-slate-900/20 p-4 shadow-lg backdrop-blur">
                  <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Active Threats</p>
                  <p className="mt-2 text-2xl font-bold text-rose-400 tracking-tight stat-value-rose">{adminKpis.activeThreats}</p>
                  <p className="mt-1 text-slate-500 text-[10px]">Incidents currently open</p>
                </div>
                <div className="rounded-2xl border border-slate-900 bg-slate-900/20 p-4 shadow-lg backdrop-blur">
                  <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">System Health</p>
                  <p className={`mt-2 text-2xl font-bold ${adminKpis.systemHealth === 'Healthy' ? 'text-emerald-400 stat-value-emerald' : 'text-amber-500 stat-value-amber'} tracking-tight`}>
                    {adminKpis.systemHealth}
                  </p>
                  <p className="mt-1 text-slate-500 text-[10px]">Overall status state</p>
                </div>
                <div className="rounded-2xl border border-slate-900 bg-slate-900/20 p-4 shadow-lg backdrop-blur">
                  <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Network Status</p>
                  <p className="mt-2 text-2xl font-bold text-blue-400 tracking-tight stat-value-blue">{adminKpis.networkStatus}</p>
                  <p className="mt-1 text-slate-500 text-[10px]">Ingest engine state</p>
                </div>
                <div className="rounded-2xl border border-slate-900 bg-slate-900/20 p-4 shadow-lg backdrop-blur">
                  <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Database Status</p>
                  <p className={`mt-2 text-2xl font-bold ${adminKpis.databaseStatus === 'Connected' ? 'text-emerald-400 stat-value-emerald' : 'text-rose-500 stat-value-rose'} tracking-tight`}>
                    {adminKpis.databaseStatus}
                  </p>
                  <p className="mt-1 text-slate-500 text-[10px]">MongoDB client feed</p>
                </div>
                <div className="rounded-2xl border border-slate-900 bg-slate-900/20 p-4 shadow-lg backdrop-blur">
                  <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">API Status</p>
                  <p className="mt-2 text-2xl font-bold text-cyan-400 tracking-tight stat-value-blue">{adminKpis.apiStatus}</p>
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
            // SECURITY ANALYST DASHBOARD — ENHANCED & DATA ISOLATED
            // =================================================================
            <div className="space-y-6">
              {/* Analyst Workload KPI Cards Grid */}
              <section className="grid gap-4 grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
                <div className="rounded-2xl border p-4 shadow-lg backdrop-blur" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}>
                  <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Assigned Incidents</p>
                  <p className="mt-2 text-2xl font-bold tracking-tight" style={{ color: 'var(--text-heading)' }}>{analystWorkloadKpis.totalAssigned}</p>
                  <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>My Queue Cases</p>
                </div>
                <div className="rounded-2xl border p-4 shadow-lg backdrop-blur" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}>
                  <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Open Cases</p>
                  <p className="mt-2 text-2xl font-bold text-rose-500 tracking-tight">{analystWorkloadKpis.openIncidents}</p>
                  <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>Awaiting Action</p>
                </div>
                <div className="rounded-2xl border p-4 shadow-lg backdrop-blur" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}>
                  <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Investigating</p>
                  <p className="mt-2 text-2xl font-bold text-amber-500 tracking-tight">{analystWorkloadKpis.investigatingIncidents}</p>
                  <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>Active Review</p>
                </div>
                <div className="rounded-2xl border p-4 shadow-lg backdrop-blur" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}>
                  <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Resolved Cases</p>
                  <p className="mt-2 text-2xl font-bold text-emerald-600 tracking-tight">{analystWorkloadKpis.resolvedIncidents}</p>
                  <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>Remediated</p>
                </div>
                <div className="rounded-2xl border p-4 shadow-lg backdrop-blur" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}>
                  <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>High Priority</p>
                  <p className="mt-2 text-2xl font-bold text-rose-600 tracking-tight">{analystWorkloadKpis.criticalHighAssigned}</p>
                  <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>Critical &amp; High Risk</p>
                </div>
                <div className={`rounded-2xl border p-4 shadow-lg backdrop-blur transition-all ${analystWorkloadKpis.statusBg}`}>
                  <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Workload Posture</p>
                  <p className={`mt-2 text-xl font-black ${analystWorkloadKpis.statusColor} tracking-tighter`}>
                    {analystWorkloadKpis.statusLabel}
                  </p>
                  <p className="mt-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>Personal queue status</p>
                </div>
              </section>

              {/* Dedicated Table: My Assigned Security Incidents */}
              <section className="rounded-2xl border p-5 shadow-lg backdrop-blur" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b pb-3 mb-4 gap-2" style={{ borderColor: 'var(--border-primary)' }}>
                  <div>
                    <h2 className="text-base font-bold tracking-tight" style={{ color: 'var(--text-heading)' }}>My Assigned Security Incidents</h2>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Security incidents assigned specifically to your analyst account for investigation</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate('/incidents')}
                    className="self-start sm:self-auto rounded-xl bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-md hover:bg-blue-500 transition"
                  >
                    View All My Incidents &rarr;
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-xs font-sans">
                    <thead>
                      <tr className="border-b font-bold uppercase tracking-wider pb-2" style={{ borderColor: 'var(--border-primary)', color: 'var(--text-muted)' }}>
                        <th className="pb-2">Incident ID</th>
                        <th className="pb-2">Title / Attack Category</th>
                        <th className="pb-2">Severity</th>
                        <th className="pb-2">Status</th>
                        <th className="pb-2">Connection IPs</th>
                        <th className="pb-2">Assigned Date</th>
                        <th className="pb-2 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="font-mono">
                      {incidentsData.length === 0 ? (
                        <tr>
                          <td colSpan="7" className="py-8 text-center font-sans" style={{ color: 'var(--text-muted)' }}>
                            <div className="flex flex-col items-center justify-center space-y-1">
                              <span className="text-2xl">🛡️</span>
                              <p className="text-sm font-semibold" style={{ color: 'var(--text-heading)' }}>No Incidents Assigned</p>
                              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>You currently have no open security incidents assigned to your queue.</p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        incidentsData.slice(0, 5).map((inc, idx) => (
                          <tr key={inc.id || inc._id || idx} className="border-b transition-colors" style={{ borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}>
                            <td className="py-3 font-semibold" style={{ color: 'var(--accent-blue)' }}>
                              #{String(inc.id || inc._id || '').slice(-6)}
                            </td>
                            <td className="py-3 font-sans font-semibold" style={{ color: 'var(--text-heading)' }}>
                              {inc.title || inc.attack_type || inc.traffic_label || 'Security Alert'}
                            </td>
                            <td className="py-3 font-sans">
                              <span className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${
                                String(inc.severity || inc.threat_level || '').toLowerCase() === 'critical'
                                  ? 'bg-red-500/20 text-red-600 border border-red-500/40'
                                  : String(inc.severity || inc.threat_level || '').toLowerCase() === 'high'
                                  ? 'bg-rose-500/20 text-rose-600 border border-rose-500/40'
                                  : String(inc.severity || inc.threat_level || '').toLowerCase() === 'medium'
                                  ? 'bg-amber-500/20 text-amber-600 border border-amber-500/40'
                                  : 'bg-emerald-500/20 text-emerald-600 border border-emerald-500/40'
                              }`}>
                                {inc.severity || inc.threat_level || 'Medium'}
                              </span>
                            </td>
                            <td className="py-3 font-sans">
                              <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ${
                                String(inc.status || '').toLowerCase() === 'open'
                                  ? 'bg-rose-500/20 text-rose-600 border border-rose-500/40 animate-pulse'
                                  : String(inc.status || '').toLowerCase() === 'investigating'
                                  ? 'bg-amber-500/20 text-amber-600 border border-amber-500/40'
                                  : 'bg-emerald-500/20 text-emerald-600 border border-emerald-500/40'
                              }`}>
                                {inc.status || 'Open'}
                              </span>
                            </td>
                            <td className="py-3 text-xs" style={{ color: 'var(--text-secondary)' }}>
                              {inc.source_ip ? `${inc.source_ip} → ${inc.destination_ip || 'Target'}` : 'Local Infrastructure'}
                            </td>
                            <td className="py-3 text-[11px] font-sans" style={{ color: 'var(--text-muted)' }}>
                              {inc.created_at ? new Date(inc.created_at).toLocaleDateString() : 'Recent'}
                            </td>
                            <td className="py-3 text-right font-sans">
                              <button
                                type="button"
                                onClick={() => navigate('/incidents')}
                                className="rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition"
                                style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}
                              >
                                Investigate &rarr;
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* Threat & Network Charts Grid */}
              <section className="grid gap-6 md:grid-cols-2">
                {/* Chart 1: My Incidents Severity */}
                <div className="rounded-2xl border p-5 backdrop-blur" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}>
                  <h2 className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-secondary)' }}>System Threat Level Distribution</h2>
                  <div className="h-64">
                    {assignedSeverityChartData.totalCount > 0 ? (
                      <Doughnut data={assignedSeverityChartData.chartData} options={pieChartOptions} />
                    ) : (
                      <div className="flex h-full flex-col items-center justify-center text-xs font-semibold py-8" style={{ color: 'var(--text-muted)' }}>
                        <span className="text-2xl mb-1">🛡️</span>
                        <p>No assigned threat data available</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Chart 2: My Incidents Status Summary */}
                <div className="rounded-2xl border p-5 backdrop-blur" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}>
                  <h2 className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-secondary)' }}>Incident Status Summary</h2>
                  <div className="h-64">
                    {assignedStatusChartData.totalCount > 0 ? (
                      <Bar data={assignedStatusChartData.chartData} options={chartOptions} />
                    ) : (
                      <div className="flex h-full flex-col items-center justify-center text-xs font-semibold py-8" style={{ color: 'var(--text-muted)' }}>
                        <span className="text-2xl mb-1">📊</span>
                        <p>No assigned incident status data available</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Chart 3: Traffic Throughput Trend (Full Width Spanning 2 Columns) */}
                <div className="md:col-span-2 rounded-2xl border p-5 backdrop-blur" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}>
                  <h2 className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-secondary)' }}>Traffic Throughput Trend</h2>
                  <div className="h-64">
                    {trafficRows.length > 0 ? (
                      <Line data={trendChartData} options={chartOptions} />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs font-medium pb-8" style={{ color: 'var(--text-muted)' }}>No traffic throughput data available</div>
                    )}
                  </div>
                </div>

                {/* Chart 4: Attack Category Distribution */}
                <div className="rounded-2xl border p-5 backdrop-blur" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}>
                  <h2 className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-secondary)' }}>Attack Category Distribution</h2>
                  <div className="h-64">
                    {analyticsData?.traffic_label_distribution?.some(d => !['benign', 'normal', '0'].includes(String(d.name).toLowerCase()) && d.count > 0) ? (
                      <Bar data={attackChartData} options={chartOptions} />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs font-medium pb-8" style={{ color: 'var(--text-muted)' }}>No malicious attack categories detected</div>
                    )}
                  </div>
                </div>

                {/* Chart 5: IP Traffic Protocol Distribution */}
                <div className="rounded-2xl border p-5 backdrop-blur" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}>
                  <h2 className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-secondary)' }}>IP Traffic Protocol Distribution</h2>
                  <div className="h-64">
                    {analyticsData?.protocol_distribution?.length > 0 ? (
                      <Doughnut data={protocolChartData} options={pieChartOptions} />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs font-medium pb-8" style={{ color: 'var(--text-muted)' }}>No protocol distribution data available</div>
                    )}
                  </div>
                </div>
              </section>

              {/* Widgets Section */}
              <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl border p-5 backdrop-blur space-y-4" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}>
                  <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Network &amp; System Health</h3>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between border-b pb-1.5" style={{ borderColor: 'var(--border-primary)' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Database node</span>
                      <span className={`font-semibold ${dbStatus === 'Healthy' ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {dbStatus === 'Healthy' ? 'CONNECTED' : 'DISCONNECTED'}
                      </span>
                    </div>
                    <div className="flex justify-between border-b pb-1.5" style={{ borderColor: 'var(--border-primary)' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Pipeline loading</span>
                      <span className="font-semibold text-blue-500 uppercase">{datasetStatus}</span>
                    </div>
                    <div className="flex justify-between border-b pb-1.5" style={{ borderColor: 'var(--border-primary)' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Memory footprint</span>
                      <span className="font-semibold" style={{ color: 'var(--text-heading)' }}>
                        {statisticsData?.memory_usage_mb ? `${statisticsData.memory_usage_mb.toFixed(1)} MB` : '0 MB'}
                      </span>
                    </div>
                    <div className="flex justify-between border-b pb-1.5" style={{ borderColor: 'var(--border-primary)' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Ingested rows</span>
                      <span className="font-semibold" style={{ color: 'var(--text-heading)' }}>
                        {statisticsData?.rows_loaded?.toLocaleString() || '0'}
                      </span>
                    </div>
                    <div className="flex justify-between pb-1">
                      <span style={{ color: 'var(--text-muted)' }}>Server Latency</span>
                      <span className="font-semibold" style={{ color: 'var(--text-heading)' }}>
                        {statisticsData?.startup_time_seconds ? `${statisticsData.startup_time_seconds}s` : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border p-5 backdrop-blur flex flex-col" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}>
                  <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>Live Alerts Log</h3>
                  <div className="flex-1 space-y-2.5 overflow-y-auto max-h-48 text-xs">
                    {liveAlertsLog.length === 0 ? (
                      <p className="italic py-4 text-center" style={{ color: 'var(--text-muted)' }}>No critical incident alerts logged in buffer.</p>
                    ) : (
                      liveAlertsLog.map((alert, index) => (
                        <div key={index} className="border-l-2 border-rose-500 bg-rose-500/10 p-2 rounded-r-md space-y-1">
                          <div className="flex justify-between font-medium">
                            <span className="text-rose-600 font-bold">{alert.traffic_label || 'Malicious Attack'}</span>
                            <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{alert.timestamp?.split(' ')[1] || alert.timestamp}</span>
                          </div>
                          <p className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>
                            {alert.source_ip} &rarr; {alert.destination_ip}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="rounded-2xl border p-5 backdrop-blur" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}>
                  <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>Top Attack Classes</h3>
                  <div className="space-y-2 text-xs">
                    {topAttackTypes.length === 0 ? (
                      <p className="italic py-4 text-center" style={{ color: 'var(--text-muted)' }}>No attack categories loaded.</p>
                    ) : (
                      topAttackTypes.map((type, index) => (
                        <div key={index} className="flex justify-between items-center border-b pb-1.5 last:border-0 last:pb-0" style={{ borderColor: 'var(--border-primary)' }}>
                          <span className="truncate max-w-[140px] font-medium" style={{ color: 'var(--text-heading)' }}>{type.name}</span>
                          <span className="bg-rose-500/10 text-rose-600 px-2 py-0.5 rounded font-mono text-[10px] border border-rose-500/20 font-bold">
                            {type.count.toLocaleString()}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="rounded-2xl border p-5 backdrop-blur" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}>
                  <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>Top Targeted IPs</h3>
                  <div className="space-y-2 text-xs">
                    {topAttackedIPs.length === 0 ? (
                      <p className="italic py-4 text-center" style={{ color: 'var(--text-muted)' }}>No victim IP analytics loaded.</p>
                    ) : (
                      topAttackedIPs.map((item, index) => (
                        <div key={index} className="flex justify-between items-center border-b pb-1.5 last:border-0 last:pb-0 font-mono font-medium" style={{ borderColor: 'var(--border-primary)' }}>
                          <span style={{ color: 'var(--text-heading)' }}>{item.ip}</span>
                          <span className="px-1.5 py-0.5 rounded text-[10px]" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-secondary)' }}>
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
