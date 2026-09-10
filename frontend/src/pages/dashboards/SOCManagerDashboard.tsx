import React, { useEffect, useState } from 'react';
import { AlertTriangle, TrendingUp, Clock, Target, Users, BarChart3 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { apiClient } from '../../api/client';

export const SOCManagerDashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    criticalAlerts: 0,
    threatsBlocked: 0,
    avgResponseTime: 0,
    teamMembers: 0,
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
          <h1 className="text-3xl font-bold text-white">SOC Manager Dashboard</h1>
          <p className="text-gray-400 mt-2">Security Operations Control Center</p>
        </div>
        <div className="flex items-center space-x-2 bg-orange-950/30 border border-orange-500/30 rounded-lg px-4 py-2">
          <Target className="w-5 h-5 text-orange-400" />
          <span className="text-orange-400 font-semibold">Manager Access</span>
        </div>
      </div>

      {/* Critical Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-[#222222] to-[#121212] border border-red-500/30 rounded-lg p-6 hover:border-red-500 transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-400 text-sm font-medium">Critical Alerts</p>
              <p className="text-3xl font-bold text-white mt-2">{stats.criticalAlerts}</p>
            </div>
            <AlertTriangle className="w-12 h-12 text-red-400/20" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-[#222222] to-[#121212] border border-green-500/30 rounded-lg p-6 hover:border-green-500 transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-400 text-sm font-medium">Threats Blocked</p>
              <p className="text-3xl font-bold text-white mt-2">{stats.threatsBlocked}</p>
            </div>
            <TrendingUp className="w-12 h-12 text-green-400/20" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-[#222222] to-[#121212] border border-blue-500/30 rounded-lg p-6 hover:border-blue-500 transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-400 text-sm font-medium">Avg Response Time</p>
              <p className="text-3xl font-bold text-white mt-2">{stats.avgResponseTime}m</p>
            </div>
            <Clock className="w-12 h-12 text-blue-400/20" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-[#222222] to-[#121212] border border-purple-500/30 rounded-lg p-6 hover:border-purple-500 transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-400 text-sm font-medium">Team Members</p>
              <p className="text-3xl font-bold text-white mt-2">{stats.teamMembers}</p>
            </div>
            <Users className="w-12 h-12 text-purple-400/20" />
          </div>
        </div>
      </div>

      {/* Manager Functions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-[#222222] to-[#121212] border border-[#444444] rounded-lg p-6">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-orange-400" />
            <span>Alert Management</span>
          </h2>
          <div className="space-y-3">
            <a href="/alerts" className="flex items-center justify-between p-3 bg-orange-950/20 border border-orange-500/20 rounded hover:bg-orange-950/40 transition cursor-pointer group">
              <span className="text-gray-300 group-hover:text-white transition">View Active Alerts</span>
              <span className="text-orange-400 font-semibold">{stats.criticalAlerts}</span>
            </a>
            <a href="/incidents" className="flex items-center justify-between p-3 bg-red-950/20 border border-red-500/20 rounded hover:bg-red-950/40 transition cursor-pointer group">
              <span className="text-gray-300 group-hover:text-white transition">Manage Incidents</span>
              <span className="text-red-400 font-semibold">→</span>
            </a>
            <a href="/threats" className="flex items-center justify-between p-3 bg-yellow-950/20 border border-yellow-500/20 rounded hover:bg-yellow-950/40 transition cursor-pointer group">
              <span className="text-gray-300 group-hover:text-white transition">Threat Analysis</span>
              <span className="text-yellow-400 font-semibold">→</span>
            </a>
          </div>
        </div>

        <div className="bg-gradient-to-br from-[#222222] to-[#121212] border border-[#444444] rounded-lg p-6">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center space-x-2">
            <Users className="w-5 h-5 text-purple-400" />
            <span>Team Management</span>
          </h2>
          <div className="space-y-3">
            <a href="/admin/users" className="flex items-center justify-between p-3 bg-purple-950/20 border border-purple-500/20 rounded hover:bg-purple-950/40 transition cursor-pointer group">
              <span className="text-gray-300 group-hover:text-white transition">Manage Analysts</span>
              <span className="text-purple-400 font-semibold">→</span>
            </a>
            <a href="/analytics" className="flex items-center justify-between p-3 bg-blue-950/20 border border-blue-500/20 rounded hover:bg-blue-950/40 transition cursor-pointer group">
              <span className="text-gray-300 group-hover:text-white transition">View Analytics</span>
              <span className="text-blue-400 font-semibold">→</span>
            </a>
            <a href="/reports" className="flex items-center justify-between p-3 bg-cyan-950/20 border border-cyan-500/20 rounded hover:bg-cyan-950/40 transition cursor-pointer group">
              <span className="text-gray-300 group-hover:text-white transition">Generate Reports</span>
              <span className="text-cyan-400 font-semibold">→</span>
            </a>
          </div>
        </div>
      </div>

      {/* Information Box */}
      <div className="bg-gradient-to-r from-orange-950/20 to-yellow-950/20 border border-orange-500/20 rounded-lg p-6">
        <h3 className="text-white font-semibold mb-2">Manager Responsibilities</h3>
        <p className="text-gray-400 text-sm">
          Monitor alert queues, manage security incidents, oversee analyst team performance, 
          and generate compliance reports. You have access to all detection systems and incident management tools.
        </p>
      </div>
    </div>
  );
};
