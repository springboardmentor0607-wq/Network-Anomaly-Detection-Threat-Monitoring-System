import { useEffect, useState } from "react";
import axios from "axios";
import "./AdminDashboard.css";

const API_URL = "https://network-anomaly-detection-threat-5ihm.onrender.com";

function ThreatAlertsPage() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadAlerts = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await axios.get(
        `${API_URL}/api/alerts/`
      );

      const data = Array.isArray(response.data)
        ? response.data
        : response.data?.alerts || [];

      setAlerts(data);
    } catch (err) {
      console.error("Failed to load alerts:", err);

      setError(
        err.response?.data?.detail ||
          "Failed to load threat alerts from the backend."
      );

      setAlerts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlerts();
  }, []);

  /* ===========================
     HELPERS
  ============================ */

  const getSeverity = (alert) => {
    return (
      alert.severity ||
      alert.alert_severity ||
      "Low"
    );
  };

  const getAlertId = (alert, index) => {
    return (
      alert.id ||
      alert._id ||
      `Alert-${index + 1}`
    );
  };

  const getThreat = (alert) => {
    return (
      alert.threat ||
      alert.threat_type ||
      alert.main_threat ||
      alert.alert_type ||
      "Unknown Threat"
    );
  };

  const getDataset = (alert) => {
    return alert.dataset || "Unknown";
  };

  const getThreatCount = (alert) => {
    return Number(
      alert.threat_count ??
        alert.threats ??
        alert.threats_count ??
        0
    );
  };

  const getConfidence = (alert) => {
    if (
      alert.confidence === undefined ||
      alert.confidence === null
    ) {
      return null;
    }

    const value = Number(alert.confidence);

    return Number.isFinite(value)
      ? value
      : null;
  };

  const getStatus = (alert) => {
    return alert.status || "New";
  };

  const formatDate = (value) => {
    if (!value) {
      return "Unknown";
    }

    try {
      const date = new Date(value);

      if (Number.isNaN(date.getTime())) {
        return String(value);
      }

      return date.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return String(value);
    }
  };

  const getSeverityClass = (severity) => {
    const value = String(
      severity || "Low"
    ).toLowerCase();

    if (value === "critical") {
      return "status-red";
    }

    if (value === "high") {
      return "status-orange";
    }

    if (value === "medium") {
      return "status-yellow";
    }

    return "status-green";
  };

  const getStatusClass = (status) => {
    const value = String(
      status || "New"
    ).toLowerCase();

    if (
      value === "resolved" ||
      value === "closed"
    ) {
      return "status-green";
    }

    if (
      value === "investigating" ||
      value === "acknowledged"
    ) {
      return "status-yellow";
    }

    if (value === "new") {
      return "status-red";
    }

    return "status-blue";
  };

  /* ===========================
     REAL SEVERITY COUNTS
  ============================ */

  const critical = alerts.filter(
    (alert) =>
      String(getSeverity(alert)).toLowerCase() ===
      "critical"
  ).length;

  const high = alerts.filter(
    (alert) =>
      String(getSeverity(alert)).toLowerCase() ===
      "high"
  ).length;

  const medium = alerts.filter(
    (alert) =>
      String(getSeverity(alert)).toLowerCase() ===
      "medium"
  ).length;

  const low = alerts.filter(
    (alert) =>
      String(getSeverity(alert)).toLowerCase() ===
      "low"
  ).length;

  const newAlerts = alerts.filter(
    (alert) =>
      String(getStatus(alert)).toLowerCase() ===
      "new"
  ).length;

  return (
    <div className="page">

      {/* ===========================
          HEADER
      ============================ */}

      <div className="topbar">

        <div>
          <h1>🚨 Threat Alerts</h1>

          <p>
            AI-generated security alerts from
            the NetShield AI monitoring system.
          </p>
        </div>

        <button
          type="button"
          className="action-btn"
          onClick={loadAlerts}
          disabled={loading}
        >
          {loading
            ? "Loading..."
            : "🔄 Refresh"}
        </button>

      </div>

      {/* ===========================
          ERROR
      ============================ */}

      {error && (
        <div className="error-message">
          ⚠️ {error}
        </div>
      )}

      {/* ===========================
          SUMMARY CARDS
      ============================ */}

      <div className="cards">

        <div className="card">
          <h2>{alerts.length}</h2>
          <p>Total Alerts</p>
        </div>

        <div className="card">
          <h2>{critical}</h2>
          <p>Critical</p>
        </div>

        <div className="card">
          <h2>{high}</h2>
          <p>High</p>
        </div>

        <div className="card">
          <h2>{medium + low}</h2>
          <p>Medium / Low</p>
        </div>

      </div>

      {/* ===========================
          SEVERITY DISTRIBUTION
      ============================ */}

      <div className="section">

        <h2>⚠️ Threat Severity</h2>

        {loading ? (

          <div className="warning-message">
            ⏳ Loading severity information...
          </div>

        ) : (

          <table>

            <thead>
              <tr>
                <th>Severity</th>
                <th>Count</th>
                <th>Percentage</th>
              </tr>
            </thead>

            <tbody>

              <tr>
                <td className="status-red">
                  🔴 Critical
                </td>

                <td>{critical}</td>

                <td>
                  {alerts.length
                    ? (
                        (critical /
                          alerts.length) *
                        100
                      ).toFixed(2)
                    : "0.00"}
                  %
                </td>
              </tr>

              <tr>
                <td className="status-orange">
                  🟠 High
                </td>

                <td>{high}</td>

                <td>
                  {alerts.length
                    ? (
                        (high /
                          alerts.length) *
                        100
                      ).toFixed(2)
                    : "0.00"}
                  %
                </td>
              </tr>

              <tr>
                <td className="status-yellow">
                  🟡 Medium
                </td>

                <td>{medium}</td>

                <td>
                  {alerts.length
                    ? (
                        (medium /
                          alerts.length) *
                        100
                      ).toFixed(2)
                    : "0.00"}
                  %
                </td>
              </tr>

              <tr>
                <td className="status-green">
                  🟢 Low
                </td>

                <td>{low}</td>

                <td>
                  {alerts.length
                    ? (
                        (low /
                          alerts.length) *
                        100
                      ).toFixed(2)
                    : "0.00"}
                  %
                </td>
              </tr>

            </tbody>

          </table>

        )}

      </div>

      {/* ===========================
          RECENT ALERTS
      ============================ */}

      <div className="section">

        <h2>📋 Recent Threat Alerts</h2>

        {loading ? (

          <div className="warning-message">
            ⏳ Loading threat alerts from MongoDB...
          </div>

        ) : error ? (

          <div className="error-message">
            ⚠️ {error}
          </div>

        ) : alerts.length === 0 ? (

          <div className="warning-message">
            ℹ️ No threat alerts found.
          </div>

        ) : (

          <table>

            <thead>

              <tr>
                <th>ID</th>
                <th>Dataset</th>
                <th>Threat</th>
                <th>Threat Count</th>
                <th>Severity</th>
                <th>Confidence</th>
                <th>Status</th>
                <th>Time</th>
              </tr>

            </thead>

            <tbody>

              {alerts.map(
                (alert, index) => {

                  const severity =
                    getSeverity(alert);

                  const confidence =
                    getConfidence(alert);

                  const status =
                    getStatus(alert);

                  return (
                    <tr
                      key={getAlertId(
                        alert,
                        index
                      )}
                    >

                      <td>
                        {getAlertId(
                          alert,
                          index
                        )}
                      </td>

                      <td>
                        {getDataset(alert)}
                      </td>

                      <td>
                        <strong>
                          {getThreat(alert)}
                        </strong>
                      </td>

                      <td>
                        {getThreatCount(
                          alert
                        )}
                      </td>

                      <td
                        className={getSeverityClass(
                          severity
                        )}
                      >
                        {severity}
                      </td>

                      <td>
                        {confidence !== null
                          ? `${confidence.toFixed(
                              2
                            )}%`
                          : "N/A"}
                      </td>

                      <td
                        className={getStatusClass(
                          status
                        )}
                      >
                        {status}
                      </td>

                      <td>
                        {formatDate(
                          alert.created_at ||
                            alert.updated_at ||
                            alert.time
                        )}
                      </td>

                    </tr>
                  );
                }
              )}

            </tbody>

          </table>

        )}

      </div>

      {/* ===========================
          SECURITY SUMMARY
      ============================ */}

      <div className="section">

        <h2>🛡 Security Alert Summary</h2>

        <div className="report-info">

          <div className="report-info-box">
            <h3>{alerts.length}</h3>
            <p>
              Total AI-generated alerts
            </p>
          </div>

          <div className="report-info-box">
            <h3>{critical + high}</h3>
            <p>
              High-priority alerts
            </p>
          </div>

          <div className="report-info-box">
            <h3>{newAlerts}</h3>
            <p>
              New alerts requiring attention
            </p>
          </div>

          <div className="report-info-box">

            <h3
              className={
                critical > 0
                  ? "status-red"
                  : "status-green"
              }
            >
              {critical > 0
                ? "Attention Required"
                : "Normal"}
            </h3>

            <p>
              Current alert condition
            </p>

          </div>

        </div>

      </div>

    </div>
  );
}

export default ThreatAlertsPage;