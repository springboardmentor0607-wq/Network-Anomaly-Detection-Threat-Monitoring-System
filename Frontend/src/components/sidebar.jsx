import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Network, 
  AlertTriangle, 
  Gauge, 
  Users, 
  Monitor, 
  Settings,
  ShieldAlert
} from 'lucide-react';

const Sidebar = () => {
  const { user } = useAuth();
  const location = useLocation();

  const rawRole = user?.role?.toLowerCase() || 'analyst';
  const isAdmin = rawRole.includes('admin');

  let displayRole = 'Analyst';
  if (isAdmin) {
    displayRole = rawRole.includes('lead') ? 'Admin (Lead)' : 'Admin';
  }

  const isActive = (path) => location.pathname === path;
  
  const navItemClass = (path) => 
    `flex items-center gap-2.5 px-3 py-1.5 rounded-md transition-all text-[13px] font-medium ${
      isActive(path)
        ? 'bg-white/10 text-white shadow-sm'
        : 'text-[#9A9A97] hover:bg-white/[0.04] hover:text-[#F2F2F0]'
    }`;

  return (
    <div className="w-64 bg-[#0A0A0B]/95 backdrop-blur-xl border-r border-white/[0.07] h-screen p-3 flex flex-col font-sans">
      
      <div className="mb-6 mt-2 px-3 font-semibold text-[15px] tracking-tight text-[#F2F2F0] flex items-center gap-2.5">
        <ShieldAlert className="text-white" size={20} />
        NetShield AI
      </div>

      <div className="text-[11px] text-[#6B6B66] font-semibold mb-2 mt-4 px-3 uppercase tracking-wider">
        Core Modules
      </div>
      <nav className="flex flex-col gap-0.5 mb-4">
        <Link to="/dashboard" className={navItemClass('/dashboard')}>
          <LayoutDashboard size={16} strokeWidth={2.5} />
          <span>Overview</span>
        </Link>
        <Link to="/dashboard/traffic" className={navItemClass('/dashboard/traffic')}>
          <Network size={16} strokeWidth={2.5} />
          <span>Network Traffic</span>
        </Link>
        
        <Link to="/performance" className={navItemClass('/performance')}>
          <Gauge size={16} strokeWidth={2.5} />
          <span>Model Performance</span>
        </Link>
      </nav>

      <div className="text-[11px] text-[#6B6B66] font-semibold mb-2 mt-4 px-3 uppercase tracking-wider">
        Security Ops
      </div>
      <nav className="flex flex-col gap-0.5 mb-4">
        <Link to="/dashboard/alerts" className={navItemClass('/dashboard/alerts')}>
          <AlertTriangle size={16} strokeWidth={2.5} />
          <span>Incident Alerts</span>
        </Link>
      </nav>

      {isAdmin && (
        <>
          <div className="text-[11px] text-[#6B6B66] font-semibold mb-2 mt-4 px-3 uppercase tracking-wider">
            Administration
          </div>
          <nav className="flex flex-col gap-0.5">
            <Link to="/dashboard/team" className={navItemClass('/dashboard/team')}>
              <Users size={16} strokeWidth={2.5} />
              <span>Team Management</span>
            </Link>
            <Link to="/dashboard/devices" className={navItemClass('/dashboard/devices')}>
              <Monitor size={16} strokeWidth={2.5} />
              <span>Devices Monitor</span>
            </Link>
            <Link to="/dashboard/settings" className={navItemClass('/dashboard/settings')}>
              <Settings size={16} strokeWidth={2.5} />
              <span>System Settings</span>
            </Link>
          </nav>
        </>
      )}

      <div className="mt-auto pt-3 pb-1 border-t border-white/[0.07]">
        <div className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-white/[0.04] transition-colors cursor-pointer">
          <div className="w-7 h-7 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-[11px] font-bold text-white uppercase">
            {user?.username?.charAt(0) || 'U'}
          </div>
          <div className="flex-1 overflow-hidden">
            <div className="text-[13px] font-medium text-white truncate capitalize">{user?.username || 'Analyst'}</div>
            <div className="text-[11px] text-[#9A9A97] truncate">{displayRole}</div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default Sidebar;