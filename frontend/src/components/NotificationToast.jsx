import React from 'react';
import { useNotifications } from '../context/NotificationContext';

const SEVERITY_COLORS = {
  Critical: 'bg-red-500/20 text-red-400 border-red-500/40',
  High: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
  Medium: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
  Low: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
  Safe: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
};

export default function NotificationToast() {
  const { activeToasts, dismissToast } = useNotifications();

  if (!activeToasts || activeToasts.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
      {activeToasts.map((toast) => {
        const severityClass =
          SEVERITY_COLORS[toast.severity] || 'bg-slate-800 text-slate-200 border-slate-700';
        
        const formattedTime = toast.timestamp
          ? new Date(toast.timestamp).toLocaleTimeString()
          : new Date().toLocaleTimeString();

        const confidenceDisplay =
          typeof toast.confidence === 'number'
            ? `${(toast.confidence * (toast.confidence <= 1 ? 100 : 1)).toFixed(1)}%`
            : `${toast.confidence}`;

        return (
          <div
            key={toast.id}
            className="pointer-events-auto flex flex-col gap-2 rounded-2xl border border-rose-500/40 bg-slate-900/95 p-4 shadow-2xl shadow-rose-950/50 backdrop-blur transition-all duration-300 animate-slide-in"
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-rose-400">
                  Real-Time Threat Detected
                </span>
              </div>
              <button
                type="button"
                onClick={() => dismissToast(toast.id)}
                className="text-slate-400 hover:text-white transition text-xs font-bold px-1.5 py-0.5 rounded"
              >
                ✕
              </button>
            </div>

            {/* Notification Details: Attack Type, Severity, Confidence, Time */}
            <div className="mt-1 flex flex-col gap-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Attack Type:</span>
                <span className="font-bold text-white text-sm">{toast.attack_type}</span>
              </div>

              {toast.source_ip && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Source:</span>
                  <span className="font-bold text-slate-200">{toast.source_ip}</span>
                </div>
              )}

              {toast.risk_score != null && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Risk Score:</span>
                  <span className="font-bold text-rose-400">{toast.risk_score} / 100</span>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-slate-400">Severity:</span>
                <span className={`px-2 py-0.5 rounded-full border text-[11px] font-semibold ${severityClass}`}>
                  {toast.severity}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400">Alert Source:</span>
                <span className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${
                  String(toast.source || '').toLowerCase() === 'dataset'
                    ? 'bg-purple-500/10 border-purple-500/30 text-purple-300'
                    : 'bg-blue-500/10 border-blue-500/30 text-blue-300'
                }`}>
                  {toast.source || 'Live Network'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400">Confidence:</span>
                <span className="font-semibold text-blue-400">{confidenceDisplay}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400">Time:</span>
                <span className="font-mono text-slate-300">{formattedTime}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
