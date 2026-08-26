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
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

import { useNavigate } from "react-router-dom";

import "./Analytics.css";


const API_URL = "http://127.0.0.1:8000";


function Analytics() {

  const navigate = useNavigate();


  // ============================================================
  // STATE
  // ============================================================

  const [alerts, setAlerts] = useState([]);

  const [loading, setLoading] = useState(true);

  const [syncing, setSyncing] = useState(false);

  const [error, setError] = useState("");

  const [search, setSearch] = useState("");

  const [severityFilter, setSeverityFilter] =
    useState("All");


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


  // ============================================================
  // GET SEVERITY
  // ============================================================

  const getSeverity = useCallback(
    (alert) => {

      return String(
        getValue(
          alert?.severity,
          alert?.risk_level
        ) || "Low"
      );

    },
    [getValue]
  );


  // ============================================================
  // GET THREAT
  // ============================================================

  const getThreat = useCallback(
    (alert) => {

      return String(
        getValue(
          alert?.threat_type,
          alert?.threat,
          alert?.attack_type,
          alert?.prediction,
          alert?.classification
        ) || "Unknown"
      );

    },
    [getValue]
  );


  // ============================================================
  // GET RISK
  // ============================================================

  const getRisk = useCallback(
    (alert) => {

      return Number(
        getValue(
          alert?.risk_score,
          alert?.risk,
          alert?.riskScore
        ) || 0
      );

    },
    [getValue]
  );


  // ============================================================
  // GET CONFIDENCE
  // ============================================================

  const getConfidence = useCallback(
    (alert) => {

      const value = getValue(
        alert?.confidence,
        alert?.confidence_value,
        alert?.model_confidence
      );


      if (value === null) {
        return 0;
      }


      const number = parseFloat(
        String(value).replace("%", "")
      );


      return Number.isNaN(number)
        ? 0
        : number;

    },
    [getValue]
  );


  // ============================================================
  // GET WORKFLOW STATUS
  // ============================================================

  const getStatus = useCallback(
    (alert) => {

      return String(
        getValue(
          alert?.workflow_status,
          alert?.workflow,
          alert?.status_workflow,
          alert?.status
        ) || "New"
      );

    },
    [getValue]
  );


  // ============================================================
  // GET ALERT ID
  // ============================================================

  const getId = useCallback(
    (alert) => {

      return (
        alert?._id ||
        alert?.id ||
        alert?.alert_id ||
        alert?.alertId ||
        "--"
      );

    },
    []
  );


  // ============================================================
  // GET SOURCE IP
  // ============================================================

  const getSourceIP = useCallback(
    (alert) => {

      return (
        getValue(
          alert?.source_ip,
          alert?.src_ip,
          alert?.sourceIP
        ) || "--"
      );

    },
    [getValue]
  );


  // ============================================================
  // GET DESTINATION IP
  // ============================================================

  const getDestinationIP = useCallback(
    (alert) => {

      return (
        getValue(
          alert?.destination_ip,
          alert?.dst_ip,
          alert?.destinationIP
        ) || "--"
      );

    },
    [getValue]
  );


  // ============================================================
  // GET TIMESTAMP
  // ============================================================

  const getTimestamp = useCallback(
    (alert) => {

      return getValue(
        alert?.timestamp,
        alert?.created_at,
        alert?.detection_time
      );

    },
    [getValue]
  );


  // ============================================================
  // FORMAT DATE
  // ============================================================

  const formatDate = useCallback(
    (value) => {

      if (!value) {
        return "--";
      }


      const date = new Date(value);


      if (
        Number.isNaN(
          date.getTime()
        )
      ) {
        return String(value);
      }


      return date.toLocaleString();

    },
    []
  );


  // ============================================================
  // FETCH ALERTS
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


        const response =
          await axios.get(
            `${API_URL}/alerts/`
          );


        const data =
          Array.isArray(response.data)
            ? response.data
            : response.data?.alerts || [];


        setAlerts(data);

      } catch (err) {

        console.error(
          "Analytics error:",
          err
        );


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


  // ============================================================
  // INITIAL LOAD + AUTO REFRESH
  // ============================================================

  useEffect(() => {

    fetchAlerts(true);


    const timer =
      setInterval(() => {

        fetchAlerts(false);

      }, 10000);


    return () => {
      clearInterval(timer);
    };

  }, [fetchAlerts]);


  // ============================================================
  // STATISTICS
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


      if (severity === "critical") {

        critical++;

      } else if (severity === "high") {

        high++;

      } else if (severity === "medium") {

        medium++;

      } else {

        low++;

      }


      if (status === "resolved") {

        resolved++;

      }


      riskTotal +=
        getRisk(alert);


      confidenceTotal +=
        getConfidence(alert);

    });


    return {

      total: alerts.length,

      active:
        alerts.length - resolved,

      critical,

      high,

      medium,

      low,

      resolved,

      averageRisk:
        alerts.length
          ? Math.round(
              riskTotal /
                alerts.length
            )
          : 0,

      averageConfidence:
        alerts.length
          ? Math.round(
              confidenceTotal /
                alerts.length
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
  // ATTACK TABLE
  // ============================================================

  const attackTable = useMemo(() => {

    const counts = {};


    alerts.forEach((alert) => {

      const threat =
        getThreat(alert);


      counts[threat] =
        (counts[threat] || 0) + 1;

    });


    return Object.entries(counts)

      .map(([name, count]) => ({

        name,

        count,

        percentage:
          alerts.length
            ? Math.round(
                (count /
                  alerts.length) *
                  100
              )
            : 0,

      }))

      .sort(
        (a, b) =>
          b.count - a.count
      );

  }, [
    alerts,
    getThreat,
  ]);


  // ============================================================
  // RISK TREND
  // ============================================================

  const riskTrend = useMemo(() => {

    return [...alerts]

      .sort(
        (a, b) =>
          new Date(
            getTimestamp(a) || 0
          ) -
          new Date(
            getTimestamp(b) || 0
          )
      )

      .slice(-15)

      .map((alert, index) => ({

        name:
          `#${index + 1}`,

        risk:
          getRisk(alert),

        confidence:
          getConfidence(alert),

      }));

  }, [
    alerts,
    getTimestamp,
    getRisk,
    getConfidence,
  ]);


  // ============================================================
  // FILTERED EVENTS
  // ============================================================

  const filteredAlerts = useMemo(() => {

    const keyword =
      search
        .toLowerCase()
        .trim();


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
        (
          !keyword ||
          text.includes(keyword)
        )
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
  // TOP ACTIVE THREATS
  // ============================================================

  const topThreats = useMemo(() => {

    return [...alerts]

      .filter((alert) => {

        const severity =
          getSeverity(alert)
            .toLowerCase();


        const status =
          getStatus(alert)
            .toLowerCase();


        return (
          severity !== "low" &&
          status !== "resolved"
        );

      })

      .sort(
        (a, b) =>
          getRisk(b) -
          getRisk(a)
      )

      .slice(0, 8);

  }, [
    alerts,
    getSeverity,
    getStatus,
    getRisk,
  ]);


  // ============================================================
  // INVESTIGATION
  // ============================================================

  const investigate = useCallback(
    (alert) => {

      const id =
        getId(alert);


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
  // OPEN PDF REPORT
  // ============================================================

  const report = useCallback(
    (alert) => {

      const id =
        getId(alert);


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
  // OPEN SELECTED INVESTIGATION
  // ============================================================

  const openInvestigationPage = () => {

    const saved =
      localStorage.getItem(
        "netshield_selected_alert"
      );


    if (saved) {

      try {

        const alert =
          JSON.parse(saved);


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

      } catch (error) {

        console.error(
          "Unable to open selected investigation:",
          error
        );

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

        <h2>
          NETSHIELD AI
        </h2>

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

            <h1>
              NETSHIELD AI
            </h1>

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
          MAIN AREA
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
              Network threat intelligence and
              security performance overview.
            </p>

          </div>


          <div className="header-time">

            <span>
              MONITORING
            </span>

            <strong>
              LIVE
            </strong>

          </div>


        </header>


        {/* ERROR */}

        {error && (

          <div className="analytics-error">
            ⚠ {error}
          </div>

        )}


        {/* ====================================================
            SECURITY OVERVIEW
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

              <span>
                TOTAL EVENTS
              </span>

              <strong>
                {stats.total}
              </strong>

              <small>
                All detected events
              </small>

            </div>


            <div className="kpi-box red">

              <span>
                ACTIVE THREATS
              </span>

              <strong>
                {stats.active}
              </strong>

              <small>
                Unresolved events
              </small>

            </div>


            <div className="kpi-box critical">

              <span>
                CRITICAL
              </span>

              <strong>
                {stats.critical}
              </strong>

              <small>
                Immediate attention
              </small>

            </div>


            <div className="kpi-box orange">

              <span>
                HIGH
              </span>

              <strong>
                {stats.high}
              </strong>

              <small>
                High priority
              </small>

            </div>


            <div className="kpi-box green">

              <span>
                RESOLVED
              </span>

              <strong>
                {stats.resolved}
              </strong>

              <small>
                Closed incidents
              </small>

            </div>


            <div className="kpi-box purple">

              <span>
                AI CONFIDENCE
              </span>

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
            RISK TREND
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


            {riskTrend.length === 0 ? (

              <div className="empty-state">
                No monitoring data available.
              </div>

            ) : (

              <ResponsiveContainer
                width="100%"
                height={330}
              >

                <LineChart
                  data={riskTrend}
                >

                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#203342"
                  />


                  <XAxis
                    dataKey="name"
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
                      borderRadius:
                        "8px",
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

            )}

          </div>

        </section>


        {/* ====================================================
            SEVERITY + ATTACK TABLES
        ==================================================== */}

        <section className="two-column">


          {/* SEVERITY */}

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


            <table className="data-table">


              <thead>

                <tr>

                  <th>
                    LEVEL
                  </th>

                  <th>
                    EVENTS
                  </th>

                  <th>
                    PERCENT
                  </th>

                </tr>

              </thead>


              <tbody>


                <tr>

                  <td>

                    <span className="severity-dot critical"></span>

                    Critical

                  </td>

                  <td>
                    {stats.critical}
                  </td>

                  <td>

                    {stats.total
                      ? Math.round(
                          (stats.critical /
                            stats.total) *
                            100
                        )
                      : 0}
                    %

                  </td>

                </tr>


                <tr>

                  <td>

                    <span className="severity-dot high"></span>

                    High

                  </td>

                  <td>
                    {stats.high}
                  </td>

                  <td>

                    {stats.total
                      ? Math.round(
                          (stats.high /
                            stats.total) *
                            100
                        )
                      : 0}
                    %

                  </td>

                </tr>


                <tr>

                  <td>

                    <span className="severity-dot medium"></span>

                    Medium

                  </td>

                  <td>
                    {stats.medium}
                  </td>

                  <td>

                    {stats.total
                      ? Math.round(
                          (stats.medium /
                            stats.total) *
                            100
                        )
                      : 0}
                    %

                  </td>

                </tr>


                <tr>

                  <td>

                    <span className="severity-dot low"></span>

                    Low

                  </td>

                  <td>
                    {stats.low}
                  </td>

                  <td>

                    {stats.total
                      ? Math.round(
                          (stats.low /
                            stats.total) *
                            100
                        )
                      : 0}
                    %

                  </td>

                </tr>


              </tbody>

            </table>

          </div>


          {/* ATTACK TYPES */}

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

            </div>


            <table className="data-table">


              <thead>

                <tr>

                  <th>
                    THREAT TYPE
                  </th>

                  <th>
                    EVENTS
                  </th>

                  <th>
                    SHARE
                  </th>

                </tr>

              </thead>


              <tbody>


                {attackTable.length === 0 ? (

                  <tr>

                    <td colSpan="3">
                      No attack data
                    </td>

                  </tr>

                ) : (

                  attackTable.map(
                    (attack) => (

                      <tr
                        key={
                          attack.name
                        }
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


                {topThreats.length === 0 ? (

                  <tr>

                    <td
                      colSpan="8"
                      className="empty-table"
                    >
                      No active threats.
                    </td>

                  </tr>

                ) : (

                  topThreats.map(
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


                          <td className="rank">

                            {String(
                              index + 1
                            ).padStart(
                              2,
                              "0"
                            )}

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
                  )

                )}


              </tbody>

            </table>

          </div>

        </section>


        {/* ====================================================
            RECENT SECURITY EVENTS
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

              {filteredAlerts.length}
              {" "}
              EVENTS

            </strong>


          </div>


          {/* FILTERS */}

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
              value={
                severityFilter
              }
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

                  <th>
                    ALERT ID
                  </th>

                  <th>
                    THREAT
                  </th>

                  <th>
                    SEVERITY
                  </th>

                  <th>
                    RISK
                  </th>

                  <th>
                    CONFIDENCE
                  </th>

                  <th>
                    SOURCE
                  </th>

                  <th>
                    DESTINATION
                  </th>

                  <th>
                    STATUS
                  </th>

                  <th>
                    ACTIONS
                  </th>

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


                          {/* ALERT ID */}

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


                          {/* THREAT */}

                          <td>

                            <strong>
                              {getThreat(
                                alert
                              )}
                            </strong>

                          </td>


                          {/* SEVERITY */}

                          <td>

                            <span
                              className={`severity-badge ${severity.toLowerCase()}`}
                            >
                              {severity}
                            </span>

                          </td>


                          {/* RISK */}

                          <td>

                            <strong className="risk-number">

                              {getRisk(
                                alert
                              )}

                            </strong>

                          </td>


                          {/* CONFIDENCE */}

                          <td>

                            {getConfidence(
                              alert
                            )}
                            %

                          </td>


                          {/* SOURCE */}

                          <td>

                            {getSourceIP(
                              alert
                            )}

                          </td>


                          {/* DESTINATION */}

                          <td>

                            {getDestinationIP(
                              alert
                            )}

                          </td>


                          {/* STATUS */}

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


                          {/* ACTIONS */}

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
            MILESTONE 3 • SECURITY ANALYTICS
          </span>


        </footer>


      </main>

    </div>

  );

}


export default Analytics;