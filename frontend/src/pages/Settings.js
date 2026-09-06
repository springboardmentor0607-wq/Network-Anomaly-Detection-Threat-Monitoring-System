import React, { useState } from 'react';
import { FaCog, FaCheckCircle } from 'react-icons/fa';

const Settings = () => {
  const [autoRefreshSecs, setAutoRefreshSecs] = useState('30');
  const [alertSound, setAlertSound] = useState(true);
  const [threatThreshold, setThreatThreshold] = useState('60');
  const [saved, setSaved] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">SOC Console Settings</h1>
          <p className="page-subtitle">Configure monitoring thresholds & interface preferences</p>
        </div>
      </div>

      <div className="netshield-card" style={{ maxWidth: 640 }}>
        <div className="netshield-card-header">
          <div className="netshield-card-title"><FaCog style={{ color: '#1683FF' }} /> Operational Parameters</div>
        </div>

        {saved && (
          <div style={{ padding: 12, background: 'rgba(34, 197, 94, 0.12)', border: '1px solid #22C55E', color: '#22C55E', borderRadius: 8, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <FaCheckCircle /> Settings updated successfully.
          </div>
        )}

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#94A3B8', fontWeight: 700, marginBottom: 6 }}>
              LIVE REFRESH INTERVAL (SECONDS)
            </label>
            <select
              value={autoRefreshSecs}
              onChange={(e) => setAutoRefreshSecs(e.target.value)}
              style={{ width: '100%', padding: '10px 12px' }}
            >
              <option value="15">15 Seconds</option>
              <option value="30">30 Seconds (Default)</option>
              <option value="60">60 Seconds</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#94A3B8', fontWeight: 700, marginBottom: 6 }}>
              HIGH RISK SCORE THRESHOLD
            </label>
            <input
              type="number"
              min="0"
              max="100"
              value={threatThreshold}
              onChange={(e) => setThreatThreshold(e.target.value)}
              style={{ width: '100%', padding: '10px 12px' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <input
              type="checkbox"
              id="alertSound"
              checked={alertSound}
              onChange={(e) => setAlertSound(e.target.checked)}
              style={{ width: 18, height: 18, accentColor: '#1683FF' }}
            />
            <label htmlFor="alertSound" style={{ color: '#F8FAFC', fontSize: '0.9rem', cursor: 'pointer' }}>
              Enable Audio Alerts on Critical Threat Influx
            </label>
          </div>

          <div style={{ marginTop: 10, display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" className="btn btn-primary" style={{ padding: '9px 22px' }}>
              Save Settings
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Settings;
