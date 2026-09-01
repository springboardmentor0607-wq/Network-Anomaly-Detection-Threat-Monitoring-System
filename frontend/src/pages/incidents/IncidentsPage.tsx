import React, { useState } from 'react';
import { Card } from '../../components/common/Card';
import { FolderLock, Plus, ShieldAlert, CheckCircle, Clock, User, ArrowRight, Save } from 'lucide-react';
import { useLocation } from 'react-router-dom';

interface Incident {
  id: string;
  title: string;
  description: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'OPEN' | 'INVESTIGATING' | 'CONTAINED' | 'RESOLVED' | 'CLOSED';
  relatedAlerts: string[];
  affectedSystems: string[];
  assignedAnalyst: string;
  createdAt: string;
  resolutionNotes: string;
}

export const IncidentsPage: React.FC = () => {
  const location = useLocation();
  const initialAlert = location.state?.alert;

  const [incidents, setIncidents] = useState<Incident[]>([
    {
      id: 'INC-2026-0891',
      title: 'Distributed Denial of Service (DDoS) Attack on Gateway',
      description: 'High volume SYN Flood originating from 42.112.98.14 targeting primary API gateway (192.168.1.100). Bandwidth spike exceeded 8.4 Gbps.',
      severity: 'CRITICAL',
      status: 'INVESTIGATING',
      relatedAlerts: ['ALT-8921', 'ALT-8922'],
      affectedSystems: ['API Gateway', 'Auth Service'],
      assignedAnalyst: 'Sarah Connor (SOC Lead)',
      createdAt: '2026-08-10T08:15:00Z',
      resolutionNotes: 'Rate-limiting rules applied at cloud edge. BGP blackholing initiated for malicious range.',
    },
    {
      id: 'INC-2026-0890',
      title: 'Credential Dumping via SSH Brute Force',
      description: 'Multiple failed SSH authentication attempts detected on database cluster server (192.168.1.250). Total 1,420 attempts within 5 minutes.',
      severity: 'HIGH',
      status: 'CONTAINED',
      relatedAlerts: ['ALT-8915'],
      affectedSystems: ['PostgreSQL DB Cluster'],
      assignedAnalyst: 'Alex Mercer',
      createdAt: '2026-08-10T06:45:00Z',
      resolutionNotes: 'Source IP 185.220.101.5 blocked via iptables. Fail2ban jail triggered permanently.',
    },
  ]);

  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(incidents[0]);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(!!initialAlert);
  const [newTitle, setNewTitle] = useState(initialAlert ? `Incident for ${initialAlert.attackType} (${initialAlert.id})` : '');
  const [newDesc, setNewDesc] = useState(initialAlert ? `Alert ${initialAlert.id} triggered from ${initialAlert.sourceIp} with Risk Score ${initialAlert.riskScore}.` : '');

  const handleStatusChange = (id: string, newStatus: Incident['status']) => {
    setIncidents((prev) =>
      prev.map((inc) => (inc.id === id ? { ...inc, status: newStatus } : inc))
    );
    if (selectedIncident?.id === id) {
      setSelectedIncident((prev) => prev ? { ...prev, status: newStatus } : null);
    }
  };

  const handleSaveNotes = (notes: string) => {
    if (!selectedIncident) return;
    setIncidents((prev) =>
      prev.map((inc) => (inc.id === selectedIncident.id ? { ...inc, resolutionNotes: notes } : inc))
    );
    setSelectedIncident((prev) => prev ? { ...prev, resolutionNotes: notes } : null);
  };

  const handleCreateIncident = (e: React.FormEvent) => {
    e.preventDefault();
    const newInc: Incident = {
      id: `INC-2026-${Math.floor(892 + Math.random() * 100)}`,
      title: newTitle || 'New Security Incident',
      description: newDesc || 'Security anomaly escalation ticket.',
      severity: 'HIGH',
      status: 'OPEN',
      relatedAlerts: initialAlert ? [initialAlert.id] : [],
      affectedSystems: ['General Network Subnet'],
      assignedAnalyst: 'SOC Analyst',
      createdAt: new Date().toISOString(),
      resolutionNotes: '',
    };
    setIncidents([newInc, ...incidents]);
    setSelectedIncident(newInc);
    setShowCreateModal(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Incident Management Board</h2>
          <p className="text-xs text-gray-400">Track active security incidents, contained threats, and resolution logs.</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs rounded-xl shadow-lg transition flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>New Incident Ticket</span>
        </button>
      </div>

      {/* Main Kanban / Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Incidents List */}
        <div className="space-y-3">
          {incidents.map((inc) => (
            <div
              key={inc.id}
              onClick={() => setSelectedIncident(inc)}
              className={`p-4 rounded-xl border cursor-pointer transition ${
                selectedIncident?.id === inc.id
                  ? 'bg-cyan-950/40 border-cyan-500/60 shadow-lg'
                  : 'bg-[#0F172A] border-[#1F2937] hover:border-gray-700'
              }`}
            >
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-bold text-cyan-400">{inc.id}</span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    inc.severity === 'CRITICAL' ? 'bg-red-950 text-red-400 border border-red-500/40' : 'bg-amber-950 text-amber-400 border border-amber-500/40'
                  }`}
                >
                  {inc.severity}
                </span>
              </div>
              <h4 className="text-sm font-bold text-white line-clamp-1">{inc.title}</h4>
              <p className="text-xs text-gray-400 line-clamp-2 mt-1">{inc.description}</p>
              <div className="mt-3 flex items-center justify-between text-[11px] text-gray-500 pt-2 border-t border-[#1F2937]">
                <span>Status: <strong className="text-gray-300">{inc.status}</strong></span>
                <span>{new Date(inc.createdAt).toLocaleTimeString()}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Right Column: Detailed Incident Forensic Inspector */}
        <div className="lg:col-span-2 space-y-6">
          {selectedIncident ? (
            <Card title={`Incident Forensic Record: ${selectedIncident.id}`}>
              <div className="space-y-6">
                <div>
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-bold text-white">{selectedIncident.title}</h3>
                    <select
                      value={selectedIncident.status}
                      onChange={(e) => handleStatusChange(selectedIncident.id, e.target.value as any)}
                      className="bg-[#131C2E] border border-cyan-500/40 text-cyan-400 font-bold rounded-lg px-3 py-1 text-xs focus:outline-none"
                    >
                      <option value="OPEN">OPEN</option>
                      <option value="INVESTIGATING">INVESTIGATING</option>
                      <option value="CONTAINED">CONTAINED</option>
                      <option value="RESOLVED">RESOLVED</option>
                      <option value="CLOSED">CLOSED</option>
                    </select>
                  </div>
                  <p className="text-xs text-gray-300 leading-relaxed">{selectedIncident.description}</p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs bg-[#0B0F17] p-4 rounded-xl border border-[#1F2937]">
                  <div><span className="text-gray-400 block">Assigned Analyst</span><span className="font-semibold text-white">{selectedIncident.assignedAnalyst}</span></div>
                  <div><span className="text-gray-400 block">Severity Level</span><span className="font-semibold text-red-400">{selectedIncident.severity}</span></div>
                  <div><span className="text-gray-400 block">Created Time</span><span className="text-gray-300">{new Date(selectedIncident.createdAt).toLocaleString()}</span></div>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">Affected Subnets & Systems</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedIncident.affectedSystems.map((sys, idx) => (
                      <span key={idx} className="px-3 py-1 bg-[#131C2E] border border-[#1F2937] text-xs text-cyan-300 rounded-lg">
                        {sys}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Resolution Notes Editor */}
                <div>
                  <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">Resolution & Containment Notes</h4>
                  <textarea
                    value={selectedIncident.resolutionNotes}
                    onChange={(e) => handleSaveNotes(e.target.value)}
                    rows={4}
                    placeholder="Enter analyst investigation timeline, containment actions, firewall rules applied, and closure summary..."
                    className="w-full bg-[#131C2E] border border-[#1F2937] rounded-xl p-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>
            </Card>
          ) : (
            <Card title="Incident Inspector">
              <p className="text-xs text-gray-400">Select an incident from the list to view forensic logs.</p>
            </Card>
          )}
        </div>
      </div>

      {/* New Incident Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-[#0F172A] border border-[#1F2937] w-full max-w-lg rounded-2xl p-6 space-y-4">
            <h3 className="text-base font-bold text-white">Create New Incident Ticket</h3>
            <form onSubmit={handleCreateIncident} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-gray-300 mb-1">Incident Title</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Unusual Outbound Payload Exfiltration"
                  className="w-full bg-[#131C2E] border border-[#1F2937] rounded-xl p-2.5 text-white focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>
              <div>
                <label className="block font-bold text-gray-300 mb-1">Detailed Forensic Description</label>
                <textarea
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  rows={3}
                  placeholder="Provide packet evidence, source IPs, and affected systems..."
                  className="w-full bg-[#131C2E] border border-[#1F2937] rounded-xl p-2.5 text-white focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>
              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-[#131C2E] hover:bg-[#1E293B] text-gray-300 font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded-xl shadow-lg"
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
};
