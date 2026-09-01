import React, { useState } from 'react';
import { Card } from '../../components/common/Card';
import { Users, UserPlus, Shield, CheckCircle, XCircle, Search, Edit2, Lock } from 'lucide-react';

interface UserRecord {
  id: string;
  fullName: string;
  email: string;
  role: 'ADMINISTRATOR' | 'SOC_ANALYST' | 'SECURITY_ANALYST' | 'VIEWER';
  status: 'ACTIVE' | 'INACTIVE';
  lastActive: string;
}

export const UsersPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState<UserRecord[]>([
    {
      id: 'usr-01',
      fullName: 'Alex Mercer',
      email: 'admin@netshield.ai',
      role: 'ADMINISTRATOR',
      status: 'ACTIVE',
      lastActive: 'Just now',
    },
    {
      id: 'usr-02',
      fullName: 'Sarah Connor',
      email: 'soc.lead@netshield.ai',
      role: 'SOC_ANALYST',
      status: 'ACTIVE',
      lastActive: '5m ago',
    },
    {
      id: 'usr-03',
      fullName: 'Marcus Vance',
      email: 'security.analyst@netshield.ai',
      role: 'SECURITY_ANALYST',
      status: 'ACTIVE',
      lastActive: '2h ago',
    },
    {
      id: 'usr-04',
      fullName: 'Auditor View',
      email: 'viewer@netshield.ai',
      role: 'VIEWER',
      status: 'INACTIVE',
      lastActive: '3d ago',
    },
  ]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [roleInput, setRoleInput] = useState<UserRecord['role']>('SECURITY_ANALYST');

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    const newU: UserRecord = {
      id: `usr-0${users.length + 1}`,
      fullName: nameInput || 'New Operator',
      email: emailInput || 'operator@netshield.ai',
      role: roleInput,
      status: 'ACTIVE',
      lastActive: 'Just created',
    };
    setUsers([...users, newU]);
    setShowAddModal(false);
  };

  const toggleStatus = (id: string) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, status: u.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' } : u))
    );
  };

  const filteredUsers = users.filter(
    (u) =>
      u.fullName.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.role.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Role-Based User Access Control</h2>
          <p className="text-xs text-gray-400">Manage SOC operators, assign central roles, and control active user permissions.</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs rounded-xl shadow transition flex items-center space-x-2"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add Operator</span>
        </button>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="p-4 border-b border-[#1F2937] bg-[#111827]">
          <div className="relative max-w-xs">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search user name or email..."
              className="w-full bg-[#131C2E] border border-[#1F2937] rounded-xl pl-9 pr-4 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#1F2937] bg-[#111827] text-gray-400 font-bold uppercase">
                <th className="py-3 px-4">Operator Name</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Assigned Role</th>
                <th className="py-3 px-4">Account Status</th>
                <th className="py-3 px-4">Last Activity</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1F2937] text-gray-200">
              {filteredUsers.map((u) => (
                <tr key={u.id} className="hover:bg-[#131C2E]">
                  <td className="py-3 px-4 font-bold text-white">{u.fullName}</td>
                  <td className="py-3 px-4 text-gray-400">{u.email}</td>
                  <td className="py-3 px-4">
                    <span className="px-2.5 py-0.5 bg-cyan-950 text-cyan-400 border border-cyan-500/30 rounded text-[10px] font-bold">
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        u.status === 'ACTIVE' ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/40' : 'bg-gray-800 text-gray-400'
                      }`}
                    >
                      {u.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-400">{u.lastActive}</td>
                  <td className="py-3 px-4 text-right space-x-2">
                    <button
                      onClick={() => toggleStatus(u.id)}
                      className="px-3 py-1 bg-[#131C2E] hover:bg-[#1E293B] border border-[#1F2937] text-gray-300 text-xs font-semibold rounded"
                    >
                      {u.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-[#0F172A] border border-[#1F2937] w-full max-w-md rounded-2xl p-6 space-y-4">
            <h3 className="text-base font-bold text-white">Add New SOC Operator</h3>
            <form onSubmit={handleAddUser} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-gray-300 mb-1">Full Name</label>
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full bg-[#131C2E] border border-[#1F2937] rounded-xl p-2.5 text-white focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>
              <div>
                <label className="block font-bold text-gray-300 mb-1">Email Address</label>
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="e.g. operator@netshield.ai"
                  className="w-full bg-[#131C2E] border border-[#1F2937] rounded-xl p-2.5 text-white focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>
              <div>
                <label className="block font-bold text-gray-300 mb-1">Role Permission</label>
                <select
                  value={roleInput}
                  onChange={(e) => setRoleInput(e.target.value as any)}
                  className="w-full bg-[#131C2E] border border-[#1F2937] rounded-xl p-2.5 text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="ADMINISTRATOR">ADMINISTRATOR</option>
                  <option value="SOC_ANALYST">SOC_ANALYST</option>
                  <option value="SECURITY_ANALYST">SECURITY_ANALYST</option>
                  <option value="VIEWER">VIEWER</option>
                </select>
              </div>
              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-[#131C2E] hover:bg-[#1E293B] text-gray-300 font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded-xl shadow"
                >
                  Add Operator
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
