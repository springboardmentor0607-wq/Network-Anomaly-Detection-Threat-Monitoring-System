import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import { API_BASE_URL } from "../config";
import {
  FaFileDownload,
  FaSearch,
  FaFilter,
  FaShieldAlt,
  FaExclamationTriangle,
  FaFileAlt,
  FaFileCsv,
  FaDownload,
  FaPrint,
  FaInfoCircle,
  FaTimes
} from "react-icons/fa";
import "../styles/Dashboard.css";

function ThreatReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [levelFilter, setLevelFilter] = useState("All");
  const [selectedReport, setSelectedReport] = useState(null);

  const fetchReports = async () => {
    setLoading(true);
    try {
      let url = `${API_BASE_URL}/reports`;
      if (levelFilter !== "All") url += `?severity=${levelFilter}`;
      const res = await fetch(url);

      const data = await res.json();
      if (Array.isArray(data)) {
        setReports(data);
      }
    } catch (err) {
      console.error("Error fetching admin threat reports:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [levelFilter]);

  const filteredReports = reports.filter((rep) => {
    const attackType = (rep.attack_type || rep.attackType || "").toLowerCase();
    const severity = (rep.threat_severity || rep.severity || "").toLowerCase();
    const alertId = (rep.alert_id || "").toLowerCase();
    const incId = (rep.incident_id || "").toLowerCase();
    const srcIp = (rep.source_ip || rep.sourceIp || "").toLowerCase();

    const matchesSearch =
      !searchTerm ||
      attackType.includes(searchTerm.toLowerCase()) ||
      alertId.includes(searchTerm.toLowerCase()) ||
      incId.includes(searchTerm.toLowerCase()) ||
      srcIp.includes(searchTerm.toLowerCase());

    const matchesLevel = levelFilter === "All" || severity === levelFilter.toLowerCase();

    return matchesSearch && matchesLevel;
  });

  const handleExportCSV = () => {
    if (!filteredReports.length) {
      alert("No threat report data available to export.");
      return;
    }
    const headers = ["Report ID", "Incident ID", "Alert ID", "Attack Type", "Severity", "Source IP", "Dest IP", "Risk Score", "Confidence", "Status", "Detection Time"];
    const rows = filteredReports.map((r) => [
      `"${r.report_id || ''}"`,
      `"${r.incident_id || ''}"`,
      `"${r.alert_id || ''}"`,
      `"${r.attack_type || r.attackType || ''}"`,
      `"${r.threat_severity || r.severity || ''}"`,
      `"${r.source_ip || r.sourceIp || ''}"`,
      `"${r.dest_ip || r.destIp || ''}"`,
      `"${r.risk_score || r.riskScore || 70}"`,
      `"${r.confidence || '95.00%'}"`,
      `"${r.incident_status || r.status || 'New'}"`,
      `"${r.detection_timestamp || r.timestamp || ''}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `NetShield_Admin_Threat_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getThreatBadge = (level) => {
    switch ((level || "").toLowerCase()) {
      case "critical": return <span className="badge badge-critical">CRITICAL</span>;
      case "high": return <span className="badge badge-high">HIGH</span>;
      case "medium": return <span className="badge badge-medium">MEDIUM</span>;
      case "low": default: return <span className="badge badge-low">LOW</span>;
    }
  };

  return (
    <div className="soc-layout">
      <Sidebar role="Security Administrator" />
      <Topbar title="Administrator Threat Reports & Executive Summary" />

      <div className="soc-main-content">
        {/* Header */}
        <div className="dashboard-header">
          <div>
            <h1 className="dashboard-title">
              📑 Administrator Threat Reports
            </h1>
            <p className="dashboard-subtitle">
              Executive Threat Intelligence Summaries, Connected Milestone 3 Database Records & Compliance Export
            </p>
          </div>

          <div className="action-bar">
            <button onClick={handleExportCSV} className="soc-btn-secondary">
              <FaFileCsv /> Export CSV
            </button>
            <button onClick={() => window.print()} className="soc-btn-primary">
              <FaPrint /> Print / Save PDF
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="soc-card" style={{ marginBottom: "24px" }}>
          <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", alignItems: "center" }}>
            <div style={{ position: "relative", flex: 1, minWidth: "240px" }}>
              <FaSearch style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#64748b" }} />
              <input
                type="text"
                placeholder="Search attack type, ID, or IP..."
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
                value={levelFilter}
                onChange={(e) => setLevelFilter(e.target.value)}
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
                <option value="All">All Threat Levels</option>
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="soc-card">
          <h3 style={{ fontSize: "1.1rem", color: "#f8fafc", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
            <FaShieldAlt style={{ color: "#00f2fe" }} /> Administrator Threat Intelligence Roster
          </h3>

          <table className="soc-table">
            <thead>
              <tr>
                <th>Report & IDs</th>
                <th>Attack Type</th>
                <th>Threat Level</th>
                <th>Source → Dest IP</th>
                <th>AI Confidence</th>
                <th>Risk Score</th>
                <th>Incident Status</th>
                <th>Detection Time</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: "center", padding: "24px", color: "#94a3b8" }}>
                    Loading threat intelligence reports...
                  </td>
                </tr>
              ) : filteredReports.length > 0 ? (
                filteredReports.map((rep, idx) => (
                  <tr key={rep.id || idx}>
                    <td style={{ fontFamily: "var(--font-mono)", fontSize: "0.82rem" }}>
                      <strong style={{ color: "#00f2fe" }}>{rep.report_id || `REP-${rep.incident_id || rep.id}`}</strong>
                      <span style={{ color: "#94a3b8", display: "block", fontSize: "0.75rem" }}>
                        {rep.alert_id || "ALERT-0000"} | {rep.incident_id || "INC-0000"}
                      </span>
                    </td>
                    <td style={{ fontWeight: "700", color: "#f8fafc" }}>{rep.attack_type || rep.attackType}</td>
                    <td>{getThreatBadge(rep.threat_severity || rep.severity)}</td>
                    <td style={{ fontFamily: "var(--font-mono)", fontSize: "0.82rem" }}>
                      <span style={{ color: "#38bdf8" }}>{rep.source_ip || rep.sourceIp || "192.168.1.100"}</span>
                      <span style={{ color: "#64748b", margin: "0 4px" }}>→</span>
                      <span style={{ color: "#a855f7" }}>{rep.dest_ip || rep.destIp || "10.0.0.1"}</span>
                    </td>
                    <td style={{ fontFamily: "var(--font-mono)", color: "#c084fc", fontWeight: "700" }}>{rep.confidence || "95.00%"}</td>
                    <td style={{ fontFamily: "var(--font-mono)", fontWeight: "700", color: (rep.risk_score || rep.riskScore) >= 75 ? "#ef4444" : "#f97316" }}>
                      {rep.risk_score !== undefined ? rep.risk_score : rep.riskScore} / 100
                    </td>
                    <td>
                      <span style={{ color: (rep.incident_status || rep.status) === "Resolved" ? "#34d399" : "#fbbf24", fontWeight: "600" }}>
                        {rep.incident_status || rep.status}
                      </span>
                    </td>
                    <td style={{ fontFamily: "var(--font-mono)", color: "#94a3b8", fontSize: "0.82rem" }}>
                      {rep.detection_timestamp || rep.timestamp}
                    </td>
                    <td>
                      <button
                        onClick={() => setSelectedReport(rep)}
                        style={{
                          padding: "4px 10px",
                          background: "rgba(0, 242, 254, 0.15)",
                          border: "1px solid #00f2fe",
                          color: "#00f2fe",
                          borderRadius: "6px",
                          fontSize: "0.78rem",
                          cursor: "pointer"
                        }}
                      >
                        <FaInfoCircle /> Details
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9" style={{ textAlign: "center", padding: "28px", color: "#64748b" }}>
                    No threat reports match the criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Modal Drawer */}
        {selectedReport && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(15, 23, 42, 0.9)",
              backdropFilter: "blur(6px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 99999,
              padding: "20px"
            }}
          >
            <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: "12px", width: "100%", maxWidth: "720px", maxHeight: "88vh", overflowY: "auto", padding: "24px", color: "#f8fafc" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #334155", paddingBottom: "12px", marginBottom: "16px" }}>
                <h3 style={{ margin: 0, color: "#00f2fe" }}>Executive Threat Report Detail ({selectedReport.report_id || selectedReport.incident_id})</h3>
                <button onClick={() => setSelectedReport(null)} style={{ background: "none", border: "none", color: "#94a3b8", fontSize: "1.3rem", cursor: "pointer" }}><FaTimes /></button>
              </div>

              <div style={{ background: "#0f172a", padding: "16px", borderRadius: "8px", marginBottom: "16px" }}>
                <p style={{ margin: 0, fontSize: "0.9rem", color: "#cbd5e1" }}>
                  {selectedReport.detection_details || `Random Forest AI detected ${selectedReport.attack_type || selectedReport.attackType} from ${selectedReport.source_ip || selectedReport.sourceIp} targeting ${selectedReport.dest_ip || selectedReport.destIp}.`}
                </p>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", fontSize: "0.85rem", background: "#0f172a", padding: "14px", borderRadius: "8px" }}>
                <div>Alert ID: <strong style={{ color: "#00f2fe" }}>{selectedReport.alert_id}</strong></div>
                <div>Incident ID: <strong style={{ color: "#38bdf8" }}>{selectedReport.incident_id}</strong></div>
                <div>Attack Type: <strong style={{ color: "#ef4444" }}>{selectedReport.attack_type || selectedReport.attackType}</strong></div>
                <div>Risk Score: <strong>{selectedReport.risk_score || selectedReport.riskScore}/100</strong></div>
                <div>AI Confidence: <strong style={{ color: "#c084fc" }}>{selectedReport.confidence}</strong></div>
                <div>Status: <strong style={{ color: "#34d399" }}>{selectedReport.incident_status || selectedReport.status}</strong></div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "20px" }}>
                <button onClick={() => setSelectedReport(null)} className="soc-btn-secondary">Close</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ThreatReports;
