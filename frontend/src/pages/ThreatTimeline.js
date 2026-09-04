
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./ThreatTimeline.css";

const API_URL = "http://127.0.0.1:8000";

function ThreatTimeline() {
  const navigate = useNavigate();

  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("ALL");

  const fetchAlerts = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/monitoring/live-alerts`
      );

      if (Array.isArray(response.data?.alerts)) {
        setAlerts(response.data.alerts);
        setError("");
      } else {
        setAlerts([]);
      }
    } catch (err) {
      console.error("Threat Timeline error:", err);
      setError("Unable to load live security events.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();

    const interval = setInterval(fetchAlerts, 5000);

    return () => clearInterval(interval);
  }, []);

  /* =====================================================
     SORT ALERTS
  ===================================================== */

  const sortedAlerts = useMemo(() => {
    return [...alerts].sort((a, b) => {
      return (
        new Date(b?.timestamp || 0) -
        new Date(a?.timestamp || 0)
      );
    });
  }, [alerts]);

  /* =====================================================
     FILTER ALERTS
  ===================================================== */

  const filteredAlerts = useMemo(() => {
    switch (filter) {
      case "THREATS":
        return sortedAlerts.filter(
          (alert) =>
            alert?.status === "Threat Detected"
        );

      case "NORMAL":
        return sortedAlerts.filter(
          (alert) =>
            alert?.status === "Normal"
        );

      case "CRITICAL":
        return sortedAlerts.filter(
          (alert) =>
            alert?.severity?.toLowerCase() === "critical"
        );

      case "ALL":
      default:
        return sortedAlerts;
    }
  }, [sortedAlerts, filter]);

  /* =====================================================
     STATISTICS
  ===================================================== */

  const totalEvents = alerts.length;

  const threats = alerts.filter(
    (alert) =>
      alert?.status === "Threat Detected"
  ).length;

  const normal = alerts.filter(
    (alert) =>
      alert?.status === "Normal"
  ).length;

  const critical = alerts.filter(
    (alert) =>
      alert?.severity?.toLowerCase() === "critical"
  ).length;

  const highRisk = alerts.filter(
    (alert) =>
      Number(alert?.risk_score || 0) >= 60
  ).length;

  /* =====================================================
     LOADING
  ===================================================== */

  if (loading) {
    return (
      <div className="timeline-loading">
        <div className="timeline-loading-icon">
          🛡️
        </div>

        <h2>Loading Threat Timeline</h2>

        <p>
          Connecting to NetShield AI monitoring engine...
        </p>
      </div>
    );
  }

  return (
    <div className="timeline-page">

      {/* =================================================
          SIDEBAR
      ================================================= */}

      <aside className="timeline-sidebar">

        <div className="timeline-sidebar-logo">
          <span>🛡️</span>

          <div>
            <strong>NetShield</strong>
            <small>AI SECURITY</small>
          </div>
        </div>

        <nav className="timeline-sidebar-nav">

          <button
            onClick={() => navigate("/dashboard")}
          >
            <span>▣</span>
            Dashboard
          </button>

          <button
            onClick={() => navigate("/live-network")}
          >
            <span>◉</span>
            Live Monitor
          </button>

          <button
            onClick={() => navigate("/threat-alerts")}
          >
            <span>⚠</span>
            Threat Alerts
          </button>

          <button
            onClick={() => navigate("/analytics")}
          >
            <span>▤</span>
            Analytics
          </button>

          <button
            onClick={() => navigate("/predictions")}
          >
            <span>✦</span>
            AI Predictions
          </button>

          <button className="active">
            <span>◷</span>
            Threat Timeline
          </button>

          <button
            onClick={() => navigate("/threat-alerts")}
          >
            <span>⌕</span>
            Investigations
          </button>

        </nav>

      </aside>

      {/* =================================================
          MAIN CONTENT
      ================================================= */}

      <main className="timeline-main">

        {/* =================================================
            HEADER
        ================================================= */}

        <header className="timeline-header">

          <div>
            <div className="timeline-label">
              SECURITY / TIMELINE
            </div>

            <h1>
              Threat Timeline
            </h1>

            <p>
              Real-time visualization of detected
              network security events.
            </p>
          </div>

          <div className="timeline-live">
            <span></span>
            LIVE MONITORING
          </div>

        </header>

        {/* =================================================
            ERROR
        ================================================= */}

        {error && (
          <div className="timeline-error">
            ⚠️ {error}
          </div>
        )}

        {/* =================================================
            SUMMARY CARDS
        ================================================= */}

        <section className="timeline-summary">

          <div className="timeline-summary-card">
            <span>TOTAL EVENTS</span>

            <strong>
              {totalEvents}
            </strong>
          </div>

          <div className="timeline-summary-card threat">
            <span>THREATS</span>

            <strong>
              {threats}
            </strong>
          </div>

          <div className="timeline-summary-card normal">
            <span>NORMAL</span>

            <strong>
              {normal}
            </strong>
          </div>

          <div className="timeline-summary-card risk">
            <span>HIGH RISK</span>

            <strong>
              {highRisk}
            </strong>
          </div>

        </section>

        {/* =================================================
            MAIN PANEL
        ================================================= */}

        <section className="timeline-panel">

          <div className="timeline-panel-header">

            <div>
              <span>
                SECURITY EVENTS
              </span>

              <h2>
                Network Threat Timeline
              </h2>
            </div>

            <div className="refresh-label">
              Auto refresh: 5s
            </div>

          </div>

          {/* =================================================
              FILTERS
          ================================================= */}

          <div className="timeline-filters">

            <button
              className={
                filter === "ALL"
                  ? "timeline-filter active"
                  : "timeline-filter"
              }
              onClick={() => setFilter("ALL")}
            >
              ALL
              <span>{totalEvents}</span>
            </button>

            <button
              className={
                filter === "THREATS"
                  ? "timeline-filter active threat-filter"
                  : "timeline-filter"
              }
              onClick={() => setFilter("THREATS")}
            >
              THREATS
              <span>{threats}</span>
            </button>

            <button
              className={
                filter === "NORMAL"
                  ? "timeline-filter active normal-filter"
                  : "timeline-filter"
              }
              onClick={() => setFilter("NORMAL")}
            >
              NORMAL
              <span>{normal}</span>
            </button>

            <button
              className={
                filter === "CRITICAL"
                  ? "timeline-filter active critical-filter"
                  : "timeline-filter"
              }
              onClick={() => setFilter("CRITICAL")}
            >
              CRITICAL
              <span>{critical}</span>
            </button>

          </div>

          {/* =================================================
              ACTIVE FILTER
          ================================================= */}

          <div className="timeline-filter-status">
            Showing{" "}
            <strong>
              {filteredAlerts.length}
            </strong>{" "}
            {filter.toLowerCase()} event
            {filteredAlerts.length !== 1 ? "s" : ""}
          </div>

          {/* =================================================
              EMPTY STATE
          ================================================= */}

          {filteredAlerts.length === 0 ? (

            <div className="timeline-empty">

              <div>🛡️</div>

              <h3>
                No Security Events
              </h3>

              <p>
                No network security events match
                the selected filter.
              </p>

            </div>

          ) : (

            /* =================================================
               TIMELINE
            ================================================= */

            <div className="timeline">

              {filteredAlerts.map(
                (alert, index) => {

                  const isThreat =
                    alert?.status ===
                    "Threat Detected";

                  const severity =
                    (
                      alert?.severity ||
                      "Low"
                    ).toLowerCase();

                  const risk =
                    Number(
                      alert?.risk_score || 0
                    );

                  return (

                    <div
                      className="timeline-item"
                      key={
                        alert?._id ||
                        alert?.timestamp ||
                        index
                      }
                    >

                      {/* TIME */}

                      <div className="timeline-time">

                        <strong>
                          {alert?.timestamp
                            ? new Date(
                                alert.timestamp
                              ).toLocaleTimeString()
                            : "--"}
                        </strong>

                        <span>
                          {alert?.timestamp
                            ? new Date(
                                alert.timestamp
                              ).toLocaleDateString()
                            : "--"}
                        </span>

                      </div>

                      {/* LINE */}

                      <div className="timeline-line">

                        <div
                          className={
                            isThreat
                              ? "timeline-dot threat-dot"
                              : "timeline-dot normal-dot"
                          }
                        ></div>

                      </div>

                      {/* EVENT */}

                      <div
                        className={
                          isThreat
                            ? "timeline-event threat-event"
                            : "timeline-event normal-event"
                        }
                      >

                        {/* TOP */}

                        <div className="timeline-event-top">

                          <div>

                            <span
                              className={
                                isThreat
                                  ? "event-indicator threat-indicator"
                                  : "event-indicator normal-indicator"
                              }
                            ></span>

                            <strong>
                              {alert?.threat_type ||
                                "Network Event"}
                            </strong>

                          </div>

                          <span
                            className={`timeline-severity ${severity}`}
                          >
                            {alert?.severity ||
                              "Low"}
                          </span>

                        </div>

                        {/* DETAILS */}

                        <div className="timeline-details">

                          <div>
                            <span>
                              Risk Score
                            </span>

                            <strong
                              className={
                                risk >= 60
                                  ? "risk-high"
                                  : "risk-normal"
                              }
                            >
                              {risk}/100
                            </strong>
                          </div>

                          <div>
                            <span>
                              Confidence
                            </span>

                            <strong>
                              {alert?.confidence ||
                                `${alert?.confidence_value || 0}%`}
                            </strong>
                          </div>

                          <div>
                            <span>
                              Status
                            </span>

                            <strong>
                              {alert?.status ||
                                "Unknown"}
                            </strong>
                          </div>

                          <div>
                            <span>
                              Protocol
                            </span>

                            <strong>
                              {(
                                alert?.protocol_type ||
                                "Unknown"
                              ).toUpperCase()}
                            </strong>
                          </div>

                        </div>

                        {/* NETWORK DETAILS */}

                        <div className="timeline-network-details">

                          <div>
                            <span>
                              Service
                            </span>

                            <strong>
                              {alert?.service ||
                                "Unknown"}
                            </strong>
                          </div>

                          <div>
                            <span>
                              Source Port
                            </span>

                            <strong>
                              {alert?.source_port ?? "--"}
                            </strong>
                          </div>

                          <div>
                            <span>
                              Destination Port
                            </span>

                            <strong>
                              {alert?.destination_port ?? "--"}
                            </strong>
                          </div>

                          <div>
                            <span>
                              Connections
                            </span>

                            <strong>
                              {alert?.connection_count ?? "--"}
                            </strong>
                          </div>

                        </div>

                      </div>

                    </div>
                  );
                }
              )}

            </div>
          )}

        </section>

        {/* =================================================
            FOOTER
        ================================================= */}

        <footer className="timeline-footer">

          <div>
            <span>🛡️</span>

            <strong>
              NetShield AI
            </strong>
          </div>

          <span>
            Milestone 4 • Testing & Performance
          </span>

        </footer>

      </main>

    </div>
  );
}

export default ThreatTimeline;

