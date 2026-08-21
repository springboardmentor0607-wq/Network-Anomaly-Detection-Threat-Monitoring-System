import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import "./LiveNetwork.css";

const API_URL = "http://127.0.0.1:8000";

function LiveNetwork() {
  const navigate = useNavigate();

  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [monitorOnline, setMonitorOnline] = useState(true);

  // ============================================================
  // FETCH ALERTS
  // ============================================================

  const refreshData = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/alerts/`);

      if (!response.ok) {
        throw new Error("Failed to fetch alerts");
      }

      const data = await response.json();

      const alertList = Array.isArray(data)
        ? data
        : Array.isArray(data.alerts)
        ? data.alerts
        : [];

      const normalized = alertList.map((item) => ({
        ...item,
        id: item.id || item._id,
        severity: item.severity || "Low",
        threat_type: item.threat_type || "Unknown Threat",
        status: item.status || "Unknown",
        workflow_status: item.workflow_status || "New",
        risk_score: Number(item.risk_score || 0),
        confidence: item.confidence || "0%",
      }));

      normalized.sort((a, b) => {
        const dateA = new Date(a.timestamp || 0).getTime();
        const dateB = new Date(b.timestamp || 0).getTime();

        return dateB - dateA;
      });

      setAlerts(normalized);
      setLastUpdated(new Date());
      setMonitorOnline(true);
      setLoading(false);
    } catch (error) {
      console.error("Live Network error:", error);
      setMonitorOnline(false);
      setLoading(false);
    }
  }, []);

  // ============================================================
  // AUTO REFRESH
  // ============================================================

  useEffect(() => {
    refreshData();

    const interval = setInterval(() => {
      refreshData();
    }, 5000);

    return () => clearInterval(interval);
  }, [refreshData]);

  // ============================================================
  // STATISTICS
  // ============================================================

  const statistics = useMemo(() => {
    const total = alerts.length;

    const threats = alerts.filter(
      (alert) =>
        alert.status === "Threat Detected" ||
        alert.threat_type !== "Normal Traffic"
    ).length;

    const normal = alerts.filter(
      (alert) =>
        alert.status === "Normal" ||
        alert.threat_type === "Normal Traffic"
    ).length;

    const critical = alerts.filter(
      (alert) =>
        String(alert.severity).toLowerCase() === "critical"
    ).length;

    const high = alerts.filter(
      (alert) =>
        String(alert.severity).toLowerCase() === "high"
    ).length;

    const medium = alerts.filter(
      (alert) =>
        String(alert.severity).toLowerCase() === "medium"
    ).length;

    const low = alerts.filter(
      (alert) =>
        String(alert.severity).toLowerCase() === "low"
    ).length;

    const averageRisk =
      total > 0
        ? Math.round(
            alerts.reduce(
              (sum, alert) =>
                sum + Number(alert.risk_score || 0),
              0
            ) / total
          )
        : 0;

    const threatRate =
      total > 0
        ? Math.round((threats / total) * 100)
        : 0;

    return {
      total,
      threats,
      normal,
      critical,
      high,
      medium,
      low,
      averageRisk,
      threatRate,
    };
  }, [alerts]);

  // ============================================================
  // ACTIVITY DATA
  // ============================================================

  const activityData = useMemo(() => {
    return [...alerts]
      .reverse()
      .slice(-20)
      .map((alert, index) => ({
        name: index + 1,
        risk: Number(alert.risk_score || 0),
      }));
  }, [alerts]);

  // ============================================================
  // DISTRIBUTION
  // ============================================================

  const distributionData = [
    {
      name: "Threats",
      value: statistics.threats,
    },
    {
      name: "Normal",
      value: statistics.normal,
    },
  ];

  // ============================================================
  // TIME FORMAT
  // ============================================================

  const formatTime = (timestamp) => {
    if (!timestamp) {
      return "--";
    }

    const date = new Date(timestamp);

    if (Number.isNaN(date.getTime())) {
      return "--";
    }

    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  // ============================================================
  // SEVERITY
  // ============================================================

  const severityClass = (severity) => {
    return String(severity || "low").toLowerCase();
  };

  // ============================================================
  // INVESTIGATION
  // IMPORTANT:
  // App.js uses /alert-investigation/:alertId
  // ============================================================

  const openInvestigation = (alert) => {
    const alertId = alert.id || alert._id;

    if (!alertId) {
      console.error("No alert ID found:", alert);
      return;
    }

    navigate(`/alert-investigation/${alertId}`);
  };

  // ============================================================
  // REPORT
  // ============================================================

  const openReport = (alert) => {
    const alertId = alert.id || alert._id;

    if (!alertId) {
      return;
    }

    window.open(
      `${API_URL}/monitoring/report/${alertId}`,
      "_blank"
    );
  };

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <div className="live-loading">
        <div className="loading-orbit">
          <div className="loading-shield">🛡️</div>
        </div>

        <h2>NETSHIELD AI</h2>

        <p>
          Initializing Security Operations Center...
        </p>

        <div className="loading-progress">
          <span></span>
        </div>
      </div>
    );
  }

  // ============================================================
  // PAGE
  // ============================================================

  return (
    <div className="live-page">

      {/* ========================================================
          HEADER
      ======================================================== */}

      <header className="live-header">

        <div className="brand-section">

          <div className="brand-shield">
            🛡️
          </div>

          <div>
            <div className="brand-name">
              NETSHIELD AI
            </div>

            <div className="brand-subtitle">
              SECURITY OPERATIONS CENTER
            </div>
          </div>

        </div>

        <div className="header-center">
          <span className="header-pulse"></span>
          LIVE SECURITY TELEMETRY
        </div>

        <div className="header-status">

          <span
            className={
              monitorOnline
                ? "status-dot online"
                : "status-dot offline"
            }
          ></span>

          {monitorOnline
            ? "AI ENGINE ONLINE"
            : "ENGINE OFFLINE"}

        </div>

      </header>


      {/* ========================================================
          BREADCRUMB
      ======================================================== */}

      <div className="breadcrumb">

        <span>SOC</span>

        <span>/</span>

        <span>MONITORING</span>

        <span>/</span>

        <strong>LIVE NETWORK</strong>

      </div>


      {/* ========================================================
          HERO
      ======================================================== */}

      <section className="live-hero">

        <div className="hero-grid">

          <div className="hero-content">

            <div className="live-indicator">
              <span></span>
              SYSTEM LIVE
            </div>

            <h1>
              Network Threat
              <br />
              <span>Intelligence Center</span>
            </h1>

            <p>
              Real-time AI-powered network monitoring,
              anomaly detection and security event analysis.
            </p>

            <div className="hero-tags">

              <span>AI MONITORING</span>
              <span>RANDOM FOREST</span>
              <span>REAL-TIME</span>

            </div>

            <div className="hero-meta">

              <div>
                <span>STATUS</span>
                <strong>ACTIVE</strong>
              </div>

              <div>
                <span>SCAN RATE</span>
                <strong>5 SEC</strong>
              </div>

              <div>
                <span>DATABASE</span>
                <strong>MONGODB</strong>
              </div>

            </div>

          </div>


          {/* RADAR */}

          <div className="hero-visual">

            <div className="radar">

              <div className="radar-grid-line horizontal"></div>
              <div className="radar-grid-line vertical"></div>

              <div className="radar-ring ring-one"></div>
              <div className="radar-ring ring-two"></div>
              <div className="radar-ring ring-three"></div>

              <div className="radar-sweep"></div>

              <div className="radar-center">
                🛡️
              </div>

              <span className="radar-point point-one"></span>
              <span className="radar-point point-two"></span>
              <span className="radar-point point-three"></span>
              <span className="radar-point point-four"></span>

            </div>

            <div className="radar-label">
              THREAT RADAR
              <span>SCANNING NETWORK</span>
            </div>

          </div>

        </div>

      </section>


      {/* ========================================================
          STATISTICS
      ======================================================== */}

      <section className="stats-grid">

        <div className="stat-card blue">

          <div className="stat-icon">◉</div>

          <div className="stat-content">

            <span>TOTAL EVENTS</span>

            <strong>{statistics.total}</strong>

            <small>
              Live network events
            </small>

          </div>

          <div className="stat-line"></div>

        </div>


        <div className="stat-card red">

          <div className="stat-icon">⚠</div>

          <div className="stat-content">

            <span>THREATS DETECTED</span>

            <strong>{statistics.threats}</strong>

            <small>
              {statistics.threatRate}% of events
            </small>

          </div>

          <div className="stat-line"></div>

        </div>


        <div className="stat-card orange">

          <div className="stat-icon">!</div>

          <div className="stat-content">

            <span>CRITICAL ALERTS</span>

            <strong>{statistics.critical}</strong>

            <small>
              Immediate attention
            </small>

          </div>

          <div className="stat-line"></div>

        </div>


        <div className="stat-card purple">

          <div className="stat-icon">◈</div>

          <div className="stat-content">

            <span>AVERAGE RISK</span>

            <strong>
              {statistics.averageRisk}
              <small>/100</small>
            </strong>

            <small>
              AI risk calculation
            </small>

          </div>

          <div className="stat-line"></div>

        </div>

      </section>


      {/* ========================================================
          ANALYTICS
      ======================================================== */}

      <section className="analytics-grid">

        {/* THREAT ACTIVITY */}

        <div className="panel activity-panel">

          <div className="panel-header">

            <div>

              <span className="panel-kicker">
                LIVE TELEMETRY
              </span>

              <h2>
                Threat Activity
              </h2>

            </div>

            <div className="chart-live">
              <span></span>
              LIVE
            </div>

          </div>

          <div className="chart-container">

            {activityData.length > 0 ? (

              <ResponsiveContainer
                width="100%"
                height="100%"
              >

                <AreaChart data={activityData}>

                  <defs>

                    <linearGradient
                      id="riskGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >

                      <stop
                        offset="0%"
                        stopColor="#36a3ff"
                        stopOpacity={0.5}
                      />

                      <stop
                        offset="100%"
                        stopColor="#36a3ff"
                        stopOpacity={0}
                      />

                    </linearGradient>

                  </defs>

                  <XAxis
                    dataKey="name"
                    stroke="#536b82"
                    tick={{ fontSize: 10 }}
                  />

                  <YAxis
                    domain={[0, 100]}
                    stroke="#536b82"
                    tick={{ fontSize: 10 }}
                  />

                  <Tooltip
                    contentStyle={{
                      background: "#07111f",
                      border: "1px solid #25445f",
                      borderRadius: "12px",
                      color: "#ffffff",
                    }}
                  />

                  <Area
                    type="monotone"
                    dataKey="risk"
                    stroke="#36a3ff"
                    strokeWidth={3}
                    fill="url(#riskGradient)"
                  />

                </AreaChart>

              </ResponsiveContainer>

            ) : (

              <div className="empty-chart">
                <span>📡</span>
                Waiting for network telemetry...
              </div>

            )}

          </div>

        </div>


        {/* TRAFFIC DISTRIBUTION */}

        <div className="panel distribution-panel">

          <div className="panel-header">

            <div>

              <span className="panel-kicker">
                AI CLASSIFICATION
              </span>

              <h2>
                Traffic Distribution
              </h2>

            </div>

          </div>

          <div className="pie-area">

            <ResponsiveContainer
              width="100%"
              height="100%"
            >

              <PieChart>

                <Pie
                  data={distributionData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={95}
                  paddingAngle={5}
                >

                  <Cell fill="#ff5260" />
                  <Cell fill="#32d583" />

                </Pie>

                <Tooltip
                  contentStyle={{
                    background: "#07111f",
                    border: "1px solid #25445f",
                    borderRadius: "10px",
                  }}
                />

              </PieChart>

            </ResponsiveContainer>

            <div className="pie-center">

              <strong>
                {statistics.total}
              </strong>

              <span>
                EVENTS
              </span>

            </div>

          </div>

          <div className="distribution-legend">

            <div>
              <span className="legend-dot threat"></span>
              <span>Threats</span>
              <strong>
                {statistics.threats}
              </strong>
            </div>

            <div>
              <span className="legend-dot normal"></span>
              <span>Normal</span>
              <strong>
                {statistics.normal}
              </strong>
            </div>

          </div>

        </div>

      </section>


      {/* ========================================================
          SECURITY POSTURE
      ======================================================== */}

      <section className="severity-overview panel">

        <div className="panel-header">

          <div>

            <span className="panel-kicker">
              SECURITY POSTURE
            </span>

            <h2>
              Threat Severity Overview
            </h2>

          </div>

          <div className="updated-time">

            ● UPDATED{" "}

            {lastUpdated
              ? lastUpdated.toLocaleTimeString()
              : "--"}

          </div>

        </div>

        <div className="severity-bars">

          <div className="severity-row">

            <span>Critical</span>

            <div className="severity-track">

              <div
                className="severity-fill critical"
                style={{
                  width: `${Math.min(
                    statistics.critical * 5,
                    100
                  )}%`,
                }}
              ></div>

            </div>

            <strong>
              {statistics.critical}
            </strong>

          </div>


          <div className="severity-row">

            <span>High</span>

            <div className="severity-track">

              <div
                className="severity-fill high"
                style={{
                  width: `${Math.min(
                    statistics.high * 5,
                    100
                  )}%`,
                }}
              ></div>

            </div>

            <strong>
              {statistics.high}
            </strong>

          </div>


          <div className="severity-row">

            <span>Medium</span>

            <div className="severity-track">

              <div
                className="severity-fill medium"
                style={{
                  width: `${Math.min(
                    statistics.medium * 5,
                    100
                  )}%`,
                }}
              ></div>

            </div>

            <strong>
              {statistics.medium}
            </strong>

          </div>


          <div className="severity-row">

            <span>Low</span>

            <div className="severity-track">

              <div
                className="severity-fill low"
                style={{
                  width: `${Math.min(
                    statistics.low * 5,
                    100
                  )}%`,
                }}
              ></div>

            </div>

            <strong>
              {statistics.low}
            </strong>

          </div>

        </div>

      </section>


      {/* ========================================================
          LIVE ALERT FEED
      ======================================================== */}

      <section className="panel alerts-panel">

        <div className="panel-header">

          <div>

            <span className="panel-kicker">
              SECURITY EVENT STREAM
            </span>

            <h2>
              Live Alert Feed
            </h2>

          </div>

          <button
            className="refresh-button"
            onClick={refreshData}
          >
            ↻ Refresh
          </button>

        </div>


        <div className="alert-list">

          {alerts.length === 0 ? (

            <div className="empty-alerts">

              <div className="empty-alert-icon">
                📡
              </div>

              <h3>
                No network events yet
              </h3>

              <p>
                Waiting for the monitoring engine...
              </p>

            </div>

          ) : (

            alerts.slice(0, 12).map((alert, index) => {

              const isNormal =
                alert.threat_type === "Normal Traffic";

              return (

                <div
                  className={`alert-row ${severityClass(
                    alert.severity
                  )}`}
                  key={alert.id || index}
                >

                  <div
                    className={`alert-severity-icon ${
                      isNormal ? "normal-icon" : ""
                    }`}
                  >
                    {isNormal ? "✓" : "!"}
                  </div>


                  <div className="alert-main">

                    <div className="alert-title">

                      <strong>
                        {alert.threat_type}
                      </strong>

                      <span
                        className={`severity-pill ${severityClass(
                          alert.severity
                        )}`}
                      >
                        {alert.severity}
                      </span>

                    </div>

                    <div className="alert-details">

                      <span>
                        {alert.protocol_type || "--"}
                      </span>

                      <span>•</span>

                      <span>
                        {alert.service || "--"}
                      </span>

                      <span>•</span>

                      <span>
                        Risk {alert.risk_score}/100
                      </span>

                    </div>

                  </div>


                  <div className="alert-time">

                    <span>
                      {formatTime(alert.timestamp)}
                    </span>

                    <small>
                      {alert.source || "Live Monitor"}
                    </small>

                  </div>


                  {/* IMPORTANT INVESTIGATE BUTTON */}

                  <button
                    className="investigate-button"
                    onClick={() =>
                      openInvestigation(alert)
                    }
                  >
                    <span>⌕</span>
                    Investigate
                    <b>→</b>
                  </button>


                  <button
                    className="report-icon-button"
                    onClick={() =>
                      openReport(alert)
                    }
                    title="Security Report"
                  >
                    ▣
                  </button>

                </div>

              );
            })

          )}

        </div>

      </section>


      {/* ========================================================
          SYSTEM STATUS
      ======================================================== */}

      <section className="system-status">

        <div className="system-card">

          <div className="system-icon">
            🧠
          </div>

          <div>
            <span>AI DETECTION ENGINE</span>

            <strong>
              Random Forest
            </strong>
          </div>

          <div className="system-online">
            <span></span>
            ONLINE
          </div>

        </div>


        <div className="system-card">

          <div className="system-icon">
            🗄️
          </div>

          <div>
            <span>ALERT DATABASE</span>

            <strong>
              MongoDB
            </strong>
          </div>

          <div className="system-online">
            <span></span>
            CONNECTED
          </div>

        </div>


        <div className="system-card">

          <div className="system-icon">
            📡
          </div>

          <div>
            <span>LIVE MONITOR</span>

            <strong>
              5 Second Interval
            </strong>
          </div>

          <div className="system-online">
            <span></span>
            ACTIVE
          </div>

        </div>

      </section>


      {/* ========================================================
          FOOTER
      ======================================================== */}

      <footer className="live-footer">

        <div>
          🛡️ <strong>NETSHIELD AI</strong>
        </div>

        <span>
          AI-POWERED NETWORK SECURITY
        </span>

        <span>
          INVESTIGATION ENGINE:
          <strong> ONLINE</strong>
        </span>

      </footer>

    </div>
  );
}

export default LiveNetwork;