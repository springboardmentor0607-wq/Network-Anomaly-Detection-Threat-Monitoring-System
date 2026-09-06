import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: '#94A3B8' }}>
        Loading NetShield AI session...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="page-container" style={{ textAlign: 'center', paddingTop: 80 }}>
        <h2 style={{ color: '#EF4444', marginBottom: 12 }}>403 — Access Denied</h2>
        <p style={{ color: '#94A3B8' }}>
          Your role (<strong>{user.role}</strong>) does not have authorization to view this module.
        </p>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
