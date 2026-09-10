import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Shield,
  LayoutDashboard,
  Radio,
  Activity,
  AlertTriangle,
  Target,
  Bell,
  FolderLock,
  Globe,
  BarChart3,
  FileSpreadsheet,
  BrainCircuit,
  Users,
  ClipboardList,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Zap,
  Database,
  Settings as SettingsIcon,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (val: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed, setCollapsed }) => {
  const { user, logout } = useAuth();

  // All possible navigation items
  const allNavItems = [
    { label: 'Overview', path: '/', icon: <LayoutDashboard className="w-5 h-5" />, roles: ['ADMIN', 'SOC_MANAGER', 'SECURITY_ANALYST', 'VIEWER'] },
    { label: 'Live Monitor', path: '/monitoring', icon: <Radio className="w-5 h-5" />, roles: ['ADMIN', 'SOC_MANAGER', 'SECURITY_ANALYST'] },
    { label: 'Traffic Analytics', path: '/traffic', icon: <Activity className="w-5 h-5" />, roles: ['ADMIN', 'SOC_MANAGER', 'SECURITY_ANALYST'] },
    { label: 'Anomalies', path: '/anomalies', icon: <AlertTriangle className="w-5 h-5" />, roles: ['ADMIN', 'SOC_MANAGER', 'SECURITY_ANALYST'] },
    { label: 'Intrusion Prediction', path: '/prediction', icon: <Zap className="w-5 h-5" />, roles: ['ADMIN', 'SOC_MANAGER', 'SECURITY_ANALYST'] },
    { label: 'Threat Vectors', path: '/threats', icon: <Target className="w-5 h-5" />, roles: ['ADMIN', 'SOC_MANAGER', 'SECURITY_ANALYST', 'VIEWER'] },
    { label: 'Alerts Queue', path: '/alerts', icon: <Bell className="w-5 h-5" />, roles: ['ADMIN', 'SOC_MANAGER', 'SECURITY_ANALYST', 'VIEWER'] },
    { label: 'Incidents Board', path: '/incidents', icon: <FolderLock className="w-5 h-5" />, roles: ['ADMIN', 'SOC_MANAGER', 'SECURITY_ANALYST'] },
    { label: 'Threat Intel', path: '/intelligence', icon: <Globe className="w-5 h-5" />, roles: ['ADMIN', 'SOC_MANAGER', 'SECURITY_ANALYST'] },
    { label: 'Analytics', path: '/analytics', icon: <BarChart3 className="w-5 h-5" />, roles: ['ADMIN', 'SOC_MANAGER', 'SECURITY_ANALYST', 'VIEWER'] },
    { label: 'Model Registry', path: '/models', icon: <BrainCircuit className="w-5 h-5" />, roles: ['ADMIN', 'SOC_MANAGER'] },
    { label: 'Datasets', path: '/datasets', icon: <Database className="w-5 h-5" />, roles: ['ADMIN', 'SOC_MANAGER'] },
    { label: 'Reports', path: '/reports', icon: <FileSpreadsheet className="w-5 h-5" />, roles: ['ADMIN', 'SOC_MANAGER', 'SECURITY_ANALYST', 'VIEWER'] },
  ];

  const allAdminItems = [
    { label: 'User Management', path: '/admin/users', icon: <Users className="w-5 h-5" />, roles: ['ADMIN'] },
    { label: 'Audit Logs', path: '/admin/audit-logs', icon: <ClipboardList className="w-5 h-5" />, roles: ['ADMIN', 'SOC_MANAGER'] },
    { label: 'Settings', path: '/settings', icon: <SettingsIcon className="w-5 h-5" />, roles: ['ADMIN'] },
  ];

  // Filter items based on user role
  const userRole = user?.role?.name || 'VIEWER';
  const navItems = allNavItems.filter(item => item.roles.includes(userRole as any));
  const adminItems = allAdminItems.filter(item => item.roles.includes(userRole as any));

  return (
    <aside
      className={`bg-[#121212] border-r border-[#333333] flex flex-col justify-between transition-all duration-300 z-30 ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Top Header Logo */}
      <div>
        <div className="h-16 flex items-center justify-between px-4 border-b border-[#333333]">
          <div className="flex items-center space-x-3 overflow-hidden">
            <div className="p-2 bg-cyan-950/80 border border-cyan-500/30 rounded-lg text-cyan-400 shrink-0">
              <Shield className="w-6 h-6" />
            </div>
            {!collapsed && (
              <div>
                <span className="font-bold text-base text-white tracking-tight">NetShield AI</span>
                <span className="block text-[10px] text-cyan-400 font-semibold uppercase tracking-wider">SOC Platform</span>
              </div>
            )}
          </div>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-[#2A2A2A] transition"
          >
            {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>
        </div>

        {/* Navigation List */}
        <nav className="p-3 space-y-6 overflow-y-auto max-h-[calc(100vh-140px)]">
          <div className="space-y-1">
            {!collapsed && <p className="px-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Core SOC</p>}
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                    isActive
                      ? 'bg-cyan-950/70 text-cyan-400 border border-cyan-500/30 font-semibold'
                      : 'text-gray-400 hover:text-white hover:bg-[#2A2A2A]'
                  }`
                }
                title={collapsed ? item.label : undefined}
              >
                <span className="shrink-0">{item.icon}</span>
                {!collapsed && <span className="truncate">{item.label}</span>}
              </NavLink>
            ))}
          </div>

          <div className="space-y-1">
            {!collapsed && <p className="px-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">System Admin</p>}
            {adminItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                    isActive
                      ? 'bg-cyan-950/70 text-cyan-400 border border-cyan-500/30 font-semibold'
                      : 'text-gray-400 hover:text-white hover:bg-[#2A2A2A]'
                  }`
                }
                title={collapsed ? item.label : undefined}
              >
                <span className="shrink-0">{item.icon}</span>
                {!collapsed && <span className="truncate">{item.label}</span>}
              </NavLink>
            ))}

            <NavLink
              to="/landing"
              className="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium text-emerald-400 hover:bg-emerald-950/40 transition"
              title={collapsed ? 'Public Landing Page' : undefined}
            >
              <ExternalLink className="w-5 h-5 shrink-0" />
              {!collapsed && <span className="truncate">Public Landing</span>}
            </NavLink>
          </div>
        </nav>
      </div>

      {/* Bottom User Info & Logout */}
      <div className="p-3 border-t border-[#333333] bg-[#000000]">
        {!collapsed ? (
          <div className="flex items-center justify-between">
            <div className="overflow-hidden space-y-0.5">
              <p className="text-xs font-semibold text-white truncate">{user?.full_name || 'SOC Operator'}</p>
              <span className="inline-block px-2 py-0.5 text-[10px] font-bold bg-cyan-950 text-cyan-400 border border-cyan-500/30 rounded">
                {user?.role?.name || 'ADMINISTRATOR'}
              </span>
            </div>
            <button
              onClick={logout}
              className="p-2 text-red-400 hover:text-red-300 hover:bg-red-950/50 rounded-lg transition"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <button
            onClick={logout}
            className="w-full flex justify-center p-2 text-red-400 hover:text-red-300 hover:bg-red-950/50 rounded-lg transition"
            title="Logout"
          >
            <LogOut className="w-5 h-5" />
          </button>
        )}
      </div>
    </aside>
  );
};
