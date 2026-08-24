import React, { useEffect, useState, useCallback, useMemo } from 'react';
import HeaderNav from '../components/HeaderNav';
import LoadingSpinner from '../components/LoadingSpinner';
import api from '../services/api';

const PRIORITY_BADGES = {
  Critical: 'bg-red-500/20 text-red-400 border-red-500/40',
  High: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
  Medium: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
  Low: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
};

const STATUS_BADGES = {
  New: 'bg-blue-500/20 text-blue-300 border-blue-500/40 animate-pulse',
  'In Progress': 'bg-amber-500/20 text-amber-300 border-amber-500/40',
  'Under Investigation': 'bg-purple-500/20 text-purple-300 border-purple-500/40',
  Resolved: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
  Closed: 'bg-slate-700/40 text-slate-400 border-slate-700',
};

export default function Incidents() {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // Modal State
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [noteText, setNoteText] = useState('');
  const [submittingNote, setSubmittingNote] = useState(false);
  const [analystInput, setAnalystInput] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newPriority, setNewPriority] = useState('High');
  const [newAlertId, setNewAlertId] = useState('');

  const fetchIncidents = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/incidents', { params: { limit: 100 } });
      setIncidents(response.data || []);
    } catch (err) {
      console.error('Failed to fetch incidents:', err);
      setError(err?.response?.data?.detail || 'Unable to load incidents from backend.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchIncidents();
  }, [fetchIncidents]);

  // Statistics
  const stats = useMemo(() => {
    const total = incidents.length;
    const active = incidents.filter((i) => ['New', 'In Progress', 'Under Investigation'].includes(i.status)).length;
    const critical = incidents.filter((i) => i.priority === 'Critical' || i.priority === 'High').length;
    const resolved = incidents.filter((i) => i.status === 'Resolved' || i.status === 'Closed').length;
    return { total, active, critical, resolved };
  }, [incidents]);

  // Filtered rows
  const filteredIncidents = useMemo(() => {
    return incidents.filter((item) => {
      const q = search.trim().toLowerCase();
      const matchSearch =
        !q ||
        (item.incident_id && item.incident_id.toLowerCase().includes(q)) ||
        (item.title && item.title.toLowerCase().includes(q)) ||
        (item.assigned_analyst && item.assigned_analyst.toLowerCase().includes(q)) ||
        (item.alert_id && item.alert_id.toLowerCase().includes(q));

      const matchPriority = priorityFilter === 'All' || item.priority === priorityFilter;
      const matchStatus = statusFilter === 'All' || item.status === statusFilter;

      return matchSearch && matchPriority && matchStatus;
    });
  }, [incidents, search, priorityFilter, statusFilter]);

  // Handle status / analyst updates
  const handleUpdateIncident = async (incidentId, updatePayload) => {
    try {
      const res = await api.patch(`/incidents/${incidentId}`, updatePayload);
      setIncidents((prev) => prev.map((inc) => (inc.incident_id === incidentId ? res.data : inc)));
      if (selectedIncident && selectedIncident.incident_id === incidentId) {
        setSelectedIncident(res.data);
      }
    } catch (err) {
      alert(err?.response?.data?.detail || 'Failed to update incident.');
    }
  };

  // Handle adding investigation notes
  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!noteText.trim() || !selectedIncident) return;
    setSubmittingNote(true);
    try {
      const res = await api.post(`/incidents/${selectedIncident.incident_id}/notes`, {
        text: noteText.trim(),
      });
      setIncidents((prev) => prev.map((inc) => (inc.incident_id === selectedIncident.incident_id ? res.data : inc)));
      setSelectedIncident(res.data);
      setNoteText('');
    } catch (err) {
      alert(err?.response?.data?.detail || 'Failed to add note.');
    } finally {
      setSubmittingNote(false);
    }
  };

  // Create Incident
  const handleCreateIncident = async (e) => {
    e.preventDefault();
    try {
      let res;
      if (newAlertId.trim()) {
        res = await api.post(`/incidents/from-alert/${newAlertId.trim()}`, null, {
          params: { priority: newPriority },
        });
      } else {
        res = await api.post('/incidents', {
          title: newTitle.trim() || 'Manual Security Incident',
          priority: newPriority,
        });
      }
      setIncidents((prev) => [res.data, ...prev]);
      setShowCreateModal(false);
      setNewTitle('');
      setNewAlertId('');
    } catch (err) {
      alert(err?.response?.data?.detail || 'Failed to create incident.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
      <div className="mx-auto max-w-7xl">
        <HeaderNav
          title="Incident Management"
          subtitle="Track, assign, investigate, and resolve security threat incidents in real time."
          onRefresh={fetchIncidents}
        />

        {/* KPI Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 backdrop-blur">
            <p className="text-xs uppercase tracking-wider text-slate-400">Total Incidents</p>
            <p className="mt-2 text-3xl font-bold text-white">{stats.total}</p>
          </div>
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 backdrop-blur">
            <p className="text-xs uppercase tracking-wider text-amber-400">Active Investigations</p>
            <p className="mt-2 text-3xl font-bold text-amber-300">{stats.active}</p>
          </div>
          <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-5 backdrop-blur">
            <p className="text-xs uppercase tracking-wider text-rose-400">Critical / High Priority</p>
            <p className="mt-2 text-3xl font-bold text-rose-300">{stats.critical}</p>
          </div>
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5 backdrop-blur">
            <p className="text-xs uppercase tracking-wider text-emerald-400">Resolved / Closed</p>
            <p className="mt-2 text-3xl font-bold text-emerald-300">{stats.resolved}</p>
          </div>
        </div>

        {/* Toolbar & Filters */}
        <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-slate-800 bg-slate-900/80 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="text"
              placeholder="Search by ID, title, analyst..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none w-64"
            />
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-300 focus:border-blue-500 focus:outline-none"
            >
              <option value="All">All Priorities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-300 focus:border-blue-500 focus:outline-none"
            >
              <option value="All">All Statuses</option>
              <option value="New">New</option>
              <option value="In Progress">In Progress</option>
              <option value="Under Investigation">Under Investigation</option>
              <option value="Resolved">Resolved</option>
              <option value="Closed">Closed</option>
            </select>
          </div>

          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-500"
          >
            + Create / Promote Incident
          </button>
        </div>

        {/* Incidents Table */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 shadow-2xl overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <LoadingSpinner />
              <p className="mt-2 text-xs text-slate-400">Loading security incidents...</p>
            </div>
          ) : error ? (
            <div className="p-8 text-center text-rose-400 text-sm">{error}</div>
          ) : filteredIncidents.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-sm">
              No incidents found matching current filters.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="border-b border-slate-800 bg-slate-950/70 text-[11px] uppercase tracking-wider text-slate-400">
                  <tr>
                    <th className="px-4 py-3">Incident ID</th>
                    <th className="px-4 py-3">Title / Threat</th>
                    <th className="px-4 py-3">Alert Ref</th>
                    <th className="px-4 py-3">Priority</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Assigned Analyst</th>
                    <th className="px-4 py-3">Created At</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredIncidents.map((inc) => {
                    const priorityClass = PRIORITY_BADGES[inc.priority] || 'bg-slate-800 text-slate-300';
                    const statusClass = STATUS_BADGES[inc.status] || 'bg-slate-800 text-slate-300';

                    return (
                      <tr key={inc.incident_id} className="hover:bg-slate-800/40 transition">
                        <td className="px-4 py-3 font-mono font-bold text-blue-400">{inc.incident_id}</td>
                        <td className="px-4 py-3 font-semibold text-white max-w-xs truncate">{inc.title}</td>
                        <td className="px-4 py-3 font-mono text-slate-400">{inc.alert_id || '—'}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-block rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${priorityClass}`}>
                            {inc.priority}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-block rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${statusClass}`}>
                            {inc.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-200">{inc.assigned_analyst || 'Unassigned'}</td>
                        <td className="px-4 py-3 font-mono text-slate-400">
                          {new Date(inc.created_at).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedIncident(inc);
                              setAnalystInput(inc.assigned_analyst || '');
                            }}
                            className="rounded-lg bg-blue-600/20 text-blue-300 border border-blue-500/30 px-3 py-1 text-[11px] font-semibold hover:bg-blue-600/40 transition"
                          >
                            Investigate
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Detail & Investigation Modal */}
      {selectedIncident && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto"
          onClick={() => setSelectedIncident(null)}
        >
          <div
            className="w-full max-w-2xl rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl p-6 my-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
              <div>
                <p className="text-xs uppercase tracking-wider text-blue-400 font-bold">{selectedIncident.incident_id}</p>
                <h2 className="text-lg font-bold text-white">{selectedIncident.title}</h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedIncident(null)}
                className="text-slate-400 hover:text-white transition text-sm font-bold"
              >
                ✕ Close
              </button>
            </div>

            {/* Quick Status & Assignment Control */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Status Transition</label>
                <div className="flex flex-wrap gap-1.5">
                  {['New', 'In Progress', 'Under Investigation', 'Resolved', 'Closed'].map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => handleUpdateIncident(selectedIncident.incident_id, { status: st })}
                      className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg border transition ${
                        selectedIncident.status === st
                          ? 'bg-blue-600 text-white border-blue-500 shadow'
                          : 'border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-600'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Assigned Analyst</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={analystInput}
                    onChange={(e) => setAnalystInput(e.target.value)}
                    placeholder="analyst@netshield.ai"
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white focus:border-blue-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      handleUpdateIncident(selectedIncident.incident_id, { assigned_analyst: analystInput })
                    }
                    className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-500 transition"
                  >
                    Assign
                  </button>
                </div>
              </div>
            </div>

            {/* Notes & Timeline */}
            <div className="mb-6">
              <h3 className="text-sm font-bold text-white mb-3">Investigation Timeline & Notes</h3>
              <div className="max-h-48 overflow-y-auto space-y-2 pr-1 mb-4">
                {(!selectedIncident.notes || selectedIncident.notes.length === 0) ? (
                  <p className="text-xs text-slate-500 italic">No notes recorded yet.</p>
                ) : (
                  selectedIncident.notes.map((note, idx) => (
                    <div key={idx} className="rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs">
                      <div className="flex items-center justify-between text-slate-400 mb-1 text-[11px]">
                        <span className="font-semibold text-blue-400">{note.author}</span>
                        <span className="font-mono">{new Date(note.timestamp).toLocaleString()}</span>
                      </div>
                      <p className="text-slate-200">{note.text}</p>
                    </div>
                  ))
                )}
              </div>

              {/* Add Note Form */}
              <form onSubmit={handleAddNote} className="flex flex-col gap-2">
                <textarea
                  rows={2}
                  placeholder="Enter investigation observations, IP blocks, or triage findings..."
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={submittingNote || !noteText.trim()}
                    className="rounded-xl bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-blue-500 disabled:opacity-50 transition"
                  >
                    {submittingNote ? 'Saving...' : 'Add Note'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Create / Promote Modal */}
      {showCreateModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4"
          onClick={() => setShowCreateModal(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-bold text-white mb-4">Create / Promote Incident</h2>
            <form onSubmit={handleCreateIncident} className="flex flex-col gap-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Promote Alert ID (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. ALT-A1B2C3D4"
                  value={newAlertId}
                  onChange={(e) => setNewAlertId(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-white placeholder-slate-600 focus:border-blue-500 focus:outline-none"
                />
              </div>

              {!newAlertId && (
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Incident Title</label>
                  <input
                    type="text"
                    placeholder="e.g. DDoS Traffic Surge on Web Cluster"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-white placeholder-slate-600 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              )}

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Priority</label>
                <select
                  value={newPriority}
                  onChange={(e) => setNewPriority(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                >
                  <option value="Critical">Critical</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-xl border border-slate-700 px-4 py-2 text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-500 shadow-lg shadow-blue-600/20"
                >
                  Create Incident
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
