import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import SystemStatusPanel from "../components/SystemStatusPanel";
import {
  FaDatabase,
  FaUsers,
  FaShieldAlt,
  FaServer,
  FaUserCheck,
  FaClock,
  FaFileAlt,
  FaDesktop,
  FaHistory,
  FaUserPlus,
  FaListAlt
} from "react-icons/fa";
import "../styles/Dashboard.css";

function AdminDashboard() {
  const [adminSummary, setAdminSummary] = useState({
    totalUsers: 24,
    activeUsers: 18,
    datasetsLoaded: 4,
    threatReportsCount: 104,
    systemStatus: "99.9% Operational",
    aiModelStatus: "Active & Healthy (Random Forest)",
    recentUserRegistrations: [
      { id: 1, name: "sarah_admin", email: "sarah.j@netshield.ai", role: "Security Administrator", date: "2026-08-08" },
      { id: 2, name: "alex_analyst", email: "alex.r@netshield.ai", role: "Security Analyst", date: "2026-08-07" },
      { id: 3, name: "marcus_soc", email: "marcus.v@netshield.ai", role: "Security Analyst", date: "2026-08-05" }
    ],
    recentActivities: [
      { id: 1, user: "admin@netshield.ai", action: "Updated System Governance Policies", time: "10 mins ago" },
      { id: 2, user: "analyst1@netshield.ai", action: "Exported Incident Audit Log", time: "25 mins ago" },
      { id: 3, user: "admin@netshield.ai", action: "Provisioned New Analyst Credentials", time: "1 hour ago" },
      { id: 4, user: "analyst2@netshield.ai", action: "Acknowledged System Monitoring Alert", time: "2 hours ago" }
    ],
    recentIncidentsSummary: [
      { id: "INC-8021", category: "DoS Attack Cluster", severity: "High", affectedTarget: "10.0.0.1 (Gateway)", time: "12 mins ago" },
      { id: "INC-8020", category: "Reconnaissance Sweep", severity: "Medium", affectedTarget: "10.0.2.15 (Subnet B)", time: "45 mins ago" },
      { id: "INC-8019", category: "Unauthorized Exfiltration", severity: "Critical", affectedTarget: "10.0.4.88 (DB Server)", time: "2 hours ago" }
    ],
    systemLogs: [
      { id: 101, timestamp: "2026-08-10 19:04:12", component: "PostgreSQL", level: "INFO", message: "Database connection pool healthy (Port 5432)" },
      { id: 102, timestamp: "2026-08-10 19:01:05", component: "REST Gateway", level: "INFO", message: "Flask server active on http://127.0.0.1:5000" },
      { id: 103, timestamp: "2026-08-10 18:55:40", component: "Auth Module", level: "INFO", message: "User session authenticated for admin_sarah" },
      { id: 104, timestamp: "2026-08-10 18:40:18", component: "Dataset Engine", level: "INFO", message: "UNSW-NB15 & CICIDS2017 repositories verified" }
    ]
  });

  return (
    <div className="soc-layout">
      <Sidebar role="Security Administrator" />
      <Topbar title="Security Administrator System Governance Dashboard" />

      <div className="soc-main-content">
        {/* Header */}
        <div className="dashboard-header">
          <div>
            <h1 className="dashboard-title">
              🛡️ Security Administrator Governance Dashboard
            </h1>
            <p className="dashboard-subtitle">
              System Administration, User Credentials, Dataset Supervision, AI Model Status & Operational Health
            </p>
          </div>
        </div>

        {/* Administrative KPI Cards Grid */}
        <div className="soc-grid-4">
          {/* Card 1: Total Users */}
          <div className="soc-card" style={{ borderColor: "rgba(56, 189, 248, 0.4)" }}>
            <div className="soc-card-title">
              <FaUsers style={{ color: "#38bdf8" }} /> Total Users
            </div>
            <div className="soc-card-value" style={{ color: "#38bdf8" }}>
              {adminSummary.totalUsers} Registered
            </div>
            <div className="soc-card-subtext">User Identity Pool</div>
          </div>

          {/* Card 2: Active Users */}
          <div className="soc-card" style={{ borderColor: "rgba(16, 185, 129, 0.4)" }}>
            <div className="soc-card-title">
              <FaUserCheck style={{ color: "#10b981" }} /> Active Users
            </div>
            <div className="soc-card-value" style={{ color: "#34d399" }}>
              {adminSummary.activeUsers} Online
            </div>
            <div className="soc-card-subtext">Active SOC Sessions</div>
          </div>

          {/* Card 3: Datasets */}
          <div className="soc-card" style={{ borderColor: "rgba(168, 85, 247, 0.4)" }}>
            <div className="soc-card-title">
              <FaDatabase style={{ color: "#c084fc" }} /> Datasets Loaded
            </div>
            <div className="soc-card-value" style={{ color: "#c084fc" }}>
              {adminSummary.datasetsLoaded} Repositories
            </div>
            <div className="soc-card-subtext">UNSW-NB15 & CICIDS2017</div>
          </div>

          {/* Card 4: Threat Reports */}
          <div className="soc-card" style={{ borderColor: "rgba(245, 158, 11, 0.4)" }}>
            <div className="soc-card-title">
              <FaFileAlt style={{ color: "#f59e0b" }} /> Threat Reports
            </div>
            <div className="soc-card-value" style={{ color: "#fbbf24" }}>
              {adminSummary.threatReportsCount} Audit Files
            </div>
            <div className="soc-card-subtext">Generated Reports</div>
          </div>

          {/* Card 5: System Status */}
          <div className="soc-card" style={{ borderColor: "rgba(0, 242, 254, 0.4)" }}>
            <div className="soc-card-title">
              <FaServer style={{ color: "#00f2fe" }} /> System Status
            </div>
            <div className="soc-card-value" style={{ color: "#00f2fe" }}>
              {adminSummary.systemStatus}
            </div>
            <div className="soc-card-subtext">Infrastructure Health</div>
          </div>

          {/* Card 6: AI Model Status */}
          <div className="soc-card" style={{ borderColor: "rgba(52, 211, 153, 0.4)" }}>
            <div className="soc-card-title">
              <FaShieldAlt style={{ color: "#34d399" }} /> AI Model Status
            </div>
            <div className="soc-card-value" style={{ fontSize: "1.1rem", color: "#34d399" }}>
              {adminSummary.aiModelStatus}
            </div>
            <div className="soc-card-subtext">Deployment Readiness</div>
          </div>
        </div>

        {/* Section 2: Recent User Registrations & Recent Administrative Activities */}
        <div className="soc-grid-2" style={{ marginTop: "24px" }}>
          {/* Recent User Registrations Card */}
          <div className="soc-card">
            <div className="soc-card-header-title">
              <h3 className="section-title">
                <FaUserPlus style={{ color: "#10b981" }} /> Recent User Registrations
              </h3>
            </div>
            <div style={{ overflowX: "auto", marginTop: "12px" }}>
              <table className="alerts-table">
                <thead>
                  <tr>
                    <th>Username</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {adminSummary.recentUserRegistrations.map((u) => (
                    <tr key={u.id}>
                      <td style={{ color: "#38bdf8", fontWeight: "600" }}>{u.name}</td>
                      <td>{u.email}</td>
                      <td>
                        <span className="badge badge-normal" style={{ fontSize: "0.75rem" }}>
                          {u.role}
                        </span>
                      </td>
                      <td style={{ color: "#94a3b8" }}>{u.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Administrative Activities Audit Log */}
          <div className="soc-card">
            <div className="soc-card-header-title">
              <h3 className="section-title">
                <FaHistory style={{ color: "#38bdf8" }} /> Recent Administrative Activities
              </h3>
            </div>
            <div style={{ overflowX: "auto", marginTop: "12px" }}>
              <table className="alerts-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Action</th>
                    <th>Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {adminSummary.recentActivities.map((act) => (
                    <tr key={act.id}>
                      <td style={{ color: "#38bdf8", fontWeight: "600" }}>{act.user}</td>
                      <td>{act.action}</td>
                      <td style={{ color: "#94a3b8" }}>{act.time}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Section 3: Recent Threat / Incident Summary Table */}
        <div className="soc-card full-width-card" style={{ marginTop: "24px" }}>
          <div className="soc-card-header-title">
            <h3 className="section-title">
              <FaShieldAlt style={{ color: "#ef4444" }} /> Recent Threat & Incident Summary
            </h3>
            <span className="live-status-tag">Executive Summary</span>
          </div>

          <div style={{ overflowX: "auto", marginTop: "12px" }}>
            <table className="alerts-table">
              <thead>
                <tr>
                  <th>Incident ID</th>
                  <th>Category</th>
                  <th>Severity</th>
                  <th>Affected Target</th>
                  <th>Time Detected</th>
                </tr>
              </thead>
              <tbody>
                {adminSummary.recentIncidentsSummary.map((inc) => (
                  <tr key={inc.id}>
                    <td style={{ color: "#c084fc", fontWeight: "700", fontFamily: "var(--font-mono)" }}>{inc.id}</td>
                    <td style={{ color: "#f8fafc", fontWeight: "600" }}>{inc.category}</td>
                    <td>
                      <span className={`badge badge-${inc.severity.toLowerCase()}`} style={{ fontSize: "0.75rem" }}>
                        {inc.severity}
                      </span>
                    </td>
                    <td style={{ color: "#38bdf8", fontFamily: "var(--font-mono)" }}>{inc.affectedTarget}</td>
                    <td style={{ color: "#94a3b8" }}>{inc.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 4: System Logs & Telemetry */}
        <div className="soc-card full-width-card" style={{ marginTop: "24px" }}>
          <div className="soc-card-header-title">
            <h3 className="section-title">
              <FaListAlt style={{ color: "#00f2fe" }} /> System Telemetry Logs
            </h3>
          </div>

          <div style={{ overflowX: "auto", marginTop: "12px" }}>
            <table className="alerts-table">
              <thead>
                <tr>
                  <th>Log ID</th>
                  <th>Timestamp</th>
                  <th>Component</th>
                  <th>Level</th>
                  <th>Log Message</th>
                </tr>
              </thead>
              <tbody>
                {adminSummary.systemLogs.map((log) => (
                  <tr key={log.id}>
                    <td>#{log.id}</td>
                    <td style={{ color: "#94a3b8", fontFamily: "var(--font-mono)" }}>{log.timestamp}</td>
                    <td style={{ color: "#c084fc", fontWeight: "600" }}>{log.component}</td>
                    <td>
                      <span className="badge badge-low" style={{ fontSize: "0.72rem" }}>
                        {log.level}
                      </span>
                    </td>
                    <td style={{ color: "#cbd5e1" }}>{log.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* System Monitoring Telemetry Panel */}
        <div style={{ marginTop: "24px" }}>
          <SystemStatusPanel />
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;