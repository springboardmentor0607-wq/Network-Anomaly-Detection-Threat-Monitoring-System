import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import { API_BASE_URL } from "../config";
import {
  FaShieldAlt,
  FaExclamationTriangle,
  FaSearch,
  FaFilter,
  FaCheckCircle,
  FaClock,
  FaUserCheck,
  FaClipboardList,
  FaHistory,
  FaEdit,
  FaSave,
  FaInfoCircle,
  FaTimes
} from "react-icons/fa";
import "../styles/Dashboard.css";


function IncidentManagement() {
  const location = useLocation();
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [severityFilter, setSeverityFilter] = useState("All");
  const [selectedIncident, setSelectedIncident] = useState(null);
  
  // Incident edit state
  const [currentStatus, setCurrentStatus] = useState("New");
  const [investigationNotes, setInvestigationNotes] = useState("");
  const [actionTakenText, setActionTakenText] = useState("");
  const [resolutionDetailsText, setResolutionDetailsText] = useState("");
  const [responsibleAnalyst, setResponsibleAnalyst] = useState("Security Analyst");
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("details"); // 'details' | 'history'

  const fetchIncidents = async () => {
    setLoading(true);
    try {
      let url = `${API_BASE_URL}/incidents`;
      const params = new URLSearchParams();
      if (statusFilter !== "All") params.append("status", statusFilter);
      if (severityFilter !== "All") params.append("severity", severityFilter);
      if (searchTerm) params.append("search", searchTerm);
      if (params.toString()) url += `?${params.toString()}`;

      const res = await fetch(url);
      const data = await res.json();
      if (Array.isArray(data)) {
        setIncidents(data);

        // Check if query param specifies an incident ID to open
        const queryParams = new URLSearchParams(location.search);
        const targetId = queryParams.get("id") || queryParams.get("incident_id");
        if (targetId) {
          const match = data.find(i => i.incident_id === targetId || String(i.id) === targetId);
          if (match) {
            openIncidentDetails(match.incident_id);
          }
        }
      }
    } catch (err) {
      console.error("Error fetching incidents:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, [statusFilter, severityFilter, location.search]);

  const openIncidentDetails = async (incId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/incidents/${incId}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedIncident(data);
        setCurrentStatus(data.status || "New");
        setInvestigationNotes(data.investigation_details || "");
        setActionTakenText(data.action_taken || "");
        setResolutionDetailsText(data.resolution_details || "");
        setResponsibleAnalyst(data.responsible_user || "Security Analyst");
      }
    } catch (err) {
      console.error("Error loading incident details:", err);
    }
  };

  const handleUpdateIncident = async (e) => {
    if (e) e.preventDefault();
    if (!selectedIncident) return;

    setSaving(true);
    try {
      const storedUser = JSON.parse(localStorage.getItem("netshield_user") || "{}");
      const user = storedUser.username || responsibleAnalyst || "Security Analyst";

      const res = await fetch(`${API_BASE_URL}/incidents/${selectedIncident.incident_id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: currentStatus,
          investigation_details: investigationNotes,
          action_taken: actionTakenText,
          resolution_details: resolutionDetailsText,
          responsible_user: user,
          notes: `Updated incident status to '${currentStatus}'.`
        })
      });

      if (res.ok) {
        const updated = await res.json();
        setSelectedIncident(updated);
        alert(`Incident ${updated.incident_id} successfully updated!`);
        fetchIncidents();
      } else {
        alert("Failed to update incident.");
      }
    } catch (err) {
      console.error("Error updating incident:", err);
      alert("Error saving incident updates.");
    } finally {
      setSaving(false);
    }
  };

  // KPI calculations
  const totalCount = incidents.length;
  const newCount = incidents.filter(i => i.status === "New").length;
  const investigatingCount = incidents.filter(i => i.status === "Investigating").length;
  const actionRequiredCount = incidents.filter(i => i.status === "Action Required").length;
  const resolvedCount = incidents.filter(i => i.status === "Resolved").length;
  const criticalCount = incidents.filter(i => (i.threat_severity || i.severity || "").toLowerCase() === "critical").length;

  const getSeverityBadge = (sev) => {
    switch ((sev || "").toLowerCase()) {
      case "critical": return <span className="badge badge-critical">CRITICAL</span>;
      case "high": return <span className="badge badge-high">HIGH</span>;
      case "medium": return <span className="badge badge-medium">MEDIUM</span>;
      case "low": default: return <span className="badge badge-low">LOW</span>;
    }
  };

  const getStatusBadge = (st) => {
    switch ((st || "").toLowerCase()) {
      case "new":
        return <span className="status-badge status-investigating" style={{ background: "rgba(56, 189, 248, 0.2)", color: "#38bdf8", border: "1px solid #38bdf8" }}>New</span>;
      case "investigating":
        return <span className="status-badge status-investigating" style={{ background: "rgba(245, 158, 11, 0.2)", color: "#fbbf24", border: "1px solid #f59e0b" }}>Investigating</span>;
      case "action required":
        return <span className="status-badge status-blocked" style={{ background: "rgba(239, 68, 68, 0.2)", color: "#fca5a5", border: "1px solid #ef4444" }}>Action Required</span>;
      case "resolved":
        return <span className="status-badge status-resolved" style={{ background: "rgba(16, 185, 129, 0.2)", color: "#34d399", border: "1px solid #10b981" }}>Resolved</span>;
      default:
        return <span className="status-badge">{st}</span>;
    }
  };

  return (
    <div className="soc-layout">
      <Sidebar role="Security Analyst" />
      <Topbar title="Security Incident Management & Response Workflow" />

      <div className="soc-main-content">
        {/* Header */}
        <div className="dashboard-header">
          <div>
            <h1 className="dashboard-title">
              🛡️ Security Incident Management
            </h1>
            <p className="dashboard-subtitle">
              Automated Incident Lifecycle Tracking: New → Investigating → Action Required → Resolved
            </p>
          </div>
        </div>

        {/* KPI Cards Grid */}
        <div className="soc-grid-4" style={{ marginBottom: "24px" }}>
          {/* Total Incidents */}
          <div className="soc-card" style={{ borderColor: "rgba(56, 189, 248, 0.4)" }}>
            <div className="soc-card-title">
              <FaClipboardList style={{ color: "#38bdf8" }} /> Total Incidents
            </div>
            <div className="soc-card-value" style={{ color: "#38bdf8" }}>
              {totalCount}
            </div>
            <div className="soc-card-subtext">Active Database Records</div>
          </div>

          {/* New / Open */}
          <div className="soc-card" style={{ borderColor: "rgba(245, 158, 11, 0.4)" }}>
            <div className="soc-card-title">
              <FaClock style={{ color: "#f59e0b" }} /> New / Open
            </div>
            <div className="soc-card-value" style={{ color: "#fbbf24" }}>
              {newCount + investigatingCount}
            </div>
            <div className="soc-card-subtext">Triage & Active Investigation</div>
          </div>

          {/* Action Required */}
          <div className="soc-card" style={{ borderColor: "rgba(239, 68, 68, 0.4)" }}>
            <div className="soc-card-title">
              <FaExclamationTriangle style={{ color: "#ef4444" }} /> Action Required
            </div>
            <div className="soc-card-value" style={{ color: "#fca5a5" }}>
              {actionRequiredCount}
            </div>
            <div className="soc-card-subtext">Immediate Mitigation Needed</div>
          </div>

          {/* Resolved */}
          <div className="soc-card" style={{ borderColor: "rgba(16, 185, 129, 0.4)" }}>
            <div className="soc-card-title">
              <FaCheckCircle style={{ color: "#10b981" }} /> Resolved
            </div>
            <div className="soc-card-value" style={{ color: "#34d399" }}>
              {resolvedCount}
            </div>
            <div className="soc-card-subtext">Mitigated & Closed</div>
          </div>
        </div>

        {/* Main Incident List Card */}
        <div className="soc-card">
          {/* Controls: Search and Filters */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "12px" }}>
            <h3 style={{ fontSize: "1.1rem", color: "#f8fafc", display: "flex", alignItems: "center", gap: "8px", margin: 0 }}>
              <FaShieldAlt style={{ color: "#00f2fe" }} /> Active Security Incident Queue
            </h3>

            <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
              {/* Search Bar */}
              <div style={{ position: "relative", minWidth: "240px" }}>
                <FaSearch style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#64748b" }} />
                <input
                  type="text"
                  placeholder="Search Incident ID, IP, attack..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyUp={(e) => { if (e.key === "Enter") fetchIncidents(); }}
                  style={{
                    width: "100%",
                    padding: "8px 12px 8px 36px",
                    background: "#0f172a",
                    border: "1px solid #334155",
                    borderRadius: "8px",
                    color: "#f8fafc",
                    fontSize: "0.85rem",
                    outline: "none"
                  }}
                />
              </div>

              {/* Status Filter */}
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <FaFilter style={{ color: "#38bdf8" }} />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  style={{
                    padding: "8px 12px",
                    background: "#0f172a",
                    border: "1px solid #334155",
                    borderRadius: "8px",
                    color: "#f8fafc",
                    fontSize: "0.85rem",
                    outline: "none",
                    cursor: "pointer"
                  }}
                >
                  <option value="All">All Statuses</option>
                  <option value="New">New</option>
                  <option value="Investigating">Investigating</option>
                  <option value="Action Required">Action Required</option>
                  <option value="Resolved">Resolved</option>
                </select>
              </div>

              {/* Severity Filter */}
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <select
                  value={severityFilter}
                  onChange={(e) => setSeverityFilter(e.target.value)}
                  style={{
                    padding: "8px 12px",
                    background: "#0f172a",
                    border: "1px solid #334155",
                    borderRadius: "8px",
                    color: "#f8fafc",
                    fontSize: "0.85rem",
                    outline: "none",
                    cursor: "pointer"
                  }}
                >
                  <option value="All">All Severities</option>
                  <option value="Critical">Critical</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>
            </div>
          </div>

          {/* Table */}
          <div style={{ overflowX: "auto" }}>
            <table className="soc-table">
              <thead>
                <tr>
                  <th>Incident ID</th>
                  <th>Related Alert</th>
                  <th>Attack Type</th>
                  <th>Severity</th>
                  <th>Risk Score</th>
                  <th>AI Confidence</th>
                  <th>Source → Dest IP</th>
                  <th>Detection Time</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {incidents.length > 0 ? (
                  incidents.map((inc, idx) => {
                    const isCritical = (inc.threat_severity || inc.severity || "").toLowerCase() === "critical";
                    const isHigh = (inc.threat_severity || inc.severity || "").toLowerCase() === "high";

                    return (
                      <tr
                        key={inc.id || idx}
                        style={{
                          background: isCritical
                            ? "rgba(239, 68, 68, 0.05)"
                            : isHigh
                            ? "rgba(249, 115, 22, 0.03)"
                            : "transparent"
                        }}
                      >
                        <td style={{ fontFamily: "var(--font-mono)", fontWeight: "700", color: "#38bdf8" }}>
                          {inc.incident_id}
                        </td>
                        <td style={{ fontFamily: "var(--font-mono)", color: "#94a3b8", fontSize: "0.82rem" }}>
                          {inc.alert_id || "N/A"}
                        </td>
                        <td style={{ fontWeight: "600", color: "#f8fafc" }}>
                          {inc.attack_type}
                        </td>
                        <td>
                          {getSeverityBadge(inc.threat_severity || inc.severity)}
                        </td>
                        <td style={{ fontFamily: "var(--font-mono)", fontWeight: "700", color: inc.risk_score >= 75 ? "#ef4444" : inc.risk_score >= 45 ? "#f97316" : "#10b981" }}>
                          {inc.risk_score} / 100
                        </td>
                        <td style={{ fontFamily: "var(--font-mono)", color: "#c084fc", fontWeight: "700" }}>
                          {inc.confidence}
                        </td>
                        <td style={{ fontFamily: "var(--font-mono)", fontSize: "0.82rem" }}>
                          <span style={{ color: "#38bdf8" }}>{inc.source_ip}</span>
                          <span style={{ color: "#64748b", margin: "0 4px" }}>→</span>
                          <span style={{ color: "#a855f7" }}>{inc.dest_ip}</span>
                        </td>
                        <td style={{ fontFamily: "var(--font-mono)", color: "#94a3b8", fontSize: "0.82rem" }}>
                          {inc.detection_timestamp}
                        </td>
                        <td>
                          {getStatusBadge(inc.status)}
                        </td>
                        <td>
                          <button
                            onClick={() => openIncidentDetails(inc.incident_id)}
                            style={{
                              padding: "4px 10px",
                              background: "rgba(0, 242, 254, 0.15)",
                              border: "1px solid #00f2fe",
                              color: "#00f2fe",
                              borderRadius: "6px",
                              fontSize: "0.78rem",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: "4px"
                            }}
                          >
                            <FaInfoCircle /> View Details
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="10" style={{ textAlign: "center", padding: "28px", color: "#64748b" }}>
                      <FaShieldAlt style={{ fontSize: "1.6rem", marginBottom: "8px", display: "block", margin: "0 auto 8px" }} />
                      No security incidents found matching the specified filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detailed Incident Modal Drawer */}
        {selectedIncident && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(15, 23, 42, 0.88)",
              backdropFilter: "blur(6px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 9999,
              padding: "20px"
            }}
          >
            <div
              style={{
                background: "#1e293b",
                border: "1px solid #334155",
                borderRadius: "12px",
                width: "100%",
                maxWidth: "760px",
                maxHeight: "90vh",
                overflowY: "auto",
                padding: "24px",
                color: "#f8fafc",
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.7)"
              }}
            >
              {/* Modal Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "16px", borderBottom: "1px solid #334155", marginBottom: "20px" }}>
                <div>
                  <h3 style={{ fontSize: "1.2rem", margin: 0, color: "#00f2fe", display: "flex", alignItems: "center", gap: "8px" }}>
                    <FaShieldAlt /> Incident Investigation Details ({selectedIncident.incident_id})
                  </h3>
                  <span style={{ fontSize: "0.82rem", color: "#94a3b8" }}>
                    Linked Security Alert: <strong style={{ color: "#38bdf8" }}>{selectedIncident.alert_id || "None"}</strong> | Detection Time: {selectedIncident.detection_timestamp}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedIncident(null)}
                  style={{ background: "none", border: "none", color: "#94a3b8", fontSize: "1.3rem", cursor: "pointer" }}
                >
                  <FaTimes />
                </button>
              </div>

              {/* Tabs header */}
              <div style={{ display: "flex", gap: "12px", borderBottom: "1px solid #334155", marginBottom: "20px" }}>
                <button
                  onClick={() => setActiveTab("details")}
                  style={{
                    padding: "8px 16px",
                    background: activeTab === "details" ? "rgba(0, 242, 254, 0.15)" : "transparent",
                    border: "none",
                    borderBottom: activeTab === "details" ? "2px solid #00f2fe" : "2px solid transparent",
                    color: activeTab === "details" ? "#00f2fe" : "#94a3b8",
                    fontWeight: "600",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px"
                  }}
                >
                  <FaEdit /> Workflow & Details
                </button>
                <button
                  onClick={() => setActiveTab("history")}
                  style={{
                    padding: "8px 16px",
                    background: activeTab === "history" ? "rgba(0, 242, 254, 0.15)" : "transparent",
                    border: "none",
                    borderBottom: activeTab === "history" ? "2px solid #00f2fe" : "2px solid transparent",
                    color: activeTab === "history" ? "#00f2fe" : "#94a3b8",
                    fontWeight: "600",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px"
                  }}
                >
                  <FaHistory /> Audit Timeline ({selectedIncident.history ? selectedIncident.history.length : 0})
                </button>
              </div>

              {/* Tab 1: Incident Workflow & Details */}
              {activeTab === "details" && (
                <form onSubmit={handleUpdateIncident}>
                  {/* Threat Metadata Grid */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px", background: "#0f172a", padding: "16px", borderRadius: "8px", marginBottom: "20px" }}>
                    <div>
                      <span style={{ fontSize: "0.78rem", color: "#94a3b8", display: "block" }}>Attack Type</span>
                      <strong style={{ color: "#ef4444", fontSize: "1rem" }}>{selectedIncident.attack_type}</strong>
                    </div>
                    <div>
                      <span style={{ fontSize: "0.78rem", color: "#94a3b8", display: "block" }}>Threat Severity</span>
                      {getSeverityBadge(selectedIncident.threat_severity || selectedIncident.severity)}
                    </div>
                    <div>
                      <span style={{ fontSize: "0.78rem", color: "#94a3b8", display: "block" }}>Risk Score</span>
                      <strong style={{ color: selectedIncident.risk_score >= 75 ? "#ef4444" : "#f97316" }}>{selectedIncident.risk_score} / 100</strong>
                    </div>
                    <div>
                      <span style={{ fontSize: "0.78rem", color: "#94a3b8", display: "block" }}>AI Confidence</span>
                      <strong style={{ color: "#c084fc" }}>{selectedIncident.confidence}</strong>
                    </div>
                    <div>
                      <span style={{ fontSize: "0.78rem", color: "#94a3b8", display: "block" }}>Source IP</span>
                      <span style={{ fontFamily: "var(--font-mono)", color: "#38bdf8" }}>{selectedIncident.source_ip}</span>
                    </div>
                    <div>
                      <span style={{ fontSize: "0.78rem", color: "#94a3b8", display: "block" }}>Destination IP</span>
                      <span style={{ fontFamily: "var(--font-mono)", color: "#a855f7" }}>{selectedIncident.dest_ip}</span>
                    </div>
                    <div>
                      <span style={{ fontSize: "0.78rem", color: "#94a3b8", display: "block" }}>Protocol</span>
                      <span style={{ fontFamily: "var(--font-mono)" }}>{selectedIncident.protocol || "TCP"}</span>
                    </div>
                    <div>
                      <span style={{ fontSize: "0.78rem", color: "#94a3b8", display: "block" }}>Current Status</span>
                      {getStatusBadge(selectedIncident.status)}
                    </div>
                  </div>

                  {/* Lifecycle Status Selector */}
                  <div style={{ marginBottom: "16px" }}>
                    <label style={{ display: "block", fontSize: "0.88rem", color: "#cbd5e1", fontWeight: "600", marginBottom: "6px" }}>
                      Incident Lifecycle Status Transition:
                    </label>
                    <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                      {["New", "Investigating", "Action Required", "Resolved"].map((st) => (
                        <button
                          key={st}
                          type="button"
                          onClick={() => setCurrentStatus(st)}
                          style={{
                            padding: "8px 16px",
                            borderRadius: "6px",
                            fontSize: "0.85rem",
                            fontWeight: "600",
                            cursor: "pointer",
                            border: currentStatus === st ? "2px solid #00f2fe" : "1px solid #334155",
                            background: currentStatus === st ? "rgba(0, 242, 254, 0.2)" : "#0f172a",
                            color: currentStatus === st ? "#00f2fe" : "#94a3b8"
                          }}
                        >
                          {st === "New" && "1. New"}
                          {st === "Investigating" && "2. Investigating"}
                          {st === "Action Required" && "3. Action Required"}
                          {st === "Resolved" && "4. Resolved"}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Investigation Notes */}
                  <div style={{ marginBottom: "16px" }}>
                    <label style={{ display: "block", fontSize: "0.88rem", color: "#cbd5e1", fontWeight: "600", marginBottom: "6px" }}>
                      Investigation Details & Forensic Notes:
                    </label>
                    <textarea
                      rows="3"
                      placeholder="Record packet payload findings, IP history, or SOC analyst investigation observations..."
                      value={investigationNotes}
                      onChange={(e) => setInvestigationNotes(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "10px",
                        background: "#0f172a",
                        border: "1px solid #334155",
                        borderRadius: "8px",
                        color: "#f8fafc",
                        fontSize: "0.88rem",
                        outline: "none"
                      }}
                    />
                  </div>

                  {/* Action Taken */}
                  <div style={{ marginBottom: "16px" }}>
                    <label style={{ display: "block", fontSize: "0.88rem", color: "#cbd5e1", fontWeight: "600", marginBottom: "6px" }}>
                      Action Taken (Mitigation & Firewall Rules):
                    </label>
                    <textarea
                      rows="2"
                      placeholder="e.g. Blocked source IP at gateway firewall, isolated subnet socket, revoked credential token..."
                      value={actionTakenText}
                      onChange={(e) => setActionTakenText(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "10px",
                        background: "#0f172a",
                        border: "1px solid #334155",
                        borderRadius: "8px",
                        color: "#f8fafc",
                        fontSize: "0.88rem",
                        outline: "none"
                      }}
                    />
                  </div>

                  {/* Resolution Details */}
                  <div style={{ marginBottom: "16px" }}>
                    <label style={{ display: "block", fontSize: "0.88rem", color: "#cbd5e1", fontWeight: "600", marginBottom: "6px" }}>
                      Resolution Summary & Final Report:
                    </label>
                    <textarea
                      rows="2"
                      placeholder="Provide post-incident resolution notes upon closing..."
                      value={resolutionDetailsText}
                      onChange={(e) => setResolutionDetailsText(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "10px",
                        background: "#0f172a",
                        border: "1px solid #334155",
                        borderRadius: "8px",
                        color: "#f8fafc",
                        fontSize: "0.88rem",
                        outline: "none"
                      }}
                    />
                  </div>

                  {/* Responsible Analyst */}
                  <div style={{ marginBottom: "20px", display: "flex", gap: "12px", alignItems: "center" }}>
                    <label style={{ fontSize: "0.88rem", color: "#cbd5e1", fontWeight: "600" }}>
                      Assigned Analyst:
                    </label>
                    <input
                      type="text"
                      value={responsibleAnalyst}
                      onChange={(e) => setResponsibleAnalyst(e.target.value)}
                      style={{
                        padding: "6px 12px",
                        background: "#0f172a",
                        border: "1px solid #334155",
                        borderRadius: "6px",
                        color: "#f8fafc",
                        fontSize: "0.85rem",
                        outline: "none"
                      }}
                    />
                  </div>

                  {/* Save buttons */}
                  <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
                    <button
                      type="button"
                      onClick={() => setSelectedIncident(null)}
                      className="soc-btn-secondary"
                    >
                      Close
                    </button>
                    <button
                      type="submit"
                      className="soc-btn-primary"
                      disabled={saving}
                    >
                      <FaSave /> {saving ? "Saving Changes..." : "Save & Update Incident"}
                    </button>
                  </div>
                </form>
              )}

              {/* Tab 2: Audit History Log */}
              {activeTab === "history" && (
                <div>
                  <h4 style={{ color: "#38bdf8", marginBottom: "12px", fontSize: "0.95rem" }}>
                    📜 Persistent Incident Audit Log & State History
                  </h4>

                  {selectedIncident.history && selectedIncident.history.length > 0 ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                      {selectedIncident.history.map((h, idx) => (
                        <div
                          key={idx}
                          style={{
                            background: "#0f172a",
                            borderLeft: "3px solid #00f2fe",
                            padding: "12px",
                            borderRadius: "6px"
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", marginBottom: "4px" }}>
                            <strong style={{ color: "#38bdf8" }}>{h.action_type}</strong>
                            <span style={{ color: "#94a3b8", fontFamily: "var(--font-mono)" }}>{h.timestamp}</span>
                          </div>
                          <div style={{ fontSize: "0.82rem", color: "#cbd5e1", marginBottom: "4px" }}>
                            {h.notes}
                          </div>
                          <div style={{ fontSize: "0.78rem", color: "#64748b" }}>
                            Performed by: <strong style={{ color: "#c084fc" }}>{h.performed_by || "Security Analyst"}</strong> | Status: <strong style={{ color: "#34d399" }}>{h.status}</strong>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ textAlign: "center", padding: "20px", color: "#64748b" }}>
                      No history records logged yet for this incident.
                    </div>
                  )}

                  <div style={{ marginTop: "20px", display: "flex", justifyContent: "flex-end" }}>
                    <button
                      onClick={() => setSelectedIncident(null)}
                      className="soc-btn-secondary"
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default IncidentManagement;
