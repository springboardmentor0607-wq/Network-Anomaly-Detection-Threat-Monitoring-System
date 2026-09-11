import React, { useEffect, useState } from "react";
import "./PCAPAnalytics.css";

const API_BASE_URL = "https://network-anomaly-detection-threat-5ihm.onrender.com";

const PCAPAnalytics = () => {
  const [file, setFile] = useState(null);
  const [analyses, setAnalyses] = useState([]);
  const [selectedAnalysis, setSelectedAnalysis] = useState(null);
  const [aiPrediction, setAiPrediction] = useState(null);

  const [loading, setLoading] = useState(false);
  const [loadingAnalyses, setLoadingAnalyses] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchAnalyses();
  }, []);

  const fetchAnalyses = async () => {
    try {
      setLoadingAnalyses(true);

      const response = await fetch(
        `${API_BASE_URL}/pcap/analyses`
      );

      if (!response.ok) {
        throw new Error("Failed to load PCAP analyses.");
      }

      const data = await response.json();

      setAnalyses(data.analyses || []);
    } catch (err) {
      console.error("PCAP analyses error:", err);
    } finally {
      setLoadingAnalyses(false);
    }
  };

  const handleFileChange = (event) => {
    const selectedFile = event.target.files?.[0];

    setError("");
    setSuccess("");
    setAiPrediction(null);
    setSelectedAnalysis(null);

    if (!selectedFile) {
      setFile(null);
      return;
    }

    const fileName = selectedFile.name.toLowerCase();

    if (
      !fileName.endsWith(".pcap") &&
      !fileName.endsWith(".pcapng")
    ) {
      setError(
        "Invalid file type. Please select a .pcap or .pcapng file."
      );
      setFile(null);
      return;
    }

    setFile(selectedFile);
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a PCAP file first.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");
    setAiPrediction(null);
    setSelectedAnalysis(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(
        `${API_BASE_URL}/pcap/analyze`,
        {
          method: "POST",
          body: formData
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "PCAP analysis failed."
        );
      }

      setSuccess(
        "PCAP analysis and AI prediction completed successfully."
      );

      setAiPrediction(data.ai_prediction || null);
      setSelectedAnalysis(data.analysis || null);

      await fetchAnalyses();
    } catch (err) {
      console.error("PCAP upload error:", err);

      setError(
        err.message || "Unable to analyze PCAP file."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAnalysis = (analysis) => {
    setSelectedAnalysis(analysis);
    setAiPrediction(
      analysis.ai_prediction || null
    );
  };

  const formatNumber = (value) => {
    if (
      value === null ||
      value === undefined ||
      value === ""
    ) {
      return "0";
    }

    return Number(value).toLocaleString();
  };

  const formatPercentage = (value) => {
    if (
      value === null ||
      value === undefined ||
      value === ""
    ) {
      return "0.00%";
    }

    return `${Number(value).toFixed(2)}%`;
  };

  const formatConfidence = (value) => {
    if (
      value === null ||
      value === undefined ||
      value === ""
    ) {
      return "0.00%";
    }

    return `${Number(value).toFixed(2)}%`;
  };

  const getSeverityClass = (severity) => {
    if (!severity) {
      return "severity-none";
    }

    return `severity-${String(
      severity
    ).toLowerCase()}`;
  };

  const getThreatStatus = () => {
    if (!aiPrediction) {
      return {
        text: "No AI prediction available",
        className: "status-none"
      };
    }

    if (aiPrediction.total_threats > 0) {
      return {
        text: "Threats detected",
        className: "status-threat"
      };
    }

    return {
      text: "Traffic appears benign",
      className: "status-safe"
    };
  };

  const threatStatus = getThreatStatus();

  return (
    <div className="pcap-analytics-page">

      {/* PAGE HEADER */}

      <div className="page-header">
        <div>
          <h1>📦 PCAP Analytics</h1>

          <p>
            Analyze captured network traffic and detect
            threats using the NetShield AI engine.
          </p>
        </div>
      </div>

      {/* UPLOAD PCAP */}

      <div className="pcap-upload-card">

        <div className="section-title">
          <h2>📂 Upload PCAP File</h2>

          <p>
            Supported formats: .pcap and .pcapng
          </p>
        </div>

        <div className="upload-area">

          <input
            id="pcap-file"
            type="file"
            accept=".pcap,.pcapng"
            onChange={handleFileChange}
            disabled={loading}
          />

          {file && (
            <div className="selected-file">
              <strong>Selected file:</strong>{" "}
              {file.name}

              <span>
                {" "}
                (
                {(file.size / (1024 * 1024)).toFixed(2)}
                {" MB)"}
              </span>
            </div>
          )}

          <button
            type="button"
            onClick={handleUpload}
            disabled={!file || loading}
            className="upload-btn"
          >
            {loading
              ? "Analyzing PCAP..."
              : "🔍 Analyze PCAP"}
          </button>

        </div>

        {error && (
          <div className="pcap-message error-message">
            {error}
          </div>
        )}

        {success && (
          <div className="pcap-message success-message">
            {success}
          </div>
        )}

      </div>

      {/* AI RESULTS */}

      {aiPrediction && (
        <div className="ai-results-section">

          <div className="section-title">
            <h2>🤖 AI Threat Detection Results</h2>

            <p>
              Results generated by the NetShield AI
              prediction engine.
            </p>
          </div>

          <div
            className={`threat-status ${threatStatus.className}`}
          >
            {threatStatus.text}
          </div>

          {/* AI METRICS */}

          <div className="metrics-grid">

            <div className="metric-card">
              <span className="metric-label">
                Total Flows
              </span>

              <strong className="metric-value">
                {formatNumber(
                  aiPrediction.total_flows
                )}
              </strong>
            </div>

            <div className="metric-card">
              <span className="metric-label">
                Threats
              </span>

              <strong className="metric-value threat-value">
                {formatNumber(
                  aiPrediction.total_threats
                )}
              </strong>
            </div>

            <div className="metric-card">
              <span className="metric-label">
                Benign Flows
              </span>

              <strong className="metric-value">
                {formatNumber(
                  aiPrediction.total_benign
                )}
              </strong>
            </div>

            <div className="metric-card">
              <span className="metric-label">
                Threat Percentage
              </span>

              <strong className="metric-value">
                {formatPercentage(
                  aiPrediction.threat_percentage
                )}
              </strong>
            </div>

            <div className="metric-card">
              <span className="metric-label">
                AI Confidence
              </span>

              <strong className="metric-value">
                {formatConfidence(
                  aiPrediction.average_confidence
                )}
              </strong>
            </div>

            <div className="metric-card">
              <span className="metric-label">
                Severity
              </span>

              <strong
                className={`metric-value ${getSeverityClass(
                  aiPrediction.severity
                )}`}
              >
                {aiPrediction.severity || "None"}
              </strong>
            </div>

          </div>

          {/* AI DETAILS */}

          <div className="ai-details-grid">

            <div className="detail-card">
              <h3>Primary Threat</h3>

              <p>
                {aiPrediction.main_threat ||
                  "No threat detected"}
              </p>

              {aiPrediction.main_threat_count > 0 && (
                <span>
                  {formatNumber(
                    aiPrediction.main_threat_count
                  )}{" "}
                  flow(s)
                </span>
              )}
            </div>

            <div className="detail-card">
              <h3>Detection Status</h3>

              <p>
                {aiPrediction.total_threats > 0
                  ? "Suspicious traffic detected"
                  : "No suspicious traffic detected"}
              </p>
            </div>

            <div className="detail-card">
              <h3>Security Alert</h3>

              <p>
                {aiPrediction.alert_created
                  ? "Alert created successfully"
                  : "No alert created"}
              </p>

              {aiPrediction.alert_id && (
                <span>
                  Alert ID:{" "}
                  {aiPrediction.alert_id}
                </span>
              )}
            </div>

          </div>

          {/* ATTACK DISTRIBUTION */}

          <div className="distribution-card">

            <div className="section-title">
              <h2>📊 Attack Distribution</h2>

              <p>
                AI classification results for the
                analyzed flows.
              </p>
            </div>

            {aiPrediction.attack_distribution &&
            Object.keys(
              aiPrediction.attack_distribution
            ).length > 0 ? (

              <div className="distribution-list">

                {Object.entries(
                  aiPrediction.attack_distribution
                ).map(
                  ([label, count]) => {

                    const percentage =
                      aiPrediction.total_flows > 0
                        ? (Number(count) /
                            aiPrediction.total_flows) *
                          100
                        : 0;

                    return (
                      <div
                        className="distribution-row"
                        key={label}
                      >

                        <div className="distribution-info">
                          <strong>
                            {label}
                          </strong>

                          <span>
                            {formatNumber(count)}
                            {" flow(s) — "}
                            {percentage.toFixed(2)}
                            %
                          </span>
                        </div>

                        <div className="distribution-bar">
                          <div
                            className="distribution-fill"
                            style={{
                              width: `${percentage}%`
                            }}
                          />
                        </div>

                      </div>
                    );
                  }
                )}

              </div>

            ) : (
              <p>
                No classification data available.
              </p>
            )}

          </div>

        </div>
      )}

      {/* PCAP TRAFFIC ANALYSIS */}

      {selectedAnalysis && (
        <div className="analysis-details-card">

          <div className="section-title">
            <h2>📡 PCAP Traffic Analysis</h2>

            <p>
              Packet-level and protocol analytics from
              the selected network capture.
            </p>
          </div>

          <div className="metrics-grid">

            <div className="metric-card">
              <span className="metric-label">
                Packets
              </span>

              <strong className="metric-value">
                {formatNumber(
                  selectedAnalysis.total_packets
                )}
              </strong>
            </div>

            <div className="metric-card">
              <span className="metric-label">
                Total Bytes
              </span>

              <strong className="metric-value">
                {formatNumber(
                  selectedAnalysis.total_bytes
                )}
              </strong>
            </div>

            <div className="metric-card">
              <span className="metric-label">
                IP Packets
              </span>

              <strong className="metric-value">
                {formatNumber(
                  selectedAnalysis.ip_packets
                )}
              </strong>
            </div>

            <div className="metric-card">
              <span className="metric-label">
                TCP Packets
              </span>

              <strong className="metric-value">
                {formatNumber(
                  selectedAnalysis.tcp_packets
                )}
              </strong>
            </div>

            <div className="metric-card">
              <span className="metric-label">
                UDP Packets
              </span>

              <strong className="metric-value">
                {formatNumber(
                  selectedAnalysis.udp_packets
                )}
              </strong>
            </div>

            <div className="metric-card">
              <span className="metric-label">
                ICMP Packets
              </span>

              <strong className="metric-value">
                {formatNumber(
                  selectedAnalysis.icmp_packets
                )}
              </strong>
            </div>

          </div>

          {/* PROTOCOL ANALYSIS */}

          {selectedAnalysis.protocol_distribution && (
            <div className="protocol-section">

              <h3>🔌 Protocol Distribution</h3>

              <div className="protocol-list">

                {Object.entries(
                  selectedAnalysis.protocol_distribution
                ).map(
                  ([protocol, count]) => (
                    <div
                      className="protocol-row"
                      key={protocol}
                    >
                      <span>
                        {protocol}
                      </span>

                      <strong>
                        {formatNumber(count)}
                      </strong>
                    </div>
                  )
                )}

              </div>

            </div>
          )}

        </div>
      )}

      {/* PREVIOUS ANALYSES */}

      <div className="previous-analyses-card">

        <div className="section-title">
          <h2>🗃 Previous PCAP Analyses</h2>

          <p>
            Recently analyzed network captures.
          </p>
        </div>

        {loadingAnalyses ? (

          <p>Loading analyses...</p>

        ) : analyses.length === 0 ? (

          <p>No PCAP analyses found.</p>

        ) : (

          <div className="analysis-table-wrapper">

            <table className="analysis-table">

              <thead>
                <tr>
                  <th>File</th>
                  <th>Packets</th>
                  <th>Bytes</th>
                  <th>TCP</th>
                  <th>UDP</th>
                  <th>Threats</th>
                  <th>Severity</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>

                {analyses.map(
                  (analysis) => {

                    const historyAI =
                      analysis.ai_prediction || {};

                    return (
                      <tr
                        key={
                          analysis._id ||
                          analysis.id
                        }
                      >

                        <td>
                          {analysis.file_name ||
                            "Unknown"}
                        </td>

                        <td>
                          {formatNumber(
                            analysis.total_packets
                          )}
                        </td>

                        <td>
                          {formatNumber(
                            analysis.total_bytes
                          )}
                        </td>

                        <td>
                          {formatNumber(
                            analysis.tcp_packets
                          )}
                        </td>

                        <td>
                          {formatNumber(
                            analysis.udp_packets
                          )}
                        </td>

                        <td>
                          {formatNumber(
                            historyAI.total_threats
                          )}
                        </td>

                        <td>
                          <strong
                            className={getSeverityClass(
                              historyAI.severity
                            )}
                          >
                            {historyAI.severity ||
                              "None"}
                          </strong>
                        </td>

                        <td>
                          <button
                            type="button"
                            className="view-btn"
                            onClick={() =>
                              handleSelectAnalysis(
                                analysis
                              )
                            }
                          >
                            View
                          </button>
                        </td>

                      </tr>
                    );
                  }
                )}

              </tbody>

            </table>

          </div>
        )}

      </div>

    </div>
  );
};

export default PCAPAnalytics;