import { useEffect, useState } from "react";
import axios from "axios";
import "./SecurityDashboard.css";

const API_BASE_URL = "http://127.0.0.1:8000";

function IncidentInvestigationPage() {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);
  const [error, setError] = useState("");

  // ============================================================
  // LOAD INCIDENTS
  // ============================================================

  const loadIncidents = async () => {
    try {
      setError("");

      const response = await axios.get(
        `${API_BASE_URL}/dashboard/incidents`
      );

      setIncidents(response.data.incidents || []);
    } catch (error) {
      console.error(
        "Failed to load incidents:",
        error
      );

      setError(
        "Unable to load security incidents."
      );
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // INITIAL LOAD + AUTO REFRESH
  // ============================================================

  useEffect(() => {
    loadIncidents();

    const interval = setInterval(
      loadIncidents,
      10000
    );

    return () => clearInterval(interval);
  }, []);

  // ============================================================
  // UPDATE INCIDENT STATUS
  // ============================================================

  const updateStatus = async (
    incident,
    newStatus
  ) => {
    if (!incident._id) {
      alert("Incident ID is not available.");
      return;
    }

    try {
      setUpdating(incident._id);
      setError("");

      await axios.put(
        `${API_BASE_URL}/dashboard/incidents/${incident._id}`,
        null,
        {
          params: {
            status: newStatus,
          },
        }
      );

      await loadIncidents();
    } catch (error) {
      console.error(
        "Failed to update incident:",
        error
      );

      alert(
        "Failed to update incident status."
      );
    } finally {
      setUpdating(null);
    }
  };

  // ============================================================
  // CALCULATE KPIs
  // ============================================================

  const totalIncidents = incidents.length;

  const openIncidents = incidents.filter(
    (item) => item.status === "Open"
  ).length;

  const acknowledgedIncidents =
    incidents.filter(
      (item) =>
        item.status === "Acknowledged"
    ).length;

  const investigatingIncidents =
    incidents.filter(
      (item) =>
        item.status === "Investigating"
    ).length;

  const resolvedIncidents =
    incidents.filter(
      (item) =>
        item.status === "Resolved" ||
        item.status === "Closed"
    ).length;

  // ============================================================
  // SEVERITY COUNT
  // ============================================================

  const criticalCount = incidents.filter(
    (item) => item.severity === "Critical"
  ).length;

  const highCount = incidents.filter(
    (item) => item.severity === "High"
  ).length;

  const mediumCount = incidents.filter(
    (item) => item.severity === "Medium"
  ).length;

  const lowCount = incidents.filter(
    (item) => item.severity === "Low"
  ).length;

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <div className="section">
        <h2>
          🔍 Loading Incident Investigation...
        </h2>

        <p>
          Fetching real security incidents
          from MongoDB.
        </p>
      </div>
    );
  }

  // ============================================================
  // PAGE
  // ============================================================

  return (
    <>
      {/* HEADER */}

      <div className="topbar">
        <div>
          <h1>
            🔍 Incident Investigation
          </h1>

          <p>
            Investigate and manage AI-detected
            network security incidents.
          </p>
        </div>

        <div>
          <h3>🟢 Live Monitoring</h3>

          <p>
            Auto refresh: 10 seconds
          </p>
        </div>
      </div>

      {error && (
        <div className="section">
          <p className="status-red">
            {error}
          </p>

          <button onClick={loadIncidents}>
            🔄 Retry
          </button>
        </div>
      )}

      {/* KPI CARDS */}

      <div className="cards">
        <div className="card">
          <h2>{totalIncidents}</h2>

          <p>Total Incidents</p>
        </div>

        <div className="card">
          <h2>{openIncidents}</h2>

          <p>Open Incidents</p>
        </div>

        <div className="card">
          <h2>
            {investigatingIncidents}
          </h2>

          <p>Investigating</p>
        </div>

        <div className="card">
          <h2>{resolvedIncidents}</h2>

          <p>Resolved</p>
        </div>
      </div>

      {/* SEVERITY SUMMARY */}

      <div className="section">
        <h2>
          🚨 Incident Severity Summary
        </h2>

        <table>
          <thead>
            <tr>
              <th>Severity</th>
              <th>Incidents</th>
              <th>Risk Level</th>
            </tr>
          </thead>

          <tbody>
            <tr>
              <td>Critical</td>

              <td>{criticalCount}</td>

              <td className="status-red">
                🔴 Critical
              </td>
            </tr>

            <tr>
              <td>High</td>

              <td>{highCount}</td>

              <td className="status-red">
                🟠 High
              </td>
            </tr>

            <tr>
              <td>Medium</td>

              <td>{mediumCount}</td>

              <td className="status-yellow">
                🟡 Medium
              </td>
            </tr>

            <tr>
              <td>Low</td>

              <td>{lowCount}</td>

              <td className="status-green">
                🟢 Low
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* INCIDENT LIST */}

      <div className="section">
        <h2>
          🛡 Active Security Incidents
        </h2>

        {incidents.length === 0 ? (
          <p>
            🟢 No security incidents have
            been detected yet.
          </p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Dataset</th>
                <th>Attack Type</th>
                <th>Packets</th>
                <th>Confidence</th>
                <th>Risk Score</th>
                <th>Severity</th>
                <th>Status</th>
                <th>Created</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {incidents.map(
                (incident, index) => (
                  <tr
                    key={
                      incident._id ||
                      index
                    }
                  >
                    <td>
                      {incident.dataset ||
                        "Unknown"}
                    </td>

                    <td>
                      {incident.attack_type ||
                        "Unknown"}
                    </td>

                    <td>
                      {Number(
                        incident.detected_packets ||
                          0
                      ).toLocaleString()}
                    </td>

                    <td>
                      {Number(
                        incident.confidence ||
                          0
                      ).toFixed(2)}
                      %
                    </td>

                    <td>
                      {incident.risk_score ??
                        "N/A"}
                    </td>

                    <td>
                      {incident.severity ||
                        "Low"}
                    </td>

                    <td>
                      {incident.status ||
                        "Open"}
                    </td>

                    <td>
                      {incident.created_at
                        ? new Date(
                            incident.created_at
                          ).toLocaleString()
                        : "N/A"}
                    </td>

                    <td>
                      <select
                        value={
                          incident.status ||
                          "Open"
                        }
                        disabled={
                          updating ===
                          incident._id
                        }
                        onChange={(e) =>
                          updateStatus(
                            incident,
                            e.target.value
                          )
                        }
                      >
                        <option value="Open">
                          Open
                        </option>

                        <option value="Acknowledged">
                          Acknowledged
                        </option>

                        <option value="Investigating">
                          Investigating
                        </option>

                        <option value="Resolved">
                          Resolved
                        </option>

                        <option value="Closed">
                          Closed
                        </option>
                      </select>
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* INCIDENT RESPONSE WORKFLOW */}

      <div className="section">
        <h2>
          🔄 Incident Response Workflow
        </h2>

        <table>
          <thead>
            <tr>
              <th>Stage</th>
              <th>Description</th>
              <th>System</th>
            </tr>
          </thead>

          <tbody>
            <tr>
              <td>1. Detection</td>

              <td>
                Random Forest detects
                suspicious network traffic.
              </td>

              <td>AI Engine</td>
            </tr>

            <tr>
              <td>2. Risk Scoring</td>

              <td>
                Threat confidence and
                packet frequency are used
                to calculate risk.
              </td>

              <td>Risk Engine</td>
            </tr>

            <tr>
              <td>3. Alert Creation</td>

              <td>
                A security alert can be
                generated from detected
                threats.
              </td>

              <td>FastAPI</td>
            </tr>

            <tr>
              <td>4. Investigation</td>

              <td>
                Security analyst reviews
                the detected incident.
              </td>

              <td>Analyst Dashboard</td>
            </tr>

            <tr>
              <td>5. Resolution</td>

              <td>
                Analyst changes the incident
                status after investigation.
              </td>

              <td>MongoDB</td>
            </tr>
          </tbody>
        </table>
      </div>
    </>
  );
}

export default IncidentInvestigationPage;