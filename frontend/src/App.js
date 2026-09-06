import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { RefreshProvider } from './context/RefreshContext';
import ProtectedRoute from './routes/ProtectedRoute';

import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';

import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import NetworkMonitor from './pages/NetworkMonitor';
import Upload from './pages/Upload';
import ThreatDetection from './pages/ThreatDetection';
import Alerts from './pages/Alerts';
import Incidents from './pages/Incidents';
import Notifications from './pages/Notifications';
import Reports from './pages/Reports';
import ThreatIntelligence from './pages/ThreatIntelligence';
import AttackVisualization from './pages/AttackVisualization';
import WeeklySecurityTrends from './pages/WeeklySecurityTrends';
import SecurityAnalytics from './pages/SecurityAnalytics';
import Settings from './pages/Settings';
import Profile from './pages/Profile';
import UserManagement from './pages/UserManagement';
import AuditLogs from './pages/AuditLogs';

import './styles/theme.css';
import './styles/dashboard.css';

const AppLayout = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="app-layout">
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      <div className="main-content">
        <Navbar />
        {children}
      </div>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <RefreshProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Landing & Authentication Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/home" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected Application Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <AppLayout><Dashboard /></AppLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/network-monitor"
              element={
                <ProtectedRoute>
                  <AppLayout><NetworkMonitor /></AppLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/upload"
              element={
                <ProtectedRoute>
                  <AppLayout><Upload /></AppLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/threats"
              element={
                <ProtectedRoute>
                  <AppLayout><ThreatDetection /></AppLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/alerts"
              element={
                <ProtectedRoute>
                  <AppLayout><Alerts /></AppLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/incidents"
              element={
                <ProtectedRoute>
                  <AppLayout><Incidents /></AppLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/notifications"
              element={
                <ProtectedRoute>
                  <AppLayout><Notifications /></AppLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/reports"
              element={
                <ProtectedRoute>
                  <AppLayout><Reports /></AppLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/threat-intelligence"
              element={
                <ProtectedRoute>
                  <AppLayout><ThreatIntelligence /></AppLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/attack-visualization"
              element={
                <ProtectedRoute>
                  <AppLayout><AttackVisualization /></AppLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/weekly-security-trends"
              element={
                <ProtectedRoute>
                  <AppLayout><WeeklySecurityTrends /></AppLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/security-analytics"
              element={
                <ProtectedRoute>
                  <AppLayout><SecurityAnalytics /></AppLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <AppLayout><Settings /></AppLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <AppLayout><Profile /></AppLayout>
                </ProtectedRoute>
              }
            />

            {/* Admin Only Routes */}
            <Route
              path="/user-management"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <AppLayout><UserManagement /></AppLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/audit-logs"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <AppLayout><AuditLogs /></AppLayout>
                </ProtectedRoute>
              }
            />

            {/* Default fallback */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </RefreshProvider>
    </AuthProvider>
  );
}

export default App;
