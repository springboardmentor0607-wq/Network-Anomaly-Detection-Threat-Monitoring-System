import React from 'react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { FaChartLine } from 'react-icons/fa';

const WeeklyAttackTrend = ({ data = [], height = 280, showTitle = true }) => {
  return (
    <div className="netshield-card" style={{ width: '100%' }}>
      {showTitle && (
        <div className="netshield-card-header">
          <div className="netshield-card-title">
            <FaChartLine style={{ color: 'var(--primary-green)' }} />
            <span>Weekly Attack Trend</span>
          </div>
          <span className="cyber-chip">Last 7 Days</span>
        </div>
      )}

      {data && data.length > 0 ? (
        <ResponsiveContainer width="100%" height={height}>
          <AreaChart data={data} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="attackGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22C55E" stopOpacity={0.45}/>
                <stop offset="95%" stopColor="#22C55E" stopOpacity={0.0}/>
              </linearGradient>
              <linearGradient id="critGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#EF4444" stopOpacity={0.5}/>
                <stop offset="95%" stopColor="#EF4444" stopOpacity={0.0}/>
              </linearGradient>
            </defs>
            <XAxis dataKey="short_day" stroke="#64748B" fontSize={11} tickLine={false} />
            <YAxis stroke="#64748B" fontSize={11} tickLine={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0a1628',
                borderColor: 'rgba(34, 197, 94, 0.4)',
                borderRadius: 8,
                color: '#f8fafc',
                fontSize: '0.82rem'
              }}
              labelFormatter={(label, payload) => {
                const item = payload && payload[0]?.payload;
                return item ? `${item.day} (${item.display_date || item.date})` : label;
              }}
            />
            <Legend wrapperStyle={{ fontSize: '0.78rem', paddingTop: 10 }} />
            <Area
              type="monotone"
              dataKey="attacks"
              name="Total Attacks"
              stroke="#22C55E"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#attackGrad)"
            />
            <Area
              type="monotone"
              dataKey="critical_count"
              name="Critical Threats"
              stroke="#EF4444"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#critGrad)"
            />
          </AreaChart>
        </ResponsiveContainer>
      ) : (
        <div style={{ padding: 30, textAlign: 'center', color: 'var(--text-muted)' }}>
          No attack trend telemetry available for the past 7 days.
        </div>
      )}
    </div>
  );
};

export default WeeklyAttackTrend;
