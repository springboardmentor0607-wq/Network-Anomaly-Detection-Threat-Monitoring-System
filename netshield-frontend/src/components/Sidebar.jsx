import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  FaTachometerAlt,
  FaRobot,
  FaShieldAlt,
  FaFileAlt,
  FaUser,
  FaSignOutAlt,
  FaDatabase,
  FaUserCog,
  FaDesktop,
  FaCog,
  FaBrain,
  FaNetworkWired
} from "react-icons/fa";
import "../styles/sidebar.css";

function Sidebar({ role: overrideRole }) {
  const location = useLocation();
  const navigate = useNavigate();

  const storedUser = JSON.parse(localStorage.getItem("netshield_user") || "{}");
  
  // Determine active role strictly
  let activeRole = overrideRole;
  if (!activeRole) {
    if (location.pathname.startsWith("/admin")) {
      activeRole = "Security Administrator";
    } else if (location.pathname.startsWith("/analyst")) {
      activeRole = "Security Analyst";
    } else {
      activeRole = storedUser.role || "Security Analyst";
    }
  }

  const isAdmin =
    activeRole === "Security Administrator" ||
    activeRole === "Admin" ||
    activeRole === "admin";

  const handleLogout = (e) => {
    e.preventDefault();
    localStorage.removeItem("netshield_user");
    navigate("/login");
  };

  const isCurrent = (paths) => {
    const current = location.pathname;
    if (Array.isArray(paths)) {
      return paths.includes(current);
    }
    return current === paths;
  };

  return (
    <div className="sidebar">
      <div className="logo">
        🛡️ NetShield AI
      </div>

      <nav className="sidebar-nav">
        <ul>
          {isAdmin ? (
            <>
              <li>
                <Link to="/admin/dashboard" className={isCurrent(["/admin/dashboard", "/admin-dashboard"]) ? "active" : ""}>
                  <FaTachometerAlt /> Dashboard
                </Link>
              </li>
              <li>
                <Link to="/admin/model-performance" className={isCurrent(["/admin/model-performance", "/model-performance"]) ? "active" : ""}>
                  <FaBrain /> Model Performance
                </Link>
              </li>
              <li>
                <Link to="/admin/dataset" className={isCurrent(["/admin/dataset", "/admin/datasets"]) ? "active" : ""}>
                  <FaDatabase /> Dataset Management
                </Link>
              </li>
              <li>
                <Link to="/admin/users" className={isCurrent("/admin/users") ? "active" : ""}>
                  <FaUserCog /> User Management
                </Link>
              </li>
              <li>
                <Link to="/admin/reports" className={isCurrent(["/admin/reports", "/admin/threat-reports"]) ? "active" : ""}>
                  <FaFileAlt /> Threat Reports
                </Link>
              </li>
              <li>
                <Link to="/admin/monitoring" className={isCurrent(["/admin/monitoring", "/admin/system-monitoring"]) ? "active" : ""}>
                  <FaDesktop /> System Monitoring
                </Link>
              </li>
              <li>
                <Link to="/admin/settings" className={isCurrent("/admin/settings") ? "active" : ""}>
                  <FaCog /> Settings
                </Link>
              </li>
              <li>
                <Link to="/admin/profile" className={isCurrent(["/admin/profile", "/profile"]) ? "active" : ""}>
                  <FaUser /> Profile
                </Link>
              </li>
            </>
          ) : (
            <>
              <li>
                <Link to="/analyst/dashboard" className={isCurrent(["/analyst/dashboard", "/analyst-dashboard"]) ? "active" : ""}>
                  <FaTachometerAlt /> Dashboard
                </Link>
              </li>
              <li>
                <Link to="/analyst/model-performance" className={isCurrent(["/analyst/model-performance", "/model-performance"]) ? "active" : ""}>
                  <FaBrain /> Model Performance
                </Link>
              </li>
              <li>
                <Link to="/analyst/anomaly-detection" className={isCurrent(["/analyst/anomaly-detection", "/anomaly-detection"]) ? "active" : ""}>
                  <FaRobot /> Anomaly Detection
                </Link>
              </li>
              <li>
                <Link to="/analyst/threat-classification" className={isCurrent(["/analyst/threat-classification", "/threats", "/analyst/threats"]) ? "active" : ""}>
                  <FaShieldAlt /> Threat Classification
                </Link>
              </li>
              <li>
                <Link to="/analyst/prediction-reports" className={isCurrent(["/analyst/prediction-reports", "/reports", "/analyst/reports"]) ? "active" : ""}>
                  <FaFileAlt /> Prediction Reports
                </Link>
              </li>
              <li>
                <Link to="/analyst/profile" className={isCurrent(["/analyst/profile", "/profile"]) ? "active" : ""}>
                  <FaUser /> Profile
                </Link>
              </li>
            </>
          )}
        </ul>
      </nav>

      <div className="sidebar-footer">
        <ul>
          <li>
            <a href="#logout" onClick={handleLogout} style={{ color: "#f87171" }}>
              <FaSignOutAlt /> Logout
            </a>
          </li>
        </ul>
      </div>
    </div>
  );
}

export default Sidebar;