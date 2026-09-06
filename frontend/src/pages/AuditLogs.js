import React, { useEffect, useState } from 'react';
import api from '../services/api';
import LoadingState from '../components/LoadingState';
import EmptyState from '../components/EmptyState';

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    try {
      const res = await api.get('/audit-logs');
      setLogs(res.data.logs);
    } catch (err) {
      console.error("Audit logs error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">System Audit Logs</h1>
          <p className="page-subtitle">Immutable security operations audit trail (Admin Access Only)</p>
        </div>
      </div>

      <div className="netshield-card">
        {loading ? (
          <LoadingState message="Loading System Audit Trail..." />
        ) : logs.length > 0 ? (
          <div className="netshield-table-container">
            <table className="netshield-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Timestamp</th>
                  <th>User / Actor</th>
                  <th>Action</th>
                  <th>Module</th>
                  <th>Client IP</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td style={{ color: '#94A3B8' }}>#{log.id}</td>
                    <td style={{ color: '#94A3B8', fontSize: '0.8rem' }}>{new Date(log.timestamp).toLocaleString()}</td>
                    <td style={{ fontWeight: 700 }}>{log.user_name || 'System / Anonymous'}</td>
                    <td><span className="badge badge-info">{log.action}</span></td>
                    <td>{log.module}</td>
                    <td style={{ fontFamily: 'monospace' }}>{log.ip_address}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState message="No audit logs recorded" description="No activity registered." />
        )}
      </div>
    </div>
  );
};

export default AuditLogs;
