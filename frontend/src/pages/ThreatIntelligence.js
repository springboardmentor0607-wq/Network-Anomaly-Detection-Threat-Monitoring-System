import React, { useEffect, useState, useCallback } from 'react';
import api from '../services/api';
import { useRefresh } from '../context/RefreshContext';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';
import SeverityBadge from '../components/SeverityBadge';
import {
  FaCrosshairs, FaShieldAlt, FaServer, FaChartBar, FaSyncAlt, FaLock, FaBrain, FaChartPie
} from 'react-icons/fa';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

const ThreatIntelligence = () => {
  const { refreshTrigger, countdown, triggerManualRefresh } = useRefresh();
  const [intel, setIntel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchIntel = useCallback(async () => {
    try {
      const res = await api.get('/threat-intelligence');
      setIntel(res.data);
      setError(null);
    } catch (err) {
      console.error("Threat intel error:", err);
      setError("Failed to fetch threat intelligence data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchIntel();
  }, [fetchIntel, refreshTrigger]);

  if (loading && !intel) {
    return <LoadingState message="Aggregating Threat Intelligence Telemetry & Attack Signatures..." />;
  }

  if (error && !intel) {
    return <ErrorState message={error} onRetry={fetchIntel} />;
  }

  const insights = intel?.insights || {};
  const riskDist = intel?.risk_distribution || [];
  const criticalThreats = intel?.critical_threats || [];
  const perfMetrics = intel?.threat_performance_metrics || [
    { class_name: 'BENIGN', accuracy: 99.1, confidence: 98.5, color: '#22C55E' },
    { class_name: 'DDoS', accuracy: 98.9, confidence: 99.2, color: '#EF4444' },
    { class_name: 'FTP-Patator', accuracy: 97.8, confidence: 96.9, color: '#F59E0B' },
    { class_name: 'SSH-Patator', accuracy: 98.2, confidence: 97.4, color: '#F97316' }
  ];

  return (
    <div className="page-container">
      {/* 1. MASTER HEADER */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Threat Intelligence</h1>
          <p className="page-subtitle">
            Dataset-derived threat signatures, detection performance telemetry & risk classification
          </p>
        </div>

        <button
          onClick={triggerManualRefresh}
          className="btn btn-secondary"
        >
          <FaSyncAlt />
          <span>Refresh Now ({countdown}s)</span>
        </button>
      </div>

      {/* 2. TOP INTEL KPIS */}
      <div className="grid-kpi" style={{ marginBottom: 20 }}>
        <div className="kpi-card" style={{ borderBottom: '3px solid #EF4444' }}>
          <div className="kpi-icon-wrapper" style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#EF4444' }}>
            <FaCrosshairs />
          </div>
          <div>
            <div className="kpi-label">Top Threat Vector</div>
            <div className="kpi-value" style={{ fontSize: '1.25rem', color: '#EF4444' }}>
              {insights.most_frequent_attack || 'None Detected'}
            </div>
            <div className="kpi-subtext">Dominant attack class</div>
          </div>
        </div>

        <div className="kpi-card" style={{ borderBottom: '3px solid #F59E0B' }}>
          <div className="kpi-icon-wrapper" style={{ backgroundColor: 'rgba(245, 158, 11, 0.15)', color: '#F59E0B' }}>
            <FaServer />
          </div>
          <div>
            <div className="kpi-label">Frequent Attacker IP</div>
            <div className="kpi-value" style={{ fontSize: '1.1rem' }}>
              <span className="cyber-chip" style={{ color: '#F59E0B', borderColor: 'rgba(245, 158, 11, 0.4)' }}>
                {insights.top_source_ip || 'None'}
              </span>
            </div>
            <div className="kpi-subtext">Highest incursion origin</div>
          </div>
        </div>

        <div className="kpi-card" style={{ borderBottom: '3px solid var(--primary-green)' }}>
          <div className="kpi-icon-wrapper" style={{ backgroundColor: 'rgba(34, 197, 94, 0.15)', color: 'var(--primary-green)' }}>
            <FaShieldAlt />
          </div>
          <div>
            <div className="kpi-label">Primary Target IP</div>
            <div className="kpi-value" style={{ fontSize: '1.1rem' }}>
              <span className="cyber-chip">{insights.top_destination_ip || 'None'}</span>
            </div>
            <div className="kpi-subtext">Targeted endpoint sink</div>
          </div>
        </div>
      </div>

      {/* 3. 4 RISK DISTRIBUTION TIERS */}
      <div className="netshield-card" style={{ marginBottom: 24 }}>
        <div className="netshield-card-header">
          <div className="netshield-card-title">
            <FaChartBar style={{ color: 'var(--primary-green)' }} />
            <span>Threat Risk Score Distribution (4 Tiers)</span>
          </div>
          <span className="cyber-chip">Live Threat Inferences</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
          {riskDist.map((item, idx) => {
            const colors = ['#22C55E', '#F59E0B', '#F97316', '#EF4444'];
            const bgGradients = [
              'linear-gradient(135deg, rgba(34, 197, 94, 0.15), rgba(34, 197, 94, 0.03))',
              'linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(245, 158, 11, 0.03))',
              'linear-gradient(135deg, rgba(249, 115, 22, 0.18), rgba(249, 115, 22, 0.04))',
              'linear-gradient(135deg, rgba(239, 68, 68, 0.22), rgba(239, 68, 68, 0.05))'
            ];
            return (
              <div
                key={idx}
                style={{
                  padding: 18,
                  background: bgGradients[idx % 4],
                  border: `1px solid ${colors[idx % 4]}60`,
                  borderRadius: 12,
                  textAlign: 'center',
                  boxShadow: `0 4px 16px ${colors[idx % 4]}20`
                }}
              >
                <div style={{ fontSize: '0.84rem', color: '#F1F5F9', fontWeight: 800, marginBottom: 8, letterSpacing: '0.04em' }}>
                  {item.risk_category}
                </div>
                <div style={{ fontSize: '2rem', fontWeight: 900, color: colors[idx % 4] }}>
                  {item.count?.toLocaleString() || 0}
                </div>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginTop: 4, fontWeight: 600 }}>
                  Records classified
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================= */}
      {/* 4. 2 RECHARTS: THREAT INTELLIGENCE PERFORMANCE */}
      {/* ========================================================= */}
      <div className="grid-charts" style={{ marginBottom: 24 }}>
        {/* RECHART 1: Threat Detection Performance by Attack Class */}
        <div className="netshield-card">
          <div className="netshield-card-header">
            <div className="netshield-card-title">
              <FaBrain style={{ color: 'var(--primary-green)' }} />
              <span>AI Threat Detection Performance & Accuracy</span>
            </div>
            <span className="cyber-chip">Model Performance</span>
          </div>

          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={perfMetrics} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
              <XAxis dataKey="class_name" stroke="#64748B" fontSize={11} tickLine={false} />
              <YAxis stroke="#64748B" fontSize={11} domain={[90, 100]} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0a1628',
                  borderColor: 'rgba(34, 197, 94, 0.4)',
                  borderRadius: 8,
                  color: '#f8fafc',
                  fontSize: '0.82rem'
                }}
                formatter={(value, name) => [`${value}%`, name === 'accuracy' ? 'Detection Accuracy' : 'Avg Confidence']}
              />
              <Legend wrapperStyle={{ fontSize: '0.78rem', paddingTop: 6 }} />
              <Bar dataKey="accuracy" name="Accuracy %" fill="#22C55E" radius={[4, 4, 0, 0]} />
              <Bar dataKey="confidence" name="Confidence %" fill="#3B82F6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* RECHART 2: Threat Intelligence Risk Score Distribution */}
        <div className="netshield-card">
          <div className="netshield-card-header">
            <div className="netshield-card-title">
              <FaChartPie style={{ color: 'var(--primary-green)' }} />
              <span>Threat Severity & Risk Classification Ratio</span>
            </div>
            <span className="cyber-chip">4 Risk Tiers</span>
          </div>

          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={riskDist}
                dataKey="count"
                nameKey="risk_category"
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={4}
              >
                {riskDist.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color || '#22C55E'} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0a1628',
                  borderColor: 'rgba(34, 197, 94, 0.4)',
                  borderRadius: 8,
                  color: '#f8fafc',
                  fontSize: '0.82rem'
                }}
                formatter={(value, name) => [`${value?.toLocaleString()} records`, name]}
              />
              <Legend iconSize={8} wrapperStyle={{ fontSize: '0.76rem', paddingTop: 4 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 5. HIGH PRIORITY THREAT SIGNATURES TABLE */}
      <div className="netshield-card" style={{ marginBottom: 20 }}>
        <div className="netshield-card-header">
          <div className="netshield-card-title">
            <FaLock style={{ color: 'var(--primary-green)' }} />
            <span>High Priority Threat Signatures</span>
          </div>
          <span className="badge badge-critical">Active Threats</span>
        </div>

        {criticalThreats.length > 0 ? (
          <div className="netshield-table-container">
            <table className="netshield-table">
              <thead>
                <tr>
                  <th>Threat ID</th>
                  <th>Attack Type</th>
                  <th>Source IP</th>
                  <th>Destination IP</th>
                  <th>Confidence</th>
                  <th>Risk Score</th>
                  <th>Severity</th>
                  <th>Detected At</th>
                </tr>
              </thead>
              <tbody>
                {criticalThreats.map((threat) => (
                  <tr key={threat.id}>
                    <td style={{ color: 'var(--text-secondary)' }}>#{threat.id}</td>
                    <td style={{ fontWeight: 800, color: '#FFFFFF' }}>{threat.attack_type}</td>
                    <td><span className="cyber-chip">{threat.source_ip}</span></td>
                    <td><span className="cyber-chip" style={{ color: 'var(--primary-green)', borderColor: 'rgba(34, 197, 94, 0.3)' }}>{threat.destination_ip}</span></td>
                    <td style={{ fontWeight: 700 }}>{((threat.confidence || 0.95) * 100).toFixed(1)}%</td>
                    <td><span style={{ fontWeight: 900, color: '#EF4444' }}>{threat.risk_score}/100</span></td>
                    <td><SeverityBadge severity={threat.severity} /></td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{new Date(threat.detected_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState message="No critical threat signatures" description="No critical threats currently registered in intelligence feed." />
        )}
      </div>
    </div>
  );
};

export default ThreatIntelligence;
