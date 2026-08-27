"use client";

import React, { useState } from 'react';
import { Bell, ShieldAlert, CheckCircle, Clock, Trash2 } from 'lucide-react';

export type SystemNotification = {
  id: string;
  timestamp: string;
  severity: "Critical" | "High" | "Medium" | "Info";
  message: string;
  source: string;
  read: boolean;
};

interface NotificationsProps {
  notifications: SystemNotification[];
  clearNotifications: () => void;
  markAsRead: (id: string) => void;
}

export default function Notifications({ notifications, clearNotifications, markAsRead }: NotificationsProps) {
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="space-y-6 animate-blur-fade-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Bell className="text-blue-400" />
            System Notifications
          </h2>
          <p className="text-gray-400 text-sm mt-1">Timeline of recent security alerts and system events.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="liquid-glass px-4 py-2 rounded-lg border border-blue-500/30 flex items-center gap-2">
            <span className="text-sm text-blue-400 font-bold">{unreadCount} Unread</span>
          </div>
          <button 
            onClick={clearNotifications}
            className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg text-sm font-medium transition-colors"
          >
            <Trash2 className="w-4 h-4" /> Clear All
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="rounded-2xl liquid-glass !bg-black/40 !backdrop-blur-xl border border-white/10 overflow-hidden">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500">
            <CheckCircle className="w-12 h-12 mb-4 opacity-50 text-green-500" />
            <p className="text-lg font-medium text-gray-400">All caught up!</p>
            <p className="text-sm">No recent notifications to display.</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {notifications.map((notif) => (
              <div 
                key={notif.id} 
                onClick={() => markAsRead(notif.id)}
                className={`p-6 transition-colors cursor-pointer flex flex-col sm:flex-row gap-4 ${notif.read ? 'hover:bg-white/5 opacity-70' : 'bg-blue-900/10 hover:bg-blue-900/20'}`}
              >
                <div className="flex-shrink-0 mt-1">
                  {notif.severity === "Critical" ? (
                    <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center border border-red-500/30">
                      <ShieldAlert className="w-5 h-5 text-red-400" />
                    </div>
                  ) : notif.severity === "High" ? (
                    <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center border border-orange-500/30">
                      <ShieldAlert className="w-5 h-5 text-orange-400" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
                      <Bell className="w-5 h-5 text-blue-400" />
                    </div>
                  )}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded border ${
                      notif.severity === 'Critical' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 
                      notif.severity === 'High' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' : 
                      'bg-blue-500/10 text-blue-400 border-blue-500/20'
                    }`}>
                      {notif.severity}
                    </span>
                    <span className="flex items-center gap-1.5 text-xs text-gray-500">
                      <Clock className="w-3.5 h-3.5" />
                      {new Date(notif.timestamp).toLocaleString()}
                    </span>
                    {!notif.read && (
                      <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                    )}
                  </div>
                  <p className="text-gray-200 font-medium text-base mb-1">{notif.message}</p>
                  <p className="text-gray-500 text-sm">Source: {notif.source}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
