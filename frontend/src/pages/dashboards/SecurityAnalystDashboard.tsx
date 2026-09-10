import React, { useEffect, useState } from 'react';
import { Activity, AlertTriangle, Zap, BarChart3, Globe, Lock } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { apiClient } from '../../api/client';

export const SecurityAnalystDashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    activeAlerts: 0,
    anomalies: 0,
    predictions: 0,
    threats: 0,
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
          <h1 className="text-3xl font-bold text-white">Security Analyst Dashboard</h1>
          <p className="text-gray-400 mt-2">Threat Detection & Analysis Workspace</p>
        </div>
        <div className="flex items-center space-x-2 bg-cyan-950/30 border border-cyan-500/30 rounded-lg px-4 py-2">
          <Lock className="w-5 h-5 text-cyan-400" />
          <span className="text-cyan-400 font-semibold">Analyst Access</span>
        </div>
      </div>

      {/* Detection Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-[#222222] to-[#121212] border border-cyan-500/30 rounded-lg p-6 hover:border-cyan-500 transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-cyan-400 text-sm font-medium">Active Alerts</p>
              <p className="text-3xl font-bold text-white mt-2">{stats.activeAlerts}</p>
            </div>
            <AlertTriangle className="w-12 h-12 text-cyan-400/20" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-[#222222] to-[#121212] border border-yellow-500/30 rounded-lg p-6 hover:border-yellow-500 transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-400 text-sm font-medium">Anomalies Found</p>
              <p className="text-3xl font-bold text-white mt-2">{stats.anomalies}</p>
            </div>
            <Activity className="w-12 h-12 text-yellow-400/20" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-[#222222] to-[#121212] border border-purple-500/30 rounded-lg p-6 hover:border-purple-500 transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-400 text-sm font-medium">Predictions</p>
              <p className="text-3xl font-bold text-white mt-2">{stats.predictions}</p>
            </div>
            <Zap className="w-12 h-12 text-purple-400/20" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-[#222222] to-[#121212] border border-red-500/30 rounded-lg p-6 hover:border-red-500 transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-400 text-sm font-medium">Threats Identified</p>
              <p className="text-3xl font-bold text-white mt-2">{stats.threats}</p>
            </div>
            <Globe className="w-12 h-12 text-red-400/20" />
          </div>
        </div>
      </div>

      {/* Analysis Tools */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-[#222222] to-[#121212] border border-[#444444] rounded-lg p-6">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center space-x-2">
            <Activity className="w-5 h-5 text-cyan-400" />
            <span>Detection Analysis</span>
          </h2>
          <div className="space-y-3">
            <a href="/anomalies" className="flex items-center justify-between p-3 bg-cyan-950/20 border border-cyan-500/20 rounded hover:bg-cyan-950/40 transition cursor-pointer group">
              <span className="text-gray-300 group-hover:text-white transition">Anomaly Detection</span>
              <span className="text-cyan-400 font-semibold">{stats.anomalies}</span>
            </a>
            <a href="/prediction" className="flex items-center justify-between p-3 bg-purple-950/20 border border-purple-500/20 rounded hover:bg-purple-950/40 transition cursor-pointer group">
              <span className="text-gray-300 group-hover:text-white transition">Intrusion Prediction</span>
              <span className="text-purple-400 font-semibold">{stats.predictions}</span>
            </a>
            <a href="/monitoring" className="flex items-center justify-between p-3 bg-blue-950/20 border border-blue-500/20 rounded hover:bg-blue-950/40 transition cursor-pointer group">
              <span className="text-gray-300 group-hover:text-white transition">Live Monitoring</span>
              <span className="text-blue-400 font-semibold">→</span>
            </a>
          </div>
        </div>

        <div className="bg-gradient-to-br from-[#222222] to-[#121212] border border-[#444444] rounded-lg p-6">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center space-x-2">
            <Globe className="w-5 h-5 text-orange-400" />
            <span>Threat Intelligence</span>
          </h2>
          <div className="space-y-3">
            <a href="/threats" className="flex items-center justify-between p-3 bg-orange-950/20 border border-orange-500/20 rounded hover:bg-orange-950/40 transition cursor-pointer group">
              <span className="text-gray-300 group-hover:text-white transition">Threat Vectors</span>
              <span className="text-orange-400 font-semibold">{stats.threats}</span>
            </a>
            <a href="/intelligence" className="flex items-center justify-between p-3 bg-emerald-950/20 border border-emerald-500/20 rounded hover:bg-emerald-950/40 transition cursor-pointer group">
              <span className="text-gray-300 group-hover:text-white transition">Threat Intelligence</span>
              <span className="text-emerald-400 font-semibold">→</span>
            </a>
            <a href="/traffic" className="flex items-center justify-between p-3 bg-pink-950/20 border border-pink-500/20 rounded hover:bg-pink-950/40 transition cursor-pointer group">
              <span className="text-gray-300 group-hover:text-white transition">Traffic Analysis</span>
              <span className="text-pink-400 font-semibold">→</span>
            </a>
          </div>
        </div>
      </div>

      {/* Recent Activities & Alerts */}
      <div className="bg-gradient-to-br from-[#222222] to-[#121212] border border-[#444444] rounded-lg p-6">
        <h2 className="text-lg font-bold text-white mb-4 flex items-center space-x-2">
          <BarChart3 className="w-5 h-5 text-blue-400" />
          <span>Quick Actions</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <a href="/alerts" className="p-4 bg-red-950/20 border border-red-500/20 rounded hover:bg-red-950/40 transition cursor-pointer text-center">
            <p className="text-red-400 font-semibold">View Alerts</p>
            <p className="text-2xl font-bold text-white mt-1">{stats.activeAlerts}</p>
          </a>
          <a href="/incidents" className="p-4 bg-yellow-950/20 border border-yellow-500/20 rounded hover:bg-yellow-950/40 transition cursor-pointer text-center">
            <p className="text-yellow-400 font-semibold">Incidents</p>
            <p className="text-2xl font-bold text-white mt-1">0</p>
          </a>
          <a href="/analytics" className="p-4 bg-blue-950/20 border border-blue-500/20 rounded hover:bg-blue-950/40 transition cursor-pointer text-center">
            <p className="text-blue-400 font-semibold">Analytics</p>
            <p className="text-2xl font-bold text-white mt-1">→</p>
          </a>
        </div>
      </div>

      {/* Information Box */}
      <div className="bg-gradient-to-r from-cyan-950/20 to-blue-950/20 border border-cyan-500/20 rounded-lg p-6">
        <h3 className="text-white font-semibold mb-2">Analyst Workspace</h3>
        <p className="text-gray-400 text-sm">
          Investigate security alerts, analyze anomalies, and predict intrusions. 
          You can view all threat detections, monitor network traffic, and access threat intelligence data.
        </p>
      </div>
    </div>
  );
};
