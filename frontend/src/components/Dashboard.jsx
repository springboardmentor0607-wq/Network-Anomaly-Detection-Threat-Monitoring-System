import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import StatCard from "./StatCard";
import TrafficChart from "./TrafficChart";
import ThreatTable from "./ThreatTable";
import ThreatChart from "./ThreatChart";
import NetworkTable from "./NetworkTable";
import UserManagement from "./UserManagement";

function Dashboard() {
  return (
    <div style={{ background: "#0F172A", minHeight: "100vh" }}>
      <Sidebar />
      <Navbar />

      <div
        style={{
          marginLeft: "270px",
          marginTop: "30px",
          display: "flex",
          gap: "20px",
          flexWrap: "wrap",
          padding: "20px",
        }}
      >
        <StatCard title="Total Packets" value="15,248" />
        <StatCard title="Threats Detected" value="12" />
        <StatCard title="Alerts Generated" value="4" />
        <StatCard title="Risk Score" value="18%" />
        <div
  style={{
    display: "flex",
    gap: "20px",
    marginTop: "30px",
    alignItems: "flex-start",
    flexWrap: "wrap",
  }}
>
  <TrafficChart />
  <ThreatChart />
  <NetworkTable />
  <UserManagement />
</div>

<ThreatTable />
      </div>
    </div>
  );
}

export default Dashboard;