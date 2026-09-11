import { useEffect, useState } from "react";
import axios from "axios";
import "./SecurityDashboard.css";

const API_BASE_URL = "http://127.0.0.1:8000";

function LiveNetworkPage() {
  const [liveData, setLiveData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadLiveStatus = async () => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/live/status`
      );

      setLiveData(response.data);
      setError("");
    } catch (err) {
      console.error("Live Network Error:", err);
      setError("Unable to load live network data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLiveStatus();

    const interval = setInterval(() => {
      loadLiveStatus();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const startMonitoring = async () => {
    try {
      setError("");

      await axios.post(
        `${API_BASE_URL}/api/live/start`
      );

      await loadLiveStatus();
    } catch (err) {
      console.error("Start monitoring error:", err);
      setError("Unable to start live monitoring");
    }
  };

  const stopMonitoring = async () => {
    try {
      setError("");

      await axios.post(
        `${API_BASE_URL}/api/live/stop`
      );

      await loadLiveStatus();
    } catch (err) {
      console.error("Stop monitoring error:", err);
      setError("Unable to stop live monitoring");
    }
  };

  if (loading) {
    return (
      <div className="section">
        <h2>🌐 Loading Live Network...</h2>
      </div>
    );
  }

  if (error && !liveData) {
    return (
      <div className="section">
        <h2>🌐 Live Network</h2>

        <p className="status-red">{error}</p>

        <button onClick={loadLiveStatus}>
          🔄 Retry
        </button>
      </div>
    );
  }

  const data = liveData || {};

  const running = Boolean(data.running);

  const packetCount = Number(data.packet_count || 0);

  const flowCount = Number(data.flow_count || 0);

  const threatCount = Number(data.threat_count || 0);

  const benignCount = Number(data.benign_count || 0);

  const runningSeconds = Number(
    data.running_seconds || 0
  );

  const prediction = data.last_prediction || {};

  const confidence = Number(
    prediction.average_confidence || 0
  );

  const totalFlows = Number(
    prediction.total_flows || flowCount
  );

  const threatPercentage = Number(
    prediction.threat_percentage || 0
  );

  const benignPercentage = Number(
    prediction.benign_percentage || 0
  );

  const severity = prediction.severity || "None";

  const mainThreat = prediction.main_threat || "None";

  const threatDistribution =
    prediction.threat_distribution || {};

  const attackDistribution =
    prediction.attack_distribution || {};

  const formatNumber = (value) =>
    Number(value || 0).toLocaleString();

  const formatTime = (seconds) => {
    const totalSeconds = Math.floor(
      Number(seconds || 0)
    );

    const hours = Math.floor(
      totalSeconds / 3600
    );

    const minutes = Math.floor(
      (totalSeconds % 3600) / 60
    );

    const secs = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    }

    if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    }

    return `${secs}s`;
  };

  return (
    <>
      {/* HEADER */}

      <div className="topbar">
        <div>
          <h1>🌐 Live Network Monitoring</h1>

          <p>
            Real-Time AI Powered Network Traffic
            Monitoring & Threat Detection
          </p>
        </div>

        <h3
          className={
            running
              ? "status-green"
              : "status-red"
          }
        >
          {running
            ? "🟢 Monitoring Active"
            : "🔴 Monitoring Stopped"}
        </h3>
      </div>

      {/* MONITORING CONTROLS */}

      <div className="section">
        <h2>🎛 Live Monitoring Control</h2>

        <table>
          <tbody>
            <tr>
              <th>Monitoring Status</th>

              <td
                className={
                  running
                    ? "status-green"
                    : "status-red"
                }
              >
                {running
                  ? "🟢 Active"
                  : "🔴 Stopped"}
              </td>
            </tr>

            <tr>
              <th>TShark Interface</th>

              <td>
                Wi-Fi — Interface{" "}
                {data.interface || "5"}
              </td>
            </tr>

            <tr>
              <th>Monitoring Time</th>

              <td>
                {formatTime(runningSeconds)}
              </td>
            </tr>
          </tbody>
        </table>

        <div
          style={{
            marginTop: "20px",
            display: "flex",
            gap: "12px",
          }}
        >
          {!running ? (
            <button onClick={startMonitoring}>
              ▶️ Start Live Monitoring
            </button>
          ) : (
            <button onClick={stopMonitoring}>
              ⏹ Stop Live Monitoring
            </button>
          )}

          <button onClick={loadLiveStatus}>
            🔄 Refresh
          </button>
        </div>

        {error && (
          <p className="status-red">
            {error}
          </p>
        )}
      </div>

      {/* LIVE KPI CARDS */}

      <div className="cards">
        <div className="card">
          <h2>
            {formatNumber(packetCount)}
          </h2>

          <p>Live Packets Captured</p>
        </div>

        <div className="card">
          <h2>
            {formatNumber(flowCount)}
          </h2>

          <p>AI Flows Analyzed</p>
        </div>

        <div className="card">
          <h2>
            {formatNumber(threatCount)}
          </h2>

          <p>Threats Detected</p>
        </div>

        <div className="card">
          <h2>
            {formatNumber(benignCount)}
          </h2>

          <p>Benign Flows</p>
        </div>

        <div className="card">
          <h2>
            {confidence.toFixed(2)}%
          </h2>

          <p>AI Confidence</p>
        </div>
      </div>

      {/* AI ANALYSIS SUMMARY */}

      <div className="section">
        <h2>🤖 Live AI Analysis</h2>

        <table>
          <tbody>
            <tr>
              <th>Total Flows Analyzed</th>

              <td>
                {formatNumber(totalFlows)}
              </td>
            </tr>

            <tr>
              <th>Benign Flows</th>

              <td className="status-green">
                {formatNumber(benignCount)}
              </td>
            </tr>

            <tr>
              <th>Threat Flows</th>

              <td
                className={
                  threatCount > 0
                    ? "status-red"
                    : "status-green"
                }
              >
                {formatNumber(threatCount)}
              </td>
            </tr>

            <tr>
              <th>Benign Traffic Rate</th>

              <td>
                {benignPercentage.toFixed(2)}%
              </td>
            </tr>

            <tr>
              <th>Threat Detection Rate</th>

              <td>
                {threatPercentage.toFixed(2)}%
              </td>
            </tr>

            <tr>
              <th>Average AI Confidence</th>

              <td>
                {confidence.toFixed(2)}%
              </td>
            </tr>

            <tr>
              <th>Primary Threat</th>

              <td>
                {mainThreat}
              </td>
            </tr>

            <tr>
              <th>Current Severity</th>

              <td
                className={
                  threatCount > 0
                    ? "status-red"
                    : "status-green"
                }
              >
                {threatCount > 0
                  ? `🚨 ${severity}`
                  : "🟢 Secure"}
              </td>
            </tr>

            <tr>
              <th>AI Engine</th>

              <td className="status-green">
                Random Forest — Active
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* TRAFFIC OVERVIEW */}

      <div className="section">
        <h2>📡 Live Traffic Overview</h2>

        <table>
          <thead>
            <tr>
              <th>Traffic Type</th>
              <th>Flows</th>
              <th>Percentage</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            <tr>
              <td>🟢 Benign Traffic</td>

              <td>
                {formatNumber(benignCount)}
              </td>

              <td>
                {benignPercentage.toFixed(2)}%
              </td>

              <td className="status-green">
                Normal
              </td>
            </tr>

            <tr>
              <td>🔴 Threat Traffic</td>

              <td>
                {formatNumber(threatCount)}
              </td>

              <td>
                {threatPercentage.toFixed(2)}%
              </td>

              <td
                className={
                  threatCount > 0
                    ? "status-red"
                    : "status-green"
                }
              >
                {threatCount > 0
                  ? "Threat Detected"
                  : "Secure"}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* THREAT DISTRIBUTION */}

      <div className="section">
        <h2>🚨 Live Threat Distribution</h2>

        <table>
          <thead>
            <tr>
              <th>Attack Type</th>
              <th>Detected Flows</th>
              <th>Risk Level</th>
            </tr>
          </thead>

          <tbody>
            {Object.keys(threatDistribution).length > 0 ? (
              Object.entries(threatDistribution).map(
                ([attack, count]) => {
                  const numericCount =
                    Number(count || 0);

                  let risk = "🟢 Low";

                  if (numericCount >= 100) {
                    risk = "🔴 Critical";
                  } else if (numericCount >= 50) {
                    risk = "🟠 High";
                  } else if (numericCount >= 10) {
                    risk = "🟡 Medium";
                  }

                  return (
                    <tr key={attack}>
                      <td>{attack}</td>

                      <td>
                        {formatNumber(
                          numericCount
                        )}
                      </td>

                      <td
                        className={
                          numericCount >= 50
                            ? "status-red"
                            : ""
                        }
                      >
                        {risk}
                      </td>
                    </tr>
                  );
                }
              )
            ) : (
              <tr>
                <td colSpan="3">
                  🟢 No threats detected in the
                  latest AI analysis.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* LATEST AI CLASSIFICATION */}

      <div className="section">
        <h2>🔍 Latest AI Classification</h2>

        <table>
          <thead>
            <tr>
              <th>Classification</th>
              <th>Flows</th>
            </tr>
          </thead>

          <tbody>
            {Object.keys(attackDistribution).length > 0 ? (
              Object.entries(attackDistribution).map(
                ([label, count]) => (
                  <tr key={label}>
                    <td>{label}</td>

                    <td>
                      {formatNumber(
                        Number(count || 0)
                      )}
                    </td>
                  </tr>
                )
              )
            ) : (
              <tr>
                <td colSpan="2">
                  No AI classification available yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* SECURITY SUMMARY */}

      <div className="section">
        <h2>🛡 Live Network Security Summary</h2>

        <table>
          <tbody>
            <tr>
              <th>Network Monitor</th>

              <td
                className={
                  running
                    ? "status-green"
                    : "status-red"
                }
              >
                {running
                  ? "🟢 Active"
                  : "🔴 Stopped"}
              </td>
            </tr>

            <tr>
              <th>TShark Capture</th>

              <td className="status-green">
                Interface {data.interface || "5"}
              </td>
            </tr>

            <tr>
              <th>Packets Captured</th>

              <td>
                {formatNumber(packetCount)}
              </td>
            </tr>

            <tr>
              <th>Flows Analyzed</th>

              <td>
                {formatNumber(flowCount)}
              </td>
            </tr>

            <tr>
              <th>Threats Detected</th>

              <td
                className={
                  threatCount > 0
                    ? "status-red"
                    : "status-green"
                }
              >
                {formatNumber(threatCount)}
              </td>
            </tr>

            <tr>
              <th>AI Confidence</th>

              <td>
                {confidence.toFixed(2)}%
              </td>
            </tr>

            <tr>
              <th>Security Status</th>

              <td
                className={
                  threatCount > 0
                    ? "status-red"
                    : "status-green"
                }
              >
                {threatCount > 0
                  ? "🚨 Threat Detected"
                  : "🟢 Network Secure"}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </>
  );
}

export default LiveNetworkPage;