import React, { useEffect, useState } from "react";
import axios from "axios";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const API_BASE_URL = "https://network-anomaly-detection-threat-5ihm.onrender.com";

const SecurityHomePage = () => {
  // ============================================================
  // STATE
  // ============================================================

  const [dashboard, setDashboard] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [alertStats, setAlertStats] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [alertStatsError, setAlertStatsError] = useState("");

  // ============================================================
  // LOAD ALL DASHBOARD DATA
  // ============================================================

  useEffect(() => {
    loadDashboard();
    loadAnalytics();
    loadAlertStats();
  }, []);

  // ============================================================
  // SECURITY DASHBOARD
  // GET /dashboard/security
  // ============================================================

  const loadDashboard = async () => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/dashboard/security`
      );

      setDashboard(response.data);
      setError("");
    } catch (err) {
      console.error("Security Dashboard Error:", err);
      setError("Unable to load security dashboard data.");
    }
  };

  // ============================================================
  // SECURITY ANALYTICS
  // GET /dashboard/analytics
  // ============================================================

  const loadAnalytics = async () => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/dashboard/analytics`
      );

      setAnalytics(response.data);
    } catch (err) {
      console.error("Security Analytics Error:", err);

      setError((previous) =>
        previous || "Unable to load security analytics data."
      );
    }
  };

  // ============================================================
  // ALERT STATISTICS
  // GET /api/alerts/statistics
  // ============================================================

  const loadAlertStats = async () => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/alerts/statistics`
      );

      console.log(
        "Alert Statistics Response:",
        response.data
      );

      setAlertStats(response.data);
      setAlertStatsError("");
    } catch (err) {
      console.error(
        "Alert Statistics Error:",
        err
      );

      setAlertStatsError(
        "Unable to load alert severity statistics."
      );
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <div
        style={{
          padding: "40px",
          fontSize: "18px",
        }}
      >
        Loading Security Analyst Dashboard...
      </div>
    );
  }

  // ============================================================
  // NUMBER FORMATTER
  // ============================================================

  const formatNumber = (value) => {
    const number = Number(value || 0);

    return number.toLocaleString();
  };

  // ============================================================
  // SECURITY ANALYTICS VALUES
  // These values come from MongoDB through /dashboard/analytics
  // ============================================================

  const totalPredictions = Number(
    analytics?.total_predictions || 0
  );

  const analyzedPredictions = Number(
    analytics?.analyzed_predictions || 0
  );

  const totalRecords = Number(
    analytics?.total_records || 0
  );

  const totalThreats = Number(
    analytics?.total_threats || 0
  );

  const benignRecords = Number(
    analytics?.benign_records || 0
  );

  const threatPercentage = Number(
    analytics?.threat_percentage || 0
  );

  const benignPercentage = Number(
    analytics?.benign_percentage || 0
  );

  const averageConfidence = Number(
    analytics?.average_confidence || 0
  );

  const mostFrequentAttack =
    analytics?.most_frequent_attack || "None";

  // ============================================================
  // THREAT SUMMARY
  // Comes from /dashboard/security
  // ============================================================

  const threatSummary =
    dashboard?.threat_summary || {};

  const threatEntries =
    Object.entries(threatSummary);

  // ============================================================
  // LATEST AI PREDICTIONS
  // ============================================================

  const latestPredictions =
    Array.isArray(dashboard?.latest_predictions)
      ? dashboard.latest_predictions
      : [];

  // ============================================================
  // ATTACK DISTRIBUTION
  // ============================================================

  const attackDistribution =
    analytics?.attack_distribution || {};

  const attackChartData =
    Object.entries(attackDistribution).map(
      ([attack, count]) => ({
        attack,
        count: Number(count || 0),
      })
    );

  // ============================================================
  // THREAT VS BENIGN
  // ============================================================

  const threatBenignChartData = [
    {
      name: "Benign",
      value: benignRecords,
    },
    {
      name: "Threats",
      value: totalThreats,
    },
  ];

  // ============================================================
  // DATASET DISTRIBUTION
  // IMPORTANT:
  // Backend counts prediction documents, not individual records.
  // ============================================================

  const datasetDistribution =
    analytics?.dataset_distribution || {};

  const datasetChartData =
    Object.entries(datasetDistribution).map(
      ([dataset, count]) => ({
        dataset,
        count: Number(count || 0),
      })
    );

  // ============================================================
  // ALERT STATISTICS
  // ============================================================

  const severityDistribution =
    alertStats?.severity_distribution ||
    alertStats?.by_severity ||
    {};

  const getSeverityCount = (severity) => {
    return Number(
      severityDistribution[severity] ||
        severityDistribution[severity.toLowerCase()] ||
        0
    );
  };

  const criticalAlerts =
    getSeverityCount("Critical");

  const highAlerts =
    getSeverityCount("High");

  const mediumAlerts =
    getSeverityCount("Medium");

  const lowAlerts =
    getSeverityCount("Low");

  const severityChartData = [
    {
      severity: "Critical",
      count: criticalAlerts,
    },
    {
      severity: "High",
      count: highAlerts,
    },
    {
      severity: "Medium",
      count: mediumAlerts,
    },
    {
      severity: "Low",
      count: lowAlerts,
    },
  ];

  const totalSeverityAlerts =
    criticalAlerts +
    highAlerts +
    mediumAlerts +
    lowAlerts;

  // ============================================================
  // ALERT TOTAL
  // ============================================================

  const totalAlerts =
    Number(
      alertStats?.total ||
      alertStats?.total_alerts ||
      analytics?.alerts?.total ||
      0
    );

  // ============================================================
  // INCIDENT ANALYTICS
  // ============================================================

  const incidents =
    analytics?.incidents || {};

  const totalIncidents =
    Number(incidents.total || 0);

  const openIncidents =
    Number(incidents.open || 0);

  const acknowledgedIncidents =
    Number(incidents.acknowledged || 0);

  const investigatingIncidents =
    Number(incidents.investigating || 0);

  const resolvedIncidents =
    Number(incidents.resolved || 0);

  const closedIncidents =
    Number(incidents.closed || 0);

  const incidentStatusChartData = [
    {
      status: "Open",
      count: openIncidents,
    },
    {
      status: "Acknowledged",
      count: acknowledgedIncidents,
    },
    {
      status: "Investigating",
      count: investigatingIncidents,
    },
    {
      status: "Resolved",
      count: resolvedIncidents,
    },
    {
      status: "Closed",
      count: closedIncidents,
    },
  ];

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div
      style={{
        padding: "30px",
        background: "#f5f7fb",
        minHeight: "100vh",
      }}
    >
      {/* ======================================================
          HEADER
      ====================================================== */}

      <div
        style={{
          marginBottom: "30px",
        }}
      >
        <h1
          style={{
            marginBottom: "8px",
            fontSize: "30px",
            fontWeight: "700",
          }}
        >
          🛡 Security Analyst Dashboard
        </h1>

        <p
          style={{
            margin: 0,
            color: "#666",
            fontSize: "15px",
          }}
        >
          Network anomaly detection, threat monitoring
          and security analytics
        </p>
      </div>

      {/* ======================================================
          ERROR
      ====================================================== */}

      {error && (
        <div
          style={{
            background: "#ffebee",
            color: "#c62828",
            padding: "15px",
            borderRadius: "8px",
            marginBottom: "20px",
          }}
        >
          {error}
        </div>
      )}

      {/* ======================================================
          KPI CARDS
      ====================================================== */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "20px",
          marginBottom: "30px",
        }}
      >
        {/* TOTAL RECORDS */}

        <div
          style={{
            background: "#fff",
            padding: "20px",
            borderRadius: "12px",
            boxShadow:
              "0 2px 10px rgba(0,0,0,0.08)",
          }}
        >
          <div
            style={{
              fontSize: "14px",
              color: "#666",
            }}
          >
            Total Records
          </div>

          <div
            style={{
              fontSize: "28px",
              fontWeight: "700",
              marginTop: "8px",
            }}
          >
            {formatNumber(totalRecords)}
          </div>
        </div>

        {/* THREATS */}

        <div
          style={{
            background: "#fff",
            padding: "20px",
            borderRadius: "12px",
            boxShadow:
              "0 2px 10px rgba(0,0,0,0.08)",
          }}
        >
          <div
            style={{
              fontSize: "14px",
              color: "#666",
            }}
          >
            Threat Records
          </div>

          <div
            style={{
              fontSize: "28px",
              fontWeight: "700",
              marginTop: "8px",
              color: "#d32f2f",
            }}
          >
            {formatNumber(totalThreats)}
          </div>
        </div>

        {/* BENIGN */}

        <div
          style={{
            background: "#fff",
            padding: "20px",
            borderRadius: "12px",
            boxShadow:
              "0 2px 10px rgba(0,0,0,0.08)",
          }}
        >
          <div
            style={{
              fontSize: "14px",
              color: "#666",
            }}
          >
            Benign Records
          </div>

          <div
            style={{
              fontSize: "28px",
              fontWeight: "700",
              marginTop: "8px",
              color: "#2e7d32",
            }}
          >
            {formatNumber(benignRecords)}
          </div>
        </div>

        {/* ALERTS */}

        <div
          style={{
            background: "#fff",
            padding: "20px",
            borderRadius: "12px",
            boxShadow:
              "0 2px 10px rgba(0,0,0,0.08)",
          }}
        >
          <div
            style={{
              fontSize: "14px",
              color: "#666",
            }}
          >
            Security Alerts
          </div>

          <div
            style={{
              fontSize: "28px",
              fontWeight: "700",
              marginTop: "8px",
            }}
          >
            {formatNumber(totalAlerts)}
          </div>
        </div>

        {/* INCIDENTS */}

        <div
          style={{
            background: "#fff",
            padding: "20px",
            borderRadius: "12px",
            boxShadow:
              "0 2px 10px rgba(0,0,0,0.08)",
          }}
        >
          <div
            style={{
              fontSize: "14px",
              color: "#666",
            }}
          >
            Incidents
          </div>

          <div
            style={{
              fontSize: "28px",
              fontWeight: "700",
              marginTop: "8px",
            }}
          >
            {formatNumber(totalIncidents)}
          </div>
        </div>

        {/* CONFIDENCE */}

        <div
          style={{
            background: "#fff",
            padding: "20px",
            borderRadius: "12px",
            boxShadow:
              "0 2px 10px rgba(0,0,0,0.08)",
          }}
        >
          <div
            style={{
              fontSize: "14px",
              color: "#666",
            }}
          >
            Average Confidence
          </div>

          <div
            style={{
              fontSize: "28px",
              fontWeight: "700",
              marginTop: "8px",
            }}
          >
            {averageConfidence.toFixed(2)}%
          </div>
        </div>
      </div>

      {/* ======================================================
          SECURITY ANALYTICS OVERVIEW
      ====================================================== */}

      <div
        style={{
          background: "#fff",
          padding: "25px",
          borderRadius: "12px",
          marginBottom: "30px",
          boxShadow:
            "0 2px 10px rgba(0,0,0,0.08)",
        }}
      >
        <h2
          style={{
            marginTop: 0,
            marginBottom: "20px",
          }}
        >
          📊 Security Analytics Overview
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "20px",
          }}
        >
          <div>
            <strong>Total Predictions</strong>

            <div style={{ marginTop: "5px" }}>
              {formatNumber(totalPredictions)}
            </div>
          </div>

          <div>
            <strong>Analyzed Predictions</strong>

            <div style={{ marginTop: "5px" }}>
              {formatNumber(analyzedPredictions)}
            </div>
          </div>

          <div>
            <strong>Threat Percentage</strong>

            <div
              style={{
                marginTop: "5px",
                color: "#d32f2f",
              }}
            >
              {threatPercentage.toFixed(2)}%
            </div>
          </div>

          <div>
            <strong>Benign Percentage</strong>

            <div
              style={{
                marginTop: "5px",
                color: "#2e7d32",
              }}
            >
              {benignPercentage.toFixed(2)}%
            </div>
          </div>

          <div>
            <strong>Most Frequent Attack</strong>

            <div style={{ marginTop: "5px" }}>
              {mostFrequentAttack}
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================
          THREAT OVERVIEW
      ====================================================== */}

      <div
        style={{
          background: "#fff",
          padding: "25px",
          borderRadius: "12px",
          marginBottom: "30px",
          boxShadow:
            "0 2px 10px rgba(0,0,0,0.08)",
        }}
      >
        <h2
          style={{
            marginTop: 0,
          }}
        >
          🛡 Threat Overview
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(350px, 1fr))",
            gap: "30px",
          }}
        >
          {/* THREAT VS BENIGN */}

          <div>
            <h3>
              🛡 Threat vs Benign Records
            </h3>

            <div
              style={{
                width: "100%",
                height: 350,
              }}
            >
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <PieChart>
                  <Pie
                    data={threatBenignChartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={120}
                    label
                  >
                    {threatBenignChartData.map(
                      (entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                        />
                      )
                    )}
                  </Pie>

                  <Tooltip />

                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* ATTACK DISTRIBUTION */}

          <div>
            <h3>
              📊 Attack Distribution
            </h3>

            <div
              style={{
                width: "100%",
                height: 350,
              }}
            >
              {attackChartData.length === 0 ? (
                <p>
                  No attack distribution data
                  available.
                </p>
              ) : (
                <ResponsiveContainer
                  width="100%"
                  height="100%"
                >
                  <BarChart
                    data={attackChartData}
                    margin={{
                      top: 20,
                      right: 30,
                      left: 20,
                      bottom: 60,
                    }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                    />

                    <XAxis
                      dataKey="attack"
                      angle={-20}
                      textAnchor="end"
                      interval={0}
                    />

                    <YAxis />

                    <Tooltip />

                    <Bar
                      dataKey="count"
                      name="Detected Records"
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================
          ATTACK DISTRIBUTION TABLE
      ====================================================== */}

      <div
        style={{
          background: "#fff",
          padding: "25px",
          borderRadius: "12px",
          marginBottom: "30px",
          boxShadow:
            "0 2px 10px rgba(0,0,0,0.08)",
        }}
      >
        <h3>
          📋 Attack Distribution
        </h3>

        {threatEntries.length === 0 ? (
          <p>
            No attack data available.
          </p>
        ) : (
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
            }}
          >
            <thead>
              <tr>
                <th
                  style={{
                    textAlign: "left",
                    padding: "12px",
                    borderBottom:
                      "1px solid #ddd",
                  }}
                >
                  Attack Type
                </th>

                <th
                  style={{
                    textAlign: "left",
                    padding: "12px",
                    borderBottom:
                      "1px solid #ddd",
                  }}
                >
                  Records
                </th>
              </tr>
            </thead>

            <tbody>
              {threatEntries.map(
                ([attack, count]) => (
                  <tr key={attack}>
                    <td
                      style={{
                        padding: "12px",
                        borderBottom:
                          "1px solid #eee",
                      }}
                    >
                      {attack}
                    </td>

                    <td
                      style={{
                        padding: "12px",
                        borderBottom:
                          "1px solid #eee",
                      }}
                    >
                      {formatNumber(count)}
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* ======================================================
          DATASET DISTRIBUTION
      ====================================================== */}

      <div
        style={{
          background: "#fff",
          padding: "25px",
          borderRadius: "12px",
          marginBottom: "30px",
          boxShadow:
            "0 2px 10px rgba(0,0,0,0.08)",
        }}
      >
        <h3>
          📚 Dataset Distribution
        </h3>

        {datasetChartData.length === 0 ? (
          <p>
            No dataset distribution data
            available.
          </p>
        ) : (
          <>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                marginBottom: "30px",
              }}
            >
              <thead>
                <tr>
                  <th
                    style={{
                      textAlign: "left",
                      padding: "12px",
                      borderBottom:
                        "1px solid #ddd",
                    }}
                  >
                    Dataset
                  </th>

                  <th
                    style={{
                      textAlign: "left",
                      padding: "12px",
                      borderBottom:
                        "1px solid #ddd",
                    }}
                  >
                    Prediction Runs
                  </th>
                </tr>
              </thead>

              <tbody>
                {datasetChartData.map(
                  ({ dataset, count }) => (
                    <tr key={dataset}>
                      <td
                        style={{
                          padding: "12px",
                          borderBottom:
                            "1px solid #eee",
                        }}
                      >
                        {dataset}
                      </td>

                      <td
                        style={{
                          padding: "12px",
                          borderBottom:
                            "1px solid #eee",
                        }}
                      >
                        {formatNumber(count)}
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>

            <h3>
              📈 Dataset Distribution Chart
            </h3>

            <div
              style={{
                width: "100%",
                height: 350,
              }}
            >
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <BarChart
                  data={datasetChartData}
                  margin={{
                    top: 20,
                    right: 30,
                    left: 20,
                    bottom: 40,
                  }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                  />

                  <XAxis
                    dataKey="dataset"
                    interval={0}
                  />

                  <YAxis
                    allowDecimals={false}
                  />

                  <Tooltip />

                  <Bar
                    dataKey="count"
                    name="Prediction Runs"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </div>

      {/* ======================================================
          ALERT SEVERITY DISTRIBUTION
      ====================================================== */}

      <div
        style={{
          background: "#fff",
          padding: "25px",
          borderRadius: "12px",
          marginBottom: "30px",
          boxShadow:
            "0 2px 10px rgba(0,0,0,0.08)",
        }}
      >
        <h3>
          🚨 Alert Severity Distribution
        </h3>

        {alertStatsError && (
          <p
            style={{
              color: "#d32f2f",
              fontWeight: "600",
            }}
          >
            {alertStatsError}
          </p>
        )}

        {!alertStats ? (
          <p>
            Loading alert severity
            statistics...
          </p>
        ) : (
          <>
            <div
              style={{
                width: "100%",
                height: 350,
              }}
            >
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <BarChart
                  data={severityChartData}
                  margin={{
                    top: 20,
                    right: 30,
                    left: 20,
                    bottom: 40,
                  }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                  />

                  <XAxis
                    dataKey="severity"
                    interval={0}
                  />

                  <YAxis
                    allowDecimals={false}
                  />

                  <Tooltip />

                  <Bar
                    dataKey="count"
                    name="Security Alerts"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* SUMMARY TABLE */}

            <h3>
              📋 Alert Severity Summary
            </h3>

            <div
              style={{
                overflowX: "auto",
              }}
            >
              <table
                style={{
                  width: "100%",
                  borderCollapse:
                    "collapse",
                }}
              >
                <thead>
                  <tr>
                    <th
                      style={{
                        textAlign: "left",
                        padding: "14px",
                        borderBottom:
                          "2px solid #ddd",
                      }}
                    >
                      Severity
                    </th>

                    <th
                      style={{
                        textAlign: "right",
                        padding: "14px",
                        borderBottom:
                          "2px solid #ddd",
                      }}
                    >
                      Alerts
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {severityChartData.map(
                    (item) => (
                      <tr
                        key={item.severity}
                      >
                        <td
                          style={{
                            padding: "14px",
                            borderBottom:
                              "1px solid #eee",
                            fontWeight: "600",
                          }}
                        >
                          {item.severity}
                        </td>

                        <td
                          style={{
                            padding: "14px",
                            borderBottom:
                              "1px solid #eee",
                            textAlign: "right",
                          }}
                        >
                          {formatNumber(
                            item.count
                          )}
                        </td>
                      </tr>
                    )
                  )}

                  <tr>
                    <td
                      style={{
                        padding: "14px",
                        fontWeight: "700",
                        borderTop:
                          "2px solid #ddd",
                      }}
                    >
                      Total
                    </td>

                    <td
                      style={{
                        padding: "14px",
                        fontWeight: "700",
                        textAlign: "right",
                        borderTop:
                          "2px solid #ddd",
                      }}
                    >
                      {formatNumber(
                        totalSeverityAlerts
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* SEVERITY KPIs */}

            <h3
              style={{
                marginTop: "30px",
                marginBottom: "20px",
              }}
            >
              🚨 Severity KPIs
            </h3>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(180px, 1fr))",
                gap: "20px",
              }}
            >
              <div
                style={{
                  background: "#fff5f5",
                  border:
                    "1px solid #ffcdd2",
                  padding: "20px",
                  borderRadius: "12px",
                }}
              >
                <div
                  style={{
                    fontSize: "14px",
                    fontWeight: "600",
                    color: "#c62828",
                  }}
                >
                  🔴 Critical Alerts
                </div>

                <div
                  style={{
                    fontSize: "30px",
                    fontWeight: "700",
                    color: "#b71c1c",
                    marginTop: "10px",
                  }}
                >
                  {formatNumber(
                    criticalAlerts
                  )}
                </div>

                <div
                  style={{
                    fontSize: "13px",
                    color: "#777",
                    marginTop: "5px",
                  }}
                >
                  Highest severity
                </div>
              </div>

              <div
                style={{
                  background: "#fff8f0",
                  border:
                    "1px solid #ffe0b2",
                  padding: "20px",
                  borderRadius: "12px",
                }}
              >
                <div
                  style={{
                    fontSize: "14px",
                    fontWeight: "600",
                    color: "#e65100",
                  }}
                >
                  🟠 High Alerts
                </div>

                <div
                  style={{
                    fontSize: "30px",
                    fontWeight: "700",
                    color: "#ef6c00",
                    marginTop: "10px",
                  }}
                >
                  {formatNumber(
                    highAlerts
                  )}
                </div>

                <div
                  style={{
                    fontSize: "13px",
                    color: "#777",
                    marginTop: "5px",
                  }}
                >
                  High-priority threats
                </div>
              </div>

              <div
                style={{
                  background: "#fffdf2",
                  border:
                    "1px solid #fff0a8",
                  padding: "20px",
                  borderRadius: "12px",
                }}
              >
                <div
                  style={{
                    fontSize: "14px",
                    fontWeight: "600",
                    color: "#9e7c00",
                  }}
                >
                  🟡 Medium Alerts
                </div>

                <div
                  style={{
                    fontSize: "30px",
                    fontWeight: "700",
                    color: "#8d6e00",
                    marginTop: "10px",
                  }}
                >
                  {formatNumber(
                    mediumAlerts
                  )}
                </div>

                <div
                  style={{
                    fontSize: "13px",
                    color: "#777",
                    marginTop: "5px",
                  }}
                >
                  Moderate-priority threats
                </div>
              </div>

              <div
                style={{
                  background: "#f4f8ff",
                  border:
                    "1px solid #c5cae9",
                  padding: "20px",
                  borderRadius: "12px",
                }}
              >
                <div
                  style={{
                    fontSize: "14px",
                    fontWeight: "600",
                    color: "#3949ab",
                  }}
                >
                  🔵 Low Alerts
                </div>

                <div
                  style={{
                    fontSize: "30px",
                    fontWeight: "700",
                    color: "#283593",
                    marginTop: "10px",
                  }}
                >
                  {formatNumber(
                    lowAlerts
                  )}
                </div>

                <div
                  style={{
                    fontSize: "13px",
                    color: "#777",
                    marginTop: "5px",
                  }}
                >
                  Low-priority events
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ======================================================
          INCIDENT ANALYTICS
      ====================================================== */}

      <div
        style={{
          background: "#fff",
          padding: "25px",
          borderRadius: "12px",
          marginBottom: "30px",
          boxShadow:
            "0 2px 10px rgba(0,0,0,0.08)",
        }}
      >
        <h2>
          🔍 Incident Analytics
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "20px",
            marginBottom: "25px",
          }}
        >
          <div
            style={{
              padding: "18px",
              background: "#f5f5f5",
              borderRadius: "8px",
            }}
          >
            <strong>Total Incidents</strong>

            <div
              style={{
                fontSize: "24px",
                marginTop: "8px",
              }}
            >
              {formatNumber(totalIncidents)}
            </div>
          </div>

          <div
            style={{
              padding: "18px",
              background: "#f5f5f5",
              borderRadius: "8px",
            }}
          >
            <strong>Open</strong>

            <div
              style={{
                fontSize: "24px",
                marginTop: "8px",
              }}
            >
              {formatNumber(openIncidents)}
            </div>
          </div>

          <div
            style={{
              padding: "18px",
              background: "#f5f5f5",
              borderRadius: "8px",
            }}
          >
            <strong>Investigating</strong>

            <div
              style={{
                fontSize: "24px",
                marginTop: "8px",
              }}
            >
              {formatNumber(
                investigatingIncidents
              )}
            </div>
          </div>

          <div
            style={{
              padding: "18px",
              background: "#f5f5f5",
              borderRadius: "8px",
            }}
          >
            <strong>Resolved</strong>

            <div
              style={{
                fontSize: "24px",
                marginTop: "8px",
              }}
            >
              {formatNumber(resolvedIncidents)}
            </div>
          </div>
        </div>

        <h3>
          🔍 Incident Status Overview
        </h3>

        <div
          style={{
            width: "100%",
            height: 350,
          }}
        >
          <ResponsiveContainer
            width="100%"
            height="100%"
          >
            <BarChart
              data={incidentStatusChartData}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 40,
              }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
              />

              <XAxis
                dataKey="status"
                interval={0}
              />

              <YAxis
                allowDecimals={false}
              />

              <Tooltip />

              <Bar
                dataKey="count"
                name="Incidents"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ======================================================
          ALERT ANALYTICS
      ====================================================== */}

      <div
        style={{
          background: "#fff",
          padding: "25px",
          borderRadius: "12px",
          marginBottom: "30px",
          boxShadow:
            "0 2px 10px rgba(0,0,0,0.08)",
        }}
      >
        <h2>
          🔔 Alert Analytics
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "20px",
          }}
        >
          <div
            style={{
              padding: "18px",
              background: "#f5f5f5",
              borderRadius: "8px",
            }}
          >
            <strong>Total Alerts</strong>

            <div
              style={{
                fontSize: "24px",
                marginTop: "8px",
              }}
            >
              {formatNumber(totalAlerts)}
            </div>
          </div>

          <div
            style={{
              padding: "18px",
              background: "#f5f5f5",
              borderRadius: "8px",
            }}
          >
            <strong>Severity Alerts</strong>

            <div
              style={{
                fontSize: "24px",
                marginTop: "8px",
              }}
            >
              {formatNumber(
                totalSeverityAlerts
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================
          LATEST AI PREDICTIONS
      ====================================================== */}

      <div
        style={{
          background: "#fff",
          padding: "25px",
          borderRadius: "12px",
          marginBottom: "30px",
          boxShadow:
            "0 2px 10px rgba(0,0,0,0.08)",
        }}
      >
        <h2>
          🤖 Latest AI Predictions
        </h2>

        {latestPredictions.length === 0 ? (
          <p>
            No recent predictions available.
          </p>
        ) : (
          <div
            style={{
              overflowX: "auto",
            }}
          >
            <table
              style={{
                width: "100%",
                borderCollapse:
                  "collapse",
              }}
            >
              <thead>
                <tr>
                  <th
                    style={{
                      textAlign: "left",
                      padding: "12px",
                      borderBottom:
                        "1px solid #ddd",
                    }}
                  >
                    Dataset
                  </th>

                  <th
                    style={{
                      textAlign: "left",
                      padding: "12px",
                      borderBottom:
                        "1px solid #ddd",
                    }}
                  >
                    Threat
                  </th>

                  <th
                    style={{
                      textAlign: "left",
                      padding: "12px",
                      borderBottom:
                        "1px solid #ddd",
                    }}
                  >
                    Confidence
                  </th>

                  <th
                    style={{
                      textAlign: "left",
                      padding: "12px",
                      borderBottom:
                        "1px solid #ddd",
                    }}
                  >
                    Records
                  </th>
                </tr>
              </thead>

              <tbody>
                {latestPredictions.map(
                  (prediction, index) => (
                    <tr key={index}>
                      <td
                        style={{
                          padding: "12px",
                          borderBottom:
                            "1px solid #eee",
                        }}
                      >
                        {prediction.dataset ||
                          "Unknown"}
                      </td>

                      <td
                        style={{
                          padding: "12px",
                          borderBottom:
                            "1px solid #eee",
                        }}
                      >
                        {prediction.main_threat ||
                          prediction.threat ||
                          "None"}
                      </td>

                      <td
                        style={{
                          padding: "12px",
                          borderBottom:
                            "1px solid #eee",
                        }}
                      >
                        {Number(
                          prediction.average_confidence ||
                            prediction.confidence ||
                            0
                        ).toFixed(2)}
                        %
                      </td>

                      <td
                        style={{
                          padding: "12px",
                          borderBottom:
                            "1px solid #eee",
                        }}
                      >
                        {formatNumber(
                          prediction.processed_records ||
                            prediction.total_records ||
                            prediction.records ||
                            0
                        )}
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default SecurityHomePage;