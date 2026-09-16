import { useState, useEffect, useCallback, useRef } from "react";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import { API_BASE_URL } from "../config";
import {
  FaPlay,
  FaStop,
  FaNetworkWired,
  FaShieldAlt,
  FaExclamationTriangle,
  FaCheckCircle,
  FaSpinner,
  FaSyncAlt,
  FaBroadcastTower,
  FaExternalLinkAlt,
  FaRedo
} from "react-icons/fa";
import "../styles/Dashboard.css";

// Helper fetch with 8-second request timeout to prevent hanging UI
async function fetchWithTimeout(resource, options = {}, timeoutMs = 8000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(resource, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    if (error.name === "AbortError") {
      throw new Error("Request timed out after 8 seconds. Please check backend connection.");
    }
    throw error;
  }
}

function LiveNetworkMonitoring() {
  const [isRunning, setIsRunning] = useState(false);
  const [statusInfo, setStatusInfo] = useState({
    interface: "default",
    uptime_seconds: 0,
    packet_count: 0,
    total_flows: 0,
    normal_flows: 0,
    anomalous_flows: 0,
    threat_count: 0,
    highest_threat_level: "Low",
    latest_prediction: "N/A",
    latest_src_ip: "N/A",
    latest_dst_ip: "N/A",
    protocol: "N/A",
    latest_attack_type: "N/A",
    confidence: "0.00%",
    latest_threat_level: "Low",
    latest_risk_score: 0,
    last_error: null,
    requires_npcap: false
  });
  const [flows, setFlows] = useState([]);
  const [interfaces, setInterfaces] = useState([]);
  const [selectedInterface, setSelectedInterface] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [actionLabel, setActionLabel] = useState("");
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [requiresNpcap, setRequiresNpcap] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const timerRef = useRef(null);

  // Fetch cross-platform network interfaces
  const fetchInterfaces = useCallback(async () => {
    try {
      const res = await fetchWithTimeout(`${API_BASE_URL}/live-monitoring/interfaces`, {}, 5000);
      if (res.ok) {
        const data = await res.json();
        if (data.interfaces && data.interfaces.length > 0) {
          setInterfaces(data.interfaces);
          const firstIface = typeof data.interfaces[0] === "object" ? data.interfaces[0].id : data.interfaces[0];
          setSelectedInterface((prev) => prev || (firstIface !== "none" ? firstIface : ""));
        }
      }
    } catch (err) {
      console.warn("Could not fetch network interfaces:", err);
    }
  }, []);

  // Fetch live flows & status metrics
  const fetchFlowsAndStatus = useCallback(async () => {
    try {
      const res = await fetchWithTimeout(`${API_BASE_URL}/live-monitoring/flows?limit=50`, {}, 6000);
      if (res.ok) {
        const data = await res.json();
        if (data.status) {
          setStatusInfo(data.status);
          setIsRunning(data.status.is_running);
          if (data.status.requires_npcap) {
            setRequiresNpcap(true);
          }
          if (data.status.last_error && !data.status.is_running) {
            setErrorMsg(data.status.last_error);
          }
        }
        if (data.flows) {
          setFlows(data.flows);
        }
      }
    } catch (err) {
      console.error("Error fetching live monitoring data:", err);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchInterfaces();
    fetchFlowsAndStatus();
  }, [fetchInterfaces, fetchFlowsAndStatus]);

  // Polling interval when active
  useEffect(() => {
    if (isRunning && autoRefresh) {
      timerRef.current = setInterval(() => {
        fetchFlowsAndStatus();
      }, 2000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, autoRefresh, fetchFlowsAndStatus]);

  // Start Monitoring Action
  const handleStart = async () => {
    if (!selectedInterface || selectedInterface === "none") {
      setErrorMsg("No active network interface selected. Please select an active Wi-Fi or Ethernet adapter.");
      return;
    }

    setActionLoading(true);
    setActionLabel("Starting...");
    setErrorMsg(null);
    setSuccessMsg(null);
    setRequiresNpcap(false);

    try {
      const res = await fetchWithTimeout(`${API_BASE_URL}/live-monitoring/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interface: selectedInterface })
      }, 8000);

      const data = await res.json();
      if (res.ok && data.status === "success") {
        setIsRunning(true);
        setSuccessMsg(data.message || "Live monitoring started successfully.");
        if (data.details) setStatusInfo(data.details);
        fetchFlowsAndStatus();
      } else {
        setIsRunning(false);
        setErrorMsg(data.message || "Failed to start live network monitoring.");
        if (data.requires_npcap) {
          setRequiresNpcap(true);
        }
      }
    } catch (err) {
      setIsRunning(false);
      setErrorMsg(err.message || "Failed to communicate with Flask backend.");
    } finally {
      setActionLoading(false);
      setActionLabel("");
    }
  };

  // Stop Monitoring Action
  const handleStop = async () => {
    setActionLoading(true);
    setActionLabel("Stopping...");
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetchWithTimeout(`${API_BASE_URL}/live-monitoring/stop`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      }, 6000);

      const data = await res.json();
      if (res.ok) {
        setIsRunning(false);
        setSuccessMsg(data.message || "Live monitoring stopped successfully.");
        if (data.details) setStatusInfo(data.details);
      } else {
        setErrorMsg(data.message || "Failed to stop live monitoring.");
      }
    } catch (err) {
      setErrorMsg(err.message || "Failed to communicate with Flask backend.");
    } finally {
      setActionLoading(false);
      setActionLabel("");
    }
  };

  // Helper for threat level badges
  const getThreatLevelBadge = (level) => {
    switch (level?.toLowerCase()) {
      case "critical":
        return <span className="badge badge-critical">Critical</span>;
      case "high":
        return <span className="badge badge-high">High</span>;
      case "medium":
        return <span className="badge badge-medium">Medium</span>;
      case "low":
      default:
        return <span className="badge badge-low">Low</span>;
    }
  };

  const formatUptime = (secs) => {
    if (!secs) return "0s";
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  };

  return (
    <div className="soc-layout">
      <Sidebar role="Security Analyst" />
      <Topbar title="Real-Time Host Network Flow Inspection & AI Threat Engine" />

      <div className="soc-main-content">
        {/* Header */}
        <div className="dashboard-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <h1 className="dashboard-title" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <FaBroadcastTower style={{ color: isRunning ? "#10b981" : "#94a3b8" }} />
              Live Network Monitoring
            </h1>
            <p className="dashboard-subtitle">
              Real Packet Capture & Flow Feature Extraction via NetShield AI Random Forest Engine
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{
              padding: "8px 16px",
              borderRadius: "20px",
              fontSize: "0.88rem",
              fontWeight: "700",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              background: isRunning ? "rgba(16, 185, 129, 0.15)" : "rgba(148, 163, 184, 0.15)",
              border: `1px solid ${isRunning ? "rgba(16, 185, 129, 0.4)" : "rgba(148, 163, 184, 0.3)"}`,
              color: isRunning ? "#34d399" : "#94a3b8"
            }}>
              <span style={{
                width: "10px",
                height: "10px",
                borderRadius: "50%",
                background: isRunning ? "#10b981" : "#64748b",
                boxShadow: isRunning ? "0 0 10px #10b981" : "none"
              }} />
              {isRunning ? `MONITORING ACTIVE (${formatUptime(statusInfo.uptime_seconds)})` : "MONITORING STOPPED"}
            </div>
          </div>
        </div>

        {/* System Error Banner with Retry Option */}
        {errorMsg && (
          <div style={{ padding: "16px", borderRadius: "10px", background: "rgba(239, 68, 68, 0.12)", border: "1px solid rgba(239, 68, 68, 0.4)", color: "#fca5a5", marginBottom: "20px" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
              <FaExclamationTriangle style={{ color: "#ef4444", fontSize: "1.3rem", marginTop: "2px" }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: "700", fontSize: "1rem", color: "#fca5a5" }}>Monitoring Alert / Error</div>
                <div style={{ fontSize: "0.88rem", color: "#cbd5e1", marginTop: "4px" }}>{errorMsg}</div>
                {requiresNpcap && (
                  <div style={{ marginTop: "10px", fontSize: "0.85rem", color: "#fca5a5", background: "rgba(0,0,0,0.2)", padding: "10px", borderRadius: "6px" }}>
                    <strong>Windows Requirement Notice:</strong> Capturing raw network packets on Windows requires Npcap driver or Administrator privileges.
                    <div style={{ marginTop: "6px", display: "flex", gap: "12px", alignItems: "center" }}>
                      <a href="https://npcap.com" target="_blank" rel="noreferrer" style={{ color: "#38bdf8", display: "inline-flex", alignItems: "center", gap: "4px", textDecoration: "underline" }}>
                        Download Npcap Driver <FaExternalLinkAlt style={{ fontSize: "0.75rem" }} />
                      </a>
                    </div>
                  </div>
                )}
                <div style={{ marginTop: "12px" }}>
                  <button
                    onClick={handleStart}
                    disabled={actionLoading}
                    style={{
                      padding: "6px 14px",
                      background: "#ef4444",
                      border: "none",
                      borderRadius: "6px",
                      color: "#fff",
                      fontWeight: "600",
                      fontSize: "0.82rem",
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px"
                    }}
                  >
                    <FaRedo /> Retry Start
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Success Banner */}
        {successMsg && (
          <div style={{ padding: "12px 16px", borderRadius: "8px", background: "rgba(16, 185, 129, 0.15)", border: "1px solid rgba(16, 185, 129, 0.4)", color: "#6ee7b7", marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px" }}>
            <FaCheckCircle style={{ color: "#10b981" }} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* High/Critical Threat Warning Banner */}
        {(statusInfo.highest_threat_level === "High" || statusInfo.highest_threat_level === "Critical") && isRunning && (
          <div style={{ padding: "16px", borderRadius: "10px", background: "linear-gradient(90deg, rgba(239,68,68,0.2) 0%, rgba(15,23,42,0.6) 100%)", border: "1px solid rgba(239, 68, 68, 0.5)", color: "#f8fafc", marginBottom: "20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              <div style={{ width: "42px", height: "42px", borderRadius: "50%", background: "rgba(239,68,68,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <FaExclamationTriangle style={{ color: "#ef4444", fontSize: "1.4rem" }} />
              </div>
              <div>
                <div style={{ fontWeight: "700", fontSize: "1.05rem", color: "#fca5a5" }}>
                  Active {statusInfo.highest_threat_level.toUpperCase()} Security Threat Detected
                </div>
                <div style={{ fontSize: "0.85rem", color: "#cbd5e1", marginTop: "2px" }}>
                  Anomalous network flows have triggered automatic Security Alert & Incident creation.
                </div>
              </div>
            </div>
            {getThreatLevelBadge(statusInfo.highest_threat_level)}
          </div>
        )}

        {/* Controls Card */}
        <div className="soc-card" style={{ marginBottom: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <FaNetworkWired style={{ color: "#38bdf8" }} />
                <span style={{ fontWeight: "600", color: "#f8fafc", fontSize: "0.9rem" }}>Interface:</span>
              </div>

              <select
                value={selectedInterface}
                onChange={(e) => setSelectedInterface(e.target.value)}
                disabled={isRunning || actionLoading}
                style={{
                  padding: "8px 14px",
                  background: "#0f172a",
                  border: "1px solid #334155",
                  borderRadius: "8px",
                  color: "#f8fafc",
                  fontSize: "0.85rem",
                  outline: "none",
                  cursor: isRunning ? "not-allowed" : "pointer",
                  minWidth: "260px"
                }}
              >
                {interfaces.map((iface, idx) => {
                  const ifaceVal = typeof iface === "object" ? iface.id : iface;
                  const ifaceLabel = typeof iface === "object" ? iface.name : iface;
                  return (
                    <option key={idx} value={ifaceVal}>{ifaceLabel}</option>
                  );
                })}
              </select>

              {selectedInterface && selectedInterface !== "none" && (
                <span style={{ fontSize: "0.82rem", color: "#94a3b8", background: "#0f172a", padding: "4px 10px", borderRadius: "6px", border: "1px solid #334155" }}>
                  Selected: <strong style={{ color: "#38bdf8" }}>{selectedInterface}</strong>
                </span>
              )}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              {!isRunning ? (
                <button
                  onClick={handleStart}
                  disabled={actionLoading || !selectedInterface || selectedInterface === "none"}
                  style={{
                    padding: "9px 22px",
                    background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                    border: "none",
                    borderRadius: "8px",
                    color: "#ffffff",
                    fontWeight: "700",
                    fontSize: "0.9rem",
                    cursor: actionLoading ? "wait" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    boxShadow: "0 4px 12px rgba(16, 185, 129, 0.3)",
                    opacity: actionLoading ? 0.7 : 1
                  }}
                >
                  {actionLoading ? <FaSpinner className="spin-icon" /> : <FaPlay />}
                  {actionLoading ? actionLabel || "Starting..." : "Start Monitoring"}
                </button>
              ) : (
                <button
                  onClick={handleStop}
                  disabled={actionLoading}
                  style={{
                    padding: "9px 22px",
                    background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
                    border: "none",
                    borderRadius: "8px",
                    color: "#ffffff",
                    fontWeight: "700",
                    fontSize: "0.9rem",
                    cursor: actionLoading ? "wait" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    boxShadow: "0 4px 12px rgba(239, 68, 68, 0.3)",
                    opacity: actionLoading ? 0.7 : 1
                  }}
                >
                  {actionLoading ? <FaSpinner className="spin-icon" /> : <FaStop />}
                  {actionLoading ? actionLabel || "Stopping..." : "Stop Monitoring"}
                </button>
              )}

              <button
                onClick={fetchFlowsAndStatus}
                style={{
                  padding: "9px 14px",
                  background: "#1e293b",
                  border: "1px solid #334155",
                  borderRadius: "8px",
                  color: "#cbd5e1",
                  fontSize: "0.85rem",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px"
                }}
              >
                <FaSyncAlt /> Refresh
              </button>

              <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.82rem", color: "#94a3b8", cursor: "pointer", marginLeft: "6px" }}>
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                />
                Auto-Update (2s)
              </label>
            </div>
          </div>
        </div>

        {/* 5 KPI Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: "16px", marginBottom: "24px" }}>
          <div className="soc-card">
            <div className="soc-card-title">Total Monitored Flows</div>
            <div className="soc-card-value" style={{ color: "#38bdf8" }}>
              {statusInfo.total_flows.toLocaleString()}
            </div>
            <div className="soc-card-subtext">Packets: {statusInfo.packet_count ? statusInfo.packet_count.toLocaleString() : 0}</div>
          </div>

          <div className="soc-card">
            <div className="soc-card-title">Normal Traffic Flows</div>
            <div className="soc-card-value" style={{ color: "#34d399" }}>
              {statusInfo.normal_flows.toLocaleString()}
            </div>
            <div className="soc-card-subtext">Legitimate Traffic</div>
          </div>

          <div className="soc-card">
            <div className="soc-card-title">Anomalous Flows</div>
            <div className="soc-card-value" style={{ color: "#fbbf24" }}>
              {statusInfo.anomalous_flows.toLocaleString()}
            </div>
            <div className="soc-card-subtext">Detected Threats</div>
          </div>

          <div className="soc-card">
            <div className="soc-card-title">Current Threat Count</div>
            <div className="soc-card-value" style={{ color: "#f87171" }}>
              {statusInfo.threat_count.toLocaleString()}
            </div>
            <div className="soc-card-subtext">Alerts & Incidents Triggered</div>
          </div>

          <div className="soc-card">
            <div className="soc-card-title">Highest Threat Level</div>
            <div className="soc-card-value">
              {getThreatLevelBadge(statusInfo.highest_threat_level)}
            </div>
            <div className="soc-card-subtext">Peak Severity Observed</div>
          </div>
        </div>

        {/* Latest Flow AI Inspection Panel */}
        {isRunning && statusInfo.latest_src_ip !== "N/A" && (
          <div className="soc-card" style={{ marginBottom: "24px", background: "#0f172a", border: "1px solid #1e293b" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <span style={{ fontWeight: "700", color: "#f8fafc", fontSize: "0.95rem", display: "flex", alignItems: "center", gap: "8px" }}>
                <FaShieldAlt style={{ color: "#00f2fe" }} /> Latest Captured Flow Inspection
              </span>
              {getThreatLevelBadge(statusInfo.latest_threat_level)}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "12px", fontSize: "0.85rem" }}>
              <div>
                <span style={{ color: "#94a3b8" }}>Source IP:</span>
                <div style={{ fontFamily: "var(--font-mono)", color: "#38bdf8", fontWeight: "700" }}>{statusInfo.latest_src_ip}</div>
              </div>
              <div>
                <span style={{ color: "#94a3b8" }}>Destination IP:</span>
                <div style={{ fontFamily: "var(--font-mono)", color: "#cbd5e1" }}>{statusInfo.latest_dst_ip}</div>
              </div>
              <div>
                <span style={{ color: "#94a3b8" }}>Protocol:</span>
                <div style={{ fontWeight: "700", color: "#00f2fe" }}>{statusInfo.protocol}</div>
              </div>
              <div>
                <span style={{ color: "#94a3b8" }}>Prediction:</span>
                <div style={{ fontWeight: "700", color: statusInfo.latest_threat_level === "Low" ? "#34d399" : "#fca5a5" }}>{statusInfo.latest_prediction}</div>
              </div>
              <div>
                <span style={{ color: "#94a3b8" }}>Attack Type:</span>
                <div style={{ fontWeight: "700", color: "#c084fc" }}>{statusInfo.latest_attack_type}</div>
              </div>
              <div>
                <span style={{ color: "#94a3b8" }}>Confidence:</span>
                <div style={{ fontFamily: "var(--font-mono)", fontWeight: "700", color: "#38bdf8" }}>{statusInfo.confidence}</div>
              </div>
              <div>
                <span style={{ color: "#94a3b8" }}>Risk Score:</span>
                <div style={{ fontFamily: "var(--font-mono)", fontWeight: "700", color: statusInfo.latest_risk_score > 70 ? "#ef4444" : "#10b981" }}>{statusInfo.latest_risk_score} / 100</div>
              </div>
            </div>
          </div>
        )}

        {/* Live Traffic Flow Stream Table */}
        <div className="soc-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h3 style={{ fontSize: "1.1rem", color: "#f8fafc", display: "flex", alignItems: "center", gap: "8px" }}>
              <FaShieldAlt style={{ color: "#00f2fe" }} /> Live Inspected Network Flows & AI Predictions
            </h3>

            <span style={{ fontSize: "0.82rem", color: "#94a3b8" }}>
              Showing latest {flows.length} captured flow records
            </span>
          </div>

          {flows.length === 0 ? (
            <div style={{ padding: "40px 20px", textAlign: "center", color: "#64748b" }}>
              <FaBroadcastTower style={{ fontSize: "2.5rem", marginBottom: "12px", opacity: 0.5 }} />
              <p style={{ fontSize: "0.95rem" }}>
                {isRunning ? "Listening for real network traffic flows... Open web pages or ping hosts to generate flows." : "Live monitoring is currently stopped. Select an interface and click 'Start Monitoring'."}
              </p>
            </div>
          ) : (
            <table className="soc-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Source IP</th>
                  <th>Destination IP</th>
                  <th>Protocol</th>
                  <th>Prediction</th>
                  <th>Attack Type</th>
                  <th>AI Confidence</th>
                  <th>Threat Level</th>
                  <th>Risk Score</th>
                </tr>
              </thead>
              <tbody>
                {flows.map((flow, idx) => (
                  <tr
                    key={flow.id || idx}
                    style={{
                      background: flow.is_anomaly ? "rgba(239, 68, 68, 0.04)" : "transparent"
                    }}
                  >
                    <td style={{ color: "#94a3b8", fontSize: "0.82rem", fontFamily: "var(--font-mono)" }}>
                      {flow.timestamp}
                    </td>
                    <td style={{ fontFamily: "var(--font-mono)", color: "#38bdf8", fontWeight: "600" }}>
                      {flow.source_ip}
                    </td>
                    <td style={{ fontFamily: "var(--font-mono)", color: "#cbd5e1" }}>
                      {flow.dest_ip}
                    </td>
                    <td style={{ fontWeight: "700", color: "#00f2fe" }}>
                      {flow.protocol}
                    </td>
                    <td>
                      <span className={flow.is_anomaly ? "badge badge-critical" : "badge badge-low"}>
                        {flow.prediction}
                      </span>
                    </td>
                    <td style={{ fontWeight: "600", color: flow.is_anomaly ? "#fca5a5" : "#6ee7b7" }}>
                      {flow.attack_type}
                    </td>
                    <td style={{ fontFamily: "var(--font-mono)", color: "#c084fc", fontWeight: "700" }}>
                      {flow.confidence}
                    </td>
                    <td>
                      {getThreatLevelBadge(flow.threat_level)}
                    </td>
                    <td style={{
                      fontFamily: "var(--font-mono)",
                      fontWeight: "700",
                      color: flow.risk_score > 75 ? "#ef4444" : flow.risk_score > 40 ? "#f97316" : "#10b981"
                    }}>
                      {flow.risk_score} / 100
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

export default LiveNetworkMonitoring;
