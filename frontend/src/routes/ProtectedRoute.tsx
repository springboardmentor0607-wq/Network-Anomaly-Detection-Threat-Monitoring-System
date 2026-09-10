import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { RoleType } from '../types/auth';

interface ProtectedRouteProps {
  allowedRoles?: RoleType[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
  const { user, isLoading, token } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#000000] flex items-center justify-center text-cyan-400">
        <div className="flex items-center space-x-3">
          <div className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-medium">Verifying Security Credentials...</span>
        </div>
      </div>
    );
  }

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && (!user.role || !allowedRoles.includes(user.role.name))) {
    return (
      <div className="min-h-screen bg-[#000000] flex items-center justify-center p-6 text-white">
        <div className="max-w-md w-full bg-[#121212] border border-red-500/30 rounded-xl p-6 text-center space-y-4">
          <h2 className="text-xl font-bold text-red-400">403 — Access Forbidden</h2>
          <p className="text-sm text-gray-400">
            Your role (<span className="text-white font-semibold">{user.role?.name || 'Unknown'}</span>) is not authorized to view this resource.
          </p>
        </div>
      </div>
    );
  }

  // Redirect home to role-specific dashboard
  if (location.pathname === '/') {
    switch (user.role?.name) {
      case 'ADMIN':
        return <Navigate to="/dashboard/admin" replace />;
      case 'SOC_MANAGER':
        return <Navigate to="/dashboard/manager" replace />;
      case 'SECURITY_ANALYST':
        return <Navigate to="/dashboard/analyst" replace />;
      case 'VIEWER':
        return <Navigate to="/dashboard/viewer" replace />;
      default:
        return <Navigate to="/dashboard/analyst" replace />;
    }
  }

  return <Outlet />;
};
