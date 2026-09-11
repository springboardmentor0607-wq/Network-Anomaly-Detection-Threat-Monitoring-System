import { useEffect, useState } from "react";
import axios from "axios";
import "./AdminDashboard.css";

const API_URL = "https://network-anomaly-detection-threat-5ihm.onrender.com";

function RoleManagementPage() {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadRoles = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await axios.get(
        `${API_URL}/auth/roles`
      );

      const data = Array.isArray(response.data)
        ? response.data
        : response.data?.roles || [];

      setRoles(data);
    } catch (err) {
      console.error("Failed to load roles:", err);

      setError(
        err.response?.data?.detail ||
          "Unable to load roles from the backend."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRoles();
  }, []);

  // ==================================================
  // REAL VALUES
  // ==================================================

  const totalUsers = roles.reduce(
    (sum, role) => sum + Number(role.users || 0),
    0
  );

  const activeRoles = roles.filter(
    (role) =>
      String(role.status || "").toLowerCase() === "active"
  ).length;

  return (
    <div className="page">

      {/* ===========================
          HEADER
      ============================ */}

      <div className="topbar">

        <div>
          <h1>🛡 Role Management</h1>

          <p>
            System Role Overview & Permissions
          </p>
        </div>

        <button
          type="button"
          className="action-btn"
          onClick={loadRoles}
          disabled={loading}
        >
          {loading ? "Loading..." : "🔄 Refresh"}
        </button>

      </div>

      {/* ===========================
          ERROR
      ============================ */}

      {error && (
        <div className="error-message">
          ⚠️ {error}
        </div>
      )}

      {/* ===========================
          RBAC SUMMARY
      ============================ */}

      <div className="cards">

        <div className="card">
          <h2>{roles.length}</h2>
          <p>Total Roles</p>
        </div>

        <div className="card">
          <h2>{totalUsers}</h2>
          <p>Total Users Assigned</p>
        </div>

        <div className="card">
          <h2>{activeRoles}</h2>
          <p>Active Roles</p>
        </div>

        <div className="card">
          <h2>100%</h2>
          <p>RBAC Enabled</p>
        </div>

      </div>

      {/* ===========================
          ROLE TABLE
      ============================ */}

      <div className="section">

        <h2>👥 System Roles</h2>

        <p>
          NetShield AI uses two fixed system roles:
          Administrator and Security Analyst.
        </p>

        {loading ? (

          <div className="warning-message">
            ⏳ Loading role information...
          </div>

        ) : roles.length === 0 ? (

          <div className="warning-message">
            ℹ️ No role information was returned by the backend.
          </div>

        ) : (

          <table>

            <thead>
              <tr>
                <th>Role</th>
                <th>Users</th>
                <th>Permissions</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>

              {roles.map((role, index) => {

                const status =
                  role.status || "Active";

                const statusValue =
                  String(status).toLowerCase();

                let statusClass =
                  "status-yellow";

                if (
                  statusValue === "active" ||
                  statusValue === "enabled"
                ) {
                  statusClass =
                    "status-green";
                }

                if (
                  statusValue === "inactive" ||
                  statusValue === "disabled"
                ) {
                  statusClass =
                    "status-red";
                }

                return (
                  <tr
                    key={
                      role.role ||
                      role.name ||
                      index
                    }
                  >

                    <td>
                      <strong>
                        {role.role ||
                          role.name ||
                          "Unknown Role"}
                      </strong>
                    </td>

                    <td>
                      {Number(role.users || 0)}
                    </td>

                    <td>
                      {role.permissions ||
                        "Defined by system policy"}
                    </td>

                    <td className={statusClass}>
                      {status}
                    </td>

                  </tr>
                );
              })}

            </tbody>

          </table>

        )}

      </div>

      {/* ===========================
          PERMISSION MATRIX
      ============================ */}

      <div className="section">

        <h2>🔑 Permission Matrix</h2>

        <p>
          Access permissions are fixed according to the
          NetShield AI RBAC design.
        </p>

        <table>

          <thead>

            <tr>
              <th>Permission</th>
              <th>Administrator</th>
              <th>Security Analyst</th>
            </tr>

          </thead>

          <tbody>

            <tr>
              <td>User Management</td>
              <td>✅ Full Access</td>
              <td>❌ No Access</td>
            </tr>

            <tr>
              <td>Threat Analysis</td>
              <td>✅ Full Access</td>
              <td>✅ Full Access</td>
            </tr>

            <tr>
              <td>Live Monitoring</td>
              <td>👁 View</td>
              <td>👁 View</td>
            </tr>

            <tr>
              <td>AI Prediction</td>
              <td>✅ Full Access</td>
              <td>✅ Full Access</td>
            </tr>

            <tr>
              <td>Incident Management</td>
              <td>✅ Full Access</td>
              <td>✅ Full Access</td>
            </tr>

            <tr>
              <td>Threat Alerts</td>
              <td>✅ Full Access</td>
              <td>✅ Full Access</td>
            </tr>

            <tr>
              <td>Reports</td>
              <td>✅ Full Access</td>
              <td>✅ Full Access</td>
            </tr>

            <tr>
              <td>Settings</td>
              <td>✅ Full Access</td>
              <td>❌ No Access</td>
            </tr>

          </tbody>

        </table>

      </div>

      {/* ===========================
          RBAC INFORMATION
      ============================ */}

      <div className="section">

        <h2>🛡 RBAC Configuration</h2>

        <div className="report-info">

          <div className="report-info-box">
            <h3>2</h3>
            <p>
              Fixed system roles
            </p>
          </div>

          <div className="report-info-box">
            <h3>RBAC</h3>
            <p>
              Role-Based Access Control
            </p>
          </div>

          <div className="report-info-box">
            <h3 className="status-green">
              Enabled
            </h3>
            <p>
              Access control is active
            </p>
          </div>

        </div>

      </div>

    </div>
  );
}

export default RoleManagementPage;