import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import {
  FaFileDownload,
  FaSearch,
  FaFilter,
  FaFileAlt,
  FaExclamationTriangle,
  FaFilePdf,
  FaFileCsv,
  FaHistory
} from "react-icons/fa";
import "../styles/Dashboard.css";

const baselinePredictionHistory = [
  { id: 1, timestamp: "2026-08-07 19:10:42", prediction: "Anomalous Traffic (DoS)", threatType: "DoS", confidence: "98.42%", riskScore: 90, severity: "Critical", status: "Blocked" },
  { id: 2, timestamp: "2026-08-07 19:08:15", prediction: "Anomalous Traffic (Exploits)", threatType: "Exploits", confidence: "97.80%", riskScore: 75, severity: "High", status: "Investigating" },
  { id: 3, timestamp: "2026-08-07 19:05:44", prediction: "Anomalous Traffic (Fuzzers)", threatType: "Fuzzers", confidence: "95.87%", riskScore: 55, severity: "Medium", status: "Blocked" },
  { id: 4, timestamp: "2026-08-07 19:02:50", prediction: "Anomalous Traffic (Reconnaissance)", threatType: "Reconnaissance", confidence: "94.60%", riskScore: 45, severity: "Medium", status: "Resolved" },
  { id: 5, timestamp: "2026-08-07 18:55:10", prediction: "Normal Traffic", threatType: "Normal", confidence: "99.12%", riskScore: 10, severity: "Low", status: "Normal Flow" },
  { id: 6, timestamp: "2026-08-07 18:40:22", prediction: "Anomalous Traffic (Backdoor)", threatType: "Backdoor", confidence: "98.90%", riskScore: 92, severity: "Critical", status: "Blocked" },
  { id: 7, timestamp: "2026-08-07 18:32:05", prediction: "Anomalous Traffic (Shellcode)", threatType: "Shellcode", confidence: "99.05%", riskScore: 95, severity: "Critical", status: "Blocked" }
];

function AnalystReports() {
  const [reportsData, setReportsData] = useState(baselinePredictionHistory);
  const [searchTerm, setSearchTerm] = useState("");
  const [severityFilter, setSeverityFilter] = useState("All");

  useEffect(() => {
    fetch("http://127.0.0.1:5000/reports")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          const mapped = data.map((item, idx) => ({
            id: idx + 1,
            timestamp: item.timestamp || "2026-08-07 19:00:00",
            prediction: item.prediction || `Anomalous Traffic (${item.attackType || 'Generic'})`,
            threatType: item.attackType || "Generic",
            confidence: item.confidence || "95.87%",
            riskScore: item.riskScore || 70,
            severity: item.severity || "High",
            status: item.status || "Investigating"
          }));
          setReportsData(mapped);
        }
      })
      .catch(() => console.log("Using cached baseline prediction history reports."));
  }, []);

  const filteredReports = reportsData.filter((rep) => {
    const matchesSearch =
      rep.prediction.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rep.threatType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rep.timestamp.includes(searchTerm);

    const matchesSeverity = severityFilter === "All" || rep.severity === severityFilter;

    return matchesSearch && matchesSeverity;
  });

  const handleExportCSV = () => {
    alert("Exporting Prediction History Report as CSV file...");
  };

  const handleExportPDF = () => {
    alert("Exporting Prediction History Report as PDF document...");
  };

  const getSeverityBadge = (sev) => {
    switch (sev.toLowerCase()) {
      case "critical": return <span className="badge badge-critical">Critical</span>;
      case "high": return <span className="badge badge-high">High</span>;
      case "medium": return <span className="badge badge-medium">Medium</span>;
      case "low": default: return <span className="badge badge-low">Low</span>;
    }
  };

  return (
    <div className="soc-layout">
      <Sidebar role="Security Analyst" />
      <Topbar title="Prediction Reports & Threat History" />

      <div className="soc-main-content">
        {/* Header */}
        <div className="dashboard-header">
          <div>
            <h1 className="dashboard-title">
              📋 AI Prediction Reports
            </h1>
            <p className="dashboard-subtitle">
              Historical Random Forest Classifier AI Model Intrusion Predictions, Risk Indexing & Export Hub
            </p>
          </div>

          <div className="action-bar">
            <button onClick={handleExportCSV} className="soc-btn-secondary">
              <FaFileCsv /> Export CSV
            </button>
            <button onClick={handleExportPDF} className="soc-btn-primary">
              <FaFilePdf /> Export PDF
            </button>
          </div>
        </div>

        {/* Filter Control Bar */}
        <div className="soc-card" style={{ marginBottom: "24px" }}>
          <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", alignItems: "center" }}>
            <div style={{ position: "relative", flex: 1, minWidth: "240px" }}>
              <FaSearch style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#64748b" }} />
              <input
                type="text"
                placeholder="Search prediction, threat type, or timestamp..."
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
            </div>
          </div>
        </div>

        {/* Prediction History Table with exact columns */}
        <div className="soc-card">
          <h3 style={{ fontSize: "1.1rem", color: "#f8fafc", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
            <FaHistory style={{ color: "#00f2fe" }} /> AI Prediction History Log
          </h3>

          <table className="soc-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Prediction</th>
                <th>Threat Type</th>
                <th>Confidence</th>
                <th>Risk Score</th>
                <th>Severity</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredReports.map((rep) => (
                <tr key={rep.id}>
                  <td style={{ fontFamily: "var(--font-mono)", color: "#94a3b8" }}>{rep.timestamp}</td>
                  <td style={{ fontWeight: "600", color: rep.prediction.includes("Normal") ? "#6ee7b7" : "#fca5a5" }}>
                    {rep.prediction}
                  </td>
                  <td style={{ fontWeight: "600", color: "#38bdf8" }}>{rep.threatType}</td>
                  <td style={{ fontFamily: "var(--font-mono)", color: "#c084fc", fontWeight: "700" }}>{rep.confidence}</td>
                  <td style={{ fontFamily: "var(--font-mono)", fontWeight: "700", color: rep.riskScore > 70 ? "#ef4444" : rep.riskScore > 40 ? "#f97316" : "#10b981" }}>
                    {rep.riskScore} / 100
                  </td>
                  <td>{getSeverityBadge(rep.severity)}</td>
                  <td>
                    <span style={{ color: rep.status === "Blocked" ? "#ef4444" : rep.status === "Normal Flow" ? "#34d399" : "#fbbf24", fontWeight: "600" }}>
                      {rep.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default AnalystReports;
