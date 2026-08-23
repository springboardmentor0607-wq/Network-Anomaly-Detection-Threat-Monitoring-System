import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Skeleton from '../../components/common/Skeleton';
import {
  ExclamationTriangleIcon,
  FunnelIcon,
  ShieldExclamationIcon,
  CheckCircleIcon,
  UserPlusIcon,
  ArrowPathIcon,
  XMarkIcon,
  DocumentPlusIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';

const ThreatAlertsPage = () => {
  const [alerts, setAlerts] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalAlerts, setTotalAlerts] = useState(0);

  // Filters
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [attackTypeFilter, setAttackTypeFilter] = useState('');

  // Selected Alert for Details Modal
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [analystsList, setAnalystsList] = useState([]);

  // Create Incident Modal State
  const [showCreateIncident, setShowCreateIncident] = useState(false);
  const [incidentTitle, setIncidentTitle] = useState('');
  const [incidentDescription, setIncidentDescription] = useState('');

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 10 };
      if (search) params.search = search;
      if (severityFilter) params.severity = severityFilter;
      if (statusFilter) params.status = statusFilter;
      if (attackTypeFilter) params.attackType = attackTypeFilter;

      const res = await api.get('/alerts', { params });
      if (res.data && res.data.data) {
        setAlerts(res.data.data.data || []);
        setSummary(res.data.data.summary || null);
        setTotalPages(res.data.data.totalPages || 1);
        setTotalAlerts(res.data.data.total || 0);
      }
    } catch (err) {
      console.error('Error fetching alerts:', err);
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
    fetchAlerts();
    fetchUsers();
  }, [page, severityFilter, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchAlerts();
  };

  const handleStatusChange = async (alertId, newStatus) => {
    try {
      await api.patch(`/alerts/${alertId}/status`, { status: newStatus });
      fetchAlerts();
      if (selectedAlert && selectedAlert.alertId === alertId) {
        setSelectedAlert({ ...selectedAlert, status: newStatus });
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update alert status');
    }
  };

  const handleAssignAnalyst = async (alertId, analystId, analystName) => {
    try {
      await api.patch(`/alerts/${alertId}/assign`, { assignedTo: analystId, assignedToName: analystName });
      fetchAlerts();
      if (selectedAlert && selectedAlert.alertId === alertId) {
        setSelectedAlert({ ...selectedAlert, assignedTo: analystId, assignedToName: analystName, status: 'ACKNOWLEDGED' });
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to assign analyst');
    }
  };

  const handleCreateIncidentFromAlert = async () => {
    if (!selectedAlert) return;
    try {
      const payload = {
        title: incidentTitle || `Incident: ${selectedAlert.attackType} from ${selectedAlert.sourceIp}`,
        description: incidentDescription || selectedAlert.description,
        severity: selectedAlert.severity,
        priority: selectedAlert.severity === 'CRITICAL' ? 'CRITICAL' : 'HIGH',
        assignedTo: selectedAlert.assignedTo,
        assignedToName: selectedAlert.assignedToName,
        relatedAlerts: [selectedAlert.alertId],
        attackTypes: [selectedAlert.attackType],
        affectedAssets: [`${selectedAlert.destinationIp}:${selectedAlert.destinationPort}`],
        sourceIps: [selectedAlert.sourceIp],
        destinationIps: [selectedAlert.destinationIp]
      };

      const res = await api.post('/incidents', payload);
      alert(`Incident created successfully! ID: ${res.data.data.incidentId}`);
      setShowCreateIncident(false);
      fetchAlerts();
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
            <ExclamationTriangleIcon className="w-6 h-6 text-amber-400" />
            <span>SOC Threat Alert Management Center</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time attack alert correlation, lifecycle management, and rules-based prioritization engine.
          </p>
        </div>
        <button
          onClick={fetchAlerts}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold rounded-xl text-xs flex items-center space-x-2 border border-slate-700 self-start md:self-auto transition-all"
        >
          <ArrowPathIcon className="w-4 h-4" />
          <span>Refresh Alerts</span>
        </button>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card title="Total Alerts" value={summary?.total || totalAlerts} icon={ShieldExclamationIcon} glowColor="cyan" />
        <Card title="Critical Alerts" value={summary?.CRITICAL || 0} icon={ExclamationTriangleIcon} glowColor="red" />
        <Card title="High Alerts" value={summary?.HIGH || 0} icon={ExclamationTriangleIcon} glowColor="orange" />
        <Card title="Medium Alerts" value={summary?.MEDIUM || 0} icon={FunnelIcon} glowColor="cyan" />
        <Card title="Unresolved" value={summary?.unresolved || 0} icon={ShieldExclamationIcon} glowColor="orange" />
        <Card title="Resolved" value={summary?.resolved || 0} icon={CheckCircleIcon} glowColor="green" />
      </div>

      {/* Filter & Search Bar */}
      <div className="glass-card rounded-2xl p-4 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="flex items-center space-x-2 flex-1 min-w-[240px]">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by Alert ID, Attack, Source IP..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
            />
          </div>
          <button type="submit" className="px-3 py-2 bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 rounded-xl text-xs font-bold hover:bg-cyan-500/20">
            Search
          </button>
        </form>

        <div className="flex items-center space-x-3 text-xs">
          <select
            value={severityFilter}
            onChange={(e) => { setSeverityFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-300 font-mono focus:outline-none"
          >
            <option value="">All Severities</option>
            <option value="CRITICAL">CRITICAL</option>
            <option value="HIGH">HIGH</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="LOW">LOW</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-300 font-mono focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="NEW">NEW</option>
            <option value="ACKNOWLEDGED">ACKNOWLEDGED</option>
            <option value="INVESTIGATING">INVESTIGATING</option>
            <option value="RESOLVED">RESOLVED</option>
            <option value="CLOSED">CLOSED</option>
          </select>

          {(search || severityFilter || statusFilter) && (
            <button
              onClick={() => { setSearch(''); setSeverityFilter(''); setStatusFilter(''); setPage(1); }}
              className="text-xs text-rose-400 hover:underline font-mono"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Alert Table */}
      <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-4">
        {loading ? (
          <Skeleton height="h-64" />
        ) : alerts.length === 0 ? (
          <div className="p-8 text-center text-slate-400 font-mono text-xs">
            No threat alerts found matching current filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase">
                  <th className="py-3 px-3">Alert ID</th>
                  <th className="py-3 px-3">Time</th>
                  <th className="py-3 px-3">Severity</th>
                  <th className="py-3 px-3">Attack Type</th>
                  <th className="py-3 px-3">Source IP</th>
                  <th className="py-3 px-3">Target IP</th>
                  <th className="py-3 px-3">Risk</th>
                  <th className="py-3 px-3">Occurrences</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Assigned Analyst</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {alerts.map((a) => (
                  <tr key={a.alertId} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-3 font-bold text-cyan-300">{a.alertId}</td>
                    <td className="py-3 px-3 text-slate-400">
                      {new Date(a.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3 px-3">
                      <Badge variant={a.severity?.toLowerCase()}>{a.severity}</Badge>
                    </td>
                    <td className="py-3 px-3 font-bold text-white">{a.attackType}</td>
                    <td className="py-3 px-3 text-slate-300">{a.sourceIp}</td>
                    <td className="py-3 px-3 text-slate-400">{a.destinationIp}:{a.destinationPort}</td>
                    <td className="py-3 px-3 font-bold text-cyan-400">{a.riskScore}/100</td>
                    <td className="py-3 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${a.occurrenceCount > 1 ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' : 'text-slate-500'}`}>
                        {a.occurrenceCount || 1}×
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        a.status === 'NEW' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' :
                        a.status === 'ACKNOWLEDGED' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' :
                        a.status === 'INVESTIGATING' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' :
                        'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      }`}>
                        {a.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-400">
                      {a.assignedToName || <span className="text-slate-600 italic">Unassigned</span>}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => setSelectedAlert(a)}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded-lg text-[11px] font-bold border border-slate-700"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-4 border-t border-slate-800/80 text-xs font-mono">
            <span className="text-slate-400">
              Showing page {page} of {totalPages} ({totalAlerts} total alerts)
            </span>
            <div className="flex items-center space-x-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="px-3 py-1.5 bg-slate-900 disabled:opacity-40 text-slate-300 rounded-lg border border-slate-800"
              >
                Previous
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className="px-3 py-1.5 bg-slate-900 disabled:opacity-40 text-slate-300 rounded-lg border border-slate-800"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Alert Details Modal */}
      {selectedAlert && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card max-w-2xl w-full rounded-2xl border border-slate-800 p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <span className="text-xs font-mono text-cyan-400 font-bold block">{selectedAlert.alertId}</span>
                <h3 className="text-base font-bold text-white">{selectedAlert.attackType} Threat Alert</h3>
              </div>
              <button onClick={() => setSelectedAlert(null)} className="text-slate-400 hover:text-white">
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Detection & Network Info */}
            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800 space-y-1">
                <span className="text-slate-500 block text-[10px]">DETECTION TIME:</span>
                <span className="text-white font-bold">{new Date(selectedAlert.timestamp).toLocaleString()}</span>
                <span className="text-slate-500 block text-[10px] mt-2">SEVERITY / RISK:</span>
                <div className="flex items-center space-x-2">
                  <Badge variant={selectedAlert.severity?.toLowerCase()}>{selectedAlert.severity}</Badge>
                  <span className="text-cyan-400 font-bold">{selectedAlert.riskScore}/100</span>
                </div>
              </div>

              <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800 space-y-1">
                <span className="text-slate-500 block text-[10px]">NETWORK VECTOR:</span>
                <span className="text-cyan-300 font-bold">{selectedAlert.sourceIp} → {selectedAlert.destinationIp}:{selectedAlert.destinationPort}</span>
                <span className="text-slate-500 block text-[10px] mt-2">AI MODEL USED:</span>
                <span className="text-emerald-400 font-bold">{selectedAlert.modelUsed} ({Math.round((selectedAlert.confidenceScore || 0.95) * 100)}% Conf)</span>
              </div>
            </div>

            {/* Attack Description */}
            <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 text-xs font-mono space-y-1">
              <span className="text-slate-400 font-bold block">DESCRIPTION:</span>
              <p className="text-slate-200">{selectedAlert.description}</p>
            </div>

            {/* Recommended Defensive Mitigation */}
            <div className="p-3.5 bg-amber-500/10 rounded-xl border border-amber-500/30 text-xs font-mono space-y-1">
              <span className="text-amber-300 font-bold flex items-center space-x-2">
                <ShieldExclamationIcon className="w-4 h-4 text-amber-400" />
                <span>RECOMMENDED DEFENSIVE ACTION:</span>
              </span>
              <p className="text-slate-200 leading-snug">{selectedAlert.recommendation}</p>
            </div>

            {/* Lifecycle Status & Assign Controls */}
            <div className="pt-2 border-t border-slate-800 space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-bold">STATUS TRANSITION:</span>
                <div className="flex items-center space-x-2">
                  {['ACKNOWLEDGED', 'INVESTIGATING', 'RESOLVED', 'CLOSED'].map((st) => (
                    <button
                      key={st}
                      disabled={selectedAlert.status === st}
                      onClick={() => handleStatusChange(selectedAlert.alertId, st)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border ${
                        selectedAlert.status === st
                          ? 'bg-cyan-500 text-black border-cyan-400'
                          : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-bold">ASSIGN ANALYST:</span>
                <select
                  value={selectedAlert.assignedTo || ''}
                  onChange={(e) => {
                    const selected = analystsList.find(u => u._id === e.target.value);
                    if (selected) handleAssignAnalyst(selectedAlert.alertId, selected._id, selected.name);
                  }}
                  className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-300 focus:outline-none"
                >
                  <option value="">Unassigned</option>
                  {analystsList.map(u => (
                    <option key={u._id} value={u._id}>{u.name} ({u.role})</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
              <button
                onClick={() => {
                  setIncidentTitle(`Incident: ${selectedAlert.attackType} from ${selectedAlert.sourceIp}`);
                  setIncidentDescription(selectedAlert.description);
                  setShowCreateIncident(true);
                }}
                className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-extrabold rounded-xl text-xs flex items-center space-x-2 shadow-glow-cyan"
              >
                <DocumentPlusIcon className="w-4 h-4 stroke-[3]" />
                <span>Create Incident from Alert</span>
              </button>
              <button
                onClick={() => setSelectedAlert(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold rounded-xl text-xs border border-slate-800"
              >
                Close Modal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Incident Modal */}
      {showCreateIncident && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card max-w-lg w-full rounded-2xl border border-slate-800 p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white font-mono uppercase">Create Security Incident</h3>
              <button onClick={() => setShowCreateIncident(false)} className="text-slate-400 hover:text-white">
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div>
                <label className="text-slate-400 block mb-1">INCIDENT TITLE:</label>
                <input
                  type="text"
                  value={incidentTitle}
                  onChange={(e) => setIncidentTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">INVESTIGATION DETAILS:</label>
                <textarea
                  rows={3}
                  value={incidentDescription}
                  onChange={(e) => setIncidentDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => setShowCreateIncident(false)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-400 font-bold rounded-xl text-xs border border-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateIncidentFromAlert}
                className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold rounded-xl text-xs shadow-glow-cyan"
              >
                Create Incident
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ThreatAlertsPage;
