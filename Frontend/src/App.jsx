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
      <Toaster 
        position="top-right" 
        containerStyle={{ top: 70 }}
        reverseOrder={false} 
        toastOptions={{
          // Apple default response time
          duration: 5000, 
          // We set background transparent because our custom toast payload will handle the glass material
          style: {
            background: 'transparent',
            boxShadow: 'none',
            padding: 0,
            border: 'none',
            margin: '0',
          },
        }}
      />

      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="profile" element={<Profile />} />
            <Route path="traffic" element={<NetworkTraffic />} />
            <Route path="anomaly" element={<NetworkAnomaly />} />
            <Route path="performance" element={<ModelPerformance />} />
            <Route path="threats" element={<ThreatDetection />} />
            <Route path="alerts" element={<Alerts />} />
            <Route path="logs" element={<Logs />} />
            <Route path="devices" element={<Devices />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="security" element={<SecurityAnalytics />} />
            
            {/* Flat Protected Admin Routes */}
            <Route path="team" element={<ProtectedRoute allowedRoles={['administrator', 'admin', 'admin (lead)']}><TeamManagement /></ProtectedRoute>} />
            <Route path="settings" element={<ProtectedRoute allowedRoles={['administrator', 'admin', 'admin (lead)']}><Settings /></ProtectedRoute>} />
          </Route>
        </Route>
      </Routes>
    </>
  );
}

export default App;