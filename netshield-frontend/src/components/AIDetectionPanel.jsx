import { FaBrain, FaCheckCircle, FaRobot, FaMicrochip } from "react-icons/fa";

function AIDetectionPanel() {
  return (
    <div className="soc-card">
      <div className="soc-card-header-title">
        <h3 className="section-title">
          <FaBrain style={{ color: "#c084fc" }} /> AI Detection Engine
        </h3>
        <span className="live-status-tag" style={{ background: "rgba(16, 185, 129, 0.2)", color: "#34d399", border: "1px solid rgba(16, 185, 129, 0.4)" }}>
          <FaCheckCircle style={{ fontSize: "0.75rem", marginRight: "4px" }} /> Active
        </span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "16px", marginTop: "16px" }}>
        <div style={{ background: "#1e293b", padding: "14px", borderRadius: "8px", border: "1px solid #334155" }}>
          <span style={{ fontSize: "0.8rem", color: "#94a3b8", display: "flex", alignItems: "center", gap: "6px" }}>
            <FaRobot style={{ color: "#38bdf8" }} /> Model
          </span>
          <div style={{ fontSize: "1.05rem", fontWeight: "700", color: "#f8fafc", marginTop: "4px" }}>
            Random Forest Classifier
          </div>
        </div>

        <div style={{ background: "#1e293b", padding: "14px", borderRadius: "8px", border: "1px solid #334155" }}>
          <span style={{ fontSize: "0.8rem", color: "#94a3b8", display: "flex", alignItems: "center", gap: "6px" }}>
            <FaMicrochip style={{ color: "#c084fc" }} /> Accuracy
          </span>
          <div style={{ fontSize: "1.05rem", fontWeight: "700", color: "#c084fc", marginTop: "4px" }}>
            87.01%
          </div>
        </div>

        <div style={{ background: "#1e293b", padding: "14px", borderRadius: "8px", border: "1px solid #334155" }}>
          <span style={{ fontSize: "0.8rem", color: "#94a3b8", display: "flex", alignItems: "center", gap: "6px" }}>
            <FaCheckCircle style={{ color: "#34d399" }} /> Prediction Status
          </span>
          <div style={{ fontSize: "1.05rem", fontWeight: "700", color: "#34d399", marginTop: "4px" }}>
            Active
          </div>
        </div>
      </div>
    </div>
  );
}

export default AIDetectionPanel;
