import React, { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function SystemLogs() {
  const { user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');

  const isAdmin = user?.role === 'Security Administrator';

  const loadLogs = async (isPolling = false) => {
    if (!isAdmin) return;

    if (!isPolling) setLoading(true);
    try {
      const response = await api.get('/admin/system-logs', {
        params: {
          page,
          limit: 50,
          search,
        }
      });
      setLogs(response.data.data || []);
      setTotal(response.data.total || 0);
      setError('');
    } catch (err) {
      if (!isPolling) setError(err?.response?.data?.detail || 'Unable to load system logs.');
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
  }, [isAdmin, page, search]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    loadLogs();
  };

  const getBadgeStyle = (level) => {
    switch(level) {
      case 'INFO':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'WARNING':
        return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      case 'ERROR':
        return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'SUCCESS':
        return 'bg-green-500/10 text-green-400 border-green-500/20';
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
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
              <p className="text-sm uppercase tracking-[0.35em] text-blue-400">System Diagnostics</p>
              <h1 className="mt-2 text-2xl font-semibold text-white">System Logs</h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-400">
                Monitor backend health, API requests, processing pipelines, and internal server errors.
              </p>
            </div>
            <div className="flex gap-3">
              <Link to="/dashboard" className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300 transition hover:border-slate-600 hover:text-white">Back to Dashboard</Link>
              <button type="button" onClick={loadLogs} className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-500">Refresh</button>
            </div>
          </div>
        </header>

        <section className="mb-6 rounded-3xl border border-slate-800 bg-slate-900/70 p-5 shadow-xl backdrop-blur">
          <form onSubmit={handleSearch} className="flex gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search logs by module or message..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <button type="submit" className="rounded-xl bg-slate-700 px-6 py-2 text-sm font-semibold text-white transition hover:bg-slate-600">Search</button>
          </form>
        </section>

        {error ? <div className="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">{error}</div> : null}

        <section className="flex-1 rounded-3xl border border-slate-800 bg-slate-900/70 p-4 sm:p-5 overflow-hidden flex flex-col">
          <div className="overflow-x-auto flex-1 bg-slate-950 rounded-xl border border-slate-800 p-2 font-mono text-[13px]">
            <table className="min-w-full text-left">
              <thead>
                <tr className="border-b border-slate-800 text-slate-500 uppercase tracking-wider text-[10px]">
                  <th className="px-3 py-2 font-semibold">Timestamp</th>
                  <th className="px-3 py-2 font-semibold">Level</th>
                  <th className="px-3 py-2 font-semibold">Module</th>
                  <th className="px-3 py-2 font-semibold">Message</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {loading ? (
                  <tr>
                    <td className="py-4 px-3 text-slate-500 text-center" colSpan="4">Tailing system logs...</td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td className="py-4 px-3 text-slate-500 text-center" colSpan="4">No system logs found matching your search.</td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-800/40 transition-colors group">
                      <td className="px-3 py-2 whitespace-nowrap text-slate-500">{new Date(log.timestamp).toISOString()}</td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${getBadgeStyle(log.level)}`}>
                          {log.level}
                        </span>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-purple-400/80">{log.module}</td>
                      <td className="px-3 py-2 text-slate-300 w-full group-hover:text-slate-200">
                        {log.message}
                        {log.exception && (
                          <div className="mt-2 text-[11px] text-rose-400 bg-rose-500/10 p-2 rounded border border-rose-500/20 whitespace-pre-wrap font-mono leading-relaxed">
                            {log.exception}
                          </div>
                        )}
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
                Showing <span className="font-medium text-white">{((page - 1) * 50) + 1}</span> to <span className="font-medium text-white">{Math.min(page * 50, total)}</span> of <span className="font-medium text-white">{total}</span> entries
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
                  disabled={page * 50 >= total}
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
