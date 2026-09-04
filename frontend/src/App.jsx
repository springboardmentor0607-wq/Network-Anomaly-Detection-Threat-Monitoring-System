import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import Sidebar from './components/Sidebar';
import { NotificationBell } from './components/NotificationBell';

import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';

import NetworkStatus from './pages/NetworkStatus';
import AIManagement from './pages/AIManagement';
import ModelManagement from './pages/ModelManagement';
import ModelTraining from './pages/ModelTraining';
import TestModel from './pages/TestModel';
import AnomalyDetection from './pages/AnomalyDetection';

import ThreatAlerts from './pages/ThreatAlerts';
import Incidents from './pages/Incidents';
import ThreatIntelligence from './pages/ThreatIntelligence';
import ThreatReports from './pages/ThreatReports';

import AIThreatDetection from './pages/AIThreatDetection';
import SecurityAnalytics from './pages/SecurityAnalytics';
import ModelEvaluation from './pages/ModelEvaluation';
import SystemMonitoring from './pages/SystemMonitoring';
import Settings from './pages/Settings';

const ProtectedLayout = ({ children }) => {
  const token = localStorage.getItem('netshield_token');

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex min-h-screen bg-[#070b14]">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-[#1b2a4a] bg-[#0d1527] px-8 flex justify-end items-center">
          <NotificationBell />
        </header>

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Authentication */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Main Dashboard */}
        <Route
          path="/"
          element={
            <ProtectedLayout>
              <Dashboard />
            </ProtectedLayout>
          }
        />

        {/* Network & AI */}
        <Route
          path="/network-status"
          element={
            <ProtectedLayout>
              <NetworkStatus />
            </ProtectedLayout>
          }
        />

        <Route
          path="/ai-management"
          element={
            <ProtectedLayout>
              <AIManagement />
            </ProtectedLayout>
          }
        />

        <Route
          path="/model-management"
          element={
            <ProtectedLayout>
              <ModelManagement />
            </ProtectedLayout>
          }
        />

        <Route
          path="/model-training"
          element={
            <ProtectedLayout>
              <ModelTraining />
            </ProtectedLayout>
          }
        />

        <Route
          path="/test-model"
          element={
            <ProtectedLayout>
              <TestModel />
            </ProtectedLayout>
          }
        />

        <Route
          path="/anomaly-detection"
          element={
            <ProtectedLayout>
              <AnomalyDetection />
            </ProtectedLayout>
          }
        />

        {/* Threat Management */}
        <Route
          path="/threat-alerts"
          element={
            <ProtectedLayout>
              <ThreatAlerts />
            </ProtectedLayout>
          }
        />

        <Route
          path="/incidents"
          element={
            <ProtectedLayout>
              <Incidents />
            </ProtectedLayout>
          }
        />

        <Route
          path="/threat-intelligence"
          element={
            <ProtectedLayout>
              <ThreatIntelligence />
            </ProtectedLayout>
          }
        />

        <Route
          path="/threat-reports"
          element={
            <ProtectedLayout>
              <ThreatReports />
            </ProtectedLayout>
          }
        />

        {/* Analytics */}
        <Route
          path="/ai-threat-detection"
          element={
            <ProtectedLayout>
              <AIThreatDetection />
            </ProtectedLayout>
          }
        />

        <Route
          path="/security-analytics"
          element={
            <ProtectedLayout>
              <SecurityAnalytics />
            </ProtectedLayout>
          }
        />

        <Route
          path="/model-evaluation"
          element={
            <ProtectedLayout>
              <ModelEvaluation />
            </ProtectedLayout>
          }
        />

        <Route
          path="/system-monitoring"
          element={
            <ProtectedLayout>
              <SystemMonitoring />
            </ProtectedLayout>
          }
        />

        <Route
          path="/settings"
          element={
            <ProtectedLayout>
              <Settings />
            </ProtectedLayout>
          }
        />

        {/* Reports */}
        <Route
          path="/reports"
          element={
            <ProtectedLayout>
              <SecurityAnalytics />
            </ProtectedLayout>
          }
        />

        {/* Unknown route */}
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </BrowserRouter>
  );
}