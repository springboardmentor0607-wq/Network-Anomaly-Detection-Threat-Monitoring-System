import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./components/Login";
import Register from "./components/Register";
import PCAPAnalytics from "./dashboards/PCAPAnalytics";
import AttackVisualization from "./dashboards/AttackVisualization";

/* ===========================
   ADMINISTRATOR
=========================== */

import AdminDashboard from "./dashboards/AdminDashboard";
import DashboardHome from "./dashboards/DashboardHome";
import UserManagementPage from "./dashboards/UserManagementPage";
import RoleManagementPage from "./dashboards/RoleManagementPage";
import OrganizationPage from "./dashboards/OrganizationPage";
import ThreatAlertsPage from "./dashboards/ThreatAlertsPage";
import AuditLogsPage from "./dashboards/AuditLogsPage";
import ReportsPage from "./dashboards/ReportsPage";
import SettingsPage from "./dashboards/SettingsPage";

/* ===========================
   SECURITY ANALYST
=========================== */

import SecurityDashboard from "./dashboards/SecurityDashboard";
import SecurityHomePage from "./dashboards/SecurityHomePage";
import LiveNetworkPage from "./dashboards/LiveNetworkPage";
import ThreatAnalysisPage from "./dashboards/ThreatAnalysisPage";
import IncidentInvestigationPage from "./dashboards/IncidentInvestigationPage";
import AIPredictionsPage from "./dashboards/AIPredictionsPage";
import ThreatTimelinePage from "./dashboards/ThreatTimelinePage";
import SecurityReportsPage from "./dashboards/SecurityReportsPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* ===========================
            LOGIN
        =========================== */}

        <Route path="/" element={<Login />} />

        {/* ===========================
            REGISTER
        =========================== */}

        <Route path="/register" element={<Register />} />

        {/* ===========================
            ADMINISTRATOR
        =========================== */}

        <Route path="/admin" element={<AdminDashboard />}>
          <Route index element={<DashboardHome />} />
          <Route path="dashboard" element={<DashboardHome />} />
          <Route path="users" element={<UserManagementPage />} />
          <Route path="roles" element={<RoleManagementPage />} />
          <Route path="organization" element={<OrganizationPage />} />
          <Route path="alerts" element={<ThreatAlertsPage />} />
          <Route path="audit" element={<AuditLogsPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        {/* ===========================
            SECURITY ANALYST
        =========================== */}

        <Route path="/security" element={<SecurityDashboard />}>
          <Route index element={<SecurityHomePage />} />
          <Route path="dashboard" element={<SecurityHomePage />} />
          <Route path="network" element={<LiveNetworkPage />} />
          <Route path="threats" element={<ThreatAnalysisPage />} />
          <Route
            path="incidents"
            element={<IncidentInvestigationPage />}
          />
          <Route path="ai" element={<AIPredictionsPage />} />
          <Route path="timeline" element={<ThreatTimelinePage />} />
          <Route path="reports" element={<SecurityReportsPage />} />

          {/* PCAP Analytics is now inside Security Analyst layout */}
          <Route path="pcap" element={<PCAPAnalytics />} />
        </Route>

        {/* ===========================
            ADDITIONAL PAGES
        =========================== */}

        <Route
          path="/attack-visualization"
          element={<AttackVisualization />}
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;