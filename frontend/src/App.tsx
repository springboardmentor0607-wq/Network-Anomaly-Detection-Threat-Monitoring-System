import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { TelemetryProvider } from './contexts/TelemetryContext';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { DashboardLayout } from './layouts/DashboardLayout';

import { LandingPage } from './pages/landing/LandingPage';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { OverviewPage } from './pages/overview/OverviewPage';
import { MonitoringPage } from './pages/monitoring/MonitoringPage';
import { TopologyPage } from './pages/topology/TopologyPage';
import { TrafficPage } from './pages/traffic/TrafficPage';
import { AnomaliesPage } from './pages/anomalies/AnomaliesPage';
import { PredictionPage } from './pages/prediction/PredictionPage';
import { ThreatsPage } from './pages/threats/ThreatsPage';
import { AlertsPage } from './pages/alerts/AlertsPage';
import { AlertDetailPage } from './pages/alerts/AlertDetailPage';
import { IncidentsPage } from './pages/incidents/IncidentsPage';
import { IntelligencePage } from './pages/intelligence/IntelligencePage';
import { AnalyticsPage } from './pages/analytics/AnalyticsPage';
import { DatasetPage } from './pages/datasets/DatasetPage';
import { ReportsPage } from './pages/reports/ReportsPage';
import { ModelsPage } from './pages/models/ModelsPage';
import { UsersPage } from './pages/admin/UsersPage';
import { AuditLogsPage } from './pages/admin/AuditLogsPage';
import { SettingsPage } from './pages/settings/SettingsPage';

export default function App() {
  return (
    <AuthProvider>
      <TelemetryProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Landing & Authentication Pages */}
            <Route path="/landing" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Protected SOC Application Shell Routes - Accessible to all registered & authenticated users */}
            <Route element={<ProtectedRoute />}>
              <Route element={<DashboardLayout />}>
                <Route path="/" element={<OverviewPage />} />
                <Route path="/monitoring" element={<MonitoringPage />} />
                <Route path="/topology" element={<TopologyPage />} />
                <Route path="/traffic" element={<TrafficPage />} />
                <Route path="/anomalies" element={<AnomaliesPage />} />
                <Route path="/prediction" element={<PredictionPage />} />
                <Route path="/threats" element={<ThreatsPage />} />
                <Route path="/alerts" element={<AlertsPage />} />
                <Route path="/alerts/:id" element={<AlertDetailPage />} />
                <Route path="/incidents" element={<IncidentsPage />} />
                <Route path="/intelligence" element={<IntelligencePage />} />
                <Route path="/analytics" element={<AnalyticsPage />} />
                <Route path="/datasets" element={<DatasetPage />} />
                <Route path="/reports" element={<ReportsPage />} />
                <Route path="/models" element={<ModelsPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/admin/users" element={<UsersPage />} />
                <Route path="/admin/audit-logs" element={<AuditLogsPage />} />
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </TelemetryProvider>
    </AuthProvider>
  );
}
