import { useState, useEffect } from "react";
import API from "./api/api";
import "./Dashboard.css";
import ModelTesting from "./ModelTesting";
import Reports from "./Reports";
import { useNavigate } from "react-router-dom";
import jsPDF from "jspdf";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
  Legend
} from "recharts";

function AnalystDashboard() {
  const navigate = useNavigate();

  const [activePage, setActivePage] = useState("Dashboard");

const storedUser = JSON.parse(
  localStorage.getItem("user") || "{}"
);
  const [trafficData, setTrafficData] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [trafficTrend, setTrafficTrend] = useState([]);
  const [reportData, setReportData] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [selectedTraffic, setSelectedTraffic] = useState(null);
  const [blockedIPs, setBlockedIPs] = useState([]);
  const [selectedDataset, setSelectedDataset] =
  useState("CICIDS2017");
  const [selectedIncident, setSelectedIncident] = useState(null);

const [incidentAssignee, setIncidentAssignee] = useState(
  storedUser.full_name || "Security Analyst"
);

  const [stats, setStats] = useState({
    total_packets: 0,
    normal_traffic: 0,
    attack_traffic: 0,
    anomalies_detected: 0,
    risk_score: 0,
    risk_level: "LOW"
  });

  const [protocolStats, setProtocolStats] = useState({
    HTTP: 0,
    HTTPS: 0,
    DNS: 0,
    OTHER: 0
  });

  const COLORS = [
    "#22c55e",
    "#ef4444",
    "#f59e0b",
    "#3b82f6"
  ];

  // ==============================
  // THREAT DATA
  // ==============================

  const threatData = [
    {
      name: "Normal",
      value: stats.normal_traffic || 0
    },
    {
      name: "Attack",
      value: stats.attack_traffic || 0
    }
  ];

  // ==============================
  // PROTOCOL DATA
  // ==============================

  const protocolData = [
    {
      name: "HTTP",
      value: protocolStats.HTTP
    },
    {
      name: "HTTPS",
      value: protocolStats.HTTPS
    },
    {
      name: "DNS",
      value: protocolStats.DNS
    },
    {
      name: "Other",
      value: protocolStats.OTHER
    }
  ];

// ==============================
// GET LIVE TRAFFIC
// ==============================

const getTraffic = async () => {
  try {
    // Get traffic from backend
   const response = await API.get(
  `/traffic?dataset=${encodeURIComponent(selectedDataset)}`
);

    const data = response.data;

    console.log("✅ Traffic received:", data);

    // Default prediction
    let prediction = {
      prediction: "Unknown",
      confidence: "0%",
      attack_type: "None",
      severity: "LOW"
    };

    // ==============================
    // RUN AI PREDICTION
    // ==============================

    try {
      let predictionResponse;

if (selectedDataset === "CICIDS2017") {

  predictionResponse = await API.post(
    "/predict/cicids",
    {
      ...data,
      source_ip: data.source,
      destination_ip: data.destination
    }
  );

} else {

  predictionResponse = await API.post(
    "/predict/unsw",
    {
      ...data,
      source_ip: data.source,
      destination_ip: data.destination
    }
  );

}

prediction = predictionResponse.data;

      console.log("✅ Prediction:", prediction);

    } catch (predictionError) {
      console.error(
        "⚠️ Prediction failed:",
        predictionError.response?.data ||
        predictionError.message
      );

      // Traffic will still be displayed
    }

    // ==============================
    // CREATE TRAFFIC OBJECT
    // ==============================

    const newTraffic = {
      id: Date.now(),

      source: data.source || "Unknown",

      destination: data.destination || "Unknown",

      protocol: String(data.protocol || "Unknown"),

      duration: Number(data.duration || 0),

      src_packets: Number(data.src_packets || 0),

      dst_packets: Number(data.dst_packets || 0),

      src_bytes: Number(data.src_bytes || 0),

      dst_bytes: Number(data.dst_bytes || 0),

      actual_label: data.actual_label ?? "0",

      status: prediction.prediction || "Unknown",

      confidence: prediction.confidence || "0%",

      attack_type: prediction.attack_type || "None",

      severity: prediction.severity || "LOW"
    };

    console.log(
      "📊 Adding traffic:",
      newTraffic
    );

    // ==============================
    // ADD TO LIVE TRAFFIC TABLE
    // ==============================

    setTrafficData((prev) => [
      ...prev.slice(-19),
      newTraffic
    ]);

    // ==============================
    // PROTOCOL ANALYTICS
    // ==============================

    const protocol = String(data.protocol);

    setProtocolStats((prev) => {
      if (protocol === "80") {
        return {
          ...prev,
          HTTP: prev.HTTP + 1
        };
      }

      if (protocol === "443") {
        return {
          ...prev,
          HTTPS: prev.HTTPS + 1
        };
      }

      if (protocol === "53") {
        return {
          ...prev,
          DNS: prev.DNS + 1
        };
      }

      return {
        ...prev,
        OTHER: prev.OTHER + 1
      };
    });

    // ==============================
    // TRAFFIC TREND
    // ==============================

    setTrafficTrend((prev) => [
      ...prev.slice(-9),
      {
        time: new Date().toLocaleTimeString(),
        value: 1
      }
    ]);

    // ==============================
// LIVE DASHBOARD STATS
// ==============================

setStats((prev) => {

  const isAttack =
    prediction.prediction === "Attack";

  return {
    ...prev,

    total_packets:
      prev.total_packets + 1,

    normal_traffic:
      prev.normal_traffic +
      (isAttack ? 0 : 1),

    attack_traffic:
      prev.attack_traffic +
      (isAttack ? 1 : 0),

    anomalies_detected:
      prev.anomalies_detected +
      (isAttack ? 1 : 0),

    risk_score:
      isAttack
        ? Math.min(
            100,
            prev.risk_score + 10
          )
        : prev.risk_score,

    risk_level:
      isAttack
        ? "HIGH"
        : prev.risk_level || "LOW"
  };

});

    // ==============================
    // CREATE ALERT
    // ==============================

    /*if (prediction.prediction === "Attack") {
      const newAlert = {
        id: Date.now(),

        source: data.source || "Unknown",

        attack_type:
          prediction.attack_type ||
          "Unknown Attack",

        severity:
          prediction.severity ||
          "LOW",

        confidence:
          prediction.confidence ||
          "0%",

        time:
          new Date().toLocaleTimeString()
      };

      setAlerts((prev) => [
        newAlert,
        ...prev.slice(0, 9)
      ]);

      // Timeline
      setTimeline((prev) => [
        {
          id: Date.now(),

          time:
            new Date().toLocaleTimeString(),

          event:
            `${prediction.attack_type || "Attack"} detected`
        },

        ...prev.slice(0, 9)
      ]);

    } else {
      setTimeline((prev) => [
        {
          id: Date.now(),

          time:
            new Date().toLocaleTimeString(),

          event: "Normal traffic detected"
        },

        ...prev.slice(0, 9)
      ]);
    }*/

  } catch (error) {
    console.error(
      "❌ Traffic API Error:",
      error.response?.data ||
      error.message
    );
  }
};


  // ==============================
  // GET DASHBOARD STATS
  // ==============================

  const getDashboardStats = async () => {
    try {
      const response =
        await API.get("/dashboard/stats");

      console.log(
        "Dashboard stats:",
        response.data
      );

      setStats(response.data);

    } catch (error) {
      console.error(
        "Dashboard stats error:",
        error
      );
    }
  };

  // ==============================
// GET MODEL PERFORMANCE REPORT
// ==============================

const getReportData = async () => {
  try {
    setReportLoading(true);

    const response = await API.get(
      "/reports/model-performance"
    );

    console.log(
      "Report data:",
      response.data
    );

    setReportData(response.data);

  } catch (error) {
    console.error(
      "Report API Error:",
      error
    );
  } finally {
    setReportLoading(false);
  }
};

  /// ==============================
// MANUAL ANALYZE TRAFFIC
// ==============================

const analyzeTraffic = async (index) => {
  const item = trafficData[index];

  if (!item) {
    return;
  }

  try {
    setSelectedTraffic({
      ...item,
      analyzing: true
    });

    const response = await API.post(
      "/predict",
      {
        duration: Number(item.duration),

        src_packets:
          Number(item.src_packets),

        dst_packets:
          Number(item.dst_packets),

        src_bytes:
          Number(item.src_bytes),

        dst_bytes:
          Number(item.dst_bytes),

        protocol:
          String(item.protocol)
      }
    );

    const result = response.data;

    console.log(
      "Investigation result:",
      result
    );

    // Update traffic row

    setTrafficData((prev) =>
      prev.map((traffic, i) =>
        i === index
          ? {
              ...traffic,

              status:
                result.prediction,

              confidence:
                result.confidence,

              attack_type:
                result.attack_type ||
                "None",

              severity:
                result.severity ||
                "LOW"
            }
          : traffic
      )
    );

    // Create alert

    /*if (result.prediction === "Attack") {

      const newAlert = {
        id: Date.now(),

        source:
          item.source ||
          "Unknown",

        attack_type:
          result.attack_type ||
          "Unknown Attack",

        confidence:
          result.confidence ||
          "0%",

        severity:
          result.severity ||
          "LOW",

        time:
          new Date().toLocaleTimeString()
      };

      setAlerts((prev) => [
        newAlert,
        ...prev.slice(0, 9)
      ]);
    }*/

    // Investigation result

    setSelectedTraffic({
      ...item,

      prediction:
        result.prediction,

      confidence:
        result.confidence,

      attack_type:
        result.attack_type ||
        "None",

      severity:
        result.severity ||
        "LOW",

      analyzing: false
    });

  } catch (error) {

    console.error(
      "Investigation error:",
      error.response?.data ||
      error.message
    );

    setSelectedTraffic({
      ...item,

      error:
        error.response?.data?.detail ||
        "Unable to analyze traffic.",

      analyzing: false
    });
  }
};

  // ==============================
  // LOGOUT
  // ==============================

  const handleLogout = () => {
    navigate("/login");
  };

  // ==============================
// DOWNLOAD PDF REPORT
// ==============================

const downloadReport = () => {
  if (!reportData) {
    return;
  }

  const doc = new jsPDF();

  let y = 20;

  doc.setFontSize(22);
  doc.text("NetShield AI", 20, y);

  y += 10;

  doc.setFontSize(16);
  doc.text(
    "SOC Analyst Model Performance Report",
    20,
    y
  );

  y += 15;

  doc.setFontSize(11);

  doc.text(
    `Generated: ${new Date().toLocaleString()}`,
    20,
    y
  );

  y += 15;

  doc.setFontSize(15);
  doc.text("Intrusion Detection", 20, y);

  y += 8;

  doc.setFontSize(11);

  doc.text(
    `Model: ${reportData.intrusion_detection.model}`,
    20,
    y
  );

  y += 6;

  doc.text(
    `Accuracy: ${reportData.intrusion_detection.accuracy}%`,
    20,
    y
  );

  y += 6;

  doc.text(
    `Status: ${reportData.intrusion_detection.status}`,
    20,
    y
  );

  y += 12;

  doc.setFontSize(15);
  doc.text("Threat Classification", 20, y);

  y += 8;

  doc.setFontSize(11);

  doc.text(
    `Model: ${reportData.threat_classification.model}`,
    20,
    y
  );

  y += 6;

  doc.text(
    `Accuracy: ${reportData.threat_classification.accuracy}%`,
    20,
    y
  );

  y += 6;

  doc.text(
    `Precision: ${reportData.threat_classification.precision}%`,
    20,
    y
  );

  y += 6;

  doc.text(
    `Recall: ${reportData.threat_classification.recall}%`,
    20,
    y
  );

  y += 6;

  doc.text(
    `F1 Score: ${reportData.threat_classification.f1_score}%`,
    20,
    y
  );

  y += 12;

  doc.setFontSize(15);
  doc.text("Anomaly Detection", 20, y);

  y += 8;

  doc.setFontSize(11);

  doc.text(
    `Model: ${reportData.anomaly_detection.model}`,
    20,
    y
  );

  y += 6;

  doc.text(
    `Anomalies Detected: ${reportData.anomaly_detection.anomalies_detected}`,
    20,
    y
  );

  y += 6;

  doc.text(
    `Anomaly Percentage: ${reportData.anomaly_detection.anomaly_percentage}%`,
    20,
    y
  );

  y += 12;

  doc.setFontSize(15);
  doc.text("System Status", 20, y);

  y += 8;

  doc.setFontSize(11);

  doc.text(
    reportData.overall_status,
    20,
    y
  );

  doc.save(
    "NetShield_AI_Model_Performance_Report.pdf"
  );
};


// ==============================
// GET SECURITY ALERTS FROM DATABASE
// ==============================

const getAlerts = async () => {
  try {
    const response = await API.get("/alerts/");

    console.log("✅ PostgreSQL alerts:", response.data);

    setAlerts(response.data);

  } catch (error) {
    console.error(
      "❌ Alert API Error:",
      error.response?.data || error.message
    );
  }
};


// ==============================
// GET INCIDENTS FROM DATABASE
// ==============================

const getIncidents = async () => {
  try {
    const response = await API.get("/incidents/");

    console.log("✅ PostgreSQL incidents:", response.data);

    setIncidents(response.data);

  } catch (error) {
    console.error(
      "❌ Incident API Error:",
      error.response?.data || error.message
    );
  }
};

// ==============================
// CREATE INCIDENT FROM ALERT
// ==============================

const createIncident = async (securityAlert) => {

  try {

    const response = await API.post(
      "/incidents/",
      {
        alert_id:
          securityAlert.id,

        dataset:
          securityAlert.dataset ||
          "Unknown",

        attack_type:
          securityAlert.attack_type ||
          "Unknown",

        severity:
          securityAlert.severity ||
          "Low",

        source:
          securityAlert.source ||
          "Unknown",

        risk_score:
          Number(
            securityAlert.risk_score || 0
          ),

        assigned_to:
          storedUser.full_name ||
          "Security Analyst"
      }
    );

    console.log(
      "✅ Incident created:",
      response.data
    );

    await getIncidents();

    window.alert(
      "✅ Incident created successfully."
    );

  } catch (error) {

    console.error(
      "❌ Incident creation error:",
      error.response?.data ||
      error.message
    );

    window.alert(
      error.response?.data?.detail ||
      "Unable to create incident."
    );
  }
};

// ==============================
// UPDATE INCIDENT
// ==============================

const updateIncident = async (
  incident,
  status,
  assignedTo
) => {

  try {

    await API.put(
      `/incidents/${incident.incident_id}/status`,
      {
        status,
        assigned_to:
          assignedTo ||
          incident.assigned_to ||
          storedUser.full_name ||
          "Security Analyst"
      }
    );

    await getIncidents();

    // Refresh selected incident details
    setSelectedIncident((prev) => {

      if (!prev) {
        return null;
      }

      return {
        ...prev,
        status,
        assigned_to:
          assignedTo ||
          incident.assigned_to ||
          storedUser.full_name ||
          "Security Analyst",
        resolved_at:
          status === "Resolved"
            ? new Date().toISOString()
            : null
      };

    });

  } catch (error) {

    console.error(
      "❌ Incident update error:",
      error.response?.data ||
      error.message
    );

    window.alert(
      error.response?.data?.detail ||
      "Unable to update incident."
    );
  }
};

  // ==============================
  // INITIAL LOAD + AUTO REFRESH
  // ==============================

 useEffect(() => {

  getTraffic();
  getDashboardStats();
  getReportData();

  // Milestone 3 database data
  getAlerts();
  getIncidents();

  const timer = setInterval(() => {

    getTraffic();
    getDashboardStats();

    // Refresh database-backed security data
    getAlerts();
    getIncidents();

  }, 10000);

  return () => clearInterval(timer);

}, [selectedDataset]);


// ==============================
// MILESTONE 3 STATISTICS
// ==============================

const totalAlerts = alerts.length;

const criticalAlerts = alerts.filter(
  (alert) =>
    String(alert.severity).toLowerCase() === "critical"
).length;

const highAlerts = alerts.filter(
  (alert) =>
    String(alert.severity).toLowerCase() === "high"
).length;

const openIncidents = incidents.filter(
  (incident) =>
    incident.status === "Open"
).length;

// ==============================
// INCIDENT STATISTICS
// ==============================

const openIncidentCount = incidents.filter(
  (incident) =>
    incident.status === "Open"
).length;

const inProgressIncidentCount = incidents.filter(
  (incident) =>
    incident.status === "In Progress"
).length;

const resolvedIncidentCount = incidents.filter(
  (incident) =>
    incident.status === "Resolved"
).length;

  // ==============================
  // RETURN UI
  // ==============================

  return (
    <div className="dashboard">

      {/* ==============================
          SIDEBAR
      ============================== */}

      <aside className="sidebar">

        <div className="logo">

          <span className="logo-icon">
            ⛊
          </span>

          <span className="logo-text">
            NetShield AI
          </span>

        </div>

        <ul>

          <li
            className={
              activePage === "Dashboard"
                ? "active"
                : ""
            }
            onClick={() =>
              setActivePage("Dashboard")
            }
          >
            📊 Dashboard
          </li>

          <li
            className={
              activePage === "Network"
                ? "active"
                : ""
            }
            onClick={() =>
              setActivePage("Network")
            }
          >
            🌐 Network Monitoring
          </li>

          <li
            className={
              activePage === "Alerts"
                ? "active"
                : ""
            }
            onClick={() =>
              setActivePage("Alerts")
            }
          >
            🚨 Threat Alerts
          </li>

          <li
            className={
              activePage === "Incidents"
                ? "active"
                : ""
            }
            onClick={() =>
              setActivePage("Incidents")
            }
          >
            🛡️ Incident Management
          </li>

          <li 
          className={ 
            activePage === "Reports" 
            ? "active" : 
            "" } onClick={() => setActivePage("Reports") 
            } 
            > 
            📄 Reports </li>

          <li
            className={
              activePage === "Analytics"
                ? "active"
                : ""
            }
            onClick={() =>
              setActivePage("Analytics")
            }
          >
            📈 Analytics
          </li>

          <li
            className={
              activePage === "ModelTesting"
                ? "active"
                : ""
            }
            onClick={() =>
              setActivePage("ModelTesting")
            }
          >
            🧪 Model Testing
          </li>

          <li
            className={
              activePage === "Profile"
                ? "active"
                : ""
            }
            onClick={() =>
              setActivePage("Profile")
            }
          >
            👤 Profile
          </li>

          <li onClick={handleLogout}>
            🚪 Logout
          </li>

        </ul>

      </aside>

      {/* ==============================
          MAIN CONTENT
      ============================== */}

      <main className="main">

        <h1>
          SOC Analyst Dashboard
        </h1>

        {/* ==============================
            DASHBOARD
        ============================== */}

        {activePage === "Dashboard" && (
          <>

          <div className="result-box">

  <h2>🗂️ Monitoring Dataset</h2>

  <select
    value={selectedDataset}
    onChange={(e) =>
      setSelectedDataset(e.target.value)
    }
    style={{
      padding: "12px",
      borderRadius: "10px",
      background: "#0f172a",
      color: "white",
      border: "1px solid #14b8a6",
      minWidth: "220px"
    }}
  >
    <option value="CICIDS2017">
      CICIDS2017
    </option>

    <option value="UNSW-NB15">
      UNSW-NB15
    </option>
  </select>

</div>

            {/* STAT CARDS */}

            <div className="cards">

              <div className="card">
                <h2>{stats.total_packets || 0}</h2>
                <p>Traffic Flows</p>
              </div>

              <div className="card">
                <h2>{stats.attack_traffic || 0}</h2>
                <p>Threats Detected</p>
              </div>

              <div className="card">
                <h2>{stats.normal_traffic || 0}</h2>
                <p>Normal Traffic</p>
              </div>

              <div className="card">
                <h2>{stats.anomalies_detected || 0}</h2>
                <p>Anomalies Detected</p>
              </div>

            </div>

            {/* MILESTONE 3 SECURITY CARDS */}

            <div className="cards">

              <div className="card">
                <h2>{totalAlerts}</h2>
                <p>Security Alerts</p>
              </div>

              <div className="card">
                <h2>{criticalAlerts}</h2>
                <p>Critical Alerts</p>
              </div>

              <div className="card">
                <h2>{highAlerts}</h2>
                <p>High Severity Alerts</p>
              </div>

              <div className="card">
                <h2>{openIncidents}</h2>
                <p>Open Incidents</p>
              </div>

            </div>

            {/* RISK SCORE */}

            <div className="result-box">

              <h2>🛡️ Risk Assessment</h2>

              <p>
                Risk Score:
                <b> {stats.risk_score || 0}/100</b>
              </p>

              <p>
                Risk Level:
                <b> {stats.risk_level || "LOW"}</b>
              </p>

            </div>

            {/* THREAT CHART */}

            <div className="chart-card">

              <h2>Threat Analytics</h2>

              <ResponsiveContainer width="100%" height={300}>

                <PieChart>

                  <Pie
                    data={threatData}
                    dataKey="value"
                    nameKey="name"
                    outerRadius={110}
                    label
                  >

                    {threatData.map((entry, index) => (
                      <Cell
                        key={index}
                        fill={COLORS[index]}
                      />
                    ))}

                  </Pie>

                  <Tooltip />
                  <Legend />

                </PieChart>

              </ResponsiveContainer>

            </div>

          </>
        )}

        {/* ==============================
            NETWORK MONITORING
        ============================== */}

        {activePage === "Network" && (
          <div className="result-box">

            <h2>
              🌐 Live Network Monitoring
            </h2>

            {trafficData.length === 0 ? (
              <p>
                ⏳ Waiting for network
                traffic...
              </p>
            ) : (

              <div
                style={{
                  overflowX: "auto"
                }}
              >

                <table>

                  <thead>

                    <tr>

                      <th>
                        Source IP
                      </th>

                      <th>
                        Destination IP
                      </th>

                      <th>
                        Protocol
                      </th>

                      <th>
                        Src Packets
                      </th>

                      <th>
                        Dst Packets
                      </th>

                      <th>
                        Src Bytes
                      </th>

                      <th>
                        Dst Bytes
                      </th>

                      <th>
                        Status
                      </th>

                      <th>
                        Confidence
                      </th>

                      <th>
                        Action
                      </th>

                    </tr>

                  </thead>

                  <tbody>

                    {trafficData
                      .slice()
                      .reverse()
                      .map(
                        (item, index) => {

                          const realIndex =
                            trafficData.length -
                            1 -
                            index;

                          return (
                            <tr
                              key={
                                item.id
                              }
                            >

                              <td>
                                {item.source}
                              </td>

                              <td>
                                {
                                  item.destination
                                }
                              </td>

                              <td>
                                {item.protocol}
                              </td>

                              <td>
                                {
                                  item.src_packets
                                }
                              </td>

                              <td>
                                {
                                  item.dst_packets
                                }
                              </td>

                              <td>
                                {
                                  item.src_bytes
                                }
                              </td>

                              <td>
                                {
                                  item.dst_bytes
                                }
                              </td>

                              <td>

                                <span
                                  className={
                                    item.status ===
                                    "Attack"
                                      ? "status attack"
                                      : item.status ===
                                        "Normal"
                                      ? "status normal"
                                      : "status waiting"
                                  }
                                >

                                  {item.status ===
                                  "Attack"
                                    ? "🔴 ATTACK"
                                    : item.status ===
                                      "Normal"
                                    ? "🟢 NORMAL"
                                    : "⏳ WAITING"}

                                </span>

                              </td>

                              <td>
                                {
                                  item.confidence
                                }
                              </td>

                              <td>

                                <button
                                  onClick={() =>
                                    analyzeTraffic(
                                      realIndex
                                    )
                                  }
                                >
                                  Analyze
                                </button>

                              </td>

                            </tr>
                          );
                        }
                      )}

                  </tbody>

                </table>

              </div>

            )}

          </div>
        )}

        {/* ==============================
    TRAFFIC INVESTIGATION
============================== */}

{selectedTraffic && (
  <div className="result-box">

    <h2>🔎 Traffic Investigation</h2>

    {selectedTraffic.analyzing ? (
      <p>🔄 Analyzing traffic with AI...</p>
    ) : selectedTraffic.error ? (
      <p>❌ {selectedTraffic.error}</p>
    ) : (
      <>

        <h3>🌐 Network Information</h3>

        <p>
          <strong>Source IP:</strong>{" "}
          {selectedTraffic.source || "Unknown"}
        </p>

        <p>
          <strong>Destination IP:</strong>{" "}
          {selectedTraffic.destination || "Unknown"}
        </p>

        <p>
          <strong>Protocol:</strong>{" "}
          {selectedTraffic.protocol}
        </p>

        <h3>📊 Traffic Features</h3>

        <p>
          <strong>Source Packets:</strong>{" "}
          {selectedTraffic.src_packets}
        </p>

        <p>
          <strong>Destination Packets:</strong>{" "}
          {selectedTraffic.dst_packets}
        </p>

        <p>
          <strong>Source Bytes:</strong>{" "}
          {selectedTraffic.src_bytes}
        </p>

        <p>
          <strong>Destination Bytes:</strong>{" "}
          {selectedTraffic.dst_bytes}
        </p>

        <h3>🤖 AI Analysis</h3>

        <p>
          <strong>Prediction:</strong>{" "}
          {selectedTraffic.prediction === "Attack"
            ? "🔴 ATTACK"
            : "🟢 NORMAL"}
        </p>

        <p>
          <strong>Confidence:</strong>{" "}
          {selectedTraffic.confidence}
        </p>

        <p>
          <strong>Attack Type:</strong>{" "}
          {selectedTraffic.attack_type}
        </p>

        <p>
          <strong>Severity:</strong>{" "}
          {selectedTraffic.severity}
        </p>

        <h3>🛡️ Recommended Action</h3>

        <p>
          {selectedTraffic.prediction === "Attack"
            ? "⚠️ Investigate the source IP and consider blocking or isolating the suspicious traffic."
            : "✅ No immediate action required. Continue monitoring the traffic."}
        </p>

        <div className="response-actions">

  {selectedTraffic.prediction === "Attack" && (
    <>
      <button
  onClick={() => {
    const ip = selectedTraffic.source;

    if (!ip) return;

    setBlockedIPs((prev) => {
      if (prev.includes(ip)) {
        return prev;
      }

      return [...prev, ip];
    });

    alert(`🛑 Source IP ${ip} has been blocked.`);
  }}
>
  🛑 Block Source IP
</button>

     <button
  onClick={() => {
    setAlerts((prev) =>
      prev.filter(
        (alert) =>
          alert.source !== selectedTraffic.source
      )
    );

    setSelectedTraffic(null);

    alert("✅ Alert marked as resolved.");
  }}
>
  ✅ Mark as Resolved
</button>
    </>
  )}

  <button
  onClick={() => {
    setSelectedTraffic(null);
  }}
>
  🔄 Keep Monitoring
</button>

</div>

        <button
          onClick={() => setSelectedTraffic(null)}
        >
          Close Investigation
        </button>

      </>
    )}

  </div>
)}

       {/* ==============================
    THREAT ALERTS
============================== */}

{activePage === "Alerts" && (
  <div className="result-box">

    <h2>🚨 Security Alerts</h2>

    {alerts.length === 0 ? (

      <p>No security alerts available.</p>

    ) : (

      <div style={{ overflowX: "auto" }}>

        <table>

          <thead>

            <tr>

              <th>Alert ID</th>

              <th>Dataset</th>

              <th>Attack Type</th>

              <th>Severity</th>

              <th>Source</th>

              <th>Risk</th>

              <th>Status</th>

              <th>Detected At</th>

              <th>Action</th>

            </tr>

          </thead>


          <tbody>

            {alerts.map((alert) => (

              <tr key={alert.id}>

                {/* ALERT ID */}

                <td>
                  ALT-{alert.id}
                </td>


                {/* DATASET */}

                <td>

                  <span
                    className={
                      alert.dataset === "CICIDS2017"
                        ? "dataset-badge dataset-cicids"
                        : alert.dataset === "UNSW-NB15"
                        ? "dataset-badge dataset-unsw"
                        : "dataset-badge dataset-combined"
                    }
                  >

                    {alert.dataset}

                  </span>

                </td>


                {/* ATTACK TYPE */}

                <td>
                  {alert.attack_type || "Unknown"}
                </td>


                {/* SEVERITY */}

                <td>

                  <span
                    className={`severity-badge ${
                      String(alert.severity)
                        .toLowerCase() === "critical"
                        ? "severity-critical"
                        : String(alert.severity)
                            .toLowerCase() === "high"
                        ? "severity-high"
                        : String(alert.severity)
                            .toLowerCase() === "medium"
                        ? "severity-medium"
                        : "severity-low"
                    }`}
                  >

                    {alert.severity}

                  </span>

                </td>


                {/* SOURCE */}

                <td>
                  {alert.source || "Unknown"}
                </td>


                {/* RISK */}

                <td>

                  <span className="risk-score">
                    {alert.risk_score ?? 0}
                  </span>

                </td>


                {/* STATUS */}

                <td>

                  <span
                    className={`incident-status ${
                      String(alert.status)
                        .toLowerCase() === "open"
                        ? "incident-open"
                        : String(alert.status)
                            .toLowerCase() === "in progress"
                        ? "incident-progress"
                        : "incident-resolved"
                    }`}
                  >

                    {alert.status}

                  </span>

                </td>


                {/* DETECTED AT */}

                <td>

                  {alert.detected_at
                    ? new Date(
                        alert.detected_at
                      ).toLocaleString()
                    : "Unknown"}

                </td>


                {/* INCIDENT ACTION */}

                <td>

                  <button
                    onClick={() =>
                      createIncident(alert)
                    }
                  >
                    🛡️ Create Incident
                  </button>

                </td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>

    )}

  </div>
)}

{/* ==============================
    INCIDENT MANAGEMENT
============================== */}

{activePage === "Incidents" && (
  <div className="incident-management">

    <h2>
      🛡️ Incident Management
    </h2>

    <p style={{ color: "#94a3b8", marginBottom: "20px" }}>
      Investigate, assign and resolve security incidents generated
      from detected threats.
    </p>


    {/* ==========================================
        INCIDENT SUMMARY CARDS
    ========================================== */}

    <div className="cards">

      <div className="card">
        <h2>
          {openIncidentCount}
        </h2>

        <p>
          Open Incidents
        </p>
      </div>


      <div className="card">
        <h2>
          {inProgressIncidentCount}
        </h2>

        <p>
          In Progress
        </p>
      </div>


      <div className="card">
        <h2>
          {resolvedIncidentCount}
        </h2>

        <p>
          Resolved
        </p>
      </div>


      <div className="card">
        <h2>
          {incidents.length}
        </h2>

        <p>
          Total Incidents
        </p>
      </div>

    </div>


    {/* ==========================================
        INCIDENT TABLE
    ========================================== */}

    <div className="result-box">

      <h2>
        📋 Incident Queue
      </h2>

      {incidents.length === 0 ? (

        <p>
          No incidents available.
        </p>

      ) : (

        <div
          style={{
            overflowX: "auto"
          }}
        >

          <table>

            <thead>

              <tr>

                <th>
                  Incident ID
                </th>

                <th>
                  Alert ID
                </th>

                <th>
                  Dataset
                </th>

                <th>
                  Attack Type
                </th>

                <th>
                  Severity
                </th>

                <th>
                  Risk
                </th>

                <th>
                  Assigned To
                </th>

                <th>
                  Status
                </th>

                <th>
                  Created At
                </th>

                <th>
                  Action
                </th>

              </tr>

            </thead>


            <tbody>

              {incidents.map(
                (incident) => (

                  <tr
                    key={incident.id}
                  >

                    <td>
                      {incident.incident_id}
                    </td>

                    <td>
                      ALT-{incident.alert_id}
                    </td>

                    <td>
                      {incident.dataset}
                    </td>

                    <td>
                      {incident.attack_type}
                    </td>

                    <td>

                      <span
                        className={`severity-badge ${
                          String(
                            incident.severity
                          ).toLowerCase() ===
                          "critical"
                            ? "severity-critical"
                            : String(
                                incident.severity
                              ).toLowerCase() ===
                              "high"
                            ? "severity-high"
                            : String(
                                incident.severity
                              ).toLowerCase() ===
                              "medium"
                            ? "severity-medium"
                            : "severity-low"
                        }`}
                      >

                        {incident.severity}

                      </span>

                    </td>

                    <td>

                      <span className="risk-score">
                        {incident.risk_score}
                      </span>

                    </td>

                    <td>
                      {incident.assigned_to ||
                        "Unassigned"}
                    </td>

                    <td>

                      <span
                        className={`incident-status ${
                          incident.status ===
                          "Open"
                            ? "incident-open"
                            : incident.status ===
                              "In Progress"
                            ? "incident-progress"
                            : "incident-resolved"
                        }`}
                      >

                        {incident.status}

                      </span>

                    </td>

                    <td>

                      {incident.created_at
                        ? new Date(
                            incident.created_at
                          ).toLocaleString()
                        : "Unknown"}

                    </td>

                    <td>

                      <button
                        onClick={() => {

                          setSelectedIncident(
                            incident
                          );

                          setIncidentAssignee(
                            incident.assigned_to ||
                            storedUser.full_name ||
                            "Security Analyst"
                          );

                        }}
                      >
                        🔎 View
                      </button>

                    </td>

                  </tr>

                )
              )}

            </tbody>

          </table>

        </div>

      )}

    </div>


    {/* ==========================================
        INCIDENT DETAIL PANEL
    ========================================== */}

    {selectedIncident && (

      <div className="result-box">

        <h2>
          🔎 Incident Investigation
        </h2>


        {/* --------------------------------------
            INCIDENT INFORMATION
        -------------------------------------- */}

        <h3>
          🛡️ Incident Information
        </h3>

        <p>
          <strong>
            Incident ID:
          </strong>{" "}
          {selectedIncident.incident_id}
        </p>

        <p>
          <strong>
            Related Alert:
          </strong>{" "}
          ALT-{selectedIncident.alert_id}
        </p>

        <p>
          <strong>
            Dataset:
          </strong>{" "}
          {selectedIncident.dataset}
        </p>

        <p>
          <strong>
            Attack Type:
          </strong>{" "}
          {selectedIncident.attack_type}
        </p>

        <p>
          <strong>
            Severity:
          </strong>{" "}
          {selectedIncident.severity}
        </p>

        <p>
          <strong>
            Risk Score:
          </strong>{" "}
          {selectedIncident.risk_score}/100
        </p>


        {/* --------------------------------------
            ALERT DETAILS
        -------------------------------------- */}

        {(() => {

          const relatedAlert =
            alerts.find(
              (alert) =>
                alert.id ===
                selectedIncident.alert_id
            );

          if (!relatedAlert) {
            return null;
          }

          return (

            <>

              <h3>
                🚨 Detection Details
              </h3>

              <p>
                <strong>
                  Source:
                </strong>{" "}
                {relatedAlert.source ||
                  "Unknown"}
              </p>

              <p>
                <strong>
                  Source IP:
                </strong>{" "}
                {relatedAlert.source_ip ||
                  "Unknown"}
              </p>

              <p>
                <strong>
                  Destination IP:
                </strong>{" "}
                {relatedAlert.destination_ip ||
                  "Unknown"}
              </p>

              <p>
                <strong>
                  Protocol:
                </strong>{" "}
                {relatedAlert.protocol ||
                  "Unknown"}
              </p>

              <p>
                <strong>
                  Detection:
                </strong>{" "}
                {relatedAlert.detection_details ||
                  "No detection details available."}
              </p>

              <p>
                <strong>
                  Detected At:
                </strong>{" "}
                {relatedAlert.detected_at
                  ? new Date(
                      relatedAlert.detected_at
                    ).toLocaleString()
                  : "Unknown"}
              </p>

            </>

          );

        })()}


        {/* --------------------------------------
            ASSIGNMENT
        -------------------------------------- */}

        <h3>
          👤 Incident Assignment
        </h3>

        <div
          style={{
            display: "flex",
            gap: "12px",
            flexWrap: "wrap",
            alignItems: "center"
          }}
        >

          <input
            type="text"
            value={incidentAssignee}
            onChange={(e) =>
              setIncidentAssignee(
                e.target.value
              )
            }
            placeholder="Security Analyst"
            style={{
              padding: "11px 14px",
              borderRadius: "10px",
              border:
                "1px solid rgba(255,255,255,0.15)",
              background: "#0f172a",
              color: "white",
              minWidth: "240px"
            }}
          />


          <button
            onClick={() =>
              updateIncident(
                selectedIncident,
                selectedIncident.status,
                incidentAssignee
              )
            }
          >
            👤 Assign
          </button>

        </div>


        {/* --------------------------------------
            TIMELINE
        -------------------------------------- */}

        <h3>
          🕒 Incident Timeline
        </h3>

        <p>
          <strong>
            Created:
          </strong>{" "}
          {selectedIncident.created_at
            ? new Date(
                selectedIncident.created_at
              ).toLocaleString()
            : "Unknown"}
        </p>

        <p>
          <strong>
            Current Status:
          </strong>{" "}
          {selectedIncident.status}
        </p>

        <p>
          <strong>
            Resolved:
          </strong>{" "}
          {selectedIncident.resolved_at
            ? new Date(
                selectedIncident.resolved_at
              ).toLocaleString()
            : "Not resolved yet"}
        </p>


        {/* --------------------------------------
            ACTIONS
        -------------------------------------- */}

        <div className="response-actions">

          {selectedIncident.status ===
            "Open" && (

            <button
              onClick={() =>
                updateIncident(
                  selectedIncident,
                  "In Progress",
                  incidentAssignee
                )
              }
            >
              🔎 Start Investigation
            </button>

          )}


          {selectedIncident.status ===
            "In Progress" && (

            <button
              onClick={() =>
                updateIncident(
                  selectedIncident,
                  "Resolved",
                  incidentAssignee
                )
              }
            >
              ✅ Resolve Incident
            </button>

          )}


          {selectedIncident.status ===
            "Resolved" && (

            <span
              className="incident-status incident-resolved"
              style={{
                padding: "10px 15px"
              }}
            >
              ✅ Incident Resolved
            </span>

          )}


          <button
            onClick={() =>
              setSelectedIncident(null)
            }
          >
            ✕ Close Details
          </button>

        </div>

      </div>

    )}

  </div>
)}

        {/* ==============================
            ANALYTICS
        ============================== */}

        {activePage === "Analytics" && (
          <>

            <div className="chart-card">

              <h2>
                Protocol Analytics
              </h2>

              <ResponsiveContainer
                width="100%"
                height={300}
              >

                <BarChart
                  data={protocolData}
                >

                  <CartesianGrid
                    strokeDasharray="3 3"
                  />

                  <XAxis
                    dataKey="name"
                  />

                  <YAxis />

                  <Tooltip />

                  <Legend />

                  <Bar
                    dataKey="value"
                    fill="#14b8a6"
                  />

                </BarChart>

              </ResponsiveContainer>

            </div>

            <div className="chart-card">

              <h2>
                Live Traffic Trend
              </h2>

              {trafficTrend.length ===
              0 ? (

                <p>
                  Waiting for traffic
                  data...
                </p>

              ) : (

                <ResponsiveContainer
                  width="100%"
                  height={300}
                >

                  <LineChart
                    data={
                      trafficTrend
                    }
                  >

                    <CartesianGrid
                      strokeDasharray="3 3"
                    />

                    <XAxis
                      dataKey="time"
                    />

                    <YAxis />

                    <Tooltip />

                    <Legend />

                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="#14b8a6"
                      strokeWidth={3}
                    />

                  </LineChart>

                </ResponsiveContainer>

              )}

            </div>

            <div className="result-box">

              <h2>
                📋 Recent Activity
              </h2>

              {timeline.length ===
              0 ? (

                <p>
                  No activity yet.
                </p>

              ) : (

                timeline.map(
                  (event) => (

                    <p
                      key={event.id}
                    >
                      ⏰ {event.time} —{" "}
                      {event.event}
                    </p>

                  )
                )

              )}

            </div>

          </>
        )}


{/* ==============================
    REPORTS
============================== */}

{activePage === "Reports" && (
  <div className="reports-container">

    <h2>📊 Model Performance</h2>

    <div className="buttons">
      <button onClick={downloadReport}>
        📥 Download PDF Report
      </button>
    </div>


    {reportLoading ? (
      <p>Loading model performance...</p>
    ) : !reportData ? (
      <p>No report data available.</p>
    ) : (
      <>

        {/* MODEL SUMMARY CARDS */}

        <div className="cards">

          <div className="card">
            <h2>
              {reportData.intrusion_detection.accuracy}%
            </h2>

            <p>
              Intrusion Detection
            </p>

            <small>
              Random Forest
            </small>
          </div>


          <div className="card">
            <h2>
              {reportData.threat_classification.accuracy}%
            </h2>

            <p>
              Threat Classification
            </p>

            <small>
              Random Forest
            </small>
          </div>


          <div className="card">
            <h2>
              {reportData.anomaly_detection.anomaly_percentage}%
            </h2>

            <p>
              Anomaly Detection
            </p>

            <small>
              Isolation Forest
            </small>
          </div>

        </div>


        {/* INTRUSION DETECTION */}

        <div className="result-box">

          <h2>
            🛡️ Intrusion Detection
          </h2>

          <p>
            <strong>Model:</strong>{" "}
            {reportData.intrusion_detection.model}
          </p>

          <p>
            <strong>Accuracy:</strong>{" "}
            {reportData.intrusion_detection.accuracy}%
          </p>

          <p>
            <strong>Status:</strong>{" "}
            {reportData.intrusion_detection.status}
          </p>

        </div>


        {/* THREAT CLASSIFICATION */}

        <div className="result-box">

          <h2>
            🚨 Threat Classification
          </h2>

          <p>
            <strong>Model:</strong>{" "}
            {reportData.threat_classification.model}
          </p>

          <p>
            <strong>Accuracy:</strong>{" "}
            {reportData.threat_classification.accuracy}%
          </p>

          <p>
            <strong>Precision:</strong>{" "}
            {reportData.threat_classification.precision}%
          </p>

          <p>
            <strong>Recall:</strong>{" "}
            {reportData.threat_classification.recall}%
          </p>

          <p>
            <strong>F1 Score:</strong>{" "}
            {reportData.threat_classification.f1_score}%
          </p>

          <p>
            <strong>Status:</strong>{" "}
            {reportData.threat_classification.status}
          </p>

        </div>


        {/* ANOMALY DETECTION */}

        <div className="result-box">

          <h2>
            🔍 Anomaly Detection
          </h2>

          <p>
            <strong>Model:</strong>{" "}
            {reportData.anomaly_detection.model}
          </p>

          <p>
            <strong>Anomalies Detected:</strong>{" "}
            {reportData.anomaly_detection.anomalies_detected}
          </p>

          <p>
            <strong>Anomaly Percentage:</strong>{" "}
            {reportData.anomaly_detection.anomaly_percentage}%
          </p>

          <p>
            <strong>Status:</strong>{" "}
            {reportData.anomaly_detection.status}
          </p>

        </div>


        {/* SYSTEM STATUS */}

        <div className="result-box">

          <h2>
            🛡️ System Status
          </h2>

          <p>
            {reportData.overall_status}
          </p>

        </div>

      </>
    )}

  </div>
)}

{/* ==============================
    MODEL TESTING
============================== */}

{activePage === "ModelTesting" && (
  <ModelTesting />
)}


        {/* ==============================
            PROFILE
        ============================== */}

        {activePage === "Profile" && (
  <div className="profile-container">

    <div className="profile-header">

      <div className="profile-avatar">
        👤
      </div>

      <div>
        <h2>SOC Analyst Profile</h2>

        <p>
          {storedUser.full_name || "Security Analyst"}
        </p>
      </div>

    </div>


    <div className="profile-details">

      <div className="profile-item">
        <span>👤 Full Name</span>

        <strong>
          {storedUser.full_name || "Security Analyst"}
        </strong>
      </div>


      <div className="profile-item">
        <span>📧 Email</span>

        <strong>
          {storedUser.email || "Not available"}
        </strong>
      </div>


      <div className="profile-item">
        <span>💼 Role</span>

        <strong>
          Security Analyst
        </strong>
      </div>


      <div className="profile-item">
        <span>🛡️ System</span>

        <strong>
          NetShield AI
        </strong>
      </div>


      <div className="profile-item">
        <span>🟢 Account Status</span>

        <strong>
          Active
        </strong>
      </div>


      <div className="profile-item">
        <span>🔐 Access Level</span>

        <strong>
          Monitoring & Reports
        </strong>
      </div>


      <div className="profile-item">
        <span>🤖 AI Access</span>

        <strong>
          Model Testing & Analysis
        </strong>
      </div>

    </div>


    <div className="result-box">

      <h3>
        🔒 Security Responsibilities
      </h3>

      <p>
        • Monitor network traffic and security alerts
      </p>

      <p>
        • Analyze suspicious network activity
      </p>

      <p>
        • Review AI-based threat predictions
      </p>

      <p>
        • Investigate and respond to detected threats
      </p>

      <p>
        • Monitor AI model performance
      </p>

    </div>

  </div>
)}

      </main>

    </div>
  );
}

export default AnalystDashboard;