import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import ProtectedRoute from "./components/ProtectedRoute";
import Landing from "./pages/Landing";
import Register from "./pages/Register";
import Login from "./pages/Login";
import AnalystDashboard from "./pages/AnalystDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import ModelPerformance from "./pages/ModelPerformance";
import DatasetManagement from "./pages/DatasetManagement";
import UserManagement from "./pages/UserManagement";
import SecurityAnalytics from "./pages/SecurityAnalytics";
import ThreatReports from "./pages/ThreatReports";
import SystemMonitoring from "./pages/SystemMonitoring";
import AdminSettings from "./pages/AdminSettings";
import NetworkTraffic from "./pages/NetworkTraffic";
import AnomalyDetection from "./pages/AnomalyDetection";
import ThreatDetection from "./pages/ThreatDetection";
import AnalystReports from "./pages/AnalystReports";
import Profile from "./pages/Profile";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Landing & Public Authentication Routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Security Analyst Protected Routes */}
        <Route
          path="/analyst/dashboard"
          element={
            <ProtectedRoute allowedRole="Security Analyst">
              <AnalystDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/analyst-dashboard"
          element={
            <ProtectedRoute allowedRole="Security Analyst">
              <AnalystDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/analyst/model-performance"
          element={
            <ProtectedRoute allowedRole="Security Analyst">
              <ModelPerformance role="Security Analyst" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/analyst/anomaly-detection"
          element={
            <ProtectedRoute allowedRole="Security Analyst">
              <AnomalyDetection />
            </ProtectedRoute>
          }
        />
        <Route
          path="/anomaly-detection"
          element={
            <ProtectedRoute allowedRole="Security Analyst">
              <AnomalyDetection />
            </ProtectedRoute>
          }
        />
        <Route
          path="/analyst/threat-classification"
          element={
            <ProtectedRoute allowedRole="Security Analyst">
              <ThreatDetection />
            </ProtectedRoute>
          }
        />
        <Route
          path="/analyst/threats"
          element={
            <ProtectedRoute allowedRole="Security Analyst">
              <ThreatDetection />
            </ProtectedRoute>
          }
        />
        <Route
          path="/threats"
          element={
            <ProtectedRoute allowedRole="Security Analyst">
              <ThreatDetection />
            </ProtectedRoute>
          }
        />
        <Route
          path="/analyst/prediction-reports"
          element={
            <ProtectedRoute allowedRole="Security Analyst">
              <AnalystReports />
            </ProtectedRoute>
          }
        />
        <Route
          path="/analyst/reports"
          element={
            <ProtectedRoute allowedRole="Security Analyst">
              <AnalystReports />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports"
          element={
            <ProtectedRoute allowedRole="Security Analyst">
              <AnalystReports />
            </ProtectedRoute>
          }
        />
        <Route
          path="/analyst/profile"
          element={
            <ProtectedRoute allowedRole="Security Analyst">
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/network"
          element={
            <ProtectedRoute allowedRole="Security Analyst">
              <NetworkTraffic />
            </ProtectedRoute>
          }
        />

        {/* Security Administrator Protected Routes */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute allowedRole="Security Administrator">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin-dashboard"
          element={
            <ProtectedRoute allowedRole="Security Administrator">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/model-performance"
          element={
            <ProtectedRoute allowedRole="Security Administrator">
              <ModelPerformance role="Security Administrator" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/dataset"
          element={
            <ProtectedRoute allowedRole="Security Administrator">
              <DatasetManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/team"
          element={
            <ProtectedRoute allowedRole="Security Administrator">
              <DatasetManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute allowedRole="Security Administrator">
              <UserManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/analytics"
          element={
            <ProtectedRoute allowedRole="Security Administrator">
              <ModelPerformance role="Security Administrator" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/reports"
          element={
            <ProtectedRoute allowedRole="Security Administrator">
              <ThreatReports />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/monitoring"
          element={
            <ProtectedRoute allowedRole="Security Administrator">
              <SystemMonitoring />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/settings"
          element={
            <ProtectedRoute allowedRole="Security Administrator">
              <AdminSettings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/profile"
          element={
            <ProtectedRoute allowedRole="Security Administrator">
              <Profile />
            </ProtectedRoute>
          }
        />

        {/* Shared Protected Routes (Accessible to both Admin & Analyst) */}
        <Route
          path="/model-performance"
          element={
            <ProtectedRoute allowedRoles={["Security Administrator", "Security Analyst"]}>
              <ModelPerformance />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute allowedRoles={["Security Administrator", "Security Analyst"]}>
              <Profile />
            </ProtectedRoute>
          }
        />

        {/* Fallback Catch-all Route */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;