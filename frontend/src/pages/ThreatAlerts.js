
import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./ThreatAlerts.css";

const API_URL = "http://127.0.0.1:8000";

function ThreatAlerts() {
  const navigate = useNavigate();

  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [syncing, setSyncing] = useState(false);

  // ============================================================
  // NORMALIZE ALERT
  // ============================================================

  const normalizeAlert = useCallback((alert) => {
    const id = alert?._id || alert?.id || "";

    const threatType =
      alert?.threat_type ||
      alert?.threat ||
      alert?.attack_type ||
      alert?.prediction ||
      alert?.classification ||
      "Unknown Threat";

    const severity =
      alert?.severity ||
      alert?.risk_level ||
      "Low";

    const riskScore = Number(
      alert?.risk_score ??
        alert?.risk ??
        alert?.riskScore ??
        0
    );

    let confidence =
      alert?.confidence ??
      alert?.confidence_value ??
      alert?.model_confidence ??
      0;

    confidence = String(confidence);

    if (!confidence.includes("%")) {
      confidence = `${confidence}%`;
    }

    return {
      ...alert,

      id,

      threat_type: threatType,

      severity,

      risk_score: riskScore,

      confidence,

      workflow_status:
        alert?.workflow_status ||
        alert?.workflow ||
        "New",

      status:
        alert?.status ||
        alert?.alert_status ||
        "Unknown",

      protocol:
        alert?.protocol_type ||
        alert?.protocol ||
        "--",

      service:
        alert?.service ||
        alert?.service_name ||
        "--",

      source_ip:
        alert?.source_ip ||
        alert?.src_ip ||
        "--",

      destination_ip:
        alert?.destination_ip ||
        alert?.dst_ip ||
        "--",

      source_port:
        alert?.source_port ||
        alert?.src_port ||
        "--",

      destination_port:
        alert?.destination_port ||
        alert?.dst_port ||
        "--",

      packet_size:
        alert?.packet_size ||
        alert?.packetSize ||
        0,

      duration:
        alert?.duration ||
        alert?.duration_seconds ||
        0,

      connection_count:
        alert?.connection_count ||
        alert?.connections ||
        alert?.connectionCount ||
        0,

      flag:
        alert?.flag ||
        alert?.connection_flag ||
        alert?.connectionFlag ||
        "--",

      timestamp:
        alert?.timestamp ||
        alert?.created_at ||
        alert?.detection_time ||
        null,
    };
  }, []);

  // ============================================================
  // FETCH ALERTS
  // ============================================================

  const fetchAlerts = useCallback(async () => {
    try {
      setError("");

      const response = await axios.get(
        `${API_URL}/alerts/?limit=500`
      );

      const data = Array.isArray(response.data)
        ? response.data
        : [];

      const normalizedData =
        data.map(normalizeAlert);

      setAlerts(normalizedData);
    } catch (err) {
      console.error(
        "Threat Alerts error:",
        err
      );

      setError(
        err.response?.data?.detail ||
          "Unable to load threat alerts."
      );
    } finally {
      setLoading(false);
    }
  }, [normalizeAlert]);

  // ============================================================
  // INITIAL LOAD + AUTO REFRESH
  // ============================================================

  useEffect(() => {
    fetchAlerts();

    const interval = setInterval(() => {
      fetchAlerts();
    }, 5000);

    return () => {
      clearInterval(interval);
    };
  }, [fetchAlerts]);

  // ============================================================
  // SYNC
  // ============================================================

  const handleSync = async () => {
    try {
      setSyncing(true);

      await fetchAlerts();
    } finally {
      setTimeout(() => {
        setSyncing(false);
      }, 500);
    }
  };

  // ============================================================
  // SAVE SELECTED ALERT
  // ============================================================

  const selectAlert = (alert) => {
    try {
      localStorage.setItem(
        "netshield_selected_alert",
        JSON.stringify(alert)
      );
    } catch (err) {
      console.error(
        "Unable to save selected alert:",
        err
      );
    }
  };

  // ============================================================
  // OPEN INVESTIGATION
  // ============================================================

  const openInvestigation = (alert) => {
    if (!alert) {
      window.alert("Alert data is missing.");
      return;
    }

    const id =
      alert.id ||
      alert._id;

    if (!id) {
      window.alert(
        "Alert ID is missing."
      );
      return;
    }

    // Save selected alert first
    selectAlert({
      ...alert,
      id: String(id),
    });

    // Open investigation page
    navigate(
      `/investigation/${String(id)}`
    );
  };

  // ============================================================
  // OPEN INVESTIGATIONS FROM SIDEBAR
  // ============================================================

  const openInvestigationFromSidebar = () => {
    try {
      const saved =
        localStorage.getItem(
          "netshield_selected_alert"
        );

      if (!saved) {
        window.alert(
          "Please select an alert first using the 🔍 Investigation button."
        );

        return;
      }

      const selected =
        JSON.parse(saved);

      const id =
        selected?.id ||
        selected?._id;

      if (!id) {
        window.alert(
          "Selected alert ID is missing."
        );

        return;
      }

      navigate(
        `/investigation/${String(id)}`
      );
    } catch (err) {
      console.error(
        "Unable to open investigation:",
        err
      );

      window.alert(
        "Unable to open investigation."
      );
    }
  };

  // ============================================================
  // SECURITY REPORT
  // ============================================================

  const downloadReport = (alert) => {
    if (!alert) {
      window.alert(
        "Alert data is missing."
      );

      return;
    }

    const id =
      alert.id ||
      alert._id;

    if (!id) {
      window.alert(
        "Alert ID is missing."
      );

      return;
    }

    selectAlert({
      ...alert,
      id: String(id),
    });

    window.open(
      `${API_URL}/alerts/report/${String(id)}`,
      "_blank"
    );
  };

  // ============================================================
  // DATE FORMAT
  // ============================================================

  const formatDate = (value) => {
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
  };

  // ============================================================
  // FILTER + SEARCH
  // ============================================================

  const filteredAlerts = useMemo(() => {
    let result = [...alerts];

    // Severity filter
    if (filter !== "All") {
      result = result.filter(
        (alert) =>
          String(
            alert.severity
          ).toLowerCase() ===
          filter.toLowerCase()
      );
    }

    // Search
    if (search.trim()) {
      const searchText =
        search
          .trim()
          .toLowerCase();

      result = result.filter(
        (alert) =>
          [
            alert.id,
            alert.threat_type,
            alert.severity,
            alert.source_ip,
            alert.destination_ip,
            alert.protocol,
            alert.service,
            alert.workflow_status,
          ]
            .join(" ")
            .toLowerCase()
            .includes(searchText)
      );
    }

    return result;
  }, [
    alerts,
    filter,
    search,
  ]);

  // ============================================================
  // STATISTICS
  // ============================================================

  const totalAlerts =
    alerts.length;

  const criticalThreats =
    alerts.filter(
      (alert) =>
        String(
          alert.severity
        ).toLowerCase() ===
        "critical"
    ).length;

  const highThreats =
    alerts.filter(
      (alert) =>
        String(
          alert.severity
        ).toLowerCase() ===
        "high"
    ).length;

  const resolvedAlerts =
    alerts.filter(
      (alert) =>
        String(
          alert.workflow_status
        ).toLowerCase() ===
        "resolved"
    ).length;

  const averageRisk =
    totalAlerts > 0
      ? Math.round(
          alerts.reduce(
            (sum, alert) =>
              sum +
              Number(
                alert.risk_score || 0
              ),
            0
          ) /
            totalAlerts
        )
      : 0;

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <div className="threat-alerts-page">

        <div className="loading-screen">

          <div className="loading-shield">
            NS
          </div>

          <h2>
            Loading Threat Alerts
          </h2>

          <p>
            Retrieving security events...
          </p>

          <div className="loading-bar">
            <div></div>
          </div>

        </div>

      </div>
    );
  }

  // ============================================================
  // MAIN
  // ============================================================

  return (
    <div className="threat-alerts-page">

      {/* ======================================================
          HEADER
      ======================================================= */}

      <header className="soc-header">

        <div className="soc-brand">

          <div className="brand-logo">
            NS
          </div>

          <div className="brand-text">

            <h1>
              NETSHIELD AI
            </h1>

            <span>
              SECURITY OPERATIONS CENTER
            </span>

          </div>

        </div>

        <div className="system-status">

          <span className="system-dot"></span>

          SYSTEM OPERATIONAL

        </div>

      </header>

      {/* ======================================================
          SIDEBAR
      ======================================================= */}

      <nav className="soc-sidebar">

        {/* DASHBOARD */}

        <button
          type="button"
          onClick={() =>
            navigate("/dashboard")
          }
        >

          <span className="nav-icon">
            ▣
          </span>

          <span>
            Dashboard
          </span>

        </button>

        {/* LIVE NETWORK */}

        <button
          type="button"
          onClick={() =>
            navigate("/live-network")
          }
        >

          <span className="nav-icon">
            ◉
          </span>

          <span>
            Live Monitor
          </span>

        </button>

        {/* THREAT ALERTS */}

        <button
          type="button"
          className="active"
        >

          <span className="nav-icon">
            ⚠
          </span>

          <span>
            Threat Alerts
          </span>

        </button>

        {/* ANALYTICS */}

        <button
          type="button"
          onClick={() =>
            navigate("/analytics")
          }
        >

          <span className="nav-icon">
            ▥
          </span>

          <span>
            Analytics
          </span>

        </button>

        {/* INVESTIGATIONS */}

        <button
          type="button"
          onClick={
            openInvestigationFromSidebar
          }
        >

          <span className="nav-icon">
            ⌕
          </span>

          <span>
            Investigations
          </span>

        </button>

      </nav>

      {/* ======================================================
          MAIN CONTENT
      ======================================================= */}

      <main className="threat-alerts-content">

        {/* BREADCRUMB */}

        <div className="breadcrumb">
          SECURITY / THREAT ALERTS
        </div>

        {/* ====================================================
            PAGE TITLE
        ===================================================== */}

        <section className="page-heading">

          <div>

            <span className="heading-kicker">
              SECURITY / THREAT ALERTS
            </span>

            <h2>
              Threat Alerts
            </h2>

            <p>
              Monitor, investigate and manage
              AI-detected network security events.
            </p>

          </div>

          <button
            type="button"
            className="sync-button"
            onClick={handleSync}
            disabled={syncing}
          >

            ↻{" "}

            {syncing
              ? "Syncing..."
              : "Sync"}

          </button>

        </section>

        {/* ====================================================
            ERROR
        ===================================================== */}

        {error && (

          <div className="error-box">
            ⚠ {error}
          </div>

        )}

        {/* ====================================================
            STATISTICS
        ===================================================== */}

        <section className="stats-grid">

          {/* TOTAL */}

          <div className="stat-card">

            <div className="stat-icon total">
              ◈
            </div>

            <div>

              <span>
                TOTAL ALERTS
              </span>

              <strong>
                {totalAlerts}
              </strong>

              <small>
                All security events
              </small>

            </div>

          </div>

          {/* CRITICAL */}

          <div className="stat-card critical">

            <div className="stat-icon critical-icon">
              ⚠
            </div>

            <div>

              <span>
                CRITICAL THREATS
              </span>

              <strong>
                {criticalThreats}
              </strong>

              <small>
                Immediate attention
              </small>

            </div>

          </div>

          {/* HIGH */}

          <div className="stat-card high">

            <div className="stat-icon high-icon">
              !
            </div>

            <div>

              <span>
                HIGH THREATS
              </span>

              <strong>
                {highThreats}
              </strong>

              <small>
                High priority events
              </small>

            </div>

          </div>

          {/* RESOLVED */}

          <div className="stat-card resolved">

            <div className="stat-icon resolved-icon">
              ✓
            </div>

            <div>

              <span>
                RESOLVED
              </span>

              <strong>
                {resolvedAlerts}
              </strong>

              <small>
                Closed incidents
              </small>

            </div>

          </div>

          {/* AVERAGE RISK */}

          <div className="stat-card risk">

            <div className="stat-icon risk-icon">
              ◉
            </div>

            <div>

              <span>
                AVERAGE RISK
              </span>

              <strong>
                {averageRisk}
              </strong>

              <small>
                Out of 100
              </small>

            </div>

          </div>

        </section>

        {/* ====================================================
            ALERT INTELLIGENCE
        ===================================================== */}

        <section className="alert-panel">

          <div className="panel-header">

            <div>

              <span>
                ALERT INTELLIGENCE
              </span>

              <h3>
                Security Events
              </h3>

            </div>

            <div className="event-count">
              {filteredAlerts.length} EVENTS
            </div>

          </div>

          {/* ==================================================
              TOOLBAR
          =================================================== */}

          <div className="alert-toolbar">

            {/* SEARCH */}

            <div className="search-box">

              <span>
                ⌕
              </span>

              <input
                type="text"
                placeholder="Search alerts, IPs, threats..."
                value={search}
                onChange={(e) =>
                  setSearch(
                    e.target.value
                  )
                }
              />

            </div>

            {/* FILTER */}

            <div className="filter-buttons">

              {[
                "All",
                "Critical",
                "High",
                "Medium",
                "Low",
              ].map(
                (item) => (

                  <button
                    key={item}
                    type="button"
                    className={
                      filter === item
                        ? "selected"
                        : ""
                    }
                    onClick={() =>
                      setFilter(item)
                    }
                  >
                    {item}
                  </button>

                )
              )}

            </div>

          </div>

          {/* ==================================================
              TABLE
          =================================================== */}

          <div className="table-wrapper">

            <table className="alerts-table">

              <thead>

                <tr>

                  <th>
                    ALERT
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
                    SOURCE IP
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

                {filteredAlerts.length === 0 ? (

                  <tr>

                    <td
                      colSpan="9"
                      className="empty-row"
                    >
                      No security alerts found.
                    </td>

                  </tr>

                ) : (

                  filteredAlerts.map(
                    (alert, index) => {

                      const id =
                        alert.id ||
                        alert._id ||
                        `alert-${index}`;

                      return (

                        <tr
                          key={String(id)}
                        >

                          {/* ALERT */}

                          <td>

                            <div className="alert-id">

                              #
                              {String(
                                id
                              ).slice(-8)}

                            </div>

                            <div className="alert-time">

                              {formatDate(
                                alert.timestamp
                              )}

                            </div>

                          </td>

                          {/* THREAT */}

                          <td>

                            <div className="threat-name">
                              {alert.threat_type}
                            </div>

                            <div className="threat-meta">

                              {alert.protocol}
                              {" • "}
                              {alert.service}

                            </div>

                          </td>

                          {/* SEVERITY */}

                          <td>

                            <span
                              className={`severity-badge ${String(
                                alert.severity
                              ).toLowerCase()}`}
                            >
                              {alert.severity}
                            </span>

                          </td>

                          {/* RISK */}

                          <td>

                            <div className="risk-cell">

                              <strong>
                                {alert.risk_score}
                              </strong>

                              <span>
                                /100
                              </span>

                            </div>

                            <div className="risk-bar">

                              <div
                                className={`risk-fill ${String(
                                  alert.severity
                                ).toLowerCase()}`}
                                style={{
                                  width: `${Math.min(
                                    100,
                                    Math.max(
                                      0,
                                      Number(
                                        alert.risk_score
                                      )
                                    )
                                  )}%`,
                                }}
                              />

                            </div>

                          </td>

                          {/* CONFIDENCE */}

                          <td>

                            <span className="confidence">

                              {alert.confidence}

                            </span>

                          </td>

                          {/* SOURCE IP */}

                          <td>

                            <span className="ip-address">

                              {alert.source_ip}

                            </span>

                          </td>

                          {/* DESTINATION */}

                          <td>

                            <span className="ip-address">

                              {alert.destination_ip}

                            </span>

                            <small className="port">

                              Port{" "}

                              {alert.destination_port ||
                                "--"}

                            </small>

                          </td>

                          {/* STATUS */}

                          <td>

                            <span
                              className={`workflow-status ${String(
                                alert.workflow_status
                              )
                                .toLowerCase()
                                .replace(
                                  /\s+/g,
                                  "-"
                                )}`}
                            >

                              {alert.workflow_status}

                            </span>

                          </td>

                          {/* ACTIONS */}

                          <td>

                            <div className="action-buttons">

                              {/* INVESTIGATION */}

                              <button
                                type="button"
                                className="action-button investigate"
                                title="Open Investigation"
                                onClick={() =>
                                  openInvestigation(
                                    alert
                                  )
                                }
                              >
                                🔍
                              </button>

                              {/* REPORT */}

                              <button
                                type="button"
                                className="action-button report"
                                title="Security Report"
                                onClick={() =>
                                  downloadReport(
                                    alert
                                  )
                                }
                              >
                                📄
                              </button>

                            </div>

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
            FOOTER
        ===================================================== */}

        <footer className="threat-alerts-footer">

          <div>

            <strong>
              🛡️ NETSHIELD AI
            </strong>

            <span>
              AI-POWERED NETWORK SECURITY
            </span>

          </div>

          <span>
            SECURITY OPERATIONS CENTER
          </span>

          <span>
            MILESTONE 3 • THREAT ALERTS
          </span>

        </footer>

      </main>

    </div>
  );
}

export default ThreatAlerts;

