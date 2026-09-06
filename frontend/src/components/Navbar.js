import React, { useEffect, useState, useContext, useCallback } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useRefresh } from '../context/RefreshContext';
import api from '../services/api';
import { FaBell, FaSyncAlt, FaPause, FaPlay, FaShieldAlt } from 'react-icons/fa';
import { Link, useLocation } from 'react-router-dom';

const getPageTitle = (pathname) => {
  switch (pathname) {
    case '/dashboard': return 'Dashboard';
    case '/upload': return 'Upload';
    case '/threats': return 'Threat Detection';
    case '/alerts': return 'Alerts';
    case '/incidents': return 'Incidents';
    case '/notifications': return 'Notifications';
    case '/reports': return 'Reports';
    case '/threat-intelligence': return 'Threat Intelligence';
    case '/attack-visualization': return 'Attack Visualization';
    case '/security-analytics': return 'Security Analytics';
    case '/network-monitor': return 'Network Monitor';
    case '/profile': return 'Profile';
    case '/settings': return 'Settings';
    case '/user-management': return 'User Management';
    case '/audit-logs': return 'Audit Logs';
    default: return 'Dashboard';
  }
};

const Navbar = () => {
  const { user } = useContext(AuthContext);
  const location = useLocation();
  const { countdown, isAutoRefresh, toggleAutoRefresh, triggerManualRefresh, refreshTrigger } = useRefresh();

  const [unreadNotifs, setUnreadNotifs] = useState(0);

  const fetchNotifs = useCallback(async () => {
    try {
      const res = await api.get('/notifications');
      setUnreadNotifs(res.data.unread_count || 0);
    } catch (err) {}
  }, []);

  useEffect(() => {
    fetchNotifs();
  }, [fetchNotifs, refreshTrigger]);

  const pageTitle = getPageTitle(location.pathname);

  return (
    <header className="navbar">
      <div className="navbar-left">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--primary-blue)', fontWeight: 800, fontSize: '0.92rem' }}>
          <FaShieldAlt />
          <span>NETSHIELD AI</span>
        </div>
        <span style={{ color: 'var(--border-tech)', fontSize: '0.9rem' }}>|</span>
        <div className="navbar-page-title">{pageTitle}</div>
      </div>

      <div className="navbar-right">
        {/* Compact System Online Status */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          background: 'var(--bg-card)',
          padding: '4px 10px',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-tech)',
          fontSize: '0.74rem',
          fontWeight: 700,
          color: 'var(--text-secondary)'
        }}>
          <span className="status-dot online" />
          <span style={{ color: 'var(--severity-low)' }}>SYSTEM ONLINE</span>
        </div>

        {/* Global Synchronized Refresh Controller */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: 'var(--bg-card)',
          padding: '4px 10px',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-tech)',
          fontSize: '0.74rem'
        }}>
          <span style={{ color: 'var(--text-secondary)', fontWeight: 700 }}>
            {isAutoRefresh ? `LIVE (${countdown}s)` : 'PAUSED'}
          </span>

          <button
            onClick={triggerManualRefresh}
            title="Refresh Now"
            className="btn btn-outline"
            style={{ padding: '2px 6px', fontSize: '0.7rem' }}
          >
            <FaSyncAlt />
          </button>

          <button
            onClick={toggleAutoRefresh}
            className="btn btn-outline"
            style={{
              padding: '2px 6px',
              fontSize: '0.7rem',
              color: isAutoRefresh ? 'var(--severity-low)' : 'var(--text-muted)'
            }}
          >
            {isAutoRefresh ? <FaPause /> : <FaPlay />}
          </button>
        </div>

        {/* Notification Bell */}
        <Link to="/notifications" style={{ position: 'relative', color: 'var(--text-secondary)', fontSize: '1.1rem', display: 'flex', alignItems: 'center' }}>
          <FaBell />
          {unreadNotifs > 0 && (
            <span style={{
              position: 'absolute', top: -5, right: -7,
              background: 'var(--severity-critical)',
              color: '#FFF', fontSize: '0.6rem',
              fontWeight: 800, padding: '1px 5px', borderRadius: '8px'
            }}>
              {unreadNotifs}
            </span>
          )}
        </Link>

        {/* User Avatar & Info */}
        <div className="user-profile-badge">
          <div className="user-avatar">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
          </div>
          <div className="user-info">
            <span className="user-name">{user?.name || 'Analyst'}</span>
            <span className="user-role">{user?.role || 'SECURITY_ANALYST'}</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
