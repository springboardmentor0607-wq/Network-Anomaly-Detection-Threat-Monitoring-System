import React from 'react';

const StatusBadge = ({ label, status }) => {
  const isHealthy = status && (status.includes('ONLINE') || status.includes('CONNECTED') || status.includes('ACTIVE'));

  return (
    <div className="status-indicator">
      <span className={`status-dot ${isHealthy ? 'online' : 'offline'}`} />
      <span style={{ color: isHealthy ? '#F8FAFC' : '#FF1744' }}>{status || 'UNKNOWN'}</span>
    </div>
  );
};

export default StatusBadge;
