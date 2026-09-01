import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  isPositive?: boolean;
  icon: React.ReactNode;
  subtitle?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  change,
  isPositive,
  icon,
  subtitle,
}) => {
  return (
    <div className="bg-gradient-to-br from-[#0F1629] to-[#0A0E27] border border-[#1A2540] rounded-xl p-5 shadow-md hover:shadow-lg hover:shadow-sky-500/5 transition-all duration-300 flex items-center justify-between">
      <div className="space-y-1">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{title}</p>
        <div className="flex items-baseline space-x-2">
          <span className="text-3xl font-bold text-white tracking-tight">{value}</span>
          {change && (
            <span
              className={`text-xs font-semibold px-2 py-0.5 rounded-lg ${
                isPositive
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/40'
                  : 'bg-rose-500/15 text-rose-400 border border-rose-500/40'
              }`}
            >
              {change}
            </span>
          )}
        </div>
        {subtitle && <p className="text-xs text-gray-600 mt-1">{subtitle}</p>}
      </div>
      <div className="p-3 bg-sky-500/15 border border-sky-500/40 rounded-lg text-sky-400">
        {icon}
      </div>
    </div>
  );
};
