import React, { useEffect, useState } from 'react';
import API from '../services/api';
import { ShieldAlert, Filter, Download, Search } from 'lucide-react';

const ThreatReports = () => {
  const [threats, setThreats] = useState([]);
  const [severityFilter, setSeverityFilter] = useState('All');
  const [search, setSearch] = useState('');

  const fetchThreats = () => {
    API.get('/threats', {
      params: { severity: severityFilter, search: search }
    }).then(res => setThreats(res.data.items || [])).catch(console.error);
  };

  useEffect(() => {
    fetchThreats();
  }, [severityFilter]);

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-rose-500" /> Threat Reports
          </h1>
          <p className="text-sm text-slate-400">View and analyze detected security threats in the network.</p>
        </div>
        <a 
          href="http://localhost:8000/api/threats/export" 
          className="flex items-center gap-2 bg-[#00f0ff] hover:bg-cyan-400 text-[#070b14] px-4 py-2 rounded-xl font-bold text-sm transition"
        >
          <Download className="w-4 h-4" /> Export CSV
        </a>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap gap-4 bg-[#0d1527] border border-[#1b2a4a] p-4 rounded-xl">
        <div className="flex items-center gap-2 bg-[#070b14] border border-[#1b2a4a] px-3 py-2 rounded-lg flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-500" />
          <input 
            type="text" 
            placeholder="Search IP or Threat Type..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchThreats()}
            className="bg-transparent text-xs text-white outline-none w-full"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select 
            value={severityFilter} 
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="bg-[#070b14] border border-[#1b2a4a] text-xs text-white px-3 py-2 rounded-lg"
          >
            <option value="All">All Severity</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>
      </div>

      {/* Threats Table */}
      <div className="bg-[#0d1527] border border-[#1b2a4a] rounded-2xl overflow-hidden">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-[#111936] text-slate-400 border-b border-[#1b2a4a]">
              <th className="p-3">#</th>
              <th>Timestamp</th>
              <th>Source IP</th>
              <th>Destination IP</th>
              <th>Threat Type</th>
              <th>Severity</th>
              <th>Risk Score</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1b2a4a]">
            {threats.map((t, idx) => (
              <tr key={t.id} className="hover:bg-[#131f38] text-slate-300">
                <td className="p-3 font-semibold">{idx + 1}</td>
                <td>{t.timestamp}</td>
                <td className="font-mono text-cyan-400">{t.source_ip}</td>
                <td className="font-mono">{t.destination_ip}</td>
                <td className="font-semibold text-white">{t.threat_type}</td>
                <td>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    t.severity === 'Critical' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                    t.severity === 'High' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                    'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                  }`}>
                    {t.severity}
                  </span>
                </td>
                <td className="font-bold">{t.risk_score} / 100</td>
                <td>
                  <span className={`px-2 py-0.5 rounded text-[10px] ${
                    t.status === 'Blocked' ? 'bg-rose-500/10 text-rose-400' : 'bg-emerald-500/10 text-emerald-400'
                  }`}>
                    {t.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ThreatReports;