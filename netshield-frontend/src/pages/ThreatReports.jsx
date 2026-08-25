import { useState } from "react";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import {
  FaFileDownload,
  FaSearch,
  FaFilter,
  FaShieldAlt,
  FaExclamationTriangle,
  FaFileAlt
} from "react-icons/fa";
import "../styles/Dashboard.css";

const adminThreatReportsList = [
  { id: 1, attackType: "DoS", confidence: "98.42%", riskScore: 90, threatLevel: "Critical", prediction: "Anomalous Traffic (DoS)", status: "Blocked" },
  { id: 2, attackType: "Exploits", confidence: "97.80%", riskScore: 75, threatLevel: "High", prediction: "Anomalous Traffic (Exploits)", status: "Investigating" },
  { id: 3, attackType: "Fuzzers", confidence: "95.87%", riskScore: 55, threatLevel: "Medium", prediction: "Anomalous Traffic (Fuzzers)", status: "Blocked" },
  { id: 4, attackType: "Reconnaissance", confidence: "94.60%", riskScore: 45, threatLevel: "Medium", prediction: "Anomalous Traffic (Reconnaissance)", status: "Resolved" },
  { id: 5, attackType: "Backdoor", confidence: "98.90%", riskScore: 92, threatLevel: "Critical", prediction: "Anomalous Traffic (Backdoor)", status: "Blocked" },
  { id: 6, attackType: "Shellcode", confidence: "99.05%", riskScore: 95, threatLevel: "Critical", prediction: "Anomalous Traffic (Shellcode)", status: "Blocked" },
  { id: 7, attackType: "Generic", confidence: "96.20%", riskScore: 70, threatLevel: "High", prediction: "Anomalous Traffic (Generic)", status: "Investigating" },
  { id: 8, attackType: "Worms", confidence: "99.50%", riskScore: 98, threatLevel: "Critical", prediction: "Anomalous Traffic (Worms)", status: "Blocked" }
];

function ThreatReports() {
  const [searchTerm, setSearchTerm] = useState("");
  const [levelFilter, setLevelFilter] = useState("All");

  const filteredReports = adminThreatReportsList.filter((rep) => {
    const matchesSearch =
      rep.attackType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rep.prediction.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesLevel = levelFilter === "All" || rep.threatLevel === levelFilter;

    return matchesSearch && matchesLevel;
  });

  const handleExportReport = () => {
    alert("Exporting Executive Administrator Threat & Compliance Report (PDF/CSV)...");
  };

  const getThreatBadge = (level) => {
    switch (level.toLowerCase()) {
      case "critical": return <span className="badge badge-critical">Critical</span>;
      case "high": return <span className="badge badge-high">High</span>;
      case "medium": return <span className="badge badge-medium">Medium</span>;
      case "low": default: return <span className="badge badge-low">Low</span>;
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
              Executive Intrusion Summaries, AI Model Risk Evaluations & Compliance Reports
            </p>
          </div>

          <button onClick={handleExportReport} className="soc-btn-primary">
            <FaFileDownload /> Export Report
          </button>
        </div>

        {/* Filter Bar */}
        <div className="soc-card" style={{ marginBottom: "24px" }}>
          <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", alignItems: "center" }}>
            <div style={{ position: "relative", flex: 1, minWidth: "240px" }}>
              <FaSearch style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#64748b" }} />
              <input
                type="text"
                placeholder="Search attack type or prediction..."
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

        {/* Table with exact required columns: Attack Type, Confidence, Risk Score, Threat Level, Prediction, Status */}
        <div className="soc-card">
          <h3 style={{ fontSize: "1.1rem", color: "#f8fafc", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
            <FaShieldAlt style={{ color: "#00f2fe" }} /> Administrator Threat Intelligence Roster
          </h3>

          <table className="soc-table">
            <thead>
              <tr>
                <th>Attack Type</th>
                <th>Confidence</th>
                <th>Risk Score</th>
                <th>Threat Level</th>
                <th>Prediction</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredReports.map((rep) => (
                <tr key={rep.id}>
                  <td style={{ fontWeight: "700", color: "#38bdf8" }}>{rep.attackType}</td>
                  <td style={{ fontFamily: "var(--font-mono)", color: "#c084fc", fontWeight: "700" }}>{rep.confidence}</td>
                  <td style={{ fontFamily: "var(--font-mono)", fontWeight: "700", color: rep.riskScore > 70 ? "#ef4444" : rep.riskScore > 40 ? "#f97316" : "#10b981" }}>
                    {rep.riskScore} / 100
                  </td>
                  <td>{getThreatBadge(rep.threatLevel)}</td>
                  <td style={{ fontWeight: "600", color: "#f8fafc" }}>{rep.prediction}</td>
                  <td>
                    <span style={{ color: rep.status === "Blocked" ? "#ef4444" : "#fbbf24", fontWeight: "600" }}>
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

export default ThreatReports;
