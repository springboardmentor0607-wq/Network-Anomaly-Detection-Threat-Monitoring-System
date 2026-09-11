import { useEffect, useState } from "react";
import axios from "axios";
import "./AdminDashboard.css";

const API_URL = "http://127.0.0.1:8000";

function AuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ==========================================
  // LOAD AUDIT LOGS
  // ==========================================

  const loadAuditLogs = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await axios.get(
        `${API_URL}/auth/audit`
      );

      setLogs(
        Array.isArray(response.data)
          ? response.data
          : []
      );

    } catch (err) {
      console.error(
        "Failed to load audit logs:",
        err
      );

      setError(
        err.response?.data?.detail ||
          "Unable to load audit logs."
      );

      setLogs([]);

    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // LOAD ON PAGE OPEN
  // ==========================================

  useEffect(() => {
    loadAuditLogs();
  }, []);

  // ==========================================
  // FORMAT STATUS
  // ==========================================

  const getStatusClass = (status) => {
    const value = String(
      status || ""
    ).toLowerCase();

    if (
      value === "success" ||
      value === "successful" ||
      value === "completed"
    ) {
      return "status-green";
    }

    if (
      value === "failed" ||
      value === "failure" ||
      value === "error"
    ) {
      return "status-red";
    }

    if (
      value === "warning" ||
      value === "pending"
    ) {
      return "status-yellow";
    }

    return "status-blue";
  };

  // ==========================================
  // SUMMARY
  // ==========================================

  const successfulLogs = logs.filter(
    (log) => {
      const status = String(
        log.status || "Success"
      ).toLowerCase();

      return (
        status === "success" ||
        status === "successful" ||
        status === "completed"
      );
    }
  ).length;

  const failedLogs = logs.filter(
    (log) => {
      const status = String(
        log.status || ""
      ).toLowerCase();

      return (
        status === "failed" ||
        status === "failure" ||
        status === "error"
      );
    }
  ).length;

  const uniqueUsers = new Set(
    logs.map(
      (log) => log.user || "System"
    )
  ).size;

  return (
    <div className="page">

      {/* ==========================================
          HEADER
      =========================================== */}

      <div className="topbar">

        <div>
          <h1>📜 Audit Logs</h1>

          <p>
            Monitor user and system activities
            recorded by NetShield AI.
          </p>
        </div>

        <button
          type="button"
          className="action-btn"
          onClick={loadAuditLogs}
          disabled={loading}
        >
          {loading
            ? "Loading..."
            : "🔄 Refresh"}
        </button>

      </div>

      {/* ==========================================
          ERROR MESSAGE
      =========================================== */}

      {error && (
        <div className="error-message">
          ⚠️ {error}
        </div>
      )}

      {/* ==========================================
          SUMMARY CARDS
      =========================================== */}

      <div className="cards">

        <div className="card">
          <h2>{logs.length}</h2>
          <p>Total Audit Events</p>
        </div>

        <div className="card">
          <h2>{successfulLogs}</h2>
          <p>Successful Events</p>
        </div>

        <div className="card">
          <h2>{failedLogs}</h2>
          <p>Failed Events</p>
        </div>

        <div className="card">
          <h2>{uniqueUsers}</h2>
          <p>Users Involved</p>
        </div>

      </div>

      {/* ==========================================
          AUDIT LOG TABLE
      =========================================== */}

      <div className="section">

        <h2>🔍 System Activity</h2>

        <p>
          Audit events retrieved directly from
          the NetShield AI backend.
        </p>

        {loading ? (

          <div className="warning-message">
            ⏳ Loading audit logs...
          </div>

        ) : error ? (

          <div className="error-message">
            ⚠️ {error}
          </div>

        ) : logs.length === 0 ? (

          <div className="warning-message">
            ℹ️ No audit logs found.
          </div>

        ) : (

          <table>

            <thead>

              <tr>
                <th>ID</th>
                <th>User</th>
                <th>Action</th>
                <th>Module</th>
                <th>Time</th>
                <th>Status</th>
              </tr>

            </thead>

            <tbody>

              {logs.map(
                (log, index) => {

                  const status =
                    log.status ||
                    "Success";

                  return (
                    <tr
                      key={
                        log.id ||
                        index
                      }
                    >

                      <td>
                        {log.id ||
                          `LOG-${index + 1}`}
                      </td>

                      <td>
                        {log.user ||
                          "System"}
                      </td>

                      <td>
                        <strong>
                          {log.action ||
                            "Unknown Action"}
                        </strong>
                      </td>

                      <td>
                        {log.module ||
                          "System"}
                      </td>

                      <td>
                        {log.time ||
                          "Unknown"}
                      </td>

                      <td
                        className={getStatusClass(
                          status
                        )}
                      >
                        {status}
                      </td>

                    </tr>
                  );
                }
              )}

            </tbody>

          </table>

        )}

      </div>

      {/* ==========================================
          SECURITY SUMMARY
      =========================================== */}

      <div className="section">

        <h2>
          🛡 Audit Security Summary
        </h2>

        <div className="report-info">

          <div className="report-info-box">

            <h3>
              {logs.length}
            </h3>

            <p>
              Recorded system events
            </p>

          </div>

          <div className="report-info-box">

            <h3>
              {successfulLogs}
            </h3>

            <p>
              Successful operations
            </p>

          </div>

          <div className="report-info-box">

            <h3>
              {failedLogs}
            </h3>

            <p>
              Failed operations
            </p>

          </div>

          <div className="report-info-box">

            <h3
              className={
                failedLogs > 0
                  ? "status-red"
                  : "status-green"
              }
            >
              {failedLogs > 0
                ? "Attention Required"
                : "Normal"}
            </h3>

            <p>
              Current audit condition
            </p>

          </div>

        </div>

      </div>

    </div>
  );
}

export default AuditLogsPage;