import { FaBell, FaSearch, FaUserCircle } from "react-icons/fa";
import "../styles/topbar.css";

function Topbar({ title }) {
  const storedUser = JSON.parse(localStorage.getItem("netshield_user") || "{}");
  const username = storedUser.username || "Analyst";
  const role = storedUser.role || "Security Analyst";

  const displayTitle = title || (role === "Security Administrator" ? "Security Administrator Dashboard" : "Security Analyst Dashboard");

  return (
    <div className="topbar">
      <div className="topbar-left">
        <h2>{displayTitle}</h2>
      </div>

      <div className="topbar-right">
        <div className="system-status-badge">
          <span className="status-dot"></span>
          <span>System: Operational</span>
        </div>

        <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
          <FaBell style={{ fontSize: "1.1rem", color: "#94a3b8", cursor: "pointer" }} />
          <span
            style={{
              position: "absolute",
              top: "-4px",
              right: "-6px",
              background: "#ef4444",
              color: "white",
              borderRadius: "50%",
              width: "14px",
              height: "14px",
              fontSize: "0.65rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: "bold"
            }}
          >
            3
          </span>
        </div>

        <div className="user-badge">
          <FaUserCircle style={{ fontSize: "1.2rem", color: "#00f2fe" }} />
          <span style={{ fontWeight: "600" }}>{username}</span>
          <span className="user-role-tag">{role === "Security Administrator" ? "Admin" : "Analyst"}</span>
        </div>
      </div>
    </div>
  );
}

export default Topbar;