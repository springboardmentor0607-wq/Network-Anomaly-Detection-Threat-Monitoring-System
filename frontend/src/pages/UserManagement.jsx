import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function UserManagement({ title = 'User Management' }) {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pendingDeleteId, setPendingDeleteId] = useState(null);

  const isAdmin = user?.role === 'Security Administrator';

  const loadUsers = async () => {
    if (!isAdmin) {
      setUsers([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const response = await api.get('/admin/users');
      setUsers(response.data.users || []);
      setError('');
    } catch (err) {
      setError(err?.response?.data?.detail || 'Unable to load users.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [isAdmin]);

  const handleDelete = async (userId) => {
    if (!isAdmin) return;
    if (!window.confirm('Delete this user permanently?')) {
      return;
    }

    setPendingDeleteId(userId);
    try {
      await api.delete(`/admin/users/${userId}`);
      setUsers((current) => current.filter((entry) => entry.id !== userId));
      setError('');
    } catch (err) {
      setError(err?.response?.data?.detail || 'Unable to delete user.');
    } finally {
      setPendingDeleteId(null);
    }
  };

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <header className="mb-6 rounded-3xl border border-slate-800 bg-slate-900/70 p-5 shadow-2xl shadow-blue-950/30 backdrop-blur">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-blue-400">{title}</p>
              <h1 className="mt-2 text-2xl font-semibold text-white">{title}</h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-400">
                {title === 'Team Management'
                  ? 'Review user teams and group membership under the Security Administrator view.'
                  : 'Review MongoDB-backed user records and remove accounts that should no longer have access.'}
              </p>
            </div>
            <div className="flex gap-3">
              <Link to="/dashboard" className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300 transition hover:border-slate-600 hover:text-white">Back to Dashboard</Link>
              <button type="button" onClick={loadUsers} className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-500">Refresh</button>
            </div>
          </div>
        </header>

        {error ? <div className="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">{error}</div> : null}

        <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-4 sm:p-5">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="pb-3 font-medium">Name</th>
                  <th className="pb-3 font-medium">Email</th>
                  <th className="pb-3 font-medium">Role</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td className="py-4 text-slate-400" colSpan="5">Loading users…</td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td className="py-4 text-slate-400" colSpan="5">No users found.</td>
                  </tr>
                ) : (
                  users.map((entry) => (
                    <tr key={entry.id} className="border-b border-slate-800/70 text-slate-300 last:border-b-0">
                      <td className="py-3">{entry.full_name}</td>
                      <td className="py-3">{entry.email}</td>
                      <td className="py-3">{entry.role}</td>
                      <td className="py-3">{entry.is_active ? 'Active' : 'Inactive'}</td>
                      <td className="py-3">
                        <button
                          type="button"
                          onClick={() => handleDelete(entry.id)}
                          disabled={pendingDeleteId === entry.id}
                          className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs font-medium text-rose-200 transition hover:border-rose-400 hover:bg-rose-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {pendingDeleteId === entry.id ? 'Deleting…' : 'Delete'}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
