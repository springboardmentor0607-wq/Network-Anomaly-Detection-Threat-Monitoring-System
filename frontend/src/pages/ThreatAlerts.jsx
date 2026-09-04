import React, { useEffect, useState } from 'react';
import { socAPI } from '../services/api';
import { ShieldAlert, Search, Filter, RefreshCw, AlertTriangle } from 'lucide-react';

export default function ThreatAlerts() {
  const [alerts, setAlerts] = useState([]);
  const [stats, setStats] = useState({});
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [severity, setSeverity] = useState('All');
  const [status, setStatus] = useState('All');

  const fetchAlerts = async () => {
    try {
      const res = await socAPI.getAlerts({ severity, status, search, page, limit: 10 });
      setAlerts(res.data.alerts);
      setStats(res.data.stats);
      setTotal(res.data.total);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [page, severity, status, search]);

  const escalateToIncident = async (alert) => {
    try {
      await socAPI.createIncident({
        title: `Security Escalation: ${alert.attack_type} on ${alert.source_ip}`,
        severity: alert.severity,
        priority: alert.severity === 'CRITICAL' ? 'P1 - Urgent' : 'P2 - High',
        alert_id: alert.id,
        analyst: 'SOC Lead'
      });
      alert('Alert successfully escalated to Incident Ticket.');
    } catch (err) {
      alert('Escalation failed: ' + err.message);
    }
  };

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <ShieldAlert className="w-6 h-6 text-[#00f0ff]" /> Correlated Threat Alerts & Prioritization
        </h1>
        <p className="text-sm text-slate-400">5-minute sliding window alert correlation grouped by Source IP and Attack Vector.</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Correlated', val: stats.total || 0, color: 'text-white' },
          { label: 'Critical Severity', val: stats.critical || 0, color: 'text-rose-400' },
          { label: 'High Severity', val: stats.high || 0, color: 'text-amber-400' },
          { label: 'Unresolved Threats', val: stats.unresolved || 0, color: 'text-[#00f0ff]' },
        ].map((c, i) => (
          <div key={i} className="bg-[#0d1527] border border-[#1b2a4a] p-4 rounded-xl">
            <span className="text-xs text-slate-400 font-semibold">{c.label}</span>
            <div className={`text-2xl font-bold mt-1 ${c.color}`}>{c.val}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-4 bg-[#0d1527] border border-[#1b2a4a] p-4 rounded-xl items-center justify-between">
        <div className="flex items-center gap-2 bg-[#070b14] border border-[#1b2a4a] px-3 py-2 rounded-lg flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search by IP or attack vector..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent text-xs text-white outline-none w-full"
          />
        </div>

        <div className="flex gap-3">
          <select value={severity} onChange={(e) => setSeverity(e.target.value)} className="bg-[#070b14] border border-[#1b2a4a] text-xs text-slate-300 p-2 rounded-lg outline-none">
            <option value="All">All Severities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>

          <select value={status} onChange={(e) => setStatus(e.target.value)} className="bg-[#070b14] border border-[#1b2a4a] text-xs text-slate-300 p-2 rounded-lg outline-none">
            <option value="All">All Statuses</option>
            <option value="OPEN">Open</option>
            <option value="RESOLVED">Resolved</option>
          </select>
        </div>
      </div>

      <div className="bg-[#0d1527] border border-[#1b2a4a] rounded-2xl overflow-hidden">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-[#111936] text-slate-400 border-b border-[#1b2a4a]">
              <th className="p-4">Source IP</th>
              <th>Attack Type</th>
              <th>Severity</th>
              <th>Risk Score</th>
              <th>Occurrences</th>
              <th>Last Seen</th>
              <th>Status</th>
              <th className="text-right p-4">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1b2a4a]">
            {alerts.map((a) => (
              <tr key={a.id} className="hover:bg-[#131f38] text-slate-300">
                <td className="p-4 font-mono font-bold text-[#00f0ff]">{a.source_ip}</td>
                <td className="font-semibold text-white">{a.attack_type}</td>
                <td>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    a.severity === 'CRITICAL' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-amber-500/20 text-amber-400'
                  }`}>
                    {a.severity}
                  </span>
                </td>
                <td className="font-bold">{a.risk_score} / 100</td>
                <td className="font-bold">{a.occurrences}</td>
                <td>{a.last_seen}</td>
                <td><span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded">{a.status}</span></td>
                <td className="text-right p-4">
                  <button onClick={() => escalateToIncident(a)} className="bg-rose-600 hover:bg-rose-500 text-white px-2.5 py-1 rounded-md text-[11px] font-bold transition">
                    Escalate
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
