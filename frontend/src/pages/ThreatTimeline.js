import React, { useEffect, useState } from "react";
import axios from "axios";

const API_URL = "http://127.0.0.1:8000";

function ThreatTimeline() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAlerts = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/monitoring/live-alerts`
      );

      if (Array.isArray(response.data?.alerts)) {
        setAlerts(response.data.alerts);
      } else {
        setAlerts([]);
      }
    } catch (error) {
      console.error("Timeline error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();

    const interval = setInterval(
      fetchAlerts,
      5000
    );

    return () => clearInterval(interval);
  }, []);

  const timelineAlerts = [...alerts]
    .sort((a, b) => {
      return (
        new Date(b?.timestamp || 0) -
        new Date(a?.timestamp || 0)
      );
    })
    .slice(0, 20);

  const totalEvents = alerts.length;

  const threats = alerts.filter(
    (alert) =>
      alert?.status === "Threat Detected"
  ).length;

  const normal = alerts.filter(
    (alert) =>
      alert?.status === "Normal"
  ).length;

  const highRisk = alerts.filter(
    (alert) =>
      Number(alert?.risk_score || 0) >= 60
  ).length;

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#0f172a",
          color: "white",
          padding: "40px",
        }}
      >
        Loading threat timeline...
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0f172a",
        color: "white",
        padding: "30px",
      }}
    >

      {/* HEADER */}

      <div
        style={{
          marginBottom: "30px",
        }}
      >

        <div
          style={{
            color: "#64748b",
            fontSize: "13px",
            letterSpacing: "2px",
            marginBottom: "8px",
          }}
        >
          SECURITY / TIMELINE
        </div>

        <h1
          style={{
            margin: 0,
            fontSize: "36px",
          }}
        >
          Threat Timeline
        </h1>

        <p
          style={{
            color: "#94a3b8",
            fontSize: "16px",
          }}
        >
          Real-time visualization of detected
          network security events.
        </p>

      </div>

      {/* LIVE STATUS */}

      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
          background: "#172033",
          padding: "10px 16px",
          borderRadius: "20px",
          marginBottom: "25px",
          color: "#22c55e",
        }}
      >
        <span>●</span>
        LIVE MONITORING
      </div>

      {/* STATISTICS */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(4, 1fr)",
          gap: "15px",
          marginBottom: "30px",
        }}
      >

        <div
          style={{
            background: "#1e293b",
            padding: "20px",
            borderRadius: "12px",
            border: "1px solid #334155",
          }}
        >
          <div
            style={{
              color: "#94a3b8",
            }}
          >
            TOTAL EVENTS
          </div>

          <strong
            style={{
              fontSize: "30px",
            }}
          >
            {totalEvents}
          </strong>
        </div>

        <div
          style={{
            background: "#1e293b",
            padding: "20px",
            borderRadius: "12px",
            border: "1px solid #334155",
          }}
        >
          <div
            style={{
              color: "#94a3b8",
            }}
          >
            THREATS
          </div>

          <strong
            style={{
              fontSize: "30px",
              color: "#ef4444",
            }}
          >
            {threats}
          </strong>
        </div>

        <div
          style={{
            background: "#1e293b",
            padding: "20px",
            borderRadius: "12px",
            border: "1px solid #334155",
          }}
        >
          <div
            style={{
              color: "#94a3b8",
            }}
          >
            NORMAL
          </div>

          <strong
            style={{
              fontSize: "30px",
              color: "#22c55e",
            }}
          >
            {normal}
          </strong>
        </div>

        <div
          style={{
            background: "#1e293b",
            padding: "20px",
            borderRadius: "12px",
            border: "1px solid #334155",
          }}
        >
          <div
            style={{
              color: "#94a3b8",
            }}
          >
            HIGH RISK
          </div>

          <strong
            style={{
              fontSize: "30px",
              color: "#f97316",
            }}
          >
            {highRisk}
          </strong>
        </div>

      </div>

      {/* TIMELINE */}

      <div
        style={{
          background: "#111827",
          padding: "25px",
          borderRadius: "15px",
          border: "1px solid #334155",
        }}
      >

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "25px",
          }}
        >

          <div>

            <div
              style={{
                color: "#64748b",
                fontSize: "12px",
                letterSpacing: "2px",
              }}
            >
              SECURITY EVENTS
            </div>

            <h2>
              Network Threat Timeline
            </h2>

          </div>

          <span
            style={{
              color: "#94a3b8",
            }}
          >
            Auto refresh: 5s
          </span>

        </div>

        {timelineAlerts.length === 0 ? (

          <div
            style={{
              padding: "50px",
              textAlign: "center",
              color: "#94a3b8",
            }}
          >
            No security events available.
          </div>

        ) : (

          <div
            style={{
              display: "grid",
              gap: "15px",
            }}
          >

            {timelineAlerts.map(
              (alert, index) => {

                const isThreat =
                  alert?.status ===
                  "Threat Detected";

                const risk =
                  Number(
                    alert?.risk_score || 0
                  );

                return (

                  <div
                    key={
                      alert?._id ||
                      alert?.timestamp ||
                      index
                    }
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "130px 1fr",
                      gap: "20px",
                      padding: "18px",
                      background: "#1e293b",
                      borderRadius: "10px",
                      borderLeft:
                        isThreat
                          ? "4px solid #ef4444"
                          : "4px solid #22c55e",
                    }}
                  >

                    {/* TIME */}

                    <div>

                      <strong>
                        {alert?.timestamp
                          ? new Date(
                              alert.timestamp
                            ).toLocaleTimeString()
                          : "--"}
                      </strong>

                      <div
                        style={{
                          color: "#64748b",
                          marginTop: "5px",
                          fontSize: "12px",
                        }}
                      >
                        {alert?.timestamp
                          ? new Date(
                              alert.timestamp
                            ).toLocaleDateString()
                          : "--"}
                      </div>

                    </div>

                    {/* EVENT */}

                    <div>

                      <div
                        style={{
                          display: "flex",
                          justifyContent:
                            "space-between",
                          alignItems: "center",
                          marginBottom: "8px",
                        }}
                      >

                        <strong
                          style={{
                            fontSize: "18px",
                          }}
                        >
                          {alert?.threat_type ||
                            "Network Event"}
                        </strong>

                        <span
                          style={{
                            padding:
                              "5px 10px",
                            borderRadius: "15px",
                            background:
                              isThreat
                                ? "#451a1a"
                                : "#14351f",
                            color:
                              isThreat
                                ? "#f87171"
                                : "#4ade80",
                            fontSize: "12px",
                          }}
                        >
                          {alert?.severity ||
                            "Low"}
                        </span>

                      </div>

                      <div
                        style={{
                          display: "flex",
                          gap: "25px",
                          flexWrap: "wrap",
                          color: "#94a3b8",
                          fontSize: "14px",
                        }}
                      >

                        <span>
                          Risk Score:{" "}
                          <strong
                            style={{
                              color:
                                risk >= 60
                                  ? "#f87171"
                                  : "#4ade80",
                            }}
                          >
                            {risk}/100
                          </strong>
                        </span>

                        <span>
                          Confidence:{" "}
                          <strong>
                            {alert?.confidence ||
                              `${alert?.confidence_value || 0}%`}
                          </strong>
                        </span>

                        <span>
                          Status:{" "}
                          <strong>
                            {alert?.status ||
                              "Unknown"}
                          </strong>
                        </span>

                        <span>
                          Protocol:{" "}
                          <strong>
                            {alert?.protocol_type ||
                              "Unknown"}
                          </strong>
                        </span>

                      </div>

                    </div>

                  </div>

                );
              }
            )}

          </div>

        )}

      </div>

      {/* FOOTER */}

      <footer
        style={{
          marginTop: "30px",
          padding: "20px 0",
          color: "#64748b",
          display: "flex",
          justifyContent: "space-between",
        }}
      >

        <strong>
          🛡️ NetShield AI
        </strong>

        <span>
          Milestone 3 • Threat Timeline
        </span>

      </footer>

    </div>
  );
}

export default ThreatTimeline;