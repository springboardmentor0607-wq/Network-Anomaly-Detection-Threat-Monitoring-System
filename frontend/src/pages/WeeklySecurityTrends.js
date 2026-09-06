import React, { useEffect, useState, useCallback } from 'react';
import api from '../services/api';
import { useRefresh } from '../context/RefreshContext';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';
import WeeklyAttackTrend from '../components/security/WeeklyAttackTrend';
import AttackTypeTrend from '../components/security/AttackTypeTrend';
import ThreatSeverityChart from '../components/security/ThreatSeverityChart';
import DailyAlertTrend from '../components/security/DailyAlertTrend';
import ThreatActivityChart from '../components/security/ThreatActivityChart';
import WeeklySecuritySummary from '../components/security/WeeklySecuritySummary';
import {
  FaBug, FaFire, FaBell, FaPercent, FaBrain, FaSyncAlt, FaCheckCircle
} from 'react-icons/fa';

const WeeklySecurityTrends = () => {
  const { refreshTrigger, countdown, triggerManualRefresh } = useRefresh();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTrends = useCallback(async () => {
    try {
      const res = await api.get('/weekly-security-trends');
      setData(res.data);
      setError(null);
    } catch (err) {
      console.error("Weekly trends error:", err);
      setError("Unable to load weekly security trends.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTrends();
  }, [fetchTrends, refreshTrigger]);

  // Fallback 60s auto refresh cleanup
  useEffect(() => {
    const timer = setInterval(() => {
      fetchTrends();
    }, 60000);
    return () => clearInterval(timer);
  }, [fetchTrends]);

  if (loading && !data) {
    return <LoadingState message="Aggregating 7-Day Network Telemetry & Security Trends..." />;
  }

  if (error && !data) {
    return <ErrorState message={error} onRetry={fetchTrends} />;
  }

  const summary = data?.summary || {};
  const dailyAttackTrend = data?.daily_attack_trend || [];
  const attackTypeDist = data?.attack_type_distribution || [];
  const severityDist = data?.severity_distribution || [];
  const dailyAlertTrend = data?.daily_alert_trend || [];
  const threatActivityByDay = data?.threat_activity_by_day || [];
  const modelPerf = data?.model_performance || {};
  const weeklySummary = data?.weekly_summary || {};

  const hasActivity = (summary.total_threats || 0) > 0 || (summary.security_alerts || 0) > 0;

  return (
    <div className="page-container">
      {/* 1. MASTER HEADER */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Weekly Security Trends</h1>
          <p className="page-subtitle">
            Monitor attack activity, threat severity, alerts, and security performance over the last 7 days.
          </p>
        </div>

        <button
          onClick={triggerManualRefresh}
          className="btn btn-secondary"
        >
          <FaSyncAlt />
          <span>Refresh ({countdown}s)</span>
        </button>
      </div>

      {/* 2. TOP 5 KPI CARDS */}
      <div className="grid-kpi" style={{ marginBottom: 20 }}>
        {/* KPI 1: Total Threats */}
        <div className="kpi-card" style={{ borderBottom: '3px solid #EF4444' }}>
          <div className="kpi-icon-wrapper" style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#EF4444' }}>
            <FaBug />
          </div>
          <div>
            <div className="kpi-label">TOTAL THREATS</div>
            <div className="kpi-value" style={{ color: '#EF4444' }}>
              {summary.total_threats?.toLocaleString() || '0'}
            </div>
            <div className="kpi-subtext">Last 7 Days Incursions</div>
          </div>
        </div>

        {/* KPI 2: Critical Threats */}
        <div className="kpi-card" style={{ borderBottom: '3px solid #F97316' }}>
          <div className="kpi-icon-wrapper" style={{ backgroundColor: 'rgba(249, 115, 22, 0.15)', color: '#F97316' }}>
            <FaFire />
          </div>
          <div>
            <div className="kpi-label">CRITICAL THREATS</div>
            <div className="kpi-value" style={{ color: '#F97316' }}>
              {summary.critical_threats?.toLocaleString() || '0'}
            </div>
            <div className="kpi-subtext">Immediate Action Tier</div>
          </div>
        </div>

        {/* KPI 3: Security Alerts */}
        <div className="kpi-card" style={{ borderBottom: '3px solid #3B82F6' }}>
          <div className="kpi-icon-wrapper" style={{ backgroundColor: 'rgba(59, 130, 246, 0.15)', color: '#3B82F6' }}>
            <FaBell />
          </div>
          <div>
            <div className="kpi-label">SECURITY ALERTS</div>
            <div className="kpi-value" style={{ color: '#3B82F6' }}>
              {summary.security_alerts?.toLocaleString() || '0'}
            </div>
            <div className="kpi-subtext">Active SOC Triggered</div>
          </div>
        </div>

        {/* KPI 4: Attack Rate */}
        <div className="kpi-card" style={{ borderBottom: '3px solid #F59E0B' }}>
          <div className="kpi-icon-wrapper" style={{ backgroundColor: 'rgba(245, 158, 11, 0.15)', color: '#F59E0B' }}>
            <FaPercent />
          </div>
          <div>
            <div className="kpi-label">ATTACK RATE</div>
            <div className="kpi-value" style={{ color: '#F59E0B' }}>
              {summary.attack_rate || 0}%
            </div>
            <div className="kpi-subtext">Malicious vs Ingress</div>
          </div>
        </div>

        {/* KPI 5: Detection Accuracy */}
        <div className="kpi-card" style={{ borderBottom: '3px solid var(--primary-green)' }}>
          <div className="kpi-icon-wrapper" style={{ backgroundColor: 'rgba(34, 197, 94, 0.15)', color: 'var(--primary-green)' }}>
            <FaBrain />
          </div>
          <div>
            <div className="kpi-label">DETECTION ACCURACY</div>
            <div className="kpi-value" style={{ color: 'var(--primary-green)' }}>
              {summary.accuracy !== null && summary.accuracy !== undefined ? `${summary.accuracy}%` : (modelPerf.accuracy !== null && modelPerf.accuracy !== undefined ? `${modelPerf.accuracy}%` : 'N/A')}
            </div>
            <div className="kpi-subtext">Random Forest Pipeline</div>
          </div>
        </div>
      </div>

      {!hasActivity && (
        <div style={{ marginBottom: 20 }}>
          <EmptyState
            message="No security activity recorded for the selected period."
            description="Upload traffic flow datasets to generate 7-day security trend analytics."
          />
        </div>
      )}

      {/* 3. CHARTS ROW 1: WEEKLY ATTACK TREND & ATTACK TYPES THIS WEEK */}
      <div className="grid-charts" style={{ marginBottom: 20 }}>
        <WeeklyAttackTrend data={dailyAttackTrend} height={280} />
        <AttackTypeTrend data={attackTypeDist} height={280} />
      </div>

      {/* 4. CHARTS ROW 2: THREAT SEVERITY DISTRIBUTION & DAILY SECURITY ALERTS */}
      <div className="grid-charts" style={{ marginBottom: 20 }}>
        <ThreatSeverityChart data={severityDist} height={280} />
        <DailyAlertTrend data={dailyAlertTrend} height={280} />
      </div>

      {/* 5. THREAT ACTIVITY BY DAY (MON-SUN) */}
      <div style={{ marginBottom: 20 }}>
        <ThreatActivityChart data={threatActivityByDay} height={260} />
      </div>

      {/* 6. AI DETECTION PERFORMANCE */}
      <div className="netshield-card" style={{ marginBottom: 20, borderTop: '3px solid var(--primary-green)' }}>
        <div className="netshield-card-header">
          <div className="netshield-card-title">
            <FaBrain style={{ color: 'var(--primary-green)' }} />
            <span>AI Detection Performance</span>
          </div>
          <span className="cyber-chip">Model: {modelPerf.model_name || 'Random Forest (Production Model)'}</span>
        </div>

        <div style={{ fontSize: '0.84rem', color: 'var(--text-primary)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
          <FaCheckCircle style={{ color: 'var(--primary-green)', flexShrink: 0 }} />
          <span>Model evaluation metrics measured on cross-validation held-out network traffic benchmarks.</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14 }}>
          <div style={{ padding: '14px 16px', background: 'rgba(10, 22, 40, 0.85)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-tech)' }}>
            <div className="kpi-label">Accuracy</div>
            <div style={{ fontSize: '1.65rem', fontWeight: 900, color: 'var(--primary-green)', marginTop: 2 }}>
              {modelPerf.accuracy !== null && modelPerf.accuracy !== undefined ? `${modelPerf.accuracy}%` : 'N/A'}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>Overall accuracy</div>
          </div>

          <div style={{ padding: '14px 16px', background: 'rgba(10, 22, 40, 0.85)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-tech)' }}>
            <div className="kpi-label">Precision</div>
            <div style={{ fontSize: '1.65rem', fontWeight: 900, color: 'var(--primary-green)', marginTop: 2 }}>
              {modelPerf.precision !== null && modelPerf.precision !== undefined ? `${modelPerf.precision}%` : 'N/A'}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>True positive rate</div>
          </div>

          <div style={{ padding: '14px 16px', background: 'rgba(10, 22, 40, 0.85)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-tech)' }}>
            <div className="kpi-label">Recall</div>
            <div style={{ fontSize: '1.65rem', fontWeight: 900, color: 'var(--primary-green)', marginTop: 2 }}>
              {modelPerf.recall !== null && modelPerf.recall !== undefined ? `${modelPerf.recall}%` : 'N/A'}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>Sensitivity metric</div>
          </div>

          <div style={{ padding: '14px 16px', background: 'rgba(10, 22, 40, 0.85)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-tech)' }}>
            <div className="kpi-label">F1 Score</div>
            <div style={{ fontSize: '1.65rem', fontWeight: 900, color: 'var(--primary-green)', marginTop: 2 }}>
              {modelPerf.f1_score !== null && modelPerf.f1_score !== undefined ? `${modelPerf.f1_score}%` : 'N/A'}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>Harmonic mean</div>
          </div>
        </div>
      </div>

      {/* 7. WEEKLY SECURITY SUMMARY CARD */}
      <WeeklySecuritySummary summary={weeklySummary} />
    </div>
  );
};

export default WeeklySecurityTrends;
