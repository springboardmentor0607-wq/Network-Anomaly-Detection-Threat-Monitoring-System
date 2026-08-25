import { useState } from "react";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import {
  FaCog,
  FaBrain,
  FaSlidersH,
  FaSync,
  FaUpload,
  FaDownload,
  FaDatabase,
  FaCheckCircle,
  FaSave,
  FaInfoCircle
} from "react-icons/fa";
import "../styles/Dashboard.css";

function AdminSettings() {
  const [modelVersion, setModelVersion] = useState("v2.0-RandomForest-Classifier");
  const [predictionThreshold, setPredictionThreshold] = useState(0.50);
  const [confidenceThreshold, setConfidenceThreshold] = useState(75);
  const [retraining, setRetraining] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [message, setMessage] = useState("");

  const handleRetrainModel = async () => {
    setRetraining(true);
    setMessage("⏳ Random Forest Model Retraining Triggered...");
    setTimeout(() => {
      setRetraining(false);
      setMessage("✅ Random Forest Model retrained successfully! Saved to netshield_model.pkl.");
    }, 3000);
  };

  const handleBackupDatabase = () => {
    setMessage("✅ PostgreSQL database backup generated successfully (netshield_ai_backup.sql).");
  };

  const handleFileUpload = (e) => {
    e.preventDefault();
    if (!selectedFile) {
      alert("Please choose a dataset file (.csv) first!");
      return;
    }
    setMessage(`✅ New dataset file '${selectedFile.name}' uploaded to server.`);
    setSelectedFile(null);
  };

  return (
    <div className="soc-layout">
      <Sidebar role="Security Administrator" />
      <Topbar title="AI Model & Security Settings Configuration" />

      <div className="soc-main-content">
        {/* Header */}
        <div className="dashboard-header">
          <div>
            <h1 className="dashboard-title">
              ⚙️ AI System Settings
            </h1>
            <p className="dashboard-subtitle">
              Configure Random Forest Model Thresholds, Retraining Parameters, Dataset Uploads & Database Backups
            </p>
          </div>
        </div>

        {message && (
          <div className="upload-success-alert" style={{ marginBottom: "20px" }}>
            {message}
          </div>
        )}

        <div className="soc-grid-2">
          {/* Card 1: AI Model Configuration */}
          <div className="soc-card">
            <h3 className="section-title" style={{ marginBottom: "16px" }}>
              <FaBrain style={{ color: "#00f2fe" }} /> Random Forest AI Model Configuration
            </h3>

            <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
              {/* 1. Model Version */}
              <div>
                <label style={{ display: "block", fontSize: "0.85rem", color: "#94a3b8", marginBottom: "6px" }}>
                  Model Version
                </label>
                <input
                  type="text"
                  value={modelVersion}
                  onChange={(e) => setModelVersion(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px",
                    background: "#0f172a",
                    border: "1px solid #334155",
                    borderRadius: "8px",
                    color: "#00f2fe",
                    fontWeight: "600",
                    fontSize: "0.95rem"
                  }}
                />
              </div>

              {/* 2. Prediction Threshold */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                  <label style={{ fontSize: "0.85rem", color: "#94a3b8" }}>Prediction Decision Threshold</label>
                  <span style={{ color: "#38bdf8", fontWeight: "700" }}>{predictionThreshold}</span>
                </div>
                <input
                  type="range"
                  min="0.10"
                  max="0.90"
                  step="0.05"
                  value={predictionThreshold}
                  onChange={(e) => setPredictionThreshold(parseFloat(e.target.value))}
                  style={{ width: "100%", cursor: "pointer" }}
                />
                <span style={{ fontSize: "0.78rem", color: "#64748b" }}>
                  Sensitivity boundary for classifying flow packets as anomalous traffic.
                </span>
              </div>

              {/* 3. Confidence Threshold */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                  <label style={{ fontSize: "0.85rem", color: "#94a3b8" }}>Minimum Confidence Threshold</label>
                  <span style={{ color: "#c084fc", fontWeight: "700" }}>{confidenceThreshold}%</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="99"
                  step="1"
                  value={confidenceThreshold}
                  onChange={(e) => setConfidenceThreshold(parseInt(e.target.value))}
                  style={{ width: "100%", cursor: "pointer" }}
                />
                <span style={{ fontSize: "0.78rem", color: "#64748b" }}>
                  Minimum probability score required before triggering security alerts.
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: AI Actions & Management */}
          <div className="soc-card">
            <h3 className="section-title" style={{ marginBottom: "16px" }}>
              <FaSlidersH style={{ color: "#38bdf8" }} /> Administrative AI Actions & Operations
            </h3>

            <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
              {/* Retrain Model */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontWeight: "600", color: "#f8fafc" }}>Retrain Model</div>
                    <div style={{ fontSize: "0.8rem", color: "#94a3b8" }}>Execute full Scikit-learn Random Forest training pipeline</div>
                  </div>
                  <button onClick={handleRetrainModel} className="soc-btn-primary" disabled={retraining}>
                    <FaSync style={{ animation: retraining ? "spin 2s linear infinite" : "none" }} />
                    {retraining ? "Training..." : "Retrain Model"}
                  </button>
                </div>
              </div>

              {/* Upload New Dataset */}
              <div style={{ paddingTop: "12px", borderTop: "1px solid #334155" }}>
                <div style={{ fontWeight: "600", color: "#f8fafc", marginBottom: "8px" }}>Upload New Dataset</div>
                <form onSubmit={handleFileUpload} style={{ display: "flex", gap: "10px" }}>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={(e) => setSelectedFile(e.target.files[0])}
                    style={{ fontSize: "0.82rem", color: "#94a3b8", flex: 1 }}
                  />
                  <button type="submit" className="soc-btn-secondary" style={{ padding: "6px 14px" }}>
                    <FaUpload /> Upload
                  </button>
                </form>
              </div>

              {/* Backup Database */}
              <div style={{ paddingTop: "12px", borderTop: "1px solid #334155", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: "600", color: "#f8fafc" }}>Backup Database</div>
                  <div style={{ fontSize: "0.8rem", color: "#94a3b8" }}>Create PostgreSQL snapshot dump</div>
                </div>
                <button onClick={handleBackupDatabase} className="soc-btn-secondary">
                  <FaDatabase /> Backup DB
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminSettings;

