import { useEffect, useState } from "react";
import axios from "axios";
import "./AdminDashboard.css";

const API_URL = "https://network-anomaly-detection-threat-5ihm.onrender.com";

function DashboardHome() {
  const [dashboard, setDashboard] = useState(null);
  const [error, setError] = useState("");

  // ==================================================
  // LOAD DASHBOARD
  // ==================================================

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/dashboard/admin`
      );

      setDashboard(response.data);
      setError("");
    } catch (error) {
      console.error("Dashboard Error:", error);

      setError(
        "Unable to load administration dashboard."
      );
    }
  };

  // ==================================================
  // LOADING
  // ==================================================

  if (!dashboard) {
    return (
      <div className="section">
        <h2>Loading Administration Dashboard...</h2>

        {error && (
          <p className="status-red">
            {error}
          </p>
        )}
      </div>
    );
  }

  // ==================================================
  // SAFE DATA HANDLING
  // ==================================================

  const stats = dashboard.statistics || {};

  const aiModels = Array.isArray(dashboard.ai_models)
    ? dashboard.ai_models
    : dashboard.ai_models &&
      typeof dashboard.ai_models === "object"
      ? Object.values(dashboard.ai_models)
      : [];

  const system = Array.isArray(dashboard.system)
    ? dashboard.system
    : [];

  const latestPredictions = Array.isArray(
    dashboard.latest_predictions
  )
    ? dashboard.latest_predictions
    : [];

  const latestLogs = Array.isArray(
    dashboard.latest_logs
  )
    ? dashboard.latest_logs
    : [];

  // ==================================================
  // PAGE
  // ==================================================

  return (
    <>
      {/* =================================================
          HEADER
      ================================================= */}

      <div className="topbar">
        <div>
          <h1>
            📊 Administration Dashboard
          </h1>

          <p>
            Welcome to NetShield AI Enterprise Portal
          </p>
        </div>

        <h3>
          👤 Administrator
        </h3>
      </div>

      {/* =================================================
          KPI CARDS
      ================================================= */}

      <div className="cards">

        <div className="card">
          <h2>
            {stats.total_users || 0}
          </h2>

          <p>
            Total Users
          </p>
        </div>

        <div className="card">
          <h2>
            {stats.admins || 0}
          </h2>

          <p>
            Administrators
          </p>
        </div>

        <div className="card">
          <h2>
            {stats.analysts || 0}
          </h2>

          <p>
            Security Analysts
          </p>
        </div>

        <div className="card">
          <h2>
            {stats.predictions || 0}
          </h2>

          <p>
            AI Predictions
          </p>
        </div>

        <div className="card">
          <h2>
            {stats.incidents || 0}
          </h2>

          <p>
            Total Incidents
          </p>
        </div>

        <div className="card">
          <h2>
            {stats.audit_logs || 0}
          </h2>

          <p>
            Audit Logs
          </p>
        </div>

        <div className="card">
          <h2>
            {stats.active_users || 0}
          </h2>

          <p>
            Active Users
          </p>
        </div>

      </div>

      {/* =================================================
          AI MODEL TRAINING OVERVIEW
      ================================================= */}

      <div className="section">

        <h2>
          🤖 AI Model Training Overview
        </h2>

        <table>

          <thead>
            <tr>
              <th>Model</th>
              <th>Dataset</th>
              <th>Accuracy</th>
              <th>Precision</th>
              <th>Recall</th>
              <th>F1 Score</th>
              <th>Accuracy Gap</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>

            {aiModels.length === 0 ? (

              <tr>
                <td colSpan="8">
                  No AI model information available.
                </td>
              </tr>

            ) : (

              aiModels.map((model, index) => {

                const modelName =
                  model?.model ||
                  model?.model_name ||
                  model?.name ||
                  `Model ${index + 1}`;

                const datasetName =
                  model?.dataset ||
                  model?.dataset_name ||
                  model?.data ||
                  "N/A";

                const accuracy =
                  model?.accuracy ??
                  model?.test_accuracy ??
                  0;

                const precision =
                  model?.precision ??
                  model?.test_precision ??
                  0;

                const recall =
                  model?.recall ??
                  model?.test_recall ??
                  0;

                const f1Score =
                  model?.f1_score ??
                  model?.f1 ??
                  model?.test_f1 ??
                  0;

                const accuracyGap =
                  model?.accuracy_gap ??
                  model?.accuracy_difference ??
                  0;

                const status =
                  model?.status ||
                  "Operational";

                return (
                  <tr key={index}>

                    <td>
                      {modelName}
                    </td>

                    <td>
                      {datasetName}
                    </td>

                    <td>
                      {accuracy}%
                    </td>

                    <td>
                      {precision}%
                    </td>

                    <td>
                      {recall}%
                    </td>

                    <td>
                      {f1Score}%
                    </td>

                    <td>
                      {accuracyGap}%
                    </td>

                    <td className="status-green">
                      {status}
                    </td>

                  </tr>
                );
              })

            )}

          </tbody>

        </table>

      </div>

      {/* =================================================
          SYSTEM STATUS
      ================================================= */}

      <div className="section">

        <h2>
          🟢 System Status
        </h2>

        <table>

          <thead>
            <tr>
              <th>Component</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>

            {system.length === 0 ? (

              <tr>
                <td colSpan="2">
                  No system status information available.
                </td>
              </tr>

            ) : (

              system.map((item, index) => (

                <tr key={index}>

                  <td>
                    {item?.name || "Unknown Component"}
                  </td>

                  <td className="status-green">
                    {item?.status || "Unknown"}
                  </td>

                </tr>

              ))

            )}

          </tbody>

        </table>

      </div>

      {/* =================================================
          LATEST AI PREDICTIONS
      ================================================= */}

      <div className="section">

        <h2>
          🤖 Latest AI Predictions
        </h2>

        <table>

          <thead>
            <tr>
              <th>Dataset</th>
              <th>Processed Records</th>
              <th>Confidence</th>
              <th>Uploaded Time</th>
            </tr>
          </thead>

          <tbody>

            {latestPredictions.length === 0 ? (

              <tr>
                <td colSpan="4">
                  No AI predictions available.
                </td>
              </tr>

            ) : (

              latestPredictions.map((item, index) => (

                <tr key={index}>

                  <td>
                    {item?.dataset || "N/A"}
                  </td>

                  <td>
                    {item?.processed_records || 0}
                  </td>

                  <td>
                    {item?.average_confidence || 0}%
                  </td>

                  <td>
                    {item?.created_at
                      ? new Date(
                          item.created_at
                        ).toLocaleString()
                      : "N/A"}
                  </td>

                </tr>

              ))

            )}

          </tbody>

        </table>

      </div>

      {/* =================================================
          LATEST AUDIT LOGS
      ================================================= */}

      <div className="section">

        <h2>
          📜 Latest Audit Logs
        </h2>

        <table>

          <thead>
            <tr>
              <th>User</th>
              <th>Action</th>
              <th>Module</th>
              <th>Status</th>
              <th>Time</th>
            </tr>
          </thead>

          <tbody>

            {latestLogs.length === 0 ? (

              <tr>
                <td colSpan="5">
                  No audit logs available.
                </td>
              </tr>

            ) : (

              latestLogs.map((log, index) => (

                <tr key={index}>

                  <td>
                    {log?.user || "N/A"}
                  </td>

                  <td>
                    {log?.action || "N/A"}
                  </td>

                  <td>
                    {log?.module || "N/A"}
                  </td>

                  <td
                    className={
                      log?.status === "Success"
                        ? "status-green"
                        : "status-red"
                    }
                  >
                    {log?.status || "Unknown"}
                  </td>

                  <td>
                    {log?.timestamp
                      ? new Date(
                          log.timestamp
                        ).toLocaleString()
                      : "N/A"}
                  </td>

                </tr>

              ))

            )}

          </tbody>

        </table>

      </div>

      {/* =================================================
          MODEL GENERALIZATION
      ================================================= */}

      <div className="section">

        <h2>
          🧠 Model Generalization
        </h2>

        <table>

          <thead>
            <tr>
              <th>Model</th>
              <th>Dataset</th>
              <th>Accuracy Gap</th>
              <th>Generalization</th>
            </tr>
          </thead>

          <tbody>

            {aiModels.length === 0 ? (

              <tr>
                <td colSpan="4">
                  No model generalization information available.
                </td>
              </tr>

            ) : (

              aiModels.map((model, index) => {

                const modelName =
                  model?.model ||
                  model?.model_name ||
                  model?.name ||
                  `Model ${index + 1}`;

                const datasetName =
                  model?.dataset ||
                  model?.dataset_name ||
                  model?.data ||
                  "N/A";

                const accuracyGap =
                  model?.accuracy_gap ??
                  model?.accuracy_difference ??
                  0;

                const generalization =
                  model?.generalization ||
                  (
                    Number(accuracyGap) <= 5
                      ? "Good Generalization"
                      : "Needs Review"
                  );

                return (
                  <tr key={index}>

                    <td>
                      {modelName}
                    </td>

                    <td>
                      {datasetName}
                    </td>

                    <td>
                      {accuracyGap}%
                    </td>

                    <td className="status-green">
                      {generalization}
                    </td>

                  </tr>
                );

              })

            )}

          </tbody>

        </table>

      </div>
    </>
  );
}

export default DashboardHome;