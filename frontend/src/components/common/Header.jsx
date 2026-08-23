import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { ShieldCheckIcon, ArrowRightOnRectangleIcon, BellIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import Badge from './Badge';
import api from '../../services/api';

const Header = ({ title }) => {
  const { user, logout } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      if (res.data && res.data.data) {
        setNotifications(res.data.data.data || []);
        setUnreadCount(res.data.data.unreadCount || 0);
      }
    } catch (err) {
      // Silently fail if unauthenticated or network notice
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleMarkRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      fetchNotifications();
    } catch (e) {}
  };

  const handleMarkAllRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      fetchNotifications();
    } catch (e) {}
  };

  return (
    <header className="h-16 glass-panel border-b border-slate-800/80 px-6 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center space-x-3">
        <h1 className="text-xl font-bold text-white tracking-wide">{title}</h1>
        <Badge variant="online" className="hidden sm:inline-flex">
          LIVE SOC MONITORING
        </Badge>
      </div>

      <div className="flex items-center space-x-4">
        {/* Notification Bell with Badge & Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 rounded-lg bg-slate-800/60 border border-slate-700/50 text-slate-300 hover:text-cyan-400 hover:border-cyan-500/40 relative transition-all"
            title="SOC Notifications"
          >
            <BellIcon className="w-5 h-5" />
            {unreadCount > 0 && (
              <>
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                <span className="absolute -top-1 -right-1 px-1.5 py-0.5 rounded-full bg-rose-500 text-[10px] font-bold text-white font-mono">
                  {unreadCount}
                </span>
              </>
            )}
          </button>

          {/* Notification Dropdown Panel */}
          {isOpen && (
            <div className="absolute right-0 mt-3 w-80 sm:w-96 glass-card rounded-2xl border border-slate-800 shadow-2xl p-4 z-50 font-sans space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">SOC Notifications</span>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-mono font-bold">
                      {unreadCount} UNREAD
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-[10px] font-mono text-cyan-400 hover:underline"
                    >
                      Mark All Read
                    </button>
                  )}
                  <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white">
                    <XMarkIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="max-h-80 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-400 font-mono">No security notifications</div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.notificationId || n._id}
                      className={`p-3 rounded-xl border transition-all ${
                        n.read
                          ? 'bg-slate-900/40 border-slate-800/60 opacity-70'
                          : 'bg-slate-900 border-cyan-500/30'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <span className={`text-[10px] font-bold font-mono uppercase px-2 py-0.5 rounded ${
                          n.severity === 'CRITICAL' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' :
                          n.severity === 'HIGH' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' :
                          'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                        }`}>
                          {n.severity}
                        </span>
                        {!n.read && (
                          <button
                            onClick={() => handleMarkRead(n.notificationId || n._id)}
                            className="text-slate-400 hover:text-cyan-300 p-1"
                            title="Mark Read"
                          >
                            <CheckIcon className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      <p className="text-xs font-bold text-white mt-1">{n.title}</p>
                      <p className="text-[11px] text-slate-300 mt-0.5 leading-snug">{n.message}</p>
                      <span className="text-[9px] text-slate-400 font-mono block mt-1">
                        {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Info & Role Pill */}
        <div className="flex items-center space-x-3 pl-2 border-l border-slate-800">
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center font-bold text-black text-sm shadow-glow-cyan">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="hidden md:block text-left">
            <p className="text-sm font-semibold text-white leading-tight">{user?.name || 'User'}</p>
            <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-bold">
              ROLE: {user?.role || 'ANALYST'}
            </span>
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={logout}
          title="Sign Out"
          className="p-2 rounded-lg bg-rose-950/40 border border-rose-900/40 text-rose-300 hover:bg-rose-900/60 transition-colors"
        >
          <ArrowRightOnRectangleIcon className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
};

export default Header;
