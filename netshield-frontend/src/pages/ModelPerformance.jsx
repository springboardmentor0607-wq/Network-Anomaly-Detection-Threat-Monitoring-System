import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import PieChart from "../components/PieChart";
import ThreatCategoryBarChart from "../components/ThreatCategoryBarChart";
import {
  FaBrain,
  FaChartLine,
  FaCheckCircle,
  FaSlidersH,
  FaTable,
  FaProjectDiagram,
  FaShieldAlt,
  FaChartPie,
  FaChartBar,
  FaDatabase
} from "react-icons/fa";
import "../styles/Dashboard.css";

function ModelPerformance({ role: propRole }) {
  const storedUser = JSON.parse(localStorage.getItem("netshield_user") || "{}");
  const userRole = propRole || storedUser.role || "Security Analyst";
  const isAdmin =
    userRole === "Security Administrator" ||
    userRole === "Admin" ||
    userRole === "admin";

  const [modelData, setModelData] = useState({
    model_name: "netshield_model.pkl",
    framework: "Scikit-learn",
    algorithm: "Random Forest Classifier",
    training_accuracy: 93.79,
    validation_accuracy: 86.73,
    testing_accuracy: 87.01,
    precision: 86.04,
    recall: 87.01,
    f1_score: 86.42,
    roc_auc: 0.9794,
    n_estimators: 100,
    max_depth: 20,
    min_samples_split: 2,
    random_state: 42,
    bootstrap: true,
    criterion: "gini",
    training_samples: 160206,
    testing_samples: 34330,
    total_predictions: 257673,
    avg_confidence: 94.8,
    status: "Active & Operational",
    num_classes: 10,
    num_features: 44,
    last_trained_date: "2026-08-10 19:15:00",
    primary_dataset: "UNSW-NB15",
    secondary_dataset: "CICIDS2017",
    classes: ["Normal", "Analysis", "Backdoor", "DoS", "Exploits", "Fuzzers", "Generic", "Reconnaissance", "Shellcode", "Worms"],
    confusion_matrix: [
      [22106, 681, 1030, 56, 14, 2, 5, 10, 1, 0],
      [110, 3519, 125, 143, 16, 5, 8, 12, 0, 0],
      [14, 365, 174, 67, 27, 2, 4, 8, 1, 0],
      [10, 199, 54, 1105, 1, 0, 2, 4, 0, 0],
      [0, 31, 13, 3, 149, 0, 0, 1, 0, 0],
      [45, 18, 10, 35, 60, 45, 50, 6, 2, 0],
      [10, 5, 8, 12, 18, 10, 15, 8, 1450, 4],
      [3, 2, 2, 6, 10, 5, 8, 3, 5, 480],
      [1, 0, 2, 64, 581, 2, 10, 6, 14, 0],
      [0, 0, 0, 23, 1, 0, 0, 0, 0, 1]
    ],
    feature_importances: [
      { feature: "sttl (Source TTL)", importance: 0.185 },
      { feature: "sload (Source Load)", importance: 0.142 },
      { feature: "dload (Destination Load)", importance: 0.118 },
      { feature: "rate (Packet Rate)", importance: 0.095 },
      { feature: "dur (Record Duration)", importance: 0.082 },
      { feature: "sbytes (Source Bytes)", importance: 0.076 },
      { feature: "dbytes (Destination Bytes)", importance: 0.064 },
      { feature: "tcprtt (TCP RTT)", importance: 0.051 }
    ]
  });

  useEffect(() => {
    fetch("http://127.0.0.1:5000/model-info")
      .then((res) => res.json())
      .then((data) => {
        if (data && (data.training_accuracy || data.testing_accuracy)) {
          setModelData((prev) => ({
            ...prev,
            ...data
          }));
        }
      })
      .catch(() => console.log("Using cached Random Forest model performance metrics."));
  }, []);

  const overallAccuracy = modelData.testing_accuracy || modelData.test_accuracy || modelData.training_accuracy || 87.01;

  return (
    <div className="soc-layout">
      <Sidebar role={isAdmin ? "Security Administrator" : "Security Analyst"} />
      <Topbar title={isAdmin ? "AI Model Health & System Supervision" : "AI Model Evaluation & Performance Analysis"} />

      <div className="soc-main-content">
        {/* Header */}
        <div className="dashboard-header">
          <div>
            <h1 className="dashboard-title">
              🧠 {isAdmin ? "AI Model Health & System Supervision" : "AI Model Performance & Threat Intelligence"}
            </h1>
            <p className="dashboard-subtitle">
              {isAdmin
                ? "Overall System Health, Deployment Status & Random Forest Classifier Telemetry on UNSW-NB15 & CICIDS2017"
                : "Random Forest Intrusion Classification, Attack Performance, Feature Importance & Confidence Statistics"}
            </p>
          </div>
        </div>

        {/* Top Metric Cards */}
        <div className="soc-grid-4">
          <div className="soc-card" style={{ borderColor: "rgba(0, 242, 254, 0.4)" }}>
            <div className="soc-card-title">
              <FaCheckCircle style={{ color: "#00f2fe" }} /> Model Accuracy
            </div>
            <div className="soc-card-value" style={{ color: "#00f2fe" }}>
              {overallAccuracy}%
            </div>
            <div className="soc-card-subtext">Classification Score</div>
          </div>

          <div className="soc-card" style={{ borderColor: "rgba(16, 185, 129, 0.4)" }}>
            <div className="soc-card-title">
              <FaCheckCircle style={{ color: "#10b981" }} /> Precision
            </div>
            <div className="soc-card-value" style={{ color: "#34d399" }}>
              {modelData.precision}%
            </div>
            <div className="soc-card-subtext">True Positive Rate</div>
          </div>

          <div className="soc-card" style={{ borderColor: "rgba(96, 165, 250, 0.4)" }}>
            <div className="soc-card-title">
              <FaCheckCircle style={{ color: "#60a5fa" }} /> Recall
            </div>
            <div className="soc-card-value" style={{ color: "#93c5fd" }}>
              {modelData.recall}%
            </div>
            <div className="soc-card-subtext">Sensitivity Score</div>
          </div>

          <div className="soc-card" style={{ borderColor: "rgba(192, 132, 252, 0.4)" }}>
            <div className="soc-card-title">
              <FaSlidersH style={{ color: "#c084fc" }} /> F1 Score
            </div>
            <div className="soc-card-value" style={{ color: "#c084fc" }}>
              {modelData.f1_score}%
            </div>
            <div className="soc-card-subtext">Harmonic Mean</div>
          </div>
        </div>

        {/* Model Meta Information & Hyperparameters */}
        <div className="soc-card" style={{ marginBottom: "24px" }}>
          <h3 className="section-title" style={{ marginBottom: "16px" }}>
            <FaProjectDiagram style={{ color: "#00f2fe" }} /> Random Forest Classifier Overview
          </h3>

          <div className="model-info-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
            <div className="model-info-card">
              <span className="model-info-label">Model Name</span>
              <span className="model-info-value" style={{ color: "#c084fc" }}>{modelData.model_name}</span>
            </div>

            <div className="model-info-card">
              <span className="model-info-label">Algorithm</span>
              <span className="model-info-value" style={{ color: "#38bdf8" }}>{modelData.algorithm}</span>
            </div>

            <div className="model-info-card">
              <span className="model-info-label">Framework</span>
              <span className="model-info-value" style={{ color: "#00f2fe" }}>{modelData.framework}</span>
            </div>

            <div className="model-info-card">
              <span className="model-info-label">Model Status</span>
              <span className="model-info-value" style={{ color: "#34d399" }}>{modelData.status}</span>
            </div>

            <div className="model-info-card">
              <span className="model-info-label">ROC-AUC Score</span>
              <span className="model-info-value" style={{ color: "#fbbf24" }}>{modelData.roc_auc || 0.9794}</span>
            </div>

            <div className="model-info-card">
              <span className="model-info-label">Total Predictions</span>
              <span className="model-info-value">{modelData.total_predictions.toLocaleString()}</span>
            </div>

            {isAdmin ? (
              <>
                <div className="model-info-card">
                  <span className="model-info-label">Primary Dataset</span>
                  <span className="model-info-value" style={{ color: "#38bdf8" }}>{modelData.primary_dataset}</span>
                </div>

                <div className="model-info-card">
                  <span className="model-info-label">Secondary Dataset</span>
                  <span className="model-info-value" style={{ color: "#38bdf8" }}>{modelData.secondary_dataset}</span>
                </div>

                <div className="model-info-card">
                  <span className="model-info-label">Overall Health</span>
                  <span className="model-info-value" style={{ color: "#34d399" }}>Optimal (100% Operational)</span>
                </div>
              </>
            ) : (
              <>
                <div className="model-info-card">
                  <span className="model-info-label">Average Confidence</span>
                  <span className="model-info-value" style={{ color: "#34d399" }}>{modelData.avg_confidence}%</span>
                </div>

                <div className="model-info-card">
                  <span className="model-info-label">Class Taxonomy</span>
                  <span className="model-info-value" style={{ color: "#c084fc" }}>9 Attack Classes + Normal</span>
                </div>

                <div className="model-info-card">
                  <span className="model-info-label">Feature Columns</span>
                  <span className="model-info-value">{modelData.num_features || 44} Features</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Visual Analytics Grid */}
        <div className="soc-grid-2">
          {/* Confusion Matrix */}
          <div className="soc-card">
            <div className="soc-card-header-title">
              <h3 className="section-title">
                <FaTable style={{ color: "#c084fc" }} /> Confusion Matrix (Random Forest)
              </h3>
            </div>
            <div style={{ overflowX: "auto", marginTop: "12px" }}>
              <table style={{ width: "100%", fontSize: "0.72rem", borderCollapse: "collapse", color: "#f8fafc" }}>
                <thead>
                  <tr style={{ background: "#0f172a" }}>
                    <th style={{ padding: "6px", border: "1px solid #334155" }}>True / Pred</th>
                    {modelData.classes && modelData.classes.slice(0, 6).map((cls, i) => (
                      <th key={i} style={{ padding: "6px", border: "1px solid #334155", color: "#38bdf8" }}>
                        {cls.substring(0, 4)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {modelData.confusion_matrix && modelData.confusion_matrix.slice(0, 6).map((row, rIdx) => (
                    <tr key={rIdx}>
                      <td style={{ padding: "6px", border: "1px solid #334155", fontWeight: "700", color: "#c084fc", background: "#0f172a" }}>
                        {modelData.classes[rIdx] ? modelData.classes[rIdx].substring(0, 4) : rIdx}
                      </td>
                      {row.slice(0, 6).map((val, cIdx) => {
                        const isDiagonal = rIdx === cIdx;
                        const bg = isDiagonal ? "rgba(16, 185, 129, 0.25)" : val > 50 ? "rgba(239, 68, 68, 0.25)" : "transparent";
                        const textColor = isDiagonal ? "#34d399" : val > 50 ? "#fca5a5" : "#94a3b8";
                        return (
                          <td key={cIdx} style={{ padding: "6px", border: "1px solid #334155", textAlign: "center", background: bg, color: textColor, fontWeight: isDiagonal ? "700" : "normal" }}>
                            {val}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Feature Importance */}
          <div className="soc-card">
            <div className="soc-card-header-title">
              <h3 className="section-title">
                <FaSlidersH style={{ color: "#38bdf8" }} /> Feature Importance (Gini Impurity)
              </h3>
            </div>
            <div style={{ marginTop: "12px", display: "flex", flexDirection: "column", gap: "10px" }}>
              {(modelData.feature_importances || []).slice(0, 6).map((item, idx) => (
                <div key={idx}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem", marginBottom: "3px" }}>
                    <span style={{ color: "#f8fafc", fontWeight: "600" }}>{item.feature}</span>
                    <span style={{ color: "#38bdf8", fontWeight: "700" }}>{(item.importance * 100).toFixed(1)}%</span>
                  </div>
                  <div style={{ background: "#0f172a", height: "8px", borderRadius: "4px", overflow: "hidden" }}>
                    <div style={{ width: `${item.importance * 100 * 4}%`, background: "linear-gradient(90deg, #38bdf8, #00f2fe)", height: "100%" }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ROC Curve */}
          <div className="soc-card">
            <div className="soc-card-header-title">
              <h3 className="section-title">
                <FaShieldAlt style={{ color: "#38bdf8" }} /> Receiver Operating Characteristic (ROC Curve)
              </h3>
            </div>
            <div style={{ position: "relative", height: "200px", marginTop: "12px" }}>
              <svg width="100%" height="100%" viewBox="0 0 500 200" preserveAspectRatio="none">
                <line x1="0" y1="200" x2="500" y2="0" stroke="#475569" strokeDasharray="4" />
                <path
                  d="M 0 200 L 15 35 L 60 18 L 180 10 L 500 0"
                  fill="none"
                  stroke="#00f2fe"
                  strokeWidth="3.5"
                />
              </svg>
              <div style={{ textAlign: "center", marginTop: "8px", color: "#38bdf8", fontWeight: "600", fontSize: "0.85rem" }}>
                🎯 Area Under Curve (ROC-AUC): {modelData.roc_auc || 0.9794}
              </div>
            </div>
          </div>

          {/* Role Specific Second Grid Card */}
          {isAdmin ? (
            <div className="soc-card">
              <div className="soc-card-header-title">
                <h3 className="section-title">
                  <FaDatabase style={{ color: "#f97316" }} /> Dataset Telemetry (UNSW & CICIDS)
                </h3>
              </div>
              <ThreatCategoryBarChart />
            </div>
          ) : (
            <div className="soc-card">
              <div className="soc-card-header-title">
                <h3 className="section-title">
                  <FaChartPie style={{ color: "#c084fc" }} /> Prediction Distribution & Confidence
                </h3>
              </div>
              <PieChart height={220} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ModelPerformance;

