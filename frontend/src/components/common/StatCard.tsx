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
    <div className="bg-[#121212] border border-[#333333] rounded-xl p-5 shadow-lg flex items-center justify-between">
      <div className="space-y-1">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">{title}</p>
        <div className="flex items-baseline space-x-2">
          <span className="text-2xl font-bold text-white tracking-tight">{value}</span>
          {change && (
            <span
              className={`text-xs font-semibold px-1.5 py-0.5 rounded ${
                isPositive
                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30'
                  : 'bg-red-950 text-red-400 border border-red-500/30'
              }`}
            >
              {change}
            </span>
          )}
        </div>
        {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
      </div>
      <div className="p-3 bg-[#000000] border border-[#333333] rounded-xl text-cyan-400">
        {icon}
      </div>
    </div>
  );
};
