import React from 'react';

const Badge = ({ variant = 'info', children, className = '' }) => {
  const variants = {
    critical: 'bg-red-950/80 text-red-400 border-red-800/60 shadow-[0_0_10px_rgba(255,42,95,0.2)]',
    high: 'bg-rose-950/70 text-rose-300 border-rose-800/50',
    medium: 'bg-amber-950/70 text-amber-300 border-amber-800/50',
    low: 'bg-blue-950/70 text-blue-300 border-blue-800/50',
    online: 'bg-emerald-950/80 text-emerald-300 border-emerald-800/60',
    offline: 'bg-slate-900 text-slate-400 border-slate-700',
    warning: 'bg-amber-900/60 text-amber-300 border-amber-700',
    info: 'bg-cyan-950/70 text-cyan-300 border-cyan-800/50'
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${variants[variant.toLowerCase()] || variants.info} ${className}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 animate-pulse" />
      {children}
    </span>
  );
};

export default Badge;
