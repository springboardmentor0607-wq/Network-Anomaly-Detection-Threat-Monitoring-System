import React from 'react';
import {
  FaShieldAlt, FaBug, FaFire, FaBell, FaCalendarCheck, FaBrain
} from 'react-icons/fa';

const WeeklySecuritySummary = ({ summary = {} }) => {
  return (
    <div className="netshield-card" style={{ width: '100%', borderTop: '3px solid var(--primary-green)' }}>
      <div className="netshield-card-header">
        <div className="netshield-card-title">
          <FaShieldAlt style={{ color: 'var(--primary-green)' }} />
          <span>Weekly Security Summary</span>
        </div>
        <span className="badge badge-low">Automated Assessment</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
        <div style={{ padding: '14px 16px', background: 'rgba(10, 22, 40, 0.85)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-tech)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <FaBug style={{ color: '#F59E0B' }} />
            <span className="kpi-label">Most Detected Attack</span>
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--text-primary)' }}>
            {summary.most_detected_attack || 'None'}
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: 2 }}>High-frequency vector</div>
        </div>

        <div style={{ padding: '14px 16px', background: 'rgba(10, 22, 40, 0.85)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-tech)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <FaCalendarCheck style={{ color: '#EF4444' }} />
            <span className="kpi-label">Highest-Risk Day</span>
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#EF4444' }}>
            {summary.highest_risk_day || 'N/A'}
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: 2 }}>Peak critical incursions</div>
        </div>

        <div style={{ padding: '14px 16px', background: 'rgba(10, 22, 40, 0.85)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-tech)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <FaFire style={{ color: '#F97316' }} />
            <span className="kpi-label">Total Attacks This Week</span>
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#F97316' }}>
            {summary.total_attacks?.toLocaleString() || '0'}
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: 2 }}>Classified malicious flows</div>
        </div>

        <div style={{ padding: '14px 16px', background: 'rgba(10, 22, 40, 0.85)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-tech)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <FaBell style={{ color: '#3B82F6' }} />
            <span className="kpi-label">Alerts Generated</span>
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#3B82F6' }}>
            {summary.alerts_generated?.toLocaleString() || '0'}
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: 2 }}>Triggered security alerts</div>
        </div>

        <div style={{ padding: '14px 16px', background: 'rgba(10, 22, 40, 0.85)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-tech)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <FaBrain style={{ color: 'var(--primary-green)' }} />
            <span className="kpi-label">Detection Accuracy</span>
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--primary-green)' }}>
            {summary.detection_accuracy || 'N/A'}
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: 2 }}>Random Forest validation</div>
        </div>
      </div>
    </div>
  );
};

export default WeeklySecuritySummary;
