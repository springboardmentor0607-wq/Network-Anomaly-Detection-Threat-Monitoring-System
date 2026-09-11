import "./ThreatTable.css";

function ThreatTable() {
  const alerts = [
    {
      id: 1,
      attack: "DDoS Attack",
      ip: "192.168.1.25",
      severity: "Critical",
      status: "Active",
    },
    {
      id: 2,
      attack: "SQL Injection",
      ip: "172.16.10.50",
      severity: "High",
      status: "Investigating",
    },
    {
      id: 3,
      attack: "Port Scan",
      ip: "10.0.0.18",
      severity: "Medium",
      status: "Resolved",
    },
    {
      id: 4,
      attack: "Brute Force",
      ip: "192.168.10.2",
      severity: "High",
      status: "Active",
    },
    {
      id: 5,
      attack: "Botnet Traffic",
      ip: "172.20.1.15",
      severity: "Critical",
      status: "Blocked",
    },
  ];

  return (
    <div className="table-container">

      <h2>🚨 Recent Security Alerts</h2>

      <table>

        <thead>

          <tr>
            <th>ID</th>
            <th>Attack</th>
            <th>Source IP</th>
            <th>Severity</th>
            <th>Status</th>
            <th>Action</th>
          </tr>

        </thead>

        <tbody>

          {alerts.map((alert) => (

            <tr key={alert.id}>

              <td>{alert.id}</td>

              <td>{alert.attack}</td>

              <td>{alert.ip}</td>

              <td>

                <span className={`severity ${alert.severity.toLowerCase()}`}>
                  {alert.severity}
                </span>

              </td>

              <td>

                <span className={`status ${alert.status.toLowerCase().replace(" ","-")}`}>
                  {alert.status}
                </span>

              </td>

              <td>

                <button>View</button>

              </td>

            </tr>

          ))}

        </tbody>

      </table>

    </div>
  );
}

export default ThreatTable;