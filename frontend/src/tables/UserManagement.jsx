import "./UserManagement.css";

function UserManagement() {
  const users = [
    {
      id: 1,
      name: "Vinod",
      email: "vinod@gmail.com",
      role: "Administrator",
      status: "Active",
    },
    {
      id: 2,
      name: "Rahul",
      email: "rahul@gmail.com",
      role: "Security Analyst",
      status: "Active",
    },
  ];

  return (
    <div className="user-container">

      <div className="user-header">
        <h2>👥 User Management</h2>

        <button className="add-btn">
          + Add User
        </button>
      </div>

      <input
        className="search-box"
        type="text"
        placeholder="Search users..."
      />

      <table>

        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {users.map((user) => (
            <tr key={user.id}>

              <td>{user.name}</td>

              <td>{user.email}</td>

              <td>{user.role}</td>

              <td>
                <span
                  className={
                    user.status === "Active"
                      ? "active-status"
                      : "inactive-status"
                  }
                >
                  {user.status}
                </span>
              </td>

              <td>
                <button className="edit-btn">
                  Edit
                </button>

                <button className="delete-btn">
                  Delete
                </button>
              </td>

            </tr>
          ))}
        </tbody>

      </table>

    </div>
  );
}

export default UserManagement;