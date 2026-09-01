import React, { useState } from 'react';
import { Card } from '../../components/common/Card';
import { AlertTriangle, ShieldAlert, Filter, Search, CheckCircle, ArrowRight, FolderLock, UserCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface AlertItem {
  id: string;
  timestamp: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  sourceIp: string;
  destIp: string;
  attackType: string;
  confidence: number;
  riskScore: number;
  status: 'NEW' | 'INVESTIGATING' | 'ESCALATED' | 'RESOLVED' | 'FALSE_POSITIVE';
  assignedAnalyst: string;
}

export const AlertsPage: React.FC = () => {
  const navigate = useNavigate();
  const [filterSeverity, setFilterSeverity] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [alerts, setAlerts] = useState<AlertItem[]>([
    {
      id: 'ALT-8921',
      timestamp: '2026-08-10T09:42:15Z',
      severity: 'CRITICAL',
      sourceIp: '42.112.98.14',
      destIp: '192.168.1.100',
      attackType: 'DoS SYN Flood',
      confidence: 0.96,
      riskScore: 96,
      status: 'NEW',
      assignedAnalyst: 'Unassigned',
    },
    {
      id: 'ALT-8920',
      timestamp: '2026-08-10T09:28:00Z',
      severity: 'HIGH',
      sourceIp: '185.220.101.5',
      destIp: '192.168.1.250',
      attackType: 'SSH Brute Force',
      confidence: 0.91,
      riskScore: 84,
      status: 'INVESTIGATING',
      assignedAnalyst: 'Sarah Connor',
    },
    {
      id: 'ALT-8919',
      timestamp: '2026-08-10T08:15:20Z',
      severity: 'MEDIUM',
      sourceIp: '194.26.29.112',
      destIp: '192.168.1.44',
      attackType: 'DNS Tunneling',
      confidence: 0.85,
      riskScore: 68,
      status: 'ESCALATED',
      assignedAnalyst: 'Alex Mercer',
    },
    {
      id: 'ALT-8918',
      timestamp: '2026-08-10T07:10:00Z',
      severity: 'LOW',
      sourceIp: '103.251.140.2',
      destIp: '192.168.1.105',
      attackType: 'Port Scan',
      confidence: 0.78,
      riskScore: 32,
      status: 'RESOLVED',
      assignedAnalyst: 'Alex Mercer',
    },
  ]);

  const handleStatusChange = (id: string, newStatus: AlertItem['status']) => {
    setAlerts((prev) =>
      prev.map((alt) => (alt.id === id ? { ...alt, status: newStatus } : alt))
    );
  };

  const handleConvertToIncident = (alert: AlertItem) => {
    navigate('/incidents', { state: { alert } });
  };

  const filteredAlerts = alerts.filter((alt) => {
    if (filterSeverity !== 'ALL' && alt.severity !== filterSeverity) return false;
    if (filterStatus !== 'ALL' && alt.status !== filterStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        alt.id.toLowerCase().includes(q) ||
        alt.sourceIp.toLowerCase().includes(q) ||
        alt.attackType.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Security Alerts Triage Queue</h2>
          <p className="text-xs text-gray-400">Prioritized alert queue for real-time investigation, analyst assignment, and incident creation.</p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <Card className="p-4 border-[#1F2937]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Alert ID, Source IP, Attack Type..."
                className="w-full bg-[#131C2E] border border-[#1F2937] rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs">
            <div className="flex items-center space-x-2">
              <span className="text-gray-400 font-semibold">Severity:</span>
              <select
                value={filterSeverity}
                onChange={(e) => setFilterSeverity(e.target.value)}
                className="bg-[#131C2E] border border-[#1F2937] text-white rounded-lg px-3 py-1.5 focus:outline-none"
              >
                <option value="ALL">All Severities</option>
                <option value="CRITICAL">Critical</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-gray-400 font-semibold">Status:</span>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-[#131C2E] border border-[#1F2937] text-white rounded-lg px-3 py-1.5 focus:outline-none"
              >
                <option value="ALL">All Statuses</option>
                <option value="NEW">New</option>
                <option value="INVESTIGATING">Investigating</option>
                <option value="ESCALATED">Escalated</option>
                <option value="RESOLVED">Resolved</option>
              </select>
            </div>
          </div>
        </div>
      </Card>

      {/* Alerts Table */}
      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#1F2937] bg-[#111827] text-gray-400 font-bold uppercase">
                <th className="py-3 px-4">Alert ID</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Severity</th>
                <th className="py-3 px-4">Source IP</th>
                <th className="py-3 px-4">Target IP</th>
                <th className="py-3 px-4">Attack Vector</th>
                <th className="py-3 px-4">Risk Score</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1F2937] text-gray-200">
              {filteredAlerts.map((alt) => (
                <tr key={alt.id} className="hover:bg-[#131C2E] transition">
                  <td className="py-3 px-4 font-bold text-cyan-400">{alt.id}</td>
                  <td className="py-3 px-4 text-gray-400">{new Date(alt.timestamp).toLocaleTimeString()}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2.5 py-0.5 rounded text-[11px] font-bold ${
                        alt.severity === 'CRITICAL'
                          ? 'bg-red-950 text-red-400 border border-red-500/40'
                          : alt.severity === 'HIGH'
                          ? 'bg-amber-950 text-amber-400 border border-amber-500/40'
                          : 'bg-cyan-950 text-cyan-400 border border-cyan-500/40'
                      }`}
                    >
                      {alt.severity}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-semibold text-white">{alt.sourceIp}</td>
                  <td className="py-3 px-4 text-gray-300">{alt.destIp}</td>
                  <td className="py-3 px-4 font-medium text-white">{alt.attackType}</td>
                  <td className="py-3 px-4 font-bold text-red-400">{alt.riskScore}/100</td>
                  <td className="py-3 px-4">
                    <select
                      value={alt.status}
                      onChange={(e) => handleStatusChange(alt.id, e.target.value as any)}
                      className="bg-[#0B0F17] border border-[#1F2937] text-gray-300 rounded px-2 py-1 text-xs focus:outline-none"
                    >
                      <option value="NEW">NEW</option>
                      <option value="INVESTIGATING">INVESTIGATING</option>
                      <option value="ESCALATED">ESCALATED</option>
                      <option value="RESOLVED">RESOLVED</option>
                    </select>
                  </td>
                  <td className="py-3 px-4 text-right space-x-2">
                    <button
                      onClick={() => handleConvertToIncident(alt)}
                      className="px-3 py-1 bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-400 font-bold rounded text-xs transition inline-flex items-center space-x-1"
                    >
                      <FolderLock className="w-3.5 h-3.5" />
                      <span>Convert to Incident</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
