import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import LineChart from "../components/LineChart";
import PieChart from "../components/PieChart";
import {
  FaArrowDown,
  FaArrowUp,
  FaChartLine,
  FaNetworkWired,
  FaGlobe,
  FaServer
} from "react-icons/fa";
import "../styles/Dashboard.css";

const activeConnectionsData = [
  { id: 1, proto: "TCP", src: "192.168.1.105:49210", dst: "10.0.0.8:443", state: "ESTABLISHED", throughput: "4.2 Mbps", status: "Normal" },
  { id: 2, proto: "UDP", src: "192.168.1.200:53124", dst: "8.8.8.8:53", state: "ACTIVE", throughput: "128 Kbps", status: "Normal" },
  { id: 3, proto: "TCP", src: "172.16.0.44:60112", dst: "10.0.0.1:80", state: "SYN_SENT", throughput: "18.5 Mbps", status: "Suspicious" },
  { id: 4, proto: "ICMP", src: "192.168.1.112:0", dst: "10.0.0.5:0", state: "ECHO_REQ", throughput: "512 Kbps", status: "Normal" },
  { id: 5, proto: "TCP", src: "192.168.1.150:41002", dst: "10.0.0.12:22", state: "ESTABLISHED", throughput: "1.1 Mbps", status: "Normal" }
];

function NetworkTraffic() {
  return (
    <div className="soc-layout">
      <Sidebar role="Security Analyst" />
      <Topbar title="Network Traffic & Bandwidth Inspector" />

      <div className="soc-main-content">
        <div className="dashboard-header">
          <div>
            <h1 className="dashboard-title">
              🌐 Network Traffic Analysis
            </h1>
            <p className="dashboard-subtitle">
              Comprehensive Real-Time Flow Inspection, Protocol Distribution & Connection Metrics
            </p>
          </div>
        </div>

        {/* Traffic Metric Cards */}
        <div className="soc-grid-4">
          <div className="soc-card">
            <div className="soc-card-title">
              <FaArrowDown style={{ color: "#38bdf8" }} /> Incoming Traffic
            </div>
            <div className="soc-card-value" style={{ color: "#38bdf8" }}>
              14,250 <span style={{ fontSize: "0.9rem", color: "#94a3b8" }}>pkt/s</span>
            </div>
            <div className="soc-card-subtext">Peak Ingress Rate: 16.8 Mbps</div>
          </div>

          <div className="soc-card">
            <div className="soc-card-title">
              <FaArrowUp style={{ color: "#818cf8" }} /> Outgoing Traffic
            </div>
            <div className="soc-card-value" style={{ color: "#818cf8" }}>
              9,840 <span style={{ fontSize: "0.9rem", color: "#94a3b8" }}>pkt/s</span>
            </div>
            <div className="soc-card-subtext">Egress Bandwidth: 11.2 Mbps</div>
          </div>

          <div className="soc-card">
            <div className="soc-card-title">
              <FaChartLine style={{ color: "#f59e0b" }} /> Peak Usage
            </div>
            <div className="soc-card-value" style={{ color: "#fbbf24" }}>
              18,400 <span style={{ fontSize: "0.9rem", color: "#94a3b8" }}>pkt/s</span>
            </div>
            <div className="soc-card-subtext">Recorded at 12:45 PM UTC</div>
          </div>

          <div className="soc-card">
            <div className="soc-card-title">
              <FaNetworkWired style={{ color: "#10b981" }} /> Active Connections
            </div>
            <div className="soc-card-value" style={{ color: "#34d399" }}>
              1,480
            </div>
            <div className="soc-card-subtext">Established TCP/UDP Sockets</div>
          </div>
        </div>

        {/* Large Charts Section */}
        <div className="soc-card" style={{ marginBottom: "24px" }}>
          <h3 style={{ fontSize: "1.1rem", color: "#f8fafc", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
            <FaGlobe style={{ color: "#00f2fe" }} /> Real-Time Network Bandwidth & Flow History
          </h3>
          <LineChart height={360} />
        </div>

        <div className="soc-grid-2">
          <div className="soc-card">
            <h3 style={{ fontSize: "1.05rem", color: "#f8fafc", marginBottom: "16px" }}>
              📊 Traffic Protocol Distribution
            </h3>
            <PieChart />
          </div>

          <div className="soc-card">
            <h3 style={{ fontSize: "1.05rem", color: "#f8fafc", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
              <FaServer style={{ color: "#38bdf8" }} /> Network Node Health Summary
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "12px" }}>
              <div style={{ background: "#1e293b", padding: "14px", borderRadius: "8px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                  <span style={{ fontWeight: "600", color: "#f8fafc" }}>Core Gateway Router</span>
                  <span style={{ color: "#34d399", fontWeight: "600" }}>99.9% Uptime</span>
                </div>
                <p style={{ fontSize: "0.82rem", color: "#94a3b8" }}>Latency: 1.2ms | Packet Loss: 0.00%</p>
              </div>

              <div style={{ background: "#1e293b", padding: "14px", borderRadius: "8px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                  <span style={{ fontWeight: "600", color: "#f8fafc" }}>Internal Switch Cluster</span>
                  <span style={{ color: "#34d399", fontWeight: "600" }}>100% Operational</span>
                </div>
                <p style={{ fontSize: "0.82rem", color: "#94a3b8" }}>Throughput: 10 Gbps Backbone</p>
              </div>

              <div style={{ background: "#1e293b", padding: "14px", borderRadius: "8px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                  <span style={{ fontWeight: "600", color: "#f8fafc" }}>Edge Firewall Probe</span>
                  <span style={{ color: "#fbbf24", fontWeight: "600" }}>High Load (84%)</span>
                </div>
                <p style={{ fontSize: "0.82rem", color: "#94a3b8" }}>DDoS Inspection Filter Active</p>
              </div>
            </div>
          </div>
        </div>

        {/* Connection Sockets Table */}
        <div className="soc-card">
          <h3 style={{ fontSize: "1.1rem", color: "#f8fafc", marginBottom: "16px" }}>
            🔌 Active Socket Connections
          </h3>

          <table className="soc-table">
            <thead>
              <tr>
                <th>Protocol</th>
                <th>Source Address</th>
                <th>Destination Address</th>
                <th>TCP State</th>
                <th>Throughput</th>
                <th>Evaluation</th>
              </tr>
            </thead>
            <tbody>
              {activeConnectionsData.map((conn) => (
                <tr key={conn.id}>
                  <td style={{ fontWeight: "700", color: "#00f2fe" }}>{conn.proto}</td>
                  <td style={{ fontFamily: "var(--font-mono)", color: "#38bdf8" }}>{conn.src}</td>
                  <td style={{ fontFamily: "var(--font-mono)", color: "#cbd5e1" }}>{conn.dst}</td>
                  <td style={{ color: "#94a3b8", fontSize: "0.85rem" }}>{conn.state}</td>
                  <td style={{ fontFamily: "var(--font-mono)", color: "#f8fafc" }}>{conn.throughput}</td>
                  <td>
                    <span className={conn.status === "Normal" ? "badge badge-low" : "badge badge-high"}>
                      {conn.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default NetworkTraffic;
