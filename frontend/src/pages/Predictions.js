
import React, { useEffect, useState } from "react";
import axios from "axios";
import "./Predictions.css";

const API_URL = "http://127.0.0.1:8000";

function Predictions() {
  

  const [data, setData] = useState({
    summary: {},
    predictions: []
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const fetchPredictions = async () => {
    try {
      setRefreshing(true);

      const response = await axios.get(
        `${API_URL}/predictions/`
      );

      console.log("Predictions API:", response.data);

      setData(response.data);
      setError("");
    } catch (err) {
      console.error("Predictions API Error:", err);

      setError(
        err.response?.data?.detail ||
        "Unable to load predictions."
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
  const predictions = data?.predictions || [];

  const severityClass = (severity) => {
    const value = String(severity || "").toLowerCase();

    if (value === "critical") return "critical";
    if (value === "high") return "high";
    if (value === "medium") return "medium";
    return "low";
  };

  const statusClass = (status) => {
    return status === "Threat Detected"
      ? "threat"
      : "normal";
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return "-";

    const date = new Date(timestamp);

    if (Number.isNaN(date.getTime())) {
      return timestamp;
    }

    return date.toLocaleString();
  };

  if (loading) {
    return (
      <div className="predictions-loading">
        <div className="loading-icon">🧠</div>

        <h1>NetShield AI</h1>

        <p>Loading AI Predictions...</p>

        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="predictions-page">

      {/* ================= SIDEBAR ================= */}

      <aside className="predictions-sidebar">

        <div className="predictions-brand">
          <div className="brand-icon">🛡️</div>

          <div>
            <h2>NetShield</h2>
            <span>AI SECURITY</span>
          </div>
        </div>

       <div className="predictions-nav-section">

  <p>MONITORING</p>

  <button
    type="button"
    className="predictions-nav-item"
    onClick={() => {
      window.location.href = "/dashboard";
    }}
  >
    <span>▦</span>
    Dashboard
  </button>

  <button
    type="button"
    className="predictions-nav-item"
    onClick={() => {
      window.location.href = "/live-network";
    }}
  >
    <span>◉</span>
    Live Network
  </button>

  <button
    type="button"
    className="predictions-nav-item"
    onClick={() => {
      window.location.href = "/threat-alerts";
    }}
  >
    <span>⚠</span>
    Threat Alerts
  </button>

  <button
    type="button"
    className="predictions-nav-item"
    onClick={() => {
      window.location.href = "/analytics";
    }}
  >
    <span>⌁</span>
    Threat Analysis
  </button>

</div>


<div className="predictions-nav-section">

  <p>INTELLIGENCE</p>

  <button
    type="button"
    className="predictions-nav-item active"
  >
    <span>✦</span>
    AI Predictions
  </button>

  <button
    type="button"
    className="predictions-nav-item"
    onClick={() => {
      window.location.href = "/analytics";
    }}
  >
    <span>◷</span>
    Threat Timeline
  </button>

</div>
      </aside>

      {/* ================= MAIN ================= */}

      <main className="predictions-main">

        <header className="predictions-header">

          <div>

            <span className="page-label">
              SECURITY / AI INTELLIGENCE
            </span>

            <h1>AI Predictions</h1>

            <p>
              AI-powered prediction and classification
              of network security threats.
            </p>

          </div>

          <div className="header-actions">

            <div className="online-status">
              <span></span>
              AI ENGINE ONLINE
            </div>

            <button
              type="button"
              onClick={fetchPredictions}
              disabled={refreshing}
            >
              ↻ {refreshing ? "Refreshing..." : "Refresh"}
            </button>

          </div>

        </header>

        {/* ================= ERROR ================= */}

        {error && (
          <div className="prediction-error">
            ⚠️ {error}

            <button
              type="button"
              onClick={fetchPredictions}
            >
              Retry
            </button>
          </div>
        )}

        {/* ================= SUMMARY ================= */}

        <section className="summary-grid">

          <div className="summary-card blue">
            <span>TOTAL PREDICTIONS</span>
            <strong>
              {summary.total_predictions ?? 0}
            </strong>
            <small>AI predictions analyzed</small>
          </div>

          <div className="summary-card red">
            <span>THREAT PREDICTIONS</span>
            <strong>
              {summary.threat_predictions ?? 0}
            </strong>
            <small>Potential security threats</small>
          </div>

          <div className="summary-card critical">
            <span>CRITICAL PREDICTIONS</span>
            <strong>
              {summary.critical_predictions ?? 0}
            </strong>
            <small>Critical severity threats</small>
          </div>

          <div className="summary-card purple">
            <span>AVG CONFIDENCE</span>
            <strong>
              {summary.average_confidence ?? 0}%
            </strong>
            <small>Model confidence</small>
          </div>

          <div className="summary-card orange">
            <span>AVG RISK</span>
            <strong>
              {summary.average_risk ?? 0}/100
            </strong>
            <small>AI risk assessment</small>
          </div>

        </section>

        {/* ================= AI ENGINE ================= */}

        <section className="ai-engine">

          <div className="engine-icon">
            🧠
          </div>

          <div className="engine-info">
            <span>AI DETECTION ENGINE</span>

            <h2>
              Random Forest Threat Predictor
            </h2>

            <p>
              Continuously analyzing network traffic
              for potential security threats.
            </p>
          </div>

          <div className="engine-online">
            <span></span>
            ONLINE
          </div>

        </section>

        {/* ================= PREDICTIONS ================= */}

        <section className="predictions-panel">

          <div className="panel-header">

            <div>
              <span>AI INTELLIGENCE</span>
              <h2>Recent Predictions</h2>
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
                any predictions yet.
              </p>

            </div>

          ) : (

            <div className="table-wrapper">

              <table>

                <thead>

                  <tr>
                    <th>THREAT</th>
                    <th>SEVERITY</th>
                    <th>CONFIDENCE</th>
                    <th>RISK</th>
                    <th>STATUS</th>
                    <th>SERVICE</th>
                    <th>PROTOCOL</th>
                    <th>SOURCE</th>
                    <th>DESTINATION</th>
                    <th>TIME</th>
                  </tr>

                </thead>

                <tbody>

                  {predictions.map((item, index) => (

                    <tr key={item.id || index}>

                      <td>
                        <strong>
                          {item.threat_type || "Unknown"}
                        </strong>
                      </td>

                      <td>
                        <span
                          className={`severity ${severityClass(
                            item.severity
                          )}`}
                        >
                          {item.severity || "Unknown"}
                        </span>
                      </td>

                      <td>

                        <div className="confidence">

                          <strong>
                            {item.confidence ?? 0}%
                          </strong>

                          <div className="confidence-bar">

                            <div
                              style={{
                                width: `${Math.min(
                                  Math.max(
                                    Number(item.confidence) || 0,
                                    0
                                  ),
                                  100
                                )}%`
                              }}
                            />

                          </div>

                        </div>

                      </td>

                      <td>
                        <strong className="risk">
                          {item.risk_score ?? 0}
                        </strong>
                      </td>

                      <td>
                        <span
                          className={`status ${statusClass(
                            item.status
                          )}`}
                        >
                          {item.status || "Unknown"}
                        </span>
                      </td>

                      <td>
                        {item.service || "-"}
                      </td>

                      <td>
                        {item.protocol || "-"}
                      </td>

                      <td>
                        {item.source_ip || "-"}
                      </td>

                      <td>
                        {item.destination_ip || "-"}
                      </td>

                      <td>
                        {formatTime(item.timestamp)}
                      </td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>

          )}

        </section>

        {/* ================= FOOTER ================= */}

        <footer className="predictions-footer">

          <span>
            🛡️ <strong>NetShield AI</strong>
            {" "}• AI-Powered Network Security
          </span>

          <span>
            🟢 AI Engine Operational
          </span>

          <span>
            Milestone 3 • AI Predictions
          </span>

        </footer>

      </main>

    </div>
  );
}

export default Predictions;

