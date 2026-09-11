function ThreatTable() {
  const alerts = [
    {
      id: 1,
      attack: "DDoS Attack",
      source: "192.168.1.25",
      severity: "High",
    },
    {
      id: 2,
      attack: "Port Scan",
      source: "10.0.0.15",
      severity: "Medium",
    },
    {
      id: 3,
      attack: "SQL Injection",
      source: "172.16.5.40",
      severity: "Critical",
    },
    {
      id: 4,
      attack: "Brute Force Login",
      source: "192.168.10.5",
      severity: "High",
    },
  ];

  return (
    <div
      style={{
        background: "#1F2937",
        padding: "20px",
        borderRadius: "10px",
        marginTop: "30px",
        color: "white",
      }}
    >
      <h2>🚨 Recent Security Alerts</h2>

      <table
        style={{
          width: "100%",
          marginTop: "20px",
          borderCollapse: "collapse",
        }}
      >
        <thead>
          <tr style={{ background: "#374151" }}>
            <th style={{ padding: "12px" }}>ID</th>
            <th>Attack Type</th>
            <th>Source IP</th>
            <th>Severity</th>
          </tr>
        </thead>

        <tbody>
          {alerts.map((alert) => (
            <tr key={alert.id} style={{ textAlign: "center" }}>
              <td style={{ padding: "10px" }}>{alert.id}</td>

              <td>{alert.attack}</td>

              <td>{alert.source}</td>

              <td
                style={{
                  color:
                    alert.severity === "Critical"
                      ? "#FF3B30"
                      : alert.severity === "High"
                      ? "#FF9500"
                      : alert.severity === "Medium"
                      ? "#FFD60A"
                      : "#34C759",
                  fontWeight: "bold",
                }}
              >
                {alert.severity}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default ThreatTable;