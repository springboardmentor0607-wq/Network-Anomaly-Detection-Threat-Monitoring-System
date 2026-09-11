import { useEffect, useState } from "react";
import axios from "axios";
import "./AdminDashboard.css";

const API_URL = "http://127.0.0.1:8000";

function OrganizationPage() {
  const [organization, setOrganization] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadOrganization = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await axios.get(
        `${API_URL}/auth/organization`
      );

      setOrganization(response.data);
    } catch (err) {
      console.error(
        "Failed to load organization:",
        err
      );

      setError(
        err.response?.data?.detail ||
          "Unable to load organization information from the backend."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrganization();
  }, []);

  // ==================================================
  // LOADING
  // ==================================================

  if (loading) {
    return (
      <div className="page">
        <div className="warning-message">
          ⏳ Loading organization information...
        </div>
      </div>
    );
  }

  // ==================================================
  // ERROR
  // ==================================================

  if (error) {
    return (
      <div className="page">
        <div className="error-message">
          ⚠️ {error}
        </div>

        <button
          type="button"
          className="action-btn"
          onClick={loadOrganization}
        >
          🔄 Try Again
        </button>
      </div>
    );
  }

  // ==================================================
  // EMPTY DATA
  // ==================================================

  if (!organization) {
    return (
      <div className="page">
        <div className="warning-message">
          ℹ️ No organization information available.
        </div>
      </div>
    );
  }

  // ==================================================
  // SAFE DATA HANDLING
  // ==================================================

  const departments = Array.isArray(
    organization.departments
  )
    ? organization.departments
    : [];

  const totalEmployees = Number(
    organization.total_users || 0
  );

  const activeDepartments = departments.filter(
    (dept) =>
      String(dept.status || "")
        .toLowerCase() === "active"
  ).length;

  // ==================================================
  // PAGE
  // ==================================================

  return (
    <div className="page">

      {/* ===========================
          HEADER
      ============================ */}

      <div className="topbar">

        <div>
          <h1>🏢 Organization Management</h1>

          <p>
            Organization Overview & Department Information
          </p>
        </div>

        <button
          type="button"
          className="action-btn"
          onClick={loadOrganization}
          disabled={loading}
        >
          🔄 Refresh
        </button>

      </div>

      {/* ===========================
          ORGANIZATION SUMMARY
      ============================ */}

      <div className="cards">

        <div className="card">
          <h2>{departments.length}</h2>
          <p>Total Departments</p>
        </div>

        <div className="card">
          <h2>{totalEmployees}</h2>
          <p>Total Employees</p>
        </div>

        <div className="card">
          <h2>{activeDepartments}</h2>
          <p>Active Departments</p>
        </div>

        <div className="card">
          <h2>2</h2>
          <p>Role Levels</p>
        </div>

      </div>

      {/* ===========================
          COMPANY INFORMATION
      ============================ */}

      <div className="section">

        <h2>🏢 Company Information</h2>

        <table>

          <tbody>

            <tr>
              <th>Organization</th>
              <td>
                {organization.organization ||
                  "Not available"}
              </td>
            </tr>

            <tr>
              <th>Head Office</th>
              <td>
                {organization.location ||
                  "Not available"}
              </td>
            </tr>

            <tr>
              <th>Industry</th>
              <td>
                {organization.industry ||
                  "Not available"}
              </td>
            </tr>

            <tr>
              <th>Established</th>
              <td>
                {organization.established ||
                  "Not available"}
              </td>
            </tr>

            <tr>
              <th>Total Employees</th>
              <td>{totalEmployees}</td>
            </tr>

          </tbody>

        </table>

      </div>

      {/* ===========================
          DEPARTMENTS
      ============================ */}

      <div className="section">

        <h2>🏬 Departments</h2>

        {departments.length === 0 ? (

          <div className="warning-message">
            ℹ️ No departments are currently available.
          </div>

        ) : (

          <table>

            <thead>

              <tr>
                <th>ID</th>
                <th>Department</th>
                <th>Manager</th>
                <th>Employees</th>
                <th>Status</th>
              </tr>

            </thead>

            <tbody>

              {departments.map(
                (dept, index) => {

                  const status =
                    dept.status || "Active";

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
                        dept.id ||
                        dept._id ||
                        index
                      }
                    >

                      <td>
                        {dept.id ||
                          dept._id ||
                          index + 1}
                      </td>

                      <td>
                        <strong>
                          {dept.name ||
                            "Unknown Department"}
                        </strong>
                      </td>

                      <td>
                        {dept.manager ||
                          "Not assigned"}
                      </td>

                      <td>
                        {Number(
                          dept.employees || 0
                        )}
                      </td>

                      <td
                        className={
                          statusClass
                        }
                      >
                        {status}
                      </td>

                    </tr>
                  );
                }
              )}

            </tbody>

          </table>

        )}

      </div>

      {/* ===========================
          ORGANIZATION HIERARCHY
      ============================ */}

      <div className="section">

        <h2>📋 Organization Hierarchy</h2>

        <table>

          <thead>

            <tr>
              <th>Level</th>
              <th>Role</th>
              <th>Access Type</th>
            </tr>

          </thead>

          <tbody>

            <tr>
              <td>Level 1</td>
              <td>Administrator</td>
              <td className="status-green">
                Full Administrative Access
              </td>
            </tr>

            <tr>
              <td>Level 2</td>
              <td>Security Analyst</td>
              <td className="status-blue">
                Security Analysis Access
              </td>
            </tr>

          </tbody>

        </table>

      </div>

      {/* ===========================
          ORGANIZATION STATUS
      ============================ */}

      <div className="section">

        <h2>🛡 Organization Status</h2>

        <div className="report-info">

          <div className="report-info-box">
            <h3>{departments.length}</h3>
            <p>
              Departments configured
            </p>
          </div>

          <div className="report-info-box">
            <h3>{totalEmployees}</h3>
            <p>
              Employees registered
            </p>
          </div>

          <div className="report-info-box">
            <h3 className="status-green">
              Active
            </h3>
            <p>
              NetShield AI organization status
            </p>
          </div>

        </div>

      </div>

    </div>
  );
}

export default OrganizationPage;