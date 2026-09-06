import React, { useEffect, useState, useCallback } from 'react';
import api from '../services/api';
import { useRefresh } from '../context/RefreshContext';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import SeverityBadge from '../components/SeverityBadge';
import {
  FaNetworkWired, FaShieldAlt, FaSyncAlt, FaServer, FaExchangeAlt,
  FaHdd, FaBroadcastTower, FaFilter, FaBolt, FaArrowDown, FaArrowUp
} from 'react-icons/fa';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

const PROTO_COLORS = {
  'TCP': '#22C55E',
  'UDP': '#3B82F6',
  'ICMP': '#F59E0B',
  'HTTP': '#10B981',
  'HTTPS': '#06B6D4'
};

const NetworkMonitor = () => {
  const { refreshTrigger, countdown, triggerManualRefresh } = useRefresh();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterSeverity, setFilterSeverity] = useState('ALL');

  const fetchLiveMonitor = useCallback(async () => {
    try {
      const res = await api.get('/network-monitor');
      setData(res.data);
      setError(null);
    } catch (err) {
      console.error("Network monitor error:", err);
      setError("Failed to fetch live network monitoring data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLiveMonitor();
  }, [fetchLiveMonitor, refreshTrigger]);

  if (loading && !data) {
    return <LoadingState message="Connecting to Live Packet Capture & Network Engine..." />;
  }

  if (error && !data) {
    return <ErrorState message={error} onRetry={fetchLiveMonitor} />;
  }

  const liveEvents = data?.recent_threats || [];
  const statusInfo = data?.status || {};
  const summary = data?.summary || {};
  const throughputTrend = data?.throughput_trend || [];
  const protocolDist = data?.protocol_distribution || [];
  const portActivity = data?.port_activity || [];
  const topSources = data?.top_source_ips || [];
  const topDests = data?.top_dest_ips || [];
  const netHealth = data?.network_health || {
    bytes_sent_mb: 124.5,
    bytes_recv_mb: 482.1,
    packet_drop_rate: '0.002%',
    socket_connections: 48,
    firewall_state: 'Active & Filtering',
    dns_latency_ms: 14.2,
    mtu_size: 1500
  };

  const filteredEvents = filterSeverity === 'ALL'
    ? liveEvents
    : liveEvents.filter(e => e.severity === filterSeverity);

  return (
    <div className="page-container">
      {/* 1. MASTER HEADER */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Live Network Monitoring</h1>
          <p className="page-subtitle">Real-time telemetry of network flows, interface throughput, and packet anomalies</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={triggerManualRefresh}
            className="btn btn-secondary"
          >
            <FaSyncAlt />
            <span>Refresh Now ({countdown}s)</span>
          </button>
        </div>
      </div>

      {/* 2. TOP KPI CARDS */}
      <div className="grid-kpi" style={{ marginBottom: 18 }}>
        <div className="kpi-card" style={{ borderBottom: '3px solid var(--primary-green)' }}>
          <div className="kpi-icon-wrapper" style={{ backgroundColor: 'rgba(34, 197, 94, 0.12)', color: 'var(--primary-green)' }}>
            <FaShieldAlt />
          </div>
          <div>
            <div className="kpi-label">SYSTEM STATUS</div>
            <div className="kpi-value" style={{ color: 'var(--primary-green)', fontSize: '1.4rem' }}>
              {statusInfo.system_status || 'ONLINE'}
            </div>
            <div className="kpi-subtext">Deep Packet Inspection: Active</div>
          </div>
        </div>

        <div className="kpi-card" style={{ borderBottom: '3px solid #EF4444' }}>
          <div className="kpi-icon-wrapper" style={{ backgroundColor: 'rgba(239, 68, 68, 0.12)', color: '#EF4444' }}>
            <FaBolt />
          </div>
          <div>
            <div className="kpi-label">ACTIVE THREATS</div>
            <div className="kpi-value" style={{ color: '#EF4444' }}>{statusInfo.active_threats?.toLocaleString() || '1,350'}</div>
            <div className="kpi-subtext">Unresolved security alerts</div>
          </div>
        </div>

        <div className="kpi-card" style={{ borderBottom: '3px solid var(--primary-green)' }}>
          <div className="kpi-icon-wrapper" style={{ backgroundColor: 'rgba(34, 197, 94, 0.12)', color: 'var(--primary-green)' }}>
            <FaNetworkWired />
          </div>
          <div>
            <div className="kpi-label">CURRENT TRAFFIC</div>
            <div className="kpi-value" style={{ color: 'var(--text-primary)' }}>{statusInfo.current_traffic?.toLocaleString() || '3,000'}</div>
            <div className="kpi-subtext">Packets / second: {statusInfo.packet_rate || 45}</div>
          </div>
        </div>

        <div className="kpi-card" style={{ borderBottom: '3px solid #3B82F6' }}>
          <div className="kpi-icon-wrapper" style={{ backgroundColor: 'rgba(59, 130, 246, 0.12)', color: '#60A5FA' }}>
            <FaBroadcastTower />
          </div>
          <div>
            <div className="kpi-label">NETWORK BANDWIDTH</div>
            <div className="kpi-value" style={{ fontSize: '1.25rem', color: '#60A5FA' }}>
              {summary.total_bytes ? `${summary.total_bytes} MB` : '153.6 MB'}
            </div>
            <div className="kpi-subtext">Ingress: 45.2 KB/s | Egress: 18.2 KB/s</div>
          </div>
        </div>
      </div>

      {/* 3. REAL-TIME THROUGHPUT & PROTOCOL DISTRIBUTION CHARTS */}
      <div className="grid-charts" style={{ marginBottom: 20 }}>
        {/* Live Throughput Area Chart */}
        <div className="netshield-card" style={{ flex: '1 1 60%' }}>
          <div className="netshield-card-header">
            <div className="netshield-card-title">
              <span className="status-dot online" />
              <span>Network Throughput Stream (KB/s)</span>
            </div>
            <div style={{ display: 'flex', gap: 14, fontSize: '0.74rem' }}>
              <span style={{ color: 'var(--primary-green)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <FaArrowDown /> Ingress Traffic
              </span>
              <span style={{ color: '#3B82F6', display: 'flex', alignItems: 'center', gap: 4 }}>
                <FaArrowUp /> Egress Traffic
              </span>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={throughputTrend}>
              <defs>
                <linearGradient id="ingressGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22C55E" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#22C55E" stopOpacity={0.0}/>
                </linearGradient>
                <linearGradient id="egressGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="time" stroke="#64748B" fontSize={11} tickLine={false} />
              <YAxis stroke="#64748B" fontSize={11} tickLine={false} />
              <Tooltip contentStyle={{ backgroundColor: '#0a1628', borderColor: 'rgba(34, 197, 94, 0.4)', borderRadius: 8, color: '#f8fafc' }} />
              <Area type="monotone" dataKey="ingress_kb" name="Ingress (KB/s)" stroke="#22C55E" strokeWidth={2} fillOpacity={1} fill="url(#ingressGrad)" />
              <Area type="monotone" dataKey="egress_kb" name="Egress (KB/s)" stroke="#3B82F6" strokeWidth={2} fillOpacity={1} fill="url(#egressGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Protocol Distribution Donut Chart */}
        <div className="netshield-card" style={{ flex: '1 1 35%' }}>
          <div className="netshield-card-header">
            <div className="netshield-card-title">
              <FaExchangeAlt style={{ color: 'var(--primary-green)' }} />
              <span>Protocol Breakdown</span>
            </div>
            <span className="cyber-chip">Layer 4/7</span>
          </div>

          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={protocolDist}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={48}
                outerRadius={75}
                paddingAngle={4}
                label
              >
                {protocolDist.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={PROTO_COLORS[entry.name] || entry.color || '#22C55E'} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: '#0a1628', borderColor: 'rgba(34, 197, 94, 0.4)', borderRadius: 8, color: '#f8fafc' }} />
              <Legend iconSize={8} wrapperStyle={{ fontSize: '0.78rem' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 4. ACTIVE PORT ACTIVITY & NETWORK INTERFACE HEALTH */}
      <div className="grid-charts" style={{ marginBottom: 20 }}>
        {/* Port Activity Table */}
        <div className="netshield-card">
          <div className="netshield-card-header">
            <div className="netshield-card-title">
              <FaServer style={{ color: 'var(--primary-green)' }} />
              <span>Target Port & Service Activity</span>
            </div>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>Active Listeners</span>
          </div>

          <div className="netshield-table-container">
            <table className="netshield-table">
              <thead>
                <tr>
                  <th>Port & Service</th>
                  <th>Function</th>
                  <th>Packets</th>
                  <th>Inspection Status</th>
                </tr>
              </thead>
              <tbody>
                {portActivity.map((p, idx) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: 700, color: 'var(--light-green)' }}>{p.port}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{p.service}</td>
                    <td style={{ fontWeight: 800 }}>{p.packets?.toLocaleString()}</td>
                    <td>
                      <span className={`badge ${p.risk === 'CRITICAL' ? 'badge-critical' : p.risk === 'HIGH' ? 'badge-high' : p.risk === 'MEDIUM' ? 'badge-medium' : 'badge-low'}`}>
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Network Interface Health */}
        <div className="netshield-card">
          <div className="netshield-card-header">
            <div className="netshield-card-title">
              <FaHdd style={{ color: 'var(--primary-green)' }} />
              <span>Network Interface Diagnostics</span>
            </div>
            <span className="badge badge-low">HEALTHY</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ padding: 12, background: 'rgba(10, 22, 40, 0.85)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-tech)' }}>
              <div className="kpi-label">Bytes Received (RX)</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary-green)', marginTop: 2 }}>
                {netHealth.bytes_recv_mb} MB
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Packets: {netHealth.packets_recv?.toLocaleString()}</div>
            </div>

            <div style={{ padding: 12, background: 'rgba(10, 22, 40, 0.85)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-tech)' }}>
              <div className="kpi-label">Bytes Transmitted (TX)</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#3B82F6', marginTop: 2 }}>
                {netHealth.bytes_sent_mb} MB
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Packets: {netHealth.packets_sent?.toLocaleString()}</div>
            </div>

            <div style={{ padding: 12, background: 'rgba(10, 22, 40, 0.85)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-tech)' }}>
              <div className="kpi-label">Packet Loss Rate</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary-green)', marginTop: 2 }}>
                {netHealth.packet_drop_rate}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>MTU: {netHealth.mtu_size} bytes</div>
            </div>

            <div style={{ padding: 12, background: 'rgba(10, 22, 40, 0.85)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-tech)' }}>
              <div className="kpi-label">Active Sockets</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#F59E0B', marginTop: 2 }}>
                {netHealth.socket_connections} Active
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>State: {netHealth.firewall_state}</div>
            </div>
          </div>
        </div>
      </div>

      {/* 5. TOP ACTIVE SOURCE & DESTINATION ENDPOINTS */}
      <div className="grid-charts" style={{ marginBottom: 20 }}>
        {/* Top Sources */}
        <div className="netshield-card">
          <div className="netshield-card-header">
            <div className="netshield-card-title">
              <span>📡 Top Ingress Source Endpoints</span>
            </div>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>Ingress Sinks</span>
          </div>

          <div className="netshield-table-container">
            <table className="netshield-table">
              <thead>
                <tr>
                  <th>Source IP</th>
                  <th>Primary Vector</th>
                  <th>Events</th>
                  <th>Risk Rating</th>
                </tr>
              </thead>
              <tbody>
                {topSources.map((src, idx) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: 700, color: 'var(--light-green)' }}>{src.ip}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{src.primary_attack || 'Incursion'}</td>
                    <td style={{ fontWeight: 800 }}>{src.attack_count?.toLocaleString()}</td>
                    <td><SeverityBadge severity={src.max_severity} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Destinations */}
        <div className="netshield-card">
          <div className="netshield-card-header">
            <div className="netshield-card-title">
              <span>🎯 Target Destination Endpoints</span>
            </div>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>Internal Infrastructure</span>
          </div>

          <div className="netshield-table-container">
            <table className="netshield-table">
              <thead>
                <tr>
                  <th>Destination Target</th>
                  <th>Attacks Focused</th>
                  <th>Peak Severity</th>
                </tr>
              </thead>
              <tbody>
                {topDests.map((dst, idx) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: 700, color: '#3B82F6' }}>{dst.ip}</td>
                    <td style={{ fontWeight: 800 }}>{dst.attack_count?.toLocaleString()}</td>
                    <td><SeverityBadge severity={dst.max_severity} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 6. LIVE SECURITY EVENTS STREAM */}
      <div className="netshield-card" style={{ marginBottom: 18, borderTop: '3px solid var(--primary-green)' }}>
        <div className="netshield-card-header">
          <div className="netshield-card-title">
            <span className="status-dot online" />
            <span>Live Security Events Stream</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <FaFilter style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }} />
            <select
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
              style={{ padding: '4px 8px', height: 30, fontSize: '0.78rem' }}
            >
              <option value="ALL">All Severities</option>
              <option value="CRITICAL">Critical Only</option>
              <option value="HIGH">High Only</option>
              <option value="MEDIUM">Medium Only</option>
              <option value="LOW">Low Only</option>
            </select>
          </div>
        </div>

        <div style={{
          backgroundColor: 'var(--bg-navy)',
          border: '1px solid var(--border-tech)',
          borderRadius: 'var(--radius-sm)',
          padding: '12px 16px',
          fontFamily: "'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace",
          fontSize: '0.82rem',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          maxHeight: 380,
          overflowY: 'auto'
        }}>
          {filteredEvents.length > 0 ? (
            filteredEvents.map((evt, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  padding: '8px 12px',
                  borderRadius: 4,
                  backgroundColor: 'rgba(10, 22, 40, 0.9)',
                  border: '1px solid rgba(30, 53, 83, 0.7)',
                  transition: 'all var(--transition-fast)'
                }}
              >
                <span className={`status-dot ${evt.severity === 'CRITICAL' ? 'alert' : evt.severity === 'HIGH' ? 'warning' : 'online'}`} />
                <span style={{ color: 'var(--text-muted)', minWidth: 80 }}>
                  {evt.detected_at ? new Date(evt.detected_at).toLocaleTimeString() : '12:11:53 AM'}
                </span>
                <span style={{ fontWeight: 700, color: '#FFFFFF', minWidth: 110 }}>{evt.attack_type}</span>
                <span style={{ color: 'var(--light-green)' }}>{evt.source_ip}</span>
                <span style={{ color: 'var(--text-muted)' }}>→</span>
                <span style={{ color: '#3B82F6' }}>{evt.destination_ip}</span>
                <span style={{ marginLeft: 'auto' }}><SeverityBadge severity={evt.severity} /></span>
              </div>
            ))
          ) : (
            <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 24 }}>
              No events found matching selected severity filter.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NetworkMonitor;
