
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";

const API_URL = "http://127.0.0.1:8000";

function Dashboard() {
  const navigate = useNavigate();

  const [alerts, setAlerts] = useState([]);

  const [networkStatus, setNetworkStatus] = useState({
    total_alerts: 0,
    active_threats: 0,
    critical_threats: 0,
    incoming_packets: 0,
    outgoing_packets: 0,
    suspicious_connections: 0,
    bandwidth_usage: 0,
  });

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

      setNetworkStatus({
        total_alerts: Number(data.total_alerts) || 0,
        active_threats: Number(data.active_threats) || 0,
        critical_threats: Number(data.critical_threats) || 0,

        incoming_packets:
          Number(data.incoming_packets) || 0,

        outgoing_packets:
          Number(data.outgoing_packets) || 0,

        suspicious_connections:
          Number(data.suspicious_connections) || 0,

        bandwidth_usage:
          Number(data.bandwidth_usage) || 0,
      });
    } catch (error) {
      console.error("Network status error:", error);
    }
  };

  // ============================================================
  // INITIAL LOAD + AUTO REFRESH
  // ============================================================

  useEffect(() => {
    let mounted = true;

    const loadDashboard = async () => {
      if (!mounted) return;

      setLoading(true);

      await Promise.all([
        fetchAlerts(),
        fetchNetworkStatus(),
      ]);

      if (mounted) {
        setLoading(false);
      }
    };

    loadDashboard();

    const interval = setInterval(() => {
      fetchAlerts();
      fetchNetworkStatus();
    }, 5000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  // ============================================================
  // STATISTICS
  // ============================================================

  const totalAlerts =
    networkStatus.total_alerts || alerts.length;

  const threatAlerts =
    networkStatus.active_threats ||
    alerts.filter((alert) => {
      const status = String(
        alert?.status || ""
      ).toLowerCase();

      const threatType = String(
        alert?.threat_type ||
          alert?.prediction ||
          ""
      ).toLowerCase();

      return (
        status.includes("threat") ||
        (threatType &&
          !threatType.includes("normal"))
      );
    }).length;

  const criticalAlerts =
    networkStatus.critical_threats ||
    alerts.filter(
      (alert) =>
        String(
          alert?.severity || ""
        ).toLowerCase() === "critical"
    ).length;

  // ============================================================
  // AVERAGE RISK
  // ============================================================

  const averageRisk = useMemo(() => {
    if (alerts.length === 0) return 0;

    const totalRisk = alerts.reduce(
      (sum, alert) =>
        sum + Number(alert?.risk_score || 0),
      0
    );

    return Math.round(
      totalRisk / alerts.length
    );
  }, [alerts]);

  const securityScore = Math.max(
    0,
    Math.min(
      100,
      100 - averageRisk
    )
  );

  // ============================================================
  // SECURITY SCORE LABEL
  // ============================================================

  const securityScoreLabel = useMemo(() => {
    if (securityScore >= 80) return "Excellent";
    if (securityScore >= 60) return "Good";
    if (securityScore >= 40) return "Moderate";
    if (securityScore >= 20) return "At Risk";
    return "Critical";
  }, [securityScore]);

  // ============================================================
  // THREAT DISTRIBUTION
  // ============================================================

  const threatDistribution = useMemo(() => {
    const distribution = {};

    alerts.forEach((alert) => {
      const threat =
        alert?.threat_type ||
        alert?.prediction ||
        "Unknown";

      distribution[threat] =
        (distribution[threat] || 0) + 1;
    });

    return Object.entries(distribution)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);
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
  // OPEN INVESTIGATION
  // ============================================================

  const openInvestigation = (alert) => {
    const alertId =
      alert?._id ||
      alert?.id;

    if (!alertId) {
      console.error(
        "Investigation failed: Alert ID missing",
        alert
      );
      return;
    }

    navigate(
      `/investigation?alertId=${encodeURIComponent(
        String(alertId)
      )}`
    );
  };

  // ============================================================
  // OPEN THREAT ALERTS
  // ============================================================

  const openThreatAlerts = () => {
    navigate("/threat-alerts");
  };

  // ============================================================
  // FORMAT NUMBER
  // ============================================================

  const formatNumber = (value) => {
    return Number(
      value || 0
    ).toLocaleString();
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

        <h2>NetShield AI</h2>

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

      {/* SIDEBAR */}

      <aside className="sidebar">

        <div className="sidebar-brand">

          <div className="brand-icon">
            🛡️
          </div>

          <div>
            <h2>NetShield</h2>
            <span>AI SECURITY</span>
          </div>

        </div>

        <div className="sidebar-section">

          <p>MONITORING</p>

          <button
            className="nav-item active"
            type="button"
            onClick={() =>
              navigate("/dashboard")
            }
          >
            <span>▦</span>
            Dashboard
          </button>

          <button
            className="nav-item"
            type="button"
            onClick={() =>
              navigate("/live-network")
            }
          >
            <span>◉</span>
            Live Network
          </button>

          <button
            className="nav-item"
            type="button"
            onClick={openThreatAlerts}
          >
            <span>⚠</span>
            Threat Alerts
          </button>

          <button
            className="nav-item"
            type="button"
          >
            <span>⌁</span>
            Threat Analysis
          </button>

        </div>

        <div className="sidebar-section">

          <p>INTELLIGENCE</p>

          <button
            className="nav-item"
            type="button"
          >
            <span>✦</span>
            AI Predictions
          </button>

          <button
            className="nav-item"
            type="button"
          >
            <span>◷</span>
            Threat Timeline
          </button>

        </div>

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

          <div className="sidebar-version">
            NETSHIELD AI • MILESTONE 3
          </div>

        </div>

      </aside>

      {/* MAIN CONTENT */}

      <main className="main-content">

        {/* TOP BAR */}

        <header className="topbar">

          <div>

            <div className="topbar-label">
              SECURITY / DASHBOARD
            </div>

            <h1>
              Security Operations Center
            </h1>

            <p>
              Real-time network security intelligence
              and AI threat monitoring.
            </p>

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

        {/* ERROR */}

        {backendError && (
          <div className="dashboard-error">

            <span>⚠️</span>

            {backendError}

          </div>
        )}

        {/* HERO */}

        <section className="hero-section">

          <div className="hero-content">

            <div className="hero-label">
              LIVE SECURITY MONITORING
            </div>

            <h2>
              Network Threat Intelligence
            </h2>

            <p>
              AI-powered real-time network anomaly
              detection and threat monitoring.
            </p>

            <div className="hero-meta">
              <span>
                ● AI ENGINE ONLINE
              </span>

              <span>
                ● RANDOM FOREST
              </span>

              <span>
                ● LIVE MONITORING
              </span>
            </div>

          </div>

          <div className="hero-security">

            <div className="security-ring">
              <span>
                {securityScore}
              </span>
            </div>

            <div className="security-score-info">

              <strong>
                SECURITY SCORE
              </strong>

              <span>
                {securityScoreLabel}
              </span>

              <small>
                / 100
              </small>

            </div>

          </div>

        </section>

        {/* STATISTICS */}

        <section className="stats-grid">

          <div
            className="stat-card blue"
            onClick={openThreatAlerts}
          >

            <div className="stat-top">
              <span>
                Total Alerts
              </span>

              <span className="stat-symbol">
                ◉
              </span>
            </div>

            <strong>
              {formatNumber(totalAlerts)}
            </strong>

            <small>
              Live security events
            </small>

          </div>

          <div
            className="stat-card red"
            onClick={openThreatAlerts}
          >

            <div className="stat-top">

              <span>
                Threats Detected
              </span>

              <span className="stat-symbol">
                ⚠
              </span>

            </div>

            <strong>
              {formatNumber(threatAlerts)}
            </strong>

            <small>
              Active security threats
            </small>

          </div>

          <div
            className="stat-card critical"
            onClick={openThreatAlerts}
          >

            <div className="stat-top">

              <span>
                Critical Threats
              </span>

              <span className="stat-symbol">
                !
              </span>

            </div>

            <strong>
              {formatNumber(criticalAlerts)}
            </strong>

            <small>
              Immediate attention
            </small>

          </div>

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

        {/* NETWORK + THREAT ANALYSIS */}

        <section className="content-grid">

          {/* NETWORK TELEMETRY */}

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

              <div className="metric">

                <div className="metric-icon incoming">
                  ↓
                </div>

                <div>

                  <span>
                    Incoming Packets
                  </span>

                  <strong>
                    {formatNumber(
                      networkStatus.incoming_packets
                    )}
                  </strong>

                </div>

              </div>

              <div className="metric">

                <div className="metric-icon outgoing">
                  ↑
                </div>

                <div>

                  <span>
                    Outgoing Packets
                  </span>

                  <strong>
                    {formatNumber(
                      networkStatus.outgoing_packets
                    )}
                  </strong>

                </div>

              </div>

              <div className="metric">

                <div className="metric-icon suspicious">
                  ⚠
                </div>

                <div>

                  <span>
                    Suspicious Connections
                  </span>

                  <strong
                    className={
                      networkStatus.suspicious_connections > 0
                        ? "danger-number"
                        : ""
                    }
                  >
                    {formatNumber(
                      networkStatus.suspicious_connections
                    )}
                  </strong>

                </div>

              </div>

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
                      {
                        networkStatus.bandwidth_usage
                      }%
                    </strong>

                  </div>

                  <div className="progress">

                    <div
                      className="progress-fill"
                      style={{
                        width: `${Math.min(
                          Math.max(
                            networkStatus.bandwidth_usage,
                            0
                          ),
                          100
                        )}%`,
                      }}
                    ></div>

                  </div>

                </div>

              </div>

            </div>

          </div>

          {/* THREAT DISTRIBUTION */}

          <div className="panel">

            <div className="panel-header">

              <div>

                <span>
                  AI CLASSIFICATION
                </span>

                <h3>
                  Threat Distribution
                </h3>

              </div>

              <span className="model-badge">
                RANDOM FOREST
              </span>

            </div>

            <div className="distribution">

              {threatDistribution.length === 0 ? (

                <div className="no-events compact">
                  No threat data available.
                </div>

              ) : (

                threatDistribution.map(
                  ([name, count], index) => {

                    const percentage =
                      totalAlerts > 0
                        ? Math.round(
                            (count /
                              alerts.length) *
                              100
                          )
                        : 0;

                    return (
                      <div
                        className="distribution-item"
                        key={name}
                      >

                        <div className="distribution-top">

                          <div className="distribution-name">

                            <span
                              className={
                                index === 0
                                  ? "legend critical-dot"
                                  : "legend normal-dot"
                              }
                            ></span>

                            <span>
                              {name}
                            </span>

                          </div>

                          <strong>

                            {count}

                            <small>
                              {" "}
                              ({percentage}%)
                            </small>

                          </strong>

                        </div>

                        <div className="distribution-bar">

                          <div
                            style={{
                              width: `${percentage}%`,
                            }}
                          ></div>

                        </div>

                      </div>
                    );
                  }
                )

              )}

            </div>

          </div>

        </section>

        {/* SECURITY EVENTS */}

        <section className="events-panel">

          <div className="panel-header">

            <div>

              <span>
                SECURITY EVENTS
              </span>

              <h3>
                Live Threat Activity
              </h3>

            </div>

            <div className="event-header-actions">

              <div className="event-count">
                {formatNumber(totalAlerts)} EVENTS
              </div>

              <button
                className="view-alerts-button"
                type="button"
                onClick={openThreatAlerts}
              >
                View All →
              </button>

            </div>

          </div>

          <div className="events-table">

            <div className="events-header">

              <span>TIME</span>
              <span>THREAT</span>
              <span>SEVERITY</span>
              <span>RISK</span>
              <span>CONFIDENCE</span>
              <span>STATUS</span>

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

                  const threatName =
                    alert?.threat_type ||
                    alert?.prediction ||
                    "Network Event";

                  const isThreat =
                    String(status)
                      .toLowerCase()
                      .includes("threat") ||
                    !String(threatName)
                      .toLowerCase()
                      .includes("normal");

                  const confidence =
                    alert?.confidence ??
                    alert?.confidence_value ??
                    "0%";

                  const alertId =
                    alert?._id ||
                    alert?.id;

                  return (

                    <div
                      className={`event-row ${
                        alertId
                          ? "clickable-event"
                          : ""
                      }`}
                      key={
                        alertId ||
                        alert?.timestamp ||
                        index
                      }
                      onClick={() =>
                        alertId &&
                        openInvestigation(alert)
                      }
                      title={
                        alertId
                          ? "Click to investigate this security event"
                          : "Investigation unavailable"
                      }
                    >

                      <span className="event-time">

                        {alert?.timestamp
                          ? new Date(
                              alert.timestamp
                            ).toLocaleTimeString()
                          : "--"}

                      </span>

                      <span className="event-threat">

                        <span
                          className={
                            isThreat
                              ? "threat-dot"
                              : "normal-dot"
                          }
                        ></span>

                        <span className="threat-name">
                          {threatName}
                        </span>

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

                        {risk}

                        <small>
                          /100
                        </small>

                      </span>

                      <span className="confidence">

                        {typeof confidence === "number"
                          ? `${confidence}%`
                          : confidence}

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

                    </div>

                  );
                }
              )

            )}

          </div>

        </section>

        {/* FOOTER */}

        <footer className="dashboard-footer">

          <div className="footer-brand">

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

