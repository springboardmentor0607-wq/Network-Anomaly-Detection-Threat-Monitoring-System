import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import LineChart from "../components/LineChart";
import PieChart from "../components/PieChart";
import {
  FaChartBar,
  FaShieldAlt,
  FaBullseye,
  FaExclamationTriangle,
  FaCheckCircle,
  FaBrain,
  FaGlobe,
  FaChartPie
} from "react-icons/fa";
import "../styles/Dashboard.css";

const attackVectorData = [
  { name: "DDoS Flood", value: 38, color: "#ef4444" },
  { name: "Port Scanning", value: 24, color: "#f59e0b" },
  { name: "Brute Force", value: 18, color: "#f97316" },
  { name: "SQL Injection", value: 12, color: "#3b82f6" },
  { name: "Web Exploits", value: 8, color: "#a855f7" }
];

const topAttackOrigins = [
  { country: "United States", ipRange: "185.220.x.x", count: 412, risk: "High", share: "33.2%" },
  { country: "China", ipRange: "220.181.x.x", count: 328, risk: "Critical", share: "26.4%" },
  { country: "Russia", ipRange: "94.102.x.x", count: 215, risk: "High", share: "17.3%" },
  { country: "Germany", ipRange: "45.33.x.x", count: 160, risk: "Medium", share: "12.9%" },
  { country: "Netherlands", ipRange: "194.26.x.x", count: 125, risk: "Medium", share: "10.2%" }
];

function SecurityAnalytics() {
  return (
    <div className="soc-layout">
      <Sidebar role="Security Administrator" />
      <Topbar title="Security Analytics & Threat Intelligence" />

      <div className="soc-main-content">
        <div className="dashboard-header">
          <div>
            <h1 className="dashboard-title">
              📊 Security Analytics
            </h1>
            <p className="dashboard-subtitle">
              Deep-Dive Machine Learning Threat Models, Attack Vector Metrics & Risk Indexing
            </p>
          </div>
        </div>

        {/* Security KPI Cards */}
        <div className="soc-grid-4">
          <div className="soc-card">
            <div className="soc-card-title">
              <FaBullseye style={{ color: "#38bdf8" }} /> Detection Accuracy
            </div>
            <div className="soc-card-value" style={{ color: "#38bdf8" }}>
              99.4%
            </div>
            <div className="soc-card-subtext">AI Threat Engine Accuracy Rate</div>
          </div>

          <div className="soc-card">
            <div className="soc-card-title">
              <FaShieldAlt style={{ color: "#10b981" }} /> Overall Risk Score
            </div>
            <div className="soc-card-value" style={{ color: "#34d399" }}>
              24 / 100
            </div>
            <div className="soc-card-subtext">Low Risk (Enforced State)</div>
          </div>

          <div className="soc-card">
            <div className="soc-card-title">
              <FaExclamationTriangle style={{ color: "#f59e0b" }} /> Weekly Attack Events
            </div>
            <div className="soc-card-value" style={{ color: "#fbbf24" }}>
              3,480
            </div>
            <div className="soc-card-subtext">Analyzed Security Packets</div>
          </div>

          <div className="soc-card">
            <div className="soc-card-title">
              <FaBrain style={{ color: "#c084fc" }} /> ML Model Precision
            </div>
            <div className="soc-card-value" style={{ color: "#c084fc" }}>
              99.1%
            </div>
            <div className="soc-card-subtext">False Positive Rate: 0.6%</div>
          </div>
        </div>

        {/* Weekly Attack Analysis: Pie Chart & Line Chart */}
        <div className="soc-grid-2">
          {/* Pie Chart Card */}
          <div className="soc-card">
            <h3 style={{ fontSize: "1.1rem", color: "#f8fafc", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
              <FaChartPie style={{ color: "#00f2fe" }} /> Attack Vector Breakdown (Weekly)
            </h3>
            <PieChart data={attackVectorData} height={310} />
          </div>

          {/* Line Chart Card */}
          <div className="soc-card">
            <h3 style={{ fontSize: "1.1rem", color: "#f8fafc", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
              <FaChartBar style={{ color: "#38bdf8" }} /> Weekly Attack Trend & Threat Volume
            </h3>
            <LineChart />
          </div>
        </div>

        {/* Top Attack Origins Breakdown Table */}
        <div className="soc-card">
          <h3 style={{ fontSize: "1.1rem", color: "#f8fafc", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
            <FaGlobe style={{ color: "#60a5fa" }} /> Top Geographic Attack Sources
          </h3>

          <table className="soc-table">
            <thead>
              <tr>
                <th>Country of Origin</th>
                <th>Subnet Prefix</th>
                <th>Recorded Incidents</th>
                <th>Threat Level</th>
                <th>Total Volume Share</th>
              </tr>
            </thead>
            <tbody>
              {topAttackOrigins.map((origin, index) => (
                <tr key={index}>
                  <td style={{ fontWeight: "600", color: "#f8fafc" }}>{origin.country}</td>
                  <td style={{ fontFamily: "var(--font-mono)", color: "#38bdf8" }}>{origin.ipRange}</td>
                  <td style={{ fontWeight: "600", color: "#cbd5e1" }}>{origin.count}</td>
                  <td>
                    <span className={`badge ${origin.risk === "Critical" ? "badge-critical" : origin.risk === "High" ? "badge-high" : "badge-medium"}`}>
                      {origin.risk}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <span style={{ fontWeight: "600", width: "45px" }}>{origin.share}</span>
                      <div style={{ flex: 1, background: "#1e293b", height: "8px", borderRadius: "4px", overflow: "hidden" }}>
                        <div
                          style={{
                            width: origin.share,
                            background: origin.risk === "Critical" ? "#ef4444" : origin.risk === "High" ? "#f97316" : "#3b82f6",
                            height: "100%"
                          }}
                        ></div>
                      </div>
                    </div>
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

export default SecurityAnalytics;
