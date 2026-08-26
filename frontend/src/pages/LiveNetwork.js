import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { useNavigate } from "react-router-dom";
import "./LiveNetwork.css";

const API_URL = "http://127.0.0.1:8000";

const CHART_COLORS = [
  "#3b82f6",
  "#8b5cf6",
  "#06b6d4",
  "#f97316",
  "#ef4444",
  "#22c55e",
  "#eab308",
];

function LiveNetwork() {
  const navigate = useNavigate();

  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  // ============================================================
  // FETCH LIVE DATA
  // ============================================================

  const fetchLiveData = useCallback(async (initial = false) => {
    try {
      if (initial) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      let response;

      try {
        response = await axios.get(`${API_URL}/predictions/`);
      } catch (predictionError) {
        console.warn("Predictions API unavailable. Trying alerts API...");
        response = await axios.get(`${API_URL}/alerts/`);
      }

      const result = response.data;

      let records = [];

      if (Array.isArray(result)) {
        records = result;
      } else if (Array.isArray(result?.predictions)) {
        records = result.predictions;
      } else if (Array.isArray(result?.alerts)) {
        records = result.alerts;
      } else if (Array.isArray(result?.data)) {
        records = result.data;
      }

      setAlerts(records);
      setError("");
    } catch (err) {
      console.error("Live Network API error:", err);

      setError(
        err.response?.data?.detail ||
          "Unable to connect to live monitoring service."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // ============================================================
  // AUTO REFRESH
  // ============================================================

  useEffect(() => {
    fetchLiveData(true);

    const interval = setInterval(() => {
      fetchLiveData(false);
    }, 5000);

    return () => clearInterval(interval);
  }, [fetchLiveData]);

  // ============================================================
  // HELPERS
  // ============================================================

  const getStatus = (item) => {
    const status = String(item?.status || "").toLowerCase();

    if (
      status.includes("threat") ||
      status.includes("attack")
    ) {
      return "Threat Detected";
    }

    if (
      item?.threat_type &&
      item.threat_type !== "Normal Traffic"
    ) {
      return "Threat Detected";
    }

    return "Normal";
  };

  const getSeverity = (item) => {
    return item?.severity || "Low";
  };

  const getRisk = (item) => {
    return Number(
      item?.risk_score ??
        item?.risk ??
        0
    );
  };

  const getThreatType = (item) => {
    return (
      item?.threat_type ||
      item?.attack_type ||
      item?.prediction ||
      "Normal Traffic"
    );
  };

  const getAlertId = (item) => {
    return (
      item?.id ||
      item?._id ||
      item?.alert_id ||
      item?.alertId ||
      null
    );
  };

  const formatTime = (timestamp) => {
    if (!timestamp) {
      return "-";
    }

    try {
      return new Date(timestamp).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    } catch {
      return "-";
    }
  };

  // ============================================================
  // SORT EVENTS
  // ============================================================

  const recentAlerts = useMemo(() => {
    return [...alerts]
      .sort((a, b) => {
        return (
          new Date(
            b.timestamp ||
              b.created_at ||
              b.detection_time ||
              0
          ) -
          new Date(
            a.timestamp ||
              a.created_at ||
              a.detection_time ||
              0
          )
        );
      })
      .slice(0, 20);
  }, [alerts]);

  // ============================================================
  // SUMMARY
  // ============================================================

  const summary = useMemo(() => {
    const total = alerts.length;

    const threats = alerts.filter(
      (item) => getStatus(item) === "Threat Detected"
    ).length;

    const critical = alerts.filter(
      (item) =>
        String(getSeverity(item)).toLowerCase() === "critical"
    ).length;

    const high = alerts.filter(
      (item) =>
        String(getSeverity(item)).toLowerCase() === "high"
    ).length;

    const medium = alerts.filter(
      (item) =>
        String(getSeverity(item)).toLowerCase() === "medium"
    ).length;

    const normal = total - threats;

    const averageRisk =
      total > 0
        ? Math.round(
            alerts.reduce(
              (sum, item) => sum + getRisk(item),
              0
            ) / total
          )
        : 0;

    return {
      total,
      threats,
      critical,
      high,
      medium,
      normal,
      averageRisk,
    };
  }, [alerts]);

  // ============================================================
  // THREAT DISTRIBUTION
  // ============================================================

  const threatDistribution = useMemo(() => {
    const map = {};

    alerts.forEach((item) => {
      const type = getThreatType(item);
      map[type] = (map[type] || 0) + 1;
    });

    return Object.entries(map)
      .map(([name, value]) => ({
        name,
        value,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 7);
  }, [alerts]);

  // ============================================================
  // SEVERITY DISTRIBUTION
  // ============================================================

  const severityDistribution = useMemo(() => {
    const levels = ["Critical", "High", "Medium", "Low"];

    return levels.map((level) => ({
      name: level,
      value: alerts.filter(
        (item) =>
          String(getSeverity(item)).toLowerCase() ===
          level.toLowerCase()
      ).length,
    }));
  }, [alerts]);

  // ============================================================
  // PROTOCOL DISTRIBUTION
  // ============================================================

  const protocolDistribution = useMemo(() => {
    const map = {};

    alerts.forEach((item) => {
      const protocol =
        item?.protocol ||
        item?.protocol_type ||
        "Unknown";

      map[protocol] = (map[protocol] || 0) + 1;
    });

    return Object.entries(map)
      .map(([name, value]) => ({
        name: name.toUpperCase(),
        value,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [alerts]);

  // ============================================================
  // SERVICE DISTRIBUTION
  // ============================================================

  const serviceDistribution = useMemo(() => {
    const map = {};

    alerts.forEach((item) => {
      const service =
        item?.service ||
        item?.service_name ||
        "Unknown";

      map[service] = (map[service] || 0) + 1;
    });

    return Object.entries(map)
      .map(([name, value]) => ({
        name,
        value,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [alerts]);

  // ============================================================
  // TRAFFIC TREND
  // ============================================================

  const trafficTrend = useMemo(() => {
    const groups = {};

    alerts.forEach((item) => {
      const timestamp =
        item?.timestamp ||
        item?.created_at ||
        item?.detection_time;

      if (!timestamp) return;

      const date = new Date(timestamp);

      const time = date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });

      if (!groups[time]) {
        groups[time] = {
          time,
          events: 0,
          threats: 0,
          risk: 0,
        };
      }

      groups[time].events += 1;

      if (getStatus(item) === "Threat Detected") {
        groups[time].threats += 1;
      }

      groups[time].risk += getRisk(item);
    });

    return Object.values(groups)
      .slice(-10)
      .map((item) => ({
        ...item,
        risk:
          item.events > 0
            ? Math.round(item.risk / item.events)
            : 0,
      }));
  }, [alerts]);

  // ============================================================
  // INVESTIGATE
  // ============================================================

  const investigateAlert = (item) => {
    const alertId = getAlertId(item);

    console.log("Clicked Investigate");
    console.log("Alert:", item);
    console.log("Alert ID:", alertId);

    if (!alertId) {
      setError(
        "This alert does not have a valid ID. Please check the backend alert data."
      );
      return;
    }

    const selectedAlert = {
      ...item,
      id: String(alertId),
    };

    localStorage.setItem(
      "netshield_selected_alert",
      JSON.stringify(selectedAlert)
    );

    navigate(`/investigate/${encodeURIComponent(String(alertId))}`);
  };

  // ============================================================
  // CUSTOM TOOLTIP
  // ============================================================

  const CustomTooltip = ({
    active,
    payload,
    label,
  }) => {
    if (
      !active ||
      !payload ||
      !payload.length
    ) {
      return null;
    }

    return (
      <div className="live-tooltip">
        {label && <strong>{label}</strong>}

        {payload.map((item, index) => (
          <div key={index}>
            <span>{item.name}</span>
            <b>{item.value}</b>
          </div>
        ))}
      </div>
    );
  };

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <div className="live-loading">
        <div className="live-loading-icon">🛡️</div>

        <h2>NetShield AI</h2>

        <p>
          Initializing live network monitoring...
        </p>

        <div className="live-loading-bar">
          <div></div>
        </div>
      </div>
    );
  }

  // ============================================================
  // PAGE
  // ============================================================

  return (
    <div className="live-page">

      {/* SIDEBAR */}

      <aside className="live-sidebar">

        <div className="live-brand">
          <div className="live-brand-icon">
            🛡️
          </div>

          <div>
            <h2>NetShield</h2>
            <span>AI SECURITY</span>
          </div>
        </div>

        <div className="live-nav-section">

          <p>MONITORING</p>

          <button
            type="button"
            className="live-nav-item"
            onClick={() => navigate("/dashboard")}
          >
            <span>▦</span>
            Dashboard
          </button>

          <button
            type="button"
            className="live-nav-item active"
          >
            <span>◉</span>
            Live Network
          </button>

          <button
            type="button"
            className="live-nav-item"
            onClick={() => navigate("/threat-alerts")}
          >
            <span>⚠</span>
            Threat Alerts
          </button>

          <button
            type="button"
            className="live-nav-item"
            onClick={() => navigate("/analytics")}
          >
            <span>⌁</span>
            Threat Analysis
          </button>

        </div>

        <div className="live-nav-section">

          <p>INTELLIGENCE</p>

          <button
            type="button"
            className="live-nav-item"
            onClick={() => navigate("/predictions")}
          >
            <span>✦</span>
            AI Predictions
          </button>

          <button
            type="button"
            className="live-nav-item"
            onClick={() => navigate("/analytics")}
          >
            <span>◷</span>
            Threat Timeline
          </button>

        </div>

        <div className="live-sidebar-bottom">

          <div className="live-system-card">

            <span className="live-system-dot"></span>

            <div>
              <strong>Operational</strong>

              <span>
                Live monitoring active
              </span>
            </div>

          </div>

          <div className="live-version">
            NETSHIELD AI • MILESTONE 3
          </div>

        </div>

      </aside>

      {/* MAIN */}

      <main className="live-main">

        {/* HEADER */}

        <header className="live-topbar">

          <div>

            <div className="live-top-label">
              SECURITY / LIVE MONITORING
            </div>

            <h1>
              Live Network Monitoring
            </h1>

            <p>
              Real-time AI analysis of network
              traffic, threats and security events.
            </p>

          </div>

          <div className="live-header-actions">

            <div className="live-status">
              <span></span>
              LIVE MONITORING
            </div>

            <button
              type="button"
              className="live-refresh-button"
              onClick={() => fetchLiveData(false)}
              disabled={refreshing}
            >
              <span
                className={
                  refreshing ? "live-spin" : ""
                }
              >
                ↻
              </span>

              {refreshing
                ? "Refreshing..."
                : "Refresh"}
            </button>

          </div>

        </header>

        {/* ERROR */}

        {error && (
          <div className="live-error">
            ⚠️ {error}
          </div>
        )}

        {/* SUMMARY */}

        <section className="live-summary">

          <div className="live-summary-card blue">
            <div className="live-card-icon">◈</div>

            <div>
              <span>TOTAL EVENTS</span>
              <strong>{summary.total}</strong>
              <small>Live network events</small>
            </div>
          </div>

          <div className="live-summary-card red">
            <div className="live-card-icon">⚠</div>

            <div>
              <span>THREATS DETECTED</span>
              <strong>{summary.threats}</strong>
              <small>AI detected threats</small>
            </div>
          </div>

          <div className="live-summary-card critical">
            <div className="live-card-icon">!</div>

            <div>
              <span>CRITICAL THREATS</span>
              <strong>{summary.critical}</strong>
              <small>Immediate attention</small>
            </div>
          </div>

          <div className="live-summary-card purple">
            <div className="live-card-icon">◉</div>

            <div>
              <span>AVERAGE RISK</span>

              <strong>
                {summary.averageRisk}
                <small>/100</small>
              </strong>

              <small>Current AI risk score</small>
            </div>
          </div>

        </section>

        {/* CHART ROW 1 */}

        <section className="live-chart-grid">

          <div className="live-panel live-large-panel">

            <div className="live-panel-header">

              <div>
                <span>NETWORK TELEMETRY</span>
                <h2>Traffic Overview</h2>
              </div>

              <div className="panel-live-dot">
                <span></span>
                LIVE
              </div>

            </div>

            <div className="live-chart">

              <ResponsiveContainer
                width="100%"
                height="100%"
              >

                <AreaChart
                  data={trafficTrend}
                  margin={{
                    top: 10,
                    right: 15,
                    left: -15,
                    bottom: 0,
                  }}
                >

                  <defs>

                    <linearGradient
                      id="eventsGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor="#3b82f6"
                        stopOpacity={0.4}
                      />

                      <stop
                        offset="100%"
                        stopColor="#3b82f6"
                        stopOpacity={0}
                      />
                    </linearGradient>

                    <linearGradient
                      id="threatGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor="#ef4444"
                        stopOpacity={0.35}
                      />

                      <stop
                        offset="100%"
                        stopColor="#ef4444"
                        stopOpacity={0}
                      />
                    </linearGradient>

                  </defs>

                  <CartesianGrid
                    stroke="#17263a"
                    strokeDasharray="3 3"
                    vertical={false}
                  />

                  <XAxis
                    dataKey="time"
                    tick={{
                      fill: "#64748b",
                      fontSize: 10,
                    }}
                    axisLine={false}
                    tickLine={false}
                  />

                  <YAxis
                    tick={{
                      fill: "#64748b",
                      fontSize: 10,
                    }}
                    axisLine={false}
                    tickLine={false}
                  />

                  <Tooltip
                    content={<CustomTooltip />}
                  />

                  <Legend
                    wrapperStyle={{
                      fontSize: "10px",
                      paddingTop: "8px",
                    }}
                  />

                  <Area
                    type="monotone"
                    dataKey="events"
                    name="Events"
                    stroke="#3b82f6"
                    fill="url(#eventsGradient)"
                    strokeWidth={2}
                  />

                  <Area
                    type="monotone"
                    dataKey="threats"
                    name="Threats"
                    stroke="#ef4444"
                    fill="url(#threatGradient)"
                    strokeWidth={2}
                  />

                </AreaChart>

              </ResponsiveContainer>

            </div>

          </div>

          <div className="live-panel">

            <div className="live-panel-header">

              <div>
                <span>THREAT INTELLIGENCE</span>
                <h2>Threat Distribution</h2>
              </div>

            </div>

            <div className="live-pie-chart">

              <ResponsiveContainer
                width="100%"
                height="100%"
              >

                <PieChart>

                  <Pie
                    data={threatDistribution}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="43%"
                    innerRadius={52}
                    outerRadius={78}
                    paddingAngle={3}
                  >

                    {threatDistribution.map(
                      (entry, index) => (
                        <Cell
                          key={`threat-${index}`}
                          fill={
                            CHART_COLORS[
                              index %
                                CHART_COLORS.length
                            ]
                          }
                        />
                      )
                    )}

                  </Pie>

                  <Tooltip
                    content={<CustomTooltip />}
                  />

                  <Legend
                    verticalAlign="bottom"
                    iconType="circle"
                    wrapperStyle={{
                      fontSize: "9px",
                    }}
                  />

                </PieChart>

              </ResponsiveContainer>

            </div>

          </div>

        </section>

        {/* CHART ROW 2 */}

        <section className="live-chart-grid">

          <div className="live-panel">

            <div className="live-panel-header">

              <div>
                <span>SECURITY POSTURE</span>
                <h2>Severity Distribution</h2>
              </div>

            </div>

            <div className="live-chart medium-chart">

              <ResponsiveContainer
                width="100%"
                height="100%"
              >

                <BarChart
                  data={severityDistribution}
                  margin={{
                    top: 10,
                    right: 15,
                    left: -20,
                    bottom: 5,
                  }}
                >

                  <CartesianGrid
                    stroke="#17263a"
                    strokeDasharray="3 3"
                    vertical={false}
                  />

                  <XAxis
                    dataKey="name"
                    tick={{
                      fill: "#64748b",
                      fontSize: 10,
                    }}
                    axisLine={false}
                    tickLine={false}
                  />

                  <YAxis
                    tick={{
                      fill: "#64748b",
                      fontSize: 10,
                    }}
                    axisLine={false}
                    tickLine={false}
                  />

                  <Tooltip
                    content={<CustomTooltip />}
                  />

                  <Bar
                    dataKey="value"
                    name="Events"
                    radius={[5, 5, 0, 0]}
                  >

                    {severityDistribution.map(
                      (entry, index) => {

                        const colors = {
                          Critical: "#ef4444",
                          High: "#f97316",
                          Medium: "#eab308",
                          Low: "#22c55e",
                        };

                        return (
                          <Cell
                            key={`severity-${index}`}
                            fill={
                              colors[entry.name]
                            }
                          />
                        );
                      }
                    )}

                  </Bar>

                </BarChart>

              </ResponsiveContainer>

            </div>

          </div>

          <div className="live-panel">

            <div className="live-panel-header">

              <div>
                <span>NETWORK TELEMETRY</span>
                <h2>Protocol Distribution</h2>
              </div>

            </div>

            <div className="live-chart medium-chart">

              <ResponsiveContainer
                width="100%"
                height="100%"
              >

                <BarChart
                  data={protocolDistribution}
                  layout="vertical"
                  margin={{
                    top: 5,
                    right: 15,
                    left: 10,
                    bottom: 5,
                  }}
                >

                  <CartesianGrid
                    stroke="#17263a"
                    strokeDasharray="3 3"
                    horizontal={false}
                  />

                  <XAxis
                    type="number"
                    tick={{
                      fill: "#64748b",
                      fontSize: 10,
                    }}
                    axisLine={false}
                    tickLine={false}
                  />

                  <YAxis
                    type="category"
                    dataKey="name"
                    width={50}
                    tick={{
                      fill: "#94a3b8",
                      fontSize: 10,
                    }}
                    axisLine={false}
                    tickLine={false}
                  />

                  <Tooltip
                    content={<CustomTooltip />}
                  />

                  <Bar
                    dataKey="value"
                    name="Connections"
                    fill="#8b5cf6"
                    radius={[0, 5, 5, 0]}
                  />

                </BarChart>

              </ResponsiveContainer>

            </div>

          </div>

        </section>

        {/* SERVICES */}

        <section className="live-panel service-panel">

          <div className="live-panel-header">

            <div>
              <span>NETWORK TELEMETRY</span>
              <h2>Top Network Services</h2>
            </div>

            <span className="result-label">
              TOP SERVICES
            </span>

          </div>

          <div className="service-chart">

            <ResponsiveContainer
              width="100%"
              height="100%"
            >

              <BarChart
                data={serviceDistribution}
                margin={{
                  top: 5,
                  right: 20,
                  left: 0,
                  bottom: 5,
                }}
              >

                <CartesianGrid
                  stroke="#17263a"
                  strokeDasharray="3 3"
                  vertical={false}
                />

                <XAxis
                  dataKey="name"
                  tick={{
                    fill: "#64748b",
                    fontSize: 10,
                  }}
                  axisLine={false}
                  tickLine={false}
                />

                <YAxis
                  tick={{
                    fill: "#64748b",
                    fontSize: 10,
                  }}
                  axisLine={false}
                  tickLine={false}
                />

                <Tooltip
                  content={<CustomTooltip />}
                />

                <Bar
                  dataKey="value"
                  name="Connections"
                  fill="#06b6d4"
                  radius={[5, 5, 0, 0]}
                />

              </BarChart>

            </ResponsiveContainer>

          </div>

        </section>

        {/* LIVE EVENTS */}

        <section className="live-panel live-events-panel">

          <div className="live-panel-header">

            <div>
              <span>LIVE SECURITY FEED</span>
              <h2>Recent Network Events</h2>
            </div>

            <div className="live-feed-info">
              <span></span>
              AUTO REFRESH: 5s
            </div>

          </div>

          {recentAlerts.length === 0 ? (

            <div className="live-empty">

              <div>📡</div>

              <h3>No network events</h3>

              <p>
                Waiting for live network activity...
              </p>

            </div>

          ) : (

            <div className="live-table-wrapper">

              <table className="live-table">

                <thead>

                  <tr>
                    <th>TIME</th>
                    <th>THREAT</th>
                    <th>SERVICE</th>
                    <th>PROTOCOL</th>
                    <th>SEVERITY</th>
                    <th>RISK</th>
                    <th>CONFIDENCE</th>
                    <th>STATUS</th>
                    <th>ACTION</th>
                  </tr>

                </thead>

                <tbody>

                  {recentAlerts.map((item, index) => {

                    const status = getStatus(item);
                    const severity = getSeverity(item);
                    const risk = getRisk(item);

                    const alertId = getAlertId(item);

                    return (
                      <tr
                        key={
                          alertId ||
                          `${item.timestamp || ""}-${index}`
                        }
                      >

                        <td>
                          {formatTime(
                            item.timestamp ||
                              item.created_at ||
                              item.detection_time
                          )}
                        </td>

                        <td>
                          <strong>
                            {getThreatType(item)}
                          </strong>
                        </td>

                        <td>
                          {item.service ||
                            item.service_name ||
                            "-"}
                        </td>

                        <td>
                          {item.protocol ||
                            item.protocol_type ||
                            "-"}
                        </td>

                        {/* FIXED SEVERITY COLUMN */}

                        <td>
                          <span
                            className={`status-badge severity-${String(
                              severity
                            ).toLowerCase()}`}
                          >
                            {severity}
                          </span>
                        </td>

                        {/* RISK */}

                        <td>
                          <strong
                            className={`risk-number ${
                              risk >= 80
                                ? "risk-critical"
                                : risk >= 60
                                ? "risk-high"
                                : "risk-normal"
                            }`}
                          >
                            {risk}/100
                          </strong>
                        </td>

                        {/* CONFIDENCE */}

                        <td>
                          <div className="confidence">

                            <strong>
                              {item.confidence ?? 0}%
                            </strong>

                            <div className="confidence-track">

                              <div
                                style={{
                                  width: `${Math.min(
                                    Number(
                                      item.confidence
                                    ) || 0,
                                    100
                                  )}%`,
                                }}
                              ></div>

                            </div>

                          </div>
                        </td>

                        {/* STATUS */}

                        <td>

                          <span
                            className={`event-status ${
                              status === "Threat Detected"
                                ? "event-threat"
                                : "event-normal"
                            }`}
                          >
                            <span></span>
                            {status}
                          </span>

                        </td>

                        {/* INVESTIGATE */}

                        <td className="live-action-cell">

                          <button
                            type="button"
                            className="live-investigate-button"
                            disabled={!alertId}
                            onClick={() =>
                              investigateAlert(item)
                            }
                          >
                            <span className="investigate-icon">
                              ⌕
                            </span>

                            <span>
                              Investigate
                            </span>

                            <span className="investigate-arrow">
                              →
                            </span>
                          </button>

                        </td>

                      </tr>
                    );
                  })}

                </tbody>

              </table>

            </div>

          )}

        </section>

        {/* SYSTEM STATUS */}

        <section className="live-system-grid">

          <div className="system-status-card">

            <div className="system-icon">🧠</div>

            <div>
              <span>AI DETECTION ENGINE</span>
              <strong>Random Forest</strong>
            </div>

            <b className="system-online">
              ONLINE
            </b>

          </div>

          <div className="system-status-card">

            <div className="system-icon">🗄️</div>

            <div>
              <span>ALERT DATABASE</span>
              <strong>MongoDB</strong>
            </div>

            <b className="system-online">
              CONNECTED
            </b>

          </div>

          <div className="system-status-card">

            <div className="system-icon">📡</div>

            <div>
              <span>LIVE MONITOR</span>
              <strong>
                Continuous Monitoring
              </strong>
            </div>

            <b className="system-online">
              ACTIVE
            </b>

          </div>

        </section>

        {/* FOOTER */}

        <footer className="live-footer">

          <div>
            🛡️ <strong>NetShield AI</strong>{" "}
            • AI-Powered Network Anomaly Detection
          </div>

          <div className="footer-online">
            <span></span>
            All systems operational
          </div>

          <div>
            Milestone 3 • Live Network
          </div>

        </footer>

      </main>

    </div>
  );
}

export default LiveNetwork;