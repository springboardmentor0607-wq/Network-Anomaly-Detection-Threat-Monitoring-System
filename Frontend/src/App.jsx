import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import ProtectedRoute from './components/ProtectedRoute';

// Public Pages
import Landing from './pages/landing';
import Login from './pages/login';
import Register from './pages/register';
import Profile from './pages/profile';

// Layout
import DashboardLayout from './layouts/DashboardLayout';

// Dashboard Module Pages
import Dashboard from './pages/dashboard';
import NetworkTraffic from './pages/NetworkTraffic';
import NetworkAnomaly from './pages/NetworkAnomaly';
import ThreatDetection from './pages/ThreatDetection';
import Alerts from './pages/Alerts';
import Logs from './pages/logs';
import Devices from './pages/devices';
import Analytics from './pages/Analytics';
import TeamManagement from './pages/TeamManagement';
import SecurityAnalytics from './pages/SecurityAnalytics';
import Settings from './pages/Settings';
import ModelPerformance from './pages/ModelPerformance';

function App() {
  return (
    <>
      {/* Global Toast Notifications for SOC Alerts */}
      <Toaster 
        position="top-right" 
        reverseOrder={false} 
        toastOptions={{
          duration: 4000,
          style: {
            background: '#0A0A0B',
            color: '#F2F2F0',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          },
        }}
      />

      <Routes>
        {/* Public Routes - Anyone can access these */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected Dashboard Routes - Requires Login */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="profile" element={<Profile />} />
            <Route path="traffic" element={<NetworkTraffic />} />
            <Route path="anomaly" element={<NetworkAnomaly />} />
            <Route path="/dashboard/performance" element={<ModelPerformance />} />
            <Route path="threats" element={<ThreatDetection />} />
            <Route path="alerts" element={<Alerts />} />
            <Route path="logs" element={<Logs />} />
            <Route path="devices" element={<Devices />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="security" element={<SecurityAnalytics />} />
            
            {/* Admin-Only Routes - Requires 'administrator' role */}
            <Route element={<ProtectedRoute allowedRoles={['administrator']} />}>
              <Route path="team" element={<TeamManagement />} />
              <Route path="settings" element={<Settings />} />
            </Route>
          </Route>
        </Route>
      </Routes>
    </>
  );
}

export default App;