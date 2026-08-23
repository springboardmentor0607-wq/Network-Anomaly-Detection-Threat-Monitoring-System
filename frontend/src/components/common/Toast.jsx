import React from 'react';
import { CheckCircleIcon, ExclamationTriangleIcon, XCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';

const Toast = ({ message, type = 'info', onClose }) => {
  if (!message) return null;

  const icons = {
    success: <CheckCircleIcon className="w-5 h-5 text-emerald-400" />,
    error: <XCircleIcon className="w-5 h-5 text-rose-400" />,
    warning: <ExclamationTriangleIcon className="w-5 h-5 text-amber-400" />,
    info: <CheckCircleIcon className="w-5 h-5 text-cyan-400" />
  };

  const borders = {
    success: 'border-emerald-500/40 bg-emerald-950/90 text-emerald-100',
    error: 'border-rose-500/40 bg-rose-950/90 text-rose-100',
    warning: 'border-amber-500/40 bg-amber-950/90 text-amber-100',
    info: 'border-cyan-500/40 bg-slate-900/95 text-slate-100'
  };

  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center p-4 rounded-xl border shadow-2xl backdrop-blur-md transition-all duration-300 ${borders[type]}`}>
      <div className="mr-3">{icons[type]}</div>
      <div className="text-sm font-medium pr-4">{message}</div>
      <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white">
        <XMarkIcon className="w-4 h-4" />
      </button>
    </div>
  );
};

export default Toast;
