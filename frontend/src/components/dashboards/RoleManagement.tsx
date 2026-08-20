"use client";

import { useState } from "react";
import { ShieldCheck, Check, X, Shield, Lock, Users, Activity, Settings, Save, AlertCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

type Permission = "view_dashboard" | "view_alerts" | "manage_alerts" | "run_analytics" | "manage_models" | "manage_users" | "system_config";

interface RoleDef {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
  color: string;
}

const DEFAULT_ROLES: RoleDef[] = [
  {
    id: "admin",
    name: "Administrator",
    description: "Full system access including user management and system configurations.",
    permissions: ["view_dashboard", "view_alerts", "manage_alerts", "run_analytics", "manage_models", "manage_users", "system_config"],
    color: "purple",
  },
  {
    id: "analyst",
    name: "Security Analyst",
    description: "Standard access for monitoring and responding to threats.",
    permissions: ["view_dashboard", "view_alerts", "manage_alerts", "run_analytics"],
    color: "blue",
  },
  {
    id: "viewer",
    name: "Read-Only Viewer",
    description: "Restricted access to view dashboards and alerts without modification rights.",
    permissions: ["view_dashboard", "view_alerts"],
    color: "green",
  }
];

const PERMISSION_LIST: { id: Permission; label: string; icon: any; category: string }[] = [
  { id: "view_dashboard", label: "View Dashboard", icon: Activity, category: "Monitoring" },
  { id: "view_alerts", label: "View Alerts", icon: Shield, category: "Monitoring" },
  { id: "manage_alerts", label: "Manage Alerts (Resolve/Ignore)", icon: ShieldCheck, category: "Response" },
  { id: "run_analytics", label: "Run Analytics & Reports", icon: Activity, category: "Response" },
  { id: "manage_models", label: "Manage ML Models", icon: Settings, category: "System" },
  { id: "manage_users", label: "Manage Users", icon: Users, category: "System" },
  { id: "system_config", label: "System Configuration", icon: Lock, category: "System" },
];

export default function RoleManagement() {
  const { role: currentUserRole } = useAuth();
  const [roles, setRoles] = useState<RoleDef[]>(DEFAULT_ROLES);
  const [activeRole, setActiveRole] = useState<string>("analyst");
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<{msg: string, type: 'success' | 'error'} | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({msg, type});
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleTogglePermission = (roleId: string, permission: Permission) => {
    if (roleId === "admin") {
      showToast("Administrator permissions cannot be modified.", "error");
      return;
    }

    setRoles(prev => prev.map(r => {
      if (r.id === roleId) {
        const hasPerm = r.permissions.includes(permission);
        const newPerms = hasPerm 
          ? r.permissions.filter(p => p !== permission)
          : [...r.permissions, permission];
        return { ...r, permissions: newPerms };
      }
      return r;
    }));
  };

  const handleSave = () => {
    setIsSaving(true);
    // Simulate API call
    setTimeout(() => {
      setIsSaving(false);
      showToast("Role permissions updated successfully!");
    }, 1000);
  };

  if (currentUserRole !== "admin") {
    return (
      <div className="flex flex-col items-center justify-center h-[500px] text-gray-400 gap-4">
        <Shield className="w-12 h-12 text-red-500/50" />
        <h2 className="text-xl font-bold text-white">Access Denied</h2>
        <p>You do not have administrative privileges to manage roles.</p>
      </div>
    );
  }

  const selectedRole = roles.find(r => r.id === activeRole) || roles[0];

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8 animate-blur-fade-up">
      {/* Toast Notification */}
      {toastMessage && (
        <div className={`fixed top-8 right-8 px-6 py-3 rounded-lg shadow-2xl z-50 flex items-center gap-2 animate-in slide-in-from-right-10 ${
          toastMessage.type === 'error' ? 'bg-red-500/90' : 'bg-green-500/90'
        } text-white`}>
          {toastMessage.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <Check className="w-4 h-4" />}
          {toastMessage.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
            <ShieldCheck className="w-6 h-6 text-indigo-400" />
            Roles & Access Management
          </h2>
          <p className="text-gray-400 text-sm mt-1">
            Configure Role-Based Access Control (RBAC) permissions for platform security.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/20"
        >
          {isSaving ? <Activity className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {isSaving ? "Saving Changes..." : "Save Configuration"}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Role Selector */}
        <div className="lg:col-span-1 space-y-3">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Available Roles</h3>
          {roles.map((role) => (
            <button
              key={role.id}
              onClick={() => setActiveRole(role.id)}
              className={`w-full text-left p-4 rounded-xl border transition-all duration-300 ${
                activeRole === role.id 
                  ? `bg-${role.color}-900/20 border-${role.color}-500/50 shadow-[0_0_15px_rgba(0,0,0,0.2)] shadow-${role.color}-500/10` 
                  : "bg-black/20 border-white/5 hover:bg-white/5 hover:border-white/10"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={`font-bold text-${activeRole === role.id ? 'white' : 'gray-300'}`}>
                  {role.name}
                </span>
                {role.id === "admin" && <Lock className="w-3.5 h-3.5 text-gray-500" />}
              </div>
              <p className="text-xs text-gray-500 line-clamp-2">{role.description}</p>
            </button>
          ))}
        </div>

        {/* Permissions Editor */}
        <div className="lg:col-span-3 rounded-2xl liquid-glass !bg-black/40 !backdrop-blur-xl border border-white/10 p-6 flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-white/10">
            <div>
              <h3 className="text-xl font-bold text-white mb-1">
                Editing: <span className={`text-${selectedRole.color}-400`}>{selectedRole.name}</span>
              </h3>
              <p className="text-sm text-gray-400">
                Toggle individual permissions for this role below.
              </p>
            </div>
            {selectedRole.id === "admin" && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium">
                <Lock className="w-3.5 h-3.5" />
                System Role (Immutable)
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
            {["Monitoring", "Response", "System"].map((category) => (
              <div key={category} className="space-y-4">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest">{category} Permissions</h4>
                <div className="space-y-3">
                  {PERMISSION_LIST.filter(p => p.category === category).map((perm) => {
                    const isGranted = selectedRole.permissions.includes(perm.id);
                    const isDisabled = selectedRole.id === "admin";
                    
                    return (
                      <div 
                        key={perm.id}
                        className={`flex items-center justify-between p-3 rounded-xl border ${
                          isGranted ? 'bg-green-500/5 border-green-500/20' : 'bg-white/5 border-white/5'
                        } transition-colors`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${isGranted ? 'bg-green-500/10' : 'bg-gray-800'}`}>
                            <perm.icon className={`w-4 h-4 ${isGranted ? 'text-green-400' : 'text-gray-500'}`} />
                          </div>
                          <span className={`text-sm font-medium ${isGranted ? 'text-gray-200' : 'text-gray-500'}`}>
                            {perm.label}
                          </span>
                        </div>
                        
                        <button
                          onClick={() => handleTogglePermission(selectedRole.id, perm.id)}
                          disabled={isDisabled}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            isDisabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
                          } ${isGranted ? 'bg-green-500' : 'bg-gray-700'}`}
                        >
                          <span className="sr-only">Toggle {perm.label}</span>
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              isGranted ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
