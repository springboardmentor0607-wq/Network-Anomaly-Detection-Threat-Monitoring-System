import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import Badge from '../../components/common/Badge';

const TeamManagementPage = () => {
  const [teams, setTeams] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);

  useEffect(() => {
    api.get('/users/teams').then(res => setTeams(res.data.data));
    api.get('/users/audit-logs').then(res => setAuditLogs(res.data.data));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-extrabold text-white tracking-tight">Team Management & Audit Logs</h2>
        <p className="text-xs text-slate-400">SOC Operational Squads & Security Trail</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-card rounded-2xl p-6 border border-slate-800">
          <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-wider font-mono">SOC Operational Squads</h3>
          <div className="space-y-3">
            {teams.map((t) => (
              <div key={t.id} className="flex items-center justify-between p-4 bg-slate-900/60 rounded-xl border border-slate-800">
                <div>
                  <h4 className="text-sm font-bold text-white">{t.name}</h4>
                  <span className="text-xs text-slate-400 font-mono">Lead: {t.lead} | Active Analysts: {t.members}</span>
                </div>
                <Badge variant="online">{t.status}</Badge>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card rounded-2xl p-6 border border-slate-800">
          <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-wider font-mono">Security Audit Logs</h3>
          <div className="space-y-3 max-h-96 overflow-y-auto font-mono text-xs">
            {auditLogs.map((log) => (
              <div key={log._id} className="p-3 bg-slate-900/80 rounded-xl border border-slate-800">
                <div className="flex justify-between text-cyan-400 font-bold mb-1">
                  <span>{log.action}</span>
                  <span className="text-[10px] text-slate-400">{new Date(log.createdAt).toLocaleTimeString()}</span>
                </div>
                <p className="text-slate-300 text-[11px]">{log.details}</p>
                <span className="text-[10px] text-slate-400 block mt-1">User: {log.userEmail}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamManagementPage;
