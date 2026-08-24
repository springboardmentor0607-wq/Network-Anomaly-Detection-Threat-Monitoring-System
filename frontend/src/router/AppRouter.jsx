import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Home from '../pages/Home';
import Dashboard from '../pages/Dashboard';
import Login from '../pages/Login';
import Register from '../pages/Register';
import NetworkMonitoring from '../pages/NetworkMonitoring';
import Alerts from '../pages/Alerts';
import Incidents from '../pages/Incidents';
import AttackVisualization from '../pages/AttackVisualization';
import Analytics from '../pages/Analytics';
import ThreatAnalysis from '../pages/ThreatAnalysis';
import ModelPerformance from '../pages/ModelPerformance';
import Reports from '../pages/Reports';
import UserManagement from '../pages/UserManagement';
import Settings from '../pages/Settings';
import Profile from '../pages/Profile';
import AuditLogs from '../pages/AuditLogs';
import SystemLogs from '../pages/SystemLogs';
import ProtectedRoute from '../components/ProtectedRoute';
import RoleProtectedRoute from '../components/RoleProtectedRoute';

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/attack-visualization" element={<AttackVisualization />} />
          <Route path="/incidents" element={<Incidents />} />
          <Route path="/alerts" element={<Alerts />} />
          <Route path="/network-monitoring" element={<NetworkMonitoring />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/threat-analysis" element={<ThreatAnalysis />} />
          <Route path="/model-performance" element={<ModelPerformance />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/threat-reports" element={<Reports />} />
          <Route path="/profile" element={<Profile />} />

          <Route element={<RoleProtectedRoute allowedRoles={['Security Administrator']} />}>
            <Route path="/settings" element={<Settings />} />
            <Route path="/user-management" element={<UserManagement title="User Management" />} />
            <Route path="/audit-logs" element={<AuditLogs />} />
            <Route path="/system-logs" element={<SystemLogs />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
