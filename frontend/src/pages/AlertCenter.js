import React, { useEffect, useState } from "react";
import "./AlertCenter.css";

const API_URL = "http://127.0.0.1:8000";

function AlertCenter() {
  const [alerts, setAlerts] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // ============================================================
  // FETCH ALERTS
  // ============================================================

  const fetchAlerts = async () => {
    try {
      const response = await fetch(`${API_URL}/alerts/`);

      if (!response.ok) {
        throw new Error("Failed to fetch alerts");
      }

      const data = await response.json();

      setAlerts(data.alerts || []);
      setLastUpdated(new Date());
      setLoading(false);
    } catch (error) {
      console.error("Alert fetch error:", error);
      setLoading(false);
    }
  };

  // ============================================================
  // FETCH STATISTICS
  // ============================================================

  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_URL}/alerts/stats`);

      if (!response.ok) {
        throw new Error("Failed to fetch statistics");
      }

      const data = await response.json();

      setStats(data);
    } catch (error) {
      console.error("Stats fetch error:", error);
    }
  };

  // ============================================================
  // INITIAL LOAD + AUTO REFRESH
  // ============================================================

  useEffect(() => {
    fetchAlerts();
    fetchStats();

    const interval = setInterval(() => {
      fetchAlerts();
      fetchStats();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // ============================================================
  // UPDATE ALERT
  // ============================================================

  const updateAlert = async (id, action) => {
    try {
      const response = await fetch(
        `${API_URL}/alerts/${id}/${action}`,
        {
          method: "PATCH",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update alert");
      }

      await fetchAlerts();
      await fetchStats();

      if (selectedAlert && selectedAlert.id === id) {
        const updated = alerts.find(
          (alert) => alert.id === id
        );

        if (updated) {
          setSelectedAlert({
            ...updated,
            workflow_status:
              action === "acknowledge"
                ? "Acknowledged"
                : action === "investigate"
                ? "Investigating"
                : "Resolved",
          });
        }
      }
    } catch (error) {
      console.error("Alert update error:", error);
      alert("Unable to update alert.");
    }
  };

  // ============================================================
  // FILTER ALERTS
  // ============================================================

  const filteredAlerts = alerts.filter((alert) => {
    const matchesFilter =
      filter === "All" ||
      alert.severity === filter ||
      alert.workflow_status === filter;

    const searchText = search.toLowerCase();

    const matchesSearch =
      alert.threat_type
        ?.toLowerCase()
        .includes(searchText) ||
      alert.status
        ?.toLowerCase()
        .includes(searchText) ||
      alert.severity
        ?.toLowerCase()
        .includes(searchText);

    return matchesFilter && matchesSearch;
  });

  // ============================================================
  // SEVERITY CLASS
  // ============================================================

  const getSeverityClass = (severity) => {
    switch (severity) {
      case "Critical":
        return "critical";

      case "High":
        return "high";

      case "Medium":
        return "medium";

      default:
        return "low";
    }
  };

  // ============================================================
  // FORMAT TIME
  // ============================================================

  const formatTime = (timestamp) => {
    if (!timestamp) return "Unknown";

    const date = new Date(timestamp);

    if (Number.isNaN(date.getTime())) {
      return timestamp;
    }

    return date.toLocaleString();
  };

  // ============================================================
  // DASHBOARD
  // ============================================================

  return (
    <div className="alert-center">

      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="alert-header">

        <div>
          <div className="page-label">
            SECURITY OPERATIONS CENTER
          </div>

          <h1>
            Alert Center
          </h1>

          <p>
            Real-time network threat monitoring and incident
            management
          </p>
        </div>

        <div className="live-indicator">
          <span className="live-dot"></span>

          LIVE MONITORING

          <small>
            Updated{" "}
            {lastUpdated.toLocaleTimeString()}
          </small>
        </div>

      </div>


      {/* ======================================================
          STATISTICS
      ====================================================== */}

      <div className="stats-grid">

        <div className="stat-card">
          <div className="stat-icon blue">
            ◉
          </div>

          <div>
            <span>Total Alerts</span>

            <strong>
              {stats?.total_alerts ?? 0}
            </strong>
          </div>
        </div>


        <div className="stat-card threat-card">
          <div className="stat-icon red">
            ⚠
          </div>

          <div>
            <span>Threats Detected</span>

            <strong>
              {stats?.threats_detected ?? 0}
            </strong>
          </div>
        </div>


        <div className="stat-card">
          <div className="stat-icon orange">
            !
          </div>

          <div>
            <span>Critical</span>

            <strong>
              {stats?.severity?.critical ?? 0}
            </strong>
          </div>
        </div>


        <div className="stat-card">
          <div className="stat-icon green">
            ✓
          </div>

          <div>
            <span>Resolved</span>

            <strong>
              {stats?.workflow?.resolved ?? 0}
            </strong>
          </div>
        </div>

      </div>


      {/* ======================================================
          CONTROL BAR
      ====================================================== */}

      <div className="control-panel">

        <div className="search-box">

          <span>⌕</span>

          <input
            type="text"
            placeholder="Search threats..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
          />

        </div>


        <div className="filter-buttons">

          {[
            "All",
            "Critical",
            "High",
            "Medium",
            "Low",
            "New",
            "Investigating",
            "Resolved",
          ].map((item) => (
            <button
              key={item}
              className={
                filter === item
                  ? "filter active"
                  : "filter"
              }
              onClick={() =>
                setFilter(item)
              }
            >
              {item}
            </button>
          ))}

        </div>

      </div>


      {/* ======================================================
          ALERT LIST
      ====================================================== */}

      <div className="alert-section">

        <div className="section-title">

          <div>
            <h2>
              Security Alerts
            </h2>

            <span>
              {filteredAlerts.length} alerts
            </span>
          </div>

          <button
            className="refresh-btn"
            onClick={() => {
              fetchAlerts();
              fetchStats();
            }}
          >
            ↻ Refresh
          </button>

        </div>


        {loading ? (
          <div className="empty-state">
            Loading security alerts...
          </div>
        ) : filteredAlerts.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              ✓
            </div>

            <h3>
              No alerts found
            </h3>

            <p>
              No alerts match your current filters.
            </p>
          </div>
        ) : (

          <div className="alert-table">

            <div className="table-header">

              <span>Threat</span>
              <span>Severity</span>
              <span>Risk</span>
              <span>Confidence</span>
              <span>Workflow</span>
              <span>Time</span>
              <span>Action</span>

            </div>


            {filteredAlerts.map((alert) => (

              <div
                className="alert-row"
                key={alert.id}
              >

                <div className="threat-name">

                  <div
                    className={`threat-indicator ${getSeverityClass(
                      alert.severity
                    )}`}
                  >
                    ⚠
                  </div>

                  <div>
                    <strong>
                      {alert.threat_type}
                    </strong>

                    <small>
                      {alert.prediction}
                    </small>
                  </div>

                </div>


                <div>
                  <span
                    className={`severity-badge ${getSeverityClass(
                      alert.severity
                    )}`}
                  >
                    {alert.severity}
                  </span>
                </div>


                <div className="risk-score">
                  {alert.risk_score ?? 0}
                </div>


                <div className="confidence">
                  {alert.confidence}
                </div>


                <div>

                  <span
                    className={`workflow-badge ${(
                      alert.workflow_status ||
                      "New"
                    )
                      .toLowerCase()
                      .replace(" ", "-")}`}
                  >
                    {alert.workflow_status ||
                      "New"}
                  </span>

                </div>


                <div className="alert-time">
                  {formatTime(
                    alert.timestamp
                  )}
                </div>


                <div>

                  <button
                    className="view-btn"
                    onClick={() =>
                      setSelectedAlert(alert)
                    }
                  >
                    View
                  </button>

                </div>

              </div>

            ))}

          </div>

        )}

      </div>


      {/* ======================================================
          ALERT DETAILS MODAL
      ====================================================== */}

      {selectedAlert && (

        <div
          className="modal-overlay"
          onClick={() =>
            setSelectedAlert(null)
          }
        >

          <div
            className="alert-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <div className="modal-header">

              <div>

                <span className="page-label">
                  SECURITY INCIDENT
                </span>

                <h2>
                  {selectedAlert.threat_type}
                </h2>

              </div>

              <button
                className="close-btn"
                onClick={() =>
                  setSelectedAlert(null)
                }
              >
                ×
              </button>

            </div>


            <div className="modal-severity">

              <span
                className={`severity-badge large ${getSeverityClass(
                  selectedAlert.severity
                )}`}
              >
                {selectedAlert.severity}
              </span>

              <span
                className={`workflow-badge large`}
              >
                {selectedAlert.workflow_status ||
                  "New"}
              </span>

            </div>


            <div className="detail-grid">

              <div>
                <label>
                  Detection Status
                </label>

                <strong>
                  {selectedAlert.status}
                </strong>
              </div>


              <div>
                <label>
                  Prediction
                </label>

                <strong>
                  {selectedAlert.prediction}
                </strong>
              </div>


              <div>
                <label>
                  Risk Score
                </label>

                <strong>
                  {selectedAlert.risk_score}
                </strong>
              </div>


              <div>
                <label>
                  Confidence
                </label>

                <strong>
                  {selectedAlert.confidence}
                </strong>
              </div>


              <div>
                <label>
                  Risk Level
                </label>

                <strong>
                  {selectedAlert.risk_level}
                </strong>
              </div>


              <div>
                <label>
                  Detected At
                </label>

                <strong>
                  {formatTime(
                    selectedAlert.timestamp
                  )}
                </strong>
              </div>

            </div>


            {/* ACTIONS */}

            <div className="modal-actions">

              {(selectedAlert.workflow_status ===
                "New" ||
                !selectedAlert.workflow_status) && (

                <button
                  className="action acknowledge"
                  onClick={() =>
                    updateAlert(
                      selectedAlert.id,
                      "acknowledge"
                    )
                  }
                >
                  ✓ Acknowledge
                </button>

              )}


              {selectedAlert.workflow_status ===
                "Acknowledged" && (

                <button
                  className="action investigate"
                  onClick={() =>
                    updateAlert(
                      selectedAlert.id,
                      "investigate"
                    )
                  }
                >
                  🔍 Start Investigation
                </button>

              )}


              {selectedAlert.workflow_status ===
                "Investigating" && (

                <button
                  className="action resolve"
                  onClick={() =>
                    updateAlert(
                      selectedAlert.id,
                      "resolve"
                    )
                  }
                >
                  ✓ Resolve Incident
                </button>

              )}


              {selectedAlert.workflow_status ===
                "Resolved" && (

                <div className="resolved-message">
                  ✓ Incident Resolved
                </div>

              )}

            </div>

          </div>

        </div>

      )}

    </div>
  );
}

export default AlertCenter;