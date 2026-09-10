import React, { useEffect, useState } from 'react';
import { Eye, BarChart3, AlertTriangle, TrendingUp } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { apiClient } from '../../api/client';

export const ViewerDashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalAlerts: 0,
    criticalThreats: 0,
    systemStatus: 'Online',
    detectionRate: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/api/v1/analytics/dashboard');
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
          <h1 className="text-3xl font-bold text-white">Viewer Dashboard</h1>
          <p className="text-gray-400 mt-2">Read-Only Security Monitoring View</p>
        </div>
        <div className="flex items-center space-x-2 bg-gray-700/30 border border-gray-500/30 rounded-lg px-4 py-2">
          <Eye className="w-5 h-5 text-gray-400" />
          <span className="text-gray-400 font-semibold">Viewer Access</span>
        </div>
      </div>

      {/* System Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-[#222222] to-[#121212] border border-[#444444] rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm font-medium">Total Alerts</p>
              <p className="text-3xl font-bold text-white mt-2">{stats.totalAlerts}</p>
            </div>
            <AlertTriangle className="w-12 h-12 text-gray-500/20" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-[#222222] to-[#121212] border border-[#444444] rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm font-medium">Critical Threats</p>
              <p className="text-3xl font-bold text-white mt-2">{stats.criticalThreats}</p>
            </div>
            <TrendingUp className="w-12 h-12 text-gray-500/20" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-[#222222] to-[#121212] border border-[#444444] rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm font-medium">System Status</p>
              <p className="text-3xl font-bold text-green-400 mt-2">Online</p>
            </div>
            <BarChart3 className="w-12 h-12 text-gray-500/20" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-[#222222] to-[#121212] border border-[#444444] rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm font-medium">Detection Rate</p>
              <p className="text-3xl font-bold text-white mt-2">{stats.detectionRate}%</p>
            </div>
            <Eye className="w-12 h-12 text-gray-500/20" />
          </div>
        </div>
      </div>

      {/* Monitoring Data */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-[#222222] to-[#121212] border border-[#444444] rounded-lg p-6">
          <h2 className="text-lg font-bold text-white mb-4">Security Status</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-[#121212] rounded border border-[#444444]">
              <span className="text-gray-300">Network Status</span>
              <span className="text-green-400 font-semibold">Normal</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-[#121212] rounded border border-[#444444]">
              <span className="text-gray-300">Firewall Status</span>
              <span className="text-green-400 font-semibold">Active</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-[#121212] rounded border border-[#444444]">
              <span className="text-gray-300">IDS/IPS Status</span>
              <span className="text-green-400 font-semibold">Running</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-[#121212] rounded border border-[#444444]">
              <span className="text-gray-300">Last Update</span>
              <span className="text-gray-400 font-semibold">Now</span>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-[#222222] to-[#121212] border border-[#444444] rounded-lg p-6">
          <h2 className="text-lg font-bold text-white mb-4">Available Views</h2>
          <div className="space-y-2">
            <a href="/monitoring" className="flex items-center justify-between p-3 bg-[#121212] rounded border border-[#444444] hover:border-gray-400 transition cursor-pointer group">
              <span className="text-gray-300 group-hover:text-white transition">Live Monitoring</span>
              <span className="text-gray-500 group-hover:text-gray-400">→</span>
            </a>
            <a href="/alerts" className="flex items-center justify-between p-3 bg-[#121212] rounded border border-[#444444] hover:border-gray-400 transition cursor-pointer group">
              <span className="text-gray-300 group-hover:text-white transition">Alerts & Events</span>
              <span className="text-gray-500 group-hover:text-gray-400">→</span>
            </a>
            <a href="/analytics" className="flex items-center justify-between p-3 bg-[#121212] rounded border border-[#444444] hover:border-gray-400 transition cursor-pointer group">
              <span className="text-gray-300 group-hover:text-white transition">Analytics & Reports</span>
              <span className="text-gray-500 group-hover:text-gray-400">→</span>
            </a>
            <a href="/traffic" className="flex items-center justify-between p-3 bg-[#121212] rounded border border-[#444444] hover:border-gray-400 transition cursor-pointer group">
              <span className="text-gray-300 group-hover:text-white transition">Traffic Analysis</span>
              <span className="text-gray-500 group-hover:text-gray-400">→</span>
            </a>
          </div>
        </div>
      </div>

      {/* Information Box */}
      <div className="bg-gradient-to-r from-gray-700/20 to-gray-800/20 border border-gray-500/20 rounded-lg p-6">
        <h3 className="text-white font-semibold mb-2">Viewer Permissions</h3>
        <p className="text-gray-400 text-sm">
          You have read-only access to monitoring dashboards and reports. 
          You can view security alerts, system status, and analytics data, but cannot perform administrative actions or make configuration changes.
        </p>
      </div>
    </div>
  );
};
