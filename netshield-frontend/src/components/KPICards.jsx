import {
  FaDatabase,
  FaCheckCircle,
  FaExclamationTriangle,
  FaBullseye,
  FaUsers,
  FaHeartbeat
} from "react-icons/fa";
import { initialKpiMetrics } from "../constants/mockData";

const iconMap = {
  packets: <FaDatabase style={{ color: "#00f2fe" }} />,
  normal: <FaCheckCircle style={{ color: "#10b981" }} />,
  threats: <FaExclamationTriangle style={{ color: "#ef4444" }} />,
  accuracy: <FaBullseye style={{ color: "#c084fc" }} />,
  users: <FaUsers style={{ color: "#38bdf8" }} />,
  health: <FaHeartbeat style={{ color: "#34d399" }} />
};

function KPICards({ customMetrics }) {
  const cards = customMetrics || initialKpiMetrics;

  return (
    <div className="soc-grid-6">
      {cards.map((card) => (
        <div className="soc-card kpi-card" key={card.id}>
          <div className="soc-card-header">
            <span className="kpi-icon-wrapper">{iconMap[card.iconType] || <FaDatabase />}</span>
            <span className="soc-card-title">{card.title}</span>
          </div>
          <div className="soc-card-value" style={{ color: card.color }}>
            {card.value}
          </div>
          <div className="soc-card-subtext">{card.description}</div>
        </div>
      ))}
    </div>
  );
}

export default KPICards;
