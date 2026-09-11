import { useState, useEffect } from "react";
import { API_BASE_URL } from "../config";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from "recharts";

import {
  FaChartBar,
  FaChartLine,
  FaChartPie,
  FaShieldAlt,
  FaExclamationTriangle,
  FaFilter,
  FaCalendarAlt,
  FaArrowUp,
  FaArrowDown,
  FaInfoCircle
} from "react-icons/fa";

function CustomTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    return (
      <div
        style={{
          background: "#0f172a",
          border: "1px solid #334155",
          padding: "10px 14px",
          borderRadius: "8px",
          color: "#f8fafc",
          fontSize: "0.82rem",
          boxShadow: "0 10px 25px rgba(0, 0, 0, 0.5)"
        }}
      >
        <p style={{ fontWeight: "700", color: "#00f2fe", margin: "0 0 6px 0" }}>{label || payload[0].name}</p>
        {payload.map((entry, index) => (
          <p key={`item-${index}`} style={{ color: entry.color || "#38bdf8", margin: "3px 0" }}>
            <span style={{ fontWeight: 600 }}>{entry.name}:</span>{" "}
            {typeof entry.value === "number" ? entry.value.toLocaleString() : entry.value}
            {entry.payload && entry.payload.percentage ? ` (${entry.payload.percentage}%)` : ""}
          </p>
        ))}
      </div>
    );
  }
  return null;
}

function AttackVisualizationSection() {
  const [data, setData] = useState({
    total_attacks: 0,
    attack_types: [],
    severity_distribution: [],
    weekly_threat_monitoring: [],
    network_traffic_summary: {
      total_packets: "290,913",
      normal_packets: "224,673",
      anomalous_packets: "66,240",
      anomaly_rate: "22.77%"
    }
  });

  const [loading, setLoading] = useState(true);

  // Dynamic Filters
  const [timeRange, setTimeRange] = useState("All Time");
  const [severityFilter, setSeverityFilter] = useState("All");
  const [attackTypeFilter, setAttackTypeFilter] = useState("All");

  const fetchVisualizationData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/attack-visualization`);
      const json = await res.json();
      if (json && json.attack_types) {
        setData(json);
      }
    } catch (err) {
      console.error("Error fetching attack visualization data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVisualizationData();
  }, []);

  // Filter Attack Types Chart
  const filteredAttackTypes = (data.attack_types || []).filter((item) => {
    if (attackTypeFilter !== "All" && item.category.toLowerCase() !== attackTypeFilter.toLowerCase()) {
      return false;
    }
    return true;
  });

  // Filter Severity Chart
  const filteredSeverity = (data.severity_distribution || []).filter((item) => {
    if (severityFilter !== "All" && item.name.toLowerCase() !== severityFilter.toLowerCase()) {
      return false;
    }
    return true;
  });

  // Calculate Weekly Trend Slope (Increasing vs Decreasing)
  const weeklyData = data.weekly_threat_monitoring || [];
  const latestWeek = weeklyData.length > 0 ? weeklyData[weeklyData.length - 1].attacks : 0;
  const previousWeek = weeklyData.length > 1 ? weeklyData[weeklyData.length - 2].attacks : 0;
  const isIncreasing = latestWeek >= previousWeek;
  const trendPercent = previousWeek > 0 ? Math.round(((latestWeek - previousWeek) / previousWeek) * 100) : 0;

  return (
    <div style={{ marginTop: "32px" }}>
      {/* Section Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h2 style={{ fontSize: "1.35rem", color: "#f8fafc", margin: 0, display: "flex", alignItems: "center", gap: "10px" }}>
            <FaChartBar style={{ color: "#00f2fe" }} /> Attack Visualization & Security Threat Monitoring
          </h2>
          <p style={{ fontSize: "0.85rem", color: "#94a3b8", margin: "4px 0 0 0" }}>
            Milestone 3 Step 5: Real-Time Attack Breakdown, Severity Distribution & Weekly Threat Trend Velocity
          </p>
        </div>

        {/* Filter Controls */}
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
          {/* Time Range Filter */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <FaCalendarAlt style={{ color: "#38bdf8", fontSize: "0.85rem" }} />
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              style={{
                padding: "8px 12px",
                background: "#1e293b",
                border: "1px solid #334155",
                borderRadius: "8px",
                color: "#f8fafc",
                fontSize: "0.82rem",
                outline: "none",
                cursor: "pointer"
              }}
            >
              <option value="All Time">All Time</option>
              <option value="Past 7 Days">Past 7 Days</option>
              <option value="Past 30 Days">Past 30 Days</option>
              <option value="Past 90 Days">Past 90 Days</option>
            </select>
          </div>

          {/* Severity Filter */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <FaFilter style={{ color: "#f59e0b", fontSize: "0.85rem" }} />
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              style={{
                padding: "8px 12px",
                background: "#1e293b",
                border: "1px solid #334155",
                borderRadius: "8px",
                color: "#f8fafc",
                fontSize: "0.82rem",
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

          {/* Attack Type Filter */}
          <select
            value={attackTypeFilter}
            onChange={(e) => setAttackTypeFilter(e.target.value)}
            style={{
              padding: "8px 12px",
              background: "#1e293b",
              border: "1px solid #334155",
              borderRadius: "8px",
              color: "#f8fafc",
              fontSize: "0.82rem",
              outline: "none",
              cursor: "pointer"
            }}
          >
            <option value="All">All Attack Categories</option>
            <option value="DoS">DoS</option>
            <option value="Exploits">Exploits</option>
            <option value="Reconnaissance">Reconnaissance</option>
            <option value="Fuzzers">Fuzzers</option>
            <option value="Backdoor">Backdoor</option>
            <option value="Shellcode">Shellcode</option>
            <option value="Generic">Generic</option>
            <option value="Worms">Worms</option>
          </select>
        </div>
      </div>

      {/* Overview Cards Row */}
      <div className="soc-grid-4" style={{ marginBottom: "24px" }}>
        {/* 1. Total Attack Count */}
        <div className="soc-card" style={{ borderColor: "rgba(239, 68, 68, 0.4)" }}>
          <div className="soc-card-title">
            <FaExclamationTriangle style={{ color: "#ef4444" }} /> Total Detected Attacks
          </div>
          <div className="soc-card-value" style={{ color: "#fca5a5" }}>
            {data.total_attacks || data.network_traffic_summary.anomalous_packets}
          </div>
          <div className="soc-card-subtext">Verified Intrusion Incidents</div>
        </div>

        {/* 2. Primary Attack Threat */}
        <div className="soc-card" style={{ borderColor: "rgba(245, 158, 11, 0.4)" }}>
          <div className="soc-card-title">
            <FaShieldAlt style={{ color: "#f59e0b" }} /> Top Attack Threat Vector
          </div>
          <div className="soc-card-value" style={{ color: "#fbbf24", fontSize: "1.3rem" }}>
            {data.attack_types && data.attack_types.length > 0
              ? [...data.attack_types].sort((a, b) => b.count - a.count)[0]?.category
              : "Exploits"}
          </div>
          <div className="soc-card-subtext">Most Frequent Threat Vector</div>
        </div>

        {/* 3. Threat Velocity (Weekly Change) */}
        <div className="soc-card" style={{ borderColor: isIncreasing ? "rgba(239, 68, 68, 0.4)" : "rgba(16, 185, 129, 0.4)" }}>
          <div className="soc-card-title">
            <FaChartLine style={{ color: isIncreasing ? "#ef4444" : "#10b981" }} /> Threat Velocity Trend
          </div>
          <div className="soc-card-value" style={{ color: isIncreasing ? "#fca5a5" : "#34d399", fontSize: "1.25rem", display: "flex", alignItems: "center", gap: "6px" }}>
            {isIncreasing ? <FaArrowUp style={{ fontSize: "1rem" }} /> : <FaArrowDown style={{ fontSize: "1rem" }} />}
            {Math.abs(trendPercent)}% {isIncreasing ? "Increase" : "Decrease"}
          </div>
          <div className="soc-card-subtext">Week-over-Week Change</div>
        </div>

        {/* 4. Anomaly Packet Rate */}
        <div className="soc-card" style={{ borderColor: "rgba(56, 189, 248, 0.4)" }}>
          <div className="soc-card-title">
            <FaShieldAlt style={{ color: "#38bdf8" }} /> Network Anomaly Ratio
          </div>
          <div className="soc-card-value" style={{ color: "#38bdf8" }}>
            {data.network_traffic_summary.anomaly_rate}
          </div>
          <div className="soc-card-subtext">Anomalous / Total Packets</div>
        </div>
      </div>

      {/* Main Charts Row 1: Weekly Threat Monitoring & Attack Distribution Bar Chart */}
      <div className="soc-grid-2" style={{ marginBottom: "24px" }}>
        {/* CHART A: SECURITY THREAT MONITORING (WEEKLY ATTACK TREND) */}
        <div className="soc-card">
          <div className="soc-card-header-title">
            <h3 className="section-title" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <FaChartLine style={{ color: "#00f2fe" }} /> Security Threat Monitoring (Weekly Attack Count)
            </h3>
            <span className="live-status-tag" style={{ background: "rgba(0, 242, 254, 0.15)", color: "#00f2fe", border: "1px solid #00f2fe" }}>
              Time-Series Analytics
            </span>
          </div>

          <p style={{ fontSize: "0.82rem", color: "#94a3b8", marginBottom: "16px" }}>
            Calculated weekly attack count calculated from database detection timestamps (Week → Number of Attacks).
          </p>

          <div style={{ width: "100%", height: 310 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.weekly_threat_monitoring} margin={{ top: 15, right: 25, left: -5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.7} />
                <XAxis dataKey="week" stroke="#64748b" tick={{ fill: "#94a3b8", fontSize: 12 }} />
                <YAxis stroke="#64748b" tick={{ fill: "#94a3b8", fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ paddingTop: "12px", fontSize: "0.82rem" }} />
                <Line
                  type="monotone"
                  dataKey="attacks"
                  name="Total Detected Attacks"
                  stroke="#00f2fe"
                  strokeWidth={3}
                  dot={{ r: 5, fill: "#00f2fe" }}
                  activeDot={{ r: 8, fill: "#00f2fe" }}
                />
                <Line
                  type="monotone"
                  dataKey="critical"
                  name="Critical Severity Attacks"
                  stroke="#ef4444"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={{ r: 4, fill: "#ef4444" }}
                />
                <Line
                  type="monotone"
                  dataKey="high"
                  name="High Severity Attacks"
                  stroke="#f97316"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={{ r: 4, fill: "#f97316" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CHART B: ATTACK DISTRIBUTION & CATEGORY COUNTS (BAR CHART) */}
        <div className="soc-card">
          <div className="soc-card-header-title">
            <h3 className="section-title" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <FaChartBar style={{ color: "#38bdf8" }} /> Attack Types & Category Distribution
            </h3>
            <span className="live-status-tag" style={{ background: "rgba(56, 189, 248, 0.15)", color: "#38bdf8", border: "1px solid #38bdf8" }}>
              UNSW-NB15 / CICIDS2017
            </span>
          </div>

          <p style={{ fontSize: "0.82rem", color: "#94a3b8", marginBottom: "16px" }}>
            Comparative count of detected attacks categorized by intrusion vector.
          </p>

          <div style={{ width: "100%", height: 310 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={filteredAttackTypes} margin={{ top: 15, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.7} />
                <XAxis dataKey="category" stroke="#64748b" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                <YAxis stroke="#64748b" tick={{ fill: "#94a3b8", fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ paddingTop: "12px", fontSize: "0.82rem" }} />
                <Bar dataKey="count" name="Attack Count" radius={[6, 6, 0, 0]}>
                  {filteredAttackTypes.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color || "#38bdf8"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Main Charts Row 2: Threat Severity Distribution & Network Flow Breakdown */}
      <div className="soc-grid-2">
        {/* CHART C: THREAT SEVERITY DISTRIBUTION (DONUT / PIE CHART) */}
        <div className="soc-card">
          <div className="soc-card-header-title">
            <h3 className="section-title" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <FaChartPie style={{ color: "#c084fc" }} /> Threat Severity Level Distribution
            </h3>
            <span className="live-status-tag" style={{ background: "rgba(192, 132, 252, 0.15)", color: "#c084fc", border: "1px solid #c084fc" }}>
              Risk Classification
            </span>
          </div>

          <p style={{ fontSize: "0.82rem", color: "#94a3b8", marginBottom: "16px" }}>
            Distribution of threats categorized into Critical, High, Medium, and Low severity tiers.
          </p>

          <div style={{ width: "100%", height: 290 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={filteredSeverity}
                  cx="50%"
                  cy="45%"
                  innerRadius={65}
                  outerRadius={95}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {filteredSeverity.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="#0f172a" strokeWidth={2.5} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{ fontSize: "0.82rem", paddingTop: "12px" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CHART D: MAJOR THREATS DETECTED & NETWORK TRAFFIC FLOW */}
        <div className="soc-card">
          <div className="soc-card-header-title">
            <h3 className="section-title" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <FaShieldAlt style={{ color: "#10b981" }} /> Major Threats & Network Traffic Breakdown
            </h3>
            <span className="live-status-tag" style={{ background: "rgba(16, 185, 129, 0.15)", color: "#34d399", border: "1px solid #10b981" }}>
              Live Telemetry
            </span>
          </div>

          <p style={{ fontSize: "0.82rem", color: "#94a3b8", marginBottom: "16px" }}>
            Summary of evaluated network traffic flow packets and top security threat indices.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {/* Network Packets Progress Bar */}
            <div style={{ background: "#0f172a", padding: "14px", borderRadius: "8px", border: "1px solid #334155" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", marginBottom: "6px" }}>
                <span style={{ color: "#f8fafc", fontWeight: 600 }}>Normal Benign Traffic</span>
                <span style={{ color: "#34d399", fontWeight: 700 }}>224,673 packets (77.2%)</span>
              </div>
              <div style={{ background: "#1e293b", height: "10px", borderRadius: "5px", overflow: "hidden" }}>
                <div style={{ width: "77.2%", background: "#10b981", height: "100%" }}></div>
              </div>
            </div>

            <div style={{ background: "#0f172a", padding: "14px", borderRadius: "8px", border: "1px solid #334155" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", marginBottom: "6px" }}>
                <span style={{ color: "#f8fafc", fontWeight: 600 }}>Anomalous Attack Traffic</span>
                <span style={{ color: "#fca5a5", fontWeight: 700 }}>66,240 packets (22.8%)</span>
              </div>
              <div style={{ background: "#1e293b", height: "10px", borderRadius: "5px", overflow: "hidden" }}>
                <div style={{ width: "22.8%", background: "#ef4444", height: "100%" }}></div>
              </div>
            </div>

            {/* Major Threats Top Roster */}
            <div style={{ background: "#0f172a", padding: "14px", borderRadius: "8px", border: "1px solid #334155" }}>
              <h4 style={{ fontSize: "0.85rem", color: "#38bdf8", margin: "0 0 10px 0" }}>🔥 Top Major Threats Detected by AI:</h4>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {(data.attack_types || []).slice(0, 5).map((atk, idx) => (
                  <span
                    key={idx}
                    style={{
                      background: "rgba(30, 41, 59, 0.8)",
                      border: `1px solid ${atk.color}`,
                      color: atk.color,
                      padding: "4px 10px",
                      borderRadius: "6px",
                      fontSize: "0.78rem",
                      fontWeight: 600
                    }}
                  >
                    {atk.category}: {atk.count} attacks
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AttackVisualizationSection;
