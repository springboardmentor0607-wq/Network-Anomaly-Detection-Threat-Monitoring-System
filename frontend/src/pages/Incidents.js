import React, { useEffect, useState, useCallback } from 'react';
import api from '../services/api';
import { useRefresh } from '../context/RefreshContext';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';
import SeverityBadge from '../components/SeverityBadge';

const Incidents = () => {
  const { refreshTrigger } = useRefresh();
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchIncidents = useCallback(async () => {
    try {
      const res = await api.get('/incidents');
      setIncidents(res.data.incidents);
      setError(null);
    } catch (err) {
      console.error("Incidents fetch error:", err);
      setError("Failed to fetch incident response register.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchIncidents();
  }, [fetchIncidents, refreshTrigger]);

  const handleStatusUpdate = async (incId, newStatus) => {
    try {
      await api.put(`/incidents/${incId}`, { status: newStatus });
      fetchIncidents();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update incident.');
    }
  };

  const formatIncidentTitle = (title) => {
    if (!title) return 'Attack Escalation';
    return title.replace(/^CRITICAL INCIDENT:\s*/i, '').trim();
  };

  const formatIncidentDesc = (desc) => {
    if (!desc) return 'Critical threat escalated for SOC investigation.';
    if (desc.includes('Target system:')) {
      const match = desc.match(/Target system:\s*([^.]+)/i);
      if (match) return `Target system: ${match[1].trim()}`;
    }
    return desc.replace(/^Critical priority security incident automatically dispatched from Alert #[0-9]+\.\s*/i, '').trim();
  };

  if (loading && incidents.length === 0) {
    return <LoadingState message="Loading Incident Escalation Board..." />;
  }

  if (error && incidents.length === 0) {
    return <ErrorState message={error} onRetry={fetchIncidents} />;
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Incident Management</h1>
          <p className="page-subtitle">Security Incident Escalation & Response Workflow (OPEN → INVESTIGATING → CONTAINED → RESOLVED → CLOSED)</p>
        </div>
      </div>

      <div className="netshield-card">
        {incidents.length > 0 ? (
          <div className="netshield-table-container">
            <table className="netshield-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Title & Telemetry</th>
                  <th>Priority</th>
                  <th>Assigned Analyst</th>
                  <th>Status</th>
                  <th>Created At</th>
                  <th>Lifecycle Action</th>
                </tr>
              </thead>
              <tbody>
                {incidents.map((inc) => (
                  <tr key={inc.id}>
                    <td style={{ color: '#94A3B8' }}>#{inc.id}</td>
                    <td style={{ maxWidth: 420, whiteSpace: 'normal' }}>
                      <div style={{ fontWeight: 800, color: '#FFFFFF', fontSize: '0.95rem' }}>
                        {formatIncidentTitle(inc.title)}
                      </div>
                      <div style={{ fontSize: '0.82rem', color: '#94A3B8', marginTop: 3 }}>
                        {formatIncidentDesc(inc.description)}
                      </div>
                    </td>
                    <td><SeverityBadge severity={inc.priority} /></td>
                    <td><span className="badge badge-info">{inc.assigned_analyst_name || 'Security Analyst'}</span></td>
                    <td><span className="badge badge-gray">{inc.status}</span></td>
                    <td style={{ color: '#94A3B8', fontSize: '0.8rem' }}>{new Date(inc.created_at).toLocaleString()}</td>
                    <td>
                      {inc.status === 'OPEN' && (
                        <button
                          onClick={() => handleStatusUpdate(inc.id, 'INVESTIGATING')}
                          className="btn btn-primary"
                          style={{ padding: '5px 12px', fontSize: '0.78rem' }}
                        >
                          Investigate
                        </button>
                      )}
                      {inc.status === 'INVESTIGATING' && (
                        <button
                          onClick={() => handleStatusUpdate(inc.id, 'CONTAINED')}
                          className="btn btn-warning"
                          style={{ padding: '5px 12px', fontSize: '0.78rem' }}
                        >
                          Contain
                        </button>
                      )}
                      {inc.status === 'CONTAINED' && (
                        <button
                          onClick={() => handleStatusUpdate(inc.id, 'RESOLVED')}
                          className="btn btn-success"
                          style={{ padding: '5px 12px', fontSize: '0.78rem' }}
                        >
                          Resolve
                        </button>
                      )}
                      {inc.status === 'RESOLVED' && (
                        <button
                          onClick={() => handleStatusUpdate(inc.id, 'CLOSED')}
                          className="btn btn-outline"
                          style={{ padding: '5px 12px', fontSize: '0.78rem' }}
                        >
                          Close
                        </button>
                      )}
                      {inc.status === 'CLOSED' && (
                        <span style={{ color: '#64748B', fontSize: '0.8rem', fontWeight: 600 }}>Closed & Archived</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState message="No incidents found" description="No critical incidents escalated in database." />
        )}
      </div>
    </div>
  );
};

export default Incidents;
