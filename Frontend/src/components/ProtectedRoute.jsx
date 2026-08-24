import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ allowedRoles }) => {
  const { user, token } = useAuth();

  // 1. Check if the user is authenticated at all
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // 2. Check if the route is restricted by role
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    // If they are an analyst trying to access an admin page, kick them back to dashboard
    return <Navigate to="/dashboard" replace />;
  }

  // 3. If everything is good, render the requested page
  return <Outlet />;
};

export default ProtectedRoute;