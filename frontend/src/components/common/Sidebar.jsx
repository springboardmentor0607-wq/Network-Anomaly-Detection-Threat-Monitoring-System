import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  ShieldCheckIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  CpuChipIcon,
  DocumentTextIcon,
  UserIcon,
  UsersIcon,
  Cog6ToothIcon,
  ServerIcon,
  FolderIcon,
  SignalIcon,
  SparklesIcon,
  ShieldExclamationIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline';

const Sidebar = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const analystNav = [
    { name: 'Dashboard', path: '/analyst/dashboard', icon: ChartBarIcon },
    { name: 'Threat Alerts', path: '/analyst/threats', icon: ExclamationTriangleIcon },
    { name: 'Incidents', path: '/analyst/incidents', icon: ShieldExclamationIcon },
    { name: 'Threat Intelligence', path: '/analyst/threat-intel', icon: GlobeAltIcon },
    { name: 'Network Traffic', path: '/analyst/traffic', icon: SignalIcon },
    { name: 'Anomaly Detection', path: '/analyst/anomaly', icon: SparklesIcon },
    { name: 'AI Threat Detection', path: '/analyst/ai-detection', icon: CpuChipIcon },
    { name: 'Security Analytics', path: '/analyst/analytics', icon: ChartBarIcon },
    { name: 'Reports', path: '/analyst/reports', icon: DocumentTextIcon },
    { name: 'Profile', path: '/analyst/profile', icon: UserIcon }
  ];

  const adminNav = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: ChartBarIcon },
    { name: 'Threat Alerts', path: '/analyst/threats', icon: ExclamationTriangleIcon },
    { name: 'Incidents', path: '/analyst/incidents', icon: ShieldExclamationIcon },
    { name: 'Threat Intelligence', path: '/analyst/threat-intel', icon: GlobeAltIcon },
    { name: 'Security Analytics', path: '/admin/analytics', icon: ChartBarIcon },
    { name: 'Network Status', path: '/admin/network', icon: SignalIcon },
    { name: 'AI Management', path: '/admin/ai-management', icon: SparklesIcon },
    { name: 'User Management', path: '/admin/users', icon: UsersIcon },
    { name: 'Team Management', path: '/admin/teams', icon: UsersIcon },
    { name: 'Threat Reports', path: '/admin/reports', icon: DocumentTextIcon },
    { name: 'System Monitoring', path: '/admin/monitoring', icon: ServerIcon },
    { name: 'Dataset Management', path: '/admin/datasets', icon: FolderIcon },
    { name: 'Settings', path: '/admin/settings', icon: Cog6ToothIcon }
  ];

  const navItems = isAdmin ? adminNav : analystNav;

  return (
    <aside className="w-64 glass-panel border-r border-slate-800/80 flex flex-col h-screen sticky top-0 z-40 select-none font-sans">
      {/* Brand Logo */}
      <div className="h-16 px-6 flex items-center space-x-3 border-b border-slate-800/80">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-400 to-blue-600 flex items-center justify-center text-black shadow-glow-cyan">
          <ShieldCheckIcon className="w-6 h-6 stroke-2" />
        </div>
        <div>
          <span className="text-base font-extrabold text-white tracking-wider block leading-none font-mono">
            NetShield<span className="text-cyan-400">.AI</span>
          </span>
          <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold font-mono">SOC Threat Engine</span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto custom-scrollbar">
        <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-widest text-slate-500 font-mono">
          {isAdmin ? 'ADMINISTRATOR MODULES' : 'ANALYST OPERATIONS'}
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-500/20 to-blue-600/10 text-cyan-300 border border-cyan-500/30 shadow-glow-cyan'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent'
                }`
              }
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Footer SOC Status */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/40 m-2 rounded-xl border border-slate-800 font-mono">
        <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
          <span>SOC Engine</span>
          <span className="text-emerald-400 font-bold">ONLINE</span>
        </div>
        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
          <div className="bg-cyan-400 h-full w-[94%] animate-pulse" />
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
