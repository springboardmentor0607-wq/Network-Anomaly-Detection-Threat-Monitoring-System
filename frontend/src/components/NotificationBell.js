
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./NotificationBell.css";

const API_URL = "http://127.0.0.1:8000";

function NotificationBell() {
  const navigate = useNavigate();

  const [alerts, setAlerts] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // ============================================================
  // GET ALERTS
  // ============================================================

  const fetchNotifications = async () => {
    try {
      setLoading(true);

      const response = await axios.get(
        `${API_URL}/alerts/`
      );

      const alertList = response.data?.alerts || [];

      // Show newest alerts first
      setAlerts(alertList.slice(0, 10));

    } catch (error) {
      console.error(
        "Notification error:",
        error
      );
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // AUTO REFRESH
  // ============================================================

  useEffect(() => {

    fetchNotifications();

    const interval = setInterval(
      fetchNotifications,
      5000
    );

    return () => {
      clearInterval(interval);
    };

  }, []);

  // ============================================================
  // UNREAD COUNT
  // ============================================================

  const unreadCount = alerts.filter(
    (alert) =>
      !alert.workflow_status ||
      alert.workflow_status === "New"
  ).length;

  // ============================================================
  // FORMAT DATE
  // ============================================================

  const formatDate = (timestamp) => {

    if (!timestamp) {
      return "Unknown time";
    }

    try {
      return new Date(
        timestamp
      ).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch {
      return "Unknown time";
    }
  };

  // ============================================================
  // THREAT ICON
  // ============================================================

  const getThreatIcon = (alert) => {

    const severity =
      alert.severity?.toLowerCase();

    if (severity === "critical") {
      return "🔴";
    }

    if (severity === "high") {
      return "🟠";
    }

    if (severity === "medium") {
      return "🟡";
    }

    return "🔵";
  };

  // ============================================================
  // NOTIFICATION TITLE
  // ============================================================

  const getNotificationTitle = (alert) => {

    if (
      alert.workflow_status ===
      "Resolved"
    ) {
      return "Alert Resolved";
    }

    if (
      alert.workflow_status ===
      "Investigating"
    ) {
      return "Investigation Started";
    }

    if (
      alert.workflow_status ===
      "Acknowledged"
    ) {
      return "Alert Acknowledged";
    }

    if (
      alert.status ===
      "Threat Detected"
    ) {
      return "Critical Threat Detected";
    }

    return "Network Alert";
  };

  // ============================================================
  // CLICK NOTIFICATION
  // ============================================================

  const openInvestigation = (alert) => {

    if (!alert.id) {
      return;
    }

    setOpen(false);

    navigate(
      `/investigation?alertId=${encodeURIComponent(
        alert.id
      )}`
    );
  };

  // ============================================================
  // UI
  // ============================================================

  return (
    <div className="notification-wrapper">

      {/* BELL */}

      <button
        className="notification-button"
        onClick={() =>
          setOpen((previous) => !previous)
        }
        aria-label="Security notifications"
      >

        <span className="notification-icon">
          🔔
        </span>

        {unreadCount > 0 && (
          <span className="notification-count">
            {unreadCount > 99
              ? "99+"
              : unreadCount}
          </span>
        )}

      </button>


      {/* PANEL */}

      {open && (

        <div className="notification-panel">

          <div className="notification-header">

            <div>
              <span className="notification-label">
                SECURITY CENTER
              </span>

              <h3>
                Notifications
              </h3>
            </div>

            <span className="live-indicator">
              ● LIVE
            </span>

          </div>


          {/* LOADING */}

          {loading && alerts.length === 0 && (

            <div className="notification-empty">
              Loading security events...
            </div>

          )}


          {/* EMPTY */}

          {!loading &&
            alerts.length === 0 && (

              <div className="notification-empty">

                <div className="empty-bell">
                  🔔
                </div>

                <strong>
                  No security alerts
                </strong>

                <p>
                  Your network is currently
                  clear.
                </p>

              </div>

            )}


          {/* ALERT LIST */}

          {alerts.length > 0 && (

            <div className="notification-list">

              {alerts.map((alert) => (

                <button
                  key={alert.id}
                  className="notification-item"
                  onClick={() =>
                    openInvestigation(
                      alert
                    )
                  }
                >

                  <div className="notification-threat-icon">
                    {getThreatIcon(alert)}
                  </div>


                  <div className="notification-content">

                    <div className="notification-title">

                      {getNotificationTitle(
                        alert
                      )}

                    </div>


                    <div className="notification-description">

                      {alert.threat_type ||
                        "Network Activity"}

                    </div>


                    <div className="notification-meta">

                      <span>
                        Risk{" "}
                        {alert.risk_score ?? 0}
                        /100
                      </span>

                      <span>
                        {formatDate(
                          alert.timestamp
                        )}
                      </span>

                    </div>

                  </div>


                  <span className="notification-arrow">
                    →
                  </span>

                </button>

              ))}

            </div>

          )}


          {/* FOOTER */}

          <button
            className="notification-footer"
            onClick={() => {
              setOpen(false);
              navigate(
                "/threat-alerts"
              );
            }}
          >
            View All Security Alerts →
          </button>

        </div>

      )}

    </div>
  );
}

export default NotificationBell;

