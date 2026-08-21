
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useSearchParams, useNavigate } from "react-router-dom";
import "./Investigation.css";

const API_URL = "http://127.0.0.1:8000";

function Investigation() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const urlAlertId = searchParams.get("alertId") || "";

  const [alertId, setAlertId] = useState(urlAlertId);
  const [investigation, setInvestigation] = useState(null);

  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // =========================================================
  // GET INVESTIGATION
  // =========================================================

  const investigateAlert = async (id) => {
    const cleanId = id?.trim();

    if (!cleanId) {
      setError("Please enter an Alert ID.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await axios.get(
        `${API_URL}/monitoring/investigate/${cleanId}`
      );

      console.log("Investigation:", response.data);

      setInvestigation(response.data);
    } catch (err) {
      console.error("Investigation error:", err);

      if (err.response?.status === 404) {
        setError("Alert not found.");
      } else if (err.response?.status === 400) {
        setError("Invalid Alert ID.");
      } else {
        setError("Unable to connect to investigation API.");
      }
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // AUTOMATIC INVESTIGATION
  // =========================================================

  useEffect(() => {
    if (urlAlertId) {
      setAlertId(urlAlertId);
      investigateAlert(urlAlertId);
    }
  }, [urlAlertId]);

  // =========================================================
  // SEARCH
  // =========================================================

  const handleSubmit = (event) => {
    event.preventDefault();

    const cleanId = alertId.trim();

    if (!cleanId) {
      setError("Please enter an Alert ID.");
      return;
    }

    setError("");
    setMessage("");

    navigate(
      `/investigation?alertId=${encodeURIComponent(cleanId)}`
    );
  };

  // =========================================================
  // WORKFLOW
  // =========================================================

  const updateWorkflow = async (action) => {
    const cleanId = alertId?.trim();

    if (!cleanId) {
      setError("Alert ID is required.");
      return;
    }

    setActionLoading(true);
    setError("");

    try {
      const response = await axios.patch(
        `${API_URL}/alerts/${cleanId}/${action}`
      );

      setMessage(
        response.data?.message ||
          "Alert workflow updated successfully."
      );

      await investigateAlert(cleanId);
    } catch (err) {
      console.error("Workflow error:", err);

      setError(
        err.response?.data?.detail ||
          "Unable to update alert workflow."
      );
    } finally {
      setActionLoading(false);
    }
  };

  // =========================================================
  // GENERATE REPORT
  // =========================================================

  const generateSecurityReport = async () => {
    const cleanId = alertId?.trim();

    if (!cleanId) {
      setError("Alert ID is required to generate the report.");
      return;
    }

    setError("");
    setMessage("Generating security report...");

    try {
      const response = await axios.get(
        `${API_URL}/monitoring/report/${cleanId}`,
        {
          responseType: "blob"
        }
      );

      const pdfBlob = new Blob([response.data], {
        type: "application/pdf"
      });

      const url = window.URL.createObjectURL(pdfBlob);

      const link = document.createElement("a");

      link.href = url;
      link.download = `NetShield_Report_${cleanId}.pdf`;

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);

      setMessage("Security report generated successfully.");
    } catch (err) {
      console.error("Report generation error:", err);

      setError(
        err.response?.data?.detail ||
          "Unable to generate security report."
      );
    }
  };

  // =========================================================
  // DATE
  // =========================================================

  const formatDate = (timestamp) => {
    if (!timestamp) return "--";

    try {
      return new Date(timestamp).toLocaleString();
    } catch {
      return "--";
    }
  };

  // =========================================================
  // WORKFLOW HELPERS
  // =========================================================

  const workflowStatus =
    investigation?.workflow_status || "New";

  const workflowOrder = [
    "New",
    "Acknowledged",
    "Investigating",
    "Resolved"
  ];

  const workflowIndex = workflowOrder.indexOf(
    workflowStatus
  );

  const isCompleted = (status) => {
    return (
      workflowOrder.indexOf(status) <= workflowIndex
    );
  };

  const canAcknowledge =
    workflowStatus === "New";

  const canInvestigate =
    workflowStatus === "Acknowledged";

  const canResolve =
    workflowStatus === "Investigating";

  // =========================================================
  // STATUS ICON
  // =========================================================

  const getWorkflowIcon = (status) => {
    if (isCompleted(status)) {
      return "✓";
    }

    if (status === "Investigating") {
      return "⌕";
    }

    return "•";
  };

  // =========================================================
  // LOADING
  // =========================================================

  if (loading && !investigation) {
    return (
      <div className="investigation-page">
        <div className="investigation-loading">
          <div className="loading-spinner"></div>

          <h2>Investigating Security Event</h2>

          <p>
            NetShield AI is analyzing the selected
            network alert...
          </p>
        </div>
      </div>
    );
  }

  // =========================================================
  // PAGE
  // =========================================================

  return (
    <div className="investigation-page">

      {/* HEADER */}

      <header className="investigation-header">

        <div>
          <div className="page-eyebrow">
            SECURITY / INVESTIGATION
          </div>

          <h1>Threat Investigation</h1>

          <p>
            Analyze individual network alerts and
            determine the required security response.
          </p>
        </div>

        <div className="ai-active">
          <span className="live-dot"></span>
          AI INVESTIGATION ACTIVE
        </div>

      </header>

      {/* SEARCH */}

      <section className="investigation-search">

        <div className="search-heading">
          <div className="section-eyebrow">
            ALERT INVESTIGATION
          </div>

          <h2>Investigate Security Event</h2>
        </div>

        <form
          className="investigation-search-form"
          onSubmit={handleSubmit}
        >
          <input
            type="text"
            value={alertId}
            placeholder="Enter Alert ID"
            onChange={(event) =>
              setAlertId(event.target.value)
            }
          />

          <button
            type="submit"
            disabled={
              loading || actionLoading
            }
          >
            {loading ? "Investigating..." : "Investigate"}
          </button>
        </form>

        {error && (
          <div className="alert-message error-message">
            ⚠ {error}
          </div>
        )}

        {message && (
          <div className="alert-message success-message">
            ✓ {message}
          </div>
        )}

      </section>

      {/* RESULTS */}

      {investigation && (
        <div className="investigation-content">

          {/* THREAT SUMMARY */}

          <section className="investigation-card threat-summary-card">

            <div className="card-heading">

              <div>
                <span className="section-eyebrow">
                  THREAT SUMMARY
                </span>

                <h2>
                  {investigation.threat_type ||
                    "Unknown Threat"}
                </h2>
              </div>

              <span
                className={`severity-badge ${
                  investigation.severity
                    ?.toLowerCase() || "low"
                }`}
              >
                {investigation.severity || "Low"}
              </span>

            </div>

            <div className="summary-grid">

              <div className="summary-box">
                <span>Risk Score</span>

                <strong>
                  {investigation.risk_score ?? 0}
                  <small>/100</small>
                </strong>
              </div>

              <div className="summary-box">
                <span>Confidence</span>

                <strong>
                  {investigation.confidence || "0%"}
                </strong>
              </div>

              <div className="summary-box">
                <span>Status</span>

                <strong>
                  {investigation.status ||
                    "Unknown"}
                </strong>
              </div>

              <div className="summary-box">
                <span>Workflow</span>

                <strong
                  className={`workflow-text ${workflowStatus.toLowerCase()}`}
                >
                  {workflowStatus}
                </strong>
              </div>

            </div>

          </section>

          {/* WORKFLOW */}

          <section className="investigation-card">

            <div className="card-heading">
              <div>
                <span className="section-eyebrow">
                  INCIDENT RESPONSE
                </span>

                <h2>Alert Workflow</h2>
              </div>
            </div>

            <div className="workflow-timeline">

              {workflowOrder.map(
                (status, index) => (
                  <React.Fragment key={status}>

                    <div
                      className={`workflow-step ${
                        isCompleted(status)
                          ? "completed"
                          : ""
                      } ${
                        status === workflowStatus
                          ? "current"
                          : ""
                      }`}
                    >

                      <div className="workflow-circle">
                        {getWorkflowIcon(status)}
                      </div>

                      <span>{status}</span>

                    </div>

                    {index <
                      workflowOrder.length - 1 && (
                      <div
                        className={`workflow-line ${
                          index < workflowIndex
                            ? "completed"
                            : ""
                        }`}
                      />
                    )}

                  </React.Fragment>
                )
              )}

            </div>

            {/* ACTION BUTTONS */}

            <div className="workflow-actions">

              <button
                className="workflow-btn acknowledge-btn"
                disabled={
                  !canAcknowledge ||
                  actionLoading
                }
                onClick={() =>
                  updateWorkflow("acknowledge")
                }
              >
                ✓ Acknowledge
              </button>

              <button
                className="workflow-btn investigate-btn"
                disabled={
                  !canInvestigate ||
                  actionLoading
                }
                onClick={() =>
                  updateWorkflow("investigate")
                }
              >
                ⌕ Start Investigation
              </button>

              <button
                className="workflow-btn resolve-btn"
                disabled={
                  !canResolve ||
                  actionLoading
                }
                onClick={() =>
                  updateWorkflow("resolve")
                }
              >
                ✓ Resolve Alert
              </button>

              <button
                className="workflow-btn report-btn"
                disabled={actionLoading}
                onClick={
                  generateSecurityReport
                }
              >
                📄 Security Report
              </button>

              <button
                className="workflow-btn back-btn"
                onClick={() =>
                  navigate("/threat-alerts")
                }
              >
                ← Back to Alerts
              </button>

            </div>

            {/* CURRENT STATUS */}

            <div
              className={`current-workflow ${
                workflowStatus
                  .toLowerCase()
              }`}
            >
              <div className="current-status-icon">
                {workflowStatus ===
                "Resolved"
                  ? "✓"
                  : workflowStatus ===
                    "Investigating"
                  ? "⌕"
                  : "●"}
              </div>

              <div>
                <span>
                  CURRENT WORKFLOW STATUS
                </span>

                <strong>
                  {workflowStatus ===
                  "Resolved"
                    ? "Alert Resolved"
                    : workflowStatus}
                </strong>
              </div>
            </div>

          </section>

          {/* NETWORK DETAILS */}

          <section className="investigation-card">

            <div className="card-heading">
              <div>
                <span className="section-eyebrow">
                  NETWORK DETAILS
                </span>

                <h2>Traffic Information</h2>
              </div>
            </div>

            <div className="network-grid">

              <div>
                <span>Packet Size</span>
                <strong>
                  {investigation.packet_size ?? 0}
                </strong>
              </div>

              <div>
                <span>Duration</span>
                <strong>
                  {investigation.duration ?? 0}
                </strong>
              </div>

              <div>
                <span>Connections</span>
                <strong>
                  {investigation.connection_count ?? 0}
                </strong>
              </div>

              <div>
                <span>Source Port</span>
                <strong>
                  {investigation.source_port ?? "--"}
                </strong>
              </div>

              <div>
                <span>Destination Port</span>
                <strong>
                  {investigation.destination_port ?? "--"}
                </strong>
              </div>

              <div>
                <span>Protocol</span>
                <strong>
                  {investigation.protocol_type || "--"}
                </strong>
              </div>

              <div>
                <span>Service</span>
                <strong>
                  {investigation.service || "--"}
                </strong>
              </div>

              <div>
                <span>Flag</span>
                <strong>
                  {investigation.flag || "--"}
                </strong>
              </div>

            </div>

          </section>

          {/* AI ANALYSIS */}

          <section className="investigation-card ai-analysis-card">

            <div className="card-heading">

              <div>
                <span className="section-eyebrow">
                  AI SECURITY ANALYSIS
                </span>

                <h2>Recommended Action</h2>
              </div>

              <div className="ai-symbol">
                ✦
              </div>

            </div>

            <div className="ai-analysis">

              <div className="priority-panel">

                <span>
                  INVESTIGATION PRIORITY
                </span>

                <strong>
                  {investigation.investigation
                    ?.priority || "Normal"}
                </strong>

              </div>

              <div className="recommendation">
                <span>AI RECOMMENDATION</span>

                <p>
                  {investigation.investigation
                    ?.recommendation ||
                    "No immediate action required."}
                </p>
              </div>

            </div>

          </section>

          {/* EVENT INFORMATION */}

          <section className="investigation-card">

            <div className="card-heading">
              <div>
                <span className="section-eyebrow">
                  EVENT INFORMATION
                </span>

                <h2>Security Event Details</h2>
              </div>
            </div>

            <div className="event-grid">

              <div>
                <span>Alert ID</span>

                <strong className="alert-id">
                  {investigation._id ||
                    investigation.id ||
                    alertId}
                </strong>
              </div>

              <div>
                <span>Timestamp</span>

                <strong>
                  {formatDate(
                    investigation.timestamp
                  )}
                </strong>
              </div>

              <div>
                <span>Source</span>

                <strong>
                  {investigation.source ||
                    "Live Network Monitor"}
                </strong>
              </div>

            </div>

          </section>

        </div>
      )}

    </div>
  );
}

export default Investigation;

