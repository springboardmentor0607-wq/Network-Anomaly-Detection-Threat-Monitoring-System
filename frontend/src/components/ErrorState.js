import React from 'react';
import { FaExclamationTriangle, FaRedo } from 'react-icons/fa';

const ErrorState = ({ message = 'Failed to communicate with NetShield AI backend.', onRetry }) => {
  return (
    <div style={{
      padding: '40px 24px',
      backgroundColor: 'rgba(239, 68, 68, 0.1)',
      border: '1px solid #EF4444',
      borderRadius: 10,
      textAlign: 'center',
      color: '#EF4444',
      margin: '20px 0'
    }}>
      <FaExclamationTriangle style={{ fontSize: '2.5rem', marginBottom: 12 }} />
      <h3 style={{ fontSize: '1.1rem', marginBottom: 8, color: '#F8FAFC' }}>System Error</h3>
      <p style={{ fontSize: '0.9rem', color: '#94A3B8', marginBottom: 16, maxWidth: 500, margin: '0 auto 16px' }}>
        {message}
      </p>
      {onRetry && (
        <button onClick={onRetry} className="btn btn-outline" style={{ borderColor: '#EF4444', color: '#EF4444' }}>
          <FaRedo /> Retry Request
        </button>
      )}
    </div>
  );
};

export default ErrorState;
