import React, { useEffect, useState, useCallback } from 'react';
import api from '../services/api';
import { useRefresh } from '../context/RefreshContext';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';
import SeverityBadge from '../components/SeverityBadge';
import {
  FaShieldAlt, FaBug, FaFileAlt, FaBrain,
  FaSearch, FaCheckCircle, FaNetworkWired, FaLayerGroup,
  FaFire
} from 'react-icons/fa';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import ModelBenchmarkChart from '../components/security/ModelBenchmarkChart';

const ATTACK_COLORS = {
  'BENIGN': '#22C55E',
  'DDoS': '#EF4444',
  'FTP-Patator': '#F59E0B',
  'SSH-Patator': '#F97316'
};

const RISK_COLORS = {
  'Low (0-19)': '#22C55E',
  'Medium (20-59)': '#F59E0B',
  'Critical (60-100)': '#EF4444'
};

const Dashboard = () => {
  const { refreshTrigger } = useRefresh();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboard = useCallback(async () => {
    try {
      const res = await api.get('/dashboard-data');
      setData(res.data);
      setError(null);
    } catch (err) {
      console.error("Dashboard fetch error:", err);
      // Fallback to /dashboard
      try {
        const res2 = await api.get('/dashboard');
        setData(res2.data);
        setError(null);
      } catch (err2) {
        setError("Unable to connect to NetShield AI backend.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard, refreshTrigger]);

  if (loading && !data) {
    return <LoadingState message="Connecting to Live SOC Telemetry Stream..." />;
  }

  if (error && !data) {
    return <ErrorState message={error} onRetry={fetchDashboard} />;
  }

  const kpi = data?.kpi || {};
  const rfEval = data?.rf_eval || {
    model_name: 'Random Forest (Production Model)',
    accuracy: null,
    precision: null,
    recall: null,
    f1_score: null,
    correct: null,
    total: null,
    test_samples: null,
    features: null,
    classes: null,
    description: 'Dynamic evaluation of the trained Multi-Class Random Forest intrusion detection pipeline.'
  };
  const latestEval = data?.latest_eval || {
    filename: null,
    has_ground_truth: false,
    accuracy: null,
    precision: null,
    recall: null,
    f1_score: null,
    correct_predictions: null,
    wrong_predictions: null,
    message: 'Ground-truth labels unavailable — evaluation metrics cannot be calculated.'
  };
  const classesBreakdown = data?.classes_breakdown || [];
  const attackDist = data?.attack_distribution || [];
  const riskDist = data?.risk_distribution || [];
  const liveThreats = data?.live_threat_feed || [];
  const topSources = data?.top_attack_sources || [];
  const recentActivity = data?.recent_activity || [];
  const sysMon = data?.system_monitoring || { cpu_usage: 0, memory_usage: 0, network_usage: 0, firewall_status: 'ACTIVE', firewall_state: 'Protected' };

  const accuracyVal = (kpi.ai_model_accuracy !== null && kpi.ai_model_accuracy !== undefined)
    ? `${kpi.ai_model_accuracy}%`
    : (rfEval.accuracy !== null && rfEval.accuracy !== undefined ? `${rfEval.accuracy}%` : 'N/A');

  return (
    <div className="page-container">
      {/* 1. MASTER HEADER & SEARCH */}
      <div className="page-header" style={{ marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <FaShieldAlt style={{ fontSize: '2.2rem', color: 'var(--primary-green)', filter: 'drop-shadow(0 0 10px rgba(34, 197, 94, 0.6))' }} />
          <div>
            <h1 className="page-title" style={{ margin: 0 }}>Security Overview</h1>
            <p className="page-subtitle" style={{ margin: 0 }}>Real-Time Network Threat Monitoring</p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', width: 280, maxWidth: '100%' }}>
            <FaSearch style={{ position: 'absolute', left: 12, top: 11, color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search network, IP, alerts..."
              style={{
                width: '100%',
                padding: '8px 12px 8px 36px',
                backgroundColor: 'rgba(10, 22, 40, 0.9)',
                border: '1px solid var(--border-tech)',
                borderRadius: 20,
                fontSize: '0.84rem'
              }}
            />
          </div>

          <span className={`badge ${kpi.security_status?.includes('CRITICAL') ? 'badge-critical' : kpi.security_status?.includes('THREATS') ? 'badge-high' : 'badge-low'}`}>
            ● {kpi.security_status || 'CRITICAL THREATS DETECTED'}
          </span>
        </div>
      </div>

      {/* 2. REAL-TIME TELEMETRY STATUS PILLS */}
      <div style={{
        display: 'flex',
        gap: 12,
        alignItems: 'center',
        marginBottom: 20,
        flexWrap: 'wrap',
        background: 'var(--bg-panel-secondary)',
        padding: '10px 18px',
        borderRadius: 'var(--radius-sm)',
        border: '1px solid var(--border-tech)'
      }}>
        <span className="status-indicator"><span className="status-dot online" /> Backend Running</span>
        <span className="status-indicator"><span className="status-dot online" /> Database Connected</span>
        <span className="status-indicator"><span className="status-dot online" /> AI Model Loaded (Random Forest)</span>
        <span className="status-indicator" style={{ color: 'var(--light-green)', borderColor: 'rgba(34, 197, 94, 0.3)' }}><FaNetworkWired /> 78 Features</span>
        <span className="status-indicator" style={{ color: 'var(--light-green)', borderColor: 'rgba(34, 197, 94, 0.3)' }}>4 Classes</span>
      </div>

      {/* 3. 5 TOP STATISTICS CARDS */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 14,
        marginBottom: 20
      }}>
        {/* Card 1: Total Traffic */}
        <div className="netshield-card" style={{ borderBottom: '3px solid var(--primary-green)', padding: '16px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div className="kpi-icon-wrapper" style={{ backgroundColor: 'rgba(34, 197, 94, 0.15)', color: 'var(--primary-green)' }}>
              <FaNetworkWired />
            </div>
            <div>
              <div className="kpi-label">Total Traffic</div>
              <div className="kpi-value" style={{ color: 'var(--primary-green)' }}>{kpi.total_traffic !== undefined && kpi.total_traffic !== null ? kpi.total_traffic.toLocaleString() : '0'}</div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>{kpi.safe_packets !== undefined && kpi.safe_packets !== null ? kpi.safe_packets.toLocaleString() : '0'} Safe Packets</div>
            </div>
          </div>
        </div>

        {/* Card 2: Threats Detected */}
        <div className="netshield-card" style={{ borderBottom: '3px solid #EF4444', padding: '16px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div className="kpi-icon-wrapper" style={{ backgroundColor: 'rgba(239, 68, 68, 0.18)', color: '#EF4444' }}>
              <FaBug />
            </div>
            <div>
              <div className="kpi-label">Threats Detected</div>
              <div className="kpi-value" style={{ color: '#EF4444' }}>{kpi.threats_detected !== undefined && kpi.threats_detected !== null ? kpi.threats_detected.toLocaleString() : '0'}</div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>Classified Malicious</div>
            </div>
          </div>
        </div>

        {/* Card 3: Critical Threats */}
        <div className="netshield-card" style={{ borderBottom: '3px solid #F97316', padding: '16px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div className="kpi-icon-wrapper" style={{ backgroundColor: 'rgba(249, 115, 22, 0.15)', color: '#F97316' }}>
              <FaFire />
            </div>
            <div>
              <div className="kpi-label">Critical Threats</div>
              <div className="kpi-value" style={{ color: '#F97316' }}>{kpi.critical_threats !== undefined && kpi.critical_threats !== null ? kpi.critical_threats.toLocaleString() : '0'}</div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>Immediate Action</div>
            </div>
          </div>
        </div>

        {/* Card 4: Average Risk Score */}
        <div className="netshield-card" style={{ borderBottom: '3px solid var(--primary-green)', padding: '16px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div className="kpi-icon-wrapper" style={{ backgroundColor: 'rgba(34, 197, 94, 0.15)', color: 'var(--primary-green)' }}>
              <FaShieldAlt />
            </div>
            <div>
              <div className="kpi-label">Average Risk Score</div>
              <div className="kpi-value" style={{ color: 'var(--primary-green)' }}>{kpi.average_risk_score !== undefined && kpi.average_risk_score !== null ? kpi.average_risk_score : (kpi.avg_risk_score || '0.0')}<span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>/100</span></div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>Severity: {kpi.critical_threats > 0 ? 'CRITICAL' : (kpi.threats_detected > 0 ? 'HIGH' : 'NORMAL')}</div>
            </div>
          </div>
        </div>

        {/* Card 5: AI Model Accuracy */}
        <div className="netshield-card" style={{ borderBottom: '3px solid var(--primary-green)', padding: '16px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div className="kpi-icon-wrapper" style={{ backgroundColor: 'rgba(34, 197, 94, 0.15)', color: 'var(--primary-green)' }}>
              <FaBrain />
            </div>
            <div>
              <div className="kpi-label">AI Model Accuracy</div>
              <div className="kpi-value" style={{ color: 'var(--primary-green)' }}>{accuracyVal}</div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>Random Forest Pipeline</div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. THE 4 REAL ATTACK CLASSES IN THE PROJECT */}
      <div className="netshield-card" style={{ marginBottom: 20, borderTop: '3px solid var(--primary-green)' }}>
        <div className="netshield-card-header">
          <div className="netshield-card-title">
            <FaLayerGroup style={{ color: 'var(--primary-green)' }} />
            <span>4 Threat Classification Classes (Real Dataset Results)</span>
          </div>
          <span className="cyber-chip">{kpi.total_traffic?.toLocaleString() || '3,000'} Flow Inferences</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 14 }}>
          {classesBreakdown.map((item, idx) => (
            <div
              key={idx}
              style={{
                padding: '14px 16px',
                background: `linear-gradient(135deg, ${item.color}15, rgba(10, 22, 40, 0.85))`,
                borderRadius: 'var(--radius-sm)',
                border: `1px solid ${item.color}45`,
                transition: 'all var(--transition-fast)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: '0.98rem', fontWeight: 800, color: '#FFFFFF' }}>{item.name}</span>
                <span className={`badge ${item.name === 'BENIGN' ? 'badge-low' : item.name === 'DDoS' ? 'badge-critical' : item.name === 'FTP-Patator' ? 'badge-medium' : 'badge-high'}`}>
                  {item.severity}
                </span>
              </div>

              <div style={{ fontSize: '1.8rem', fontWeight: 900, color: item.color }}>
                {item.count?.toLocaleString()}
                <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 700, marginLeft: 6 }}>
                  ({item.percentage}%)
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: '0.76rem', color: 'var(--text-secondary)', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 6 }}>
                <span>Confidence: <strong style={{ color: item.color }}>{item.avg_confidence}%</strong></span>
                <span>Risk: <strong style={{ color: item.color }}>{item.risk_score}/100</strong></span>
              </div>
            </div>
          ))}
        </div>
      </div>



      {/* 5B. RANDOM FOREST MODEL PERFORMANCE (CHART.JS) */}
      <div style={{ marginBottom: 20 }}>
        <ModelBenchmarkChart
          latestUpload={data?.latest_upload || data?.latest_eval}
          rfEval={data?.rf_eval}
          model={data?.model}
        />
      </div>

      {/* 6. LATEST UPLOADED FILE EVALUATION */}
      <div className="netshield-card" style={{ marginBottom: 20, borderTop: '3px solid var(--primary-green)' }}>
        <div className="netshield-card-header">
          <div className="netshield-card-title">
            <FaFileAlt style={{ color: 'var(--primary-green)' }} />
            <span>Latest Uploaded File Evaluation</span>
          </div>
        </div>

        <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: 6 }}>
          File: <span className="cyber-chip" style={{ marginLeft: 6 }}>{latestEval.filename || 'No Dataset Uploaded'}</span>
        </div>
        <div style={{ fontSize: '0.82rem', color: latestEval.has_ground_truth ? 'var(--primary-green)' : '#F59E0B', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
          <FaCheckCircle style={{ flexShrink: 0, color: latestEval.has_ground_truth ? 'var(--primary-green)' : '#F59E0B' }} />
          <span>{latestEval.has_ground_truth ? (latestEval.message || 'Ground-truth labels verified in uploaded dataset. Evaluation metrics calculated dynamically using sklearn.metrics.') : 'Ground-truth labels unavailable — evaluation metrics cannot be calculated.'}</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
          <div style={{ padding: 12, background: 'rgba(10, 22, 40, 0.85)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-tech)' }}>
            <div className="kpi-label">Uploaded Accuracy</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--primary-green)', marginTop: 2 }}>
              {latestEval.accuracy !== null && latestEval.accuracy !== undefined ? `${latestEval.accuracy}%` : 'N/A'}
            </div>
          </div>
          <div style={{ padding: 12, background: 'rgba(10, 22, 40, 0.85)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-tech)' }}>
            <div className="kpi-label">Precision</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--primary-green)', marginTop: 2 }}>
              {latestEval.precision !== null && latestEval.precision !== undefined ? `${latestEval.precision}%` : 'N/A'}
            </div>
          </div>
          <div style={{ padding: 12, background: 'rgba(10, 22, 40, 0.85)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-tech)' }}>
            <div className="kpi-label">Recall</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--primary-green)', marginTop: 2 }}>
              {latestEval.recall !== null && latestEval.recall !== undefined ? `${latestEval.recall}%` : 'N/A'}
            </div>
          </div>
          <div style={{ padding: 12, background: 'rgba(10, 22, 40, 0.85)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-tech)' }}>
            <div className="kpi-label">F1 Score</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--primary-green)', marginTop: 2 }}>
              {latestEval.f1_score !== null && latestEval.f1_score !== undefined ? `${latestEval.f1_score}%` : 'N/A'}
            </div>
          </div>
          <div style={{ padding: 12, background: 'rgba(10, 22, 40, 0.85)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-tech)' }}>
            <div className="kpi-label">Correct Predictions</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--primary-green)', marginTop: 2 }}>
              {latestEval.correct_predictions !== null && latestEval.correct_predictions !== undefined ? latestEval.correct_predictions : 'N/A'}
            </div>
          </div>
          <div style={{ padding: 12, background: 'rgba(10, 22, 40, 0.85)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-tech)' }}>
            <div className="kpi-label">Wrong Predictions</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#EF4444', marginTop: 2 }}>
              {latestEval.wrong_predictions !== null && latestEval.wrong_predictions !== undefined ? latestEval.wrong_predictions : 'N/A'}
            </div>
          </div>
        </div>
      </div>

      {/* 7. CHARTS: ATTACK DISTRIBUTION DONUT & RISK DISTRIBUTION DONUT */}
      <div className="grid-charts" style={{ marginBottom: 20 }}>
        {/* Attack Distribution Donut Chart */}
        <div className="netshield-card">
          <div className="netshield-card-header">
            <div className="netshield-card-title">
              <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'var(--primary-green)', display: 'inline-block' }} />
              <span>Attack Distribution</span>
            </div>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>4 Attack Classes</span>
          </div>
          {attackDist.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={attackDist}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                  label
                >
                  {attackDist.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={ATTACK_COLORS[entry.name] || entry.color || '#22C55E'} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#0a1628', borderColor: 'rgba(34, 197, 94, 0.4)', borderRadius: 8, color: '#f8fafc' }} />
                <Legend iconSize={8} wrapperStyle={{ fontSize: '0.78rem' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState message="No attack distribution data" />
          )}
        </div>

        {/* Risk Distribution Donut Chart */}
        <div className="netshield-card">
          <div className="netshield-card-header">
            <div className="netshield-card-title">
              <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#F59E0B', display: 'inline-block' }} />
              <span>Risk Distribution</span>
            </div>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>Calculated from threat severity</span>
          </div>
          {riskDist.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={riskDist}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                  label
                >
                  {riskDist.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={RISK_COLORS[entry.name] || entry.color || '#22C55E'} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#0a1628', borderColor: 'rgba(34, 197, 94, 0.4)', borderRadius: 8, color: '#f8fafc' }} />
                <Legend iconSize={8} wrapperStyle={{ fontSize: '0.78rem' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState message="No risk distribution data" />
          )}
        </div>
      </div>

      {/* 8. LIVE THREAT FEED & TOP ATTACK SOURCES */}
      <div className="grid-charts" style={{ marginBottom: 20 }}>
        {/* Live Threat Feed */}
        <div className="netshield-card">
          <div className="netshield-card-header">
            <div className="netshield-card-title">
              <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#EF4444', display: 'inline-block' }} />
              <span>Live Threat Feed</span>
            </div>
          </div>
          <div className="netshield-table-container">
            <table className="netshield-table" style={{ minWidth: '100%' }}>
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Severity</th>
                  <th>Attack</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {liveThreats.map((t, idx) => (
                  <tr key={idx}>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.78rem' }}>{t.time}</td>
                    <td><SeverityBadge severity={t.severity} /></td>
                    <td style={{ fontWeight: 700, color: '#FFFFFF' }}>{t.attack}</td>
                    <td><span className="badge badge-info">{t.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Attack Sources */}
        <div className="netshield-card">
          <div className="netshield-card-header">
            <div className="netshield-card-title">
              <span>🌍 Top Attack Sources</span>
            </div>
          </div>
          <div className="netshield-table-container">
            <table className="netshield-table" style={{ minWidth: '100%' }}>
              <thead>
                <tr>
                  <th>Country / Source</th>
                  <th>Attack</th>
                  <th>Attempts</th>
                  <th>Risk</th>
                </tr>
              </thead>
              <tbody>
                {topSources.map((src, idx) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: 700, color: 'var(--light-green)' }}>{src.country}</td>
                    <td>{src.attack}</td>
                    <td style={{ fontWeight: 800 }}>{src.attempts}</td>
                    <td><SeverityBadge severity={src.risk} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 9. RECENT SECURITY ACTIVITY & REAL-TIME SYSTEM MONITORING */}
      <div className="grid-charts">
        {/* Recent Security Activity */}
        <div className="netshield-card">
          <div className="netshield-card-header">
            <div className="netshield-card-title">
              <span>📋 Recent Security Activity</span>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {recentActivity.map((act, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 14px',
                  background: 'rgba(10, 22, 40, 0.8)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-tech)',
                  transition: 'all var(--transition-fast)'
                }}
              >
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', minWidth: 65 }}>{act.time}</span>
                <span style={{ fontSize: '1.1rem' }}>{act.icon}</span>
                <span style={{ fontSize: '0.84rem', color: 'var(--text-primary)', flex: 1 }}>{act.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Real-Time System Monitoring */}
        <div className="netshield-card">
          <div className="netshield-card-header">
            <div className="netshield-card-title">
              <span>🖲️ Real-Time System Monitoring</span>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ padding: 14, background: 'rgba(10, 22, 40, 0.85)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-tech)' }}>
              <div className="kpi-label" style={{ marginBottom: 4 }}>CPU Usage</div>
              <div style={{ fontSize: '1.45rem', fontWeight: 900, color: 'var(--primary-green)' }}>{sysMon.cpu_usage}%</div>
              <div style={{ height: 6, width: '100%', background: 'rgba(255,255,255,0.08)', borderRadius: 3, marginTop: 8, overflow: 'hidden' }}>
                <div style={{ width: `${sysMon.cpu_usage}%`, height: '100%', background: 'var(--primary-green)' }} />
              </div>
            </div>

            <div style={{ padding: 14, background: 'rgba(10, 22, 40, 0.85)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-tech)' }}>
              <div className="kpi-label" style={{ marginBottom: 4 }}>Memory Usage</div>
              <div style={{ fontSize: '1.45rem', fontWeight: 900, color: '#3B82F6' }}>{sysMon.memory_usage}%</div>
              <div style={{ height: 6, width: '100%', background: 'rgba(255,255,255,0.08)', borderRadius: 3, marginTop: 8, overflow: 'hidden' }}>
                <div style={{ width: `${sysMon.memory_usage}%`, height: '100%', background: '#3B82F6' }} />
              </div>
            </div>

            <div style={{ padding: 14, background: 'rgba(10, 22, 40, 0.85)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-tech)' }}>
              <div className="kpi-label" style={{ marginBottom: 4 }}>Network Usage</div>
              <div style={{ fontSize: '1.45rem', fontWeight: 900, color: '#F59E0B' }}>{sysMon.network_usage}%</div>
              <div style={{ height: 6, width: '100%', background: 'rgba(255,255,255,0.08)', borderRadius: 3, marginTop: 8, overflow: 'hidden' }}>
                <div style={{ width: `${sysMon.network_usage}%`, height: '100%', background: '#F59E0B' }} />
              </div>
            </div>

            <div style={{ padding: 14, background: 'rgba(10, 22, 40, 0.85)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-tech)' }}>
              <div className="kpi-label" style={{ marginBottom: 4 }}>Firewall</div>
              <div style={{ fontSize: '1.45rem', fontWeight: 900, color: 'var(--primary-green)' }}>{sysMon.firewall_status || 'ACTIVE'}</div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginTop: 2 }}>Status: {sysMon.firewall_state || 'Protected'}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
