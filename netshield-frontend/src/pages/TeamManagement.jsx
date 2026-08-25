import { useState } from "react";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import {
  FaUsers,
  FaUserPlus,
  FaUserEdit,
  FaTrashAlt,
  FaUserShield,
  FaClock,
  FaExclamationTriangle,
  FaCheckCircle,
  FaTimes,
  FaSearch
} from "react-icons/fa";
import "../styles/Dashboard.css";

const initialTeamMembers = [
  { id: 1, name: "Sarah Jenkins", role: "SOC Lead Administrator", status: "Active", shift: "Day (08:00 - 16:00)", assignedIncidents: 4, email: "sarah.j@netshield.ai" },
  { id: 2, name: "Alex Rivera", role: "Senior Incident Responder", status: "Active", shift: "Day (08:00 - 16:00)", assignedIncidents: 7, email: "alex.r@netshield.ai" },
  { id: 3, name: "Marcus Vance", role: "Threat Intelligence Analyst", status: "Active", shift: "Swing (16:00 - 00:00)", assignedIncidents: 3, email: "marcus.v@netshield.ai" },
  { id: 4, name: "Elena Rostova", role: "Tier 2 Security Analyst", status: "On Break", shift: "Swing (16:00 - 00:00)", assignedIncidents: 5, email: "elena.r@netshield.ai" },
  { id: 5, name: "David Kalu", role: "Tier 1 SOC Analyst", status: "Active", shift: "Night (00:00 - 08:00)", assignedIncidents: 2, email: "david.k@netshield.ai" },
  { id: 6, name: "Priya Sharma", role: "Malware Forensic Specialist", status: "Offline", shift: "Off Duty", assignedIncidents: 0, email: "priya.s@netshield.ai" }
];

function TeamManagement() {
  const [team, setTeam] = useState(initialTeamMembers);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    role: "Tier 1 SOC Analyst",
    status: "Active",
    shift: "Day (08:00 - 16:00)",
    assignedIncidents: 0,
    email: ""
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleOpenAddModal = () => {
    setEditingMember(null);
    setFormData({
      name: "",
      role: "Tier 1 SOC Analyst",
      status: "Active",
      shift: "Day (08:00 - 16:00)",
      assignedIncidents: 0,
      email: ""
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (member) => {
    setEditingMember(member);
    setFormData({
      name: member.name,
      role: member.role,
      status: member.status,
      shift: member.shift,
      assignedIncidents: member.assignedIncidents,
      email: member.email || ""
    });
    setIsAddModalOpen(true);
  };

  const handleSaveMember = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    if (editingMember) {
      setTeam((prev) =>
        prev.map((m) =>
          m.id === editingMember.id
            ? { ...m, ...formData, assignedIncidents: Number(formData.assignedIncidents) }
            : m
        )
      );
    } else {
      const newMember = {
        id: Date.now(),
        ...formData,
        assignedIncidents: Number(formData.assignedIncidents)
      };
      setTeam((prev) => [newMember, ...prev]);
    }
    setIsAddModalOpen(false);
  };

  const handleDeleteMember = (id) => {
    if (window.confirm("Are you sure you want to remove this team member?")) {
      setTeam((prev) => prev.filter((m) => m.id !== id));
    }
  };

  const filteredTeam = team.filter(
    (m) =>
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.shift.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status) => {
    switch (status.toLowerCase()) {
      case "active":
        return <span className="badge badge-low"><FaCheckCircle style={{ marginRight: "4px" }} /> Active</span>;
      case "on break":
        return <span className="badge badge-medium"><FaClock style={{ marginRight: "4px" }} /> On Break</span>;
      case "offline":
      default:
        return <span className="badge badge-normal" style={{ background: "rgba(100, 116, 139, 0.2)", color: "#94a3b8", borderColor: "#475569" }}>Offline</span>;
    }
  };

  return (
    <div className="soc-layout">
      <Sidebar role="Security Administrator" />
      <Topbar title="Team Management & Operations" />

      <div className="soc-main-content">
        <div className="dashboard-header">
          <div>
            <h1 className="dashboard-title">
              👥 Team Management
            </h1>
            <p className="dashboard-subtitle">
              Manage SOC Personnel, Duty Shifts, and Active Security Incident Assignments
            </p>
          </div>

          <button onClick={handleOpenAddModal} className="soc-btn-primary">
            <FaUserPlus /> Add Team Member
          </button>
        </div>

        {/* Team Overview Cards */}
        <div className="soc-grid-4">
          <div className="soc-card">
            <div className="soc-card-title">
              <FaUsers style={{ color: "#38bdf8" }} /> Total Personnel
            </div>
            <div className="soc-card-value">{team.length}</div>
            <div className="soc-card-subtext">SOC Roster Count</div>
          </div>

          <div className="soc-card">
            <div className="soc-card-title">
              <FaCheckCircle style={{ color: "#10b981" }} /> Active On Duty
            </div>
            <div className="soc-card-value" style={{ color: "#34d399" }}>
              {team.filter((t) => t.status === "Active").length}
            </div>
            <div className="soc-card-subtext">Analysts Currently Live</div>
          </div>

          <div className="soc-card">
            <div className="soc-card-title">
              <FaClock style={{ color: "#f59e0b" }} /> On Break
            </div>
            <div className="soc-card-value" style={{ color: "#fbbf24" }}>
              {team.filter((t) => t.status === "On Break").length}
            </div>
            <div className="soc-card-subtext">Standby / Break Rotation</div>
          </div>

          <div className="soc-card">
            <div className="soc-card-title">
              <FaExclamationTriangle style={{ color: "#ef4444" }} /> Assigned Incidents
            </div>
            <div className="soc-card-value" style={{ color: "#fca5a5" }}>
              {team.reduce((acc, curr) => acc + curr.assignedIncidents, 0)}
            </div>
            <div className="soc-card-subtext">Active Workload Items</div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="soc-card" style={{ marginBottom: "20px" }}>
          <div style={{ position: "relative", maxWidth: "400px" }}>
            <FaSearch style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#64748b" }} />
            <input
              type="text"
              placeholder="Search team member by name, role, or shift..."
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
        </div>

        {/* Team Members Table */}
        <div className="soc-card">
          <h3 style={{ fontSize: "1.1rem", color: "#f8fafc", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
            <FaUserShield style={{ color: "#00f2fe" }} /> SOC Analyst Roster
          </h3>

          <table className="soc-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Role</th>
                <th>Status</th>
                <th>Shift Schedule</th>
                <th>Assigned Incidents</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTeam.length > 0 ? (
                filteredTeam.map((member) => (
                  <tr key={member.id}>
                    <td style={{ fontWeight: "600", color: "#f8fafc" }}>
                      <div>{member.name}</div>
                      {member.email && (
                        <div style={{ fontSize: "0.8rem", color: "#64748b", fontFamily: "var(--font-mono)" }}>
                          {member.email}
                        </div>
                      )}
                    </td>
                    <td style={{ color: "#38bdf8", fontWeight: "500" }}>{member.role}</td>
                    <td>{getStatusBadge(member.status)}</td>
                    <td style={{ color: "#cbd5e1" }}>{member.shift}</td>
                    <td>
                      <span
                        style={{
                          background: member.assignedIncidents > 5 ? "rgba(239, 68, 68, 0.2)" : "rgba(59, 130, 246, 0.2)",
                          color: member.assignedIncidents > 5 ? "#fca5a5" : "#93c5fd",
                          padding: "2px 8px",
                          borderRadius: "12px",
                          fontWeight: "700",
                          fontSize: "0.85rem"
                        }}
                      >
                        {member.assignedIncidents} Incidents
                      </span>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <div style={{ display: "inline-flex", gap: "8px" }}>
                        <button
                          onClick={() => handleOpenEditModal(member)}
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
                          onClick={() => handleDeleteMember(member.id)}
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
                    No team members found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Member Modal */}
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
              maxWidth: "500px",
              padding: "24px",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.5)"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ fontSize: "1.2rem", color: "#f8fafc" }}>
                {editingMember ? "✏️ Edit Team Member" : "➕ Add New Team Member"}
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: "1.2rem" }}
              >
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleSaveMember}>
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "0.85rem", color: "#94a3b8", marginBottom: "6px" }}>
                  Full Name *
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g. Jordan Miller"
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

              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "0.85rem", color: "#94a3b8", marginBottom: "6px" }}>
                  Role *
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
                  <option value="SOC Lead Administrator">SOC Lead Administrator</option>
                  <option value="Senior Incident Responder">Senior Incident Responder</option>
                  <option value="Threat Intelligence Analyst">Threat Intelligence Analyst</option>
                  <option value="Tier 2 Security Analyst">Tier 2 Security Analyst</option>
                  <option value="Tier 1 SOC Analyst">Tier 1 SOC Analyst</option>
                  <option value="Malware Forensic Specialist">Malware Forensic Specialist</option>
                </select>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", color: "#94a3b8", marginBottom: "6px" }}>
                    Status
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
                    <option value="On Break">On Break</option>
                    <option value="Offline">Offline</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", color: "#94a3b8", marginBottom: "6px" }}>
                    Assigned Incidents
                  </label>
                  <input
                    type="number"
                    name="assignedIncidents"
                    min="0"
                    value={formData.assignedIncidents}
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
                  />
                </div>
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", fontSize: "0.85rem", color: "#94a3b8", marginBottom: "6px" }}>
                  Shift Schedule
                </label>
                <select
                  name="shift"
                  value={formData.shift}
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
                  <option value="Day (08:00 - 16:00)">Day (08:00 - 16:00)</option>
                  <option value="Swing (16:00 - 00:00)">Swing (16:00 - 00:00)</option>
                  <option value="Night (00:00 - 08:00)">Night (00:00 - 08:00)</option>
                  <option value="Off Duty">Off Duty</option>
                </select>
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
                  {editingMember ? "Save Changes" : "Add Member"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default TeamManagement;
