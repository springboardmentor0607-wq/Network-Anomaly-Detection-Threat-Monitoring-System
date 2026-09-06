import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { FaCalendarAlt } from 'react-icons/fa';

const ThreatActivityChart = ({ data = [], height = 280, showTitle = true }) => {
  return (
    <div className="netshield-card" style={{ width: '100%' }}>
      {showTitle && (
        <div className="netshield-card-header">
          <div className="netshield-card-title">
            <FaCalendarAlt style={{ color: 'var(--primary-green)' }} />
            <span>Threat Activity by Day</span>
          </div>
          <span className="cyber-chip">Mon – Sun</span>
        </div>
      )}

      {data && data.length > 0 ? (
        <ResponsiveContainer width="100%" height={height}>
          <BarChart data={data} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
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
                return item ? `${item.day}` : label;
              }}
            />
            <Legend wrapperStyle={{ fontSize: '0.78rem', paddingTop: 8 }} />
            <Bar dataKey="threats" name="Malicious Incursions" fill="#F59E0B" radius={[4, 4, 0, 0]} />
            <Bar dataKey="critical" name="Critical Vectors" fill="#EF4444" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div style={{ padding: 30, textAlign: 'center', color: 'var(--text-muted)' }}>
          No weekday threat distribution recorded.
        </div>
      )}
    </div>
  );
};

export default ThreatActivityChart;
