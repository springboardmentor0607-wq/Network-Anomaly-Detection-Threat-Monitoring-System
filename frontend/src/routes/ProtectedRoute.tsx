import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { RoleType } from '../types/auth';

interface ProtectedRouteProps {
  allowedRoles?: RoleType[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
  const { user, isLoading, token } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0B0F17] flex items-center justify-center text-cyan-400">
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

  if (allowedRoles && !allowedRoles.includes(user.role.name)) {
    return (
      <div className="min-h-screen bg-[#0B0F17] flex items-center justify-center p-6 text-gray-100">
        <div className="max-w-md w-full bg-[#111827] border border-red-500/30 rounded-xl p-6 text-center space-y-4">
          <h2 className="text-xl font-bold text-red-400">403 — Access Forbidden</h2>
          <p className="text-sm text-gray-400">
            Your role (<span className="text-white font-semibold">{user.role.name}</span>) is not authorized to view this resource.
          </p>
        </div>
      </div>
    );
  }

  return <Outlet />;
};
