import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Skeleton from '../../components/common/Skeleton';
import {
  ShieldExclamationIcon,
  FolderOpenIcon,
  CheckCircleIcon,
  UserPlusIcon,
  ClockIcon,
  ChatBubbleLeftRightIcon,
  ArrowPathIcon,
  XMarkIcon,
  PlusIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';

const IncidentManagementPage = () => {
  const [incidents, setIncidents] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');

  // Selected Incident Modal
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [newNote, setNewNote] = useState('');
  const [analystsList, setAnalystsList] = useState([]);

  // Create Incident Form
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newSeverity, setNewSeverity] = useState('HIGH');
  const [newPriority, setNewPriority] = useState('HIGH');
  const [newAssignedTo, setNewAssignedTo] = useState('');

  const fetchIncidents = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 10 };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (severityFilter) params.severity = severityFilter;

      const res = await api.get('/incidents', { params });
      if (res.data && res.data.data) {
        setIncidents(res.data.data.data || []);
        setSummary(res.data.data.summary || null);
        setTotalPages(res.data.data.totalPages || 1);
      }
    } catch (err) {
      console.error('Error fetching incidents:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await api.get('/users');
      if (res.data && res.data.data) {
        setAnalystsList(res.data.data || []);
      }
    } catch (e) {}
  };

  useEffect(() => {
    fetchIncidents();
    fetchUsers();
  }, [page, statusFilter, severityFilter]);

  const handleFetchIncidentDetails = async (incidentId) => {
    try {
      const res = await api.get(`/incidents/${incidentId}`);
      if (res.data && res.data.data) {
        setSelectedIncident(res.data.data);
      }
    } catch (err) {
      alert('Failed to load incident details');
    }
  };

  const handleStatusChange = async (incidentId, newStatus) => {
    try {
      await api.patch(`/incidents/${incidentId}/status`, { status: newStatus });
      fetchIncidents();
      if (selectedIncident) handleFetchIncidentDetails(incidentId);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update status');
    }
  };

  const handleAssignIncident = async (incidentId, analystId, analystName) => {
    try {
      await api.patch(`/incidents/${incidentId}/assign`, { assignedTo: analystId, assignedToName: analystName });
      fetchIncidents();
      if (selectedIncident) handleFetchIncidentDetails(incidentId);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to assign analyst');
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!newNote.trim() || !selectedIncident) return;
    try {
      await api.post(`/incidents/${selectedIncident.incidentId}/notes`, { note: newNote });
      setNewNote('');
      handleFetchIncidentDetails(selectedIncident.incidentId);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to add note');
    }
  };

  const handleCreateIncidentSubmit = async (e) => {
    e.preventDefault();
    try {
      const selectedAnalyst = analystsList.find(u => u._id === newAssignedTo);
      const payload = {
        title: newTitle,
        description: newDescription,
        severity: newSeverity,
        priority: newPriority,
        assignedTo: newAssignedTo || null,
        assignedToName: selectedAnalyst ? selectedAnalyst.name : null
      };

      const res = await api.post('/incidents', payload);
      alert(`Incident Created! ID: ${res.data.data.incidentId}`);
      setShowCreateModal(false);
      setNewTitle('');
      setNewDescription('');
      fetchIncidents();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create incident');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="glass-card rounded-2xl p-6 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-wide font-mono flex items-center space-x-3">
            <ShieldExclamationIcon className="w-6 h-6 text-cyan-400" />
            <span>SOC Security Incident Management Center</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            End-to-end incident containment, analyst dispatching, investigation timeline, and forensic logging.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-extrabold rounded-xl text-xs flex items-center space-x-2 shadow-glow-cyan transition-all"
          >
            <PlusIcon className="w-4 h-4 stroke-[3]" />
            <span>New Incident</span>
          </button>
          <button
            onClick={fetchIncidents}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs border border-slate-700"
          >
            <ArrowPathIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card title="Total Incidents" value={summary?.total || 0} icon={FolderOpenIcon} glowColor="cyan" />
        <Card title="Open Incidents" value={summary?.OPEN || 0} icon={ShieldExclamationIcon} glowColor="red" />
        <Card title="Investigating" value={summary?.INVESTIGATING || 0} icon={ClockIcon} glowColor="orange" />
        <Card title="Contained" value={summary?.CONTAINED || 0} icon={CheckCircleIcon} glowColor="cyan" />
        <Card title="Resolved" value={summary?.RESOLVED || 0} icon={CheckCircleIcon} glowColor="green" />
        <Card title="Closed" value={summary?.CLOSED || 0} icon={CheckCircleIcon} glowColor="blue" />
      </div>

      {/* Filter Bar */}
      <div className="glass-card rounded-2xl p-4 border border-slate-800 flex flex-wrap items-center justify-between gap-3 font-mono text-xs">
        <div className="relative flex-1 min-w-[240px]">
          <MagnifyingGlassIcon className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search Incident ID, Title, Source IP..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
          />
        </div>

        <div className="flex items-center space-x-3">
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-300 focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="OPEN">OPEN</option>
            <option value="ACKNOWLEDGED">ACKNOWLEDGED</option>
            <option value="INVESTIGATING">INVESTIGATING</option>
            <option value="CONTAINED">CONTAINED</option>
            <option value="RESOLVED">RESOLVED</option>
            <option value="CLOSED">CLOSED</option>
          </select>

          <select
            value={severityFilter}
            onChange={(e) => { setSeverityFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-300 focus:outline-none"
          >
            <option value="">All Severities</option>
            <option value="CRITICAL">CRITICAL</option>
            <option value="HIGH">HIGH</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="LOW">LOW</option>
          </select>
        </div>
      </div>

      {/* Incidents Table */}
      <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-4">
        {loading ? (
          <Skeleton height="h-64" />
        ) : incidents.length === 0 ? (
          <div className="p-8 text-center text-slate-400 font-mono text-xs">
            No incidents recorded matching query parameters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase">
                  <th className="py-3 px-3">Incident ID</th>
                  <th className="py-3 px-3">Title</th>
                  <th className="py-3 px-3">Severity</th>
                  <th className="py-3 px-3">Priority</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Assigned Analyst</th>
                  <th className="py-3 px-3">Created</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {incidents.map((inc) => (
                  <tr key={inc.incidentId} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-3 font-bold text-cyan-300">{inc.incidentId}</td>
                    <td className="py-3 px-3 font-bold text-white max-w-[240px] truncate">{inc.title}</td>
                    <td className="py-3 px-3">
                      <Badge variant={inc.severity?.toLowerCase()}>{inc.severity}</Badge>
                    </td>
                    <td className="py-3 px-3 text-amber-400 font-bold">{inc.priority}</td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        inc.status === 'OPEN' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' :
                        inc.status === 'INVESTIGATING' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' :
                        inc.status === 'CONTAINED' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' :
                        'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      }`}>
                        {inc.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-300">
                      {inc.assignedToName || <span className="text-slate-600 italic">Unassigned</span>}
                    </td>
                    <td className="py-3 px-3 text-slate-400">
                      {new Date(inc.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => handleFetchIncidentDetails(inc.incidentId)}
                        className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded-lg font-bold border border-slate-700"
                      >
                        Manage
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Incident Details & Investigation Modal */}
      {selectedIncident && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card max-w-3xl w-full rounded-2xl border border-slate-800 p-6 space-y-5 max-h-[92vh] overflow-y-auto font-mono text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <span className="text-cyan-400 font-bold text-xs">{selectedIncident.incidentId}</span>
                <h3 className="text-base font-bold text-white font-sans">{selectedIncident.title}</h3>
              </div>
              <button onClick={() => setSelectedIncident(null)} className="text-slate-400 hover:text-white">
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Overview & Status Pipeline */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800 space-y-1">
                <span className="text-slate-500 text-[10px] block">SEVERITY / PRIORITY:</span>
                <div className="flex items-center space-x-2">
                  <Badge variant={selectedIncident.severity?.toLowerCase()}>{selectedIncident.severity}</Badge>
                  <span className="text-amber-400 font-bold">Priority: {selectedIncident.priority}</span>
                </div>
                <span className="text-slate-500 text-[10px] block mt-2">ASSIGNED ANALYST:</span>
                <span className="text-white font-bold">{selectedIncident.assignedToName || 'Unassigned'}</span>
              </div>

              <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800 space-y-1">
                <span className="text-slate-500 text-[10px] block">LIFECYCLE PIPELINE:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {['OPEN', 'ACKNOWLEDGED', 'INVESTIGATING', 'CONTAINED', 'RESOLVED', 'CLOSED'].map((st) => (
                    <button
                      key={st}
                      disabled={selectedIncident.status === st}
                      onClick={() => handleStatusChange(selectedIncident.incidentId, st)}
                      className={`px-2 py-1 rounded text-[9px] font-bold border ${
                        selectedIncident.status === st
                          ? 'bg-cyan-500 text-black border-cyan-400'
                          : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Description & Linked Assets */}
            <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 space-y-1">
              <span className="text-slate-400 font-bold block">INVESTIGATION SUMMARY:</span>
              <p className="text-slate-200">{selectedIncident.description}</p>
              {selectedIncident.affectedAssets && selectedIncident.affectedAssets.length > 0 && (
                <div className="mt-2 text-[11px] text-cyan-300">
                  <span className="text-slate-400">AFFECTED ASSETS: </span>
                  {selectedIncident.affectedAssets.join(', ')}
                </div>
              )}
            </div>

            {/* Investigation Timeline */}
            <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800 space-y-2">
              <span className="text-slate-300 font-bold flex items-center space-x-2">
                <ClockIcon className="w-4 h-4 text-cyan-400" />
                <span>CHRONOLOGICAL INCIDENT TIMELINE:</span>
              </span>
              <div className="space-y-2 pl-2 border-l border-cyan-500/30 text-[11px]">
                {(selectedIncident.timeline || []).map((t, idx) => (
                  <div key={idx} className="space-y-0.5">
                    <div className="flex items-center justify-between text-slate-400">
                      <span className="font-bold text-cyan-300">{t.action}</span>
                      <span className="text-[10px] text-slate-500">{new Date(t.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-slate-300">{t.details} <span className="text-slate-500">by {t.user}</span></p>
                  </div>
                ))}
              </div>
            </div>

            {/* Analyst Notes Log & Form */}
            <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800 space-y-3">
              <span className="text-slate-300 font-bold flex items-center space-x-2">
                <ChatBubbleLeftRightIcon className="w-4 h-4 text-cyan-400" />
                <span>ANALYST INVESTIGATION NOTES:</span>
              </span>

              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {(selectedIncident.notes || []).length === 0 ? (
                  <p className="text-slate-500 italic text-[11px]">No analyst notes recorded yet.</p>
                ) : (
                  (selectedIncident.notes || []).map((n, idx) => (
                    <div key={idx} className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 text-[11px]">
                      <div className="flex items-center justify-between text-slate-400 mb-1">
                        <span className="font-bold text-white">{n.user}</span>
                        <span className="text-[10px]">{new Date(n.timestamp).toLocaleString()}</span>
                      </div>
                      <p className="text-slate-200">{n.note}</p>
                    </div>
                  ))
                )}
              </div>

              <form onSubmit={handleAddNote} className="flex items-center space-x-2 pt-2 border-t border-slate-800">
                <input
                  type="text"
                  placeholder="Type investigation note or containment action..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  className="flex-1 px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold rounded-xl"
                >
                  Add Note
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Create New Incident Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleCreateIncidentSubmit} className="glass-card max-w-lg w-full rounded-2xl border border-slate-800 p-6 space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white uppercase">Declare New Security Incident</h3>
              <button type="button" onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-white">
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="text-slate-400 block mb-1">INCIDENT TITLE:</label>
              <input
                type="text"
                required
                placeholder="e.g. Unusual Outbound UDP Beacons to C2 Domain"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1">DESCRIPTION:</label>
              <textarea
                rows={3}
                required
                placeholder="Detail suspicious behavior, affected subnets, or forensic observations..."
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-slate-400 block mb-1">SEVERITY:</label>
                <select
                  value={newSeverity}
                  onChange={(e) => setNewSeverity(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-300 focus:outline-none"
                >
                  <option value="CRITICAL">CRITICAL</option>
                  <option value="HIGH">HIGH</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="LOW">LOW</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">PRIORITY:</label>
                <select
                  value={newPriority}
                  onChange={(e) => setNewPriority(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-300 focus:outline-none"
                >
                  <option value="CRITICAL">CRITICAL</option>
                  <option value="HIGH">HIGH</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="LOW">LOW</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-slate-400 block mb-1">ASSIGN TO ANALYST:</label>
              <select
                value={newAssignedTo}
                onChange={(e) => setNewAssignedTo(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-300 focus:outline-none"
              >
                <option value="">Unassigned</option>
                {analystsList.map(u => (
                  <option key={u._id} value={u._id}>{u.name} ({u.role})</option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-400 font-bold rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold rounded-xl shadow-glow-cyan"
              >
                Declare Incident
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default IncidentManagementPage;
