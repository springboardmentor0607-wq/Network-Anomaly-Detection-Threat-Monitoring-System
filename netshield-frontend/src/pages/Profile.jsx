import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import {
  FaUserCircle,
  FaEdit,
  FaSignOutAlt,
  FaEnvelope,
  FaUserTag,
  FaClock,
  FaShieldAlt,
  FaSave,
  FaCheckCircle,
  FaIdBadge
} from "react-icons/fa";
import "../styles/Dashboard.css";

function Profile() {
  const navigate = useNavigate();
  const location = useLocation();
  const storedUser = JSON.parse(localStorage.getItem("netshield_user") || "{}");

  const isAdminRoute = location.pathname.startsWith("/admin");
  const userRole = storedUser.role || (isAdminRoute ? "Security Administrator" : "Security Analyst");

  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    fullName: storedUser.fullName || storedUser.username || "SOC User",
    userId: storedUser.username || storedUser.email?.split("@")[0] || "NS-89201",
    email: storedUser.email || "user@netshield.ai",
    role: userRole,
    lastLogin: storedUser.lastLogin || new Date().toLocaleString(),
    accountStatus: "Active"
  });

  const handleSave = (e) => {
    e.preventDefault();
    const updated = {
      ...storedUser,
      fullName: profileData.fullName,
      email: profileData.email,
      username: profileData.userId
    };
    localStorage.setItem("netshield_user", JSON.stringify(updated));
    setIsEditing(false);
    alert("Profile information updated successfully!");
  };

  const handleLogout = () => {
    localStorage.removeItem("netshield_user");
    navigate("/login");
  };

  return (
    <div className="soc-layout">
      <Sidebar role={userRole} />
      <Topbar title="User Profile & Account Security" />

      <div className="soc-main-content">
        <div className="dashboard-header">
          <div>
            <h1 className="dashboard-title">
              👤 User Profile
            </h1>
            <p className="dashboard-subtitle">
              Account Identity Credentials, Role Assignment & Session Details
            </p>
          </div>

          <button onClick={handleLogout} className="soc-btn-primary" style={{ background: "#ef4444", color: "white" }}>
            <FaSignOutAlt /> Sign Out
          </button>
        </div>

        <div className="soc-grid-2">
          {/* Profile Badge Card */}
          <div className="soc-card" style={{ textAlign: "center", padding: "36px 20px" }}>
            <div style={{ position: "relative", display: "inline-block", marginBottom: "16px" }}>
              <FaUserCircle style={{ fontSize: "5.5rem", color: userRole === "Security Administrator" ? "#c084fc" : "#00f2fe" }} />
              <span
                style={{
                  position: "absolute",
                  bottom: "4px",
                  right: "4px",
                  background: "#10b981",
                  border: "2px solid #0f172a",
                  borderRadius: "50%",
                  width: "18px",
                  height: "18px"
                }}
              ></span>
            </div>

            <h2 style={{ color: "#f8fafc", fontSize: "1.4rem", marginBottom: "4px" }}>
              {profileData.fullName}
            </h2>
            <p style={{ color: "#38bdf8", fontWeight: "600", fontSize: "0.92rem", marginBottom: "16px" }}>
              ID: {profileData.userId}
            </p>

            <span className="badge badge-normal" style={{ fontSize: "0.85rem", padding: "6px 16px", borderRadius: "20px" }}>
              🛡️ {profileData.role}
            </span>

            <hr style={{ borderColor: "#1e293b", margin: "24px 0" }} />

            <div style={{ display: "flex", flexDirection: "column", gap: "12px", textAlign: "left", fontSize: "0.9rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "#cbd5e1" }}>
                <FaEnvelope style={{ color: "#38bdf8" }} />
                <span>{profileData.email}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "#cbd5e1" }}>
                <FaUserTag style={{ color: "#818cf8" }} />
                <span>Role: {profileData.role}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "#cbd5e1" }}>
                <FaClock style={{ color: "#f59e0b" }} />
                <span>Last Login: {profileData.lastLogin}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "#cbd5e1" }}>
                <FaCheckCircle style={{ color: "#34d399" }} />
                <span>Account Status: <strong style={{ color: "#34d399" }}>{profileData.accountStatus}</strong></span>
              </div>
            </div>
          </div>

          {/* Profile Details & Edit Card */}
          <div className="soc-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ fontSize: "1.1rem", color: "#f8fafc", display: "flex", alignItems: "center", gap: "8px" }}>
                <FaShieldAlt style={{ color: "#00f2fe" }} /> Identity & Account Information
              </h3>
              <button
                onClick={() => setIsEditing(!isEditing)}
                style={{
                  background: "none",
                  border: "1px solid #334155",
                  color: "#38bdf8",
                  padding: "6px 12px",
                  borderRadius: "6px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "0.85rem"
                }}
              >
                <FaEdit /> {isEditing ? "Cancel" : "Edit Profile"}
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div className="form-group" style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "0.85rem", color: "#94a3b8", marginBottom: "6px" }}>Full Name</label>
                <input
                  type="text"
                  value={profileData.fullName}
                  disabled={!isEditing}
                  onChange={(e) => setProfileData({ ...profileData, fullName: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    background: "#0f172a",
                    border: "1px solid #334155",
                    borderRadius: "8px",
                    color: "#f8fafc",
                    outline: "none"
                  }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "0.85rem", color: "#94a3b8", marginBottom: "6px" }}>Email Address</label>
                <input
                  type="email"
                  value={profileData.email}
                  disabled={!isEditing}
                  onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    background: "#0f172a",
                    border: "1px solid #334155",
                    borderRadius: "8px",
                    color: "#f8fafc",
                    outline: "none"
                  }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "0.85rem", color: "#94a3b8", marginBottom: "6px" }}>User ID</label>
                <input
                  type="text"
                  value={profileData.userId}
                  disabled={!isEditing}
                  onChange={(e) => setProfileData({ ...profileData, userId: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    background: "#0f172a",
                    border: "1px solid #334155",
                    borderRadius: "8px",
                    color: "#f8fafc",
                    outline: "none",
                    fontFamily: "var(--font-mono)"
                  }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "0.85rem", color: "#94a3b8", marginBottom: "6px" }}>Role</label>
                <input
                  type="text"
                  value={profileData.role}
                  disabled={true}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    background: "#0f172a",
                    border: "1px solid #334155",
                    borderRadius: "8px",
                    color: "#f8fafc",
                    opacity: 0.7,
                    cursor: "not-allowed"
                  }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", fontSize: "0.85rem", color: "#94a3b8", marginBottom: "6px" }}>Account Status</label>
                <input
                  type="text"
                  value={profileData.accountStatus}
                  disabled={true}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    background: "#0f172a",
                    border: "1px solid #334155",
                    borderRadius: "8px",
                    color: "#34d399",
                    fontWeight: "600",
                    opacity: 0.85,
                    cursor: "not-allowed"
                  }}
                />
              </div>

              {isEditing && (
                <button type="submit" className="soc-btn-primary" style={{ width: "100%" }}>
                  <FaSave /> Save Profile Changes
                </button>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;
