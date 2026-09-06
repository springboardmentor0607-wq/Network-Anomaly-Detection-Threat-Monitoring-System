import React, { useEffect, useState, useRef } from 'react';
import { FaSyncAlt, FaPause, FaPlay } from 'react-icons/fa';

const RefreshControl = ({ onRefresh, intervalSeconds = 30 }) => {
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [countdown, setCountdown] = useState(intervalSeconds);
  const onRefreshRef = useRef(onRefresh);

  useEffect(() => {
    onRefreshRef.current = onRefresh;
  }, [onRefresh]);

  useEffect(() => {
    let timer = null;
    if (autoRefresh) {
      timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            if (onRefreshRef.current) {
              onRefreshRef.current();
            }
            return intervalSeconds;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [autoRefresh, intervalSeconds]);

  const handleManualTrigger = () => {
    if (onRefreshRef.current) {
      onRefreshRef.current();
    }
    setCountdown(intervalSeconds);
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      backgroundColor: '#071525',
      padding: '4px 12px',
      borderRadius: 20,
      border: '1px solid #173A52'
    }}>
      <span className={`status-dot ${autoRefresh ? 'online' : 'offline'}`} />
      <span style={{ fontSize: '0.8rem', color: '#F8FAFC', fontWeight: 700, whiteSpace: 'nowrap' }}>
        {autoRefresh ? `🟢 LIVE (${countdown}s)` : 'PAUSED'}
      </span>

      <button
        onClick={handleManualTrigger}
        title="Refresh Now"
        className="btn btn-outline"
        style={{ padding: '3px 8px', fontSize: '0.75rem' }}
      >
        <FaSyncAlt style={{ animation: autoRefresh ? 'spin 30s linear infinite' : 'none' }} /> Refresh
      </button>

      <button
        onClick={() => setAutoRefresh(!autoRefresh)}
        className="btn btn-outline"
        style={{ padding: '3px 8px', fontSize: '0.75rem', borderColor: autoRefresh ? '#22C55E' : '#94A3B8', color: autoRefresh ? '#22C55E' : '#94A3B8' }}
      >
        {autoRefresh ? <><FaPause /> ON</> : <><FaPlay /> OFF</>}
      </button>
    </div>
  );
};

export default RefreshControl;
