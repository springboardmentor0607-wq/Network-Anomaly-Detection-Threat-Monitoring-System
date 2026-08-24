import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import {
  useNavigate,
  useParams,
} from "react-router-dom";
import "./Investigation.css";

const API_URL = "http://127.0.0.1:8000";

function Investigation() {
  const navigate = useNavigate();
  const { alertId: routeAlertId } = useParams();

  const [investigation, setInvestigation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [savingNotes, setSavingNotes] = useState(false);

  const [error, setError] = useState("");
  const [notes, setNotes] = useState("");
  const [notesMessage, setNotesMessage] = useState("");

  // ============================================================
  // GET ALERT ID
  // ============================================================

  const getAlertId = useCallback(() => {
    if (routeAlertId) {
      return routeAlertId;
    }

    const queryParams = new URLSearchParams(
      window.location.search
    );

    const queryAlertId =
      queryParams.get("alertId");

    if (queryAlertId) {
      return queryAlertId;
    }

    try {
      const saved =
        localStorage.getItem(
          "netshield_selected_alert"
        );

      if (!saved) {
        return null;
      }

      const parsed = JSON.parse(saved);

      return (
        parsed?.id ||
        parsed?._id ||
        parsed?.alert_id ||
        parsed?.alertId ||
        null
      );
    } catch (err) {
      console.error(
        "Unable to read selected alert:",
        err
      );

      return null;
    }
  }, [routeAlertId]);

  const alertId = getAlertId();

  // ============================================================
  // LOAD SAVED ALERT
  // ============================================================

  const loadSavedAlert = useCallback(() => {
    try {
      const saved =
        localStorage.getItem(
          "netshield_selected_alert"
        );

      if (!saved) {
        return null;
      }

      const parsed = JSON.parse(saved);

      if (
        !parsed ||
        typeof parsed !== "object"
      ) {
        return null;
      }

      return parsed;
    } catch (err) {
      console.error(
        "Saved alert parsing error:",
        err
      );

      return null;
    }
  }, []);

  // ============================================================
  // FETCH INVESTIGATION
  // ============================================================

  const fetchInvestigation =
    useCallback(async () => {

      setLoading(true);
      setError("");

      const savedAlert =
        loadSavedAlert();

      // --------------------------------------------------------
      // SHOW SAVED DATA FIRST
      // --------------------------------------------------------

      if (savedAlert) {
        const savedId =
          savedAlert.id ||
          savedAlert._id ||
          savedAlert.alert_id ||
          savedAlert.alertId;

        if (
          !alertId ||
          !savedId ||
          String(savedId) ===
            String(alertId)
        ) {
          setInvestigation(
            savedAlert
          );

          setNotes(
            savedAlert?.investigation_notes ||
              ""
          );
        }
      }

      // --------------------------------------------------------
      // NO ID
      // --------------------------------------------------------

      if (!alertId) {
        setError(
          "Alert ID is missing. Please select an alert from Live Network or Threat Alerts."
        );

        setLoading(false);
        return;
      }

      // --------------------------------------------------------
      // FETCH FROM BACKEND
      // --------------------------------------------------------

      try {
        const response =
          await axios.get(
            `${API_URL}/alerts/${encodeURIComponent(
              String(alertId)
            )}`
          );

        if (response.data) {
          setInvestigation(
            response.data
          );

          setNotes(
            response.data
              ?.investigation_notes || ""
          );

          localStorage.setItem(
            "netshield_selected_alert",
            JSON.stringify(
              response.data
            )
          );
        }
      } catch (err) {
        console.error(
          "Investigation API error:",
          err
        );

        if (!savedAlert) {
          setError(
            err.response?.data
              ?.detail ||
              "Unable to load investigation details."
          );
        }
      } finally {
        setLoading(false);
      }
    }, [
      alertId,
      loadSavedAlert,
    ]);

  // ============================================================
  // INITIAL LOAD
  // ============================================================

  useEffect(() => {
    fetchInvestigation();
  }, [fetchInvestigation]);

  // ============================================================
  // UPDATE WORKFLOW
  // ============================================================

  const updateWorkflow =
    async (newStatus) => {

      if (!alertId) {
        setError(
          "Alert ID not found."
        );
        return;
      }

      try {
        setUpdating(true);
        setError("");

        const response =
          await axios.put(
            `${API_URL}/alerts/${encodeURIComponent(
              String(alertId)
            )}/workflow`,
            null,
            {
              params: {
                workflow_status:
                  newStatus.trim(),
              },
            }
          );

        const updatedData =
          response.data;

        setInvestigation(
          (previous) => ({
            ...(previous || {}),
            ...(updatedData || {}),
            workflow_status:
              newStatus,
          })
        );

        const saved =
          loadSavedAlert() || {};

        localStorage.setItem(
          "netshield_selected_alert",
          JSON.stringify({
            ...saved,
            workflow_status:
              newStatus,
          })
        );
      } catch (err) {
        console.error(
          "Workflow update error:",
          err
        );

        setError(
          err.response?.data
            ?.detail ||
            "Unable to update investigation status."
        );
      } finally {
        setUpdating(false);
      }
    };

  // ============================================================
  // SAVE NOTES
  // ============================================================

  const saveNotes = async () => {

    if (!alertId) {
      setError(
        "Alert ID not found."
      );
      return;
    }

    try {
      setSavingNotes(true);
      setNotesMessage("");
      setError("");

      await axios.put(
        `${API_URL}/alerts/${encodeURIComponent(
          String(alertId)
        )}/notes`,
        null,
        {
          params: {
            notes,
          },
        }
      );

      setInvestigation(
        (previous) => ({
          ...(previous || {}),
          investigation_notes:
            notes,
        })
      );

      const saved =
        loadSavedAlert() || {};

      localStorage.setItem(
        "netshield_selected_alert",
        JSON.stringify({
          ...saved,
          investigation_notes:
            notes,
        })
      );

      setNotesMessage(
        "✓ Investigation notes saved successfully."
      );
    } catch (err) {
      console.error(
        "Notes save error:",
        err
      );

      setNotesMessage("");

      setError(
        err.response?.data
          ?.detail ||
          "Unable to save investigation notes."
      );
    } finally {
      setSavingNotes(false);
    }
  };

  // ============================================================
  // SECURITY REPORT
  // ============================================================

  const downloadReport = () => {

    if (!alertId) {
      setError(
        "Alert ID not found."
      );
      return;
    }

    window.open(
      `${API_URL}/alerts/report/${encodeURIComponent(
        String(alertId)
      )}`,
      "_blank"
    );
  };

  // ============================================================
  // HELPERS
  // ============================================================

  const getValue = (...values) => {

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
  };

  // ============================================================
  // NORMALIZE DATA
  // ============================================================

  const threatType =
    getValue(
      investigation?.threat_type,
      investigation?.threat,
      investigation?.attack_type,
      investigation?.prediction,
      investigation?.classification
    ) || "Unknown Threat";

  const severity =
    getValue(
      investigation?.severity,
      investigation?.risk_level
    ) || "Low";

  const riskScore = Number(
    getValue(
      investigation?.risk_score,
      investigation?.risk,
      investigation?.riskScore
    ) || 0
  );

  const rawConfidence =
    getValue(
      investigation?.confidence,
      investigation?.confidence_value,
      investigation?.model_confidence
    );

  const confidence =
    rawConfidence === null
      ? "0%"
      : typeof rawConfidence === "number"
      ? `${rawConfidence}%`
      : String(
          rawConfidence
        ).includes("%")
      ? String(rawConfidence)
      : `${rawConfidence}%`;

  const workflowStatus =
    getValue(
      investigation?.workflow_status,
      investigation?.workflow,
      investigation?.status_workflow
    ) || "New";

  const packetSize =
    getValue(
      investigation?.packet_size,
      investigation?.packetSize
    ) || 0;

  const duration =
    getValue(
      investigation?.duration,
      investigation?.duration_seconds
    ) || 0;

  const connectionCount =
    getValue(
      investigation?.connection_count,
      investigation?.connections,
      investigation?.connectionCount
    ) || 0;

  const protocol =
    getValue(
      investigation?.protocol_type,
      investigation?.protocol,
      investigation?.protocolType
    ) || "--";

  const service =
    getValue(
      investigation?.service,
      investigation?.service_name
    ) || "--";

  const flag =
    getValue(
      investigation?.flag,
      investigation?.connection_flag,
      investigation?.connectionFlag
    ) || "--";

  const sourcePort =
    getValue(
      investigation?.source_port,
      investigation?.src_port,
      investigation?.sourcePort
    ) ?? "--";

  const destinationPort =
    getValue(
      investigation?.destination_port,
      investigation?.dst_port,
      investigation?.destinationPort
    ) ?? "--";

  const sourceIP =
    getValue(
      investigation?.source_ip,
      investigation?.src_ip,
      investigation?.sourceIP
    ) || "--";

  const destinationIP =
    getValue(
      investigation?.destination_ip,
      investigation?.dst_ip,
      investigation?.destinationIP
    ) || "--";

  const detectionTime =
    getValue(
      investigation?.timestamp,
      investigation?.created_at,
      investigation?.detection_time
    );

  const alertStatus =
    getValue(
      investigation?.status,
      investigation?.alert_status
    ) || "Threat Detected";

  const alertSource =
    getValue(
      investigation?.source,
      investigation?.source_name
    ) || "Live Network Monitor";

  const actualAlertId =
    investigation?._id ||
    investigation?.id ||
    investigation?.alert_id ||
    investigation?.alertId ||
    alertId ||
    "--";

  // ============================================================
  // FORMAT DATE
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
  // STATUS CLASS
  // ============================================================

  const statusClass =
    String(workflowStatus)
      .toLowerCase()
      .replace(/\s+/g, "-");

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <div className="investigation-page">

        <div className="investigation-loading">

          <div className="loading-shield">
            🛡️
          </div>

          <h2>
            Loading Investigation
          </h2>

          <p>
            Retrieving security incident details...
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
    <div className="investigation-page">

      {/* HEADER */}

      <header className="investigation-header">

        <div className="brand-area">

          <div className="brand-mark">
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

        <div className="header-status">
          <span className="status-dot"></span>
          SYSTEM OPERATIONAL
        </div>

      </header>

      {/* NAVIGATION */}

      <nav className="investigation-nav">

        <button
          type="button"
          onClick={() =>
            navigate("/dashboard")
          }
        >
          Dashboard
        </button>

        <button
          type="button"
          onClick={() =>
            navigate("/live-network")
          }
        >
          Live Monitor
        </button>

        <button
          type="button"
          onClick={() =>
            navigate("/threat-alerts")
          }
        >
          Threat Alerts
        </button>

        <button
          type="button"
          onClick={() =>
            navigate("/analytics")
          }
        >
          Analytics
        </button>

        <button
          className="active"
          type="button"
        >
          Investigations
        </button>

      </nav>

      <main className="investigation-container">

        <div className="investigation-breadcrumb">
          SECURITY / INVESTIGATION
        </div>

        {/* TITLE */}

        <section className="investigation-title">

          <div>

            <div className="title-kicker">
              SECURITY / INVESTIGATION
            </div>

            <h2>
              Incident Investigation
            </h2>

            <p>
              Detailed analysis of detected network
              activity and AI security assessment.
            </p>

          </div>

          <div className="title-actions">

            <button
              className="outline-button"
              type="button"
              onClick={() =>
                navigate("/threat-alerts")
              }
            >
              ← Threat Alerts
            </button>

            <button
              className="security-report-button"
              type="button"
              onClick={downloadReport}
            >
              📄 Security Report
            </button>

          </div>

        </section>

        {/* ERROR */}

        {error && (
          <div className="investigation-error">

            <span>⚠</span>

            <span>
              {error}
            </span>

          </div>
        )}

        {/* DETECTED EVENT */}

        <section className="detected-event-card">

          <div>

            <div className="event-live-label">
              LIVE MONITORING
            </div>

            <div className="detected-event-heading">

              <div className="warning-icon">
                ⚠
              </div>

              <div>

                <span>
                  DETECTED EVENT
                </span>

                <h2>
                  {threatType}
                </h2>

                <p>
                  Source: {alertSource}
                </p>

              </div>

            </div>

          </div>

          <div className="risk-display">

            <span>
              {severity}
            </span>

            <strong>
              {riskScore}
            </strong>

            <small>
              /100 RISK SCORE
            </small>

          </div>

        </section>

        {/* AI ASSESSMENT */}

        <section className="investigation-panel">

          <div className="panel-heading">

            <div>

              <span>
                AI ASSESSMENT
              </span>

              <h3>
                Threat Analysis
              </h3>

            </div>

            <span className="model-label">
              RANDOM FOREST
            </span>

          </div>

          <div className="assessment-grid">

            <div className="assessment-card">
              <span>THREAT TYPE</span>

              <strong>
                {threatType}
              </strong>
            </div>

            <div className="assessment-card">

              <span>
                SEVERITY
              </span>

              <strong
                className={`severity-text ${String(
                  severity
                ).toLowerCase()}`}
              >
                {severity}
              </strong>

            </div>

            <div className="assessment-card">

              <span>
                RISK SCORE
              </span>

              <strong>
                {riskScore}/100
              </strong>

            </div>

            <div className="assessment-card">

              <span>
                AI CONFIDENCE
              </span>

              <strong>
                {confidence}
              </strong>

            </div>

          </div>

        </section>

        {/* INCIDENT EVIDENCE */}

        <section className="investigation-panel">

          <div className="panel-heading">

            <div>

              <span>
                INCIDENT EVIDENCE
              </span>

              <h3>
                Security Evidence
              </h3>

            </div>

            <span className="model-label">
              AI GENERATED
            </span>

          </div>

          <div className="evidence-grid">

            <div className="evidence-item">
              <span>THREAT</span>
              <strong>{threatType}</strong>
            </div>

            <div className="evidence-item">
              <span>SEVERITY</span>
              <strong>{severity}</strong>
            </div>

            <div className="evidence-item">
              <span>RISK SCORE</span>
              <strong>{riskScore}/100</strong>
            </div>

            <div className="evidence-item">
              <span>AI CONFIDENCE</span>
              <strong>{confidence}</strong>
            </div>

            <div className="evidence-item">
              <span>SOURCE IP</span>
              <strong>{sourceIP}</strong>
            </div>

            <div className="evidence-item">
              <span>DESTINATION IP</span>
              <strong>{destinationIP}</strong>
            </div>

            <div className="evidence-item">
              <span>PROTOCOL</span>
              <strong>{protocol}</strong>
            </div>

            <div className="evidence-item">
              <span>SERVICE</span>
              <strong>{service}</strong>
            </div>

            <div className="evidence-item">
              <span>SOURCE PORT</span>
              <strong>{sourcePort}</strong>
            </div>

            <div className="evidence-item">
              <span>DESTINATION PORT</span>
              <strong>{destinationPort}</strong>
            </div>

            <div className="evidence-item">
              <span>PACKET SIZE</span>
              <strong>
                {packetSize} bytes
              </strong>
            </div>

            <div className="evidence-item">
              <span>DURATION</span>
              <strong>
                {duration} sec
              </strong>
            </div>

          </div>

        </section>

        {/* NETWORK TELEMETRY */}

        <section className="investigation-panel">

          <div className="panel-heading">

            <div>

              <span>
                NETWORK TELEMETRY
              </span>

              <h3>
                Connection Details
              </h3>

            </div>

          </div>

          <div className="telemetry-grid">

            <div className="telemetry-item">
              <span>PACKET SIZE</span>
              <strong>{packetSize}</strong>
              <small>bytes</small>
            </div>

            <div className="telemetry-item">
              <span>DURATION</span>
              <strong>{duration}</strong>
              <small>sec</small>
            </div>

            <div className="telemetry-item">
              <span>CONNECTION COUNT</span>
              <strong>
                {connectionCount}
              </strong>
            </div>

            <div className="telemetry-item">
              <span>PROTOCOL</span>
              <strong>{protocol}</strong>
            </div>

            <div className="telemetry-item">
              <span>SERVICE</span>
              <strong>{service}</strong>
            </div>

            <div className="telemetry-item">
              <span>CONNECTION FLAG</span>
              <strong>{flag}</strong>
            </div>

            <div className="telemetry-item">
              <span>SOURCE PORT</span>
              <strong>{sourcePort}</strong>
            </div>

            <div className="telemetry-item">
              <span>DESTINATION PORT</span>
              <strong>
                {destinationPort}
              </strong>
            </div>

          </div>

        </section>

        {/* INVESTIGATION NOTES */}

        <section className="investigation-panel notes-card">

          <div className="panel-heading">

            <div>

              <span>
                ANALYST WORKSPACE
              </span>

              <h3>
                Investigation Notes
              </h3>

            </div>

            <span className="model-label">
              PRIVATE
            </span>

          </div>

          <p className="notes-description">
            Record findings, suspicious activity,
            investigation steps and analyst
            observations for this security incident.
          </p>

          <textarea
            className="investigation-notes"
            value={notes}
            onChange={(event) =>
              setNotes(event.target.value)
            }
            placeholder="Enter investigation findings..."
            rows={7}
          />

          <div className="notes-footer">

            <span>
              {notes.length} characters
            </span>

            <div className="notes-actions">

              {notesMessage && (
                <span className="notes-message">
                  {notesMessage}
                </span>
              )}

              <button
                className="save-notes-button"
                type="button"
                disabled={savingNotes}
                onClick={saveNotes}
              >
                {savingNotes
                  ? "Saving..."
                  : "💾 Save Notes"}
              </button>

            </div>

          </div>

        </section>

        {/* INCIDENT MANAGEMENT */}

        <section className="investigation-panel">

          <div className="panel-heading">

            <div>

              <span>
                INCIDENT MANAGEMENT
              </span>

              <h3>
                Investigation Status
              </h3>

            </div>

            <span
              className={`current-status-badge ${statusClass}`}
            >
              CURRENT: {workflowStatus}
            </span>

          </div>

          <div className="workflow">

            {/* NEW */}

            <div
              className={`workflow-step ${
                workflowStatus === "New"
                  ? "active"
                  : ""
              } ${
                [
                  "Acknowledged",
                  "Investigating",
                  "Resolved",
                ].includes(workflowStatus)
                  ? "completed"
                  : ""
              }`}
            >

              <div className="workflow-number">
                01
              </div>

              <div className="workflow-content">
                <strong>New</strong>

                <span>
                  Alert received
                </span>
              </div>

            </div>

            <div className="workflow-line"></div>

            {/* ACKNOWLEDGED */}

            <div
              className={`workflow-step ${
                workflowStatus === "Acknowledged"
                  ? "active"
                  : ""
              } ${
                [
                  "Investigating",
                  "Resolved",
                ].includes(workflowStatus)
                  ? "completed"
                  : ""
              }`}
            >

              <div className="workflow-number">
                02
              </div>

              <div className="workflow-content">
                <strong>
                  Acknowledged
                </strong>

                <span>
                  Alert confirmed
                </span>
              </div>

            </div>

            <div className="workflow-line"></div>

            {/* INVESTIGATING */}

            <div
              className={`workflow-step ${
                workflowStatus === "Investigating"
                  ? "active"
                  : ""
              } ${
                workflowStatus === "Resolved"
                  ? "completed"
                  : ""
              }`}
            >

              <div className="workflow-number">
                03
              </div>

              <div className="workflow-content">
                <strong>
                  Investigating
                </strong>

                <span>
                  Security analysis
                </span>
              </div>

            </div>

            <div className="workflow-line"></div>

            {/* RESOLVED */}

            <div
              className={`workflow-step ${
                workflowStatus === "Resolved"
                  ? "active completed"
                  : ""
              }`}
            >

              <div className="workflow-number">
                04
              </div>

              <div className="workflow-content">
                <strong>
                  Resolved
                </strong>

                <span>
                  Incident closed
                </span>
              </div>

            </div>

          </div>

          <div className="workflow-action-area">

            <div className="current-status">

              <span>
                CURRENT STATUS
              </span>

              <strong>
                {workflowStatus}
              </strong>

            </div>

            <div className="workflow-actions">

              {workflowStatus === "New" && (

                <button
                  className="acknowledge-button"
                  type="button"
                  disabled={updating}
                  onClick={() =>
                    updateWorkflow(
                      "Acknowledged"
                    )
                  }
                >
                  {updating
                    ? "Updating..."
                    : "✓ Acknowledge Alert"}
                </button>

              )}

              {workflowStatus ===
                "Acknowledged" && (

                <button
                  className="investigate-action-button"
                  type="button"
                  disabled={updating}
                  onClick={() =>
                    updateWorkflow(
                      "Investigating"
                    )
                  }
                >
                  {updating
                    ? "Updating..."
                    : "🔍 Start Investigation"}
                </button>

              )}

              {workflowStatus ===
                "Investigating" && (

                <button
                  className="resolve-button"
                  type="button"
                  disabled={updating}
                  onClick={() =>
                    updateWorkflow(
                      "Resolved"
                    )
                  }
                >
                  {updating
                    ? "Updating..."
                    : "✓ Resolve Incident"}
                </button>

              )}

              {workflowStatus ===
                "Resolved" && (

                <div className="resolved-message">
                  ✓ INCIDENT RESOLVED
                </div>

              )}

            </div>

          </div>

        </section>

        {/* EVENT INFORMATION */}

        <section className="investigation-panel">

          <div className="panel-heading">

            <div>

              <span>
                EVENT INFORMATION
              </span>

              <h3>
                Detection Metadata
              </h3>

            </div>

          </div>

          <div className="metadata-grid">

            <div>
              <span>ALERT ID</span>

              <strong>
                {actualAlertId}
              </strong>
            </div>

            <div>
              <span>
                DETECTION TIME
              </span>

              <strong>
                {formatDate(
                  detectionTime
                )}
              </strong>
            </div>

            <div>
              <span>STATUS</span>

              <strong>
                {alertStatus}
              </strong>
            </div>

            <div>
              <span>WORKFLOW</span>

              <strong>
                {workflowStatus}
              </strong>
            </div>

            <div>
              <span>SOURCE</span>

              <strong>
                {alertSource}
              </strong>
            </div>

            <div>
              <span>SOURCE IP</span>

              <strong>
                {sourceIP}
              </strong>
            </div>

            <div>
              <span>
                DESTINATION IP
              </span>

              <strong>
                {destinationIP}
              </strong>
            </div>

          </div>

        </section>

        {/* FOOTER */}

        <footer className="investigation-footer">

          <div className="footer-brand">

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
            MILESTONE 3 • INCIDENT INVESTIGATION
          </span>

        </footer>

      </main>

    </div>
  );
}

export default Investigation;