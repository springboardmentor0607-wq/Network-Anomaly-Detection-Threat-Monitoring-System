import { useState } from "react";
import { FaSearch, FaExclamationTriangle, FaShieldAlt, FaCheck, FaInfoCircle } from "react-icons/fa";

function AlertsTable({ alerts = [], onAcknowledge, showSearch = true, limit }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [severityFilter, setSeverityFilter] = useState("All");
  const [selectedAlertModal, setSelectedAlertModal] = useState(null);

  const filteredAlerts = alerts.filter((alert) => {
    const alertId = (alert.alert_id || alert.alertId || alert.id || "").toString().toLowerCase();
    const attackType = (alert.attack_type || alert.attackType || "").toLowerCase();
    const sourceIp = (alert.source_ip || alert.sourceIp || "").toLowerCase();
    const destIp = (alert.dest_ip || alert.destIp || "").toLowerCase();
    const status = (alert.status || "").toLowerCase();
    const term = searchTerm.toLowerCase();

    const matchesSearch =
      alertId.includes(term) ||
      attackType.includes(term) ||
      sourceIp.includes(term) ||
      destIp.includes(term) ||
      status.includes(term);

    const severity = alert.severity || alert.threat_level || "Medium";
    const matchesSeverity = severityFilter === "All" || severity.toLowerCase() === severityFilter.toLowerCase();

    return matchesSearch && matchesSeverity;
  });

  const displayedAlerts = limit ? filteredAlerts.slice(0, limit) : filteredAlerts;

  const getSeverityBadgeClass = (sev) => {
    switch ((sev || "").toLowerCase()) {
      case "critical":
        return "badge badge-critical";
      case "high":
        return "badge badge-high";
      case "medium":
        return "badge badge-medium";
      case "low":
        return "badge badge-low";
      default:
        return "badge badge-normal";
    }
  };

  const getStatusBadgeClass = (status, acknowledged) => {
    if (acknowledged) {
      return "status-badge status-resolved";
    }
    switch ((status || "").toLowerCase()) {
      case "new":
        return "status-badge status-investigating";
      case "blocked":
        return "status-badge status-blocked";
      case "investigating":
        return "status-badge status-investigating";
      case "resolved":
      case "action taken":
        return "status-badge status-resolved";
      default:
        return "status-badge";
    }
  };

  const handleAckClick = async (alertItem) => {
    const targetId = alertItem.alert_id || alertItem.alertId || alertItem.id;
    if (onAcknowledge) {
      onAcknowledge(targetId);
    } else {
      try {
        await fetch(`http://127.0.0.1:5000/alerts/${targetId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ acknowledged: true, status: "Acknowledged" })
        });
        window.location.reload();
      } catch (err) {
        console.error("Failed to acknowledge alert:", err);
      }
    }
  };

  return (
    <div>
      {showSearch && (
        <div style={{ display: "flex", gap: "16px", marginBottom: "16px", flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ position: "relative", flex: 1, minWidth: "220px" }}>
            <FaSearch
              style={{
                position: "absolute",
                left: "14px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "#64748b"
              }}
            />
            <input
              type="text"
              placeholder="Search by Alert ID, Attack Type, IP, or status..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 14px 10px 40px",
                background: "#0f172a",
                border: "1px solid #334155",
                borderRadius: "8px",
                color: "#f8fafc",
                fontSize: "0.88rem",
                outline: "none"
              }}
            />
          </div>

          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            style={{
              padding: "10px 14px",
              background: "#0f172a",
              border: "1px solid #334155",
              borderRadius: "8px",
              color: "#f8fafc",
              fontSize: "0.88rem",
              outline: "none",
              cursor: "pointer"
            }}
          >
            <option value="All">All Severities</option>
            <option value="Critical">Critical Only</option>
            <option value="High">High Only</option>
            <option value="Medium">Medium Only</option>
            <option value="Low">Low Only</option>
          </select>
        </div>
      )}

      <div style={{ overflowX: "auto" }}>
        <table className="soc-table">
          <thead>
            <tr>
              <th>Alert ID</th>
              <th>Detection Time</th>
              <th>Attack Type</th>
              <th>Severity</th>
              <th>AI Confidence</th>
              <th>Risk Score</th>
              <th>Source → Dest IP</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {displayedAlerts.length > 0 ? (
              displayedAlerts.map((alert, idx) => {
                const alertId = alert.alert_id || alert.alertId || `ALERT-${alert.id || idx + 1}`;
                const timeStr = alert.timestamp || alert.time || "Just now";
                const attackType = alert.attack_type || alert.attackType || "Anomalous Traffic";
                const severity = alert.severity || alert.threat_level || "Medium";
                const confidence = alert.confidence || (alert.confidence_score ? `${alert.confidence_score}%` : "95.00%");
                const riskScore = alert.risk_score ?? alert.riskScore ?? 70;
                const sourceIp = alert.source_ip || alert.sourceIp || "192.168.1.100";
                const destIp = alert.dest_ip || alert.destIp || "10.0.0.1";
                const status = alert.status || "New";
                const isAck = alert.acknowledged || false;

                const isCritical = severity.toLowerCase() === "critical";
                const isHigh = severity.toLowerCase() === "high";

                return (
                  <tr
                    key={alert.id || idx}
                    style={{
                      background: isCritical
                        ? "rgba(239, 68, 68, 0.06)"
                        : isHigh
                        ? "rgba(249, 115, 22, 0.04)"
                        : "transparent"
                    }}
                  >
                    <td style={{ fontFamily: "var(--font-mono)", fontWeight: "700", color: "#38bdf8" }}>
                      {alertId}
                    </td>
                    <td style={{ fontFamily: "var(--font-mono)", color: "#94a3b8", fontSize: "0.82rem" }}>
                      {timeStr}
                    </td>
                    <td style={{ fontWeight: "600", color: "#f8fafc" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <FaExclamationTriangle
                          style={{
                            color: isCritical ? "#ef4444" : isHigh ? "#f97316" : "#f59e0b",
                            fontSize: "0.9rem"
                          }}
                        />
                        {attackType}
                      </div>
                    </td>
                    <td>
                      <span className={getSeverityBadgeClass(severity)}>
                        {severity.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ fontFamily: "var(--font-mono)", color: "#c084fc", fontWeight: "700" }}>
                      {confidence}
                    </td>
                    <td style={{ fontFamily: "var(--font-mono)", fontWeight: "700", color: riskScore >= 75 ? "#ef4444" : riskScore >= 45 ? "#f97316" : "#10b981" }}>
                      {riskScore} / 100
                    </td>
                    <td style={{ fontFamily: "var(--font-mono)", fontSize: "0.82rem" }}>
                      <span style={{ color: "#38bdf8" }}>{sourceIp}</span>
                      <span style={{ color: "#64748b", margin: "0 4px" }}>→</span>
                      <span style={{ color: "#a855f7" }}>{destIp}</span>
                    </td>
                    <td>
                      <span className={getStatusBadgeClass(status, isAck)}>
                        {isAck ? "Acknowledged" : status}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                        {!isAck && (
                          <button
                            onClick={() => handleAckClick(alert)}
                            title="Acknowledge Alert"
                            style={{
                              padding: "4px 8px",
                              background: "rgba(16, 185, 129, 0.15)",
                              border: "1px solid #10b981",
                              color: "#34d399",
                              borderRadius: "6px",
                              fontSize: "0.78rem",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: "4px"
                            }}
                          >
                            <FaCheck /> Ack
                          </button>
                        )}
                        <button
                          onClick={() => setSelectedAlertModal(alert)}
                          title="View Detection Details"
                          style={{
                            padding: "4px 8px",
                            background: "rgba(56, 189, 248, 0.15)",
                            border: "1px solid #38bdf8",
                            color: "#38bdf8",
                            borderRadius: "6px",
                            fontSize: "0.78rem",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "4px"
                          }}
                        >
                          <FaInfoCircle /> Details
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="9" style={{ textAlign: "center", padding: "24px", color: "#64748b" }}>
                  <FaShieldAlt
                    style={{ fontSize: "1.5rem", marginBottom: "8px", display: "block", margin: "0 auto 8px" }}
                  />
                  No security alerts generated matching current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Detection Details Modal */}
      {selectedAlertModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(15, 23, 42, 0.85)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "20px"
          }}
        >
          <div
            style={{
              background: "#1e293b",
              border: "1px solid #334155",
              borderRadius: "12px",
              width: "100%",
              maxWidth: "520px",
              padding: "24px",
              color: "#f8fafc",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.5)"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ fontSize: "1.1rem", margin: 0, color: "#38bdf8", display: "flex", alignItems: "center", gap: "8px" }}>
                <FaExclamationTriangle style={{ color: "#ef4444" }} />
                Security Alert Details ({selectedAlertModal.alert_id || selectedAlertModal.alertId || `ALERT-${selectedAlertModal.id}`})
              </h3>
              <button
                onClick={() => setSelectedAlertModal(null)}
                style={{ background: "none", border: "none", color: "#94a3b8", fontSize: "1.2rem", cursor: "pointer" }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "0.9rem" }}>
              <div><strong>Alert ID:</strong> <span style={{ fontFamily: "var(--font-mono)", color: "#38bdf8" }}>{selectedAlertModal.alert_id || selectedAlertModal.alertId || selectedAlertModal.id}</span></div>
              <div><strong>Detection Timestamp:</strong> <span style={{ fontFamily: "var(--font-mono)", color: "#cbd5e1" }}>{selectedAlertModal.timestamp || selectedAlertModal.time}</span></div>
              <div><strong>Attack Category:</strong> <span style={{ color: "#ef4444", fontWeight: "700" }}>{selectedAlertModal.attack_type || selectedAlertModal.attackType}</span></div>
              <div><strong>Threat Severity:</strong> <span className={getSeverityBadgeClass(selectedAlertModal.severity || selectedAlertModal.threat_level)}>{(selectedAlertModal.severity || selectedAlertModal.threat_level || "").toUpperCase()}</span></div>
              <div><strong>AI Confidence:</strong> <span style={{ color: "#c084fc", fontWeight: "700" }}>{selectedAlertModal.confidence || `${selectedAlertModal.confidence_score}%`}</span></div>
              <div><strong>Risk Score:</strong> <span style={{ color: "#ef4444", fontWeight: "700" }}>{selectedAlertModal.risk_score ?? selectedAlertModal.riskScore} / 100</span></div>
              <div><strong>Source IP:</strong> <span style={{ fontFamily: "var(--font-mono)", color: "#38bdf8" }}>{selectedAlertModal.source_ip || selectedAlertModal.sourceIp}</span></div>
              <div><strong>Destination IP:</strong> <span style={{ fontFamily: "var(--font-mono)", color: "#a855f7" }}>{selectedAlertModal.dest_ip || selectedAlertModal.destIp}</span></div>
              <div><strong>Protocol:</strong> <span style={{ fontFamily: "var(--font-mono)" }}>{selectedAlertModal.protocol || "TCP"}</span></div>
              <div><strong>Model Engine:</strong> <span>{selectedAlertModal.model_engine || "Random Forest Classifier"}</span></div>
              <div><strong>Alert Status:</strong> <span className={getStatusBadgeClass(selectedAlertModal.status, selectedAlertModal.acknowledged)}>{selectedAlertModal.acknowledged ? "Acknowledged" : selectedAlertModal.status}</span></div>
              <div><strong>Prediction Details:</strong> <span style={{ color: "#94a3b8" }}>{selectedAlertModal.prediction || `Anomalous Traffic (${selectedAlertModal.attack_type || selectedAlertModal.attackType})`}</span></div>
            </div>

            <div style={{ marginTop: "20px", display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              {!selectedAlertModal.acknowledged && (
                <button
                  onClick={() => {
                    handleAckClick(selectedAlertModal);
                    setSelectedAlertModal(null);
                  }}
                  className="soc-btn-primary"
                  style={{ fontSize: "0.85rem" }}
                >
                  <FaCheck /> Acknowledge Alert
                </button>
              )}
              <button
                onClick={() => setSelectedAlertModal(null)}
                className="soc-btn-secondary"
                style={{ fontSize: "0.85rem" }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AlertsTable;
