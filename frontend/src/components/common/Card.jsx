import React from 'react';

const Card = ({ title, value, subtitle, icon: Icon, trend, glowColor = 'cyan', children, className = '' }) => {
  const glowClasses = {
    cyan: 'border-cyan-500/20 hover:shadow-glow-cyan',
    red: 'border-red-500/20 hover:shadow-glow-red',
    green: 'border-emerald-500/20 hover:shadow-glow-green',
    orange: 'border-amber-500/20 hover:border-amber-500/40'
  };

  return (
    <div className={`glass-card glass-card-hover rounded-xl p-5 border transition-all ${glowClasses[glowColor] || glowClasses.cyan} ${className}`}>
      {title && (
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">{title}</span>
          {Icon && (
            <div className="p-2 rounded-lg bg-slate-800/60 border border-slate-700/50 text-cyan-400">
              <Icon className="w-5 h-5" />
            </div>
          )}
        </div>
      )}
      {value !== undefined && (
        <div className="flex items-baseline space-x-2">
          <span className="text-2xl font-extrabold text-white tracking-tight font-mono">{value}</span>
          {trend && (
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${trend.startsWith('+') ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
              {trend}
            </span>
          )}
        </div>
      )}
      {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
      {children}
    </div>
  );
};

export default Card;
