import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import {
  FaDesktop,
  FaMicrochip,
  FaMemory,
  FaHdd,
  FaServer,
  FaCheckCircle,
  FaSync,
  FaBrain,
  FaDatabase,
  FaCodeBranch
} from "react-icons/fa";
import "../styles/Dashboard.css";

function SystemMonitoring() {
  const [cpuUsage, setCpuUsage] = useState(32);
  const [memoryUsage, setMemoryUsage] = useState(58);
  const [storageUsage, setStorageUsage] = useState(42);
  const [isLiveRefresh, setIsLiveRefresh] = useState(true);

  useEffect(() => {
    if (!isLiveRefresh) return;
    const interval = setInterval(() => {
      setCpuUsage((prev) => Math.min(92, Math.max(15, Math.floor(prev + (Math.random() * 6 - 3)))));
      setMemoryUsage((prev) => Math.min(88, Math.max(40, Math.floor(prev + (Math.random() * 4 - 2)))));
    }, 3000);

    return () => clearInterval(interval);
  }, [isLiveRefresh]);

  const systemStatusCards = [
    { title: "Backend Status", value: "Flask Operational", detail: "Port 5000 Active", status: "Healthy", color: "#38bdf8", icon: <FaServer /> },
    { title: "ML Framework", value: "Scikit-learn", detail: "Random Forest Engine", status: "Healthy", color: "#c084fc", icon: <FaBrain /> },
    { title: "Database Status", value: "PostgreSQL Connected", detail: "Port 5432 Active", status: "Connected", color: "#34d399", icon: <FaDatabase /> },
    { title: "API Status", value: "REST Services Ready", detail: "100% Endpoint Health", status: "Healthy", color: "#10b981", icon: <FaCodeBranch /> },
    { title: "Model Status", value: "netshield_model.pkl", detail: "Inference Ready", status: "Loaded", color: "#00f2fe", icon: <FaCheckCircle /> }
  ];

  return (
    <div className="soc-layout">
      <Sidebar role="Security Administrator" />
      <Topbar title="System Monitoring & Infrastructure Health" />

      <div className="soc-main-content">
        {/* Header */}
        <div className="dashboard-header">
          <div>
            <h1 className="dashboard-title">
              🖥️ System Monitoring
            </h1>
            <p className="dashboard-subtitle">
              Realtime System Telemetry, Random Forest Engine Status, Database Connectivity & Resource Utilization
            </p>
          </div>

          <button
            onClick={() => setIsLiveRefresh((prev) => !prev)}
            className="soc-btn-primary"
            style={{ background: isLiveRefresh ? "linear-gradient(135deg, #10b981, #059669)" : "#334155" }}
          >
            <FaSync style={{ animation: isLiveRefresh ? "spin 2s linear infinite" : "none" }} />
            {isLiveRefresh ? "Live Telemetry Active" : "Telemetry Paused"}
          </button>
        </div>

        {/* 5 Required Status Cards */}
        <div style={{ marginBottom: "24px" }}>
          <h3 style={{ fontSize: "1.1rem", color: "#f8fafc", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
            <FaDesktop style={{ color: "#00f2fe" }} /> Core Component Telemetry & Status
          </h3>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
            {systemStatusCards.map((card, idx) => (
              <div key={idx} className="soc-card" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                  <div style={{ fontSize: "1.2rem", color: card.color }}>{card.icon}</div>
                  <span style={{ fontSize: "0.85rem", color: "#94a3b8" }}>{card.title}</span>
                </div>
                <div style={{ fontSize: "1.1rem", fontWeight: "700", color: "#f8fafc", marginBottom: "4px" }}>
                  {card.value}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "8px" }}>
                  <span style={{ fontSize: "0.78rem", color: "#cbd5e1" }}>{card.detail}</span>
                  <span className="badge badge-low" style={{ fontSize: "0.72rem" }}>
                    <FaCheckCircle style={{ marginRight: "3px" }} /> {card.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 3 Required Hardware Resource Cards (Memory Usage, CPU Usage, Storage Usage) */}
        <div style={{ marginBottom: "24px" }}>
          <h3 style={{ fontSize: "1.1rem", color: "#f8fafc", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
            <FaMicrochip style={{ color: "#818cf8" }} /> Live Hardware Resource Utilization
          </h3>

          <div className="soc-grid-3" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "16px" }}>
            {/* CPU Usage */}
            <div className="soc-card">
              <div className="soc-card-title">
                <FaMicrochip style={{ color: "#818cf8" }} /> CPU Usage
              </div>
              <div className="soc-card-value" style={{ color: cpuUsage > 80 ? "#ef4444" : "#f8fafc" }}>
                {cpuUsage}%
              </div>
              <div className="soc-card-subtext">
                <span>8-Core Processor Host • Active Execution</span>
                <div style={{ background: "#1e293b", height: "10px", borderRadius: "5px", overflow: "hidden", marginTop: "10px" }}>
                  <div
                    style={{
                      width: `${cpuUsage}%`,
                      background: cpuUsage > 80 ? "#ef4444" : "#818cf8",
                      height: "100%",
                      transition: "width 0.5s ease"
                    }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Memory Usage */}
            <div className="soc-card">
              <div className="soc-card-title">
                <FaMemory style={{ color: "#c084fc" }} /> Memory Usage
              </div>
              <div className="soc-card-value" style={{ color: memoryUsage > 80 ? "#ef4444" : "#f8fafc" }}>
                {memoryUsage}%
              </div>
              <div className="soc-card-subtext">
                <span>{( (memoryUsage / 100) * 16 ).toFixed(1)} GB / 16 GB RAM Allocated</span>
                <div style={{ background: "#1e293b", height: "10px", borderRadius: "5px", overflow: "hidden", marginTop: "10px" }}>
                  <div
                    style={{
                      width: `${memoryUsage}%`,
                      background: memoryUsage > 80 ? "#ef4444" : "#c084fc",
                      height: "100%",
                      transition: "width 0.5s ease"
                    }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Storage Usage */}
            <div className="soc-card">
              <div className="soc-card-title">
                <FaHdd style={{ color: "#34d399" }} /> Storage Usage
              </div>
              <div className="soc-card-value" style={{ color: "#34d399" }}>
                {storageUsage}%
              </div>
              <div className="soc-card-subtext">
                <span>210 GB / 500 GB NVMe Storage Used</span>
                <div style={{ background: "#1e293b", height: "10px", borderRadius: "5px", overflow: "hidden", marginTop: "10px" }}>
                  <div style={{ width: `${storageUsage}%`, background: "#34d399", height: "100%" }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SystemMonitoring;
