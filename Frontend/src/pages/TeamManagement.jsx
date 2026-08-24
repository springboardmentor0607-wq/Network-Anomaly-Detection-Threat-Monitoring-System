import React, { useState } from 'react';

const TeamManagement = () => {
  const [filterRole, setFilterRole] = useState('All');

  // Mock data for team members and RBAC
  const teamMembers = [
    { id: 'usr_01', name: 'Ankit Singh', email: 'ankit@netshield.com', role: 'Administrator', status: 'Active', mfa: 'Enabled', lastLogin: '2 mins ago' },
    { id: 'usr_02', name: 'Sarah Jenkins', email: 'sarah.j@netshield.com', role: 'Security Analyst', status: 'Active', mfa: 'Enabled', lastLogin: '1 hour ago' },
    { id: 'usr_03', name: 'Marcus Vance', email: 'marcus.v@netshield.com', role: 'Security Analyst', status: 'Invited', mfa: 'Pending', lastLogin: 'Never' },
    { id: 'usr_04', name: 'Elena Rodriguez', email: 'elena.r@netshield.com', role: 'Administrator', status: 'Suspended', mfa: 'Disabled', lastLogin: '14 days ago' },
    { id: 'usr_05', name: 'James Chen', email: 'james.c@netshield.com', role: 'Security Analyst', status: 'Active', mfa: 'Enabled', lastLogin: '3 hours ago' },
  ];

  const recentAudits = [
    { id: 'aud_192', action: 'Failed Login Attempt', actor: 'Unknown', target: 'elena.r@netshield.com', time: '10 mins ago', ip: '45.22.19.11' },
    { id: 'aud_191', action: 'Policy Updated (Firewall)', actor: 'Ankit Singh', target: 'System', time: '1 hour ago', ip: '192.168.1.104' },
    { id: 'aud_190', action: 'User Suspended', actor: 'Ankit Singh', target: 'Elena Rodriguez', time: '14 days ago', ip: '192.168.1.104' },
  ];

  const getStatusBadge = (status) => {
    if (status === 'Active') return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    if (status === 'Invited') return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
    if (status === 'Suspended') return 'bg-red-500/10 text-red-400 border-red-500/20';
    return 'bg-white/10 text-white border-white/20';
  };

  const getRoleBadge = (role) => {
    if (role === 'Administrator') return 'text-purple-400 bg-purple-500/10 border-purple-500/20';
    return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-[18px] font-semibold text-[#F2F2F0]">Team & Access Control</h2>
          <p className="text-[13px] text-[#9A9A97]">Manage user roles, monitor active sessions, and review audit logs</p>
        </div>
        <button className="px-4 py-2 bg-white text-[#0A0A0B] hover:bg-[#E5E5E2] text-[13px] font-medium rounded-lg transition-colors flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
          Invite Member
        </button>
      </div>

      {/* Access Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Users', value: '5', subtext: '3 Active, 1 Suspended' },
          { label: 'Administrators', value: '2', subtext: 'Full system access' },
          { label: 'MFA Adoption', value: '75%', subtext: '3 of 4 active users' },
          { label: 'Failed Logins (24h)', value: '14', subtext: 'From 3 unique IPs', alert: true },
        ].map((metric, i) => (
          <div key={i} className="bg-[#0A0A0B]/60 backdrop-blur-sm border border-white/[0.07] rounded-xl p-5 flex flex-col justify-between">
            <h3 className="text-[13px] font-medium text-[#9A9A97] mb-3">{metric.label}</h3>
            <div>
              <div className={`text-[24px] font-semibold tracking-tight ${metric.alert ? 'text-orange-400' : 'text-[#F2F2F0]'}`}>
                {metric.value}
              </div>
              <div className="text-[12px] text-[#9A9A97] mt-1">{metric.subtext}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* User Management Table (Takes 2 columns) */}
        <div className="lg:col-span-2 bg-[#0A0A0B]/60 backdrop-blur-sm border border-white/[0.07] rounded-xl overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-white/[0.07] flex justify-between items-center bg-white/[0.01]">
            <h2 className="text-[15px] font-medium">Directory</h2>
            <div className="flex gap-2">
              {['All', 'Administrator', 'Security Analyst'].map((role) => (
                <button 
                  key={role}
                  onClick={() => setFilterRole(role)}
                  className={`px-3 py-1.5 rounded-md text-[11px] font-medium transition-colors ${
                    filterRole === role 
                      ? 'bg-white/[0.1] text-white border border-white/[0.15]' 
                      : 'bg-transparent text-[#9A9A97] border border-transparent hover:text-[#D6D6D3]'
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>
          
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/[0.02] border-b border-white/[0.07] text-[#9A9A97] text-[11px] uppercase tracking-wider">
                  <th className="px-6 py-3 font-semibold">User</th>
                  <th className="px-6 py-3 font-semibold">Role</th>
                  <th className="px-6 py-3 font-semibold">Status</th>
                  <th className="px-6 py-3 font-semibold">MFA</th>
                  <th className="px-6 py-3 font-semibold">Last Login</th>
                  <th className="px-6 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.03]">
                {teamMembers
                  .filter(member => filterRole === 'All' || member.role === filterRole)
                  .map((member) => (
                  <tr key={member.id} className="hover:bg-white/[0.02] transition-colors group text-[13px]">
                    <td className="px-6 py-4">
                      <div className="font-medium text-[#F2F2F0]">{member.name}</div>
                      <div className="text-[11px] text-[#9A9A97] mt-0.5">{member.email}</div>
                    </td>
                    <td className="px-6 py-4">
                    <span className={`whitespace-nowrap px-2.5 py-1 rounded-md text-[11px] font-medium border ${getRoleBadge(member.role)}`}>
                     {member.role}
                    </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-md text-[11px] font-semibold border ${getStatusBadge(member.status)}`}>
                        {member.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`flex items-center gap-1.5 ${member.mfa === 'Enabled' ? 'text-emerald-400' : member.mfa === 'Pending' ? 'text-yellow-400' : 'text-red-400'}`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${member.mfa === 'Enabled' ? 'bg-emerald-400' : member.mfa === 'Pending' ? 'bg-yellow-400' : 'bg-red-400'}`}></div>
                        {member.mfa}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-[#9A9A97]">{member.lastLogin}</td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-[12px] text-[#9A9A97] hover:text-white font-medium transition-colors">
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Audit Logging Mini-Feed */}
        <div className="bg-[#0A0A0B]/60 backdrop-blur-sm border border-white/[0.07] rounded-xl flex flex-col h-[500px]">
          <div className="px-6 py-4 border-b border-white/[0.07] bg-white/[0.01]">
            <h2 className="text-[15px] font-medium">Recent Audit Logs</h2>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {recentAudits.map((audit) => (
              <div key={audit.id} className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.04] relative">
                {/* Vertical connecting line for timeline effect */}
                <div className="absolute left-[-11px] top-6 bottom-[-24px] w-px bg-white/[0.05] last:hidden"></div>
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#9A9A97]"></div>
                    <span className="text-[13px] font-medium text-[#F2F2F0]">{audit.action}</span>
                  </div>
                  <span className="text-[11px] text-[#9A9A97]">{audit.time}</span>
                </div>
                <div className="pl-4 space-y-1">
                  <div className="text-[11px] text-[#9A9A97] flex justify-between">
                    <span>Actor: <span className="text-[#D6D6D3] font-medium">{audit.actor}</span></span>
                  </div>
                  <div className="text-[11px] text-[#9A9A97] flex justify-between">
                    <span>Target: <span className="text-[#D6D6D3]">{audit.target}</span></span>
                  </div>
                  <div className="text-[11px] text-[#9A9A97] font-mono mt-1 pt-1 border-t border-white/[0.04]">
                    IP: {audit.ip}
                  </div>
                </div>
              </div>
            ))}
            <button className="w-full py-2 mt-2 text-[12px] text-[#9A9A97] hover:text-white border border-white/[0.07] rounded-lg transition-colors">
              View All Logs
            </button>
          </div>
        </div>
      </div>
      
    </div>
  );
};

export default TeamManagement;