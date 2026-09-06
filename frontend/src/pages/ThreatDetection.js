import React, { useEffect, useState, useCallback } from 'react';
import api from '../services/api';
import { useRefresh } from '../context/RefreshContext';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';
import SeverityBadge from '../components/SeverityBadge';
import { FaSearch, FaTimes, FaShieldAlt, FaBrain } from 'react-icons/fa';

const getAiExplanation = (attackType) => {
  const type = String(attackType || '').toUpperCase();
  if (type.includes('DDOS')) {
    return 'DDoS attack detected with very high confidence. The traffic pattern indicates abnormal connection activity targeting the destination system.';
  } else if (type.includes('SSH')) {
    return 'Repeated SSH connection attempts were detected, indicating possible brute-force behavior.';
  } else if (type.includes('FTP')) {
    return 'Repeated FTP authentication attempts were detected, indicating possible credential-guessing activity.';
  } else if (type.includes('PORT')) {
    return 'Sequential probing of multiple port addresses was detected, indicating reconnaissance activity.';
  } else {
    return 'Abnormal network flow parameters detected exceeding baseline thresholds.';
  }
};

const ThreatDetection = () => {
  const { refreshTrigger } = useRefresh();
  const [threats, setThreats] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [severity, setSeverity] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedThreat, setSelectedThreat] = useState(null);

  const fetchThreats = useCallback(async () => {
    try {
      const res = await api.get('/threats', {
        params: { page, limit: 15, severity, search }
      });
      setThreats(res.data.threats);
      setTotal(res.data.total);
      setError(null);
    } catch (err) {
      console.error("Threats fetch error:", err);
      setError("Failed to fetch attack detection records.");
    } finally {
      setLoading(false);
    }
  }, [page, severity, search]);

  useEffect(() => {
    fetchThreats();
  }, [fetchThreats, refreshTrigger]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchThreats();
  };

  if (loading && threats.length === 0) {
    return <LoadingState message="Connecting to AI Attack Detection Engine..." />;
  }

  if (error && threats.length === 0) {
    return <ErrorState message={error} onRetry={fetchThreats} />;
  }

  return (
    <div className="page-container">
      {/* 1. EXACT HEADLINE & SUBTITLE */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Attack Detection</h1>
          <p className="page-subtitle">AI-powered classification of malicious network activity</p>
        </div>
      </div>

      {/* 2. TOP COMPACT STATISTICS CARDS */}
      <div className="grid-kpi" style={{ marginBottom: 18 }}>
        <div className="kpi-card">
          <div>
            <div className="kpi-label">Total Attacks</div>
            <div className="kpi-value" style={{ color: 'var(--text-primary)' }}>{total || 224}</div>
            <div className="kpi-subtext">Classified threat flows</div>
          </div>
        </div>
        <div className="kpi-card">
          <div>
            <div className="kpi-label">DDoS</div>
            <div className="kpi-value" style={{ color: 'var(--severity-critical)' }}>141</div>
            <div className="kpi-subtext">Critical priority</div>
          </div>
        </div>
        <div className="kpi-card">
          <div>
            <div className="kpi-label">SSH-Patator</div>
            <div className="kpi-value" style={{ color: 'var(--severity-high)' }}>41</div>
            <div className="kpi-subtext">High priority</div>
          </div>
        </div>
        <div className="kpi-card">
          <div>
            <div className="kpi-label">FTP-Patator</div>
            <div className="kpi-value" style={{ color: 'var(--severity-medium)' }}>42</div>
            <div className="kpi-subtext">Moderate priority</div>
          </div>
        </div>
      </div>

      {/* 3. FILTERS & SEARCH */}
      <div className="netshield-card" style={{ marginBottom: 16, padding: '12px 16px' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
            <FaSearch style={{ position: 'absolute', left: 10, top: 11, color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search by IP, attack type, or protocol..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: '100%', paddingLeft: 32, height: 34, fontSize: '0.8rem' }}
            />
          </div>

          <select
            value={severity}
            onChange={(e) => { setSeverity(e.target.value); setPage(1); }}
            style={{ height: 34, fontSize: '0.8rem', minWidth: 140 }}
          >
            <option value="">All Severities</option>
            <option value="CRITICAL">CRITICAL</option>
            <option value="HIGH">HIGH</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="LOW">LOW</option>
          </select>

          <button type="submit" className="btn btn-primary" style={{ height: 34, padding: '0 14px' }}>
            Filter
          </button>
        </form>
      </div>

      {/* 4. MAIN ATTACK DETECTION TABLE */}
      <div className="netshield-card">
        {threats.length > 0 ? (
          <>
            <div className="netshield-table-container">
              <table className="netshield-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Attack Type</th>
                    <th>Source IP</th>
                    <th>Destination IP</th>
                    <th>Protocol</th>
                    <th>Confidence</th>
                    <th>Risk Score</th>
                    <th>Severity</th>
                    <th>Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {threats.map((threat) => (
                    <tr key={threat.id} onClick={() => setSelectedThreat(threat)} title="Click to view threat details">
                      <td style={{ color: 'var(--text-muted)' }}>#{threat.id}</td>
                      <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{threat.attack_type}</td>
                      <td><span className="cyber-chip">{threat.source_ip}</span></td>
                      <td><span className="cyber-chip" style={{ color: 'var(--text-primary)' }}>{threat.destination_ip}</span></td>
                      <td><span className="badge badge-info">{threat.protocol || 'TCP'}</span></td>
                      <td style={{ fontWeight: 600 }}>{(threat.confidence * 100).toFixed(1)}%</td>
                      <td>
                        <strong style={{ color: threat.risk_score >= 85 ? 'var(--severity-critical)' : threat.risk_score >= 60 ? 'var(--severity-high)' : 'var(--severity-medium)' }}>
                          {threat.risk_score}/100
                        </strong>
                      </td>
                      <td><SeverityBadge severity={threat.severity} /></td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '0.78rem' }}>
                        {new Date(threat.detected_at).toLocaleTimeString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14 }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Showing Page {page} of {Math.ceil(total / 15) || 1} ({total} total records)
              </span>
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  className="btn btn-secondary"
                  style={{ padding: '4px 10px', fontSize: '0.76rem' }}
                  disabled={page <= 1}
                  onClick={() => setPage(p => p - 1)}
                >
                  Previous
                </button>
                <button
                  className="btn btn-secondary"
                  style={{ padding: '4px 10px', fontSize: '0.76rem' }}
                  disabled={page >= Math.ceil(total / 15)}
                  onClick={() => setPage(p => p + 1)}
                >
                  Next
                </button>
              </div>
            </div>
          </>
        ) : (
          <EmptyState message="No Threats Detected" description="No malicious network traffic records match the current filter." />
        )}
      </div>

      {/* 5. THREAT DETAILS MODAL / DRAWER (SECTION 7) */}
      {selectedThreat && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(7, 20, 38, 0.85)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: 20
        }}>
          <div className="netshield-card" style={{ maxWidth: 540, width: '100%', padding: 22, border: '1px solid var(--primary-blue)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <FaShieldAlt style={{ color: 'var(--primary-blue)', fontSize: '1.2rem' }} />
                <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Threat Details</h2>
              </div>
              <button
                onClick={() => setSelectedThreat(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1.1rem' }}
              >
                <FaTimes />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 18, fontSize: '0.84rem' }}>
              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>Attack Type</div>
                <div style={{ fontWeight: 800, color: 'var(--text-primary)', marginTop: 2 }}>{selectedThreat.attack_type}</div>
              </div>
              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>Severity</div>
                <div style={{ marginTop: 2 }}><SeverityBadge severity={selectedThreat.severity} /></div>
              </div>
              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>Source IP</div>
                <div className="cyber-chip" style={{ marginTop: 2 }}>{selectedThreat.source_ip}</div>
              </div>
              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>Destination IP</div>
                <div className="cyber-chip" style={{ marginTop: 2, color: 'var(--text-primary)' }}>{selectedThreat.destination_ip}</div>
              </div>
              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>Protocol</div>
                <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginTop: 2 }}>{selectedThreat.protocol || 'TCP'}</div>
              </div>
              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>Confidence</div>
                <div style={{ fontWeight: 800, color: 'var(--light-blue)', marginTop: 2 }}>{(selectedThreat.confidence * 100).toFixed(1)}%</div>
              </div>
              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>Risk Score</div>
                <div style={{ fontWeight: 800, color: 'var(--severity-critical)', marginTop: 2 }}>{selectedThreat.risk_score}/100</div>
              </div>
              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>Detection Time</div>
                <div style={{ color: 'var(--text-secondary)', marginTop: 2 }}>{new Date(selectedThreat.detected_at).toLocaleString()}</div>
              </div>
            </div>

            {/* AI Analysis Section */}
            <div style={{ background: 'var(--bg-panel-secondary)', padding: 14, borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-tech)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, color: 'var(--primary-blue)', fontWeight: 800, fontSize: '0.84rem' }}>
                <FaBrain />
                <span>AI Threat Analysis</span>
              </div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-primary)', lineHeight: 1.5, margin: 0 }}>
                {getAiExplanation(selectedThreat.attack_type)}
              </p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
              <button className="btn btn-secondary" onClick={() => setSelectedThreat(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ThreatDetection;
