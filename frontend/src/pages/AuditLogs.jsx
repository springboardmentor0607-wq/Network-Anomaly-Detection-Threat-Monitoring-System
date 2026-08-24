import React, { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function AuditLogs() {
  const { user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [eventType, setEventType] = useState('');
  const [dateFilter, setDateFilter] = useState(''); // Just a UI placeholder for now since mock backend doesn't use it, but required by prompt

  const isAdmin = user?.role === 'Security Administrator';

  const loadLogs = async (isPolling = false) => {
    if (!isAdmin) return;

    if (!isPolling) setLoading(true);
    try {
      const response = await api.get('/admin/audit-logs', {
        params: {
          page,
          limit: 20,
          search,
          event_type: eventType,
        }
      });
      setLogs(response.data.data || []);
      setTotal(response.data.total || 0);
      setError('');
    } catch (err) {
      if (!isPolling) setError(err?.response?.data?.detail || 'Unable to load audit logs.');
    } finally {
      if (!isPolling) setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
    
    const interval = setInterval(() => {
      loadLogs(true);
    }, 5000);
    
    return () => clearInterval(interval);
  }, [isAdmin, page, eventType, dateFilter, search]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    loadLogs();
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
              <p className="text-sm uppercase tracking-[0.35em] text-blue-400">Security Audit</p>
              <h1 className="mt-2 text-2xl font-semibold text-white">Audit Logs</h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-400">
                Track all administrative actions, authentication events, and role modifications within the system.
              </p>
            </div>
            <div className="flex gap-3">
              <Link to="/dashboard" className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300 transition hover:border-slate-600 hover:text-white">Back to Dashboard</Link>
              <button type="button" onClick={loadLogs} className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-500">Refresh</button>
            </div>
          </div>
        </header>

        <section className="mb-6 rounded-3xl border border-slate-800 bg-slate-900/70 p-5 shadow-xl backdrop-blur">
          <form onSubmit={handleSearch} className="flex flex-col gap-4 sm:flex-row">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search by username..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div className="sm:w-48">
              <select
                value={eventType}
                onChange={(e) => { setEventType(e.target.value); setPage(1); }}
                className="w-full rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-2 text-sm text-slate-200 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">All Event Types</option>
                <option value="User Login History">User Login History</option>
                <option value="Logout History">Logout History</option>
                <option value="Failed Login Attempts">Failed Login Attempts</option>
                <option value="User Actions">User Actions</option>
                <option value="Role Changes">Role Changes</option>
                <option value="Account Creation">Account Creation</option>
                <option value="Account Deletion">Account Deletion</option>
                <option value="Password Reset Events">Password Reset Events</option>
              </select>
            </div>
            <div className="sm:w-48">
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => { setDateFilter(e.target.value); setPage(1); }}
                className="w-full rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-2 text-sm text-slate-200 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <button type="submit" className="rounded-xl bg-slate-700 px-6 py-2 text-sm font-semibold text-white transition hover:bg-slate-600">Search</button>
          </form>
        </section>

        {error ? <div className="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">{error}</div> : null}

        <section className="flex-1 rounded-3xl border border-slate-800 bg-slate-900/70 p-4 sm:p-5 overflow-hidden flex flex-col">
          <div className="overflow-x-auto flex-1">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="pb-3 font-medium">Timestamp</th>
                  <th className="pb-3 font-medium">Event Type</th>
                  <th className="pb-3 font-medium">Username</th>
                  <th className="pb-3 font-medium">IP Address</th>
                  <th className="pb-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td className="py-4 text-slate-400" colSpan="5">Loading audit logs…</td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td className="py-4 text-slate-400" colSpan="5">No logs found matching your criteria.</td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="border-b border-slate-800/70 text-slate-300 last:border-b-0 hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 font-mono text-xs text-slate-400">{new Date(log.timestamp).toLocaleString()}</td>
                      <td className="py-3">
                        <span className="inline-block rounded-md bg-slate-800 px-2 py-1 text-xs border border-slate-700">
                          {log.event_type}
                        </span>
                      </td>
                      <td className="py-3 text-blue-400">{log.username}</td>
                      <td className="py-3 font-mono text-xs">{log.ip_address}</td>
                      <td className="py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          log.status === 'Success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                          log.status === 'Failure' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                          'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}>
                          {log.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {!loading && total > 0 && (
            <div className="mt-4 flex items-center justify-between border-t border-slate-800 pt-4">
              <p className="text-sm text-slate-400">
                Showing <span className="font-medium text-white">{((page - 1) * 20) + 1}</span> to <span className="font-medium text-white">{Math.min(page * 20, total)}</span> of <span className="font-medium text-white">{total}</span> results
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1 text-sm text-slate-300 transition hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage(p => p + 1)}
                  disabled={page * 20 >= total}
                  className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1 text-sm text-slate-300 transition hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
