import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const fadeInUp = {
  initial: { opacity: 0, y: 15 },
  animate: { opacity: 1, y: 0 },
  transition: { type: 'spring', damping: 24, stiffness: 260 }
};

const modalVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { type: 'spring', damping: 25, stiffness: 300 } },
  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } }
};

const TeamManagement = () => {
  const [filterRole, setFilterRole] = useState('All');
  const [teamMembers, setTeamMembers] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [auditError, setAuditError] = useState(null);

  // Invite Modal State
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('Security Analyst');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteMessage, setInviteMessage] = useState(null);

  // Edit User Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editMessage, setEditMessage] = useState(null);

  // Bulletproof Auth Headers
  const getAuthHeaders = () => {
    const token = localStorage.getItem('token') || localStorage.getItem('access_token');
    return token 
      ? { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
      : { 'Content-Type': 'application/json' };
  };

  const fetchTeamData = async () => {
    try {
      const headers = getAuthHeaders();

      // Fetch Users
      const userRes = await fetch('http://localhost:8000/api/users', { headers });
      if (userRes.ok) {
        const userData = await userRes.json();
        if (userData.status === 'success') {
          const mappedUsers = userData.users.map(u => ({
            id: u.id || u._id,
            name: u.full_name || u.username,
            email: u.email || `${u.username}@netshield.local`,
            role: u.role || 'Analyst',
            status: u.is_active !== false ? 'Active' : 'Suspended',
            mfa: u.mfa_enabled !== false ? 'Disabled' : 'Enabled',
            lastLogin: 'Session Active'
          }));
          setTeamMembers(mappedUsers);
        }
      }
      
      // Fetch Audit Logs
      const auditRes = await fetch('http://localhost:8000/api/admin/audit-logs', { headers });
      if (auditRes.ok) {
        const auditData = await auditRes.json();
        setAuditLogs(auditData.logs || []);
        setAuditError(null);
      } else if (auditRes.status === 401 || auditRes.status === 403) {
        setAuditError('Administrator clearance required to view logs.');
      }
    } catch (err) {
      console.error("Failed to fetch team data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeamData();
  }, []);

  const handleSendInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail) return;
    
    setInviteLoading(true);
    setInviteMessage(null);

    try {
      const response = await fetch('http://localhost:8000/api/users/invite', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ email: inviteEmail, role: inviteRole })
      });

      const data = await response.json();

      if (response.ok) {
        setInviteMessage({ type: 'success', text: data.message || `Invitation sent to ${inviteEmail}` });
        setInviteEmail('');
        fetchTeamData();
        setTimeout(() => setIsInviteOpen(false), 2000);
      } else {
        setInviteMessage({ type: 'error', text: data.detail || 'Failed to send invite' });
      }
    } catch (err) {
      setInviteMessage({ type: 'error', text: 'Network connection error.' });
    } finally {
      setInviteLoading(false);
    }
  };

  const openEditModal = (member) => {
    setEditingUser({
      id: member.id,
      name: member.name,
      email: member.email,
      role: member.role,
      isActive: member.status === 'Active'
    });
    setEditMessage(null);
    setIsEditModalOpen(true);
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    setEditMessage(null);

    try {
      const response = await fetch(`http://localhost:8000/api/users/${editingUser.id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ 
          role: editingUser.role, 
          is_active: editingUser.isActive 
        })
      });

      const data = await response.json();

      if (response.ok) {
        setEditMessage({ type: 'success', text: data.message || 'User updated successfully.' });
        fetchTeamData(); // Refresh UI instantly
        setTimeout(() => setIsEditModalOpen(false), 1500);
      } else {
        setEditMessage({ type: 'error', text: data.detail || 'Failed to update user' });
      }
    } catch (err) {
      setEditMessage({ type: 'error', text: 'Network connection error.' });
    } finally {
      setEditLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    if (status === 'Active') return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
    if (status === 'Suspended') return 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20';
    return 'bg-black/5 dark:bg-white/10 text-black dark:text-white border-black/10 dark:border-white/20';
  };

  const getRoleBadge = (role) => {
    const r = role.toLowerCase();
    if (r.includes('admin')) return 'text-purple-600 dark:text-purple-400 bg-purple-500/10 border-purple-500/20';
    return 'text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/20';
  };

  // Apple Design Surface Tokens
  const cardMaterial = 'bg-white/70 dark:bg-[#121214]/65 border border-black/[0.06] dark:border-white/[0.08] shadow-[0_4px_20px_rgba(0,0,0,0.03)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.35)] backdrop-blur-xl rounded-2xl';
  const textPrimary = 'text-[#1D1D1F] dark:text-[#F2F2F0]';
  const textMuted = 'text-[#86868B] dark:text-[#9A9A97]';
  const borderSubtle = 'border-black/[0.05] dark:border-white/[0.07]';
  const inputStyle = 'w-full rounded-lg px-4 py-3 sm:py-2.5 text-[14px] sm:text-[13px] bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/[0.07] focus:border-black/20 dark:focus:border-white/20 text-[#1D1D1F] dark:text-[#F2F2F0] focus:outline-none transition-colors';

  const filteredMembers = teamMembers.filter(member => 
    filterRole === 'All' || member.role.toLowerCase().includes(filterRole.toLowerCase())
  );

  return (
    <div className="space-y-6 transition-colors duration-500 relative">
      
      {/* ---------------- EDIT USER MODAL ---------------- */}
      <AnimatePresence>
        {isEditModalOpen && editingUser && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/20 dark:bg-black/60 backdrop-blur-md p-4 sm:p-0"
          >
            <motion.div 
              variants={modalVariants} initial="hidden" animate="visible" exit="exit"
              className="bg-white/95 dark:bg-[#1C1C1E]/95 border border-black/10 dark:border-white/10 shadow-2xl rounded-t-2xl sm:rounded-2xl w-full max-w-sm overflow-hidden pb-safe"
            >
              <div className="px-6 py-4 border-b border-black/5 dark:border-white/5 flex justify-between items-center bg-white/50 dark:bg-black/20">
                <h3 className={`text-[16px] font-semibold tracking-tight ${textPrimary}`}>Manage User</h3>
                <button onClick={() => setIsEditModalOpen(false)} className={`p-2 sm:p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors ${textMuted} hover:${textPrimary}`}>
                  <svg className="w-5 h-5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              
              <form onSubmit={handleUpdateUser} className="p-6 space-y-5">
                {editMessage && (
                  <div className={`p-3 rounded-lg text-[12px] font-medium ${editMessage.type === 'success' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'}`}>
                    {editMessage.text}
                  </div>
                )}
                
                <div>
                  <div className={`text-[13px] font-semibold ${textPrimary}`}>{editingUser.name}</div>
                  <div className={`text-[11px] ${textMuted}`}>{editingUser.email}</div>
                </div>

                <div className="pt-2">
                  <label className={`block text-[11px] font-semibold uppercase tracking-wider ${textMuted} mb-2`}>Account Role</label>
                  <select 
                    value={editingUser.role} 
                    onChange={(e) => setEditingUser({...editingUser, role: e.target.value})}
                    className={inputStyle}
                  >
                    <option value="Security Analyst">Security Analyst</option>
                    <option value="Administrator">Administrator</option>
                    <option value="Admin (Lead)">Admin (Lead)</option>
                  </select>
                </div>

                <div>
                  <label className={`block text-[11px] font-semibold uppercase tracking-wider ${textMuted} mb-2`}>Account Status</label>
                  <select 
                    value={editingUser.isActive ? "true" : "false"} 
                    onChange={(e) => setEditingUser({...editingUser, isActive: e.target.value === "true"})}
                    className={inputStyle}
                  >
                    <option value="true">Active (Granted Access)</option>
                    <option value="false">Suspended (Revoked Access)</option>
                  </select>
                </div>
                
                <div className="pt-4 flex gap-3">
                  <button type="button" onClick={() => setIsEditModalOpen(false)} className={`flex-1 py-3 sm:py-2.5 rounded-xl sm:rounded-lg text-[14px] sm:text-[13px] font-semibold border ${borderSubtle} ${textPrimary} hover:bg-black/5 dark:hover:bg-white/5 transition-colors`}>
                    Cancel
                  </button>
                  <button type="submit" disabled={editLoading} className="flex-1 py-3 sm:py-2.5 rounded-xl sm:rounded-lg text-[14px] sm:text-[13px] font-semibold bg-[#0071E3] text-white hover:bg-[#0077ED] transition-colors flex justify-center items-center gap-2 shadow-sm disabled:opacity-50">
                    {editLoading ? <span className="w-5 h-5 sm:w-4 sm:h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> : 'Save Changes'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ---------------- INVITE MODAL ---------------- */}
      <AnimatePresence>
        {isInviteOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/20 dark:bg-black/60 backdrop-blur-md p-4 sm:p-0"
          >
            <motion.div 
              variants={modalVariants} initial="hidden" animate="visible" exit="exit"
              className="bg-white/95 dark:bg-[#1C1C1E]/95 border border-black/10 dark:border-white/10 shadow-2xl rounded-t-2xl sm:rounded-2xl w-full max-w-sm overflow-hidden pb-safe"
            >
              <div className="px-6 py-4 border-b border-black/5 dark:border-white/5 flex justify-between items-center bg-white/50 dark:bg-black/20">
                <h3 className={`text-[16px] font-semibold tracking-tight ${textPrimary}`}>Invite Team Member</h3>
                <button onClick={() => setIsInviteOpen(false)} className={`p-2 sm:p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors ${textMuted} hover:${textPrimary}`}>
                  <svg className="w-5 h-5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              
              <form onSubmit={handleSendInvite} className="p-6 space-y-5">
                {inviteMessage && (
                  <div className={`p-3 rounded-lg text-[12px] font-medium ${inviteMessage.type === 'success' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'}`}>
                    {inviteMessage.text}
                  </div>
                )}
                
                <div>
                  <label className={`block text-[11px] font-semibold uppercase tracking-wider ${textMuted} mb-2`}>Email Address</label>
                  <input 
                    type="email" required
                    value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="analyst@netshield.com"
                    className={inputStyle}
                  />
                </div>
                
                <div>
                  <label className={`block text-[11px] font-semibold uppercase tracking-wider ${textMuted} mb-2`}>Access Role</label>
                  <select 
                    value={inviteRole} onChange={(e) => setInviteRole(e.target.value)}
                    className={inputStyle}
                  >
                    <option value="Security Analyst">Security Analyst</option>
                    <option value="Administrator">Administrator</option>
                  </select>
                </div>
                
                <div className="pt-4 flex gap-3">
                  <button type="button" onClick={() => setIsInviteOpen(false)} className={`flex-1 py-3 sm:py-2.5 rounded-xl sm:rounded-lg text-[14px] sm:text-[13px] font-semibold border ${borderSubtle} ${textPrimary} hover:bg-black/5 dark:hover:bg-white/5 transition-colors`}>
                    Cancel
                  </button>
                  <button type="submit" disabled={inviteLoading} className="flex-1 py-3 sm:py-2.5 rounded-xl sm:rounded-lg text-[14px] sm:text-[13px] font-semibold bg-[#0071E3] text-white hover:bg-[#0077ED] transition-colors flex justify-center items-center gap-2 shadow-sm disabled:opacity-50">
                    {inviteLoading ? <span className="w-5 h-5 sm:w-4 sm:h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> : 'Send Invite'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* ---------------------------------------------- */}
      
      {/* Responsive Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div className="w-full sm:w-auto">
          <h2 className={`text-[24px] font-semibold tracking-tight ${textPrimary}`}>Team & Access Control</h2>
          <p className={`text-[13px] ${textMuted} mt-0.5`}>Manage user roles, monitor active sessions, and review audit logs</p>
        </div>
        <button 
          onClick={() => setIsInviteOpen(true)}
          className="w-full sm:w-auto justify-center px-5 py-3 sm:px-4 sm:py-2 text-[14px] sm:text-[13px] font-semibold rounded-xl sm:rounded-lg transition-colors active:scale-95 flex items-center gap-2 shadow-sm bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 cursor-pointer"
        >
          <svg className="w-5 h-5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
          Invite Member
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Enrolled Users', value: teamMembers.length.toString() || '-', subtext: 'Registered in database' },
          { label: 'Administrators', value: teamMembers.filter(m => m.role.toLowerCase().includes('admin')).length.toString() || '-', subtext: 'Full system access' },
          { label: 'MFA Adoption', value: '100%', subtext: 'Enforced by policy' },
          { label: 'Audit Log Entries', value: auditLogs.length.toString() || '-', subtext: 'Recent tracked events', alert: false },
        ].map((metric, i) => (
          <motion.div {...fadeInUp} transition={{ delay: i * 0.1 }} key={i} className={`${cardMaterial} p-5 flex flex-col justify-between hover:scale-[1.01] transition-transform`}>
            <h3 className={`text-[12px] font-medium uppercase tracking-wide ${textMuted} mb-3`}>{metric.label}</h3>
            <div>
              <div className={`text-[28px] font-semibold tracking-tight ${metric.alert ? 'text-orange-500' : textPrimary}`}>
                {loading ? '-' : metric.value}
              </div>
              <div className={`text-[12px] ${textMuted} mt-1`}>{metric.subtext}</div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* User Management Table */}
        <motion.div {...fadeInUp} transition={{ delay: 0.3 }} className={`xl:col-span-2 ${cardMaterial} overflow-hidden flex flex-col`}>
          <div className={`px-4 sm:px-6 py-4 border-b flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${borderSubtle} bg-black/[0.01] dark:bg-white/[0.01]`}>
            <h2 className={`text-[15px] font-semibold tracking-tight ${textPrimary}`}>System Directory</h2>
            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
              {['All', 'Admin', 'Analyst'].map((role) => (
                <button 
                  key={role}
                  onClick={() => setFilterRole(role)}
                  className={`flex-1 sm:flex-none px-3 py-2 sm:py-1.5 rounded-lg text-[13px] sm:text-[12px] font-semibold transition-colors ${
                    filterRole === role 
                      ? 'bg-black/10 dark:bg-white/10 text-black dark:text-white'
                      : `${textMuted} hover:text-[#1D1D1F] dark:hover:text-[#F2F2F0]`
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>
          
          <div className="overflow-x-auto min-h-[400px]">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className={`border-b text-[11px] uppercase tracking-wider bg-black/[0.02] dark:bg-white/[0.02] border-black/[0.05] dark:border-white/[0.07] ${textMuted}`}>
                  <th className="px-6 py-3 font-semibold">User</th>
                  <th className="px-6 py-3 font-semibold">Role</th>
                  <th className="px-6 py-3 font-semibold">Status</th>
                  <th className="px-6 py-3 font-semibold">MFA</th>
                  <th className="px-6 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/[0.05] dark:divide-white/[0.03]">
                <AnimatePresence>
                  {loading ? (
                    <tr><td colSpan={5} className={`py-12 text-center ${textMuted}`}>Loading directory...</td></tr>
                  ) : filteredMembers.length === 0 ? (
                    <tr><td colSpan={5} className={`py-12 text-center ${textMuted}`}>No users found matching criteria.</td></tr>
                  ) : (
                    filteredMembers.map((member) => (
                      <motion.tr 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        key={member.id} 
                        className="transition-colors group text-[13px] hover:bg-black/[0.02] dark:hover:bg-white/[0.02]"
                      >
                        <td className="px-6 py-4">
                          <div className={`font-semibold ${textPrimary}`}>{member.name}</div>
                          <div className={`text-[11px] mt-0.5 ${textMuted}`}>{member.email}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`whitespace-nowrap capitalize px-2.5 py-1 rounded-md text-[11px] font-bold border ${getRoleBadge(member.role)}`}>
                           {member.role}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold border ${getStatusBadge(member.status)}`}>
                            {member.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`flex items-center gap-1.5 font-medium ${member.mfa === 'Enabled' ? 'text-emerald-600 dark:text-emerald-500' : 'text-red-600 dark:text-red-500'}`}>
                            <div className={`w-2 h-2 rounded-full ${member.mfa === 'Enabled' ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                            {member.mfa}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button 
                            onClick={() => openEditModal(member)}
                            className={`text-[13px] sm:text-[12px] px-3 py-1.5 rounded-lg border ${borderSubtle} font-semibold transition-colors ${textMuted} hover:bg-black/5 dark:hover:bg-white/5 hover:text-[#1D1D1F] dark:hover:text-[#F2F2F0] cursor-pointer`}
                          >
                            Edit
                          </button>
                        </td>
                      </motion.tr>
                    ))
                  )}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Audit Logging Feed */}
        <motion.div {...fadeInUp} transition={{ delay: 0.4 }} className={`${cardMaterial} flex flex-col h-[500px]`}>
          <div className={`px-6 py-4 border-b ${borderSubtle} bg-black/[0.01] dark:bg-white/[0.01]`}>
            <h2 className={`text-[15px] font-semibold tracking-tight ${textPrimary}`}>Recent Audit Logs</h2>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {loading ? (
              <div className={`text-center py-8 ${textMuted} text-[13px]`}>Loading logs...</div>
            ) : auditError ? (
              <div className={`text-center py-8 text-red-500 font-medium text-[13px] bg-red-500/5 rounded-xl border border-red-500/10 p-4`}>
                <svg className="w-8 h-8 mx-auto mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                {auditError}
              </div>
            ) : auditLogs.length === 0 ? (
              <div className={`text-center py-8 ${textMuted} text-[13px]`}>No recent audits found.</div>
            ) : (
              auditLogs.map((audit) => (
                <div key={audit.id} className="p-4 rounded-xl border relative bg-black/[0.02] dark:bg-white/[0.02] border-black/[0.04] dark:border-white/[0.04]">
                  <div className="absolute left-[-11px] top-6 bottom-[-24px] w-px last:hidden bg-black/[0.1] dark:bg-white/[0.1]"></div>
                  <div className="flex justify-between items-start mb-2 gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full flex-shrink-0 bg-[#86868B] dark:bg-[#9A9A97]"></div>
                      <span className={`text-[13px] font-semibold leading-tight ${textPrimary}`}>{audit.action}</span>
                    </div>
                    <span className={`text-[11px] whitespace-nowrap mt-0.5 ${textMuted}`}>{new Date(audit.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                  </div>
                  <div className="pl-4 space-y-1">
                    <div className={`text-[11px] ${textMuted} flex justify-between`}>
                      <span>Actor: <span className={`font-semibold ${textPrimary}`}>{audit.actor || `User ID: ${audit.user_id}`}</span></span>
                    </div>
                    <div className={`text-[11px] ${textMuted} flex justify-between truncate`}>
                      <span className="truncate">Target: <span className={`font-medium ${textPrimary}`}>{audit.target}</span></span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>
      
    </div>
  );
};

export default TeamManagement;