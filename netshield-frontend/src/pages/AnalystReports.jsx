import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import { API_BASE_URL } from "../config";
import {
  FaFileDownload,
  FaSearch,
  FaFilter,
  FaFileAlt,
  FaExclamationTriangle,
  FaFilePdf,
  FaFileCsv,
  FaHistory,
  FaShieldAlt,
  FaCheckCircle,
  FaClock,
  FaInfoCircle,
  FaTimes,
  FaPrint,
  FaBrain,
  FaDownload

} from "react-icons/fa";
import "../styles/Dashboard.css";

function AnalystReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [attackTypeFilter, setAttackTypeFilter] = useState("All");
  const [severityFilter, setSeverityFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  // Selected Report Modal
  const [selectedReport, setSelectedReport] = useState(null);

  const fetchThreatReports = async () => {
    setLoading(true);
    try {
      let url = `${API_BASE_URL}/reports`;
      const params = new URLSearchParams();
      if (attackTypeFilter !== "All") params.append("attack_type", attackTypeFilter);
      if (severityFilter !== "All") params.append("severity", severityFilter);
      if (statusFilter !== "All") params.append("status", statusFilter);
      if (searchTerm) params.append("search", searchTerm);
      if (params.toString()) url += `?${params.toString()}`;

      const res = await fetch(url);
      const data = await res.json();
      if (Array.isArray(data)) {
        setReports(data);
      }
    } catch (err) {
      console.error("Error fetching threat intelligence reports:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchThreatReports();
  }, [attackTypeFilter, severityFilter, statusFilter]);

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    fetchThreatReports();
  };

  // Client-Side Real Data CSV Export
  const handleExportCSV = () => {
    if (!filteredReports.length) {
      alert("No report data available to export.");
      return;
    }

    const headers = [
      "Report ID",
      "Incident ID",
      "Alert ID",
      "Attack Type",
      "Threat Severity",
      "Source IP",
      "Destination IP",
      "Protocol",
      "Risk Score",
      "AI Confidence",
      "Incident Status",
      "Detection Timestamp",
      "Investigation Details",
      "Action Taken",
      "Resolution Details"
    ];

    const rows = filteredReports.map((r) => [
      `"${r.report_id || ''}"`,
      `"${r.incident_id || ''}"`,
      `"${r.alert_id || ''}"`,
      `"${r.attack_type || r.attackType || ''}"`,
      `"${r.threat_severity || r.severity || ''}"`,
      `"${r.source_ip || r.sourceIp || ''}"`,
      `"${r.dest_ip || r.destIp || ''}"`,
      `"${r.protocol || 'TCP'}"`,
      `"${r.risk_score || r.riskScore || 70}"`,
      `"${r.confidence || '95.00%'}"`,
      `"${r.incident_status || r.status || 'New'}"`,
      `"${r.detection_timestamp || r.timestamp || ''}"`,
      `"${(r.investigation_details || '').replace(/"/g, '""')}"`,
      `"${(r.action_taken || '').replace(/"/g, '""')}"`,
      `"${(r.resolution_details || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `NetShield_Threat_Intelligence_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Client-Side Real Data JSON Export
  const handleExportJSON = () => {
    if (!filteredReports.length) {
      alert("No report data available to export.");
      return;
    }

    const jsonStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(filteredReports, null, 2));
    const link = document.createElement("a");
    link.setAttribute("href", jsonStr);
    link.setAttribute("download", `NetShield_Threat_Intelligence_Report_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintPDF = () => {
    window.print();
  };

  // Client-side filtering fallback for instant responsiveness
  const filteredReports = reports.filter((rep) => {
    const attackType = (rep.attack_type || rep.attackType || "").toLowerCase();
    const severity = (rep.threat_severity || rep.severity || "").toLowerCase();
    const status = (rep.incident_status || rep.status || "").toLowerCase();
    const alertId = (rep.alert_id || "").toLowerCase();
    const incId = (rep.incident_id || "").toLowerCase();
    const srcIp = (rep.source_ip || rep.sourceIp || "").toLowerCase();
    const dstIp = (rep.dest_ip || rep.destIp || "").toLowerCase();

    const matchesSearch =
      !searchTerm ||
      attackType.includes(searchTerm.toLowerCase()) ||
      alertId.includes(searchTerm.toLowerCase()) ||
      incId.includes(searchTerm.toLowerCase()) ||
      srcIp.includes(searchTerm.toLowerCase()) ||
      dstIp.includes(searchTerm.toLowerCase());

    const matchesAttack = attackTypeFilter === "All" || attackType === attackTypeFilter.toLowerCase();
    const matchesSeverity = severityFilter === "All" || severity === severityFilter.toLowerCase();
    const matchesStatus = statusFilter === "All" || status === statusFilter.toLowerCase();

    return matchesSearch && matchesAttack && matchesSeverity && matchesStatus;
  });

  const getSeverityBadge = (sev) => {
    switch ((sev || "").toLowerCase()) {
      case "critical": return <span className="badge badge-critical">CRITICAL</span>;
      case "high": return <span className="badge badge-high">HIGH</span>;
      case "medium": return <span className="badge badge-medium">MEDIUM</span>;
      case "low": default: return <span className="badge badge-low">LOW</span>;
    }
  };

  const getStatusBadge = (st) => {
    switch ((st || "").toLowerCase()) {
      case "new":
        return <span className="status-badge status-investigating" style={{ background: "rgba(56, 189, 248, 0.2)", color: "#38bdf8", border: "1px solid #38bdf8" }}>New</span>;
      case "investigating":
        return <span className="status-badge status-investigating" style={{ background: "rgba(245, 158, 11, 0.2)", color: "#fbbf24", border: "1px solid #f59e0b" }}>Investigating</span>;
      case "action required":
        return <span className="status-badge status-blocked" style={{ background: "rgba(239, 68, 68, 0.2)", color: "#fca5a5", border: "1px solid #ef4444" }}>Action Required</span>;
      case "resolved":
        return <span className="status-badge status-resolved" style={{ background: "rgba(16, 185, 129, 0.2)", color: "#34d399", border: "1px solid #10b981" }}>Resolved</span>;
      default:
        return <span className="status-badge">{st}</span>;
    }
  };

  // KPI Calculations
  const totalCount = filteredReports.length;
  const criticalHighCount = filteredReports.filter(r => ["critical", "high"].includes((r.threat_severity || r.severity || "").toLowerCase())).length;
  const activeIncidentsCount = filteredReports.filter(r => ["new", "investigating", "action required"].includes((r.incident_status || r.status || "").toLowerCase())).length;
  const resolvedIncidentsCount = filteredReports.filter(r => (r.incident_status || r.status || "").toLowerCase() === "resolved").length;

  return (
    <div className="soc-layout">
      <Sidebar role="Security Analyst" />
      <Topbar title="Threat Intelligence & Security Analytics Reports" />

      <div className="soc-main-content">
        {/* Header */}
        <div className="dashboard-header">
          <div>
            <h1 className="dashboard-title">
              📊 Threat Intelligence Reports
            </h1>
            <p className="dashboard-subtitle">
              Connected Milestone 3 Intelligence Pipeline: AI Detection → Security Alert → Notification → Incident Management → Threat Intelligence Report
            </p>
          </div>

          <div className="action-bar">
            <button onClick={handleExportCSV} className="soc-btn-secondary" title="Download Real Data CSV">
              <FaFileCsv /> Export CSV
            </button>
            <button onClick={handleExportJSON} className="soc-btn-secondary" title="Download Real Data JSON">
              <FaDownload /> Export JSON
            </button>
            <button onClick={handlePrintPDF} className="soc-btn-primary" title="Print Presentation Document">
              <FaPrint /> Print / Save PDF
            </button>
          </div>
        </div>

        {/* Executive Metrics Cards Grid */}
        <div className="soc-grid-4" style={{ marginBottom: "24px" }}>
          <div className="soc-card" style={{ borderColor: "rgba(56, 189, 248, 0.4)" }}>
            <div className="soc-card-title">
              <FaFileAlt style={{ color: "#38bdf8" }} /> Total Threat Reports
            </div>
            <div className="soc-card-value" style={{ color: "#38bdf8" }}>
              {totalCount}
            </div>
            <div className="soc-card-subtext">Connected Database Records</div>
          </div>

          <div className="soc-card" style={{ borderColor: "rgba(239, 68, 68, 0.4)" }}>
            <div className="soc-card-title">
              <FaExclamationTriangle style={{ color: "#ef4444" }} /> Critical / High Threats
            </div>
            <div className="soc-card-value" style={{ color: "#fca5a5" }}>
              {criticalHighCount}
            </div>
            <div className="soc-card-subtext">High Severity Intrusions</div>
          </div>

          <div className="soc-card" style={{ borderColor: "rgba(245, 158, 11, 0.4)" }}>
            <div className="soc-card-title">
              <FaClock style={{ color: "#f59e0b" }} /> Active Incidents
            </div>
            <div className="soc-card-value" style={{ color: "#fbbf24" }}>
              {activeIncidentsCount}
            </div>
            <div className="soc-card-subtext">New / Investigating Queue</div>
          </div>

          <div className="soc-card" style={{ borderColor: "rgba(16, 185, 129, 0.4)" }}>
            <div className="soc-card-title">
              <FaCheckCircle style={{ color: "#10b981" }} /> Resolved Incidents
            </div>
            <div className="soc-card-value" style={{ color: "#34d399" }}>
              {resolvedIncidentsCount}
            </div>
            <div className="soc-card-subtext">Mitigated & Archived</div>
          </div>
        </div>

        {/* Filter Control Bar */}
        <div className="soc-card" style={{ marginBottom: "24px" }}>
          <form onSubmit={handleSearchSubmit} style={{ display: "flex", gap: "14px", flexWrap: "wrap", alignItems: "center" }}>
            {/* Search Input */}
            <div style={{ position: "relative", flex: "1 1 220px", minWidth: "200px" }}>
              <FaSearch style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#64748b" }} />
              <input
                type="text"
                placeholder="Search Alert ID, Incident ID, IP, or attack type..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: "100%",
                  padding: "9px 12px 9px 36px",
                  background: "#0f172a",
                  border: "1px solid #334155",
                  borderRadius: "8px",
                  color: "#f8fafc",
                  fontSize: "0.85rem",
                  outline: "none"
                }}
              />
            </div>

            {/* Attack Type Filter */}
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <FaFilter style={{ color: "#38bdf8" }} />
              <select
                value={attackTypeFilter}
                onChange={(e) => setAttackTypeFilter(e.target.value)}
                style={{
                  padding: "9px 12px",
                  background: "#0f172a",
                  border: "1px solid #334155",
                  borderRadius: "8px",
                  color: "#f8fafc",
                  fontSize: "0.85rem",
                  outline: "none",
                  cursor: "pointer"
                }}
              >
                <option value="All">All Attack Types</option>
                <option value="DoS">DoS</option>
                <option value="Exploits">Exploits</option>
                <option value="Reconnaissance">Reconnaissance</option>
                <option value="Fuzzers">Fuzzers</option>
                <option value="Backdoor">Backdoor</option>
                <option value="Shellcode">Shellcode</option>
                <option value="Generic">Generic</option>
                <option value="Worms">Worms</option>
              </select>
            </div>

            {/* Severity Filter */}
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                style={{
                  padding: "9px 12px",
                  background: "#0f172a",
                  border: "1px solid #334155",
                  borderRadius: "8px",
                  color: "#f8fafc",
                  fontSize: "0.85rem",
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
            </div>

            {/* Incident Status Filter */}
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{
                  padding: "9px 12px",
                  background: "#0f172a",
                  border: "1px solid #334155",
                  borderRadius: "8px",
                  color: "#f8fafc",
                  fontSize: "0.85rem",
                  outline: "none",
                  cursor: "pointer"
                }}
              >
                <option value="All">All Incident Statuses</option>
                <option value="New">New</option>
                <option value="Investigating">Investigating</option>
                <option value="Action Required">Action Required</option>
                <option value="Resolved">Resolved</option>
              </select>
            </div>

            <button type="submit" className="soc-btn-secondary" style={{ padding: "8px 14px", fontSize: "0.85rem" }}>
              Apply Filter
            </button>
          </form>
        </div>

        {/* Threat Intelligence Report Roster Table */}
        <div className="soc-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h3 style={{ fontSize: "1.1rem", color: "#f8fafc", display: "flex", alignItems: "center", gap: "8px", margin: 0 }}>
              <FaShieldAlt style={{ color: "#00f2fe" }} /> Real-Time Threat Intelligence Reports Roster
            </h3>
            <span className="live-status-tag" style={{ background: "rgba(0, 242, 254, 0.15)", color: "#00f2fe", border: "1px solid #00f2fe" }}>
              {filteredReports.length} Reports
            </span>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table className="soc-table">
              <thead>
                <tr>
                  <th>Report & IDs</th>
                  <th>Attack Type</th>
                  <th>Threat Severity</th>
                  <th>Source → Dest IP (Proto)</th>
                  <th>Risk Score</th>
                  <th>AI Confidence</th>
                  <th>Incident Status</th>
                  <th>Detection Time</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="9" style={{ textAlign: "center", padding: "24px", color: "#94a3b8" }}>
                      Loading threat intelligence reports from backend database...
                    </td>
                  </tr>
                ) : filteredReports.length > 0 ? (
                  filteredReports.map((r, idx) => {
                    const alertIdDisplay = r.alert_id || (r.id ? `ALERT-${String(r.id).padStart(4, '0')}` : "ALERT-0000");
                    const incIdDisplay = r.incident_id || (r.id ? `INC-${String(r.id).padStart(4, '0')}` : "INC-0000");
                    const reportIdDisplay = r.report_id || `REP-${incIdDisplay}`;
                    const attackType = r.attack_type || r.attackType || "Anomalous Traffic";
                    const severity = r.threat_severity || r.severity || "High";
                    const riskScore = r.risk_score !== undefined ? r.risk_score : (r.riskScore !== undefined ? r.riskScore : 70);
                    const confidence = r.confidence || "95.00%";
                    const status = r.incident_status || r.status || "New";
                    const timeDisplay = r.detection_timestamp || r.timestamp || "";

                    return (
                      <tr key={r.id || idx}>
                        <td style={{ fontFamily: "var(--font-mono)", fontSize: "0.82rem" }}>
                          <strong style={{ color: "#00f2fe", display: "block" }}>{reportIdDisplay}</strong>
                          <span style={{ color: "#94a3b8", fontSize: "0.75rem" }}>
                            {alertIdDisplay} | {incIdDisplay}
                          </span>
                        </td>
                        <td style={{ fontWeight: "700", color: "#f8fafc" }}>
                          {attackType}
                        </td>
                        <td>
                          {getSeverityBadge(severity)}
                        </td>
                        <td style={{ fontFamily: "var(--font-mono)", fontSize: "0.82rem" }}>
                          <span style={{ color: "#38bdf8" }}>{r.source_ip || r.sourceIp || "192.168.1.100"}</span>
                          <span style={{ color: "#64748b", margin: "0 4px" }}>→</span>
                          <span style={{ color: "#a855f7" }}>{r.dest_ip || r.destIp || "10.0.0.1"}</span>
                          <span style={{ color: "#94a3b8", fontSize: "0.72rem", marginLeft: "4px" }}>({r.protocol || "TCP"})</span>
                        </td>
                        <td style={{ fontFamily: "var(--font-mono)", fontWeight: "700", color: riskScore >= 75 ? "#ef4444" : riskScore >= 45 ? "#f97316" : "#10b981" }}>
                          {riskScore} / 100
                        </td>
                        <td style={{ fontFamily: "var(--font-mono)", color: "#c084fc", fontWeight: "700" }}>
                          {confidence}
                        </td>
                        <td>
                          {getStatusBadge(status)}
                        </td>
                        <td style={{ fontFamily: "var(--font-mono)", color: "#94a3b8", fontSize: "0.82rem" }}>
                          {timeDisplay}
                        </td>
                        <td>
                          <button
                            onClick={() => setSelectedReport(r)}
                            style={{
                              padding: "4px 10px",
                              background: "rgba(0, 242, 254, 0.15)",
                              border: "1px solid #00f2fe",
                              color: "#00f2fe",
                              borderRadius: "6px",
                              fontSize: "0.78rem",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: "4px"
                            }}
                          >
                            <FaInfoCircle /> Full Report
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="9" style={{ textAlign: "center", padding: "28px", color: "#64748b" }}>
                      <FaShieldAlt style={{ fontSize: "1.6rem", marginBottom: "8px", display: "block", margin: "0 auto 8px" }} />
                      No threat intelligence reports found matching the specified filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Full Threat Intelligence Report Presentation Modal */}
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
            <div
              style={{
                background: "#1e293b",
                border: "1px solid #334155",
                borderRadius: "12px",
                width: "100%",
                maxWidth: "800px",
                maxHeight: "90vh",
                overflowY: "auto",
                padding: "28px",
                color: "#f8fafc",
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.85)"
              }}
            >
              {/* Report Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", paddingBottom: "16px", borderBottom: "2px solid #334155", marginBottom: "20px" }}>
                <div>
                  <h2 style={{ fontSize: "1.35rem", margin: 0, color: "#00f2fe", display: "flex", alignItems: "center", gap: "8px" }}>
                    <FaShieldAlt /> Threat Intelligence Report Document
                  </h2>
                  <span style={{ fontSize: "0.85rem", color: "#94a3b8", marginTop: "4px", display: "block" }}>
                    Report Reference: <strong style={{ color: "#38bdf8", fontFamily: "var(--font-mono)" }}>{selectedReport.report_id || `REP-${selectedReport.incident_id}`}</strong> | Generated from NetShield AI Milestone 3 Pipeline
                  </span>
                </div>
                <button
                  onClick={() => setSelectedReport(null)}
                  style={{ background: "none", border: "none", color: "#94a3b8", fontSize: "1.4rem", cursor: "pointer" }}
                >
                  <FaTimes />
                </button>
              </div>

              {/* Document Section 1: Executive Summary */}
              <div style={{ background: "#0f172a", padding: "16px", borderRadius: "8px", border: "1px solid #334155", marginBottom: "20px" }}>
                <h4 style={{ color: "#38bdf8", margin: "0 0 10px 0", fontSize: "0.95rem", display: "flex", alignItems: "center", gap: "6px" }}>
                  <FaBrain /> Executive Summary & Classification
                </h4>
                <p style={{ fontSize: "0.88rem", color: "#cbd5e1", lineHeight: "1.5", margin: 0 }}>
                  {selectedReport.detection_details || `The Random Forest Intrusion Classifier detected a ${selectedReport.attack_type || selectedReport.attackType} security anomaly with a confidence score of ${selectedReport.confidence || '95.00%'}. The threat carries a Risk Score of ${selectedReport.risk_score !== undefined ? selectedReport.risk_score : 70}/100 and has been assigned to the SOC queue.`}
                </p>
              </div>

              {/* Document Section 2: Metadata Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px", background: "#0f172a", padding: "16px", borderRadius: "8px", border: "1px solid #334155", marginBottom: "20px" }}>
                <div>
                  <span style={{ fontSize: "0.78rem", color: "#94a3b8", display: "block" }}>Alert ID</span>
                  <strong style={{ color: "#00f2fe", fontFamily: "var(--font-mono)" }}>{selectedReport.alert_id || "N/A"}</strong>
                </div>
                <div>
                  <span style={{ fontSize: "0.78rem", color: "#94a3b8", display: "block" }}>Incident ID</span>
                  <strong style={{ color: "#38bdf8", fontFamily: "var(--font-mono)" }}>{selectedReport.incident_id || "N/A"}</strong>
                </div>
                <div>
                  <span style={{ fontSize: "0.78rem", color: "#94a3b8", display: "block" }}>Attack Type</span>
                  <strong style={{ color: "#ef4444" }}>{selectedReport.attack_type || selectedReport.attackType}</strong>
                </div>
                <div>
                  <span style={{ fontSize: "0.78rem", color: "#94a3b8", display: "block" }}>Threat Severity</span>
                  {getSeverityBadge(selectedReport.threat_severity || selectedReport.severity)}
                </div>
                <div>
                  <span style={{ fontSize: "0.78rem", color: "#94a3b8", display: "block" }}>Risk Score</span>
                  <strong style={{ color: (selectedReport.risk_score || selectedReport.riskScore) >= 75 ? "#ef4444" : "#f97316" }}>
                    {selectedReport.risk_score !== undefined ? selectedReport.risk_score : selectedReport.riskScore} / 100
                  </strong>
                </div>
                <div>
                  <span style={{ fontSize: "0.78rem", color: "#94a3b8", display: "block" }}>AI Confidence</span>
                  <strong style={{ color: "#c084fc" }}>{selectedReport.confidence || "95.00%"}</strong>
                </div>
                <div>
                  <span style={{ fontSize: "0.78rem", color: "#94a3b8", display: "block" }}>Source IP → Dest IP</span>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.82rem", color: "#38bdf8" }}>
                    {selectedReport.source_ip || selectedReport.sourceIp} → {selectedReport.dest_ip || selectedReport.destIp}
                  </span>
                </div>
                <div>
                  <span style={{ fontSize: "0.78rem", color: "#94a3b8", display: "block" }}>Detection Timestamp</span>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.82rem", color: "#94a3b8" }}>
                    {selectedReport.detection_timestamp || selectedReport.timestamp}
                  </span>
                </div>
                <div>
                  <span style={{ fontSize: "0.78rem", color: "#94a3b8", display: "block" }}>Current Incident Status</span>
                  {getStatusBadge(selectedReport.incident_status || selectedReport.status)}
                </div>
                <div>
                  <span style={{ fontSize: "0.78rem", color: "#94a3b8", display: "block" }}>Assigned SOC Analyst</span>
                  <strong style={{ color: "#34d399", fontSize: "0.88rem" }}>{selectedReport.responsible_user || "Security Analyst"}</strong>
                </div>
              </div>

              {/* Document Section 3: Forensic & Resolution Notes */}
              <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginBottom: "24px" }}>
                <div style={{ background: "#0f172a", padding: "14px", borderRadius: "8px", border: "1px solid #334155" }}>
                  <h4 style={{ color: "#38bdf8", margin: "0 0 6px 0", fontSize: "0.9rem" }}>🔍 Forensic Investigation Details:</h4>
                  <p style={{ fontSize: "0.85rem", color: "#cbd5e1", margin: 0 }}>
                    {selectedReport.investigation_details || "No investigation notes recorded yet. Incident is in triage status."}
                  </p>
                </div>

                <div style={{ background: "#0f172a", padding: "14px", borderRadius: "8px", border: "1px solid #334155" }}>
                  <h4 style={{ color: "#f59e0b", margin: "0 0 6px 0", fontSize: "0.9rem" }}>🛡️ Action Taken (Mitigation & Firewall Rules):</h4>
                  <p style={{ fontSize: "0.85rem", color: "#cbd5e1", margin: 0 }}>
                    {selectedReport.action_taken || "No active firewall block applied yet."}
                  </p>
                </div>

                <div style={{ background: "#0f172a", padding: "14px", borderRadius: "8px", border: "1px solid #334155" }}>
                  <h4 style={{ color: "#10b981", margin: "0 0 6px 0", fontSize: "0.9rem" }}>✅ Resolution Summary & Post-Incident Report:</h4>
                  <p style={{ fontSize: "0.85rem", color: "#cbd5e1", margin: 0 }}>
                    {selectedReport.resolution_details || "Incident has not been marked as resolved yet."}
                  </p>
                </div>
              </div>

              {/* Modal Footer Controls */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", borderTop: "1px solid #334155", paddingTop: "16px" }}>
                <button onClick={() => setSelectedReport(null)} className="soc-btn-secondary">
                  Close
                </button>
                <button onClick={handlePrintPDF} className="soc-btn-primary">
                  <FaPrint /> Print / Save PDF Report
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AnalystReports;
