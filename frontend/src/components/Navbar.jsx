function Navbar() {
  return (
    <div
      style={{
        marginLeft: "250px",
        height: "70px",
        background: "#1F2937",
        color: "white",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "0 20px",
      }}
    >
      <h2>Security Dashboard</h2>

      <div>
        🔔 Notifications &nbsp;&nbsp;
        👤 Vinod &nbsp;&nbsp;
        🚪 Logout
      </div>
    </div>
  );
}

export default Navbar;