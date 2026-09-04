import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import axios from "axios";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
  PieChart,
  Pie,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from "recharts";

import { useNavigate } from "react-router-dom";

import "./Analytics.css";

const API_URL = "http://127.0.0.1:8000";

function Analytics() {
  const navigate = useNavigate();

  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState("All");

  // ============================================================
  // HELPERS
  // ============================================================

  const getValue = useCallback((...values) => {
    for (const value of values) {
      if (
        value !== undefined &&
        value !== null &&
        value !== ""
      ) {
        return value;
      }
    }

    return null;
  }, []);

  const getSeverity = useCallback(
    (alert) =>
      String(
        getValue(
          alert?.severity,
          alert?.risk_level
        ) || "Low"
      ),
    [getValue]
  );

  const getThreat = useCallback(
    (alert) =>
      String(
        getValue(
          alert?.threat_type,
          alert?.threat,
          alert?.attack_type,
          alert?.prediction,
          alert?.classification
        ) || "Unknown"
      ),
    [getValue]
  );

  const getRisk = useCallback(
    (alert) =>
      Number(
        getValue(
          alert?.risk_score,
          alert?.risk,
          alert?.riskScore
        ) || 0
      ),
    [getValue]
  );

  const getConfidence = useCallback(
    (alert) => {
      const value = getValue(
        alert?.confidence,
        alert?.confidence_value,
        alert?.model_confidence
      );

      if (value === null) return 0;

      const number = parseFloat(
        String(value).replace("%", "")
      );

      return Number.isNaN(number) ? 0 : number;
    },
    [getValue]
  );

  const getStatus = useCallback(
    (alert) =>
      String(
        getValue(
          alert?.workflow_status,
          alert?.workflow,
          alert?.status_workflow,
          alert?.status
        ) || "New"
      ),
    [getValue]
  );

  const getId = useCallback(
    (alert) =>
      alert?._id ||
      alert?.id ||
      alert?.alert_id ||
      alert?.alertId ||
      "--",
    []
  );

  const getSourceIP = useCallback(
    (alert) =>
      getValue(
        alert?.source_ip,
        alert?.src_ip,
        alert?.sourceIP
      ) || "--",
    [getValue]
  );

  const getDestinationIP = useCallback(
    (alert) =>
      getValue(
        alert?.destination_ip,
        alert?.dst_ip,
        alert?.destinationIP
      ) || "--",
    [getValue]
  );

  const getService = useCallback(
    (alert) =>
      String(
        getValue(
          alert?.service,
          alert?.network_service
        ) || "Unknown"
      ),
    [getValue]
  );

  const getTimestamp = useCallback(
    (alert) =>
      getValue(
        alert?.timestamp,
        alert?.created_at,
        alert?.detection_time
      ),
    [getValue]
  );

  const formatDate = useCallback((value) => {
    if (!value) return "--";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return String(value);
    }

    return date.toLocaleString();
  }, []);

  // ============================================================
  // FETCH
  // ============================================================

  const fetchAlerts = useCallback(
    async (initial = false) => {
      try {
        if (initial) {
          setLoading(true);
        } else {
          setSyncing(true);
        }

        setError("");

        const response = await axios.get(
          `${API_URL}/alerts/`
        );

        const data = Array.isArray(response.data)
          ? response.data
          : response.data?.alerts || [];

        setAlerts(data);
      } catch (err) {
        console.error("Analytics error:", err);

        setError(
          err.response?.data?.detail ||
            "Unable to connect to NetShield AI."
        );
      } finally {
        setLoading(false);
        setSyncing(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchAlerts(true);

    const timer = setInterval(() => {
      fetchAlerts(false);
    }, 10000);

    return () => clearInterval(timer);
  }, [fetchAlerts]);

  // ============================================================
  // BASIC STATISTICS
  // ============================================================

  const stats = useMemo(() => {
    let critical = 0;
    let high = 0;
    let medium = 0;
    let low = 0;
    let resolved = 0;
    let riskTotal = 0;
    let confidenceTotal = 0;

    alerts.forEach((alert) => {
      const severity =
        getSeverity(alert).toLowerCase();

      const status =
        getStatus(alert).toLowerCase();

      if (severity === "critical") critical++;
      else if (severity === "high") high++;
      else if (severity === "medium") medium++;
      else low++;

      if (status === "resolved") {
        resolved++;
      }

      riskTotal += getRisk(alert);
      confidenceTotal += getConfidence(alert);
    });

    return {
      total: alerts.length,
      active: Math.max(
        alerts.length - resolved,
        0
      ),
      critical,
      high,
      medium,
      low,
      resolved,
      averageRisk: alerts.length
        ? Math.round(
            riskTotal / alerts.length
          )
        : 0,
      averageConfidence: alerts.length
        ? Math.round(
            confidenceTotal / alerts.length
          )
        : 0,
    };
  }, [
    alerts,
    getSeverity,
    getStatus,
    getRisk,
    getConfidence,
  ]);

  // ============================================================
  // THREAT ACTIVITY INDEX
  // ============================================================

  const activityIndex = useMemo(() => {
    if (!alerts.length) return 0;

    const threatRatio =
      ((stats.critical + stats.high) /
        alerts.length) *
      100;

    const riskComponent = stats.averageRisk;

    const activeComponent =
      (stats.active / alerts.length) * 100;

    const index = Math.round(
      threatRatio * 0.4 +
        riskComponent * 0.4 +
        activeComponent * 0.2
    );

    return Math.min(100, Math.max(0, index));
  }, [alerts, stats]);

  const activityLevel = useMemo(() => {
    if (activityIndex >= 80) return "CRITICAL";
    if (activityIndex >= 60) return "HIGH";
    if (activityIndex >= 35) return "MODERATE";
    return "LOW";
  }, [activityIndex]);

  // ============================================================
  // ATTACK VELOCITY
  // ============================================================

  const attackVelocity = useMemo(() => {
    const sorted = [...alerts].sort(
      (a, b) =>
        new Date(getTimestamp(a) || 0) -
        new Date(getTimestamp(b) || 0)
    );

    const recent = sorted.slice(-20);

    return recent.map((alert, index) => ({
      event: `E${index + 1}`,
      threats:
        getThreat(alert).toLowerCase() ===
        "normal traffic"
          ? 0
          : 1,
      risk: getRisk(alert),
    }));
  }, [alerts, getTimestamp, getThreat, getRisk]);

  // ============================================================
  // SOURCE IP CONCENTRATION
  // ============================================================

  const sourceConcentration = useMemo(() => {
    const counts = {};

    alerts.forEach((alert) => {
      const source = getSourceIP(alert);

      if (source !== "--") {
        counts[source] =
          (counts[source] || 0) + 1;
      }
    });

    return Object.entries(counts)
      .map(([source, count]) => ({
        source,
        events: count,
      }))
      .sort((a, b) => b.events - a.events)
      .slice(0, 8);
  }, [alerts, getSourceIP]);

  // ============================================================
  // ATTACK PATTERN MATRIX
  // ============================================================

  const attackPattern = useMemo(() => {
    const matrix = {};

    alerts.forEach((alert) => {
      const threat = getThreat(alert);
      const service = getService(alert);

      if (!matrix[threat]) {
        matrix[threat] = {};
      }

      matrix[threat][service] =
        (matrix[threat][service] || 0) + 1;
    });

    const services = [
      ...new Set(
        alerts.map((alert) =>
          getService(alert)
        )
      ),
    ].slice(0, 6);

    const threats = Object.keys(matrix).slice(
      0,
      6
    );

    return {
      services,
      data: threats.map((threat) => ({
        threat,
        ...services.reduce(
          (obj, service) => {
            obj[service] =
              matrix[threat][service] || 0;
            return obj;
          },
          {}
        ),
      })),
    };
  }, [alerts, getThreat, getService]);

  // ============================================================
  // RISK ESCALATION
  // ============================================================

  const riskEscalation = useMemo(() => {
    const sorted = [...alerts].sort(
      (a, b) =>
        new Date(getTimestamp(a) || 0) -
        new Date(getTimestamp(b) || 0)
    );

    const recent = sorted.slice(-20);

    return recent.map((alert, index) => ({
      event: index + 1,
      risk: getRisk(alert),
      confidence: getConfidence(alert),
    }));
  }, [
    alerts,
    getTimestamp,
    getRisk,
    getConfidence,
  ]);

  // ============================================================
  // AI PERFORMANCE BY THREAT
  // ============================================================

  const aiPerformance = useMemo(() => {
    const groups = {};

    alerts.forEach((alert) => {
      const threat = getThreat(alert);

      if (!groups[threat]) {
        groups[threat] = {
          total: 0,
          confidence: 0,
          risk: 0,
        };
      }

      groups[threat].total++;
      groups[threat].confidence +=
        getConfidence(alert);
      groups[threat].risk += getRisk(alert);
    });

    return Object.entries(groups)
      .map(([threat, values]) => ({
        threat,
        confidence: Math.round(
          values.confidence / values.total
        ),
        risk: Math.round(
          values.risk / values.total
        ),
      }))
      .sort(
        (a, b) =>
          b.confidence - a.confidence
      )
      .slice(0, 6);
  }, [
    alerts,
    getThreat,
    getConfidence,
    getRisk,
  ]);

  // ============================================================
  // SEVERITY CHART
  // ============================================================

  const severityChart = useMemo(
    () => [
      {
        name: "Critical",
        value: stats.critical,
      },
      {
        name: "High",
        value: stats.high,
      },
      {
        name: "Medium",
        value: stats.medium,
      },
      {
        name: "Low",
        value: stats.low,
      },
    ],
    [stats]
  );

  // ============================================================
  // ATTACK TABLE
  // ============================================================

  const attackTable = useMemo(() => {
    const counts = {};

    alerts.forEach((alert) => {
      const threat = getThreat(alert);

      counts[threat] =
        (counts[threat] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([name, count]) => ({
        name,
        count,
        percentage: alerts.length
          ? Math.round(
              (count / alerts.length) * 100
            )
          : 0,
      }))
      .sort(
        (a, b) => b.count - a.count
      );
  }, [alerts, getThreat]);

  // ============================================================
  // TOP ACTIVE THREATS
  // ============================================================

  const topThreats = useMemo(() => {
    return [...alerts]
      .filter((alert) => {
        const severity =
          getSeverity(alert).toLowerCase();

        const status =
          getStatus(alert).toLowerCase();

        return (
          severity !== "low" &&
          status !== "resolved"
        );
      })
      .sort(
        (a, b) =>
          getRisk(b) - getRisk(a)
      )
      .slice(0, 8);
  }, [
    alerts,
    getSeverity,
    getStatus,
    getRisk,
  ]);

  // ============================================================
  // FILTER
  // ============================================================

  const filteredAlerts = useMemo(() => {
    const keyword =
      search.toLowerCase().trim();

    return alerts.filter((alert) => {
      const severity =
        getSeverity(alert);

      const matchesSeverity =
        severityFilter === "All" ||
        severity.toLowerCase() ===
          severityFilter.toLowerCase();

      const text = `
        ${getThreat(alert)}
        ${getId(alert)}
        ${getSourceIP(alert)}
        ${getDestinationIP(alert)}
        ${getStatus(alert)}
      `.toLowerCase();

      return (
        matchesSeverity &&
        (!keyword ||
          text.includes(keyword))
      );
    });
  }, [
    alerts,
    search,
    severityFilter,
    getSeverity,
    getThreat,
    getId,
    getSourceIP,
    getDestinationIP,
    getStatus,
  ]);

  // ============================================================
  // INVESTIGATION
  // ============================================================

  const investigate = useCallback(
    (alert) => {
      const id = getId(alert);

      if (!id || id === "--") {
        setError(
          "Unable to identify this alert."
        );
        return;
      }

      localStorage.setItem(
        "netshield_selected_alert",
        JSON.stringify(alert)
      );

      navigate(
        `/investigation/${encodeURIComponent(
          String(id)
        )}`
      );
    },
    [getId, navigate]
  );

  // ============================================================
  // REPORT
  // ============================================================

  const report = useCallback(
    (alert) => {
      const id = getId(alert);

      if (!id || id === "--") {
        setError(
          "Unable to generate report: Alert ID missing."
        );
        return;
      }

      window.open(
        `${API_URL}/alerts/report/${encodeURIComponent(
          String(id)
        )}`,
        "_blank"
      );
    },
    [getId]
  );

  // ============================================================
  // INVESTIGATION PAGE
  // ============================================================

  const openInvestigationPage = () => {
    const saved = localStorage.getItem(
      "netshield_selected_alert"
    );

    if (saved) {
      try {
        const alert = JSON.parse(saved);

        const id =
          alert?._id ||
          alert?.id ||
          alert?.alert_id ||
          alert?.alertId;

        if (id) {
          navigate(
            `/investigation/${encodeURIComponent(
              String(id)
            )}`
          );
          return;
        }
      } catch (err) {
        console.error(err);
      }
    }

    navigate("/threat-alerts");
  };

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <div className="analytics-loading">
        <div className="loading-shield">
          🛡️
        </div>

        <h2>NETSHIELD AI</h2>

        <p>
          Loading Security Analytics...
        </p>

        <div className="loading-line">
          <span></span>
        </div>
      </div>
    );
  }

  // ============================================================
  // MAIN
  // ============================================================

  return (
    <div className="analytics-page">

      {/* ======================================================
          SIDEBAR
      ====================================================== */}

      <aside className="analytics-sidebar">

        <div className="sidebar-brand">
          <div className="sidebar-logo">
            NS
          </div>

          <div>
            <h1>NETSHIELD AI</h1>

            <span>
              SECURITY OPERATIONS CENTER
            </span>
          </div>
        </div>

        <div className="sidebar-status">

          <div className="status-title">
            SYSTEM STATUS
          </div>

          <div className="system-operational">
            <span></span>
            SYSTEM OPERATIONAL
          </div>

          <button
            className="sidebar-sync"
            onClick={() =>
              fetchAlerts(false)
            }
            disabled={syncing}
          >
            {syncing
              ? "↻ SYNCING..."
              : "↻ SYNC"}
          </button>

        </div>

        <div className="sidebar-divider"></div>

        <nav className="sidebar-nav">

          <button
            onClick={() =>
              navigate("/dashboard")
            }
          >
            <span>▣</span>
            Dashboard
          </button>

          <button
            onClick={() =>
              navigate("/live-network")
            }
          >
            <span>◉</span>
            Live Monitor
          </button>

          <button
            onClick={() =>
              navigate("/threat-alerts")
            }
          >
            <span>⚠</span>
            Threat Alerts
          </button>

          <button className="active">
  <span>▤</span>
  Analytics
</button>

<button
  onClick={() =>
    navigate("/predictions")
  }
>
  <span>✦</span>
  AI Predictions
</button>

<button
  onClick={() =>
    navigate("/threat-timeline")
  }
>
  <span>◷</span>
  Threat Timeline
</button>

<button
  onClick={
    openInvestigationPage
  }
>
  <span>⌕</span>
  Investigations
</button>

        </nav>

        <div className="sidebar-bottom">

          <div className="sidebar-security">
            <span>●</span>
            AI ENGINE ONLINE
          </div>

          <small>
            NETSHIELD AI v3.0
          </small>

        </div>

      </aside>

      {/* ======================================================
          MAIN
      ====================================================== */}

      <main className="analytics-main">

        <header className="content-header">

          <div>
            <span className="breadcrumb">
              SECURITY / ANALYTICS
            </span>

            <h2>
              Security Analytics
            </h2>

            <p>
              Network threat intelligence,
              behavioral patterns and security
              performance analysis.
            </p>
          </div>

          <div className="header-time">
            <span>MONITORING</span>
            <strong>LIVE</strong>
          </div>

        </header>

        {error && (
          <div className="analytics-error">
            ⚠ {error}
          </div>
        )}

        {/* ====================================================
            KPI
        ==================================================== */}

        <section className="section-block">

          <div className="section-title">
            <div>
              <span>
                SECURITY OVERVIEW
              </span>

              <h3>
                Threat Summary
              </h3>
            </div>
          </div>

          <div className="kpi-table">

            <div className="kpi-box blue">
              <span>TOTAL EVENTS</span>
              <strong>{stats.total}</strong>
              <small>
                All detected events
              </small>
            </div>

            <div className="kpi-box red">
              <span>ACTIVE THREATS</span>
              <strong>{stats.active}</strong>
              <small>
                Unresolved events
              </small>
            </div>

            <div className="kpi-box critical">
              <span>CRITICAL</span>
              <strong>{stats.critical}</strong>
              <small>
                Immediate attention
              </small>
            </div>

            <div className="kpi-box orange">
              <span>HIGH</span>
              <strong>{stats.high}</strong>
              <small>
                High priority
              </small>
            </div>

            <div className="kpi-box green">
              <span>RESOLVED</span>
              <strong>{stats.resolved}</strong>
              <small>
                Closed incidents
              </small>
            </div>

            <div className="kpi-box purple">
              <span>AI CONFIDENCE</span>
              <strong>
                {stats.averageConfidence}%
              </strong>
              <small>
                Average prediction
              </small>
            </div>

          </div>

        </section>

        {/* ====================================================
            THREAT ACTIVITY INDEX
        ==================================================== */}

        <section className="behavior-grid">

          <div className="activity-card">

            <div className="behavior-label">
              BEHAVIORAL INTELLIGENCE
            </div>

            <h3>
              Threat Activity Index
            </h3>

            <div className="activity-content">

              <div
                className="activity-ring"
                style={{
                  "--activity":
                    `${activityIndex * 3.6}deg`,
                }}
              >
                <div>
                  <strong>
                    {activityIndex}
                  </strong>

                  <span>/100</span>
                </div>
              </div>

              <div className="activity-details">

                <div className="activity-status">
                  <span></span>
                  {activityLevel} ACTIVITY
                </div>

                <p>
                  Combined assessment of threat
                  frequency, risk intensity and
                  unresolved incidents.
                </p>

                <div className="activity-metrics">

                  <div>
                    <span>
                      AVG RISK
                    </span>
                    <strong>
                      {stats.averageRisk}
                    </strong>
                  </div>

                  <div>
                    <span>
                      CRITICAL
                    </span>
                    <strong>
                      {stats.critical}
                    </strong>
                  </div>

                  <div>
                    <span>
                      ACTIVE
                    </span>
                    <strong>
                      {stats.active}
                    </strong>
                  </div>

                </div>

              </div>

            </div>

          </div>

          <div className="activity-insight">

            <div className="behavior-label">
              AI SECURITY INSIGHT
            </div>

            <h3>
              Current Behavioral Signal
            </h3>

            <div className="signal-box">

              <div className="signal-icon">
                {activityIndex >= 60
                  ? "⚠"
                  : "✓"}
              </div>

              <div>
                <strong>
                  {activityIndex >= 60
                    ? "Elevated threat activity detected"
                    : "Network activity is currently stable"}
                </strong>

                <p>
                  {stats.critical} critical and{" "}
                  {stats.high} high-severity
                  events are currently present
                  across the monitored traffic.
                </p>
              </div>

            </div>

            <div className="signal-bar">
              <span
                style={{
                  width:
                    `${activityIndex}%`,
                }}
              ></span>
            </div>

            <small>
              Threat pressure:{" "}
              {activityIndex}/100
            </small>

          </div>

        </section>

        {/* ====================================================
            ATTACK VELOCITY
        ==================================================== */}

        <section className="analytics-card">

          <div className="card-heading">

            <div>
              <span>
                BEHAVIORAL INTELLIGENCE
              </span>

              <h3>
                Attack Velocity
              </h3>
            </div>

            <div className="live-label">
              <span></span>
              LIVE ANALYSIS
            </div>

          </div>

          <div className="chart-description">
            Measures the intensity of threat
            events across the latest network
            activity window.
          </div>

          <div className="chart-wrapper">

            {attackVelocity.length === 0 ? (
              <div className="empty-state">
                No behavioral data available.
              </div>
            ) : (
              <ResponsiveContainer
                width="100%"
                height={300}
              >
                <AreaChart
                  data={attackVelocity}
                >

                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#203342"
                  />

                  <XAxis
                    dataKey="event"
                    stroke="#758a99"
                  />

                  <YAxis
                    domain={[0, 1]}
                    ticks={[0, 1]}
                    stroke="#758a99"
                  />

                  <Tooltip
                    contentStyle={{
                      background:
                        "#0c1721",
                      border:
                        "1px solid #274152",
                      borderRadius:
                        "8px",
                    }}
                  />

                  <Legend />

                  <Area
                    type="monotone"
                    dataKey="threats"
                    name="Threat Event"
                    stroke="#ff4057"
                    fill="#ff4057"
                    fillOpacity={0.15}
                  />

                </AreaChart>
              </ResponsiveContainer>
            )}

          </div>

        </section>

        {/* ====================================================
            SOURCE + AI PERFORMANCE
        ==================================================== */}

        <section className="two-column">

          <div className="analytics-card">

            <div className="card-heading">

              <div>
                <span>
                  SOURCE INTELLIGENCE
                </span>

                <h3>
                  Source IP Concentration
                </h3>
              </div>

            </div>

            <div className="chart-wrapper">

              {sourceConcentration.length ===
              0 ? (
                <div className="empty-state">
                  No source data available.
                </div>
              ) : (
                <ResponsiveContainer
                  width="100%"
                  height={330}
                >

                  <BarChart
                    data={sourceConcentration}
                    layout="vertical"
                  >

                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#203342"
                    />

                    <XAxis
                      type="number"
                      stroke="#758a99"
                    />

                    <YAxis
                      type="category"
                      dataKey="source"
                      width={105}
                      stroke="#758a99"
                    />

                    <Tooltip
                      contentStyle={{
                        background:
                          "#0c1721",
                        border:
                          "1px solid #274152",
                      }}
                    />

                    <Bar
                      dataKey="events"
                      name="Events"
                      fill="#20d9ff"
                      radius={[0, 4, 4, 0]}
                    />

                  </BarChart>

                </ResponsiveContainer>
              )}

            </div>

          </div>

          <div className="analytics-card">

            <div className="card-heading">

              <div>
                <span>
                  MODEL INTELLIGENCE
                </span>

                <h3>
                  AI Performance by Threat
                </h3>
              </div>

            </div>

            <div className="chart-wrapper">

              {aiPerformance.length === 0 ? (
                <div className="empty-state">
                  No AI performance data.
                </div>
              ) : (
                <ResponsiveContainer
                  width="100%"
                  height={330}
                >

                  <RadarChart
                    data={aiPerformance}
                  >

                    <PolarGrid
                      stroke="#29404d"
                    />

                    <PolarAngleAxis
                      dataKey="threat"
                      stroke="#8aa0ab"
                    />

                    <PolarRadiusAxis
                      domain={[0, 100]}
                      stroke="#536d7b"
                    />

                    <Radar
                      name="Confidence"
                      dataKey="confidence"
                      stroke="#a889ff"
                      fill="#a889ff"
                      fillOpacity={0.25}
                    />

                    <Tooltip
                      contentStyle={{
                        background:
                          "#0c1721",
                        border:
                          "1px solid #274152",
                      }}
                    />

                    <Legend />

                  </RadarChart>

                </ResponsiveContainer>
              )}

            </div>

          </div>

        </section>

        {/* ====================================================
            RISK ESCALATION
        ==================================================== */}

        <section className="analytics-card">

          <div className="card-heading">

            <div>
              <span>
                RISK INTELLIGENCE
              </span>

              <h3>
                Risk Escalation Analysis
              </h3>
            </div>

            <div className="risk-trend-label">
              ● TRAJECTORY
            </div>

          </div>

          <div className="chart-description">
            Tracks recent risk scores and AI
            confidence to identify changes in
            threat intensity.
          </div>

          <div className="chart-wrapper">

            <ResponsiveContainer
              width="100%"
              height={310}
            >

              <LineChart
                data={riskEscalation}
              >

                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#203342"
                />

                <XAxis
                  dataKey="event"
                  stroke="#758a99"
                />

                <YAxis
                  domain={[0, 100]}
                  stroke="#758a99"
                />

                <Tooltip
                  contentStyle={{
                    background:
                      "#0c1721",
                    border:
                      "1px solid #274152",
                  }}
                />

                <Legend />

                <Line
                  type="monotone"
                  dataKey="risk"
                  name="Risk Score"
                  stroke="#ff4057"
                  strokeWidth={3}
                  dot={false}
                />

                <Line
                  type="monotone"
                  dataKey="confidence"
                  name="AI Confidence"
                  stroke="#20d9ff"
                  strokeWidth={2}
                  dot={false}
                />

              </LineChart>

            </ResponsiveContainer>

          </div>

        </section>

        {/* ====================================================
            ATTACK PATTERN MATRIX
        ==================================================== */}

        <section className="analytics-card">

          <div className="card-heading">

            <div>
              <span>
                ATTACK CORRELATION
              </span>

              <h3>
                Attack Pattern Matrix
              </h3>
            </div>

            <span className="matrix-label">
              THREAT × SERVICE
            </span>

          </div>

          <div className="matrix-wrapper">

            {attackPattern.data.length ===
            0 ? (
              <div className="empty-state">
                No attack pattern data.
              </div>
            ) : (
              <table className="pattern-table">

                <thead>

                  <tr>
                    <th>THREAT</th>

                    {attackPattern.services.map(
                      (service) => (
                        <th key={service}>
                          {service}
                        </th>
                      )
                    )}

                  </tr>

                </thead>

                <tbody>

                  {attackPattern.data.map(
                    (row) => (
                      <tr key={row.threat}>

                        <td>
                          <strong>
                            {row.threat}
                          </strong>
                        </td>

                        {attackPattern.services.map(
                          (service) => {

                            const value =
                              row[service] ||
                              0;

                            return (
                              <td
                                key={
                                  service
                                }
                              >
                                <span
                                  className={`matrix-cell ${
                                    value >= 10
                                      ? "hot"
                                      : value >=
                                        5
                                      ? "warm"
                                      : ""
                                  }`}
                                >
                                  {value}
                                </span>
                              </td>
                            );
                          }
                        )}

                      </tr>
                    )
                  )}

                </tbody>

              </table>
            )}

          </div>

        </section>

        {/* ====================================================
            ORIGINAL RISK CHART
        ==================================================== */}

        <section className="analytics-card">

          <div className="card-heading">

            <div>
              <span>
                REAL-TIME MONITORING
              </span>

              <h3>
                Threat Risk & AI Confidence
              </h3>
            </div>

            <div className="live-label">
              <span></span>
              LIVE
            </div>

          </div>

          <div className="chart-wrapper">

            <ResponsiveContainer
              width="100%"
              height={300}
            >

              <LineChart
                data={riskEscalation}
              >

                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#203342"
                />

                <XAxis
                  dataKey="event"
                  stroke="#758a99"
                />

                <YAxis
                  domain={[0, 100]}
                  stroke="#758a99"
                />

                <Tooltip
                  contentStyle={{
                    background:
                      "#0c1721",
                    border:
                      "1px solid #274152",
                  }}
                />

                <Legend />

                <Line
                  type="monotone"
                  dataKey="risk"
                  name="Risk Score"
                  stroke="#ff4057"
                  strokeWidth={3}
                  dot={false}
                />

                <Line
                  type="monotone"
                  dataKey="confidence"
                  name="AI Confidence"
                  stroke="#19d9ff"
                  strokeWidth={3}
                  dot={false}
                />

              </LineChart>

            </ResponsiveContainer>

          </div>

        </section>

        {/* ====================================================
            SEVERITY + ATTACK
        ==================================================== */}

        <section className="two-column">

          <div className="analytics-card">

            <div className="card-heading">

              <div>
                <span>
                  THREAT LEVEL
                </span>

                <h3>
                  Severity Distribution
                </h3>
              </div>

            </div>

            <div className="chart-wrapper">

              <ResponsiveContainer
                width="100%"
                height={280}
              >

                <PieChart>

                  <Pie
                    data={severityChart}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    innerRadius={55}
                    paddingAngle={3}
                    label
                  >

                    {severityChart.map(
                      (entry) => (
                        <Cell
                          key={entry.name}
                          fill={
                            entry.name ===
                            "Critical"
                              ? "#ff4057"
                              : entry.name ===
                                "High"
                              ? "#ff9f43"
                              : entry.name ===
                                "Medium"
                              ? "#ffd166"
                              : "#52e3a4"
                          }
                        />
                      )
                    )}

                  </Pie>

                  <Tooltip
                    contentStyle={{
                      background:
                        "#0c1721",
                      border:
                        "1px solid #274152",
                    }}
                  />

                  <Legend />

                </PieChart>

              </ResponsiveContainer>

            </div>

          </div>

          <div className="analytics-card">

            <div className="card-heading">

              <div>
                <span>
                  AI CLASSIFICATION
                </span>

                <h3>
                  Attack Intelligence
                </h3>
              </div>

              <span className="matrix-label">
                TOP 8
              </span>

            </div>

            <table className="data-table">

              <thead>
                <tr>
                  <th>THREAT TYPE</th>
                  <th>EVENTS</th>
                  <th>SHARE</th>
                </tr>
              </thead>

              <tbody>

                {attackTable.map(
                  (attack) => (
                    <tr
                      key={attack.name}
                    >

                      <td>
                        <strong>
                          {attack.name}
                        </strong>
                      </td>

                      <td>
                        {attack.count}
                      </td>

                      <td>
                        <div className="percentage-cell">

                          <div>
                            <span
                              style={{
                                width:
                                  `${attack.percentage}%`,
                              }}
                            ></span>
                          </div>

                          {attack.percentage}%

                        </div>
                      </td>

                    </tr>
                  )
                )}

              </tbody>

            </table>

          </div>

        </section>

        {/* ====================================================
            TOP ACTIVE THREATS
        ==================================================== */}

        <section className="analytics-card">

          <div className="card-heading">

            <div>
              <span>
                INCIDENT PRIORITY
              </span>

              <h3>
                Top Active Threats
              </h3>
            </div>

            <button
              className="view-button"
              onClick={() =>
                navigate(
                  "/threat-alerts"
                )
              }
            >
              VIEW THREAT ALERTS →
            </button>

          </div>

          <div className="table-scroll">

            <table className="data-table threat-table">

              <thead>

                <tr>
                  <th>#</th>
                  <th>THREAT</th>
                  <th>SOURCE</th>
                  <th>DESTINATION</th>
                  <th>SEVERITY</th>
                  <th>RISK</th>
                  <th>STATUS</th>
                  <th>ACTION</th>
                </tr>

              </thead>

              <tbody>

                {topThreats.map(
                  (alert, index) => {

                    const severity =
                      getSeverity(alert);

                    return (
                      <tr
                        key={
                          getId(alert) ||
                          index
                        }
                      >

                        <td className="rank">
                          {String(
                            index + 1
                          ).padStart(2, "0")}
                        </td>

                        <td>
                          <strong>
                            {getThreat(
                              alert
                            )}
                          </strong>
                        </td>

                        <td>
                          {getSourceIP(
                            alert
                          )}
                        </td>

                        <td>
                          {getDestinationIP(
                            alert
                          )}
                        </td>

                        <td>
                          <span
                            className={`severity-badge ${severity.toLowerCase()}`}
                          >
                            {severity}
                          </span>
                        </td>

                        <td>
                          <strong className="risk-number">
                            {getRisk(
                              alert
                            )}
                          </strong>
                        </td>

                        <td>
                          <span
                            className={`status-badge ${getStatus(
                              alert
                            )
                              .toLowerCase()
                              .replace(
                                /\s+/g,
                                "-"
                              )}`}
                          >
                            {getStatus(
                              alert
                            )}
                          </span>
                        </td>

                        <td>
                          <button
                            className="investigate-button"
                            onClick={() =>
                              investigate(
                                alert
                              )
                            }
                          >
                            🔍 Investigate
                          </button>
                        </td>

                      </tr>
                    );
                  }
                )}

                {topThreats.length === 0 && (
                  <tr>
                    <td
                      colSpan="8"
                      className="empty-table"
                    >
                      No active threats.
                    </td>
                  </tr>
                )}

              </tbody>

            </table>

          </div>

        </section>

        {/* ====================================================
            SECURITY EVENTS
        ==================================================== */}

        <section className="analytics-card">

          <div className="card-heading">

            <div>
              <span>
                SECURITY EVENTS
              </span>

              <h3>
                Recent Security Events
              </h3>
            </div>

            <strong className="event-total">
              {filteredAlerts.length} EVENTS
            </strong>

          </div>

          <div className="filter-row">

            <input
              type="text"
              placeholder="Search threat, IP, alert ID..."
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
            />

            <select
              value={severityFilter}
              onChange={(event) =>
                setSeverityFilter(
                  event.target.value
                )
              }
            >

              <option value="All">
                All Severity
              </option>

              <option value="Critical">
                Critical
              </option>

              <option value="High">
                High
              </option>

              <option value="Medium">
                Medium
              </option>

              <option value="Low">
                Low
              </option>

            </select>

          </div>

          <div className="table-scroll">

            <table className="data-table">

              <thead>

                <tr>
                  <th>ALERT ID</th>
                  <th>THREAT</th>
                  <th>SEVERITY</th>
                  <th>RISK</th>
                  <th>CONFIDENCE</th>
                  <th>SOURCE</th>
                  <th>DESTINATION</th>
                  <th>STATUS</th>
                  <th>ACTIONS</th>
                </tr>

              </thead>

              <tbody>

                {filteredAlerts
                  .slice(0, 15)
                  .map(
                    (alert, index) => {

                      const severity =
                        getSeverity(
                          alert
                        );

                      return (
                        <tr
                          key={
                            getId(
                              alert
                            ) || index
                          }
                        >

                          <td>

                            <strong className="alert-id">
                              #
                              {String(
                                getId(
                                  alert
                                )
                              ).slice(-8)}
                            </strong>

                            <small className="date-text">
                              {formatDate(
                                getTimestamp(
                                  alert
                                )
                              )}
                            </small>

                          </td>

                          <td>
                            <strong>
                              {getThreat(
                                alert
                              )}
                            </strong>
                          </td>

                          <td>
                            <span
                              className={`severity-badge ${severity.toLowerCase()}`}
                            >
                              {severity}
                            </span>
                          </td>

                          <td>
                            <strong className="risk-number">
                              {getRisk(
                                alert
                              )}
                            </strong>
                          </td>

                          <td>
                            {getConfidence(
                              alert
                            )}
                            %
                          </td>

                          <td>
                            {getSourceIP(
                              alert
                            )}
                          </td>

                          <td>
                            {getDestinationIP(
                              alert
                            )}
                          </td>

                          <td>
                            <span
                              className={`status-badge ${getStatus(
                                alert
                              )
                                .toLowerCase()
                                .replace(
                                  /\s+/g,
                                  "-"
                                )}`}
                            >
                              {getStatus(
                                alert
                              )}
                            </span>
                          </td>

                          <td>

                            <div className="action-buttons">

                              <button
                                onClick={() =>
                                  investigate(
                                    alert
                                  )
                                }
                                title="Investigate"
                              >
                                🔍
                              </button>

                              <button
                                onClick={() =>
                                  report(
                                    alert
                                  )
                                }
                                title="PDF Report"
                              >
                                📄
                              </button>

                            </div>

                          </td>

                        </tr>
                      );
                    }
                  )}

                {filteredAlerts.length === 0 && (
                  <tr>
                    <td
                      colSpan="9"
                      className="empty-table"
                    >
                      No security events found.
                    </td>
                  </tr>
                )}

              </tbody>

            </table>

          </div>

        </section>

        {/* ====================================================
            FOOTER
        ==================================================== */}

        <footer className="analytics-footer">

          <div>
            <strong>
              🛡️ NETSHIELD AI
            </strong>

            <span>
              AI-POWERED NETWORK SECURITY
            </span>
          </div>

          <span>
            MILESTONE 3 • BEHAVIORAL SECURITY
            ANALYTICS
          </span>

        </footer>

      </main>

    </div>
  );
}

export default Analytics;