import "./AdminDashboard.css";

function AdminDashboard() {

  return (

    <div className="admin">

      <div className="sidebar">

        <h2>🛡 NetShield AI</h2>

        <ul>

          <li>📊 Dashboard</li>

          <li>👥 User Management</li>

          <li>🚨 Threat Alerts</li>

          <li>📈 Reports</li>

          <li>⚙ Settings</li>

          <li>🚪 Logout</li>

        </ul>

      </div>

      <div className="main">

        <div className="topbar">

          <h1>Administrator Dashboard</h1>

          <h3>👤 Administrator</h3>

        </div>

        <div className="cards">

          <div className="card">

            <h2>150</h2>

            <p>Total Users</p>

          </div>

          <div className="card">

            <h2>45</h2>

            <p>Active Sessions</p>

          </div>

          <div className="card">

            <h2>18</h2>

            <p>Threat Alerts</p>

          </div>

          <div className="card">

            <h2>Online</h2>

            <p>System Status</p>

          </div>

        </div>

      </div>

    </div>

  );

}

export default AdminDashboard;