import React from 'react';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { FaShieldAlt } from 'react-icons/fa';

const ThreatSeverityChart = ({ data = [], height = 280, showTitle = true }) => {
  return (
    <div className="netshield-card" style={{ width: '100%' }}>
      {showTitle && (
        <div className="netshield-card-header">
          <div className="netshield-card-title">
            <FaShieldAlt style={{ color: 'var(--primary-green)' }} />
            <span>Threat Severity Distribution</span>
          </div>
          <span className="cyber-chip">4 Risk Tiers</span>
        </div>
      )}

      {data && data.length > 0 ? (
        <ResponsiveContainer width="100%" height={height}>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={85}
              paddingAngle={4}
              label={({ name, percent }) => `${name.split(' ')[0]} ${(percent * 100).toFixed(0)}%`}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color || '#22C55E'} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: '#0a1628',
                borderColor: 'rgba(34, 197, 94, 0.4)',
                borderRadius: 8,
                color: '#f8fafc',
                fontSize: '0.82rem'
              }}
              formatter={(value, name, props) => [`${value.toLocaleString()} events (${props.payload.percentage || 0}%)`, name]}
            />
            <Legend iconSize={8} wrapperStyle={{ fontSize: '0.78rem', paddingTop: 6 }} />
          </PieChart>
        </ResponsiveContainer>
      ) : (
        <div style={{ padding: 30, textAlign: 'center', color: 'var(--text-muted)' }}>
          No severity distribution data available.
        </div>
      )}
    </div>
  );
};

export default ThreatSeverityChart;
