import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ allowedRoles, children }) => {
  const { user, token } = useAuth();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user && user.role) {
    const userRoleLower = user.role.toLowerCase();
    const hasAccess = allowedRoles.some(role => userRoleLower.includes(role.toLowerCase()));
    
    if (!hasAccess) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return children ? children : <Outlet />;
};

export default ProtectedRoute;