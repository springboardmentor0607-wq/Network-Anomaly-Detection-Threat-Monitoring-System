import { FaServer, FaDatabase, FaBrain, FaPlug, FaCheckCircle } from "react-icons/fa";
import { systemStatusServices } from "../constants/mockData";

const serviceIcons = {
  "Server Status": <FaServer style={{ color: "#38bdf8" }} />,
  "Database Status": <FaDatabase style={{ color: "#00f2fe" }} />,
  "AI Model Status": <FaBrain style={{ color: "#c084fc" }} />,
  "API Status": <FaPlug style={{ color: "#34d399" }} />
};

function SystemStatusPanel({ services = systemStatusServices }) {
  return (
    <div className="soc-card">
      <div className="soc-card-header-title">
        <h3 className="section-title">
          <FaServer style={{ color: "#00f2fe" }} /> System Status Panel
        </h3>
        <span className="status-live-tag">
          <span className="status-dot-animated"></span> Operational
        </span>
      </div>

      <div className="system-status-grid">
        {services.map((item, idx) => (
          <div className="system-status-item" key={idx}>
            <div className="system-status-info">
              <span className="service-icon-box">{serviceIcons[item.name] || <FaServer />}</span>
              <div>
                <span className="service-name">{item.name}</span>
                <span className="service-details">{item.details}</span>
              </div>
            </div>

            <span className="healthy-badge">
              <FaCheckCircle className="healthy-icon" /> {item.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default SystemStatusPanel;
