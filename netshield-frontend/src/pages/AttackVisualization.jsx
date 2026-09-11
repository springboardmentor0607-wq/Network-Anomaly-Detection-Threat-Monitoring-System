import { useState } from "react";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import AttackVisualizationSection from "../components/AttackVisualizationSection";
import { API_BASE_URL } from "../config";
import {
  FaChartBar,
  FaRedo,
  FaFileCsv,
  FaPrint,
  FaShieldAlt
} from "react-icons/fa";
import "../styles/Dashboard.css";

function AttackVisualization() {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const handleExportCSV = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/attack-visualization`);

      const data = await res.json();
      if (!data) return;

      const csvLines = [];
      csvLines.push("Category,Metric,Value");
      csvLines.push(`Summary,Total Detected Attacks,${data.total_attacks || 0}`);
      csvLines.push(`Network,Total Packets,${data.network_traffic_summary?.total_packets || 0}`);
      csvLines.push(`Network,Normal Packets,${data.network_traffic_summary?.normal_packets || 0}`);
      csvLines.push(`Network,Anomalous Packets,${data.network_traffic_summary?.anomalous_packets || 0}`);
      csvLines.push(`Network,Anomaly Rate,${data.network_traffic_summary?.anomaly_rate || '0%'}`);
      
      csvLines.push("");
      csvLines.push("Attack Type,Count");
      (data.attack_types || []).forEach((item) => {
        csvLines.push(`"${item.category}",${item.count}`);
      });

      csvLines.push("");
      csvLines.push("Severity Level,Count,Percentage");
      (data.severity_distribution || []).forEach((item) => {
        csvLines.push(`"${item.name}",${item.value},${item.percentage}%`);
      });

      csvLines.push("");
      csvLines.push("Week,Total Attacks,Critical Attacks,High Attacks");
      (data.weekly_threat_monitoring || []).forEach((item) => {
        csvLines.push(`"${item.week || item.label}",${item.attacks},${item.critical || 0},${item.high || 0}`);
      });

      const csvContent = "data:text/csv;charset=utf-8," + csvLines.join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `NetShield_Attack_Visualization_Analytics_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Export error:", err);
      alert("Error generating CSV export.");
    }
  };

  return (
    <div className="soc-layout">
      <Sidebar />
      <Topbar title="Attack Visualization & Security Threat Analytics" />

      <div className="soc-main-content">
        {/* Header */}
        <div className="dashboard-header">
          <div>
            <h1 className="dashboard-title">
              📊 Attack Visualization Dashboard
            </h1>
            <p className="dashboard-subtitle">
              Dedicated Milestone 3 Security Analytics Center: Multi-Week Attack Trends, Threat Vector Breakdown & Severity Distribution
            </p>
          </div>

          <div className="action-bar">
            <button onClick={handleRefresh} className="soc-btn-secondary" title="Refresh Live Database Analytics">
              <FaRedo /> Refresh Analytics
            </button>
            <button onClick={handleExportCSV} className="soc-btn-secondary" title="Export Analytics Summary to CSV">
              <FaFileCsv /> Export CSV
            </button>
            <button onClick={() => window.print()} className="soc-btn-primary" title="Print Presentation Dashboard">
              <FaPrint /> Print / Save PDF
            </button>
          </div>
        </div>

        {/* Dedicated Attack Visualization Section */}
        <div key={refreshKey}>
          <AttackVisualizationSection />
        </div>
      </div>
    </div>
  );
}

export default AttackVisualization;
