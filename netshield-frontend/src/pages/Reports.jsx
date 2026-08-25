import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import {
  FaFileDownload,
  FaSearch,
  FaFilter,
  FaFileAlt,
  FaExclamationTriangle
} from "react-icons/fa";
import "../styles/Dashboard.css";

const defaultReports = [
  { id: "REP-9021", attackType: "DDoS SYN Flood", severity: "Critical", srcIp: "192.168.1.104", dstIp: "10.0.0.1", timestamp: "2026-07-29 18:04:12", status: "Closed" },
  { id: "REP-9020", attackType: "Port Scan (Nmap -sS)", severity: "High", srcIp: "172.16.0.45", dstIp: "10.0.0.5", timestamp: "2026-07-29 17:58:30", status: "Investigating" },
  { id: "REP-9019", attackType: "SSH Brute Force", severity: "High", srcIp: "185.220.101.5", dstIp: "10.0.0.12", timestamp: "2026-07-29 17:45:18", status: "Blocked" },
  { id: "REP-9018", attackType: "SQL Injection Probe", severity: "Medium", srcIp: "45.33.32.156", dstIp: "10.0.0.8", timestamp: "2026-07-29 17:30:05", status: "Mitigated" },
  { id: "REP-9017", attackType: "Reconnaissance Probe", severity: "Medium", srcIp: "192.168.1.210", dstIp: "8.8.8.8", timestamp: "2026-07-29 17:12:44", status: "Closed" }
];

function Reports() {
  const [searchTerm, setSearchTerm] = useState("");
  const [severityFilter, setSeverityFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [reportsList, setReportsList] = useState(defaultReports);

  useEffect(() => {
    fetch("http://127.0.0.1:5000/reports")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setReportsList(data);
        }
      })
      .catch(() => console.log("Backend offline, showing cached reports."));
  }, []);

  const filteredReports = reportsList.filter((rep) => {
    const matchesSearch =
      (rep.id && rep.id.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (rep.attackType && rep.attackType.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (rep.srcIp && rep.srcIp.includes(searchTerm)) ||
      (rep.dstIp && rep.dstIp.includes(searchTerm));

    const matchesSeverity = severityFilter === "All" || rep.severity === severityFilter;
    const matchesStatus = statusFilter === "All" || rep.status === statusFilter;

    return matchesSearch && matchesSeverity && matchesStatus;
  });

  const handleExport = () => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      ["Report ID,Attack Type,Severity,Source IP,Destination IP,Timestamp,Status"]
        .concat(
          filteredReports.map(
            (r) => `${r.id},"${r.attackType}",${r.severity},${r.srcIp},${r.dstIp},${r.timestamp},${r.status}`
          )
        )
        .join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `NetShield_Threat_Report_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getSeverityBadgeClass = (severity) => {
    const s = (severity || "").toLowerCase();
    switch (s) {
      case "critical": return "badge badge-critical";
      case "high": return "badge badge-high";
      case "medium": return "badge badge-medium";
      case "low": return "badge badge-low";
      default: return "badge badge-normal";
    }
  };

  return (
    <div className="soc-layout">
      <Sidebar />
      <Topbar title="Security Incident & Threat Reports" />

      <div className="soc-main-content">
        <div className="dashboard-header">
          <div>
            <h1 className="dashboard-title">
              📋 Threat Incident Reports
            </h1>
            <p className="dashboard-subtitle">
              Audit-Ready Security Reports, Incident Logs & Forensic Export Center
            </p>
          </div>

          <button onClick={handleExport} className="soc-btn-primary">
            <FaFileDownload /> Export Incident Report
          </button>
        </div>

        {/* Search & Filtering Control Bar */}
        <div className="soc-card" style={{ marginBottom: "24px" }}>
          <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", alignItems: "center" }}>
            <div style={{ position: "relative", flex: 1, minWidth: "240px" }}>
              <FaSearch style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#64748b" }} />
              <input
                type="text"
                placeholder="Search report ID, attack type, or IP address..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 14px 10px 40px",
                  background: "#1e293b",
                  border: "1px solid #334155",
                  borderRadius: "8px",
                  color: "#f8fafc",
                  fontSize: "0.9rem",
                  outline: "none"
                }}
              />
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <FaFilter style={{ color: "#38bdf8" }} />
              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                style={{
                  padding: "10px 14px",
                  background: "#1e293b",
                  border: "1px solid #334155",
                  borderRadius: "8px",
                  color: "#f8fafc",
                  fontSize: "0.9rem",
                  outline: "none",
                  cursor: "pointer"
                }}
              >
                <option value="All">All Severities</option>
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{
                  padding: "10px 14px",
                  background: "#1e293b",
                  border: "1px solid #334155",
                  borderRadius: "8px",
                  color: "#f8fafc",
                  fontSize: "0.9rem",
                  outline: "none",
                  cursor: "pointer"
                }}
              >
                <option value="All">All Statuses</option>
                <option value="Closed">Closed</option>
                <option value="Mitigated">Mitigated</option>
                <option value="Investigating">Investigating</option>
                <option value="Blocked">Blocked</option>
              </select>
            </div>
          </div>
        </div>

        {/* Reports Table */}
        <div className="soc-card">
          <table className="soc-table">
            <thead>
              <tr>
                <th>Report ID</th>
                <th>Attack Type</th>
                <th>Severity</th>
                <th>Source IP</th>
                <th>Destination IP</th>
                <th>Timestamp</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredReports.length > 0 ? (
                filteredReports.map((rep) => (
                  <tr key={rep.id}>
                    <td style={{ fontFamily: "var(--font-mono)", fontWeight: "700", color: "#38bdf8" }}>{rep.id}</td>
                    <td style={{ fontWeight: "600", color: "#f8fafc" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <FaExclamationTriangle style={{ color: rep.severity === "Critical" ? "#ef4444" : "#f59e0b", fontSize: "0.85rem" }} />
                        {rep.attackType}
                      </div>
                    </td>
                    <td>
                      <span className={getSeverityBadgeClass(rep.severity)}>
                        {rep.severity}
                      </span>
                    </td>
                    <td style={{ fontFamily: "var(--font-mono)", color: "#38bdf8" }}>{rep.srcIp}</td>
                    <td style={{ fontFamily: "var(--font-mono)", color: "#cbd5e1" }}>{rep.dstIp}</td>
                    <td style={{ fontFamily: "var(--font-mono)", color: "#94a3b8" }}>{rep.timestamp}</td>
                    <td>
                      <span style={{ color: rep.status === "Closed" || rep.status === "Mitigated" ? "#34d399" : "#fbbf24", fontWeight: "600" }}>
                        {rep.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" style={{ textAlign: "center", padding: "24px", color: "#64748b" }}>
                    <FaFileAlt style={{ fontSize: "1.5rem", marginBottom: "8px", display: "block", margin: "0 auto 8px" }} />
                    No threat report entries found matching your query.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Reports;
