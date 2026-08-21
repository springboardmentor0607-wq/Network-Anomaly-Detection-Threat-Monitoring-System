
import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import NotificationBell from "../components/NotificationBell";
import "./ThreatAlerts.css";

const API_URL = "http://127.0.0.1:8000";

function ThreatAlerts() {
  const navigate = useNavigate();

  const [alerts, setAlerts] = useState([]);
  const [stats, setStats] = useState(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");

  const [error, setError] = useState("");

  // ============================================================
  // FETCH ALERTS + STATISTICS
  // ============================================================

  const fetchAlerts = useCallback(async (initialLoad = false) => {
    try {
      if (initialLoad) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      setError("");

      const [alertsResponse, statsResponse] = await Promise.all([
        axios.get(`${API_URL}/alerts/`),
        axios.get(`${API_URL}/alerts/stats`)
      ]);

      setAlerts(alertsResponse.data?.alerts || []);
      setStats(statsResponse.data || {});
    } catch (err) {
      console.error("Threat Alerts Error:", err);

      setError(
        err.response?.data?.detail ||
          "Unable to connect to NetShield AI."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // ============================================================
  // INITIAL LOAD + 5 SECOND AUTO REFRESH
  // ============================================================

  useEffect(() => {
    fetchAlerts(true);

    const interval = setInterval(() => {
      fetchAlerts(false);
    }, 5000);

    return () => clearInterval(interval);
  }, [fetchAlerts]);

  // ============================================================
  // SEVERITY
  // ============================================================

  const getSeverityClass = (severity) => {
    return String(severity || "Low")
      .toLowerCase()
      .replace(/\s+/g, "-");
  };

  // ============================================================
  // THREAT STATUS
  // ============================================================

  const getThreatStatus = (alert) => {
    const status = String(alert.status || "").toLowerCase();

    if (status.includes("threat")) {
      return {
        label: "Threat Detected",
        className: "threat"
      };
    }

    return {
      label: "Normal",
      className: "normal"
    };
  };

  // ============================================================
  // WORKFLOW STATUS
  // ============================================================

  const getWorkflowStatus = (alert) => {
    const status = String(
      alert.workflow_status || "New"
    ).toLowerCase();

    switch (status) {
      case "acknowledged":
        return {
          label: "Acknowledged",
          icon: "✓",
          className: "acknowledged"
        };

      case "investigating":
        return {
          label: "Investigating",
          icon: "⌕",
          className: "investigating"
        };

      case "resolved":
        return {
          label: "Resolved",
          icon: "✓",
          className: "resolved"
        };

      default:
        return {
          label: "New",
          icon: "●",
          className: "new"
        };
    }
  };

  // ============================================================
  // DATE
  // ============================================================

  const formatDate = (timestamp) => {
    if (!timestamp) {
      return "--";
    }

    const date = new Date(timestamp);

    if (Number.isNaN(date.getTime())) {
      return "--";
    }

    return date.toLocaleString();
  };

  // ============================================================
  // NETWORK FIELD HELPERS
  // ============================================================

  const getProtocol = (alert) => {
    return (
      alert.protocol_type ||
      alert.protocol ||
      "--"
    );
  };

  const getDestinationPort = (alert) => {
    return (
      alert.destination_port ??
      alert.dst_port ??
      alert.dest_port ??
      "--"
    );
  };

  const getSourcePort = (alert) => {
    return (
      alert.source_port ??
      alert.src_port ??
      "--"
    );
  };

  const getService = (alert) => {
    return alert.service || "--";
  };

  // ============================================================
  // SEARCH + FILTER
  // ============================================================

  const filteredAlerts = useMemo(() => {
    let result = [...alerts];

    if (filter !== "All") {
      result = result.filter(
        (alert) =>
          String(alert.severity || "").toLowerCase() ===
          filter.toLowerCase()
      );
    }

    if (search.trim()) {
      const query = search.trim().toLowerCase();

      result = result.filter((alert) => {
        const values = [
          alert.id,
          alert.threat_type,
          alert.status,
          alert.workflow_status,
          alert.protocol_type,
          alert.protocol,
          alert.service,
          alert.source
        ];

        return values.some((value) =>
          String(value || "")
            .toLowerCase()
            .includes(query)
        );
      });
    }

    return result;
  }, [alerts, filter, search]);

  // ============================================================
  // OPEN INVESTIGATION
  // ============================================================

  const investigateAlert = (alertId) => {
    if (!alertId) {
      return;
    }

    navigate(
      `/investigation?alertId=${encodeURIComponent(alertId)}`
    );
  };

  // ============================================================
  // STATISTICS
  // ============================================================

  const totalAlerts =
    stats?.total_alerts ??
    alerts.length;

  const critical =
    stats?.severity?.critical ??
    0;

  const high =
    stats?.severity?.high ??
    0;

  const medium =
    stats?.severity?.medium ??
    0;

  const low =
    stats?.severity?.low ??
    0;

  const newAlerts =
    stats?.workflow?.new ??
    0;

  const acknowledged =
    stats?.workflow?.acknowledged ??
    0;

  const investigating =
    stats?.workflow?.investigating ??
    0;

  const resolved =
    stats?.workflow?.resolved ??
    0;

  // Active threats = critical/high/medium threats that
  // have not been resolved.
  const totalThreats =
    stats?.threats_detected ??
    0;

  const activeThreats = Math.max(
    totalThreats - resolved,
    0
  );

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <div className="threat-alerts-page">

        <div className="alerts-loading">

          <div className="loading-spinner"></div>

          <h2>
            Loading Security Center
          </h2>

          <p>
            NetShield AI is loading the latest
            network security events...
          </p>

        </div>

      </div>
    );
  }

  // ============================================================
  // PAGE
  // ============================================================

  return (
    <div className="threat-alerts-page">

      {/* ======================================================
          HEADER
      ====================================================== */}

      <header className="threat-header">

        <div className="header-left">

          <div className="section-label">
            SECURITY / ALERT CENTER
          </div>

          <h1>
            Threat Alerts
          </h1>

          <p>
            Real-time network threats detected
            and analyzed by NetShield AI.
          </p>

        </div>

        <div className="header-right">

          <div className="live-monitoring">

            <span className="live-dot"></span>

            LIVE MONITORING

          </div>

          <NotificationBell />

        </div>

      </header>


      {/* ======================================================
          ERROR
      ====================================================== */}

      {error && (
        <div className="alerts-error">

          <span>⚠</span>

          <span>{error}</span>

          <button
            onClick={() => fetchAlerts(false)}
          >
            Retry
          </button>

        </div>
      )}


      {/* ======================================================
          MAIN STATISTICS
      ====================================================== */}

      <section className="stats-grid">

        <div className="stat-card total">

          <div className="stat-top">

            <span className="stat-label">
              TOTAL ALERTS
            </span>

            <span className="stat-icon">
              ◈
            </span>

          </div>

          <strong>
            {totalAlerts}
          </strong>

          <span className="stat-description">
            Monitored security events
          </span>

        </div>


        <div className="stat-card critical">

          <div className="stat-top">

            <span className="stat-label">
              CRITICAL
            </span>

            <span className="stat-icon">
              !
            </span>

          </div>

          <strong>
            {critical}
          </strong>

          <span className="stat-description">
            Immediate attention
          </span>

        </div>


        <div className="stat-card high">

          <div className="stat-top">

            <span className="stat-label">
              HIGH
            </span>

            <span className="stat-icon">
              ▲
            </span>

          </div>

          <strong>
            {high}
          </strong>

          <span className="stat-description">
            High priority events
          </span>

        </div>


        <div className="stat-card active">

          <div className="stat-top">

            <span className="stat-label">
              ACTIVE THREATS
            </span>

            <span className="stat-icon">
              ◉
            </span>

          </div>

          <strong>
            {activeThreats}
          </strong>

          <span className="stat-description">
            Unresolved threats
          </span>

        </div>

      </section>


      {/* ======================================================
          WORKFLOW
      ====================================================== */}

      <section className="workflow-summary">

        <div className="workflow-heading">

          <span>
            INCIDENT MANAGEMENT
          </span>

          <h2>
            Alert Workflow
          </h2>

        </div>


        <div className="workflow-items">

          <div className="workflow-stat">

            <div className="workflow-icon new">
              ●
            </div>

            <div className="workflow-content">

              <strong>
                {newAlerts}
              </strong>

              <span>
                New
              </span>

            </div>

          </div>


          <div className="workflow-stat">

            <div className="workflow-icon acknowledged">
              ✓
            </div>

            <div className="workflow-content">

              <strong>
                {acknowledged}
              </strong>

              <span>
                Acknowledged
              </span>

            </div>

          </div>


          <div className="workflow-stat">

            <div className="workflow-icon investigating">
              ⌕
            </div>

            <div className="workflow-content">

              <strong>
                {investigating}
              </strong>

              <span>
                Investigating
              </span>

            </div>

          </div>


          <div className="workflow-stat">

            <div className="workflow-icon resolved">
              ✓
            </div>

            <div className="workflow-content">

              <strong>
                {resolved}
              </strong>

              <span>
                Resolved
              </span>

            </div>

          </div>

        </div>

      </section>


      {/* ======================================================
          SECURITY EVENTS HEADER
      ====================================================== */}

      <section className="alerts-toolbar">

        <div className="toolbar-heading">

          <span>
            SECURITY EVENTS
          </span>

          <h2>
            Recent Threats
          </h2>

          <p>
            {filteredAlerts.length} events displayed
          </p>

        </div>


        <div className="toolbar-controls">

          <div className="search-wrapper">

            <span>
              ⌕
            </span>

            <input
              type="text"
              placeholder="Search alerts..."
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
            />

            {search && (
              <button
                className="clear-search"
                onClick={() => setSearch("")}
                type="button"
              >
                ×
              </button>
            )}

          </div>


          <button
            className="refresh-button"
            onClick={() => fetchAlerts(false)}
            disabled={refreshing}
          >

            <span className={refreshing ? "spin" : ""}>
              ↻
            </span>

            {refreshing
              ? "Updating..."
              : "Refresh"}

          </button>

        </div>

      </section>


      {/* ======================================================
          SEVERITY FILTERS
      ====================================================== */}

      <div className="severity-filters">

        {[
          {
            name: "All",
            count: totalAlerts
          },
          {
            name: "Critical",
            count: critical
          },
          {
            name: "High",
            count: high
          },
          {
            name: "Medium",
            count: medium
          },
          {
            name: "Low",
            count: low
          }
        ].map((item) => (

          <button
            key={item.name}
            type="button"
            className={
              filter === item.name
                ? "filter-button active"
                : "filter-button"
            }
            onClick={() => setFilter(item.name)}
          >

            <span>
              {item.name}
            </span>

            <small>
              {item.count}
            </small>

          </button>

        ))}

      </div>


      {/* ======================================================
          ALERT LIST
      ====================================================== */}

      <section className="alerts-list">

        {filteredAlerts.length === 0 ? (

          <div className="empty-alerts">

            <div className="empty-icon">
              ✓
            </div>

            <h3>
              No Security Events
            </h3>

            <p>
              No alerts match your current
              search or severity filter.
            </p>

            {(search || filter !== "All") && (
              <button
                onClick={() => {
                  setSearch("");
                  setFilter("All");
                }}
              >
                Clear Filters
              </button>
            )}

          </div>

        ) : (

          filteredAlerts.map((alert) => {

            const workflow =
              getWorkflowStatus(alert);

            const threatStatus =
              getThreatStatus(alert);

            const severityClass =
              getSeverityClass(
                alert.severity
              );

            return (

              <article
                className={`alert-card ${severityClass}`}
                key={alert.id}
              >

                {/* ==================================================
                    CARD HEADER
                ================================================== */}

                <div className="alert-card-header">

                  <div className="alert-title">

                    <div className="alert-title-row">

                      <h3>
                        {alert.threat_type ||
                          "Security Event"}
                      </h3>

                      <span
                        className={`severity-badge ${severityClass}`}
                      >
                        {alert.severity || "Low"}
                      </span>

                    </div>


                    <div
                      className={`threat-status ${threatStatus.className}`}
                    >

                      <span className="status-dot">
                        ●
                      </span>

                      {threatStatus.label}

                    </div>

                  </div>


                  <button
                    className="investigate-button"
                    type="button"
                    onClick={() =>
                      investigateAlert(
                        alert.id
                      )
                    }
                  >

                    Investigate

                    <span>
                      →
                    </span>

                  </button>

                </div>


                {/* ==================================================
                    METRICS
                ================================================== */}

                <div className="alert-metrics">

                  <div className="metric">

                    <span>
                      RISK SCORE
                    </span>

                    <strong>
                      {alert.risk_score ?? 0}
                      <small>
                        /100
                      </small>
                    </strong>

                  </div>


                  <div className="metric">

                    <span>
                      CONFIDENCE
                    </span>

                    <strong>
                      {alert.confidence ||
                        "0%"}
                    </strong>

                  </div>


                  <div className="metric">

                    <span>
                      PROTOCOL
                    </span>

                    <strong>
                      {getProtocol(alert)}
                    </strong>

                  </div>


                  <div className="metric">

                    <span>
                      DESTINATION
                    </span>

                    <strong>
                      Port{" "}
                      {getDestinationPort(
                        alert
                      )}
                    </strong>

                  </div>

                </div>


                {/* ==================================================
                    NETWORK INFORMATION
                ================================================== */}

                <div className="network-details">

                  <div>

                    <span>
                      SERVICE
                    </span>

                    <strong>
                      {getService(alert)}
                    </strong>

                  </div>


                  <div>

                    <span>
                      SOURCE PORT
                    </span>

                    <strong>
                      {getSourcePort(alert)}
                    </strong>

                  </div>


                  <div>

                    <span>
                      TIMESTAMP
                    </span>

                    <strong>
                      {formatDate(
                        alert.timestamp
                      )}
                    </strong>

                  </div>

                </div>


                {/* ==================================================
                    WORKFLOW FOOTER
                ================================================== */}

                <div className="alert-card-footer">

                  <div className="workflow-section">

                    <span className="workflow-label">
                      WORKFLOW STATUS
                    </span>

                    <span
                      className={`workflow-badge ${workflow.className}`}
                    >

                      <span className="workflow-badge-icon">
                        {workflow.icon}
                      </span>

                      {workflow.label}

                    </span>

                  </div>


                  <div className="alert-id">

                    <span>
                      ALERT ID
                    </span>

                    <code>
                      {alert.id}
                    </code>

                  </div>

                </div>

              </article>
            );
          })
        )}

      </section>


      {/* ======================================================
          FOOTER
      ====================================================== */}

      <footer className="alerts-footer">

        <div>
          <strong>
            🛡️ NetShield AI
          </strong>

          <span>
            Milestone 3 • Threat Alerts
          </span>
        </div>

        <span>
          {refreshing
            ? "Updating security events..."
            : "● Monitoring active • Auto refresh 5s"}
        </span>

      </footer>

    </div>
  );
}

export default ThreatAlerts;

