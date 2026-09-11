import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaBell, FaUserCircle, FaExclamationTriangle, FaCheckDouble, FaShieldAlt, FaExternalLinkAlt, FaTimes } from "react-icons/fa";
import { API_BASE_URL } from "../config";
import "../styles/topbar.css";


function Topbar({ title }) {
  const navigate = useNavigate();
  const storedUser = JSON.parse(localStorage.getItem("netshield_user") || "{}");
  const username = storedUser.username || "Analyst";
  const role = storedUser.role || "Security Analyst";

  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notificationsList, setNotificationsList] = useState([]);
  const [loadingNotifs, setLoadingNotifs] = useState(false);

  const displayTitle = title || (role === "Security Administrator" ? "Security Administrator Dashboard" : "Security Analyst Dashboard");

  const fetchUnreadCount = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/notifications/unread-count`);
      if (res.ok) {
        const data = await res.json();
        setUnreadCount(data.unread_count || 0);
      }
    } catch (err) {
      console.log("Error fetching unread count:", err);
    }
  };

  const fetchNotificationsList = async () => {
    setLoadingNotifs(true);
    try {
      const res = await fetch(`${API_BASE_URL}/notifications?limit=20`);
      if (res.ok) {
        const data = await res.json();
        setNotificationsList(data);
      }
    } catch (err) {
      console.log("Error fetching notifications list:", err);
    } finally {
      setLoadingNotifs(false);
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 5000);

    const handleCustomUpdate = () => {
      fetchUnreadCount();
      if (showNotifications) {
        fetchNotificationsList();
      }
    };

    window.addEventListener("netshield_notification_updated", handleCustomUpdate);

    return () => {
      clearInterval(interval);
      window.removeEventListener("netshield_notification_updated", handleCustomUpdate);
    };
  }, [showNotifications]);

  const toggleNotifications = () => {
    const nextState = !showNotifications;
    setShowNotifications(nextState);
    if (nextState) {
      fetchNotificationsList();
    }
  };

  const handleMarkAsRead = async (notifId) => {
    try {
      await fetch(`${API_BASE_URL}/notifications/${notifId}/read`, {
        method: "PATCH"
      });
      fetchUnreadCount();
      fetchNotificationsList();
    } catch (err) {
      console.error("Error marking notification read:", err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await fetch(`${API_BASE_URL}/notifications/mark-all-read`, {
        method: "POST"
      });
      fetchUnreadCount();
      fetchNotificationsList();
    } catch (err) {
      console.error("Error marking all read:", err);
    }
  };

  const handleViewIncident = (incId, notifId) => {
    if (notifId) handleMarkAsRead(notifId);
    setShowNotifications(false);
    const basePath = role === "Security Administrator" ? "/admin/incidents" : "/analyst/incidents";
    if (incId) {
      navigate(`${basePath}?id=${incId}`);
    } else {
      navigate(basePath);
    }
  };

  const getSeverityBadge = (sev) => {
    switch ((sev || "").toLowerCase()) {
      case "critical": return <span className="badge badge-critical" style={{ fontSize: "0.65rem", padding: "2px 6px" }}>CRITICAL</span>;
      case "high": return <span className="badge badge-high" style={{ fontSize: "0.65rem", padding: "2px 6px" }}>HIGH</span>;
      case "medium": return <span className="badge badge-medium" style={{ fontSize: "0.65rem", padding: "2px 6px" }}>MEDIUM</span>;
      case "low": default: return <span className="badge badge-low" style={{ fontSize: "0.65rem", padding: "2px 6px" }}>LOW</span>;
    }
  };

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

        {/* Bell Icon & Notification Trigger Container */}
        <div className="notification-bell-container" style={{ position: "relative" }}>
          <button
            id="notification-bell-btn"
            className="notification-bell-btn"
            onClick={toggleNotifications}
            title="Security Notifications Center"
            style={{
              position: "relative",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "6px 14px",
              background: showNotifications ? "rgba(0, 242, 254, 0.15)" : unreadCount > 0 ? "rgba(245, 158, 11, 0.1)" : "#1e293b",
              border: showNotifications ? "1px solid #00f2fe" : unreadCount > 0 ? "1px solid rgba(245, 158, 11, 0.5)" : "1px solid #334155",
              borderRadius: "20px",
              color: showNotifications ? "#00f2fe" : "#f8fafc",
              cursor: "pointer",
              fontSize: "0.85rem",
              fontWeight: "600",
              transition: "all 0.2s ease"
            }}
          >
            <FaBell
              style={{
                fontSize: "1.1rem",
                color: unreadCount > 0 ? "#f59e0b" : "#00f2fe",
                animation: unreadCount > 0 ? "bell-ring 2s infinite" : "none"
              }}
            />
            <span>Notifications</span>
            {unreadCount > 0 ? (
              <span
                style={{
                  background: "#ef4444",
                  color: "white",
                  borderRadius: "10px",
                  padding: "1px 7px",
                  fontSize: "0.72rem",
                  fontWeight: "800",
                  boxShadow: "0 0 8px rgba(239, 68, 68, 0.6)"
                }}
              >
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            ) : (
              <span
                style={{
                  background: "rgba(100, 116, 139, 0.3)",
                  color: "#94a3b8",
                  borderRadius: "10px",
                  padding: "1px 6px",
                  fontSize: "0.72rem"
                }}
              >
                0
              </span>
            )}
          </button>

          {/* Notification Dropdown Drawer Panel */}
          {showNotifications && (
            <div
              style={{
                position: "absolute",
                top: "calc(100% + 10px)",
                right: "0",
                width: "420px",
                maxWidth: "calc(100vw - 32px)",
                maxHeight: "80vh",
                background: "#1e293b",
                border: "1px solid #334155",
                borderRadius: "12px",
                boxShadow: "0 20px 35px -5px rgba(0, 0, 0, 0.85), 0 0 15px rgba(0, 242, 254, 0.15)",
                zIndex: 99999,
                overflow: "hidden",
                display: "flex",
                flexDirection: "column"
              }}
            >
          {/* Header */}
          <div
            style={{
              padding: "14px 16px",
              background: "#0f172a",
              borderBottom: "1px solid #334155",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <FaBell style={{ color: "#00f2fe" }} />
              <strong style={{ color: "#f8fafc", fontSize: "0.95rem" }}>Security Notifications</strong>
              {unreadCount > 0 && (
                <span style={{ background: "rgba(239, 68, 68, 0.2)", color: "#fca5a5", fontSize: "0.72rem", padding: "2px 6px", borderRadius: "10px", fontWeight: "bold" }}>
                  {unreadCount} Unread
                </span>
              )}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  title="Mark All as Read"
                  style={{
                    background: "none",
                    border: "none",
                    color: "#38bdf8",
                    fontSize: "0.78rem",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px"
                  }}
                >
                  <FaCheckDouble /> Read All
                </button>
              )}
              <button
                onClick={() => setShowNotifications(false)}
                style={{ background: "none", border: "none", color: "#94a3b8", fontSize: "1rem", cursor: "pointer" }}
              >
                <FaTimes />
              </button>
            </div>
          </div>

          {/* List Content */}
          <div style={{ overflowY: "auto", flex: 1, padding: "8px" }}>
            {loadingNotifs ? (
              <div style={{ padding: "20px", textAlign: "center", color: "#94a3b8", fontSize: "0.85rem" }}>
                Loading notifications...
              </div>
            ) : notificationsList.length > 0 ? (
              notificationsList.map((notif, idx) => {
                const isUnread = notif.status === "Unread";
                const isCritical = (notif.severity || "").toLowerCase() === "critical";
                const alertIdDisplay = notif.alert_id || (notif.id ? `ALERT-${String(notif.id).padStart(4, '0')}` : "ALERT-0000");

                return (
                  <div
                    key={notif.id || idx}
                    onClick={() => handleViewIncident(notif.incident_id, notif.notification_id || notif.id)}
                    style={{
                      padding: "12px",
                      borderRadius: "8px",
                      marginBottom: "8px",
                      background: isUnread ? "rgba(30, 41, 59, 0.95)" : "#0f172a",
                      borderLeft: isCritical ? "4px solid #ef4444" : isUnread ? "4px solid #00f2fe" : "4px solid #475569",
                      border: "1px solid rgba(255,255,255,0.07)",
                      cursor: "pointer",
                      transition: "transform 0.15s ease, background 0.15s ease"
                    }}
                  >
                    {/* Header Row: Threat Title & Severity */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <FaExclamationTriangle style={{ color: isCritical ? "#ef4444" : "#f59e0b", fontSize: "0.85rem" }} />
                        <strong style={{ fontSize: "0.88rem", color: "#f8fafc" }}>
                          {notif.severity ? `${notif.severity} Security Alert` : "Security Alert"} – {notif.attack_type}
                        </strong>
                      </div>
                      {getSeverityBadge(notif.severity)}
                    </div>

                    {/* Alert ID & Risk Score Line */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.78rem", color: "#94a3b8", marginBottom: "6px" }}>
                      <span>
                        Alert: <strong style={{ color: "#00f2fe", fontFamily: "var(--font-mono)" }}>{alertIdDisplay}</strong>
                        {notif.incident_id && (
                          <span style={{ marginLeft: "8px" }}>
                            | Incident: <strong style={{ color: "#38bdf8", fontFamily: "var(--font-mono)" }}>{notif.incident_id}</strong>
                          </span>
                        )}
                      </span>
                      <span style={{ background: "rgba(239, 68, 68, 0.15)", color: "#fca5a5", padding: "1px 6px", borderRadius: "4px", fontWeight: "bold", fontSize: "0.72rem" }}>
                        Risk: {notif.risk_score !== undefined ? notif.risk_score : 70}/100
                      </span>
                    </div>

                    {/* Source IP -> Destination IP */}
                    <div style={{ fontSize: "0.8rem", color: "#cbd5e1", fontFamily: "var(--font-mono)", background: "rgba(0,0,0,0.2)", padding: "4px 8px", borderRadius: "4px", marginBottom: "6px" }}>
                      <strong style={{ color: "#38bdf8" }}>{notif.source_ip || "192.168.1.10"}</strong>
                      <span style={{ margin: "0 6px", color: "#64748b" }}>→</span>
                      <strong style={{ color: "#a78bfa" }}>{notif.dest_ip || "10.0.0.1"}</strong>
                    </div>

                    {/* Footer Row: Timestamp, Read/Unread Badge & Action Buttons */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.75rem", marginTop: "6px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span
                          style={{
                            fontSize: "0.68rem",
                            padding: "1px 6px",
                            borderRadius: "4px",
                            fontWeight: "bold",
                            background: isUnread ? "rgba(0, 242, 254, 0.15)" : "rgba(100, 116, 139, 0.2)",
                            color: isUnread ? "#00f2fe" : "#94a3b8",
                            border: isUnread ? "1px solid rgba(0, 242, 254, 0.4)" : "1px solid rgba(100, 116, 139, 0.3)"
                          }}
                        >
                          {isUnread ? "UNREAD" : "READ"}
                        </span>
                        <span style={{ color: "#64748b", fontFamily: "var(--font-mono)" }}>
                          {notif.timestamp ? notif.timestamp : ""}
                        </span>
                      </div>

                      <div style={{ display: "flex", gap: "6px" }}>
                        {isUnread && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMarkAsRead(notif.notification_id || notif.id);
                            }}
                            style={{
                              padding: "2px 6px",
                              background: "rgba(255,255,255,0.08)",
                              border: "1px solid #475569",
                              color: "#cbd5e1",
                              borderRadius: "4px",
                              fontSize: "0.72rem",
                              cursor: "pointer"
                            }}
                          >
                            Mark Read
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewIncident(notif.incident_id, notif.notification_id || notif.id);
                          }}
                          style={{
                            padding: "2px 8px",
                            background: "rgba(0, 242, 254, 0.15)",
                            border: "1px solid #00f2fe",
                            color: "#00f2fe",
                            borderRadius: "4px",
                            fontSize: "0.72rem",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "3px"
                          }}
                        >
                          View Incident <FaExternalLinkAlt style={{ fontSize: "0.65rem" }} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div style={{ padding: "24px", textAlign: "center", color: "#64748b", fontSize: "0.85rem" }}>
                <FaShieldAlt style={{ fontSize: "1.4rem", marginBottom: "6px", display: "block", margin: "0 auto 6px" }} />
                No security notifications yet.
              </div>
            )}
          </div>
        </div>
      )}
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