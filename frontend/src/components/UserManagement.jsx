function UserManagement() {
  const users = [
    {
      id: 1,
      name: "Vinod",
      role: "Security Analyst",
      email: "vinod@gmail.com",
      status: "Active",
    },
    {
      id: 2,
      name: "Admin",
      role: "Administrator",
      email: "admin@netshield.com",
      status: "Active",
    },
  ];

  return (
    <div
      style={{
        background: "#1F2937",
        padding: "20px",
        borderRadius: "12px",
        color: "white",
        marginTop: "30px",
      }}
    >
      <h2>👥 User Management</h2>

      <table
        style={{
          width: "100%",
          marginTop: "20px",
          borderCollapse: "collapse",
        }}
      >
        <thead>
          <tr style={{ background: "#374151", height: "45px" }}>
            <th>ID</th>
            <th>Name</th>
            <th>Role</th>
            <th>Email</th>
            <th>Status</th>
          </tr>
        </thead>

        <tbody>
          {users.map((user) => (
            <tr
              key={user.id}
              style={{
                textAlign: "center",
                height: "45px",
              }}
            >
              <td>{user.id}</td>
              <td>{user.name}</td>
              <td>{user.role}</td>
              <td>{user.email}</td>

              <td
                style={{
                  color:
                    user.status === "Active"
                      ? "#22C55E"
                      : "#EF4444",
                  fontWeight: "bold",
                }}
              >
                {user.status}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default UserManagement;