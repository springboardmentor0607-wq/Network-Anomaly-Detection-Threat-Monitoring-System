import { useState } from "react";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import ThreatCategoryBarChart from "../components/ThreatCategoryBarChart";
import AlertsTable from "../components/AlertsTable";
import {
  FaShieldAlt,
  FaExclamationTriangle,
  FaSkullCrossbones,
  FaCheckCircle,
  FaSearch,
  FaFilter,
  FaBrain
} from "react-icons/fa";
import "../styles/Dashboard.css";

const threatTaxonomy = [
  { name: "Normal Traffic", category: "Normal", severity: "Low", baseRisk: 10, confidence: "99.4%", attackCount: 142100, description: "Benign legitimate user network packets and HTTP/TCP streams." },
  { name: "Denial of Service", category: "DoS", severity: "Critical", baseRisk: 90, confidence: "98.2%", attackCount: 8950, description: "Flooding attack attempting to exhaust target system bandwidth or socket resources." },
  { name: "Reconnaissance", category: "Reconnaissance", severity: "Medium", baseRisk: 45, confidence: "96.5%", attackCount: 3210, description: "Port scanning, IP sweeps, and vulnerability probing activity." },
  { name: "Fuzzers", category: "Fuzzers", severity: "Medium", baseRisk: 55, confidence: "95.8%", attackCount: 5410, description: "Automated injection of random invalid data payloads to discover software bugs." },
  { name: "Exploits", category: "Exploits", severity: "High", baseRisk: 75, confidence: "97.4%", attackCount: 7820, description: "Known vulnerability exploit payloads targeting unpatched services." },
  { name: "Backdoor", category: "Backdoor", severity: "Critical", baseRisk: 92, confidence: "98.9%", attackCount: 1720, description: "Stealthy remote access Trojan payload attempting unauthorized persistence." },
  { name: "Shellcode", category: "Shellcode", severity: "Critical", baseRisk: 95, confidence: "99.1%", attackCount: 1450, description: "Executable binary code payloads designed to spawn command shells." },
  { name: "Generic Attacks", category: "Generic", severity: "High", baseRisk: 70, confidence: "96.2%", attackCount: 9150, description: "Cryptographic hash technique generic malicious traffic patterns." },
  { name: "Worms", category: "Worms", severity: "Critical", baseRisk: 98, confidence: "99.5%", attackCount: 480, description: "Self-replicating malware seeking lateral network propagation." }
];

function ThreatDetection() {
  const [searchTerm, setSearchTerm] = useState("");
  const [severityFilter, setSeverityFilter] = useState("All");

  const filteredTaxonomy = threatTaxonomy.filter((t) => {
    const matchesSearch =
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesSeverity = severityFilter === "All" || t.severity === severityFilter;

    return matchesSearch && matchesSeverity;
  });

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
      <Topbar title="AI Threat Classification & Taxonomy Engine" />

      <div className="soc-main-content">
        {/* Header */}
        <div className="dashboard-header">
          <div>
            <h1 className="dashboard-title">
              ⚠️ AI Threat Classification
            </h1>
            <p className="dashboard-subtitle">
              Automated Random Forest Machine Learning Classification Across 9 UNSW-NB15 Attack Categories, Severity Metrics & Risk Scores
            </p>
          </div>
        </div>

        {/* 9 Category Overview Grid Cards */}
        <div style={{ marginBottom: "24px" }}>
          <h3 style={{ fontSize: "1.1rem", color: "#f8fafc", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
            <FaBrain style={{ color: "#00f2fe" }} /> 9-Class Threat Taxonomy Overview
          </h3>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "16px" }}>
            {threatTaxonomy.map((item, idx) => (
              <div key={idx} className="soc-card" style={{ borderColor: item.severity === "Critical" ? "rgba(239, 68, 68, 0.4)" : item.severity === "High" ? "rgba(249, 115, 22, 0.4)" : item.severity === "Medium" ? "rgba(245, 158, 11, 0.4)" : "rgba(16, 185, 129, 0.4)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <span style={{ fontWeight: "700", color: "#f8fafc", fontSize: "1.05rem" }}>{item.category}</span>
                  {getSeverityBadge(item.severity)}
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginTop: "10px" }}>
                  <span style={{ fontSize: "1.4rem", fontWeight: "700", fontFamily: "var(--font-mono)", color: item.severity === "Critical" ? "#fca5a5" : item.severity === "High" ? "#fdba74" : item.severity === "Medium" ? "#fde047" : "#6ee7b7" }}>
                    {item.attackCount.toLocaleString()}
                  </span>
                  <span style={{ fontSize: "0.85rem", color: "#94a3b8" }}>Occurrences</span>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem", color: "#cbd5e1", marginTop: "10px", paddingTop: "8px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                  <span>AI Confidence: <strong style={{ color: "#c084fc" }}>{item.confidence}</strong></span>
                  <span>Risk Score: <strong style={{ color: "#ef4444" }}>{item.baseRisk}/100</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Threat Distribution Visual Bar Chart */}
        <div className="soc-card" style={{ marginBottom: "24px" }}>
          <div className="soc-card-header-title">
            <h3 className="section-title">
              <FaShieldAlt style={{ color: "#f97316" }} /> Attack Count Distribution Across Classified Categories
            </h3>
          </div>
          <ThreatCategoryBarChart />
        </div>

        {/* Detailed Threat Classification Table with Search and Filters */}
        <div className="soc-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "12px" }}>
            <h3 style={{ fontSize: "1.1rem", color: "#f8fafc", display: "flex", alignItems: "center", gap: "8px" }}>
              <FaExclamationTriangle style={{ color: "#ef4444" }} /> Detailed Threat Classification Matrix
            </h3>

            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
              <div style={{ position: "relative", minWidth: "220px" }}>
                <FaSearch style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#64748b" }} />
                <input
                  type="text"
                  placeholder="Search threat category..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 12px 8px 36px",
                    background: "#0f172a",
                    border: "1px solid #334155",
                    borderRadius: "8px",
                    color: "#f8fafc",
                    fontSize: "0.85rem",
                    outline: "none"
                  }}
                />
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <FaFilter style={{ color: "#38bdf8" }} />
                <select
                  value={severityFilter}
                  onChange={(e) => setSeverityFilter(e.target.value)}
                  style={{
                    padding: "8px 12px",
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
            </div>
          </div>

          <table className="soc-table">
            <thead>
              <tr>
                <th>Attack Category</th>
                <th>Threat Severity</th>
                <th>AI Confidence Score</th>
                <th>Risk Score</th>
                <th>Recorded Attack Count</th>
                <th>Category Description</th>
              </tr>
            </thead>
            <tbody>
              {filteredTaxonomy.map((row, idx) => (
                <tr key={idx}>
                  <td style={{ fontWeight: "700", color: "#38bdf8" }}>{row.category}</td>
                  <td>{getSeverityBadge(row.severity)}</td>
                  <td style={{ fontFamily: "var(--font-mono)", color: "#c084fc", fontWeight: "700" }}>{row.confidence}</td>
                  <td style={{ fontFamily: "var(--font-mono)", color: row.baseRisk > 70 ? "#ef4444" : row.baseRisk > 40 ? "#f97316" : "#10b981", fontWeight: "700" }}>
                    {row.baseRisk} / 100
                  </td>
                  <td style={{ fontFamily: "var(--font-mono)", fontWeight: "600", color: "#f8fafc" }}>{row.attackCount.toLocaleString()}</td>
                  <td style={{ color: "#94a3b8", fontSize: "0.85rem" }}>{row.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default ThreatDetection;
