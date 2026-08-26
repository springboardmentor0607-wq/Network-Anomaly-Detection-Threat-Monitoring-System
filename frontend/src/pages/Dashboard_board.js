import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "./Dashboard.css";

const API_URL = "http://127.0.0.1:8000";

function Dashboard() {
  // ============================================================
  // STATE
  // ============================================================

  const [alerts, setAlerts] = useState([]);

  const [networkStatus, setNetworkStatus] = useState({
    incoming_packets: 0,
    outgoing_packets: 0,
    suspicious_connections: 0,
    bandwidth_usage: 0,
    total_alerts: 0,
    active_threats: 0,
    critical_threats: 0,
  });

  const [selectedAlert, setSelectedAlert] = useState(null);
  const [investigation, setInvestigation] = useState(null);
  const [loadingInvestigation, setLoadingInvestigation] = useState(false);

  const [loading, setLoading] = useState(true);
  const [backendError, setBackendError] = useState("");

  // ============================================================
  // FETCH LIVE ALERTS
  // ============================================================

  const fetchAlerts = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/monitoring/live-alerts`
      );

      const data = response.data;

      if (Array.isArray(data)) {
        setAlerts(data);
      } else if (Array.isArray(data?.alerts)) {
        setAlerts(data.alerts);
      } else {
        setAlerts([]);
      }

      setBackendError("");
    } catch (error) {
      console.error("Live alerts error:", error);

      setBackendError(
        "Unable to connect to live monitoring API."
      );
    }
  };

  // ============================================================
  // FETCH NETWORK STATUS
  // ============================================================

  const fetchNetworkStatus = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/monitoring/status`
      );

      const data = response.data || {};

      setNetworkStatus((previous) => ({
        ...previous,

        incoming_packets:
          Number(data.incoming_packets) || 0,

        outgoing_packets:
          Number(data.outgoing_packets) || 0,

        suspicious_connections:
          Number(data.suspicious_connections) || 0,

        bandwidth_usage:
          Number(data.bandwidth_usage) || 0,

        total_alerts:
          Number(data.total_alerts) || 0,

        active_threats:
          Number(data.active_threats) || 0,

        critical_threats:
          Number(data.critical_threats) || 0,
      }));
    } catch (error) {
      console.error("Network status error:", error);
    }
  };

  // ============================================================
  // INITIAL LOAD + AUTO REFRESH
  // ============================================================

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);

      await Promise.all([
        fetchAlerts(),
        fetchNetworkStatus(),
      ]);

      setLoading(false);
    };

    loadDashboard();

    const interval = setInterval(() => {
      fetchAlerts();
      fetchNetworkStatus();
    }, 5000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  // ============================================================
  // STATISTICS
  // ============================================================

  const totalAlerts = alerts.length;

  const threatAlerts = alerts.filter(
    (alert) =>
      alert?.status === "Threat Detected"
  ).length;

  const criticalAlerts = alerts.filter(
    (alert) =>
      String(alert?.severity || "").toLowerCase() ===
      "critical"
  ).length;

  const highAlerts = alerts.filter(
    (alert) =>
      String(alert?.severity || "").toLowerCase() ===
      "high"
  ).length;

  const normalAlerts = alerts.filter(
    (alert) =>
      alert?.status !== "Threat Detected"
  ).length;

  // ============================================================
  // AVERAGE RISK
  // ============================================================

  const averageRisk = useMemo(() => {
    if (alerts.length === 0) {
      return 0;
    }

    const totalRisk = alerts.reduce(
      (sum, alert) =>
        sum + Number(alert?.risk_score || 0),
      0
    );

    return Math.round(
      totalRisk / alerts.length
    );
  }, [alerts]);

  // ============================================================
  // SECURITY SCORE
  // ============================================================

  const securityScore = Math.max(
    0,
    Math.min(
      100,
      100 - averageRisk
    )
  );

  // ============================================================
  // THREAT DISTRIBUTION
  // ============================================================

  const threatDistribution = useMemo(() => {
    const distribution = {};

    alerts.forEach((alert) => {
      const threat =
        alert?.threat_type ||
        "Unknown";

      distribution[threat] =
        (distribution[threat] || 0) + 1;
    });

    return Object.entries(distribution)
      .sort((a, b) => b[1] - a[1]);
  }, [alerts]);

  // ============================================================
  // RECENT ALERTS
  // ============================================================

  const recentAlerts = useMemo(() => {
    return [...alerts]
      .sort((a, b) => {
        const dateA = new Date(
          a?.timestamp || 0
        );

        const dateB = new Date(
          b?.timestamp || 0
        );

        return dateB - dateA;
      })
      .slice(0, 20);
  }, [alerts]);

  // ============================================================
  // THREAT TIMELINE
  // ============================================================

  const timelineAlerts = useMemo(() => {
    return [...alerts]
      .sort((a, b) => {
        const dateA = new Date(
          a?.timestamp || 0
        );

        const dateB = new Date(
          b?.timestamp || 0
        );

        return dateA - dateB;
      })
      .slice(-10);
  }, [alerts]);

  // ============================================================
  // INVESTIGATE ALERT
  // ============================================================

  const investigateAlert = async (alert) => {
    if (!alert?._id) {
      return;
    }

    setSelectedAlert(alert);
    setInvestigation(null);
    setLoadingInvestigation(true);

    try {
      const response = await axios.get(
        `${API_URL}/monitoring/investigate/${alert._id}`
      );

      setInvestigation(response.data);
    } catch (error) {
      console.error(
        "Investigation error:",
        error
      );

      setInvestigation({
        investigation: {
          priority: "Unavailable",
          recommendation:
            "Unable to retrieve investigation details.",
        },
      });
    } finally {
      setLoadingInvestigation(false);
    }
  };

  // ============================================================
  // CLOSE INVESTIGATION
  // ============================================================

  const closeInvestigation = () => {
    setSelectedAlert(null);
    setInvestigation(null);
  };

  // ============================================================
  // FORMAT TIME
  // ============================================================

  const formatTime = (timestamp) => {
    if (!timestamp) {
      return "--";
    }

    const date = new Date(timestamp);

    if (Number.isNaN(date.getTime())) {
      return "--";
    }

    return date.toLocaleTimeString();
  };

  // ============================================================
  // FORMAT DATE
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
  // LOADING SCREEN
  // ============================================================

  if (loading) {
    return (
      <div className="dashboard-loading">

        <div className="loading-shield">
          🛡️
        </div>

        <h2>
          NetShield AI
        </h2>

        <p>
          Connecting to Security Operations Center...
        </p>

        <div className="loading-bar">
          <div></div>
        </div>

      </div>
    );
  }

  // ============================================================
  // DASHBOARD
  // ============================================================

  return (
    <div className="dashboard">

      {/* ======================================================
          SIDEBAR
      ====================================================== */}

      <aside className="sidebar">

        <div className="sidebar-logo">

          <div className="logo-icon">
            🛡️
          </div>

          <div>
            <h2>
              NetShield
            </h2>

            <span>
              AI SECURITY
            </span>
          </div>

        </div>

        {/* MONITORING */}

        <div className="sidebar-section">

          <p>
            MONITORING
          </p>

          <a
            href="#dashboard"
            className="nav-item active"
          >
            <span>
              ▦
            </span>

            Dashboard
          </a>

          <a
            href="#network"
            className="nav-item"
          >
            <span>
              ◉
            </span>

            Live Network
          </a>

          <a
            href="#alerts"
            className="nav-item"
          >
            <span>
              ⚠
            </span>

            Threat Alerts
          </a>

          <a
            href="#analysis"
            className="nav-item"
          >
            <span>
              ⌁
            </span>

            Threat Analysis
          </a>

        </div>

        {/* INTELLIGENCE */}

        <div className="sidebar-section">

          <p>
            INTELLIGENCE
          </p>

          <a
            href="#predictions"
            className="nav-item"
          >
            <span>
              ✦
            </span>

            AI Predictions
          </a>

          <a
            href="#timeline"
            className="nav-item"
          >
            <span>
              ◷
            </span>

            Threat Timeline
          </a>

        </div>

        {/* SIDEBAR STATUS */}

        <div className="sidebar-bottom">

          <div className="system-card">

            <span className="system-dot"></span>

            <div>

              <strong>
                Operational
              </strong>

              <span>
                AI monitoring active
              </span>

            </div>

          </div>

        </div>

      </aside>

      {/* ======================================================
          MAIN CONTENT
      ====================================================== */}

      <main className="main-content">

        {/* ====================================================
            TOP BAR
        ==================================================== */}

        <header className="topbar">

          <div>

            <div className="topbar-label">
              SECURITY / DASHBOARD
            </div>

            <h1>
              Security Operations Center
            </h1>

          </div>

          <div className="topbar-right">

            <div className="live-status">

              <span></span>

              SYSTEM ONLINE

            </div>

            <div className="topbar-time">
              Auto refresh: 5s
            </div>

          </div>

        </header>

        {/* ====================================================
            ERROR
        ==================================================== */}

        {backendError && (
          <div className="dashboard-error">
            ⚠️ {backendError}
          </div>
        )}

        {/* ====================================================
            HERO
        ==================================================== */}

        <section
          className="hero-section"
          id="dashboard"
        >

          <div>

            <div className="hero-label">
              LIVE SECURITY MONITORING
            </div>

            <h2>
              Network Threat Intelligence
            </h2>

            <p>
              AI-powered real-time network
              anomaly detection and threat
              monitoring.
            </p>

          </div>

          <div className="hero-security">

            <div className="security-ring">

              <span>
                {securityScore}
              </span>

            </div>

            <div>

              <strong>
                SECURITY SCORE
              </strong>

              <span>
                / 100
              </span>

            </div>

          </div>

        </section>

        {/* ====================================================
            STATISTICS
        ==================================================== */}

        <section className="stats-grid">

          {/* TOTAL */}

          <div className="stat-card blue">

            <div className="stat-top">

              <span>
                Total Alerts
              </span>

              <span className="stat-symbol">
                ◉
              </span>

            </div>

            <strong>
              {totalAlerts}
            </strong>

            <small>
              Live security events
            </small>

          </div>

          {/* THREATS */}

          <div className="stat-card red">

            <div className="stat-top">

              <span>
                Threats Detected
              </span>

              <span className="stat-symbol">
                ⚠
              </span>

            </div>

            <strong>
              {threatAlerts}
            </strong>

            <small>
              Active security threats
            </small>

          </div>

          {/* CRITICAL */}

          <div className="stat-card critical">

            <div className="stat-top">

              <span>
                Critical Threats
              </span>

              <span className="stat-symbol">
                !
              </span>

            </div>

            <strong>
              {criticalAlerts}
            </strong>

            <small>
              Immediate attention
            </small>

          </div>

          {/* RISK */}

          <div className="stat-card purple">

            <div className="stat-top">

              <span>
                Average Risk
              </span>

              <span className="stat-symbol">
                ⌁
              </span>

            </div>

            <strong>

              {averageRisk}

              <small className="score">
                /100
              </small>

            </strong>

            <small>
              Overall network risk
            </small>

          </div>

        </section>

        {/* ====================================================
            NETWORK TELEMETRY
        ==================================================== */}

        <section
          className="content-grid"
          id="network"
        >

          <div className="panel">

            <div className="panel-header">

              <div>

                <span>
                  NETWORK TELEMETRY
                </span>

                <h3>
                  Live Network Activity
                </h3>

              </div>

              <span className="live-badge">
                ● LIVE
              </span>

            </div>

            <div className="network-metrics">

              {/* INCOMING */}

              <div className="metric">

                <div className="metric-icon incoming">
                  ↓
                </div>

                <div>

                  <span>
                    Incoming Packets
                  </span>

                  <strong>
                    {Number(
                      networkStatus.incoming_packets
                    ).toLocaleString()}
                  </strong>

                </div>

              </div>

              {/* OUTGOING */}

              <div className="metric">

                <div className="metric-icon outgoing">
                  ↑
                </div>

                <div>

                  <span>
                    Outgoing Packets
                  </span>

                  <strong>
                    {Number(
                      networkStatus.outgoing_packets
                    ).toLocaleString()}
                  </strong>

                </div>

              </div>

              {/* SUSPICIOUS */}

              <div className="metric">

                <div className="metric-icon suspicious">
                  ⚠
                </div>

                <div>

                  <span>
                    Suspicious Connections
                  </span>

                  <strong>
                    {Number(
                      networkStatus.suspicious_connections
                    ).toLocaleString()}
                  </strong>

                </div>

              </div>

              {/* BANDWIDTH */}

              <div className="metric">

                <div className="metric-icon bandwidth-icon">
                  ◌
                </div>

                <div className="bandwidth-content">

                  <div className="bandwidth-title">

                    <span>
                      Bandwidth Usage
                    </span>

                    <strong>
                      {networkStatus.bandwidth_usage}%
                    </strong>

                  </div>

                  <div className="progress">

                    <div
                      className="progress-fill"
                      style={{
                        width: `${Math.min(
                          Number(
                            networkStatus.bandwidth_usage
                          ) || 0,
                          100
                        )}%`,
                      }}
                    ></div>

                  </div>

                </div>

              </div>

            </div>

          </div>

          {/* ==================================================
              THREAT DISTRIBUTION
          ================================================== */}

          <div
            className="panel"
            id="analysis"
          >

            <div className="panel-header">

              <div>

                <span>
                  AI CLASSIFICATION
                </span>

                <h3>
                  Threat Distribution
                </h3>

              </div>

            </div>

            <div className="distribution">

              {threatDistribution.length === 0 ? (

                <div className="no-events">
                  No threat data available.
                </div>

              ) : (

                threatDistribution.map(
                  ([name, count], index) => {

                    const percentage =
                      totalAlerts > 0
                        ? Math.round(
                            (count /
                              totalAlerts) *
                              100
                          )
                        : 0;

                    return (
                      <div
                        className="distribution-row"
                        key={name}
                      >

                        <div>

                          <span
                            className={`legend ${
                              name ===
                              "Normal Traffic"
                                ? "normal-dot"
                                : "critical-dot"
                            }`}
                          ></span>

                          <span>
                            {name}
                          </span>

                        </div>

                        <strong>
                          {count} ({percentage}%)
                        </strong>

                      </div>
                    );
                  }
                )

              )}

            </div>

          </div>

        </section>

        {/* ====================================================
            THREAT SUMMARY
        ==================================================== */}

        <section className="stats-grid">

          <div className="stat-card blue">

            <div className="stat-top">

              <span>
                Normal Traffic
              </span>

              <span className="stat-symbol">
                ✓
              </span>

            </div>

            <strong>
              {normalAlerts}
            </strong>

            <small>
              Safe network events
            </small>

          </div>

          <div className="stat-card red">

            <div className="stat-top">

              <span>
                High Severity
              </span>

              <span className="stat-symbol">
                ⚠
              </span>

            </div>

            <strong>
              {highAlerts}
            </strong>

            <small>
              High priority events
            </small>

          </div>

          <div className="stat-card critical">

            <div className="stat-top">

              <span>
                Active Threats
              </span>

              <span className="stat-symbol">
                !
              </span>

            </div>

            <strong>
              {threatAlerts}
            </strong>

            <small>
              Threat detected events
            </small>

          </div>

          <div className="stat-card purple">

            <div className="stat-top">

              <span>
                Monitoring
              </span>

              <span className="stat-symbol">
                ●
              </span>

            </div>

            <strong>
              LIVE
            </strong>

            <small>
              Continuous monitoring active
            </small>

          </div>

        </section>

        {/* ====================================================
            LIVE ALERT TABLE
        ==================================================== */}

        <section
          className="events-panel"
          id="alerts"
        >

          <div className="panel-header">

            <div>

              <span>
                SECURITY EVENTS
              </span>

              <h3>
                Live Threat Activity
              </h3>

            </div>

            <div className="event-count">
              {totalAlerts} EVENTS
            </div>

          </div>

          <div className="events-table">

            <div className="events-header">

              <span>
                TIME
              </span>

              <span>
                THREAT
              </span>

              <span>
                SEVERITY
              </span>

              <span>
                RISK SCORE
              </span>

              <span>
                CONFIDENCE
              </span>

              <span>
                STATUS
              </span>

              <span>
                ACTION
              </span>

            </div>

            {recentAlerts.length === 0 ? (

              <div className="no-events">

                <div className="no-events-icon">
                  🛡️
                </div>

                <h3>
                  No security alerts
                </h3>

                <p>
                  Network activity is currently normal.
                </p>

              </div>

            ) : (

              recentAlerts.map(
                (alert, index) => {

                  const severity =
                    alert?.severity || "Low";

                  const status =
                    alert?.status || "Unknown";

                  const risk =
                    Number(
                      alert?.risk_score || 0
                    );

                  const isThreat =
                    status ===
                    "Threat Detected";

                  return (

                    <div
                      className="event-row"
                      key={
                        alert?._id ||
                        alert?.timestamp ||
                        index
                      }
                    >

                      <span className="event-time">

                        {formatTime(
                          alert?.timestamp
                        )}

                      </span>

                      <span className="event-threat">

                        <span
                          className={
                            isThreat
                              ? "threat-dot"
                              : "normal-dot"
                          }
                        ></span>

                        {alert?.threat_type ||
                          "Network Event"}

                      </span>

                      <span>

                        <span
                          className={`severity ${String(
                            severity
                          ).toLowerCase()}`}
                        >
                          {severity}
                        </span>

                      </span>

                      <span className="risk-score">

                        {risk}/100

                      </span>

                      <span className="confidence">

                        {alert?.confidence ||
                          `${alert?.confidence_value || 0}%`}

                      </span>

                      <span>

                        <span
                          className={
                            isThreat
                              ? "status threat-status"
                              : "status normal-status"
                          }
                        >
                          {status}
                        </span>

                      </span>

                      <span>

                        <button
                          className="investigate-button"
                          onClick={() =>
                            investigateAlert(alert)
                          }
                        >
                          Investigate
                        </button>

                      </span>

                    </div>

                  );
                }
              )

            )}

          </div>

        </section>

        {/* ====================================================
            THREAT TIMELINE
        ==================================================== */}

        <section
          className="events-panel"
          id="timeline"
        >

          <div className="panel-header">

            <div>

              <span>
                SECURITY INTELLIGENCE
              </span>

              <h3>
                Threat Timeline
              </h3>

            </div>

            <div className="event-count">
              LAST 10 EVENTS
            </div>

          </div>

          <div className="timeline">

            {timelineAlerts.length === 0 ? (

              <div className="no-events">
                No timeline events available.
              </div>

            ) : (

              timelineAlerts.map(
                (alert, index) => {

                  const isThreat =
                    alert?.status ===
                    "Threat Detected";

                  const risk =
                    Number(
                      alert?.risk_score || 0
                    );

                  return (

                    <div
                      className="timeline-item"
                      key={
                        alert?._id ||
                        `timeline-${index}`
                      }
                    >

                      <div
                        className={
                          isThreat
                            ? "timeline-dot threat-dot"
                            : "timeline-dot normal-dot"
                        }
                      ></div>

                      <div className="timeline-content">

                        <div className="timeline-time">
                          {formatDate(
                            alert?.timestamp
                          )}
                        </div>

                        <h4>
                          {alert?.threat_type ||
                            "Network Event"}
                        </h4>

                        <p>

                          Severity:
                          {" "}
                          {alert?.severity ||
                            "Unknown"}

                          {" • "}

                          Risk:
                          {" "}
                          {risk}/100

                          {" • "}

                          Confidence:
                          {" "}
                          {alert?.confidence ||
                            `${alert?.confidence_value || 0}%`}

                        </p>

                        <span
                          className={
                            isThreat
                              ? "status threat-status"
                              : "status normal-status"
                          }
                        >
                          {alert?.status ||
                            "Unknown"}
                        </span>

                      </div>

                    </div>

                  );
                }
              )

            )}

          </div>

        </section>

        {/* ====================================================
            AI PREDICTIONS
        ==================================================== */}

        <section
          className="events-panel"
          id="predictions"
        >

          <div className="panel-header">

            <div>

              <span>
                AI INTELLIGENCE
              </span>

              <h3>
                AI Security Predictions
              </h3>

            </div>

          </div>

          <div className="prediction-grid">

            <div className="prediction-card">

              <span>
                DETECTION STATUS
              </span>

              <strong>
                {threatAlerts > 0
                  ? "THREATS DETECTED"
                  : "NORMAL"}
              </strong>

              <p>
                AI model is continuously
                analyzing incoming network
                events.
              </p>

            </div>

            <div className="prediction-card">

              <span>
                RISK LEVEL
              </span>

              <strong>
                {averageRisk >= 80
                  ? "CRITICAL"
                  : averageRisk >= 60
                  ? "HIGH"
                  : averageRisk >= 30
                  ? "MEDIUM"
                  : "LOW"}
              </strong>

              <p>
                Current average network risk
                score is {averageRisk}/100.
              </p>

            </div>

            <div className="prediction-card">

              <span>
                MODEL CONFIDENCE
              </span>

              <strong>
                {alerts.length > 0
                  ? Math.round(
                      alerts.reduce(
                        (sum, alert) =>
                          sum +
                          Number(
                            alert?.confidence_value ||
                              0
                          ),
                        0
                      ) /
                        alerts.length
                    )
                  : 0}
                %
              </strong>

              <p>
                Average confidence of recent
                network classifications.
              </p>

            </div>

          </div>

        </section>

        {/* ====================================================
            INVESTIGATION MODAL
        ==================================================== */}

        {selectedAlert && (

          <div
            className="investigation-overlay"
            onClick={closeInvestigation}
          >

            <div
              className="investigation-modal"
              onClick={(event) =>
                event.stopPropagation()
              }
            >

              <div className="investigation-header">

                <div>

                  <span>
                    SECURITY INVESTIGATION
                  </span>

                  <h2>
                    Alert Investigation
                  </h2>

                </div>

                <button
                  className="close-button"
                  onClick={closeInvestigation}
                >
                  ✕
                </button>

              </div>

              {loadingInvestigation ? (

                <div className="investigation-loading">

                  <div className="loading-shield">
                    🛡️
                  </div>

                  <p>
                    Analyzing security event...
                  </p>

                </div>

              ) : (

                <div className="investigation-body">

                  {/* THREAT SUMMARY */}

                  <div className="investigation-section">

                    <h3>
                      Threat Summary
                    </h3>

                    <div className="investigation-grid">

                      <div>
                        <span>
                          Threat Type
                        </span>

                        <strong>
                          {investigation?.threat_type ||
                            selectedAlert?.threat_type ||
                            "Unknown"}
                        </strong>
                      </div>

                      <div>
                        <span>
                          Severity
                        </span>

                        <strong>
                          {investigation?.severity ||
                            selectedAlert?.severity ||
                            "Unknown"}
                        </strong>
                      </div>

                      <div>
                        <span>
                          Risk Score
                        </span>

                        <strong>
                          {investigation?.risk_score ??
                            selectedAlert?.risk_score ??
                            0}
                          /100
                        </strong>
                      </div>

                      <div>
                        <span>
                          Confidence
                        </span>

                        <strong>
                          {investigation?.confidence ||
                            selectedAlert?.confidence ||
                            "0%"}
                        </strong>
                      </div>

                      <div>
                        <span>
                          Status
                        </span>

                        <strong>
                          {investigation?.status ||
                            selectedAlert?.status ||
                            "Unknown"}
                        </strong>
                      </div>

                      <div>
                        <span>
                          Timestamp
                        </span>

                        <strong>
                          {formatDate(
                            investigation?.timestamp ||
                              selectedAlert?.timestamp
                          )}
                        </strong>
                      </div>

                    </div>

                  </div>

                  {/* NETWORK DETAILS */}

                  <div className="investigation-section">

                    <h3>
                      Network Details
                    </h3>

                    <div className="investigation-grid">

                      <div>
                        <span>
                          Packet Size
                        </span>

                        <strong>
                          {investigation?.packet_size ??
                            selectedAlert?.packet_size ??
                            0}
                        </strong>
                      </div>

                      <div>
                        <span>
                          Duration
                        </span>

                        <strong>
                          {investigation?.duration ??
                            selectedAlert?.duration ??
                            0}
                        </strong>
                      </div>

                      <div>
                        <span>
                          Connections
                        </span>

                        <strong>
                          {investigation?.connection_count ??
                            selectedAlert?.connection_count ??
                            0}
                        </strong>
                      </div>

                      <div>
                        <span>
                          Source Port
                        </span>

                        <strong>
                          {investigation?.source_port ??
                            selectedAlert?.source_port ??
                            "Unknown"}
                        </strong>
                      </div>

                      <div>
                        <span>
                          Destination Port
                        </span>

                        <strong>
                          {investigation?.destination_port ??
                            selectedAlert?.destination_port ??
                            "Unknown"}
                        </strong>
                      </div>

                      <div>
                        <span>
                          Protocol
                        </span>

                        <strong>
                          {investigation?.protocol_type ??
                            selectedAlert?.protocol_type ??
                            "Unknown"}
                        </strong>
                      </div>

                      <div>
                        <span>
                          Service
                        </span>

                        <strong>
                          {investigation?.service ??
                            selectedAlert?.service ??
                            "Unknown"}
                        </strong>
                      </div>

                      <div>
                        <span>
                          Flag
                        </span>

                        <strong>
                          {investigation?.flag ??
                            selectedAlert?.flag ??
                            "Unknown"}
                        </strong>
                      </div>

                    </div>

                  </div>

                  {/* INVESTIGATION RESULT */}

                  <div className="investigation-section">

                    <h3>
                      Investigation Result
                    </h3>

                    <div className="investigation-result">

                      <div>

                        <span>
                          PRIORITY
                        </span>

                        <strong>
                          {investigation
                            ?.investigation
                            ?.priority ||
                            "Unknown"}
                        </strong>

                      </div>

                      <div>

                        <span>
                          RECOMMENDATION
                        </span>

                        <p>
                          {investigation
                            ?.investigation
                            ?.recommendation ||
                            "Review the security event."}
                        </p>

                      </div>

                    </div>

                  </div>

                </div>

              )}

            </div>

          </div>

        )}

        {/* ====================================================
            FOOTER
        ==================================================== */}

        <footer className="dashboard-footer">

          <div>

            <span className="footer-shield">
              🛡️
            </span>

            <strong>
              NetShield AI
            </strong>

            <span>
              AI-Powered Network Anomaly Detection
            </span>

          </div>

          <div className="footer-status">

            <span></span>

            All systems operational

          </div>

          <div>
            Milestone 3 • SOC Dashboard
          </div>

        </footer>

      </main>

    </div>
  );
}

export default Dashboard;