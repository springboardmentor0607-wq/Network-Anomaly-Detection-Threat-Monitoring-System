import React, { useEffect, useState } from 'react';
import { Users, Settings, AlertTriangle, BarChart3, Lock, Shield } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { apiClient } from '../../api/client';

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeAlerts: 0,
    systemHealth: 100,
    threats: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      // Fetch admin statistics
      const response = await apiClient.get('/analytics/dashboard');
      if (response.data) {
        setStats(prev => ({
          ...prev,
          ...response.data
        }));
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Administrator Dashboard</h1>
          <p className="text-gray-400 mt-2">System Overview & Management Console</p>
        </div>
        <div className="flex items-center space-x-2 bg-red-950/30 border border-red-500/30 rounded-lg px-4 py-2">
          <Shield className="w-5 h-5 text-red-400" />
          <span className="text-red-400 font-semibold">Admin Access</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-[#222222] to-[#121212] border border-[#444444] rounded-lg p-6 hover:border-blue-500/50 transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm font-medium">Total Users</p>
              <p className="text-2xl font-bold text-white mt-2">{stats.totalUsers}</p>
            </div>
            <Users className="w-12 h-12 text-blue-400/20" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-[#222222] to-[#121212] border border-[#444444] rounded-lg p-6 hover:border-orange-500/50 transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm font-medium">Active Alerts</p>
              <p className="text-2xl font-bold text-white mt-2">{stats.activeAlerts}</p>
            </div>
            <AlertTriangle className="w-12 h-12 text-orange-400/20" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-[#222222] to-[#121212] border border-[#444444] rounded-lg p-6 hover:border-emerald-500/50 transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm font-medium">System Health</p>
              <p className="text-2xl font-bold text-white mt-2">{stats.systemHealth}%</p>
            </div>
            <BarChart3 className="w-12 h-12 text-emerald-400/20" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-[#222222] to-[#121212] border border-[#444444] rounded-lg p-6 hover:border-red-500/30 transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm font-medium">Threats Detected</p>
              <p className="text-2xl font-bold text-white mt-2">{stats.threats}</p>
            </div>
            <Shield className="w-12 h-12 text-red-400/20" />
          </div>
        </div>
      </div>

      {/* Admin Quick Actions */}
      <div className="bg-gradient-to-br from-[#222222] to-[#121212] border border-[#444444] rounded-lg p-6">
        <h2 className="text-lg font-bold text-white mb-4">Admin Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <a href="/admin/users" className="flex items-center space-x-4 p-4 bg-blue-950/30 border border-blue-500/30 rounded-lg hover:bg-blue-950/50 transition cursor-pointer group">
            <Users className="w-8 h-8 text-blue-400 group-hover:scale-110 transition" />
            <div>
              <p className="font-semibold text-white">User Management</p>
              <p className="text-sm text-gray-400">Manage users and roles</p>
            </div>
          </a>
          
          <a href="/admin/audit-logs" className="flex items-center space-x-4 p-4 bg-purple-950/30 border border-purple-500/30 rounded-lg hover:bg-purple-950/50 transition cursor-pointer group">
            <Lock className="w-8 h-8 text-purple-400 group-hover:scale-110 transition" />
            <div>
              <p className="font-semibold text-white">Audit Logs</p>
              <p className="text-sm text-gray-400">Review system activity</p>
            </div>
          </a>

          <a href="/settings" className="flex items-center space-x-4 p-4 bg-cyan-950/30 border border-cyan-500/30 rounded-lg hover:bg-cyan-950/50 transition cursor-pointer group">
            <Settings className="w-8 h-8 text-cyan-400 group-hover:scale-110 transition" />
            <div>
              <p className="font-semibold text-white">System Settings</p>
              <p className="text-sm text-gray-400">Configure platform settings</p>
            </div>
          </a>

          <a href="/models" className="flex items-center space-x-4 p-4 bg-green-950/30 border border-green-500/30 rounded-lg hover:bg-green-950/50 transition cursor-pointer group">
            <BarChart3 className="w-8 h-8 text-green-400 group-hover:scale-110 transition" />
            <div>
              <p className="font-semibold text-white">ML Models</p>
              <p className="text-sm text-gray-400">Monitor AI model performance</p>
            </div>
          </a>
        </div>
      </div>

      {/* Information Box */}
      <div className="bg-gradient-to-r from-red-950/20 to-orange-950/20 border border-red-500/20 rounded-lg p-6">
        <h3 className="text-white font-semibold mb-2">Administrator Privileges</h3>
        <p className="text-gray-400 text-sm">
          As an administrator, you have full access to all system functions including user management, 
          audit logs, and system configuration. Monitor all security operations and ensure optimal platform performance.
        </p>
      </div>
    </div>
  );
};
