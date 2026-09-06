import React from 'react';

const KpiCard = ({ icon, value, label, color = '#00F0FF', bgColor = 'rgba(0, 136, 255, 0.12)' }) => {
  return (
    <div className="kpi-card" style={{ '--accent-glow': color }}>
      <div className="kpi-icon-wrapper" style={{ backgroundColor: bgColor, color: color, boxShadow: `0 0 14px ${bgColor}` }}>
        {icon}
      </div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div className="kpi-label">{label}</div>
        <div className="kpi-value">{value !== undefined && value !== null ? value : '—'}</div>
      </div>
    </div>
  );
};

export default KpiCard;
