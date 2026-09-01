import React, { useState } from 'react';
import { Search, Bell, Activity, User as UserIcon, LogOut, Volume2, VolumeX, Shield, Radio } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTelemetry } from '../../contexts/TelemetryContext';
import { GlobalSearchModal } from '../common/GlobalSearchModal';

interface TopbarProps {
  title?: string;
}

export const Topbar: React.FC<TopbarProps> = ({ title = 'SOC Dashboard Overview' }) => {
  const { user, logout } = useAuth();
  const { demoMode, setDemoMode, audioAlerts, setAudioAlerts, riskScore, systemStatus, toasts, dismissToast } = useTelemetry();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  return (
    <>
      <header className="h-16 bg-gradient-to-r from-[#0F1629] to-[#0A0E27] border-b border-[#1A2540] px-6 flex items-center justify-between sticky top-0 z-20 shadow-md">
        {/* Title / Breadcrumbs */}
        <div className="flex items-center space-x-3">
          <h1 className="text-lg font-bold text-white tracking-tight">{title}</h1>

          {/* DEMO MODE Badge Indicator */}
          {demoMode ? (
            <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 bg-amber-500/10 border border-amber-500/40 rounded-md text-[11px] font-bold text-amber-400">
              <Radio className="w-3 h-3 animate-pulse" />
              <span>DEMO MODE</span>
            </span>
          ) : (
            <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/40 rounded-md text-[11px] font-bold text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>LIVE DATA</span>
            </span>
          )}
        </div>

        {/* Global Search & Quick Actions */}
        <div className="flex items-center space-x-4">
          {/* Global Search Bar Trigger */}
          <button
            onClick={() => setIsSearchOpen(true)}
            className="relative hidden md:flex items-center w-64 bg-[#151D35] border border-[#1A2540] hover:border-sky-500/50 rounded-lg px-3 py-1.5 text-xs text-gray-400 transition"
          >
            <Search className="w-4 h-4 text-gray-500 mr-2" />
            <span className="truncate">Search IPs, Alerts, Incidents...</span>
          </button>

          {/* Audio Alert Toggle */}
          <button
            onClick={() => setAudioAlerts(!audioAlerts)}
            className={`p-2 rounded-lg border transition ${
              audioAlerts
                ? 'bg-sky-500/15 text-sky-400 border-sky-500/40'
                : 'bg-[#151D35] text-gray-400 border-[#1A2540] hover:text-gray-200'
            }`}
            title={audioAlerts ? 'Audio Alerts Enabled' : 'Audio Alerts Muted'}
          >
            {audioAlerts ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* DEMO MODE Toggle Button */}
          <button
            onClick={() => setDemoMode(!demoMode)}
            className="px-3 py-1.5 bg-[#151D35] hover:bg-[#1A2540] border border-[#1A2540] text-xs font-semibold text-gray-300 rounded-lg transition"
          >
            {demoMode ? 'Live Mode' : 'Demo Mode'}
          </button>

          {/* System Posture Health Badge */}
          <div
            className={`hidden lg:flex items-center space-x-2 px-3 py-1.5 border rounded-full text-xs font-semibold ${
              systemStatus === 'SECURE' || systemStatus === 'LOW RISK'
                ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400'
                : systemStatus === 'ELEVATED'
                ? 'bg-amber-500/10 border-amber-500/40 text-amber-400'
                : 'bg-rose-500/10 border-rose-500/40 text-rose-400'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
            <span>Risk: {riskScore}/100</span>
          </div>

          {/* User Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-2 p-1.5 text-gray-300 hover:text-white rounded-lg hover:bg-sky-500/10 transition"
            >
              <div className="w-8 h-8 rounded-lg bg-sky-500/15 border border-sky-500/40 text-sky-400 flex items-center justify-center font-bold text-xs">
                {user?.full_name?.charAt(0) || 'A'}
              </div>
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-[#0F1629] border border-[#1A2540] rounded-xl shadow-2xl py-2 z-50 backdrop-blur-sm">
                <div className="px-4 py-2 border-b border-[#1A2540]">
                  <p className="text-xs font-bold text-white truncate">{user?.full_name || 'Administrator'}</p>
                  <p className="text-[10px] text-gray-400 truncate">{user?.email || 'admin@netshield.ai'}</p>
                  <span className="mt-1 inline-block px-2 py-0.5 text-[10px] font-bold bg-sky-500/15 text-sky-400 border border-sky-500/30 rounded uppercase">
                    {user?.role?.name || 'ADMINISTRATOR'}
                  </span>
                </div>
                <button
                  onClick={logout}
                  className="w-full text-left px-4 py-2 text-xs font-semibold text-rose-400 hover:bg-rose-500/10 flex items-center space-x-2 transition"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Global Search Modal */}
      <GlobalSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

      {/* Real-time Toast Notifications */}
      <div className="fixed bottom-6 right-6 z-50 space-y-3 max-w-sm pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto p-4 rounded-xl border shadow-2xl backdrop-blur-md flex items-start justify-between space-x-3 transition animate-in slide-in-from-right duration-200 ${
              toast.severity === 'CRITICAL'
                ? 'bg-rose-950/90 border-rose-500/50 text-rose-100'
                : 'bg-amber-950/90 border-amber-500/50 text-amber-100'
            }`}
          >
            <div>
              <div className="flex items-center space-x-2">
                <Shield className="w-4 h-4 text-current shrink-0" />
                <h4 className="text-xs font-bold uppercase tracking-wider">{toast.title}</h4>
              </div>
              <p className="mt-1 text-xs text-gray-200">{toast.message}</p>
              <span className="mt-1 block text-[10px] text-gray-400">{toast.timestamp}</span>
            </div>
            <button
              onClick={() => dismissToast(toast.id)}
              className="text-gray-400 hover:text-white p-1 rounded hover:bg-black/30"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </>
  );
};
