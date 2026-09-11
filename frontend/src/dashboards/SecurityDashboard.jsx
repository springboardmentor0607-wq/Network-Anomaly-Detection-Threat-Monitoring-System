import { NavLink, Outlet, useNavigate } from "react-router-dom";
import "./SecurityDashboard.css";

function SecurityDashboard() {
  const navigate = useNavigate();

  const handleLogout = () => {
    const confirmLogout = window.confirm(
      "Are you sure you want to logout?"
    );

    if (confirmLogout) {
      navigate("/");
    }
  };

  return (
    <div className="security-container">

      {/* ===========================
          SIDEBAR
      =========================== */}

      <aside className="security-sidebar">

        <div className="logo">
          <h2>🛡 NetShield AI</h2>
          <p>Security Analyst Panel</p>
        </div>

        <nav>

          {/* Dashboard */}
          <NavLink
            to="/security/dashboard"
            className={({ isActive }) =>
              isActive ? "active-link" : ""
            }
          >
            📊 Dashboard
          </NavLink>

          {/* Live Network */}
          <NavLink
            to="/security/network"
            className={({ isActive }) =>
              isActive ? "active-link" : ""
            }
          >
            🌐 Live Network
          </NavLink>

          {/* Threat Analysis */}
          <NavLink
            to="/security/threats"
            className={({ isActive }) =>
              isActive ? "active-link" : ""
            }
          >
            🚨 Threat Analysis
          </NavLink>

          {/* Incident Investigation */}
          <NavLink
            to="/security/incidents"
            className={({ isActive }) =>
              isActive ? "active-link" : ""
            }
          >
            🔍 Incident Investigation
          </NavLink>

          {/* AI Predictions */}
          <NavLink
            to="/security/ai"
            className={({ isActive }) =>
              isActive ? "active-link" : ""
            }
          >
            🤖 AI Predictions
          </NavLink>

          {/* Threat Timeline */}
          <NavLink
            to="/security/timeline"
            className={({ isActive }) =>
              isActive ? "active-link" : ""
            }
          >
            📈 Threat Timeline
          </NavLink>

          {/* Reports */}
          <NavLink
            to="/security/reports"
            className={({ isActive }) =>
              isActive ? "active-link" : ""
            }
          >
            📄 Reports
          </NavLink>

          {/* PCAP Analytics */}
          <NavLink
            to="/security/pcap"
            className={({ isActive }) =>
              isActive ? "active-link" : ""
            }
          >
            🧪 PCAP Analytics
          </NavLink>

        </nav>

        {/* ===========================
            LOGOUT
        =========================== */}

        <div className="sidebar-footer">
          <button
            className="logout-btn"
            onClick={handleLogout}
          >
            🚪 Logout
          </button>
        </div>

      </aside>

      {/* ===========================
          MAIN CONTENT
      =========================== */}

      <main className="security-main">
        <Outlet />
      </main>

    </div>
  );
}

export default SecurityDashboard;