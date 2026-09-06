import React from 'react';

const LoadingState = ({ message = 'Loading cybersecurity telemetry...' }) => {
  return (
    <div style={{ padding: '60px 20px', textAlign: 'center', color: '#94A3B8' }}>
      <div className="spinner" style={{ margin: '0 auto 16px' }} />
      <div style={{ fontSize: '0.95rem', fontWeight: 600 }}>{message}</div>
    </div>
  );
};

export default LoadingState;
