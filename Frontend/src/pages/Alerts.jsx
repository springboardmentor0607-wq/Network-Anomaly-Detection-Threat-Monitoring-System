import React, { useState } from 'react';

const Alerts = () => {
  const [activeTab, setActiveTab] = useState('New');

  // Mock data for real-time threat alerts
  const alertsList = [
    { id: 'ALT-9402', time: '18:27:10', type: 'Volumetric DDoS', source: 'Multiple IPs', target: 'Web Gateway', severity: 'Critical', status: 'New', assignee: 'Unassigned' },
    { id: 'ALT-9401', time: '18:15:45', type: 'Privilege Escalation', source: '10.0.3.12', target: 'Active Directory', severity: 'Critical', status: 'Investigating', assignee: 'Ankit S.' },
    { id: 'ALT-9400', time: '17:42:09', type: 'Brute Force Login', source: '45.12.99.1', target: 'Admin Portal', severity: 'High', status: 'New', assignee: 'Unassigned' },
    { id: 'ALT-9399', time: '16:20:11', type: 'Malware Signature', source: 'Email Gateway', target: 'User Workstation 14', severity: 'High', status: 'Resolved', assignee: 'System (Auto)' },
    { id: 'ALT-9398', time: '14:05:33', type: 'Unusual Port Traffic', source: '192.168.1.55', target: 'External Unknown', severity: 'Medium', status: 'Investigating', assignee: 'Sarah J.' },
    { id: 'ALT-9397', time: '11:10:00', type: 'Failed SSH Auth', source: '104.22.15.2', target: 'DB Server 02', severity: 'Low', status: 'New', assignee: 'Unassigned' },
  ];

  const getSeverityBadge = (severity) => {
    switch (severity) {
      case 'Critical': return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'High': return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
      case 'Medium': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      case 'Low': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      default: return 'bg-white/10 text-white border-white/20';
    }
  };

  const getStatusIndicator = (status) => {
    if (status === 'New') return <span className="flex h-2 w-2 rounded-full bg-red-500 animate-pulse"></span>;
    if (status === 'Investigating') return <span className="flex h-2 w-2 rounded-full bg-yellow-500"></span>;
    if (status === 'Resolved') return <span className="flex h-2 w-2 rounded-full bg-emerald-500"></span>;
    return null;
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-[18px] font-semibold text-[#F2F2F0]">Incident Alert Queue</h2>
          <p className="text-[13px] text-[#9A9A97]">Real-time threat alerts and incident prioritization</p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.07] text-[#D6D6D3] text-[13px] font-medium rounded-lg transition-colors">
            Export Logs
          </button>
          <button className="px-4 py-2 bg-white text-[#0A0A0B] hover:bg-[#E5E5E2] text-[13px] font-medium rounded-lg transition-colors flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            Acknowledge All
          </button>
        </div>
      </div>

      {/* SOC Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Unassigned Critical Alerts', value: '2', subtext: 'Immediate action required', alert: true },
          { label: 'Active Incidents', value: '14', subtext: 'Currently under investigation', alert: false },
          { label: 'MTTA (Last 24h)', value: '4m 12s', subtext: 'Mean Time to Acknowledge', alert: false },
          { label: 'Auto-Remediated', value: '86%', subtext: 'Threats blocked by AI policies', alert: false },
        ].map((metric, i) => (
          <div key={i} className="bg-[#0A0A0B]/60 backdrop-blur-sm border border-white/[0.07] rounded-xl p-5 flex flex-col justify-between">
            <h3 className="text-[13px] font-medium text-[#9A9A97] mb-3">{metric.label}</h3>
            <div>
              <div className={`text-[24px] font-semibold tracking-tight ${metric.alert ? 'text-red-400' : 'text-[#F2F2F0]'}`}>
                {metric.value}
              </div>
              <div className="text-[12px] text-[#9A9A97] mt-1">{metric.subtext}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Alert Queue */}
      <div className="bg-[#0A0A0B]/60 backdrop-blur-sm border border-white/[0.07] rounded-xl overflow-hidden flex flex-col">
        
        {/* Triage Tabs & Filters */}
        <div className="px-6 py-4 border-b border-white/[0.07] flex justify-between items-center bg-white/[0.01]">
          <div className="flex gap-6 border-b border-white/[0.07]">
            {['New', 'Investigating', 'Resolved', 'All Alerts'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-3 text-[13px] font-medium transition-colors relative ${
                  activeTab === tab ? 'text-white' : 'text-[#9A9A97] hover:text-[#D6D6D3]'
                }`}
              >
                {tab}
                {tab === 'New' && <span className="ml-2 bg-red-500/20 text-red-400 py-0.5 px-2 rounded-full text-[10px]">3</span>}
                {activeTab === tab && (
                  <div className="absolute bottom-0 left-0 w-full h-0.5 bg-white rounded-t-full"></div>
                )}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-[#9A9A97]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            <span className="text-[12px] text-[#9A9A97]">Filter by Severity</span>
          </div>
        </div>

        {/* Alerts Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/[0.02] border-b border-white/[0.07] text-[#9A9A97] text-[11px] uppercase tracking-wider">
                <th className="px-6 py-3 font-semibold w-8"></th>
                <th className="px-6 py-3 font-semibold">Alert ID</th>
                <th className="px-6 py-3 font-semibold">Time</th>
                <th className="px-6 py-3 font-semibold">Severity</th>
                <th className="px-6 py-3 font-semibold">Threat Description</th>
                <th className="px-6 py-3 font-semibold">Target Asset</th>
                <th className="px-6 py-3 font-semibold">Assignee</th>
                <th className="px-6 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.03]">
              {alertsList
                .filter(alert => activeTab === 'All Alerts' || alert.status === activeTab)
                .map((alert) => (
                <tr key={alert.id} className={`hover:bg-white/[0.02] transition-colors group text-[13px] ${alert.status === 'New' ? 'bg-red-500/[0.02]' : ''}`}>
                  <td className="px-6 py-4">
                    {getStatusIndicator(alert.status)}
                  </td>
                  <td className="px-6 py-4 font-mono text-[#9A9A97] text-[12px]">{alert.id}</td>
                  <td className="px-6 py-4 text-[#9A9A97]">{alert.time}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-md text-[11px] font-semibold border ${getSeverityBadge(alert.severity)}`}>
                      {alert.severity}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-[#F2F2F0]">{alert.type}</div>
                    <div className="text-[11px] text-[#9A9A97] font-mono mt-0.5">SRC: {alert.source}</div>
                  </td>
                  <td className="px-6 py-4 text-[#D6D6D3]">{alert.target}</td>
                  <td className="px-6 py-4">
                    <span className={`flex items-center gap-2 ${alert.assignee === 'Unassigned' ? 'text-orange-400/80 italic' : 'text-[#9A9A97]'}`}>
                      {alert.assignee !== 'Unassigned' && alert.assignee !== 'System (Auto)' && (
                        <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[9px] font-bold text-white">
                          {alert.assignee.split(' ')[0][0]}{alert.assignee.split(' ')[1][0]}
                        </div>
                      )}
                      {alert.assignee}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right space-x-3">
                    {alert.status === 'New' && (
                      <button className="text-[12px] text-emerald-400 hover:text-emerald-300 font-medium transition-colors">
                        Triage
                      </button>
                    )}
                    {alert.status === 'Investigating' && (
                      <button className="text-[12px] text-blue-400 hover:text-blue-300 font-medium transition-colors">
                        Resolve
                      </button>
                    )}
                    <button className="text-[12px] text-[#9A9A97] hover:text-white font-medium transition-colors">
                      Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {alertsList.filter(a => activeTab === 'All Alerts' || a.status === activeTab).length === 0 && (
            <div className="py-12 text-center flex flex-col items-center justify-center">
              <svg className="w-8 h-8 text-[#9A9A97] mb-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-[14px] text-[#9A9A97] font-medium">No alerts found in this view.</p>
              <p className="text-[12px] text-[#9A9A97] opacity-70 mt-1">Queue is clear.</p>
            </div>
          )}
        </div>
      </div>
      
    </div>
  );
};

export default Alerts;