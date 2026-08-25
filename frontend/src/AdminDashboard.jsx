import { useEffect, useState } from "react";
import API from "./api/api";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";

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


function AdminDashboard() {

  const navigate = useNavigate();

  const [activePage, setActivePage] =
    useState("Dashboard");

  const [users, setUsers] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [incidents, setIncidents] = useState([]);

  const [modelPerformance, setModelPerformance] =
    useState(null);

  const [securityAnalytics, setSecurityAnalytics] =
    useState(null);

  const [securityReport, setSecurityReport] =
    useState(null);

  const [modelLoading, setModelLoading] =
    useState(true);

  const [loading, setLoading] =
    useState(true);


  const COLORS = [
    "#22c55e",
    "#ef4444",
    "#3b82f6",
    "#f59e0b",
    "#8b5cf6",
    "#14b8a6"
  ];


  // ============================================================
  // GET USERS
  // ============================================================

  const getUsers = async () => {

    try {

      const response =
        await API.get("/users");

      setUsers(response.data || []);

    } catch (error) {

      console.error(
        "User API error:",
        error
      );

    }
  };


  // ============================================================
  // GET ALERTS
  // ============================================================

  const getAlerts = async () => {

    try {

      const response =
        await API.get("/alerts/");

      setAlerts(response.data || []);

    } catch (error) {

      console.error(
        "Alert API error:",
        error
      );

    }
  };


  // ============================================================
  // GET INCIDENTS
  // ============================================================

  const getIncidents = async () => {

    try {

      const response =
        await API.get("/incidents/");

      setIncidents(response.data || []);

    } catch (error) {

      console.error(
        "Incident API error:",
        error
      );

    }
  };


  // ============================================================
  // GET MODEL PERFORMANCE
  // ============================================================

  const getModelPerformance = async () => {

    try {

      setModelLoading(true);

      const response =
        await API.get(
          "/reports/model-performance"
        );

      setModelPerformance(
        response.data
      );

    } catch (error) {

      console.error(
        "Model performance error:",
        error
      );

    } finally {

      setModelLoading(false);

    }
  };


  // ============================================================
  // GET SECURITY ANALYTICS
  // ============================================================

  const getSecurityAnalytics = async () => {

    try {

      const response =
        await API.get(
          "/analytics/"
        );

      setSecurityAnalytics(
        response.data
      );

    } catch (error) {

      console.error(
        "Security analytics error:",
        error
      );

    }

  };


  // ============================================================
  // GET SECURITY REPORT
  // ============================================================

  const getSecurityReport = async () => {

    try {

      const response =
        await API.get(
          "/security-reports/"
        );

      setSecurityReport(
        response.data
      );

    } catch (error) {

      console.error(
        "Security report error:",
        error
      );

    }

  };


  // ============================================================
  // INITIAL LOAD
  // ============================================================

  useEffect(() => {

    const loadAdminData = async () => {

      setLoading(true);

      await Promise.all([
        getUsers(),
        getAlerts(),
        getIncidents(),
        getModelPerformance(),
        getSecurityAnalytics(),
        getSecurityReport()
      ]);

      setLoading(false);
    };

    loadAdminData();

    const timer = setInterval(() => {

      getUsers();
      getAlerts();
      getIncidents();
      getSecurityAnalytics();
      getSecurityReport();

    }, 15000);

    return () =>
      clearInterval(timer);

  }, []);


  // ============================================================
  // CHANGE ROLE
  // ============================================================

  const changeRole = async (
    id,
    role
  ) => {

    try {

      await API.put(
        `/users/${id}/role?role=${role}`
      );

      window.alert(
        "✅ Role updated successfully."
      );

      getUsers();

    } catch (error) {

      console.error(
        error
      );

      window.alert(
        "❌ Role update failed."
      );

    }

  };


  // ============================================================
  // DELETE USER
  // ============================================================

  const deleteUser = async (
    id
  ) => {

    const confirmed =
      window.confirm(
        "Delete this user?"
      );

    if (!confirmed) {
      return;
    }

    try {

      await API.delete(
        `/users/${id}`
      );

      window.alert(
        "✅ User deleted."
      );

      getUsers();

    } catch (error) {

      console.error(
        error
      );

      window.alert(
        "❌ Delete failed."
      );

    }

  };


  // ============================================================
  // LOGOUT
  // ============================================================

  const logout = () => {

    localStorage.removeItem(
      "user"
    );

    navigate("/login");

  };


  // ============================================================
  // SUMMARY DATA
  // ============================================================

  const totalUsers =
    users.length;

  const analystUsers =
    users.filter(
      (user) =>
        String(user.role)
          .toLowerCase() ===
        "analyst"
    ).length;

  const adminUsers =
    users.filter(
      (user) =>
        String(user.role)
          .toLowerCase() ===
        "admin"
    ).length;

  const totalAlerts =
    alerts.length;

  const criticalAlerts =
    alerts.filter(
      (alert) =>
        String(alert.severity)
          .toLowerCase() ===
        "critical"
    ).length;

  const highAlerts =
    alerts.filter(
      (alert) =>
        String(alert.severity)
          .toLowerCase() ===
        "high"
    ).length;

  const openIncidents =
    incidents.filter(
      (incident) =>
        incident.status ===
        "Open"
    ).length;

  const inProgressIncidents =
    incidents.filter(
      (incident) =>
        incident.status ===
        "In Progress"
    ).length;

  const resolvedIncidents =
    incidents.filter(
      (incident) =>
        incident.status ===
        "Resolved"
    ).length;


  // ============================================================
  // USER DISTRIBUTION
  // ============================================================

  const userDistribution = [
    {
      name: "Security Analysts",
      value: analystUsers
    },
    {
      name: "Administrators",
      value: adminUsers
    },
    {
      name: "Other",
      value:
        totalUsers -
        analystUsers -
        adminUsers
    }
  ].filter(
    (item) =>
      item.value > 0
  );


  // ============================================================
  // INCIDENT DISTRIBUTION
  // ============================================================

  const incidentDistribution = [
    {
      name: "Open",
      value: openIncidents
    },
    {
      name: "In Progress",
      value: inProgressIncidents
    },
    {
      name: "Resolved",
      value: resolvedIncidents
    }
  ];


  // ============================================================
  // LOGOUT / DASHBOARD
  // ============================================================

  return (

    <div className="dashboard">


      {/* ======================================================
          SIDEBAR
      ====================================================== */}

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
              setActivePage(
                "Dashboard"
              )
            }
          >
            📊 Dashboard
          </li>


          <li
            className={
              activePage === "Users"
                ? "active"
                : ""
            }
            onClick={() =>
              setActivePage(
                "Users"
              )
            }
          >
            👥 User Management
          </li>


          <li
            className={
              activePage === "Alerts"
                ? "active"
                : ""
            }
            onClick={() =>
              setActivePage(
                "Alerts"
              )
            }
          >
            🚨 Alert Oversight
          </li>


          <li
            className={
              activePage === "Incidents"
                ? "active"
                : ""
            }
            onClick={() =>
              setActivePage(
                "Incidents"
              )
            }
          >
            🛡️ Incident Oversight
          </li>


          <li
            className={
              activePage === "Models"
                ? "active"
                : ""
            }
            onClick={() =>
              setActivePage(
                "Models"
              )
            }
          >
            🤖 AI Models
          </li>


          <li
            className={
              activePage === "Datasets"
                ? "active"
                : ""
            }
            onClick={() =>
              setActivePage(
                "Datasets"
              )
            }
          >
            🗂️ Datasets
          </li>


          <li
            className={
              activePage === "Analytics"
                ? "active"
                : ""
            }
            onClick={() =>
              setActivePage(
                "Analytics"
              )
            }
          >
            📈 Security Analytics
          </li>


          <li
            className={
              activePage === "RBAC"
                ? "active"
                : ""
            }
            onClick={() =>
              setActivePage(
                "RBAC"
              )
            }
          >
            🔐 Role & Access
          </li>


          <li
            className={
              activePage === "Audit"
                ? "active"
                : ""
            }
            onClick={() =>
              setActivePage(
                "Audit"
              )
            }
          >
            📋 Audit Overview
          </li>


          <li
            className={
              activePage === "Settings"
                ? "active"
                : ""
            }
            onClick={() =>
              setActivePage(
                "Settings"
              )
            }
          >
            ⚙️ System Settings
          </li>


          <li
            className={
              activePage === "Profile"
                ? "active"
                : ""
            }
            onClick={() =>
              setActivePage(
                "Profile"
              )
            }
          >
            👤 Admin Profile
          </li>


          <li
            onClick={logout}
          >
            🚪 Logout
          </li>

        </ul>

      </aside>


      {/* ======================================================
          MAIN
      ====================================================== */}

      <main className="main">

        <h1>
          Security Administrator Dashboard
        </h1>


        {loading ? (

          <div className="result-box">

            <h2>
              Loading administration data...
            </h2>

          </div>

        ) : (

          <>


            {/* ==================================================
                DASHBOARD
            ================================================== */}

            {activePage === "Dashboard" && (

              <>

                <div className="cards">


                  <div className="card">

                    <h2>
                      {totalUsers}
                    </h2>

                    <p>
                      Total Users
                    </p>

                  </div>


                  <div className="card">

                    <h2>
                      {analystUsers}
                    </h2>

                    <p>
                      Security Analysts
                    </p>

                  </div>


                  <div className="card">

                    <h2>
                      {adminUsers}
                    </h2>

                    <p>
                      Administrators
                    </p>

                  </div>


                  <div className="card">

                    <h2>
                      {totalAlerts}
                    </h2>

                    <p>
                      Security Alerts
                    </p>

                  </div>


                  <div className="card">

                    <h2>
                      {openIncidents}
                    </h2>

                    <p>
                      Open Incidents
                    </p>

                  </div>

                </div>


                <div className="cards">


                  <div className="card">

                    <h2>
                      {criticalAlerts}
                    </h2>

                    <p>
                      Critical Threats
                    </p>

                  </div>


                  <div className="card">

                    <h2>
                      {highAlerts}
                    </h2>

                    <p>
                      High Alerts
                    </p>

                  </div>


                  <div className="card">

                    <h2>
                      {inProgressIncidents}
                    </h2>

                    <p>
                      Investigations
                    </p>

                  </div>


                  <div className="card">

                    <h2>
                      {resolvedIncidents}
                    </h2>

                    <p>
                      Resolved Incidents
                    </p>

                  </div>


                  <div className="card">

                    <h2>
                      100%
                    </h2>

                    <p>
                      System Availability
                    </p>

                  </div>

                </div>


                <div className="prediction-box">

                  <h2>
                    👥 User Distribution
                  </h2>

                  {userDistribution.length === 0 ? (

                    <p>
                      No user data available.
                    </p>

                  ) : (

                    <ResponsiveContainer
                      width="100%"
                      height={300}
                    >

                      <PieChart>

                        <Pie
                          data={userDistribution}
                          dataKey="value"
                          nameKey="name"
                          outerRadius={110}
                          label
                        >

                          {userDistribution.map(
                            (item, index) => (

                              <Cell
                                key={index}
                                fill={
                                  COLORS[
                                    index %
                                    COLORS.length
                                  ]
                                }
                              />

                            )
                          )}

                        </Pie>

                        <Tooltip />

                      </PieChart>

                    </ResponsiveContainer>

                  )}

                </div>


                <div className="prediction-box">

                  <h2>
                    🛡️ Incident Status
                  </h2>

                  <ResponsiveContainer
                    width="100%"
                    height={300}
                  >

                    <BarChart
                      data={
                        incidentDistribution
                      }
                    >

                      <CartesianGrid
                        strokeDasharray="5 5"
                      />

                      <XAxis
                        dataKey="name"
                      />

                      <YAxis />

                      <Tooltip />

                      <Bar
                        dataKey="value"
                        fill="#14b8a6"
                      />

                    </BarChart>

                  </ResponsiveContainer>

                </div>


                <div className="prediction-box">

                  <h2>
                    🤖 AI Model Performance
                  </h2>

                  {modelLoading ? (

                    <p>
                      Loading model performance...
                    </p>

                  ) : !modelPerformance ? (

                    <p>
                      Model performance unavailable.
                    </p>

                  ) : (

                    <div className="cards">

                      <div className="card">

                        <h2>
                          {
                            modelPerformance
                              .intrusion_detection
                              .accuracy
                          }%
                        </h2>

                        <p>
                          Intrusion Detection
                        </p>

                        <small>
                          {
                            modelPerformance
                              .intrusion_detection
                              .model
                          }
                        </small>

                      </div>


                      <div className="card">

                        <h2>
                          {
                            modelPerformance
                              .threat_classification
                              .accuracy
                          }%
                        </h2>

                        <p>
                          Threat Classification
                        </p>

                        <small>
                          {
                            modelPerformance
                              .threat_classification
                              .model
                          }
                        </small>

                      </div>


                      <div className="card">

                        <h2>
                          {
                            modelPerformance
                              .anomaly_detection
                              .anomaly_percentage
                          }%
                        </h2>

                        <p>
                          Anomaly Detection
                        </p>

                        <small>
                          {
                            modelPerformance
                              .anomaly_detection
                              .model
                          }
                        </small>

                      </div>

                    </div>

                  )}

                </div>

              </>

            )}


            {/* ==================================================
                USERS
            ================================================== */}

            {activePage === "Users" && (

              <div className="prediction-box">

                <h2>
                  👥 User Management
                </h2>

                <p>
                  Manage NetShield AI users,
                  roles and access.
                </p>

                <table>

                  <thead>

                    <tr>

                      <th>
                        Name
                      </th>

                      <th>
                        Email
                      </th>

                      <th>
                        Role
                      </th>

                      <th>
                        ID
                      </th>

                      <th>
                        Action
                      </th>

                    </tr>

                  </thead>


                  <tbody>

                    {users.map(
                      (user) => (

                        <tr
                          key={user.id}
                        >

                          <td>
                            {user.full_name}
                          </td>

                          <td>
                            {user.email}
                          </td>

                          <td>

                            <select
                              value={
                                user.role
                              }
                              onChange={(e) =>
                                changeRole(
                                  user.id,
                                  e.target.value
                                )
                              }
                            >

                              <option value="analyst">
                                Security Analyst
                              </option>

                              <option value="admin">
                                Administrator
                              </option>

                            </select>

                          </td>

                          <td>
                            {user.id}
                          </td>

                          <td>

                            <button
                              onClick={() =>
                                deleteUser(
                                  user.id
                                )
                              }
                            >
                              Delete
                            </button>

                          </td>

                        </tr>

                      )
                    )}

                  </tbody>

                </table>

              </div>

            )}


            {/* ==================================================
                ALERT OVERSIGHT
            ================================================== */}

            {activePage === "Alerts" && (

              <div className="prediction-box">

                <h2>
                  🚨 Alert Oversight
                </h2>

                <p>
                  Monitor all security alerts
                  generated by the detection system.
                </p>

                <table>

                  <thead>

                    <tr>

                      <th>
                        Alert ID
                      </th>

                      <th>
                        Dataset
                      </th>

                      <th>
                        Attack
                      </th>

                      <th>
                        Severity
                      </th>

                      <th>
                        Risk
                      </th>

                      <th>
                        Status
                      </th>

                      <th>
                        Detected
                      </th>

                    </tr>

                  </thead>


                  <tbody>

                    {alerts.map(
                      (alert) => (

                        <tr
                          key={alert.id}
                        >

                          <td>
                            ALT-{alert.id}
                          </td>

                          <td>
                            {alert.dataset}
                          </td>

                          <td>
                            {alert.attack_type}
                          </td>

                          <td>
                            {alert.severity}
                          </td>

                          <td>
                            {alert.risk_score}
                          </td>

                          <td>
                            {alert.status}
                          </td>

                          <td>
                            {alert.detected_at
                              ? new Date(
                                  alert.detected_at
                                ).toLocaleString()
                              : "Unknown"}
                          </td>

                        </tr>

                      )
                    )}

                  </tbody>

                </table>

              </div>

            )}


            {/* ==================================================
                INCIDENT OVERSIGHT
            ================================================== */}

            {activePage === "Incidents" && (

              <div className="prediction-box">

                <h2>
                  🛡️ Incident Oversight
                </h2>

                <div className="cards">

                  <div className="card">

                    <h2>
                      {openIncidents}
                    </h2>

                    <p>
                      Open
                    </p>

                  </div>


                  <div className="card">

                    <h2>
                      {inProgressIncidents}
                    </h2>

                    <p>
                      In Progress
                    </p>

                  </div>


                  <div className="card">

                    <h2>
                      {resolvedIncidents}
                    </h2>

                    <p>
                      Resolved
                    </p>

                  </div>

                </div>


                <table>

                  <thead>

                    <tr>

                      <th>
                        Incident
                      </th>

                      <th>
                        Alert
                      </th>

                      <th>
                        Dataset
                      </th>

                      <th>
                        Attack
                      </th>

                      <th>
                        Severity
                      </th>

                      <th>
                        Status
                      </th>

                      <th>
                        Assigned To
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
                            {incident.severity}
                          </td>

                          <td>
                            {incident.status}
                          </td>

                          <td>
                            {incident.assigned_to ||
                              "Unassigned"}
                          </td>

                        </tr>

                      )
                    )}

                  </tbody>

                </table>

              </div>

            )}


            {/* ==================================================
                AI MODELS
            ================================================== */}

            {activePage === "Models" && (

              <div className="prediction-box">

                <h2>
                  🤖 AI Model Management
                </h2>

                {!modelPerformance ? (

                  <p>
                    Model information unavailable.
                  </p>

                ) : (

                  <>

                    <div className="cards">

                      <div className="card">

                        <h2>
                          {
                            modelPerformance
                              .intrusion_detection
                              .accuracy
                          }%
                        </h2>

                        <p>
                          CICIDS /
                          Intrusion Detection
                        </p>

                        <small>
                          {
                            modelPerformance
                              .intrusion_detection
                              .status
                          }
                        </small>

                      </div>


                      <div className="card">

                        <h2>
                          {
                            modelPerformance
                              .threat_classification
                              .accuracy
                          }%
                        </h2>

                        <p>
                          Threat Classification
                        </p>

                        <small>
                          {
                            modelPerformance
                              .threat_classification
                              .status
                          }
                        </small>

                      </div>


                      <div className="card">

                        <h2>
                          {
                            modelPerformance
                              .anomaly_detection
                              .anomaly_percentage
                          }%
                        </h2>

                        <p>
                          Isolation Forest
                        </p>

                        <small>
                          {
                            modelPerformance
                              .anomaly_detection
                              .status
                          }
                        </small>

                      </div>

                    </div>

                  </>

                )}

              </div>

            )}


            {/* ==================================================
                DATASETS
            ================================================== */}

            {activePage === "Datasets" && (

              <div className="prediction-box">

                <h2>
                  🗂️ Dataset Management
                </h2>

                <div className="cards">

                  <div className="card">

                    <h2>
                      CICIDS2017
                    </h2>

                    <p>
                      Network Intrusion Dataset
                    </p>

                    <small>
                      Primary security dataset
                    </small>

                  </div>


                  <div className="card">

                    <h2>
                      UNSW-NB15
                    </h2>

                    <p>
                      Network Attack Dataset
                    </p>

                    <small>
                      Primary security dataset
                    </small>

                  </div>


                  <div className="card">

                    <h2>
                      Combined
                    </h2>

                    <p>
                      Supporting Dataset
                    </p>

                    <small>
                      Existing compatibility pipeline
                    </small>

                  </div>

                </div>


                <div className="result-box">

                  <h2>
                    Dataset Usage
                  </h2>

                  {securityAnalytics?.dataset_distribution
                    ?.map(
                      (dataset) => (

                        <p
                          key={
                            dataset.name
                          }
                        >
                          <strong>
                            {dataset.name}
                          </strong>
                          :{" "}
                          {dataset.value}
                          {" "}
                          security alerts
                        </p>

                      )
                    )}

                </div>

              </div>

            )}


            {/* ==================================================
                ANALYTICS
            ================================================== */}

            {activePage === "Analytics" && (

              <>

                <div className="prediction-box">

                  <h2>
                    📈 Security Analytics
                  </h2>

                  {securityAnalytics ? (

                    <div className="cards">

                      <div className="card">

                        <h2>
                          {
                            securityAnalytics
                              .summary
                              .total_alerts
                          }
                        </h2>

                        <p>
                          Total Alerts
                        </p>

                      </div>


                      <div className="card">

                        <h2>
                          {
                            securityAnalytics
                              .summary
                              .critical_alerts
                          }
                        </h2>

                        <p>
                          Critical
                        </p>

                      </div>


                      <div className="card">

                        <h2>
                          {
                            securityAnalytics
                              .summary
                              .high_alerts
                          }
                        </h2>

                        <p>
                          High
                        </p>

                      </div>


                      <div className="card">

                        <h2>
                          {
                            securityAnalytics
                              .summary
                              .medium_alerts
                          }
                        </h2>

                        <p>
                          Medium
                        </p>

                      </div>

                    </div>

                  ) : (

                    <p>
                      Analytics unavailable.
                    </p>

                  )}

                </div>


                {securityAnalytics && (

                  <>

                    <div className="prediction-box">

                      <h2>
                        🚨 Attack Distribution
                      </h2>

                      <ResponsiveContainer
                        width="100%"
                        height={350}
                      >

                        <PieChart>

                          <Pie
                            data={
                              securityAnalytics
                                .attack_distribution
                            }
                            dataKey="value"
                            nameKey="name"
                            outerRadius={130}
                            label
                          >

                            {
                              securityAnalytics
                                .attack_distribution
                                .map(
                                  (item, index) => (

                                    <Cell
                                      key={index}
                                      fill={
                                        COLORS[
                                          index %
                                          COLORS.length
                                        ]
                                      }
                                    />

                                  )
                                )
                            }

                          </Pie>

                          <Tooltip />

                        </PieChart>

                      </ResponsiveContainer>

                    </div>


                    <div className="prediction-box">

                      <h2>
                        📊 Weekly Security Trend
                      </h2>

                      <ResponsiveContainer
                        width="100%"
                        height={350}
                      >

                        <LineChart
                          data={
                            securityAnalytics
                              .weekly_trend
                          }
                        >

                          <CartesianGrid
                            strokeDasharray="3 3"
                          />

                          <XAxis
                            dataKey="week"
                          />

                          <YAxis />

                          <Tooltip />

                          <Legend />

                          <Line
                            type="monotone"
                            dataKey="attacks"
                            stroke="#14b8a6"
                            strokeWidth={3}
                          />

                        </LineChart>

                      </ResponsiveContainer>

                    </div>

                  </>

                )}

              </>

            )}


            {/* ==================================================
                RBAC
            ================================================== */}

            {activePage === "RBAC" && (

              <div className="prediction-box">

                <h2>
                  🔐 Role & Access Control
                </h2>

                <div className="cards">

                  <div className="card">

                    <h2>
                      Admin
                    </h2>

                    <p>
                      Full system access
                    </p>

                  </div>


                  <div className="card">

                    <h2>
                      Analyst
                    </h2>

                    <p>
                      Monitoring,
                      investigation and reports
                    </p>

                  </div>


                  <div className="card">

                    <h2>
                      Viewer
                    </h2>

                    <p>
                      Read-only access
                    </p>

                  </div>

                </div>

                <div className="result-box">

                  <p>
                    <strong>
                      Administrator:
                    </strong>{" "}
                    Manage users, models,
                    datasets and system settings.
                  </p>

                  <p>
                    <strong>
                      Security Analyst:
                    </strong>{" "}
                    Monitor traffic, investigate
                    threats and manage incidents.
                  </p>

                  <p>
                    <strong>
                      Viewer:
                    </strong>{" "}
                    Read-only access to
                    monitoring and reports.
                  </p>

                </div>

              </div>

            )}


            {/* ==================================================
                AUDIT
            ================================================== */}

            {activePage === "Audit" && (

              <div className="prediction-box">

                <h2>
                  📋 Audit Overview
                </h2>

                <p>
                  The current system records
                  operational security activity
                  through alerts, incidents and
                  user-management actions.
                </p>

                <div className="cards">

                  <div className="card">

                    <h2>
                      {totalAlerts}
                    </h2>

                    <p>
                      Security Events
                    </p>

                  </div>


                  <div className="card">

                    <h2>
                      {incidents.length}
                    </h2>

                    <p>
                      Incident Records
                    </p>

                  </div>


                  <div className="card">

                    <h2>
                      {totalUsers}
                    </h2>

                    <p>
                      Registered Users
                    </p>

                  </div>

                </div>

                <div className="result-box">

                  <h3>
                    Latest Security Activity
                  </h3>

                  {alerts
                    .slice(0, 10)
                    .map(
                      (alert) => (

                        <p
                          key={alert.id}
                        >
                          🚨 ALT-{alert.id} —{" "}
                          {alert.dataset} —{" "}
                          {alert.attack_type} —{" "}
                          {alert.severity}
                        </p>

                      )
                    )}

                </div>

              </div>

            )}


            {/* ==================================================
                SETTINGS
            ================================================== */}

            {activePage === "Settings" && (

              <div className="prediction-box">

                <h2>
                  ⚙️ System Settings
                </h2>

                <div className="cards">

                  <div className="card">

                    <h2>
                      🟢
                    </h2>

                    <p>
                      Database
                    </p>

                    <small>
                      Connected
                    </small>

                  </div>


                  <div className="card">

                    <h2>
                      🟢
                    </h2>

                    <p>
                      AI Detection
                    </p>

                    <small>
                      Operational
                    </small>

                  </div>


                  <div className="card">

                    <h2>
                      🟢
                    </h2>

                    <p>
                      Monitoring
                    </p>

                    <small>
                      Enabled
                    </small>

                  </div>

                </div>


                <div className="result-box">

                  <h3>
                    System Configuration
                  </h3>

                  <p>
                    <strong>
                      Default Monitoring:
                    </strong>{" "}
                    CICIDS2017 / UNSW-NB15
                  </p>

                  <p>
                    <strong>
                      Alert Storage:
                    </strong>{" "}
                    PostgreSQL
                  </p>

                  <p>
                    <strong>
                      Threat Detection:
                    </strong>{" "}
                    Random Forest
                  </p>

                  <p>
                    <strong>
                      Anomaly Detection:
                    </strong>{" "}
                    Isolation Forest
                  </p>

                  <p>
                    <strong>
                      Dashboard Refresh:
                    </strong>{" "}
                    15 seconds
                  </p>

                </div>

              </div>

            )}


            {/* ==================================================
                PROFILE
            ================================================== */}

            {activePage === "Profile" && (

              <div className="prediction-box">

                <h2>
                  👤 Administrator Profile
                </h2>

                <div className="result-box">

                  <p>
                    <strong>
                      Name:
                    </strong>{" "}
                    System Administrator
                  </p>

                  <p>
                    <strong>
                      Role:
                    </strong>{" "}
                    Security Administrator
                  </p>

                  <p>
                    <strong>
                      Platform:
                    </strong>{" "}
                    NetShield AI
                  </p>

                  <p>
                    <strong>
                      Users Managed:
                    </strong>{" "}
                    {totalUsers}
                  </p>

                  <p>
                    <strong>
                      Alerts Monitored:
                    </strong>{" "}
                    {totalAlerts}
                  </p>

                  <p>
                    <strong>
                      Incidents Overseen:
                    </strong>{" "}
                    {incidents.length}
                  </p>

                </div>

              </div>

            )}

          </>

        )}

      </main>

    </div>

  );

}

export default AdminDashboard;