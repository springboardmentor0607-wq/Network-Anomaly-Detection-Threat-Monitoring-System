function Sidebar() {
  return (
    <div
      style={{
        width: "250px",
        height: "100vh",
        background: "#111827",
        color: "white",
        padding: "20px",
        position: "fixed",
        left: 0,
        top: 0,
      }}
    >
      <h2 style={{ color: "#3B82F6" }}>🛡 NetShield AI</h2>
      <hr />

      <p>🏠 Dashboard</p>
      <p>🌐 Network Monitoring</p>
      <p>🚨 Threat Detection</p>
      <p>🔔 Alert Management</p>
      <p>📊 Analytics</p>
      <p>👥 User Management</p>
      <p>⚙ Settings</p>
    </div>
  );
}

export default Sidebar;