import React, { useEffect, useState, useCallback } from 'react';
import api from '../services/api';
import { useRefresh } from '../context/RefreshContext';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';
import SeverityBadge from '../components/SeverityBadge';

const Alerts = () => {
  const { refreshTrigger } = useRefresh();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('');

  const fetchAlerts = useCallback(async () => {
    try {
      const res = await api.get('/alerts', {
        params: { status: filterStatus, severity: filterSeverity }
      });
      setAlerts(res.data.alerts);
      setError(null);
    } catch (err) {
      console.error("Alerts fetch error:", err);
      setError("Failed to retrieve security alert register.");
    } finally {
      setLoading(false);
    }
  }, [filterStatus, filterSeverity]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts, refreshTrigger]);

  const handleStatusChange = async (alertId, newStatus) => {
    try {
      await api.put(`/alerts/${alertId}`, { status: newStatus });
      fetchAlerts();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update alert status.');
    }
  };

  const formatAlertTitle = (title) => {
    if (!title) return 'Security Alert';
    let clean = title
      .replace(/^Automated Security Alert:\s*/i, '')
      .replace(/^Security Alert:\s*/i, '')
      .replace(/^Critical\s+/i, '')
      .replace(/\s+Detected from\s+[0-9.]+$/i, '')
      .replace(/\s+Detected$/i, '')
      .trim();
    if (!clean.toLowerCase().endsWith('alert')) {
      clean = `${clean} Alert`;
    }
    return clean;
  };

  if (loading && alerts.length === 0) {
    return <LoadingState message="Loading Security Alerts Telemetry Register..." />;
  }

  if (error && alerts.length === 0) {
    return <ErrorState message={error} onRetry={fetchAlerts} />;
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Security Alerts</h1>
          <p className="page-subtitle">Real-time alert lifecycle & incident escalation (NEW → ACKNOWLEDGED → INVESTIGATING → RESOLVED → CLOSED)</p>
        </div>
      </div>

      <div className="netshield-card" style={{ marginBottom: 20, padding: 16 }}>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ width: 200 }}>
            <label style={{ display: 'block', color: '#94A3B8', fontSize: '0.78rem', fontWeight: 700, marginBottom: 4 }}>FILTER STATUS</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              style={{
                width: '100%', padding: '9px 12px', backgroundColor: 'rgba(6, 17, 32, 0.9)',
                border: '1px solid rgba(22, 131, 255, 0.22)', borderRadius: 8, color: '#F8FAFC'
              }}
            >
              <option value="">All Statuses</option>
              <option value="NEW">NEW</option>
              <option value="ACKNOWLEDGED">ACKNOWLEDGED</option>
              <option value="INVESTIGATING">INVESTIGATING</option>
              <option value="RESOLVED">RESOLVED</option>
              <option value="CLOSED">CLOSED</option>
            </select>
          </div>

          <div style={{ width: 200 }}>
            <label style={{ display: 'block', color: '#94A3B8', fontSize: '0.78rem', fontWeight: 700, marginBottom: 4 }}>FILTER SEVERITY</label>
            <select
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
              style={{
                width: '100%', padding: '9px 12px', backgroundColor: 'rgba(6, 17, 32, 0.9)',
                border: '1px solid rgba(22, 131, 255, 0.22)', borderRadius: 8, color: '#F8FAFC'
              }}
            >
              <option value="">All Severities</option>
              <option value="CRITICAL">CRITICAL</option>
              <option value="HIGH">HIGH</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="LOW">LOW</option>
            </select>
          </div>
        </div>
      </div>

      <div className="netshield-card">
        {alerts.length > 0 ? (
          <div className="netshield-table-container">
            <table className="netshield-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Alert Title</th>
                  <th>Attack Type</th>
                  <th>Target IP</th>
                  <th>Severity</th>
                  <th>Created At</th>
                  <th>Status</th>
                  <th>Lifecycle Action</th>
                </tr>
              </thead>
              <tbody>
                {alerts.map((alertItem) => (
                  <tr key={alertItem.id}>
                    <td style={{ color: '#94A3B8' }}>#{alertItem.id}</td>
                    <td>
                      <div style={{ fontWeight: 800, color: '#FFFFFF', fontSize: '0.95rem' }}>{formatAlertTitle(alertItem.title)}</div>
                    </td>
                    <td><span className="badge badge-info">{alertItem.attack_type || alertItem.alert_type}</span></td>
                    <td><span className="cyber-chip" style={{ color: '#00E676', borderColor: 'rgba(0, 230, 118, 0.3)' }}>{alertItem.destination_ip || '10.0.0.1'}</span></td>
                    <td><SeverityBadge severity={alertItem.severity} /></td>
                    <td style={{ color: '#94A3B8', fontSize: '0.8rem' }}>{new Date(alertItem.created_at).toLocaleString()}</td>
                    <td><span className="badge badge-info">{alertItem.status}</span></td>
                    <td>
                      {alertItem.status === 'NEW' && (
                        <button
                          onClick={() => handleStatusChange(alertItem.id, 'ACKNOWLEDGED')}
                          className="btn btn-warning"
                          style={{ padding: '5px 12px', fontSize: '0.78rem' }}
                        >
                          Acknowledge
                        </button>
                      )}
                      {alertItem.status === 'ACKNOWLEDGED' && (
                        <button
                          onClick={() => handleStatusChange(alertItem.id, 'INVESTIGATING')}
                          className="btn btn-primary"
                          style={{ padding: '5px 12px', fontSize: '0.78rem' }}
                        >
                          Investigate
                        </button>
                      )}
                      {alertItem.status === 'INVESTIGATING' && (
                        <button
                          onClick={() => handleStatusChange(alertItem.id, 'RESOLVED')}
                          className="btn btn-success"
                          style={{ padding: '5px 12px', fontSize: '0.78rem' }}
                        >
                          Resolve
                        </button>
                      )}
                      {alertItem.status === 'RESOLVED' && (
                        <button
                          onClick={() => handleStatusChange(alertItem.id, 'CLOSED')}
                          className="btn btn-outline"
                          style={{ padding: '5px 12px', fontSize: '0.78rem' }}
                        >
                          Close
                        </button>
                      )}
                      {alertItem.status === 'CLOSED' && (
                        <span style={{ color: '#64748B', fontSize: '0.8rem', fontWeight: 600 }}>Archived</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState message="No security alerts found" description="No active security alerts matching the current filter." />
        )}
      </div>
    </div>
  );
};

export default Alerts;
