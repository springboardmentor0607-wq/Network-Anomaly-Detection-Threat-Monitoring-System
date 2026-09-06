import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useNotifications } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function HeaderNav({ title, subtitle, onRefresh }) {
  const location = useLocation();
  const { unreadCount, clearUnreadCount, isConnected } = useNotifications();
  const { user } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();

  const isAdmin = user?.role === 'Security Administrator';

  // Admin navigation — full access
  const adminNavItems = [
    { label: 'Dashboard', path: '/dashboard', icon: '🏠' },
    { label: 'Attack Visualization', path: '/attack-visualization', icon: '📈' },
    { label: 'Incidents', path: '/incidents', icon: '🛡️' },
    { label: 'Alerts', path: '/alerts', icon: '🚨', badge: unreadCount },
    { label: 'Network Monitoring', path: '/network-monitoring', icon: '🌐' },
    { label: 'Network Analytics', path: '/analytics', icon: '📊' },
    { label: 'AI Threat Analysis', path: '/threat-analysis', icon: '🧠' },
    { label: 'Model Performance', path: '/model-performance', icon: '⚡' },
    { label: 'Threat Reports', path: '/reports', icon: '📝' },
    { label: 'User Management', path: '/user-management', icon: '👥' },
    { label: 'Audit Logs', path: '/audit-logs', icon: '📋' },
    { label: 'System Logs', path: '/system-logs', icon: '🖥️' },
    { label: 'Settings', path: '/settings', icon: '⚙️' },
  ];

  // Analyst navigation — no admin-only pages
  const analystNavItems = [
    { label: 'Dashboard', path: '/dashboard', icon: '🏠' },
    { label: 'Attack Visualization', path: '/attack-visualization', icon: '📈' },
    { label: 'My Incidents', path: '/incidents', icon: '🛡️' },
    { label: 'Alerts', path: '/alerts', icon: '🚨', badge: unreadCount },
    { label: 'Network Monitoring', path: '/network-monitoring', icon: '🌐' },
    { label: 'Network Analytics', path: '/analytics', icon: '📊' },
    { label: 'AI Threat Analysis', path: '/threat-analysis', icon: '🧠' },
    { label: 'Threat Reports', path: '/reports', icon: '📝' },
    { label: 'Profile', path: '/profile', icon: '👤' },
    { label: 'Settings', path: '/settings', icon: '⚙️' },
  ];

  const navItems = isAdmin ? adminNavItems : analystNavItems;

  return (
    <header
      className="mb-6 rounded-3xl border p-5 shadow-2xl backdrop-blur"
      style={{
        backgroundColor: 'var(--bg-secondary)',
        borderColor: 'var(--border-primary)',
        boxShadow: 'var(--shadow-card)',
      }}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-400">
              NetShield AI Security Platform
            </p>
            <span
              className={`inline-block h-2 w-2 rounded-full ${
                isConnected
                  ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]'
                  : 'bg-amber-500'
              }`}
              title={isConnected ? 'Live WebSocket Stream Connected' : 'Reconnecting...'}
            />
          </div>
          <h1
            className="mt-1 text-2xl font-bold"
            style={{ color: 'var(--text-heading)' }}
          >
            {title}
          </h1>
          {subtitle && (
            <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
              {subtitle}
            </p>
          )}
          {user && (
            <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
              Logged in as{' '}
              <span className="font-semibold" style={{ color: 'var(--text-label)' }}>
                {user.full_name || user.email}
              </span>{' '}
              <span
                className="ml-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase"
                style={{
                  backgroundColor: isAdmin
                    ? 'rgba(59,130,246,0.15)'
                    : 'rgba(16,185,129,0.15)',
                  color: isAdmin ? 'var(--accent-blue)' : 'var(--status-success)',
                }}
              >
                {user.role}
              </span>
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Theme Toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            className="theme-toggle-btn"
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            id="theme-toggle-btn"
          >
            <span>{isDark ? '☀️' : '🌙'}</span>
            <span>{isDark ? 'Light' : 'Dark'}</span>
          </button>

          {/* Profile Link */}
          <Link
            to="/profile"
            className="relative flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition"
            style={{
              borderColor: 'var(--border-primary)',
              backgroundColor: 'var(--bg-card)',
              color: 'var(--text-label)',
            }}
            title="View Profile"
          >
            <span>👤</span>
            <span className="hidden sm:inline">Profile</span>
          </Link>

          {/* Notification Bell Badge Button */}
          <Link
            to="/alerts"
            onClick={clearUnreadCount}
            className="relative flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-semibold transition hover:border-slate-700 hover:text-white"
            style={{
              borderColor: 'var(--border-primary)',
              backgroundColor: 'var(--bg-card)',
              color: 'var(--text-label)',
            }}
          >
            <span>🚨</span>
            <span>Alerts</span>
            {unreadCount > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white animate-pulse">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </Link>

          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-500"
            >
              Refresh Data
            </button>
          )}
        </div>
      </div>

      {/* Primary Navigation Tabs */}
      <nav
        className="mt-5 flex flex-wrap gap-2 border-t pt-4"
        style={{ borderColor: 'var(--border-primary)' }}
      >
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => {
                if (item.path === '/alerts') {
                  clearUnreadCount();
                }
              }}
              className="relative flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-medium transition"
              style={
                isActive
                  ? {
                      backgroundColor: 'var(--accent-blue)',
                      color: '#ffffff',
                      boxShadow: '0 4px 12px rgba(59,130,246,0.3)',
                    }
                  : {
                      border: '1px solid var(--border-primary)',
                      backgroundColor: 'var(--bg-card)',
                      color: 'var(--text-label)',
                    }
              }
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
              {item.badge > 0 && (
                <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
