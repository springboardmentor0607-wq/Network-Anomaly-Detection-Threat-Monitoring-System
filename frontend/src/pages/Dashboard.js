import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";

const API_URL = "http://127.0.0.1:8000";

function Dashboard() {
  const navigate = useNavigate();

  const [alerts, setAlerts] = useState([]);

  const [networkStatus, setNetworkStatus] = useState({
    incoming_packets: 0,
    outgoing_packets: 0,
    suspicious_connections: 0,
    bandwidth_usage: 0,
  });

  const [loading, setLoading] = useState(true);
  const [backendError, setBackendError] = useState("");

  // =====================================================
  // FETCH LIVE ALERTS
  // =====================================================

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

  // =====================================================
  // FETCH NETWORK STATUS
  // =====================================================

  const fetchNetworkStatus = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/monitoring/status`
      );

      setNetworkStatus({
        incoming_packets:
          response.data?.incoming_packets || 0,

        outgoing_packets:
          response.data?.outgoing_packets || 0,

        suspicious_connections:
          response.data?.suspicious_connections || 0,

        bandwidth_usage:
          response.data?.bandwidth_usage || 0,
      });
    } catch (error) {
      console.error("Network status error:", error);
    }
  };

  // =====================================================
  // INITIAL LOAD + AUTO REFRESH
  // =====================================================

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

    return () => clearInterval(interval);
  }, []);

  // =====================================================
  // STATISTICS
  // =====================================================

  const totalAlerts = alerts.length;

  const threatAlerts = alerts.filter(
    (alert) =>
      alert?.status === "Threat Detected"
  ).length;

  const criticalAlerts = alerts.filter(
    (alert) =>
      alert?.severity?.toLowerCase() === "critical"
  ).length;

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

  const securityScore = Math.max(
    0,
    100 - averageRisk
  );

  // =====================================================
  // THREAT DISTRIBUTION
  // =====================================================

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
      .sort((a, b) => b[1] - a[1]);
  }, [alerts]);

  // =====================================================
  // RECENT ALERTS
  // =====================================================

  const recentAlerts = [...alerts]
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

  // =====================================================
  // OPEN INVESTIGATION
  // =====================================================

  const openInvestigation = (alert) => {
    if (!alert?._id) {
      return;
    }

    navigate(
      `/investigation?alertId=${encodeURIComponent(
        alert._id
      )}`
    );
  };

  // =====================================================
  // LOADING SCREEN
  // =====================================================

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

  // =====================================================
  // DASHBOARD
  // =====================================================

  return (
    <div className="dashboard">

      {/* =================================================
          SIDEBAR
      ================================================= */}

      <aside className="sidebar">

        <div className="sidebar-logo">

          <div className="logo-icon">
            🛡️
          </div>

          <div>
            <h2>NetShield</h2>
            <span>AI SECURITY</span>
          </div>

        </div>

        <div className="sidebar-section">

          <p>MONITORING</p>

          <a
            href="#dashboard"
            className="nav-item active"
          >
            <span>▦</span>
            Dashboard
          </a>

          <a
            href="/live-network"
            className="nav-item"
          >
            <span>◉</span>
            Live Network
          </a>

          <a
            href="/threat-alerts"
            className="nav-item"
          >
            <span>⚠</span>
            Threat Alerts
          </a>

          <a
            href="#analysis"
            className="nav-item"
          >
            <span>⌁</span>
            Threat Analysis
          </a>

        </div>

        <div className="sidebar-section">

          <p>INTELLIGENCE</p>

          <a
            href="#predictions"
            className="nav-item"
          >
            <span>✦</span>
            AI Predictions
          </a>

          <a
            href="#timeline"
            className="nav-item"
          >
            <span>◷</span>
            Threat Timeline
          </a>

        </div>

        <div className="sidebar-bottom">

          <div className="system-card">

            <span className="system-dot"></span>

            <div>
              <strong>Operational</strong>
              <span>AI monitoring active</span>
            </div>

          </div>

        </div>

      </aside>

      {/* =================================================
          MAIN CONTENT
      ================================================= */}

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
            ⚠️ {backendError}
          </div>
        )}

        {/* =================================================
            HERO
        ================================================= */}

        <section className="hero-section">

          <div>

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

        {/* =================================================
            STATISTICS
        ================================================= */}

        <section className="stats-grid">

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

        {/* =================================================
            NETWORK + THREAT ANALYSIS
        ================================================= */}

        <section
          className="content-grid"
          id="network"
        >

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
                    {networkStatus.incoming_packets.toLocaleString()}
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
                    {networkStatus.outgoing_packets.toLocaleString()}
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

                  <strong>
                    {networkStatus.suspicious_connections.toLocaleString()}
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
                      {networkStatus.bandwidth_usage}%
                    </strong>

                  </div>

                  <div className="progress">

                    <div
                      className="progress-fill"
                      style={{
                        width: `${Math.min(
                          networkStatus.bandwidth_usage,
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
                              index === 0
                                ? "critical-dot"
                                : "normal-dot"
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

        {/* =================================================
            LIVE THREAT ACTIVITY
        ================================================= */}

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

              <span>TIME</span>
              <span>THREAT</span>
              <span>SEVERITY</span>
              <span>RISK SCORE</span>
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

                  const isThreat =
                    status ===
                    "Threat Detected";

                  return (

                    <div
                      className={`event-row ${
                        isThreat
                          ? "clickable-event"
                          : ""
                      }`}
                      key={
                        alert?._id ||
                        alert?.timestamp ||
                        index
                      }
                      onClick={() =>
                        openInvestigation(alert)
                      }
                      title={
                        alert?._id
                          ? "Click to investigate this security event"
                          : ""
                      }
                    >

                      {/* TIME */}

                      <span className="event-time">

                        {alert?.timestamp
                          ? new Date(
                              alert.timestamp
                            ).toLocaleTimeString()
                          : "--"}

                      </span>

                      {/* THREAT */}

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

                      {/* SEVERITY */}

                      <span>

                        <span
                          className={`severity ${severity.toLowerCase()}`}
                        >
                          {severity}
                        </span>

                      </span>

                      {/* RISK */}

                      <span className="risk-score">

                        {risk}/100

                      </span>

                      {/* CONFIDENCE */}

                      <span className="confidence">

                        {alert?.confidence ||
                          `${alert?.confidence_value || 0}%`}

                      </span>

                      {/* STATUS */}

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

        {/* =================================================
            FOOTER
        ================================================= */}

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