import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';

// Layouts
import AnalystLayout from '../layouts/AnalystLayout';
import AdminLayout from '../layouts/AdminLayout';

// Auth Pages
import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';
import LandingPage from '../pages/LandingPage';

// Analyst Pages
import AnalystDashboardPage from '../pages/analyst/AnalystDashboardPage';
import NetworkTrafficPage from '../pages/analyst/NetworkTrafficPage';
import ThreatAlertsPage from '../pages/analyst/ThreatAlertsPage';
import IncidentManagementPage from '../pages/analyst/IncidentManagementPage';
import ThreatIntelPage from '../pages/analyst/ThreatIntelPage';
import AnomalyDetectionPage from '../pages/analyst/AnomalyDetectionPage';
import AnalystAIDetectionPage from '../pages/analyst/AnalystAIDetectionPage';
import ReportsPage from '../pages/analyst/ReportsPage';
import ProfilePage from '../pages/analyst/ProfilePage';

// Admin Pages
import AdminDashboardPage from '../pages/admin/AdminDashboardPage';
import NetworkStatusPage from '../pages/admin/NetworkStatusPage';
import UserManagementPage from '../pages/admin/UserManagementPage';
import TeamManagementPage from '../pages/admin/TeamManagementPage';
import SecurityAnalyticsPage from '../pages/admin/SecurityAnalyticsPage';
import ThreatReportsPage from '../pages/admin/ThreatReportsPage';
import SystemMonitoringPage from '../pages/admin/SystemMonitoringPage';
import AdminDatasetManagementPage from '../pages/admin/AdminDatasetManagementPage';
import AdminAIManagementPage from '../pages/admin/AdminAIManagementPage';
import SettingsPage from '../pages/admin/SettingsPage';

// 404
import NotFoundPage from '../pages/NotFoundPage';

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Auth Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Default Route */}
      <Route path="/" element={<LandingPage />} />

      {/* Direct Shortcuts */}
      <Route
        path="/model-performance"
        element={<Navigate to="/admin/ai-management" replace />}
      />

      {/* Security Analyst Protected Routes */}
      <Route
        path="/analyst"
        element={
          <ProtectedRoute allowedRoles={['analyst', 'admin']}>
            <AnalystLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<AnalystDashboardPage />} />
        <Route path="traffic" element={<NetworkTrafficPage />} />
        <Route path="threats" element={<ThreatAlertsPage />} />
        <Route path="incidents" element={<IncidentManagementPage />} />
        <Route path="threat-intel" element={<ThreatIntelPage />} />
        <Route path="anomaly" element={<AnomalyDetectionPage />} />
        <Route path="ai-detection" element={<AnalystAIDetectionPage />} />
        <Route path="analytics" element={<SecurityAnalyticsPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>

      {/* Administrator Protected Routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<AdminDashboardPage />} />
        <Route path="network" element={<NetworkStatusPage />} />
        <Route path="users" element={<UserManagementPage />} />
        <Route path="teams" element={<TeamManagementPage />} />
        <Route path="analytics" element={<SecurityAnalyticsPage />} />
        <Route path="reports" element={<ThreatReportsPage />} />
        <Route path="monitoring" element={<SystemMonitoringPage />} />
        <Route path="datasets" element={<AdminDatasetManagementPage />} />
        <Route path="ai-management" element={<AdminAIManagementPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>

      {/* Catch-all 404 Route */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

export default AppRoutes;
