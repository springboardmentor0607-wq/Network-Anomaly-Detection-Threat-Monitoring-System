import React, {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import "./AlertInvestigation.css";


const API_URL =
  "http://127.0.0.1:8000";


function AlertInvestigation() {

  const {
    alertId,
  } = useParams();

  const navigate =
    useNavigate();


  // ============================================================
  // STATE
  // ============================================================

  const [alert, setAlert] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [updating, setUpdating] =
    useState(false);

  const [error, setError] =
    useState("");


  // ============================================================
  // FETCH ALERT
  // ============================================================

  const fetchAlert =
    useCallback(async () => {

      try {

        setError("");

        const response =
          await fetch(
            `${API_URL}/alerts/${alertId}`
          );


        if (!response.ok) {

          throw new Error(
            "Unable to load security alert."
          );

        }


        const data =
          await response.json();


        setAlert({
          ...data,

          id:
            data.id ||
            data._id,

          workflow_status:
            data.workflow_status ||
            "New",

          risk_score:
            Number(
              data.risk_score || 0
            ),

          confidence:
            data.confidence ||
            "0%",

          severity:
            data.severity ||
            "Low",

          threat_type:
            data.threat_type ||
            "Unknown Threat",

          status:
            data.status ||
            "Unknown",
        });


      } catch (err) {

        console.error(
          "Alert investigation error:",
          err
        );

        setError(
          "Unable to load this security event."
        );

      } finally {

        setLoading(false);

      }

    }, [alertId]);


  // ============================================================
  // LOAD ALERT
  // ============================================================

  useEffect(() => {

    fetchAlert();

  }, [fetchAlert]);


  // ============================================================
  // UPDATE WORKFLOW
  // ============================================================

  const updateWorkflow =
    async (newStatus) => {

      if (!alertId) {
        return;
      }


      if (updating) {
        return;
      }


      try {

        setUpdating(true);

        setError("");


        const response =
          await fetch(
            `${API_URL}/alerts/${alertId}/workflow?workflow_status=${encodeURIComponent(
              newStatus
            )}`,
            {
              method: "PUT",
            }
          );


        if (!response.ok) {

          const errorData =
            await response.json()
              .catch(() => null);


          throw new Error(
            errorData?.detail ||
            "Failed to update workflow."
          );

        }


        const result =
          await response.json();


        // ------------------------------------------------------
        // Update UI immediately
        // ------------------------------------------------------

        setAlert(
          (previous) => {

            if (!previous) {
              return previous;
            }

            return {
              ...previous,

              workflow_status:
                result.workflow_status ||
                newStatus,
            };

          }
        );


        // ------------------------------------------------------
        // Reload from MongoDB
        // ------------------------------------------------------

        await fetchAlert();


      } catch (err) {

        console.error(
          "Workflow update error:",
          err
        );

        setError(
          err.message ||
          "Unable to update workflow."
        );

      } finally {

        setUpdating(false);

      }

    };


  // ============================================================
  // WORKFLOW STATUS
  // ============================================================

  const workflow =
    alert?.workflow_status ||
    "New";


  // ============================================================
  // STATUS HELPERS
  // ============================================================

  const isNew =
    workflow === "New";

  const isAcknowledged =
    workflow === "Acknowledged";

  const isInvestigating =
    workflow === "Investigating";

  const isResolved =
    workflow === "Resolved";


  // ============================================================
  // FORMAT DATE
  // ============================================================

  const formatDate =
    (timestamp) => {

      if (!timestamp) {
        return "--";
      }


      const date =
        new Date(timestamp);


      if (
        Number.isNaN(
          date.getTime()
        )
      ) {

        return "--";

      }


      return date.toLocaleString();

    };


  // ============================================================
  // FORMAT CONFIDENCE
  // ============================================================

  const formatConfidence =
    (confidence) => {

      if (
        confidence === undefined ||
        confidence === null
      ) {

        return "0.00%";

      }


      const value =
        String(confidence);


      if (
        value.includes("%")
      ) {

        return value;

      }


      const number =
        Number(value);


      if (
        Number.isNaN(number)
      ) {

        return value;

      }


      return `${number.toFixed(2)}%`;

    };


  // ============================================================
  // BACK TO LIVE MONITOR
  // ============================================================

  const goBack =
    () => {

      navigate(
        "/live-network"
      );

    };


  // ============================================================
  // SECURITY REPORT
  // ============================================================

  const openReport =
    () => {

      if (!alertId) {
        return;
      }


      window.open(
        `${API_URL}/monitoring/report/${alertId}`,
        "_blank"
      );

    };


  // ============================================================
  // LOADING SCREEN
  // ============================================================

  if (loading) {

    return (

      <div className="investigation-loading">

        <div className="investigation-spinner"></div>

        <h2>
          Loading Security Investigation
        </h2>

        <p>
          NetShield AI is retrieving the security event...
        </p>

      </div>

    );

  }


  // ============================================================
  // ERROR
  // ============================================================

  if (error && !alert) {

    return (

      <div className="investigation-loading">

        <h2>
          Security Event Not Found
        </h2>

        <p>
          {error}
        </p>

        <button
          onClick={goBack}
        >
          ← Back to Live Monitor
        </button>

      </div>

    );

  }


  // ============================================================
  // NO ALERT
  // ============================================================

  if (!alert) {

    return (

      <div className="investigation-loading">

        <h2>
          No Security Event
        </h2>

        <button
          onClick={goBack}
        >
          ← Back to Live Monitor
        </button>

      </div>

    );

  }


  // ============================================================
  // MAIN PAGE
  // ============================================================

  return (

    <div className="investigation-page">


      {/* ======================================================
          HEADER
      ====================================================== */}

      <header className="investigation-header">

        <div className="investigation-brand">

          <div className="investigation-shield">
            🛡️
          </div>

          <div>

            <div className="investigation-brand-name">
              NETSHIELD AI
            </div>

            <div className="investigation-brand-subtitle">
              SECURITY OPERATIONS CENTER
            </div>

          </div>

        </div>


        <div className="investigation-engine-status">

          <span className="online-dot"></span>

          AI INVESTIGATION ENGINE

          <strong>
            ONLINE
          </strong>

        </div>

      </header>


      {/* ======================================================
          TOP NAV
      ====================================================== */}

      <div className="investigation-topbar">

        <button
          className="back-monitor-button"
          onClick={goBack}
        >
          ← Live Monitor
        </button>


        <div className="investigation-breadcrumb">

          SOC
          <span>/</span>
          ALERTS
          <span>/</span>

          <strong>
            INVESTIGATION
          </strong>

        </div>

      </div>


      {/* ======================================================
          PAGE INTRO
      ====================================================== */}

      <section className="investigation-intro">

        <div>

          <span className="intro-kicker">
            SECURITY EVENT ANALYSIS
          </span>

          <h1>
            {alert.threat_type}
          </h1>

          <p>
            AI-powered investigation of network
            activity and threat behavior.
          </p>

        </div>


        <div className="intro-event">

          <span>
            EVENT ID
          </span>

          <code>
            {alert.id || alert._id}
          </code>

        </div>

      </section>


      {/* ======================================================
          ERROR MESSAGE
      ====================================================== */}

      {error && (

        <div className="workflow-error">
          ⚠ {error}
        </div>

      )}


      {/* ======================================================
          THREAT SUMMARY
      ====================================================== */}

      <section className="investigation-summary">


        <div className="risk-summary">

          <span>
            RISK
          </span>

          <strong>
            {alert.risk_score}
          </strong>

          <small>
            /100
          </small>

          <label>
            CURRENT THREAT LEVEL
          </label>

          <b>
            {alert.threat_type}
          </b>

        </div>


        <div className="summary-card">

          <div className="summary-icon">
            ◉
          </div>

          <span>
            THREAT RISK
          </span>

          <strong>
            {alert.risk_score}/100
          </strong>

          <small>
            AI risk calculation
          </small>

        </div>


        <div className="summary-card">

          <div className="summary-icon">
            ◈
          </div>

          <span>
            CONFIDENCE
          </span>

          <strong>
            {formatConfidence(
              alert.confidence
            )}
          </strong>

          <small>
            Model confidence
          </small>

        </div>


        <div className="summary-card">

          <div className="summary-icon">
            !
          </div>

          <span>
            SEVERITY
          </span>

          <strong>
            {alert.severity}
          </strong>

          <small>
            Threat classification
          </small>

        </div>


        <div className="summary-card">

          <div className="summary-icon">
            AI
          </div>

          <span>
            DETECTION ENGINE
          </span>

          <strong>
            Random Forest
          </strong>

          <small>
            Online
          </small>

        </div>

      </section>


      {/* ======================================================
          INCIDENT RESPONSE
      ====================================================== */}

      <section className="investigation-panel workflow-panel">

        <div className="section-label">
          RESPONSE CONTROL
        </div>

        <h2>
          Incident Workflow
        </h2>

        <p className="section-description">
          Manage the security response lifecycle for this event.
        </p>


        <div className="workflow-current">

          CURRENT

          <strong>
            {workflow}
          </strong>

        </div>


        <div className="workflow-steps">


          <div
            className={
              `workflow-step ${
                isNew ||
                isAcknowledged ||
                isInvestigating ||
                isResolved
                  ? "completed"
                  : ""
              }`
            }
          >

            <span>
              ○
            </span>

            <strong>
              New
            </strong>

          </div>


          <div
            className={
              `workflow-step ${
                isAcknowledged ||
                isInvestigating ||
                isResolved
                  ? "completed"
                  : ""
              }`
            }
          >

            <span>
              ✓
            </span>

            <strong>
              Acknowledged
            </strong>

          </div>


          <div
            className={
              `workflow-step ${
                isInvestigating ||
                isResolved
                  ? "completed"
                  : ""
              }`
            }
          >

            <span>
              ⌕
            </span>

            <strong>
              Investigating
            </strong>

          </div>


          <div
            className={
              `workflow-step ${
                isResolved
                  ? "completed"
                  : ""
              }`
            }
          >

            <span>
              ✓
            </span>

            <strong>
              Resolved
            </strong>

          </div>

        </div>


        {/* ====================================================
            WORKFLOW BUTTONS
        ==================================================== */}

        <div className="workflow-actions">


          <button
            className="workflow-button acknowledge"
            disabled={
              updating ||
              !isNew
            }
            onClick={() =>
              updateWorkflow(
                "Acknowledged"
              )
            }
          >
            ✓ Acknowledge
          </button>


          <button
            className="workflow-button investigate"
            disabled={
              updating ||
              (
                !isAcknowledged &&
                !isNew
              ) ||
              isInvestigating ||
              isResolved
            }
            onClick={() =>
              updateWorkflow(
                "Investigating"
              )
            }
          >
            ⌕ Start Investigation
          </button>


          <button
            className="workflow-button resolve"
            disabled={
              updating ||
              isResolved ||
              isNew
            }
            onClick={() =>
              updateWorkflow(
                "Resolved"
              )
            }
          >
            ✓ Resolve Alert
          </button>


          <button
            className="workflow-button report"
            onClick={openReport}
          >
            ▣ Security Report
          </button>

        </div>


        <div className="workflow-status-line">

          <span>
            ●
          </span>

          CURRENT WORKFLOW STATUS

          <strong>
            {workflow}
          </strong>

          {updating && (
            <em>
              Updating...
            </em>
          )}

        </div>

      </section>


      {/* ======================================================
          NETWORK TELEMETRY
      ====================================================== */}

      <section className="investigation-panel">

        <div className="section-label">
          NETWORK TELEMETRY
        </div>

        <h2>
          Traffic Intelligence
        </h2>


        <div className="live-data-badge">
          ● LIVE DATA
        </div>


        <div className="telemetry-grid">


          <div className="telemetry-card">

            <span>
              ◈
            </span>

            <label>
              PACKET SIZE
            </label>

            <strong>
              {alert.packet_size || 0}
            </strong>

            <small>
              bytes
            </small>

          </div>


          <div className="telemetry-card">

            <span>
              ◷
            </span>

            <label>
              DURATION
            </label>

            <strong>
              {alert.duration || 0}
            </strong>

            <small>
              seconds
            </small>

          </div>


          <div className="telemetry-card">

            <span>
              ⇄
            </span>

            <label>
              CONNECTIONS
            </label>

            <strong>
              {alert.connection_count || 0}
            </strong>

            <small>
              connections
            </small>

          </div>


          <div className="telemetry-card">

            <span>
              ↗
            </span>

            <label>
              SOURCE PORT
            </label>

            <strong>
              {alert.source_port || "--"}
            </strong>

            <small>
              origin
            </small>

          </div>


          <div className="telemetry-card">

            <span>
              ↘
            </span>

            <label>
              DESTINATION
            </label>

            <strong>
              {alert.destination_port || "--"}
            </strong>

            <small>
              port
            </small>

          </div>


          <div className="telemetry-card">

            <span>
              ⌁
            </span>

            <label>
              PROTOCOL
            </label>

            <strong>
              {alert.protocol_type || "--"}
            </strong>

            <small>
              network
            </small>

          </div>


          <div className="telemetry-card">

            <span>
              ◉
            </span>

            <label>
              SERVICE
            </label>

            <strong>
              {alert.service || "--"}
            </strong>

            <small>
              application
            </small>

          </div>


          <div className="telemetry-card">

            <span>
              ⚑
            </span>

            <label>
              FLAGS
            </label>

            <strong>
              {alert.flag || "--"}
            </strong>

            <small>
              connection
            </small>

          </div>

        </div>

      </section>


      {/* ======================================================
          AI SECURITY ANALYSIS
      ====================================================== */}

      <section className="ai-analysis-panel">

        <div className="section-label">
          ARTIFICIAL INTELLIGENCE
        </div>

        <h2>
          AI Security Verdict
        </h2>


        <div className="ai-engine-online">
          ENGINE ONLINE
        </div>


        <div className="ai-verdict">


          <div className="verdict-icon">
            ✦
          </div>


          <div className="verdict-content">

            <span>
              INVESTIGATION PRIORITY
            </span>

            <strong>
              {
                alert.severity === "Critical"
                  ? "IMMEDIATE"
                  : alert.severity === "High"
                  ? "HIGH"
                  : alert.severity === "Medium"
                  ? "MEDIUM"
                  : "LOW"
              }
            </strong>


            <label>
              AI RECOMMENDATION
            </label>


            <p>

              {
                alert.severity === "Critical"
                  ? "Immediately investigate and isolate affected traffic."
                  : alert.severity === "High"
                  ? "Investigate this activity and monitor affected network traffic."
                  : alert.severity === "Medium"
                  ? "Review the activity and continue monitoring for suspicious behavior."
                  : "No immediate action required. Continue monitoring the network activity."
              }

            </p>

          </div>

        </div>


        <div className="ai-details">


          <div>

            <span>
              MODEL
            </span>

            <strong>
              Random Forest
            </strong>

          </div>


          <div>

            <span>
              STATUS
            </span>

            <strong>
              Operational
            </strong>

          </div>


          <div>

            <span>
              CONFIDENCE
            </span>

            <strong>
              {formatConfidence(
                alert.confidence
              )}
            </strong>

          </div>

        </div>

      </section>


      {/* ======================================================
          THREAT PROFILE
      ====================================================== */}

      <section className="investigation-columns">


        <div className="threat-profile-panel">

          <span className="number-label">
            01
          </span>

          <div className="section-label">
            THREAT PROFILE
          </div>

          <h2>
            {alert.threat_type}
          </h2>


          <div className="profile-status">

            <strong>
              {alert.severity}
            </strong>

            <span>
              {alert.status}
            </span>

          </div>


          <div className="profile-source">

            SOURCE

            <strong>
              {alert.source ||
                "Live Network Monitor"}
            </strong>

          </div>

        </div>


        {/* ====================================================
            EVENT INTELLIGENCE
        ==================================================== */}

        <div className="event-intelligence-panel">

          <span className="number-label">
            02
          </span>

          <div className="section-label">
            EVENT INTELLIGENCE
          </div>

          <h2>
            Security Event Details
          </h2>


          <div className="event-details">


            <div>

              <span>
                EVENT ID
              </span>

              <strong>
                {alert.id || alert._id}
              </strong>

            </div>


            <div>

              <span>
                TIMESTAMP
              </span>

              <strong>
                {formatDate(
                  alert.timestamp
                )}
              </strong>

            </div>


            <div>

              <span>
                SOURCE
              </span>

              <strong>
                {alert.source ||
                  "Live Network Monitor"}
              </strong>

            </div>


            <div>

              <span>
                PREDICTION
              </span>

              <strong>
                {alert.prediction !== undefined
                  ? alert.prediction
                  : alert.threat_type ===
                    "Normal Traffic"
                  ? "0"
                  : "1"}
              </strong>

            </div>


            <div>

              <span>
                WORKFLOW
              </span>

              <strong>
                {workflow}
              </strong>

            </div>

          </div>

        </div>

      </section>


      {/* ======================================================
          RISK ANALYTICS
      ====================================================== */}

      <section className="risk-analytics-panel">

        <span className="number-label">
          03
        </span>

        <div className="section-label">
          RISK ANALYTICS
        </div>


        <div className="risk-score-display">

          <strong>
            {alert.risk_score}
          </strong>

          <span>
            /100
          </span>

        </div>


        <div className="risk-scale">

          <span className="low">
            LOW
          </span>

          <span className="medium">
            MED
          </span>

          <span className="high">
            HIGH
          </span>

          <span className="critical">
            CRITICAL
          </span>

        </div>


        <p>
          AI calculated threat probability based
          on network behavior.
        </p>

      </section>


      {/* ======================================================
          FOOTER
      ====================================================== */}

      <footer className="investigation-footer">

        <div>

          🛡️

          <strong>
            NETSHIELD AI
          </strong>

        </div>


        <span>
          AI-POWERED NETWORK SECURITY
        </span>


        <span>

          INVESTIGATION ENGINE:

          <strong>
            ONLINE
          </strong>

        </span>


        <span>

          EVENT:

          <strong>
            {alert.id || alert._id}
          </strong>

        </span>

      </footer>

    </div>

  );

}


export default AlertInvestigation;