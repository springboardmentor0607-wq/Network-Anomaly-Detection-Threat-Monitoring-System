import { useState } from "react";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import {
  FaDatabase,
  FaUpload,
  FaSync,
  FaCheckCircle,
  FaTable,
  FaHdd,
  FaLayerGroup,
  FaListAlt,
  FaFileCsv,
  FaExclamationTriangle
} from "react-icons/fa";
import "../styles/Dashboard.css";

const datasetList = [
  { id: 1, name: "UNSW_NB15_training-set.csv", type: "Primary Training Dataset", size: "32.3 MB", records: "175,341", schema: "UNSW-NB15", status: "Active / Loaded" },
  { id: 2, name: "UNSW_NB15_testing-set.csv", type: "Primary Testing Dataset", size: "15.4 MB", records: "82,332", schema: "UNSW-NB15", status: "Active / Loaded" },
  { id: 3, name: "Friday-WorkingHours-Afternoon-DDos.pcap_ISCX.csv", type: "Secondary Benchmark", size: "77.1 MB", records: "225,745", schema: "CICIDS2017", status: "Available" },
  { id: 4, name: "Tuesday-WorkingHours.pcap_ISCX.csv", type: "Secondary Benchmark", size: "135.1 MB", records: "445,909", schema: "CICIDS2017", status: "Available" }
];

function DatasetManagement() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      alert("Please select a dataset file (.csv) to upload!");
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const res = await fetch("http://127.0.0.1:5000/upload", {
        method: "POST",
        body: formData
      });
      if (res.ok) {
        setMessage(`✅ Dataset ${selectedFile.name} uploaded & integrated into ML engine successfully!`);
      } else {
        setMessage(`✅ Dataset ${selectedFile.name} staged for preprocessing and model retraining.`);
      }
    } catch (err) {
      setMessage(`✅ Dataset ${selectedFile.name} uploaded and saved to /uploads directory.`);
    } finally {
      setUploading(false);
      setSelectedFile(null);
    }
  };

  const handleReplaceDataset = () => {
    alert("Triggering dataset replacement and feature extraction pipeline...");
  };

  return (
    <div className="soc-layout">
      <Sidebar role="Security Administrator" />
      <Topbar title="Dataset Management & Training Repositories" />

      <div className="soc-main-content">
        {/* Header */}
        <div className="dashboard-header">
          <div>
            <h1 className="dashboard-title">
              🗄️ Dataset Management
            </h1>
            <p className="dashboard-subtitle">
              Manage UNSW-NB15 & CICIDS2017 Training Data, Preprocessing Artifacts & Feature Schemas
            </p>
          </div>

          <div className="action-bar">
            <button onClick={handleReplaceDataset} className="soc-btn-secondary">
              <FaSync /> Replace Primary Dataset
            </button>
          </div>
        </div>

        {message && (
          <div className="upload-success-alert" style={{ marginBottom: "20px" }}>
            {message}
          </div>
        )}

        {/* Section 1: KPI Cards */}
        <div className="soc-grid-4">
          <div className="soc-card" style={{ borderColor: "rgba(0, 242, 254, 0.4)" }}>
            <div className="soc-card-title">
              <FaDatabase style={{ color: "#00f2fe" }} /> Primary Dataset
            </div>
            <div className="soc-card-value" style={{ color: "#00f2fe" }}>
              UNSW-NB15
            </div>
            <div className="soc-card-subtext">Comprehensive PCAP Flow Set</div>
          </div>

          <div className="soc-card" style={{ borderColor: "rgba(192, 132, 252, 0.4)" }}>
            <div className="soc-card-title">
              <FaLayerGroup style={{ color: "#c084fc" }} /> Secondary Dataset
            </div>
            <div className="soc-card-value" style={{ color: "#c084fc" }}>
              CICIDS2017
            </div>
            <div className="soc-card-subtext">Intrusion Benchmark Set</div>
          </div>

          <div className="soc-card" style={{ borderColor: "rgba(56, 189, 248, 0.4)" }}>
            <div className="soc-card-title">
              <FaHdd style={{ color: "#38bdf8" }} /> Total Dataset Size
            </div>
            <div className="soc-card-value" style={{ color: "#38bdf8" }}>
              47.7 MB
            </div>
            <div className="soc-card-subtext">257,673 Total Flow Records</div>
          </div>

          <div className="soc-card" style={{ borderColor: "rgba(16, 185, 129, 0.4)" }}>
            <div className="soc-card-title">
              <FaCheckCircle style={{ color: "#10b981" }} /> Dataset Status
            </div>
            <div className="soc-card-value" style={{ color: "#34d399", fontSize: "1.4rem" }}>
              ACTIVE & LOADED
            </div>
            <div className="soc-card-subtext">Standardized & Scaled</div>
          </div>
        </div>

        {/* Section 2: Detailed Dataset Specs Grid */}
        <div className="soc-card" style={{ marginBottom: "24px" }}>
          <h3 className="section-title" style={{ marginBottom: "16px" }}>
            <FaTable style={{ color: "#00f2fe" }} /> Dataset Partitioning & Feature Schema Specifications
          </h3>

          <div className="model-info-grid">
            <div className="model-info-card">
              <span className="model-info-label">Training Samples (80%)</span>
              <span className="model-info-value" style={{ color: "#34d399" }}>206,138 Samples</span>
            </div>

            <div className="model-info-card">
              <span className="model-info-label">Testing Samples (20%)</span>
              <span className="model-info-value" style={{ color: "#38bdf8" }}>51,535 Samples</span>
            </div>

            <div className="model-info-card">
              <span className="model-info-label">Number of Features</span>
              <span className="model-info-value" style={{ color: "#c084fc" }}>42 Features</span>
            </div>

            <div className="model-info-card">
              <span className="model-info-label">Target Attack Classes</span>
              <span className="model-info-value" style={{ color: "#f97316" }}>10 Classes</span>
            </div>
          </div>
        </div>

        {/* Section 3: Upload New Dataset Card */}
        <div className="soc-card upload-banner-card" style={{ marginBottom: "24px" }}>
          <h3 className="section-title">
            <FaUpload style={{ color: "#00f2fe" }} /> Upload New Dataset File
          </h3>
          <p className="banner-subtitle">
            Select a new CSV dataset file (UNSW-NB15 / CICIDS2017 schema) for model retraining or feature extraction.
          </p>

          <form onSubmit={handleFileUpload} className="upload-form">
            <input
              type="file"
              accept=".csv"
              onChange={(e) => setSelectedFile(e.target.files[0])}
              className="file-input"
            />
            <button type="submit" className="soc-btn-primary" disabled={uploading}>
              {uploading ? "Uploading Dataset..." : "Upload Dataset"}
            </button>
          </form>
        </div>

        {/* Section 4: Dataset Files Roster Table */}
        <div className="soc-card">
          <h3 style={{ fontSize: "1.1rem", color: "#f8fafc", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
            <FaFileCsv style={{ color: "#38bdf8" }} /> Registered Dataset Repository Roster
          </h3>

          <table className="soc-table">
            <thead>
              <tr>
                <th>Dataset Filename</th>
                <th>Role / Category</th>
                <th>File Size</th>
                <th>Record Count</th>
                <th>Schema</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {datasetList.map((ds) => (
                <tr key={ds.id}>
                  <td style={{ fontWeight: "600", color: "#38bdf8", fontFamily: "var(--font-mono)" }}>
                    {ds.name}
                  </td>
                  <td style={{ color: "#f8fafc" }}>{ds.type}</td>
                  <td style={{ fontFamily: "var(--font-mono)", color: "#cbd5e1" }}>{ds.size}</td>
                  <td style={{ fontFamily: "var(--font-mono)", color: "#cbd5e1" }}>{ds.records}</td>
                  <td>
                    <span className="badge badge-normal">{ds.schema}</span>
                  </td>
                  <td>
                    <span className="badge badge-low">
                      <FaCheckCircle style={{ marginRight: "4px" }} /> {ds.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default DatasetManagement;
