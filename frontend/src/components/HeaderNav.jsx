import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useNotifications } from '../context/NotificationContext';

export default function HeaderNav({ title, subtitle, onRefresh }) {
  const location = useLocation();
  const { unreadCount, clearUnreadCount, isConnected } = useNotifications();

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: '🏠' },
    { label: 'Attack Visualization', path: '/attack-visualization', icon: '📈' },
    { label: 'Incidents', path: '/incidents', icon: '🛡️' },
    { label: 'Alerts', path: '/alerts', icon: '🚨', badge: unreadCount },
    { label: 'Network Monitoring', path: '/network-monitoring', icon: '🌐' },
    { label: 'Network Analytics', path: '/analytics', icon: '📊' },
    { label: 'AI Threat Analysis', path: '/threat-analysis', icon: '🧠' },
    { label: 'Model Performance', path: '/model-performance', icon: '⚡' },
    { label: 'Threat Reports', path: '/reports', icon: '📝' },
    { label: 'Settings', path: '/settings', icon: '⚙️' },
  ];

  return (
    <header className="mb-6 rounded-3xl border border-slate-800 bg-slate-900/80 p-5 shadow-2xl shadow-blue-950/30 backdrop-blur">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-400">NetShield AI Security Platform</p>
            <span
              className={`inline-block h-2 w-2 rounded-full ${
                isConnected ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]' : 'bg-amber-500'
              }`}
              title={isConnected ? 'Live WebSocket Stream Connected' : 'Reconnecting...'}
            />
          </div>
          <h1 className="mt-1 text-2xl font-bold text-white">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-slate-400">{subtitle}</p>}
        </div>

        <div className="flex items-center gap-3">
          {/* Notification Bell Badge Button */}
          <Link
            to="/alerts"
            onClick={clearUnreadCount}
            className="relative flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-950/80 px-3.5 py-2 text-xs font-semibold text-slate-200 transition hover:border-slate-700 hover:text-white"
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
      <nav className="mt-5 flex flex-wrap gap-2 border-t border-slate-800/80 pt-4">
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
              className={`relative flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-medium transition ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'border border-slate-800 bg-slate-950/60 text-slate-300 hover:border-slate-700 hover:bg-slate-800 hover:text-white'
              }`}
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
