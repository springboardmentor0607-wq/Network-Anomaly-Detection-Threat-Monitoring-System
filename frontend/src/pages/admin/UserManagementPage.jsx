import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import Toast from '../../components/common/Toast';
import { UserPlusIcon, TrashIcon, LockClosedIcon, PencilSquareIcon } from '@heroicons/react/24/outline';

const UserManagementPage = () => {
  const [users, setUsers] = useState([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: 'Password123!', role: 'analyst' });
  const [toast, setToast] = useState(null);

  const fetchUsers = () => {
    api.get('/users').then(res => setUsers(res.data.data));
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      await api.post('/users', newUser);
      setToast({ message: 'User created successfully', type: 'success' });
      setIsCreateModalOpen(false);
      fetchUsers();
    } catch (err) {
      setToast({ message: 'Failed to create user', type: 'error' });
    }
  };

  const handleBlockUser = async (id, currentStatus) => {
    const nextStatus = currentStatus === 'blocked' ? 'active' : 'blocked';
    try {
      await api.put(`/users/${id}`, { status: nextStatus });
      setToast({ message: `User status changed to ${nextStatus}`, type: 'success' });
      fetchUsers();
    } catch (e) {
      setToast({ message: 'Failed to update user status', type: 'error' });
    }
  };

  const handleDeleteUser = async (id) => {
    try {
      await api.delete(`/users/${id}`);
      setToast({ message: 'User removed', type: 'success' });
      fetchUsers();
    } catch (e) {
      setToast({ message: 'Failed to delete user', type: 'error' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-tight">User Management Subsystem</h2>
          <p className="text-xs text-slate-400">RBAC User Accounts, Password Resets & Permissions</p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-black font-extrabold rounded-xl text-xs uppercase flex items-center space-x-2 shadow-glow-cyan"
        >
          <UserPlusIcon className="w-4 h-4 stroke-2" />
          <span>Create User</span>
        </button>
      </div>

      <div className="glass-card rounded-2xl p-6 border border-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase">
                <th className="py-3 px-3">Name</th>
                <th className="py-3 px-3">Email</th>
                <th className="py-3 px-3">Role</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {users.map((u) => (
                <tr key={u._id} className="hover:bg-slate-800/40">
                  <td className="py-3.5 px-3 text-white font-bold">{u.name}</td>
                  <td className="py-3.5 px-3 text-cyan-300">{u.email}</td>
                  <td className="py-3.5 px-3"><Badge variant="info">{u.role.toUpperCase()}</Badge></td>
                  <td className="py-3.5 px-3"><Badge variant={u.status === 'active' ? 'online' : 'critical'}>{u.status}</Badge></td>
                  <td className="py-3.5 px-3 flex items-center space-x-2">
                    <button
                      onClick={() => handleBlockUser(u._id, u.status)}
                      className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700"
                      title="Toggle Block/Unblock"
                    >
                      <LockClosedIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteUser(u._id)}
                      className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-rose-400 border border-slate-700"
                      title="Delete User"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Create New SOC User">
        <form onSubmit={handleCreateUser} className="space-y-4 text-xs font-mono">
          <div>
            <label className="block text-slate-300 mb-1">Full Name</label>
            <input
              type="text"
              required
              value={newUser.name}
              onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
              className="w-full p-2 bg-slate-900 border border-slate-700 rounded-xl text-white"
            />
          </div>
          <div>
            <label className="block text-slate-300 mb-1">Email</label>
            <input
              type="email"
              required
              value={newUser.email}
              onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
              className="w-full p-2 bg-slate-900 border border-slate-700 rounded-xl text-white"
            />
          </div>
          <div>
            <label className="block text-slate-300 mb-1">Role</label>
            <select
              value={newUser.role}
              onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
              className="w-full p-2 bg-slate-900 border border-slate-700 rounded-xl text-white"
            >
              <option value="analyst">Security Analyst</option>
              <option value="admin">Administrator</option>
            </select>
          </div>
          <button type="submit" className="w-full py-2.5 bg-cyan-500 text-black font-bold uppercase rounded-xl">
            Create User Account
          </button>
        </form>
      </Modal>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default UserManagementPage;
