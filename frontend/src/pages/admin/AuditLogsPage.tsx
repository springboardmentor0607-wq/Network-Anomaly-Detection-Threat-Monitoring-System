import React, { useState } from 'react';
import { Card } from '../../components/common/Card';
import { ClipboardList, Search, Shield, Filter, ArrowDownToLine } from 'lucide-react';

interface AuditRecord {
  id: string;
  timestamp: string;
  userEmail: string;
  role: string;
  action: string;
  resource: string;
  result: 'SUCCESS' | 'FAILURE' | 'WARNING';
  ipAddress: string;
  details: string;
}

export const AuditLogsPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [logs] = useState<AuditRecord[]>([
    {
      id: 'aud-1092',
      timestamp: '2026-08-10T09:45:12Z',
      userEmail: 'admin@netshield.ai',
      role: 'ADMINISTRATOR',
      action: 'MODEL_ACTIVATED',
      resource: 'AI Model: mdl-xgb-01 (XGBoost v2.4.1)',
      result: 'SUCCESS',
      ipAddress: '192.168.1.15',
      details: 'Switched active inference model from IsolationForest to XGBoost Classifier.',
    },
    {
      id: 'aud-1091',
      timestamp: '2026-08-10T09:30:00Z',
      userEmail: 'soc.lead@netshield.ai',
      role: 'SOC_ANALYST',
      action: 'INCIDENT_RESOLVED',
      resource: 'Incident: INC-2026-0891',
      result: 'SUCCESS',
      ipAddress: '192.168.1.42',
      details: 'Status changed from INVESTIGATING to CONTAINED. Resolution notes updated.',
    },
    {
      id: 'aud-1090',
      timestamp: '2026-08-10T08:15:04Z',
      userEmail: 'system@netshield.ai',
      role: 'SYSTEM',
      action: 'ALERT_ESCALATED',
      resource: 'Alert: ALT-8921 (DDoS SYN Flood)',
      result: 'SUCCESS',
      ipAddress: '127.0.0.1',
      details: 'Automatic escalation triggered due to Risk Score 96 exceeding threshold 80.',
    },
    {
      id: 'aud-1089',
      timestamp: '2026-08-10T08:00:10Z',
      userEmail: 'admin@netshield.ai',
      role: 'ADMINISTRATOR',
      action: 'USER_ROLE_UPDATED',
      resource: 'User: viewer@netshield.ai',
      result: 'SUCCESS',
      ipAddress: '192.168.1.15',
      details: 'Assigned role SECURITY_ANALYST to user.',
    },
    {
      id: 'aud-1088',
      timestamp: '2026-08-10T07:45:00Z',
      userEmail: 'admin@netshield.ai',
      role: 'ADMINISTRATOR',
      action: 'SETTINGS_MODIFIED',
      resource: 'System Settings',
      result: 'SUCCESS',
      ipAddress: '192.168.1.15',
      details: 'Updated critical alert risk score threshold from 85 to 80.',
    },
  ]);

  const filteredLogs = logs.filter(
    (l) =>
      l.userEmail.toLowerCase().includes(search.toLowerCase()) ||
      l.action.toLowerCase().includes(search.toLowerCase()) ||
      l.resource.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">System Audit & Compliance Logs</h2>
          <p className="text-xs text-gray-400">Immutable forensic audit trail of all operator actions, model changes, and settings updates.</p>
        </div>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="p-4 border-b border-[#1F2937] bg-[#111827] flex items-center justify-between">
          <div className="relative max-w-xs">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter audit logs..."
              className="w-full bg-[#131C2E] border border-[#1F2937] rounded-xl pl-9 pr-4 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#1F2937] bg-[#111827] text-gray-400 font-bold uppercase">
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Target Resource</th>
                <th className="py-3 px-4">Result</th>
                <th className="py-3 px-4">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1F2937] text-gray-200">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-[#131C2E]">
                  <td className="py-3 px-4 text-gray-400 font-mono">{new Date(log.timestamp).toLocaleString()}</td>
                  <td className="py-3 px-4 font-semibold text-white">{log.userEmail}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 bg-[#131C2E] border border-[#1F2937] text-cyan-300 font-bold rounded text-[10px]">
                      {log.action}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-300 max-w-xs truncate">{log.resource}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 bg-emerald-950 text-emerald-400 border border-emerald-500/40 rounded text-[10px] font-bold">
                      {log.result}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono text-gray-400">{log.ipAddress}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
