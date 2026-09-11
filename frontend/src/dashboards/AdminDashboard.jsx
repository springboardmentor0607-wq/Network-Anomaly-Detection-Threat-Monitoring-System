import { NavLink, Outlet, useNavigate } from "react-router-dom";
import "./AdminDashboard.css";

function AdminDashboard() {
  const navigate = useNavigate();

  const handleLogout = () => {
    const confirmLogout = window.confirm(
      "Are you sure you want to logout?"
    );

    if (confirmLogout) {
      navigate("/");
    }
  };

  const navItems = [
    {
      path: "/admin/dashboard",
      label: "📊 Dashboard",
    },
    {
      path: "/admin/users",
      label: "👥 User Management",
    },
    {
      path: "/admin/roles",
      label: "🛡 Role Management",
    },
    {
      path: "/admin/organization",
      label: "🏢 Organization",
    },
    {
      path: "/admin/alerts",
      label: "🚨 Threat Alerts",
    },
    {
      path: "/admin/audit",
      label: "📜 Audit Logs",
    },
    {
      path: "/admin/reports",
      label: "📄 Reports",
    },
    {
      path: "/admin/settings",
      label: "⚙️ Settings",
    },
  ];

  return (
    <div className="admin-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="logo">
          <h2>🛡 NetShield AI</h2>
          <p>Administrator Panel</p>
        </div>

        <nav>
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                isActive ? "active-link" : ""
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <button
          type="button"
          className="logout-btn"
          onClick={handleLogout}
        >
          🚪 Logout
        </button>
      </aside>

      {/* Page Content */}
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}

export default AdminDashboard;