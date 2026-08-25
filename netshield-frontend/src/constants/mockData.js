export const initialKpiMetrics = [
  {
    id: "total_packets",
    title: "Total Network Packets",
    value: "175,340",
    description: "Evaluated Flow Packets",
    iconType: "packets",
    color: "#00f2fe"
  },
  {
    id: "normal_traffic",
    title: "Normal Traffic",
    value: "142,100",
    description: "81.0% Benign Network Flows",
    iconType: "normal",
    color: "#10b981"
  },
  {
    id: "threats_detected",
    title: "Threats Detected",
    value: "33,240",
    description: "19.0% Anomalies & Attacks",
    iconType: "threats",
    color: "#ef4444"
  },
  {
    id: "detection_accuracy",
    title: "Detection Accuracy",
    value: "87.01%",
    description: "Random Forest Classifier Score",
    iconType: "accuracy",
    color: "#c084fc"
  },
  {
    id: "active_users",
    title: "Active Users",
    value: "28",
    description: "Registered SOC Operators On Duty",
    iconType: "users",
    color: "#38bdf8"
  },
  {
    id: "system_health",
    title: "System Health",
    value: "99.9%",
    description: "SOC Cluster High Availability",
    iconType: "health",
    color: "#34d399"
  }
];

export const networkTrafficTimeline = [
  { time: "00:00", incoming: 2400, outgoing: 1800, anomalies: 120 },
  { time: "03:00", incoming: 1390, outgoing: 1200, anomalies: 40 },
  { time: "06:00", incoming: 4800, outgoing: 3200, anomalies: 280 },
  { time: "09:00", incoming: 9800, outgoing: 7400, anomalies: 950 },
  { time: "12:00", incoming: 12500, outgoing: 9100, anomalies: 1400 },
  { time: "15:00", incoming: 11000, outgoing: 8500, anomalies: 880 },
  { time: "18:00", incoming: 8200, outgoing: 6300, anomalies: 420 },
  { time: "21:00", incoming: 4500, outgoing: 3100, anomalies: 180 }
];

export const threatDistributionCategories = [
  { category: "DoS", count: 12450, color: "#ef4444" },
  { category: "Probe", count: 8320, color: "#f97316" },
  { category: "Port Scan", count: 6840, color: "#f59e0b" },
  { category: "Malware", count: 3180, color: "#a855f7" },
  { category: "Normal", count: 142100, color: "#10b981" }
];

export const trafficDistributionDoughnut = [
  { name: "Normal Traffic", value: 142100, percentage: 81.0, color: "#10b981" },
  { name: "Anomalous Traffic", value: 33240, percentage: 19.0, color: "#ef4444" }
];

export const recentThreatActivity = [
  { id: 1, time: "10:42:15", threatType: "DDoS SYN Flood", sourceIp: "192.168.1.104", severity: "Critical", status: "Blocked" },
  { id: 2, time: "10:38:50", threatType: "Nmap Stealth Port Scan", sourceIp: "172.16.0.45", severity: "High", status: "Investigating" },
  { id: 3, time: "10:25:12", threatType: "SSH Brute Force Attempt", sourceIp: "185.220.101.5", severity: "High", status: "Blocked" },
  { id: 4, time: "10:14:05", threatType: "SQL Injection Probe", sourceIp: "45.33.32.156", severity: "Medium", status: "Resolved" },
  { id: 5, time: "09:58:30", threatType: "DNS Tunneling Anomaly", sourceIp: "192.168.1.210", severity: "Medium", status: "Investigating" },
  { id: 6, time: "09:42:18", threatType: "XSS Script Injection", sourceIp: "192.168.1.115", severity: "Low", status: "Resolved" },
  { id: 7, time: "09:30:00", threatType: "Unauthorized FTP Access", sourceIp: "10.0.0.99", severity: "Low", status: "Resolved" }
];

export const systemStatusServices = [
  { name: "Server Status", status: "Healthy", details: "Core API & Gateway Active", color: "#10b981" },
  { name: "Database Status", status: "Healthy", details: "PostgreSQL Connection Active", color: "#10b981" },
  { name: "AI Model Status", status: "Healthy", details: "Random Forest Classifier Loaded", color: "#10b981" },
  { name: "API Status", status: "Healthy", details: "Flask REST Endpoints Online", color: "#10b981" }
];

export const datasetInformation = {
  primaryDataset: "UNSW-NB15",
  secondaryDataset: "CICIDS2017",
  status: "Loaded & Preprocessed",
  purpose: "Network Anomaly Detection & Traffic Classification"
};

