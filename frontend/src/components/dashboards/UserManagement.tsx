"use client";

import { useState, useEffect } from "react";
import { Users, Shield, Trash2, User, RefreshCw, Activity, AlertCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface UserModel {
  id: string;
  email: string;
  role: string;
  created_at: string | null;
}

export default function UserManagement() {
  const { role: currentUserRole } = useAuth();
  const [users, setUsers] = useState<UserModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<{msg: string, type: 'success' | 'error'} | null>(null);

  const fetchUsers = async () => {
    try {
      const res = await fetch("http://localhost:8000/api/users");
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (err) {
      console.error("Failed to fetch users", err);
      showToast("Failed to fetch users from server.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({msg, type});
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleRoleChange = async (userId: string, currentRole: string) => {
    const newRole = currentRole === "admin" ? "analyst" : "admin";
    try {
      const res = await fetch(`http://localhost:8000/api/users/${userId}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole })
      });
      if (res.ok) {
        setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
        showToast(`User role updated to ${newRole}`);
      } else {
        const errData = await res.json();
        showToast(errData.detail || "Failed to update role", "error");
      }
    } catch (error) {
      showToast("Network error updating role", "error");
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm("Are you sure you want to delete this user? This action cannot be undone.")) return;
    
    try {
      const res = await fetch(`http://localhost:8000/api/users/${userId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setUsers(users.filter(u => u.id !== userId));
        showToast("User successfully deleted");
      } else {
        const errData = await res.json();
        showToast(errData.detail || "Failed to delete user", "error");
      }
    } catch (error) {
      showToast("Network error deleting user", "error");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[500px] text-gray-400">
        <RefreshCw className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  // Security measure just in case component renders for non-admin
  if (currentUserRole !== "admin") {
    return (
      <div className="flex flex-col items-center justify-center h-[500px] text-gray-400 gap-4">
        <Shield className="w-12 h-12 text-red-500/50" />
        <h2 className="text-xl font-bold text-white">Access Denied</h2>
        <p>You do not have administrative privileges to view this page.</p>
      </div>
    );
  }

  const admins = users.filter(u => u.role === "admin");
  const analysts = users.filter(u => u.role === "analyst");

  const renderUserTable = (title: string, userList: UserModel[]) => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-white px-3 py-1 border-l-4 border-purple-500 bg-gradient-to-r from-purple-900/20 to-transparent">{title}</h3>
      <div className="rounded-2xl liquid-glass !bg-black/40 !backdrop-blur-xl border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead>
              <tr className="text-xs text-gray-400 font-normal border-b border-white/10 bg-white/5">
                <th className="px-6 py-4">User Details</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Created At</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {userList.length > 0 ? userList.map((user) => (
                <tr key={user.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl liquid-glass flex items-center justify-center border border-white/10 ${
                        user.role === 'admin' ? 'bg-purple-900/20' : 'bg-blue-900/20'
                      }`}>
                        {user.role === 'admin' ? (
                          <Shield className="w-5 h-5 text-purple-400" />
                        ) : (
                          <User className="w-5 h-5 text-blue-400" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-white text-sm">{user.email}</p>
                        <p className="text-xs text-gray-500 font-mono mt-0.5">ID: {user.id.substring(0,8)}...</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${
                      user.role === "admin" 
                        ? "bg-purple-500/20 text-purple-400 border-purple-500/40" 
                        : "bg-blue-500/20 text-blue-400 border-blue-500/40"
                    }`}>
                      {user.role.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-400 text-xs">
                    {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => handleRoleChange(user.id, user.role)}
                        className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-medium rounded-md transition-colors"
                      >
                        {user.role === 'admin' ? 'Demote to Analyst' : 'Promote to Admin'}
                      </button>
                      <button 
                        onClick={() => handleDeleteUser(user.id)}
                        className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors"
                        title="Delete User"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                    No users found in this category.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8 animate-blur-fade-up">
      {/* Toast Notification */}
      {toastMessage && (
        <div className={`fixed top-8 right-8 px-6 py-3 rounded-lg shadow-2xl z-50 flex items-center gap-2 animate-in slide-in-from-right-10 ${
          toastMessage.type === 'error' ? 'bg-red-500/90' : 'bg-green-500/90'
        } text-white`}>
          {toastMessage.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <Activity className="w-4 h-4" />}
          {toastMessage.msg}
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
            <Users className="w-6 h-6 text-purple-400" />
            User Management
          </h2>
          <p className="text-gray-400 text-sm mt-1">
            Manage platform access, role-based permissions, and analyst accounts.
          </p>
        </div>
        <button
          onClick={() => {
            setLoading(true);
            fetchUsers();
          }}
          className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-lg transition-colors text-sm font-medium"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh List
        </button>
      </div>

      <div className="space-y-12">
        {renderUserTable("Administrators", admins)}
        {renderUserTable("Analysts", analysts)}
      </div>
    </div>
  );
}
