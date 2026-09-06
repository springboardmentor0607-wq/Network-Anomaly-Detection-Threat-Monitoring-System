import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { FaLayerGroup } from 'react-icons/fa';

const AttackTypeTrend = ({ data = [], height = 280, showTitle = true }) => {
  return (
    <div className="netshield-card" style={{ width: '100%' }}>
      {showTitle && (
        <div className="netshield-card-header">
          <div className="netshield-card-title">
            <FaLayerGroup style={{ color: 'var(--primary-green)' }} />
            <span>Attack Types This Week</span>
          </div>
          <span className="cyber-chip">4 ML Classes</span>
        </div>
      )}

      {data && data.length > 0 ? (
        <ResponsiveContainer width="100%" height={height}>
          <BarChart data={data} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
            <XAxis dataKey="name" stroke="#64748B" fontSize={11} tickLine={false} />
            <YAxis stroke="#64748B" fontSize={11} tickLine={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0a1628',
                borderColor: 'rgba(34, 197, 94, 0.4)',
                borderRadius: 8,
                color: '#f8fafc',
                fontSize: '0.82rem'
              }}
              formatter={(value, name, props) => [`${value.toLocaleString()} events (${props.payload.percentage}%)`, 'Count']}
            />
            <Bar dataKey="count" radius={[6, 6, 0, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color || '#22C55E'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div style={{ padding: 30, textAlign: 'center', color: 'var(--text-muted)' }}>
          No attack type distribution data recorded.
        </div>
      )}
    </div>
  );
};

export default AttackTypeTrend;
