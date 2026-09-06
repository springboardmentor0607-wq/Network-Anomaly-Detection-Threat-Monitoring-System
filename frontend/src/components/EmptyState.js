import React from 'react';
import { FaInbox } from 'react-icons/fa';

const EmptyState = ({ message = 'No data available', description = 'No security records found for the requested module.' }) => {
  return (
    <div className="empty-state">
      <FaInbox className="empty-state-icon" />
      <h4 style={{ color: '#F8FAFC', marginBottom: 4, fontSize: '1.05rem' }}>{message}</h4>
      <p style={{ color: '#94A3B8', fontSize: '0.85rem' }}>{description}</p>
    </div>
  );
};

export default EmptyState;
