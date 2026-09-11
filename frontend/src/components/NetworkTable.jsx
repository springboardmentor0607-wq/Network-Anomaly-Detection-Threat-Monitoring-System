function NetworkTable() {
  const packets = [
    {
      id: 1,
      source: "192.168.1.25",
      destination: "172.16.1.10",
      protocol: "TCP",
      status: "Allowed",
    },
    {
      id: 2,
      source: "10.0.0.15",
      destination: "192.168.1.30",
      protocol: "UDP",
      status: "Blocked",
    },
    {
      id: 3,
      source: "172.16.5.40",
      destination: "8.8.8.8",
      protocol: "ICMP",
      status: "Allowed",
    },
    {
      id: 4,
      source: "192.168.10.5",
      destination: "192.168.1.50",
      protocol: "TCP",
      status: "Blocked",
    },
  ];

  return (
    <div
      style={{
        background: "#1F2937",
        padding: "20px",
        borderRadius: "10px",
        color: "white",
        marginTop: "30px",
      }}
    >
      <h2>🌐 Live Network Activity</h2>

      <table
        style={{
          width: "100%",
          marginTop: "20px",
          borderCollapse: "collapse",
        }}
      >
        <thead>
          <tr style={{ background: "#374151" }}>
            <th>ID</th>
            <th>Source IP</th>
            <th>Destination IP</th>
            <th>Protocol</th>
            <th>Status</th>
          </tr>
        </thead>

        <tbody>
          {packets.map((packet) => (
            <tr
              key={packet.id}
              style={{ textAlign: "center", height: "45px" }}
            >
              <td>{packet.id}</td>
              <td>{packet.source}</td>
              <td>{packet.destination}</td>
              <td>{packet.protocol}</td>

              <td
                style={{
                  color:
                    packet.status === "Allowed"
                      ? "#22C55E"
                      : "#EF4444",
                  fontWeight: "bold",
                }}
              >
                {packet.status}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default NetworkTable;