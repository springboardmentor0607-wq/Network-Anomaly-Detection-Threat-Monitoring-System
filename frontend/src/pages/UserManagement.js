import React, { useEffect, useState } from 'react';
import api from '../services/api';
import LoadingState from '../components/LoadingState';
import EmptyState from '../components/EmptyState';
import { FaUserPlus, FaCheck, FaTimes } from 'react-icons/fa';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('SECURITY_ANALYST');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchUsers = async () => {
    try {
      const res = await api.get('/users');
      setUsers(res.data.users);
    } catch (err) {
      console.error("Users fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      await api.post('/users', { name, email, password, role });
      setSuccess(`User ${name} created successfully.`);
      setName('');
      setEmail('');
      setPassword('');
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create user.');
    }
  };

  const handleToggleStatus = async (user) => {
    const newStatus = user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await api.put(`/users/${user.id}`, { status: newStatus });
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update user status.');
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">User Management</h1>
          <p className="page-subtitle">Manage Security Analyst & Administrator accounts (Admin Access Only)</p>
        </div>
      </div>

      <div className="netshield-card" style={{ marginBottom: 24 }}>
        <div className="netshield-card-header">
          <div className="netshield-card-title"><FaUserPlus style={{ color: '#1683FF' }} /> Provision New Account</div>
        </div>

        {error && <div style={{ color: '#FF1744', padding: '8px 12px', background: 'rgba(255, 23, 68, 0.12)', borderRadius: 6, marginBottom: 16, fontSize: '0.85rem' }}>{error}</div>}
        {success && <div style={{ color: '#22C55E', padding: '8px 12px', background: 'rgba(34, 197, 94, 0.12)', borderRadius: 6, marginBottom: 16, fontSize: '0.85rem' }}>{success}</div>}

        <form onSubmit={handleCreateUser} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', color: '#94A3B8', fontWeight: 700, marginBottom: 4 }}>FULL NAME</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Analyst Name"
              style={{ width: '100%', padding: '9px 12px' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', color: '#94A3B8', fontWeight: 700, marginBottom: 4 }}>EMAIL ADDRESS</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="analyst@netshield.ai"
              style={{ width: '100%', padding: '9px 12px' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', color: '#94A3B8', fontWeight: 700, marginBottom: 4 }}>INITIAL PASSWORD</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{ width: '100%', padding: '9px 12px' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', color: '#94A3B8', fontWeight: 700, marginBottom: 4 }}>ASSIGNED ROLE</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              style={{ width: '100%', padding: '9px 12px' }}
            >
              <option value="SECURITY_ANALYST">SECURITY_ANALYST</option>
              <option value="ADMIN">ADMIN</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', height: 40 }}>
              Create Account
            </button>
          </div>
        </form>
      </div>

      <div className="netshield-card">
        {loading ? (
          <LoadingState message="Loading System User Directory..." />
        ) : users.length > 0 ? (
          <div className="netshield-table-container">
            <table className="netshield-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Last Login</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td style={{ color: '#94A3B8' }}>#{u.id}</td>
                    <td style={{ fontWeight: 700, color: '#F8FAFC' }}>{u.name}</td>
                    <td>{u.email}</td>
                    <td>
                      <span className={`badge ${u.role === 'ADMIN' ? 'badge-critical' : 'badge-info'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${u.status === 'ACTIVE' ? 'badge-low' : 'badge-gray'}`}>
                        {u.status}
                      </span>
                    </td>
                    <td style={{ color: '#94A3B8', fontSize: '0.8rem' }}>
                      {u.last_login ? new Date(u.last_login).toLocaleString() : 'Never'}
                    </td>
                    <td>
                      <button
                        onClick={() => handleToggleStatus(u)}
                        className={`btn ${u.status === 'ACTIVE' ? 'btn-outline' : 'btn-success'}`}
                        style={{ padding: '4px 10px', fontSize: '0.78rem' }}
                      >
                        {u.status === 'ACTIVE' ? <><FaTimes /> Deactivate</> : <><FaCheck /> Activate</>}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState message="No users registered" description="No accounts found." />
        )}
      </div>
    </div>
  );
};

export default UserManagement;
