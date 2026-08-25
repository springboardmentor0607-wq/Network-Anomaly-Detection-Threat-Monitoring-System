import { useState } from "react";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import {
  FaUserCog,
  FaUserPlus,
  FaSearch,
  FaFilter,
  FaCheckCircle,
  FaBan,
  FaClock,
  FaUserEdit,
  FaTrashAlt,
  FaTimes,
  FaUserShield
} from "react-icons/fa";
import "../styles/Dashboard.css";

const initialUsers = [
  { id: 1, username: "admin_sarah", email: "sarah.j@netshield.ai", role: "Security Administrator", status: "Active", createdAt: "2026-01-15" },
  { id: 2, username: "analyst_alex", email: "alex.r@netshield.ai", role: "Security Analyst", status: "Active", createdAt: "2026-02-01" },
  { id: 3, username: "analyst_marcus", email: "marcus.v@netshield.ai", role: "Security Analyst", status: "Active", createdAt: "2026-02-10" },
  { id: 4, username: "auditor_elena", email: "elena.r@netshield.ai", role: "Auditor", status: "Pending", createdAt: "2026-07-28" },
  { id: 5, username: "analyst_david", email: "david.k@netshield.ai", role: "Security Analyst", status: "Active", createdAt: "2026-03-05" },
  { id: 6, username: "temp_operator", email: "temp.op@netshield.ai", role: "Security Analyst", status: "Suspended", createdAt: "2026-05-19" },
  { id: 7, username: "admin_michael", email: "michael.b@netshield.ai", role: "Security Administrator", status: "Active", createdAt: "2026-01-10" }
];

function UserManagement() {
  const [users, setUsers] = useState(initialUsers);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    role: "Security Analyst",
    status: "Active"
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleOpenAddModal = () => {
    setEditingUser(null);
    setFormData({
      username: "",
      email: "",
      role: "Security Analyst",
      status: "Active"
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (user) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      email: user.email,
      role: user.role,
      status: user.status
    });
    setIsAddModalOpen(true);
  };

  const handleSaveUser = (e) => {
    e.preventDefault();
    if (!formData.username.trim() || !formData.email.trim()) return;

    if (editingUser) {
      setUsers((prev) =>
        prev.map((u) => (u.id === editingUser.id ? { ...u, ...formData } : u))
      );
    } else {
      const newUser = {
        id: Date.now(),
        ...formData,
        createdAt: new Date().toISOString().split("T")[0]
      };
      setUsers((prev) => [newUser, ...prev]);
    }
    setIsAddModalOpen(false);
  };

  const handleDeleteUser = (id) => {
    if (window.confirm("Are you sure you want to delete this registered user account?")) {
      setUsers((prev) => prev.filter((u) => u.id !== id));
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.role.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = roleFilter === "All" || u.role === roleFilter;
    const matchesStatus = statusFilter === "All" || u.status === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  const getStatusBadge = (status) => {
    switch (status.toLowerCase()) {
      case "active":
        return <span className="badge badge-low"><FaCheckCircle style={{ marginRight: "4px" }} /> Active</span>;
      case "suspended":
        return <span className="badge badge-critical"><FaBan style={{ marginRight: "4px" }} /> Suspended</span>;
      case "pending":
      default:
        return <span className="badge badge-medium"><FaClock style={{ marginRight: "4px" }} /> Pending</span>;
    }
  };

  return (
    <div className="soc-layout">
      <Sidebar role="Security Administrator" />
      <Topbar title="User Management & RBAC Administration" />

      <div className="soc-main-content">
        <div className="dashboard-header">
          <div>
            <h1 className="dashboard-title">
              👤 User Management
            </h1>
            <p className="dashboard-subtitle">
              System User Directory, Identity Access Management (IAM) & Role-Based Permissions
            </p>
          </div>

          <button onClick={handleOpenAddModal} className="soc-btn-primary">
            <FaUserPlus /> Add User
          </button>
        </div>

        {/* User Stats Grid */}
        <div className="soc-grid-4">
          <div className="soc-card">
            <div className="soc-card-title">
              <FaUserShield style={{ color: "#38bdf8" }} /> Total Accounts
            </div>
            <div className="soc-card-value">{users.length}</div>
            <div className="soc-card-subtext">Registered User Profiles</div>
          </div>

          <div className="soc-card">
            <div className="soc-card-title">
              <FaCheckCircle style={{ color: "#10b981" }} /> Active Users
            </div>
            <div className="soc-card-value" style={{ color: "#34d399" }}>
              {users.filter((u) => u.status === "Active").length}
            </div>
            <div className="soc-card-subtext">Enabled Identity Credentials</div>
          </div>

          <div className="soc-card">
            <div className="soc-card-title">
              <FaClock style={{ color: "#f59e0b" }} /> Pending Approval
            </div>
            <div className="soc-card-value" style={{ color: "#fbbf24" }}>
              {users.filter((u) => u.status === "Pending").length}
            </div>
            <div className="soc-card-subtext">Awaiting Admin Verification</div>
          </div>

          <div className="soc-card">
            <div className="soc-card-title">
              <FaBan style={{ color: "#ef4444" }} /> Suspended Accounts
            </div>
            <div className="soc-card-value" style={{ color: "#fca5a5" }}>
              {users.filter((u) => u.status === "Suspended").length}
            </div>
            <div className="soc-card-subtext">Revoked / Inactive Access</div>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="soc-card" style={{ marginBottom: "24px" }}>
          <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", alignItems: "center" }}>
            <div style={{ position: "relative", flex: 1, minWidth: "240px" }}>
              <FaSearch style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#64748b" }} />
              <input
                type="text"
                placeholder="Search username, email, or role..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 14px 10px 40px",
                  background: "#1e293b",
                  border: "1px solid #334155",
                  borderRadius: "8px",
                  color: "#f8fafc",
                  fontSize: "0.9rem",
                  outline: "none"
                }}
              />
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <FaFilter style={{ color: "#38bdf8" }} />
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                style={{
                  padding: "10px 14px",
                  background: "#1e293b",
                  border: "1px solid #334155",
                  borderRadius: "8px",
                  color: "#f8fafc",
                  fontSize: "0.9rem",
                  outline: "none",
                  cursor: "pointer"
                }}
              >
                <option value="All">All Roles</option>
                <option value="Security Administrator">Security Administrator</option>
                <option value="Security Analyst">Security Analyst</option>
                <option value="Auditor">Auditor</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{
                  padding: "10px 14px",
                  background: "#1e293b",
                  border: "1px solid #334155",
                  borderRadius: "8px",
                  color: "#f8fafc",
                  fontSize: "0.9rem",
                  outline: "none",
                  cursor: "pointer"
                }}
              >
                <option value="All">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Pending">Pending</option>
                <option value="Suspended">Suspended</option>
              </select>
            </div>
          </div>
        </div>

        {/* Registered Users Table */}
        <div className="soc-card">
          <h3 style={{ fontSize: "1.1rem", color: "#f8fafc", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
            <FaUserCog style={{ color: "#00f2fe" }} /> Registered System Accounts
          </h3>

          <table className="soc-table">
            <thead>
              <tr>
                <th>Username</th>
                <th>Email Address</th>
                <th>Assigned Role</th>
                <th>Account Status</th>
                <th>Created Date</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td style={{ fontWeight: "600", color: "#38bdf8", fontFamily: "var(--font-mono)" }}>
                      {user.username}
                    </td>
                    <td style={{ color: "#f8fafc" }}>{user.email}</td>
                    <td>
                      <span
                        style={{
                          background: user.role === "Security Administrator" ? "rgba(168, 85, 247, 0.2)" : "rgba(56, 189, 248, 0.2)",
                          color: user.role === "Security Administrator" ? "#c084fc" : "#38bdf8",
                          padding: "4px 10px",
                          borderRadius: "12px",
                          fontSize: "0.8rem",
                          fontWeight: "600"
                        }}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td>{getStatusBadge(user.status)}</td>
                    <td style={{ fontFamily: "var(--font-mono)", color: "#94a3b8" }}>{user.createdAt}</td>
                    <td style={{ textAlign: "right" }}>
                      <div style={{ display: "inline-flex", gap: "8px" }}>
                        <button
                          onClick={() => handleOpenEditModal(user)}
                          style={{
                            background: "rgba(59, 130, 246, 0.15)",
                            color: "#60a5fa",
                            border: "1px solid rgba(59, 130, 246, 0.4)",
                            padding: "6px 12px",
                            borderRadius: "6px",
                            cursor: "pointer",
                            fontSize: "0.85rem",
                            display: "flex",
                            alignItems: "center",
                            gap: "6px"
                          }}
                        >
                          <FaUserEdit /> Edit
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          style={{
                            background: "rgba(239, 68, 68, 0.15)",
                            color: "#f87171",
                            border: "1px solid rgba(239, 68, 68, 0.4)",
                            padding: "6px 12px",
                            borderRadius: "6px",
                            cursor: "pointer",
                            fontSize: "0.85rem",
                            display: "flex",
                            alignItems: "center",
                            gap: "6px"
                          }}
                        >
                          <FaTrashAlt /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" style={{ textAlign: "center", padding: "24px", color: "#64748b" }}>
                    No registered user accounts match your filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit User Modal */}
      {isAddModalOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(11, 15, 25, 0.8)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000
          }}
        >
          <div
            style={{
              background: "#1f293d",
              border: "1px solid #2b3954",
              borderRadius: "12px",
              width: "100%",
              maxWidth: "480px",
              padding: "24px",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.5)"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ fontSize: "1.2rem", color: "#f8fafc" }}>
                {editingUser ? "✏️ Edit System User" : "➕ Add New Registered User"}
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: "1.2rem" }}
              >
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleSaveUser}>
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "0.85rem", color: "#94a3b8", marginBottom: "6px" }}>
                  Username *
                </label>
                <input
                  type="text"
                  name="username"
                  required
                  value={formData.username}
                  onChange={handleInputChange}
                  placeholder="e.g. analyst_taylor"
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

              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "0.85rem", color: "#94a3b8", marginBottom: "6px" }}>
                  Email Address *
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="e.g. taylor@netshield.ai"
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

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", color: "#94a3b8", marginBottom: "6px" }}>
                    Role
                  </label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      background: "#0f172a",
                      border: "1px solid #334155",
                      borderRadius: "8px",
                      color: "#f8fafc",
                      outline: "none"
                    }}
                  >
                    <option value="Security Analyst">Security Analyst</option>
                    <option value="Security Administrator">Security Administrator</option>
                    <option value="Auditor">Auditor</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", color: "#94a3b8", marginBottom: "6px" }}>
                    Account Status
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      background: "#0f172a",
                      border: "1px solid #334155",
                      borderRadius: "8px",
                      color: "#f8fafc",
                      outline: "none"
                    }}
                  >
                    <option value="Active">Active</option>
                    <option value="Pending">Pending</option>
                    <option value="Suspended">Suspended</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  style={{
                    padding: "10px 16px",
                    background: "#334155",
                    border: "none",
                    borderRadius: "8px",
                    color: "#f8fafc",
                    cursor: "pointer"
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="soc-btn-primary">
                  {editingUser ? "Save Changes" : "Create User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserManagement;
