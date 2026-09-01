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
  Network,
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

  const navItems = [
    { label: 'Overview', path: '/', icon: <LayoutDashboard className="w-5 h-5" /> },
    { label: 'Live Monitor', path: '/monitoring', icon: <Radio className="w-5 h-5" /> },
    { label: 'Network Topology', path: '/topology', icon: <Network className="w-5 h-5" /> },
    { label: 'Traffic Analytics', path: '/traffic', icon: <Activity className="w-5 h-5" /> },
    { label: 'Anomalies', path: '/anomalies', icon: <AlertTriangle className="w-5 h-5" /> },
    { label: 'Intrusion Prediction', path: '/prediction', icon: <Zap className="w-5 h-5" /> },
    { label: 'Threat Vectors', path: '/threats', icon: <Target className="w-5 h-5" /> },
    { label: 'Alerts Queue', path: '/alerts', icon: <Bell className="w-5 h-5" /> },
    { label: 'Incidents Board', path: '/incidents', icon: <FolderLock className="w-5 h-5" /> },
    { label: 'Threat Intel', path: '/intelligence', icon: <Globe className="w-5 h-5" /> },
    { label: 'Analytics', path: '/analytics', icon: <BarChart3 className="w-5 h-5" /> },
    { label: 'Model Registry', path: '/models', icon: <BrainCircuit className="w-5 h-5" /> },
    { label: 'Datasets', path: '/datasets', icon: <Database className="w-5 h-5" /> },
    { label: 'Reports', path: '/reports', icon: <FileSpreadsheet className="w-5 h-5" /> },
  ];

  const adminItems = [
    { label: 'User Management', path: '/admin/users', icon: <Users className="w-5 h-5" /> },
    { label: 'Audit Logs', path: '/admin/audit-logs', icon: <ClipboardList className="w-5 h-5" /> },
    { label: 'Settings', path: '/settings', icon: <SettingsIcon className="w-5 h-5" /> },
  ];

  return (
    <aside
      className={`bg-gradient-to-b from-[#0F1629] to-[#0A0E27] border-r border-[#1A2540] flex flex-col justify-between transition-all duration-300 z-30 ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Top Header Logo */}
      <div>
        <div className="h-16 flex items-center justify-between px-4 border-b border-[#1A2540]">
          <div className="flex items-center space-x-3 overflow-hidden">
            <div className="p-2.5 bg-gradient-to-br from-sky-500/20 to-indigo-500/10 border border-sky-500/40 rounded-lg text-sky-400 shrink-0 shadow-md">
              <Shield className="w-6 h-6" />
            </div>
            {!collapsed && (
              <div>
                <span className="font-bold text-base text-white tracking-tight">NetShield AI</span>
                <span className="block text-[10px] text-sky-400 font-semibold uppercase tracking-wider">Security Platform</span>
              </div>
            )}
          </div>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 text-gray-400 hover:text-sky-400 rounded-lg hover:bg-sky-500/10 transition"
          >
            {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>
        </div>

        {/* Navigation List */}
        <nav className="p-3 space-y-6 overflow-y-auto max-h-[calc(100vh-140px)]">
          <div className="space-y-1">
            {!collapsed && <p className="px-3 text-[10px] font-bold text-gray-600 uppercase tracking-wider mb-2">Core SOC</p>}
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                    isActive
                      ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30 font-semibold shadow-sm-glow'
                      : 'text-gray-400 hover:text-gray-200 hover:bg-[#151D35]'
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
            {!collapsed && <p className="px-3 text-[10px] font-bold text-gray-600 uppercase tracking-wider mb-2">Administration</p>}
            {adminItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                    isActive
                      ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30 font-semibold shadow-sm-glow'
                      : 'text-gray-400 hover:text-gray-200 hover:bg-[#151D35]'
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
              className="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium text-purple-400 hover:bg-purple-500/10 transition"
              title={collapsed ? 'Public Landing Page' : undefined}
            >
              <ExternalLink className="w-5 h-5 shrink-0" />
              {!collapsed && <span className="truncate">Public Landing</span>}
            </NavLink>
          </div>
        </nav>
      </div>

      {/* Bottom User Info & Logout */}
      <div className="p-3 border-t border-[#1A2540] bg-[#0A0E27]">
        {!collapsed ? (
          <div className="flex items-center justify-between">
            <div className="overflow-hidden space-y-0.5">
              <p className="text-xs font-semibold text-white truncate">{user?.full_name || 'SOC Operator'}</p>
              <span className="inline-block px-2 py-0.5 text-[10px] font-bold bg-sky-500/20 text-sky-400 border border-sky-500/30 rounded">
                {user?.role?.name || 'ADMINISTRATOR'}
              </span>
            </div>
            <button
              onClick={logout}
              className="p-2 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <button
            onClick={logout}
            className="w-full flex justify-center p-2 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition"
            title="Logout"
          >
            <LogOut className="w-5 h-5" />
          </button>
        )}
      </div>
    </aside>
  );
};
