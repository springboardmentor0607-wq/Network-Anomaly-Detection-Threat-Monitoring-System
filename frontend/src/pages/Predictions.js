import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts";
import { useNavigate } from "react-router-dom";
import "./Predictions.css";

const API_URL = "http://127.0.0.1:8000";

function Predictions() {
  const navigate = useNavigate();

  const [data, setData] = useState({
    summary: {},
    predictions: [],
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  // ============================================================
  // FETCH PREDICTIONS
  // ============================================================

  const fetchPredictions = async () => {
    try {
      setRefreshing(true);

      const response = await axios.get(
        `${API_URL}/predictions/`
      );

      console.log("Predictions API:", response.data);

      setData(response.data || {
        summary: {},
        predictions: [],
      });

      setError("");
    } catch (err) {
      console.error("Predictions API Error:", err);

      setError(
        err.response?.data?.detail ||
        "Unable to load AI predictions."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPredictions();

    const interval = setInterval(() => {
      fetchPredictions();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const summary = data?.summary || {};
  const predictions = useMemo(
  () => data?.predictions || [],
  [data?.predictions]
);
  // ============================================================
  // COLORS
  // ============================================================

  const chartColors = [
    "#3b82f6",
    "#ef4444",
    "#f97316",
    "#8b5cf6",
    "#06b6d4",
    "#22c55e",
    "#eab308",
    "#ec4899",
  ];

  // ============================================================
  // THREAT DISTRIBUTION
  // ============================================================

  const threatDistribution = useMemo(() => {
    const counts = {};

    predictions.forEach((item) => {
      const threat =
        item?.threat_type ||
        item?.prediction ||
        "Unknown";

      counts[threat] = (counts[threat] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([name, value]) => ({
        name,
        value,
      }))
      .sort((a, b) => b.value - a.value);
  }, [predictions]);

  // ============================================================
  // SEVERITY DATA
  // ============================================================

  const severityData = useMemo(() => {
    const levels = [
      "Critical",
      "High",
      "Medium",
      "Low",
    ];

    return levels.map((level) => ({
      name: level,
      count: predictions.filter(
        (item) =>
          String(item?.severity || "").toLowerCase() ===
          level.toLowerCase()
      ).length,
    }));
  }, [predictions]);

  // ============================================================
  // RISK DISTRIBUTION
  // ============================================================

  const riskData = useMemo(() => {
    const ranges = [
      {
        name: "Low",
        min: 0,
        max: 24,
      },
      {
        name: "Moderate",
        min: 25,
        max: 49,
      },
      {
        name: "High",
        min: 50,
        max: 74,
      },
      {
        name: "Critical",
        min: 75,
        max: 100,
      },
    ];

    return ranges.map((range) => ({
      name: range.name,
      count: predictions.filter((item) => {
        const risk = Number(item?.risk_score || 0);

        return (
          risk >= range.min &&
          risk <= range.max
        );
      }).length,
    }));
  }, [predictions]);

  // ============================================================
  // CONFIDENCE DATA
  // ============================================================

  const confidenceData = useMemo(() => {
    return predictions
      .slice(0, 8)
      .map((item, index) => ({
        name:
          item?.threat_type ||
          item?.prediction ||
          `Prediction ${index + 1}`,
        confidence:
          Number(item?.confidence) || 0,
      }));
  }, [predictions]);

  // ============================================================
  // PREDICTION TREND
  // ============================================================

  const trendData = useMemo(() => {
    const groups = {};

    predictions.forEach((item) => {
      if (!item?.timestamp) return;

      const date = new Date(item.timestamp);

      if (Number.isNaN(date.getTime())) return;

      const label = date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });

      groups[label] = (groups[label] || 0) + 1;
    });

    return Object.entries(groups)
      .map(([time, predictions]) => ({
        time,
        predictions,
      }))
      .slice(-12);
  }, [predictions]);

  // ============================================================
  // THREAT RATE
  // ============================================================

  const threatRate = useMemo(() => {
    if (!predictions.length) return 0;

    const threats = predictions.filter((item) => {
      const status = String(
        item?.status || ""
      ).toLowerCase();

      const threat = String(
        item?.threat_type ||
        item?.prediction ||
        ""
      ).toLowerCase();

      return (
        status.includes("threat") ||
        !threat.includes("normal")
      );
    }).length;

    return Math.round(
      (threats / predictions.length) * 100
    );
  }, [predictions]);

  // ============================================================
  // TIME FORMAT
  // ============================================================

  const formatTime = (timestamp) => {
    if (!timestamp) return "-";

    const date = new Date(timestamp);

    if (Number.isNaN(date.getTime())) {
      return timestamp;
    }

    return date.toLocaleString();
  };

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <div className="predictions-loading">
        <div className="loading-orbit">
          🧠
        </div>

        <h1>NetShield AI</h1>

        <p>
          Initializing AI threat intelligence...
        </p>

        <div className="loading-line">
          <span></span>
        </div>
      </div>
    );
  }

  // ============================================================
  // PAGE
  // ============================================================

  return (
    <div className="predictions-page">

      {/* ========================================================
          SIDEBAR
      ======================================================== */}

      <aside className="predictions-sidebar">

        <div className="predictions-brand">

          <div className="brand-icon">
            🛡️
          </div>

          <div>
            <h2>NetShield</h2>
            <span>AI SECURITY</span>
          </div>

        </div>

        <div className="nav-section">

          <p>MONITORING</p>

          <button
            onClick={() => navigate("/dashboard")}
          >
            <span>▦</span>
            Dashboard
          </button>

          <button
            onClick={() => navigate("/live-network")}
          >
            <span>◉</span>
            Live Network
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
            <span>⌁</span>
            Threat Analysis
          </button>

        </div>

        <div className="nav-section">

          <p>INTELLIGENCE</p>

          <button className="active">
            <span>✦</span>
            AI Predictions
          </button>

          <button
            onClick={() => navigate("/analytics")}
          >
            <span>◷</span>
            Threat Timeline
          </button>

        </div>

        <div className="sidebar-bottom">

          <div className="system-status">

            <span></span>

            <div>
              <strong>AI Engine Online</strong>
              <small>Prediction service active</small>
            </div>

          </div>

          <div className="version">
            NETSHIELD AI • MILESTONE 4
          </div>

        </div>

      </aside>

      {/* ========================================================
          MAIN
      ======================================================== */}

      <main className="predictions-main">

        {/* HEADER */}

        <header className="predictions-header">

          <div>

            <span className="page-label">
              SECURITY / AI INTELLIGENCE
            </span>

            <h1>
              AI Threat Intelligence
            </h1>

            <p>
              Predictive analysis of network threats
              powered by machine learning.
            </p>

          </div>

          <div className="header-actions">

            <div className="online-status">
              <span></span>
              AI ENGINE ONLINE
            </div>

            <button
              onClick={fetchPredictions}
              disabled={refreshing}
            >
              ↻ {refreshing ? "Refreshing..." : "Refresh"}
            </button>

          </div>

        </header>

        {/* ERROR */}

        {error && (
          <div className="prediction-error">
            <span>⚠️</span>

            <div>
              <strong>Prediction Service Error</strong>
              <p>{error}</p>
            </div>

            <button onClick={fetchPredictions}>
              Retry
            </button>
          </div>
        )}

        {/* ======================================================
            TOP AI STATUS
        ====================================================== */}

        <section className="ai-status-panel">

          <div className="ai-status-left">

            <div className="ai-brain">
              🧠
            </div>

            <div>
              <span>ACTIVE MACHINE LEARNING MODEL</span>

              <h2>
                Random Forest Threat Predictor
              </h2>

              <p>
                Continuously classifying network activity
                and estimating security risk.
              </p>
            </div>

          </div>

          <div className="model-state">
            <div className="pulse"></div>
            <strong>ONLINE</strong>
            <span>Real-time inference</span>
          </div>

        </section>

        {/* ======================================================
            SUMMARY CARDS
        ====================================================== */}

        <section className="summary-grid">

          <div className="summary-card blue">
            <span>TOTAL PREDICTIONS</span>
            <strong>
              {summary.total_predictions ?? predictions.length}
            </strong>
            <small>AI decisions analyzed</small>
          </div>

          <div className="summary-card red">
            <span>THREAT PREDICTIONS</span>
            <strong>
              {summary.threat_predictions ?? 0}
            </strong>
            <small>Potential attacks detected</small>
          </div>

          <div className="summary-card critical">
            <span>CRITICAL THREATS</span>
            <strong>
              {summary.critical_predictions ?? 0}
            </strong>
            <small>Require immediate attention</small>
          </div>

          <div className="summary-card purple">
            <span>AVG CONFIDENCE</span>
            <strong>
              {summary.average_confidence ?? 0}%
            </strong>
            <small>Model prediction confidence</small>
          </div>

          <div className="summary-card orange">
            <span>THREAT RATE</span>
            <strong>
              {threatRate}%
            </strong>
            <small>Predictions classified as threats</small>
          </div>

        </section>

        {/* ======================================================
            CHART 1 + CHART 2
        ====================================================== */}

        <section className="chart-grid">

          {/* PREDICTION TREND */}

          <div className="chart-card large">

            <div className="chart-header">

              <div>
                <span>REAL-TIME INTELLIGENCE</span>
                <h2>Prediction Activity</h2>
              </div>

              <div className="chart-indicator">
                <span></span>
                LIVE
              </div>

            </div>

            <div className="chart-area">

              {trendData.length === 0 ? (

                <div className="chart-empty">
                  <span>📈</span>
                  <p>No prediction trend data available</p>
                </div>

              ) : (

                <ResponsiveContainer width="100%" height={300}>

                  <AreaChart data={trendData}>

                    <defs>
                      <linearGradient
                        id="predictionGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#3b82f6"
                          stopOpacity={0.35}
                        />

                        <stop
                          offset="95%"
                          stopColor="#3b82f6"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>

                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#1e293b"
                    />

                    <XAxis
                      dataKey="time"
                      stroke="#64748b"
                      fontSize={10}
                    />

                    <YAxis
                      stroke="#64748b"
                      fontSize={10}
                    />

                    <Tooltip
                      contentStyle={{
                        background: "#0d1929",
                        border: "1px solid #26364d",
                        borderRadius: "8px",
                        color: "#fff",
                      }}
                    />

                    <Area
                      type="monotone"
                      dataKey="predictions"
                      stroke="#3b82f6"
                      fill="url(#predictionGradient)"
                      strokeWidth={3}
                    />

                  </AreaChart>

                </ResponsiveContainer>

              )}

            </div>

          </div>

          {/* THREAT DISTRIBUTION */}

          <div className="chart-card">

            <div className="chart-header">

              <div>
                <span>CLASSIFICATION</span>
                <h2>Threat Distribution</h2>
              </div>

            </div>

            {threatDistribution.length === 0 ? (

              <div className="chart-empty">
                <span>🍩</span>
                <p>No threat data available</p>
              </div>

            ) : (

              <div className="pie-container">

                <ResponsiveContainer width="100%" height={250}>

                  <PieChart>

                    <Pie
                      data={threatDistribution}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={95}
                      paddingAngle={3}
                    >

                      {threatDistribution.map(
                        (entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={
                              chartColors[
                                index %
                                chartColors.length
                              ]
                            }
                          />
                        )
                      )}

                    </Pie>

                    <Tooltip
                      contentStyle={{
                        background: "#0d1929",
                        border: "1px solid #26364d",
                        borderRadius: "8px",
                        color: "#fff",
                      }}
                    />

                  </PieChart>

                </ResponsiveContainer>

                <div className="pie-legend">

                  {threatDistribution
                    .slice(0, 5)
                    .map((item, index) => (

                      <div
                        className="legend-item"
                        key={item.name}
                      >

                        <span
                          style={{
                            background:
                              chartColors[
                                index %
                                chartColors.length
                              ],
                          }}
                        ></span>

                        <label>
                          {item.name}
                        </label>

                        <strong>
                          {item.value}
                        </strong>

                      </div>

                    ))}

                </div>

              </div>

            )}

          </div>

        </section>

        {/* ======================================================
            CHART 3 + CHART 4
        ====================================================== */}

        <section className="chart-grid">

          {/* SEVERITY */}

          <div className="chart-card">

            <div className="chart-header">

              <div>
                <span>THREAT SEVERITY</span>
                <h2>Severity Breakdown</h2>
              </div>

            </div>

            <ResponsiveContainer
              width="100%"
              height={280}
            >

              <BarChart data={severityData}>

                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#1e293b"
                  vertical={false}
                />

                <XAxis
                  dataKey="name"
                  stroke="#64748b"
                  fontSize={10}
                />

                <YAxis
                  stroke="#64748b"
                  fontSize={10}
                />

                <Tooltip
                  contentStyle={{
                    background: "#0d1929",
                    border: "1px solid #26364d",
                    borderRadius: "8px",
                  }}
                />

                <Bar
                  dataKey="count"
                  fill="#ef4444"
                  radius={[5, 5, 0, 0]}
                />

              </BarChart>

            </ResponsiveContainer>

          </div>

          {/* RISK */}

          <div className="chart-card">

            <div className="chart-header">

              <div>
                <span>RISK INTELLIGENCE</span>
                <h2>Risk Distribution</h2>
              </div>

            </div>

            <ResponsiveContainer
              width="100%"
              height={280}
            >

              <BarChart
                data={riskData}
                layout="vertical"
              >

                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#1e293b"
                  horizontal={false}
                />

                <XAxis
                  type="number"
                  stroke="#64748b"
                  fontSize={10}
                />

                <YAxis
                  type="category"
                  dataKey="name"
                  stroke="#64748b"
                  fontSize={10}
                  width={65}
                />

                <Tooltip
                  contentStyle={{
                    background: "#0d1929",
                    border: "1px solid #26364d",
                    borderRadius: "8px",
                  }}
                />

                <Bar
                  dataKey="count"
                  fill="#f97316"
                  radius={[0, 5, 5, 0]}
                />

              </BarChart>

            </ResponsiveContainer>

          </div>

        </section>

        {/* ======================================================
            CHART 5 — CONFIDENCE
        ====================================================== */}

        <section className="chart-card confidence-card">

          <div className="chart-header">

            <div>
              <span>MODEL PERFORMANCE</span>
              <h2>AI Confidence by Prediction</h2>
            </div>

            <div className="confidence-badge">
              MODEL CONFIDENCE
            </div>

          </div>

          {confidenceData.length === 0 ? (

            <div className="chart-empty">
              <span>🎯</span>
              <p>No confidence data available</p>
            </div>

          ) : (

            <ResponsiveContainer
              width="100%"
              height={300}
            >

              <BarChart
                data={confidenceData}
                layout="vertical"
                margin={{
                  left: 20,
                  right: 30,
                }}
              >

                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#1e293b"
                  horizontal={false}
                />

                <XAxis
                  type="number"
                  domain={[0, 100]}
                  stroke="#64748b"
                  fontSize={10}
                />

                <YAxis
                  type="category"
                  dataKey="name"
                  width={120}
                  stroke="#64748b"
                  fontSize={10}
                />

                <Tooltip
                  contentStyle={{
                    background: "#0d1929",
                    border: "1px solid #26364d",
                    borderRadius: "8px",
                  }}
                  formatter={(value) => [
                    `${value}%`,
                    "Confidence",
                  ]}
                />

                <Bar
                  dataKey="confidence"
                  fill="#8b5cf6"
                  radius={[0, 6, 6, 0]}
                />

              </BarChart>

            </ResponsiveContainer>

          )}

        </section>

        {/* ======================================================
            RECENT PREDICTIONS
        ====================================================== */}

        <section className="recent-panel">

          <div className="chart-header">

            <div>
              <span>PREDICTION LOG</span>
              <h2>Recent AI Decisions</h2>
            </div>

            <strong>
              {predictions.length} RESULTS
            </strong>

          </div>

          {predictions.length === 0 ? (

            <div className="empty-state">

              <div>🧠</div>

              <h3>No Predictions Available</h3>

              <p>
                The AI engine has not generated
                predictions yet.
              </p>

            </div>

          ) : (

            <div className="prediction-list">

              {predictions
                .slice(0, 10)
                .map((item, index) => {

                  const threat =
                    item?.threat_type ||
                    item?.prediction ||
                    "Unknown";

                  const severity =
                    item?.severity ||
                    "Low";

                  const confidence =
                    Number(item?.confidence) || 0;

                  const risk =
                    Number(item?.risk_score) || 0;

                  return (

                    <div
                      className="prediction-row"
                      key={item.id || index}
                    >

                      <div className="prediction-number">
                        #{String(index + 1).padStart(2, "0")}
                      </div>

                      <div className="prediction-threat">

                        <strong>
                          {threat}
                        </strong>

                        <span>
                          {formatTime(item.timestamp)}
                        </span>

                      </div>

                      <span
                        className={`severity ${String(
                          severity
                        ).toLowerCase()}`}
                      >
                        {severity}
                      </span>

                      <div className="mini-confidence">

                        <span>
                          {confidence}%
                        </span>

                        <div>
                          <i
                            style={{
                              width: `${Math.min(
                                Math.max(
                                  confidence,
                                  0
                                ),
                                100
                              )}%`,
                            }}
                          ></i>
                        </div>

                      </div>

                      <div className="prediction-risk">

                        <span>RISK</span>

                        <strong>
                          {risk}
                        </strong>

                      </div>

                      <span
                        className={`prediction-status ${
                          String(
                            item?.status || ""
                          )
                            .toLowerCase()
                            .includes("threat")
                            ? "threat"
                            : "normal"
                        }`}
                      >
                        {item?.status || "Unknown"}
                      </span>

                    </div>

                  );
                })}

            </div>

          )}

        </section>

        {/* FOOTER */}

        <footer className="predictions-footer">

          <span>
            🛡️ <strong>NetShield AI</strong>
            {" "}• Predictive Network Security
          </span>

          <span className="footer-online">
            ● AI Engine Operational
          </span>

          <span>
            Milestone 4 • AI Intelligence
          </span>

        </footer>

      </main>

    </div>
  );
}

export default Predictions;