import React from 'react';

const SeverityBadge = ({ severity }) => {
  const sev = (severity || 'LOW').toUpperCase();
  const classMap = {
    LOW: 'badge-low',
    MEDIUM: 'badge-medium',
    HIGH: 'badge-high',
    CRITICAL: 'badge-critical'
  };

  return (
    <span className={`badge ${classMap[sev] || 'badge-low'}`}>
      {sev}
    </span>
  );
};

export default SeverityBadge;
