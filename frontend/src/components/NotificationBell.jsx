import React, { useState, useEffect } from 'react';
import { Bell, ShieldAlert, CheckCheck } from 'lucide-react';
import { socAPI } from '../services/api';

export const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  const fetchNotifications = async () => {
    try {
      const res = await socAPI.getNotifications();
      setNotifications(res.data.notifications || []);
      setUnreadCount(res.data.unread_count || 0);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const markAsRead = async (id) => {
    await socAPI.markNotificationRead(id);
    fetchNotifications();
  };

  const markAllRead = async () => {
    await socAPI.markAllNotificationsRead();
    fetchNotifications();
  };

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="relative p-2.5 bg-[#0d1527] hover:bg-[#131f38] text-slate-300 rounded-xl border border-[#1b2a4a] transition shadow-lg"
      >
        <Bell className="w-5 h-5 text-[#00f0ff]" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full animate-pulse shadow-md shadow-rose-500/50">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-[#0d1527] border border-[#1b2a4a] rounded-2xl shadow-2xl z-50 p-4 space-y-3">
          <div className="flex justify-between items-center border-b border-[#1b2a4a] pb-2">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-[#00f0ff]" /> Real-Time SOC Alerts
            </h3>
            <button onClick={markAllRead} className="text-xs text-[#00f0ff] hover:underline flex items-center gap-1 font-medium">
              <CheckCheck className="w-3 h-3" /> Mark all read
            </button>
          </div>

          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {notifications.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-6">No active notifications.</p>
            ) : (
              notifications.map((n) => (
                <div 
                  key={n.id} 
                  onClick={() => markAsRead(n.id)}
                  className={`p-3 rounded-xl border text-xs cursor-pointer transition ${
                    n.is_read ? 'bg-[#070b14] border-[#1b2a4a] opacity-60' : 'bg-rose-500/10 border-rose-500/30 text-white'
                  }`}
                >
                  <div className="flex justify-between items-start font-bold">
                    <span className="text-rose-400">{n.title}</span>
                    <span className="text-[10px] text-slate-400">{n.timestamp}</span>
                  </div>
                  <p className="text-slate-300 mt-1">{n.message}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
