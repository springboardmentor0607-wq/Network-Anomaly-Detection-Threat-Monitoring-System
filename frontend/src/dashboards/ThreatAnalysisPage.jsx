import { useEffect, useState } from "react";
import axios from "axios";
import "./SecurityDashboard.css";

const API_BASE_URL = "https://network-anomaly-detection-threat-5ihm.onrender.com";

function ThreatAnalysisPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ==================================================
  // LOAD THREAT ANALYSIS
  // ==================================================

  const loadThreatAnalysis = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await axios.get(
        `${API_BASE_URL}/dashboard/analytics`
      );

      setData(response.data);
    } catch (err) {
      console.error("Threat Analysis Error:", err);

      setError("Unable to load threat analysis.");
    } finally {
      setLoading(false);
    }
  };

  // ==================================================
  // INITIAL LOAD
  // ==================================================

  useEffect(() => {
    loadThreatAnalysis();
  }, []);

  // ==================================================
  // LOADING
  // ==================================================

  if (loading) {
    return (
      <div className="section">
        <h2>🚨 Loading Threat Analysis...</h2>

        <p>
          Connecting to NetShield AI backend.
        </p>
      </div>
    );
  }

  // ==================================================
  // ERROR
  // ==================================================

  if (error) {
    return (
      <div className="section">
        <h2>❌ Threat Analysis Error</h2>

        <p>{error}</p>

        <br />

        <button onClick={loadThreatAnalysis}>
          🔄 Retry
        </button>
      </div>
    );
  }

  // ==================================================
  // SAFE DEFAULTS
  // ==================================================

  const totalPredictions = Number(
    data?.total_predictions || 0
  );

  const totalRecords = Number(
    data?.total_records || 0
  );

  const threatPackets = Number(
    data?.total_threats || 0
  );

  const normalPackets = Number(
    data?.benign_records || 0
  );

  const averageConfidence = Number(
    data?.average_confidence || 0
  );

  const attackDistribution =
    data?.attack_distribution || {};

  const datasetDistribution =
    data?.dataset_distribution || {};

  // ==================================================
  // THREAT CATEGORIES
  // ==================================================

  const threatCategories = Object.keys(
    attackDistribution
  ).filter(
    (attack) =>
      attack.toUpperCase() !== "BENIGN" &&
      attack.toUpperCase() !== "NORMAL"
  ).length;

  // ==================================================
  // TOTAL TRAFFIC
  // ==================================================

  const totalTraffic =
    normalPackets + threatPackets;

  // ==================================================
  // THREAT PERCENTAGE
  // ==================================================

  const threatPercentage =
    totalTraffic > 0
      ? (
          (threatPackets / totalTraffic) *
          100
        ).toFixed(2)
      : "0.00";

  // ==================================================
  // NORMAL PERCENTAGE
  // ==================================================

  const normalPercentage =
    totalTraffic > 0
      ? (
          (normalPackets / totalTraffic) *
          100
        ).toFixed(2)
      : "0.00";

  // ==================================================
  // THREAT DISTRIBUTION
  // ==================================================

  const threatDistribution =
    Object.entries(attackDistribution)
      .filter(
        ([attack]) => {
          const label = String(attack).toUpperCase();

          return (
            label !== "BENIGN" &&
            label !== "NORMAL"
          );
        }
      )
      .map(([attack, count]) => {
        const detected = Number(count || 0);

        let risk = "Medium";

        if (detected >= 100) {
          risk = "High";
        } else if (detected <= 10) {
          risk = "Low";
        }

        return {
          attack,
          detected,
          risk,
        };
      })
      .sort(
        (a, b) =>
          b.detected - a.detected
      );

  // ==================================================
  // DATASET DISTRIBUTION
  // ==================================================

  const datasets = Object.entries(
    datasetDistribution
  );

  // ==================================================
  // MOST FREQUENT ATTACK
  // ==================================================

  const mostFrequentAttack =
    data?.most_frequent_attack || "None";

  // ==================================================
  // SECURITY STATUS
  // ==================================================

  const networkStatus =
    threatPackets > 0
      ? "⚠ Threats Detected"
      : "🟢 Normal";

  // ==================================================
  // PAGE
  // ==================================================

  return (
    <>
      {/* HEADER */}

      <div className="topbar">
        <div>
          <h1>🚨 Threat Analysis</h1>

          <p>
            AI-powered network threat detection,
            classification and analysis.
          </p>
        </div>

        <div>
          <h3>🛡 Security Analyst</h3>
        </div>
      </div>

      {/* KPI CARDS */}

      <div className="cards">
        <div className="card">
          <h2>{totalPredictions}</h2>
          <p>Total AI Analyses</p>
        </div>

        <div className="card">
          <h2>
            {totalRecords.toLocaleString()}
          </h2>
          <p>Packets Analyzed</p>
        </div>

        <div className="card">
          <h2>
            {threatPackets.toLocaleString()}
          </h2>
          <p>Threat Packets</p>
        </div>

        <div className="card">
          <h2>{threatCategories}</h2>
          <p>Threat Categories</p>
        </div>

        <div className="card">
          <h2>
            {averageConfidence.toFixed(2)}%
          </h2>
          <p>AI Confidence</p>
        </div>

        <div className="card">
          <h2>{threatPercentage}%</h2>
          <p>Threat Rate</p>
        </div>
      </div>

      {/* NETWORK THREAT SUMMARY */}

      <div className="section">
        <h2>📊 Network Threat Summary</h2>

        <table>
          <thead>
            <tr>
              <th>Traffic Type</th>
              <th>Packets</th>
              <th>Percentage</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            <tr>
              <td>🟢 Normal Traffic</td>

              <td>
                {normalPackets.toLocaleString()}
              </td>

              <td>
                {normalPercentage}%
              </td>

              <td className="status-green">
                Normal
              </td>
            </tr>

            <tr>
              <td>🔴 Threat Traffic</td>

              <td>
                {threatPackets.toLocaleString()}
              </td>

              <td>
                {threatPercentage}%
              </td>

              <td
                className={
                  threatPackets > 0
                    ? "status-red"
                    : "status-green"
                }
              >
                {threatPackets > 0
                  ? "Threat Detected"
                  : "No Threats"}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* AI MODEL SUMMARY */}

      <div className="section">
        <h2>🤖 AI Threat Detection Engine</h2>

        <table>
          <tbody>
            <tr>
              <th>AI Model</th>
              <td>Random Forest</td>
            </tr>

            <tr>
              <th>Detection Engine</th>

              <td className="status-green">
                🟢 Active
              </td>
            </tr>

            <tr>
              <th>Average Confidence</th>

              <td>
                {averageConfidence.toFixed(2)}%
              </td>
            </tr>

            <tr>
              <th>Total AI Analyses</th>

              <td>
                {totalPredictions}
              </td>
            </tr>

            <tr>
              <th>Packets Analyzed</th>

              <td>
                {totalRecords.toLocaleString()}
              </td>
            </tr>

            <tr>
              <th>Threat Categories</th>

              <td>
                {threatCategories}
              </td>
            </tr>

            <tr>
              <th>Most Frequent Attack</th>

              <td>
                {mostFrequentAttack}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* THREAT DISTRIBUTION */}

      <div className="section">
        <h2>🚨 Threat Distribution</h2>

        {threatDistribution.length === 0 ? (
          <p>
            🟢 No threat data available.
          </p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Attack Type</th>
                <th>Detected Packets</th>
                <th>Risk Level</th>
              </tr>
            </thead>

            <tbody>
              {threatDistribution.map(
                (item) => (
                  <tr key={item.attack}>
                    <td>{item.attack}</td>

                    <td>
                      {item.detected.toLocaleString()}
                    </td>

                    <td
                      className={
                        item.risk === "High"
                          ? "status-red"
                          : item.risk === "Medium"
                          ? "status-yellow"
                          : "status-green"
                      }
                    >
                      {item.risk === "High"
                        ? "🔴 High"
                        : item.risk === "Medium"
                        ? "🟡 Medium"
                        : "🟢 Low"}
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* DATASET DISTRIBUTION */}

      <div className="section">
        <h2>🗂 Dataset Analysis</h2>

        {datasets.length === 0 ? (
          <p>
            No dataset information available.
          </p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Dataset</th>
                <th>Analyses</th>
              </tr>
            </thead>

            <tbody>
              {datasets.map(
                ([dataset, count]) => (
                  <tr key={dataset}>
                    <td>{dataset}</td>

                    <td>
                      {Number(
                        count || 0
                      ).toLocaleString()}
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* SECURITY ASSESSMENT */}

      <div className="section">
        <h2>🛡 Security Assessment</h2>

        <table>
          <tbody>
            <tr>
              <th>Network Status</th>

              <td
                className={
                  threatPackets > 0
                    ? "status-yellow"
                    : "status-green"
                }
              >
                {networkStatus}
              </td>
            </tr>

            <tr>
              <th>Normal Traffic</th>

              <td>
                {normalPackets.toLocaleString()}{" "}
                packets
              </td>
            </tr>

            <tr>
              <th>Threat Traffic</th>

              <td>
                {threatPackets.toLocaleString()}{" "}
                packets
              </td>
            </tr>

            <tr>
              <th>Threat Rate</th>

              <td>
                {threatPercentage}%
              </td>
            </tr>

            <tr>
              <th>AI Confidence</th>

              <td>
                {averageConfidence.toFixed(2)}%
              </td>
            </tr>

            <tr>
              <th>Most Frequent Attack</th>

              <td>
                {mostFrequentAttack}
              </td>
            </tr>

            <tr>
              <th>Recommended Action</th>

              <td>
                {threatPackets > 0
                  ? "Investigate detected threats"
                  : "Continue network monitoring"}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* SYSTEM STATUS */}

      <div className="section">
        <h2>⚙️ Detection System Status</h2>

        <table>
          <thead>
            <tr>
              <th>Component</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            <tr>
              <td>Random Forest AI Engine</td>

              <td className="status-green">
                🟢 Active
              </td>
            </tr>

            <tr>
              <td>Network Threat Detection</td>

              <td className="status-green">
                🟢 Active
              </td>
            </tr>

            <tr>
              <td>Security Analytics</td>

              <td className="status-green">
                🟢 Active
              </td>
            </tr>

            <tr>
              <td>Threat Classification</td>

              <td className="status-green">
                🟢 Active
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* REFRESH */}

      <div className="section">
        <button onClick={loadThreatAnalysis}>
          🔄 Refresh Threat Analysis
        </button>
      </div>
    </>
  );
}

export default ThreatAnalysisPage;