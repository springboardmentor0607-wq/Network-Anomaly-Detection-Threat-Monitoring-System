import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";

const API_URL = "http://127.0.0.1:8000";

function AIPredictions() {
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
      console.error("AI predictions error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();

    const interval = setInterval(fetchAlerts, 5000);

    return () => clearInterval(interval);
  }, []);

  const predictions = useMemo(() => {
    return [...alerts]
      .sort(
        (a, b) =>
          new Date(b?.timestamp || 0) -
          new Date(a?.timestamp || 0)
      )
      .slice(0, 20);
  }, [alerts]);

  const threatCount = alerts.filter(
    (alert) =>
      alert?.status === "Threat Detected"
  ).length;

  const normalCount = alerts.filter(
    (alert) =>
      alert?.status === "Normal"
  ).length;

  

  const averageConfidence = useMemo(() => {
    if (alerts.length === 0) return 0;

    const total = alerts.reduce(
      (sum, alert) =>
        sum +
        Number(
          alert?.confidence_value || 0
        ),
      0
    );

    return Math.round(total / alerts.length);
  }, [alerts]);

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
        Loading AI predictions...
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

      <div style={{ marginBottom: "30px" }}>
        <div
          style={{
            color: "#64748b",
            fontSize: "13px",
            letterSpacing: "2px",
          }}
        >
          INTELLIGENCE / AI PREDICTIONS
        </div>

        <h1
          style={{
            fontSize: "36px",
            margin: "8px 0",
          }}
        >
          AI Predictions
        </h1>

        <p style={{ color: "#94a3b8" }}>
          AI-powered analysis of real-time network
          security events.
        </p>
      </div>

      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
          padding: "10px 16px",
          borderRadius: "20px",
          background: "#172033",
          color: "#22c55e",
          marginBottom: "25px",
        }}
      >
        <span>●</span>
        AI PREDICTION ENGINE ACTIVE
      </div>

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
          <span style={{ color: "#94a3b8" }}>
            TOTAL PREDICTIONS
          </span>

          <h2>{alerts.length}</h2>
        </div>

        <div
          style={{
            background: "#1e293b",
            padding: "20px",
            borderRadius: "12px",
            border: "1px solid #334155",
          }}
        >
          <span style={{ color: "#94a3b8" }}>
            THREATS
          </span>

          <h2
            style={{ color: "#ef4444" }}
          >
            {threatCount}
          </h2>
        </div>

        <div
          style={{
            background: "#1e293b",
            padding: "20px",
            borderRadius: "12px",
            border: "1px solid #334155",
          }}
        >
          <span style={{ color: "#94a3b8" }}>
            NORMAL
          </span>

          <h2
            style={{ color: "#22c55e" }}
          >
            {normalCount}
          </h2>
        </div>

        <div
          style={{
            background: "#1e293b",
            padding: "20px",
            borderRadius: "12px",
            border: "1px solid #334155",
          }}
        >
          <span style={{ color: "#94a3b8" }}>
            AVG CONFIDENCE
          </span>

          <h2>
            {averageConfidence}%
          </h2>
        </div>

      </div>

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
            marginBottom: "20px",
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
              MACHINE LEARNING OUTPUT
            </div>

            <h2>
              Recent AI Predictions
            </h2>
          </div>

          <span style={{ color: "#94a3b8" }}>
            Auto refresh: 5s
          </span>

        </div>

        {predictions.length === 0 ? (

          <div
            style={{
              padding: "50px",
              textAlign: "center",
              color: "#94a3b8",
            }}
          >
            No AI predictions available.
          </div>

        ) : (

          <div
            style={{
              display: "grid",
              gap: "12px",
            }}
          >

            {predictions.map(
              (alert, index) => {

                const isThreat =
                  alert?.status ===
                  "Threat Detected";

                const risk =
                  Number(
                    alert?.risk_score || 0
                  );

                const confidence =
                  Number(
                    alert?.confidence_value || 0
                  );

                return (
                  <div
                    key={
                      alert?._id ||
                      alert?.timestamp ||
                      index
                    }
                    style={{
                      background: "#1e293b",
                      padding: "18px",
                      borderRadius: "10px",
                      borderLeft:
                        isThreat
                          ? "4px solid #ef4444"
                          : "4px solid #22c55e",
                    }}
                  >

                    <div
                      style={{
                        display: "flex",
                        justifyContent:
                          "space-between",
                        alignItems: "center",
                      }}
                    >

                      <div>
                        <h3
                          style={{
                            margin:
                              "0 0 8px 0",
                          }}
                        >
                          {alert?.threat_type ||
                            "Unknown"}
                        </h3>

                        <span
                          style={{
                            color:
                              isThreat
                                ? "#f87171"
                                : "#4ade80",
                          }}
                        >
                          {alert?.status}
                        </span>
                      </div>

                      <div
                        style={{
                          textAlign: "right",
                        }}
                      >
                        <strong>
                          Risk {risk}/100
                        </strong>

                        <div
                          style={{
                            color: "#94a3b8",
                            marginTop: "5px",
                          }}
                        >
                          Confidence{" "}
                          {confidence}%
                        </div>
                      </div>

                    </div>

                    <div
                      style={{
                        display: "flex",
                        gap: "25px",
                        marginTop: "15px",
                        color: "#94a3b8",
                        fontSize: "14px",
                        flexWrap: "wrap",
                      }}
                    >

                      <span>
                        Severity:{" "}
                        <strong>
                          {alert?.severity}
                        </strong>
                      </span>

                      <span>
                        Protocol:{" "}
                        <strong>
                          {alert?.protocol_type ||
                            "Unknown"}
                        </strong>
                      </span>

                      <span>
                        Service:{" "}
                        <strong>
                          {alert?.service ||
                            "Unknown"}
                        </strong>
                      </span>

                      <span>
                        Time:{" "}
                        <strong>
                          {alert?.timestamp
                            ? new Date(
                                alert.timestamp
                              ).toLocaleTimeString()
                            : "--"}
                        </strong>
                      </span>

                    </div>

                  </div>
                );
              }
            )}

          </div>

        )}

      </div>

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
          Milestone 3 • AI Predictions
        </span>
      </footer>

    </div>
  );
}

export default AIPredictions;