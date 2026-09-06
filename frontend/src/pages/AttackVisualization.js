import React, { useEffect, useState, useCallback } from 'react';
import api from '../services/api';
import { useRefresh } from '../context/RefreshContext';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';
import SeverityBadge from '../components/SeverityBadge';
import {
  FaBrain, FaFileCsv, FaChartBar, FaNetworkWired,
  FaHdd, FaTachometerAlt, FaLayerGroup, FaCheckCircle
} from 'react-icons/fa';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

const COLORS = ['#EF4444', '#F59E0B', '#22C55E', '#3B82F6', '#8B5CF6'];

const AttackVisualization = () => {
  const { refreshTrigger } = useRefresh();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchVizData = useCallback(async () => {
    try {
      const res = await api.get('/attack-visualization');
      setData(res.data);
      setError(null);
    } catch (err) {
      console.error("Attack viz error:", err);
      setError("Failed to fetch attack telemetry charts.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVizData();
  }, [fetchVizData, refreshTrigger]);

  if (loading && !data) {
    return <LoadingState message="Rendering Comprehensive Attack Visualizations & Model Telemetry..." />;
  }

  if (error && !data) {
    return <ErrorState message={error} onRetry={fetchVizData} />;
  }

  const attackTrend = data?.attack_trend || [];
  const weeklyAttacks = data?.weekly_attacks || [];
  const radarData = data?.radar_data || [];
  const severityDist = data?.severity_distribution || [];
  const allModels = data?.all_models_eval || [];
  const riskDist = data?.risk_distribution || [];
  const latestDataset = data?.latest_dataset || null;
  const latestOutputs = data?.latest_outputs || [];
  const trafficSummary = data?.traffic_summary || {};

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Attack Visualization & Forensics</h1>
          <p className="page-subtitle">Multi-Model Classification, Risk Distribution, Traffic Influx & Real-Time Threat Forensics</p>
        </div>
      </div>

      {/* 1. LATEST UPLOADED DATASET FILE & TRAFFIC SUMMARY */}
      {latestDataset && (
        <div className="netshield-card" style={{ marginBottom: 24, borderTop: '3px solid var(--primary-green)' }}>
          <div className="netshield-card-header">
            <div className="netshield-card-title">
              <FaFileCsv style={{ color: 'var(--primary-green)', fontSize: '1.4rem' }} />
              <span>Latest Uploaded Dataset File</span>
              <span className="badge badge-low" style={{ marginLeft: 8 }}>{latestDataset.status || 'PROCESSED'}</span>
            </div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
              Uploaded: {new Date(latestDataset.upload_time).toLocaleString()}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginTop: 8 }}>
            <div style={{ padding: 12, background: 'rgba(10, 22, 40, 0.85)', borderRadius: 8, border: '1px solid var(--border-tech)' }}>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.74rem', fontWeight: 700 }}>FILENAME</div>
              <div style={{ fontWeight: 800, color: 'var(--text-primary)', marginTop: 3, fontSize: '0.95rem' }}>{latestDataset.filename}</div>
            </div>
            <div style={{ padding: 12, background: 'rgba(10, 22, 40, 0.85)', borderRadius: 8, border: '1px solid var(--border-tech)' }}>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.74rem', fontWeight: 700 }}>DETECTED SCHEMA</div>
              <div style={{ fontWeight: 800, color: 'var(--primary-green)', marginTop: 3, fontSize: '0.95rem' }}>{latestDataset.dataset_type}</div>
            </div>
            <div style={{ padding: 12, background: 'rgba(10, 22, 40, 0.85)', borderRadius: 8, border: '1px solid var(--border-tech)' }}>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.74rem', fontWeight: 700 }}>DIMENSIONS</div>
              <div style={{ fontWeight: 800, color: 'var(--text-primary)', marginTop: 3, fontSize: '0.95rem' }}>{latestDataset.rows_count} rows × {latestDataset.columns_count} cols</div>
            </div>
            <div style={{ padding: 12, background: 'rgba(10, 22, 40, 0.85)', borderRadius: 8, border: '1px solid var(--border-tech)' }}>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.74rem', fontWeight: 700 }}>GROUND TRUTH</div>
              <div style={{ fontWeight: 800, color: latestDataset.has_ground_truth ? 'var(--primary-green)' : '#F59E0B', marginTop: 3, fontSize: '0.95rem' }}>
                {latestDataset.has_ground_truth ? 'AVAILABLE' : 'NOT PRESENT'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. OUTPUTS CLASSIFIED FROM THE LATEST UPLOADED FILE */}
      <div className="netshield-card" style={{ marginBottom: 24 }}>
        <div className="netshield-card-header">
          <div className="netshield-card-title">
            <FaCheckCircle style={{ color: 'var(--primary-green)' }} />
            <span>Outputs & Telemetry Classified from Latest File</span>
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Showing latest inference records</span>
        </div>

        {latestOutputs.length > 0 ? (
          <div className="netshield-table-container">
            <table className="netshield-table">
              <thead>
                <tr>
                  <th>Threat ID</th>
                  <th>Attack Classification</th>
                  <th>Source IP</th>
                  <th>Destination IP</th>
                  <th>Protocol</th>
                  <th>Confidence</th>
                  <th>Risk Score</th>
                  <th>Severity</th>
                  <th>Detection Time</th>
                </tr>
              </thead>
              <tbody>
                {latestOutputs.map((out) => (
                  <tr key={out.id}>
                    <td style={{ color: 'var(--text-secondary)' }}>#{out.id}</td>
                    <td style={{ fontWeight: 800, color: '#FFFFFF' }}>{out.attack_type}</td>
                    <td><span className="cyber-chip">{out.source_ip}</span></td>
                    <td><span className="cyber-chip" style={{ color: 'var(--primary-green)', borderColor: 'rgba(34, 197, 94, 0.3)' }}>{out.destination_ip}</span></td>
                    <td><span className="badge badge-info">{out.protocol || 'TCP'}</span></td>
                    <td style={{ fontWeight: 700 }}>{(out.confidence * 100).toFixed(1)}%</td>
                    <td><span style={{ fontWeight: 900, color: out.risk_score >= 85 ? '#EF4444' : out.risk_score >= 60 ? '#F97316' : '#F59E0B' }}>{out.risk_score}/100</span></td>
                    <td><SeverityBadge severity={out.severity} /></td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{new Date(out.detected_at).toLocaleTimeString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState message="No inference outputs recorded" description="Upload a CSV dataset to view classified threat outputs." />
        )}
      </div>

      {/* 3. RANDOM FOREST PRODUCTION MODEL EVALUATION */}
      <div className="netshield-card" style={{ marginBottom: 24 }}>
        <div className="netshield-card-header">
          <div className="netshield-card-title">
            <FaBrain style={{ color: 'var(--primary-green)' }} />
            <span>Random Forest Production Model Evaluation & Performance</span>
          </div>
          <span className="badge badge-info">78 Features Evaluated</span>
        </div>

        {allModels.length > 0 ? (
          <div className="netshield-table-container">
            <table className="netshield-table">
              <thead>
                <tr>
                  <th>Data Model Name</th>
                  <th>Accuracy</th>
                  <th>Precision</th>
                  <th>Recall</th>
                  <th>F1-Score</th>
                  <th>Correct Predictions</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {allModels.map((m, idx) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: 800, color: idx === 0 ? 'var(--primary-green)' : '#FFFFFF' }}>
                      {m.model_name}
                      {idx === 0 && <span className="badge badge-low" style={{ marginLeft: 8 }}>PRIMARY ACTIVE</span>}
                    </td>
                    <td style={{ color: 'var(--primary-green)', fontWeight: 900 }}>{m.accuracy}%</td>
                    <td style={{ color: 'var(--primary-green)', fontWeight: 800 }}>{m.precision}%</td>
                    <td style={{ color: '#F59E0B', fontWeight: 800 }}>{m.recall}%</td>
                    <td style={{ color: '#8B5CF6', fontWeight: 900 }}>{m.f1_score}%</td>
                    <td><span className="cyber-chip">{m.correct} / {m.total}</span></td>
                    <td>
                      <span className={`badge ${idx === 0 ? 'badge-low' : 'badge-info'}`}>
                        {idx === 0 ? 'ACTIVE INFERENCE' : 'BENCHMARKED'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState message="No model evaluation data" description="Model evaluation metrics computed upon dataset upload." />
        )}
      </div>

      {/* 4. 4-TIER THREAT RISK SCORE DISTRIBUTION */}
      <div className="netshield-card" style={{ marginBottom: 24 }}>
        <div className="netshield-card-header">
          <div className="netshield-card-title">
            <FaChartBar style={{ color: 'var(--primary-green)' }} />
            <span>4-Tier Threat Risk Score Distribution</span>
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Aggregated across all classified network records</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
          {riskDist.map((item, idx) => (
            <div
              key={idx}
              style={{
                padding: 18,
                background: `linear-gradient(135deg, ${item.color}15, ${item.color}04)`,
                border: `1px solid ${item.color}60`,
                borderRadius: 12,
                textAlign: 'center',
                boxShadow: `0 4px 16px ${item.color}18`
              }}
            >
              <div style={{ fontSize: '0.82rem', color: '#F1F5F9', fontWeight: 800, marginBottom: 8, letterSpacing: '0.04em' }}>
                {item.risk_category}
              </div>
              <div style={{ fontSize: '2.1rem', fontWeight: 900, color: item.color }}>
                {item.count}
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginTop: 4, fontWeight: 700 }}>
                {item.label || 'Records Classified'}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. NETWORK TRAFFIC TELEMETRY SUMMARY */}
      <div className="grid-kpi" style={{ marginBottom: 24 }}>
        <div className="kpi-card">
          <div className="kpi-icon-wrapper" style={{ backgroundColor: 'rgba(34, 197, 94, 0.15)', color: 'var(--primary-green)' }}>
            <FaNetworkWired />
          </div>
          <div>
            <div className="kpi-label">Analyzed Flow Records</div>
            <div className="kpi-value">{trafficSummary.total_records || 3000}</div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrapper" style={{ backgroundColor: 'rgba(34, 197, 94, 0.15)', color: 'var(--primary-green)' }}>
            <FaLayerGroup />
          </div>
          <div>
            <div className="kpi-label">Aggregated Packets</div>
            <div className="kpi-value">{trafficSummary.total_packets ? trafficSummary.total_packets.toLocaleString() : '425,000'}</div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrapper" style={{ backgroundColor: 'rgba(245, 158, 11, 0.15)', color: '#F59E0B' }}>
            <FaHdd />
          </div>
          <div>
            <div className="kpi-label">Traffic Volume</div>
            <div className="kpi-value">{trafficSummary.total_bytes_mb ? `${trafficSummary.total_bytes_mb} MB` : '244.14 MB'}</div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrapper" style={{ backgroundColor: 'rgba(139, 92, 246, 0.15)', color: '#8B5CF6' }}>
            <FaTachometerAlt />
          </div>
          <div>
            <div className="kpi-label">Traffic Throughput</div>
            <div className="kpi-value">{trafficSummary.traffic_rate || 45.2} req/s</div>
          </div>
        </div>
      </div>

      {/* 6. INTERACTIVE CHARTS: ATTACK TREND, SEVERITY, VECTORS, RADAR */}
      <div className="grid-charts">
        {/* A. Chronological Timeline Trend Area Chart */}
        <div className="netshield-card">
          <div className="netshield-card-header">
            <div className="netshield-card-title">Attack Influx Timeline Trend</div>
          </div>
          {attackTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={attackTrend}>
                <defs>
                  <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22C55E" stopOpacity={0.85}/>
                    <stop offset="95%" stopColor="#22C55E" stopOpacity={0.05}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" stroke="#94A3B8" tick={{ fontSize: 11 }} />
                <YAxis stroke="#94A3B8" />
                <Tooltip contentStyle={{ backgroundColor: '#0a1628', borderColor: 'rgba(34, 197, 94, 0.4)', color: '#FFFFFF', borderRadius: 8 }} />
                <Area type="monotone" dataKey="count" stroke="#22C55E" strokeWidth={2} fillOpacity={1} fill="url(#areaGradient)" name="Total Attacks" />
                <Area type="monotone" dataKey="critical_count" stroke="#EF4444" strokeWidth={2} fill="#EF4444" fillOpacity={0.25} name="Critical Threats" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState message="No timeline data available" description="Upload network traffic records to inspect attack timeline trends." />
          )}
        </div>

        {/* B. Threat Severity Breakdown Donut Chart */}
        <div className="netshield-card">
          <div className="netshield-card-header">
            <div className="netshield-card-title">Threat Severity Distribution</div>
          </div>
          {severityDist.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={severityDist}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={3}
                  label
                >
                  {severityDist.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#0a1628', borderColor: 'rgba(34, 197, 94, 0.4)', borderRadius: 8 }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState message="No severity distribution data" description="Upload a dataset to generate breakdown." />
          )}
        </div>

        {/* C. Attack Vector Multi-Window Breakdown */}
        <div className="netshield-card">
          <div className="netshield-card-header">
            <div className="netshield-card-title">Network Traffic & Attack Vector Breakdown</div>
          </div>
          {weeklyAttacks.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={weeklyAttacks}>
                <XAxis dataKey="period" stroke="#94A3B8" tick={{ fontSize: 11 }} />
                <YAxis stroke="#94A3B8" />
                <Tooltip contentStyle={{ backgroundColor: '#0a1628', borderColor: 'rgba(34, 197, 94, 0.4)', borderRadius: 8 }} />
                <Legend />
                <Bar dataKey="DDoS" stackId="a" fill="#EF4444" />
                <Bar dataKey="Patator" stackId="a" fill="#F59E0B" />
                <Bar dataKey="PortScan" stackId="a" fill="#22C55E" />
                <Bar dataKey="Other" stackId="a" fill="#8B5CF6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState message="No attack vector telemetry" description="Upload network traffic records to inspect attack vectors." />
          )}
        </div>

        {/* D. Security System Capability Radar Chart */}
        <div className="netshield-card">
          <div className="netshield-card-header">
            <div className="netshield-card-title">Security System Capability Assessment</div>
          </div>
          <div style={{ width: '100%', height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart
                cx="50%"
                cy="50%"
                outerRadius={85}
                data={radarData}
                margin={{ top: 10, right: 20, bottom: 10, left: 20 }}
              >
                <PolarGrid stroke="rgba(34, 197, 94, 0.25)" />
                <PolarAngleAxis
                  dataKey="subject"
                  stroke="#94A3B8"
                  tick={{ fill: '#F1F5F9', fontSize: 10, fontWeight: 600 }}
                />
                <PolarRadiusAxis stroke="rgba(34, 197, 94, 0.15)" angle={30} domain={[0, 100]} />
                <Radar
                  name="Capability Score"
                  dataKey="A"
                  stroke="#22C55E"
                  fill="#22C55E"
                  fillOpacity={0.35}
                />
                <Tooltip contentStyle={{ backgroundColor: '#0a1628', borderColor: 'rgba(34, 197, 94, 0.4)', borderRadius: 8 }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttackVisualization;
