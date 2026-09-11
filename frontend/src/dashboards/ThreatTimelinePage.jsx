import { useEffect, useState } from "react";
import axios from "axios";
import "./SecurityDashboard.css";

const API_BASE_URL = "https://network-anomaly-detection-threat-5ihm.onrender.com";

function ThreatTimelinePage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadTimeline = async () => {
    try {
      setLoading(true);

      const response = await axios.get(
        `${API_BASE_URL}/dashboard/analytics`
      );

      setData(response.data);
      setError("");
    } catch (err) {
      console.error("Threat Timeline Error:", err);
      setError("Unable to load threat timeline.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTimeline();

    const interval = setInterval(() => {
      loadTimeline();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  // ==========================================
  // HELPERS
  // ==========================================

  const formatNumber = (value) => {
    return Number(value || 0).toLocaleString();
  };

  const formatPercentage = (value) => {
    return Number(value || 0).toFixed(2);
  };

  const getSeverity = (attack) => {
    const name = String(attack || "").toLowerCase();

    if (
      name === "benign" ||
      name === "normal"
    ) {
      return "Normal";
    }

    if (
      name.includes("ddos") ||
      name.includes("dos") ||
      name.includes("bot") ||
      name.includes("infiltration") ||
      name.includes("ransomware")
    ) {
      return "Critical";
    }

    if (
      name.includes("sql") ||
      name.includes("brute") ||
      name.includes("malware") ||
      name.includes("web") ||
      name.includes("portscan") ||
      name.includes("scan")
    ) {
      return "High";
    }

    return "Medium";
  };

  const getStatus = (attack) => {
    const normalized = String(attack || "").toUpperCase();

    if (
      normalized === "BENIGN" ||
      normalized === "NORMAL"
    ) {
      return "Normal";
    }

    return "Detected";
  };

  const getStatusClass = (severity) => {
    if (severity === "Normal") {
      return "status-green";
    }

    if (
      severity === "Critical" ||
      severity === "High"
    ) {
      return "status-red";
    }

    return "status-yellow";
  };

  const getDatasetName = (dataset) => {
    const normalized = String(dataset || "").toUpperCase();

    if (normalized === "CIC") {
      return "CICIDS2017";
    }

    if (normalized === "UNSW") {
      return "UNSW-NB15";
    }

    return dataset || "Unknown";
  };

  // ==========================================
  // LOADING
  // ==========================================

  if (loading && !data) {
    return (
      <div className="section">
        <h2>Loading Threat Timeline...</h2>
        <p>
          Fetching the latest AI security analytics.
        </p>
      </div>
    );
  }

  // ==========================================
  // ERROR
  // ==========================================

  if (error && !data) {
    return (
      <div className="section">
        <h2>⚠️ Threat Timeline Error</h2>

        <p>{error}</p>

        <br />

        <button onClick={loadTimeline}>
          Retry
        </button>
      </div>
    );
  }

  // ==========================================
  // REAL ANALYTICS DATA
  // ==========================================

  const totalAnalyses = Number(
    data?.total_predictions || 0
  );

  const totalRecords = Number(
    data?.total_records || 0
  );

  const totalThreats = Number(
    data?.total_threats || 0
  );

  const benignRecords = Number(
    data?.benign_records || 0
  );

  const confidence = Number(
    data?.average_confidence || 0
  );

  const attackDistribution =
    data?.attack_distribution || {};

  const datasetDistribution =
    data?.dataset_distribution || {};

  // ==========================================
  // THREAT ENTRIES
  // ==========================================

  const threatEntries = Object.entries(
    attackDistribution
  ).filter(([attack]) => {
    const normalized = String(attack).toUpperCase();

    return (
      normalized !== "BENIGN" &&
      normalized !== "NORMAL"
    );
  });

  const threatCategories = threatEntries.length;

  // ==========================================
  // MOST FREQUENT ATTACK
  // ==========================================

  let mostFrequentAttack = "N/A";
  let highestCount = 0;

  threatEntries.forEach(([attack, count]) => {
    const numericCount = Number(count || 0);

    if (numericCount > highestCount) {
      highestCount = numericCount;
      mostFrequentAttack = attack;
    }
  });

  // ==========================================
  // DATASET ACTIVITY
  // ==========================================

  const datasetEntries = Object.entries(
    datasetDistribution
  );

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <>
      {/* ==========================================
          HEADER
      ========================================== */}

      <div className="topbar">
        <div>
          <h1>📈 Threat Timeline</h1>

          <p>
            Security activity summary based on the
            latest AI prediction and network analytics
            data.
          </p>
        </div>

        <h3>
          🟢 Analytics Monitoring
        </h3>
      </div>

      {/* ==========================================
          KPI CARDS
      ========================================== */}

      <div className="cards">

        <div className="card">
          <h2>
            {formatNumber(totalAnalyses)}
          </h2>

          <p>
            AI Analyses
          </p>
        </div>

        <div className="card">
          <h2>
            {formatNumber(totalThreats)}
          </h2>

          <p>
            Threat Records
          </p>
        </div>

        <div className="card">
          <h2>
            {formatPercentage(confidence)}%
          </h2>

          <p>
            AI Confidence
          </p>
        </div>

        <div className="card">
          <h2>
            {threatCategories}
          </h2>

          <p>
            Threat Categories
          </p>
        </div>

      </div>

      {/* ==========================================
          TIMELINE SUMMARY
      ========================================== */}

      <div className="section">

        <h2>
          📊 Timeline Summary
        </h2>

        <table>
          <tbody>

            <tr>
              <th>
                Total AI Analyses
              </th>

              <td>
                {formatNumber(totalAnalyses)}
              </td>
            </tr>

            <tr>
              <th>
                Total Records Processed
              </th>

              <td>
                {formatNumber(totalRecords)}
              </td>
            </tr>

            <tr>
              <th>
                Normal Records
              </th>

              <td>
                {formatNumber(benignRecords)}
              </td>
            </tr>

            <tr>
              <th>
                Threat Records
              </th>

              <td>
                {formatNumber(totalThreats)}
              </td>
            </tr>

            <tr>
              <th>
                Average AI Confidence
              </th>

              <td>
                {formatPercentage(confidence)}%
              </td>
            </tr>

            <tr>
              <th>
                Threat Categories
              </th>

              <td>
                {threatCategories}
              </td>
            </tr>

            <tr>
              <th>
                Most Frequent Threat
              </th>

              <td>
                {mostFrequentAttack}
              </td>
            </tr>

          </tbody>
        </table>

      </div>

      {/* ==========================================
          NETWORK THREAT TIMELINE
      ========================================== */}

      <div className="section">

        <h2>
          🕒 Network Threat Activity
        </h2>

        <p>
          Showing the latest aggregated threat
          activity returned by the AI analytics API.
          The current backend does not provide
          individual event timestamps, so timestamps
          are not artificially generated.
        </p>

        <br />

        {threatEntries.length === 0 ? (

          <p>
            🟢 No threat activity available.
          </p>

        ) : (

          <table>

            <thead>
              <tr>
                <th>
                  Attack Type
                </th>

                <th>
                  Detected Records
                </th>

                <th>
                  AI Confidence
                </th>

                <th>
                  Severity
                </th>

                <th>
                  Status
                </th>
              </tr>
            </thead>

            <tbody>

              {threatEntries.map(
                ([attack, count]) => {

                  const numericCount =
                    Number(count || 0);

                  const severity =
                    getSeverity(attack);

                  return (
                    <tr key={attack}>

                      <td>
                        {attack}
                      </td>

                      <td>
                        {formatNumber(
                          numericCount
                        )}
                      </td>

                      <td>
                        {formatPercentage(
                          confidence
                        )}
                        %
                      </td>

                      <td
                        className={getStatusClass(
                          severity
                        )}
                      >
                        {severity}
                      </td>

                      <td
                        className={
                          getStatus(attack) ===
                          "Normal"
                            ? "status-green"
                            : "status-red"
                        }
                      >
                        {getStatus(attack)}
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
          ATTACK DISTRIBUTION
      ========================================== */}

      <div className="section">

        <h2>
          📉 Attack Distribution
        </h2>

        {threatEntries.length === 0 ? (

          <p>
            🟢 No threats detected.
          </p>

        ) : (

          <table>

            <thead>
              <tr>
                <th>
                  Attack Type
                </th>

                <th>
                  Detected Records
                </th>

                <th>
                  Threat Share
                </th>

                <th>
                  Severity
                </th>
              </tr>
            </thead>

            <tbody>

              {threatEntries.map(
                ([attack, count]) => {

                  const numericCount =
                    Number(count || 0);

                  const percentage =
                    totalThreats > 0
                      ? (numericCount /
                          totalThreats) *
                        100
                      : 0;

                  const severity =
                    getSeverity(attack);

                  return (
                    <tr key={attack}>

                      <td>
                        {attack}
                      </td>

                      <td>
                        {formatNumber(
                          numericCount
                        )}
                      </td>

                      <td>
                        {formatPercentage(
                          percentage
                        )}
                        %
                      </td>

                      <td
                        className={getStatusClass(
                          severity
                        )}
                      >
                        {severity}
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
          DATASET ACTIVITY
      ========================================== */}

      <div className="section">

        <h2>
          🗂 Dataset Activity
        </h2>

        {datasetEntries.length === 0 ? (

          <p>
            No dataset activity available.
          </p>

        ) : (

          <table>

            <thead>
              <tr>
                <th>
                  Dataset
                </th>

                <th>
                  AI Analyses
                </th>
              </tr>
            </thead>

            <tbody>

              {datasetEntries.map(
                ([dataset, count]) => (

                  <tr key={dataset}>

                    <td>
                      {getDatasetName(dataset)}
                    </td>

                    <td>
                      {formatNumber(count)}
                    </td>

                  </tr>

                )
              )}

            </tbody>

          </table>
        )}

      </div>

      {/* ==========================================
          AI INSIGHTS
      ========================================== */}

      <div className="section">

        <h2>
          🤖 AI Timeline Insights
        </h2>

        <table>

          <tbody>

            <tr>
              <th>
                Most Frequent Threat
              </th>

              <td>
                {mostFrequentAttack}
              </td>
            </tr>

            <tr>
              <th>
                Highest Detected Count
              </th>

              <td>
                {formatNumber(highestCount)}
              </td>
            </tr>

            <tr>
              <th>
                Total Threat Categories
              </th>

              <td>
                {threatCategories}
              </td>
            </tr>

            <tr>
              <th>
                Total Normal Records
              </th>

              <td>
                {formatNumber(benignRecords)}
              </td>
            </tr>

            <tr>
              <th>
                AI Model
              </th>

              <td>
                Random Forest
              </td>
            </tr>

            <tr>
              <th>
                Analytics Refresh
              </th>

              <td className="status-green">
                🟢 Every 10 seconds
              </td>
            </tr>

          </tbody>

        </table>

      </div>

      {/* ==========================================
          SECURITY ASSESSMENT
      ========================================== */}

      <div className="section">

        <h2>
          🛡 Security Assessment
        </h2>

        {totalThreats === 0 ? (

          <div
            style={{
              borderLeft: "4px solid #16a34a",
              padding: "15px 20px",
              background: "#f0fdf4",
              borderRadius: "8px",
            }}
          >

            <h3>
              🟢 Network Appears Normal
            </h3>

            <p>
              The AI analytics data currently contains
              no detected threat records.
            </p>

          </div>

        ) : (

          <div
            style={{
              borderLeft: "4px solid #dc2626",
              padding: "15px 20px",
              background: "#fef2f2",
              borderRadius: "8px",
            }}
          >

            <h3>
              🚨 Threat Activity Detected
            </h3>

            <p>
              The AI engine detected{" "}
              <strong>
                {formatNumber(totalThreats)}
              </strong>{" "}
              threat records across{" "}
              <strong>
                {threatCategories}
              </strong>{" "}
              threat categories.
            </p>

            <p>
              Most frequent threat:{" "}
              <strong>
                {mostFrequentAttack}
              </strong>
            </p>

          </div>
        )}

      </div>

      {/* ==========================================
          MONITORING STATUS
      ========================================== */}

      <div className="section">

        <h2>
          🛡 Monitoring Status
        </h2>

        <table>

          <tbody>

            <tr>
              <th>
                AI Engine
              </th>

              <td className="status-green">
                Random Forest — Active
              </td>
            </tr>

            <tr>
              <th>
                Analytics API
              </th>

              <td className="status-green">
                🟢 Connected
              </td>
            </tr>

            <tr>
              <th>
                Analytics Refresh
              </th>

              <td className="status-green">
                🟢 Every 10 seconds
              </td>
            </tr>

            <tr>
              <th>
                Threat Analysis
              </th>

              <td className="status-green">
                🟢 Available
              </td>
            </tr>

          </tbody>

        </table>

      </div>

      {/* ==========================================
          REFRESH
      ========================================== */}

      <div className="section">

        <button
          onClick={loadTimeline}
          disabled={loading}
        >
          {loading
            ? "Refreshing..."
            : "🔄 Refresh Timeline"}
        </button>

      </div>
    </>
  );
}

export default ThreatTimelinePage;