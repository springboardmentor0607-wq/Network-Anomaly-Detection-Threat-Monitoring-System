import { FaDatabase, FaCheckCircle, FaProjectDiagram } from "react-icons/fa";
import { datasetInformation } from "../constants/mockData";

function DatasetInfoCard({ info = datasetInformation }) {
  const primary = info.primaryDataset || (info.datasets ? info.datasets[0] : "UNSW-NB15");
  const secondary = info.secondaryDataset || (info.datasets ? info.datasets[1] : "CICIDS2017");
  const status = info.status || "Loaded & Preprocessed";
  const purpose = info.purpose || "Network Anomaly Detection & Traffic Classification";

  return (
    <div className="soc-card">
      <div className="soc-card-header-title">
        <h3 className="section-title">
          <FaDatabase style={{ color: "#38bdf8" }} /> Dataset Status
        </h3>
        <span className="dataset-loaded-badge">
          <FaCheckCircle /> {status}
        </span>
      </div>

      <div className="dataset-info-content" style={{ marginTop: "16px" }}>
        <div className="dataset-field" style={{ marginBottom: "12px" }}>
          <span className="dataset-field-label">
            Primary Dataset:
          </span>
          <span className="dataset-tag" style={{ background: "rgba(56, 189, 248, 0.15)", color: "#38bdf8", border: "1px solid rgba(56, 189, 248, 0.3)" }}>
            {primary}
          </span>
        </div>

        <div className="dataset-field" style={{ marginBottom: "12px" }}>
          <span className="dataset-field-label">
            Secondary Dataset:
          </span>
          <span className="dataset-tag" style={{ background: "rgba(168, 85, 247, 0.15)", color: "#c084fc", border: "1px solid rgba(168, 85, 247, 0.3)" }}>
            {secondary}
          </span>
        </div>

        <div className="dataset-field" style={{ marginBottom: "12px" }}>
          <span className="dataset-field-label">
            <FaCheckCircle className="dataset-field-icon" style={{ color: "#10b981" }} /> Status:
          </span>
          <span className="dataset-field-value" style={{ color: "#34d399", fontWeight: 600 }}>
            {status}
          </span>
        </div>

        <div className="dataset-field">
          <span className="dataset-field-label">
            <FaProjectDiagram className="dataset-field-icon" style={{ color: "#c084fc" }} /> Purpose:
          </span>
          <p className="dataset-purpose-text" style={{ color: "#cbd5e1", marginTop: "4px" }}>
            {purpose}
          </p>
        </div>
      </div>
    </div>
  );
}

export default DatasetInfoCard;
