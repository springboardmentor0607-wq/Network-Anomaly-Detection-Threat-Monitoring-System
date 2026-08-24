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

  // Fallback to 'analyst' if user is missing
  // Roles supported: 'analyst', 'soc', 'administrator'
  const userRole = user?.role || 'analyst';

  // Helper function to dynamically style the active tab
  const isActive = (path) => location.pathname === path;
  const navItemClass = (path) => 
    `flex items-center gap-3 p-2.5 rounded-lg transition-all text-sm font-medium ${
      isActive(path)
        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
        : 'text-slate-300 hover:bg-white/10 hover:text-white border border-transparent'
    }`;

  return (
    <div className="w-64 bg-[#0A0A0B] border-r border-slate-800/80 h-screen p-4 flex flex-col font-sans">
      
      {/* Brand Header */}
      <div className="mb-8 font-bold text-xl text-white flex items-center gap-2">
        <ShieldAlert className="text-emerald-500" size={24} />
        NetShield AI
      </div>

      {/* STANDARD MODULES */}
      <div className="text-xs text-slate-500 font-bold mb-3 uppercase tracking-wider">
        Core Modules
      </div>
      <nav className="flex flex-col gap-1.5 mb-8">
        <Link to="/dashboard" className={navItemClass('/dashboard')}>
          <LayoutDashboard size={18} />
          <span>Overview</span>
        </Link>
        <Link to="/dashboard/traffic" className={navItemClass('/dashboard/traffic')}>
          <Network size={18} />
          <span>Network Traffic</span>
        </Link>
        
        {/* NEW: Model Performance Metric Page (Section 8) */}
        <Link to="/performance" className={navItemClass('/performance')}>
          <Gauge size={18} />
          <span>Model Performance</span>
        </Link>
      </nav>

      {/* SOC & INCIDENT MANAGEMENT */}
      <div className="text-xs text-slate-500 font-bold mb-3 uppercase tracking-wider">
        Security Ops
      </div>
      <nav className="flex flex-col gap-1.5 mb-8">
        <Link to="/dashboard/alerts" className={navItemClass('/dashboard/alerts')}>
          <AlertTriangle size={18} />
          <span>Incident Alerts</span>
        </Link>
      </nav>

      {/* ADMINISTRATION MODULES (Visible ONLY to Administrators) */}
      {userRole === 'administrator' && (
        <>
          <div className="text-xs text-slate-500 font-bold mb-3 uppercase tracking-wider">
            Administration
          </div>
          <nav className="flex flex-col gap-1.5">
            <Link to="/dashboard/team" className={navItemClass('/dashboard/team')}>
              <Users size={18} />
              <span>Team Management</span>
            </Link>
            <Link to="/dashboard/devices" className={navItemClass('/dashboard/devices')}>
              <Monitor size={18} />
              <span>Devices Monitor</span>
            </Link>
            <Link to="/dashboard/settings" className={navItemClass('/dashboard/settings')}>
              <Settings size={18} />
              <span>System Settings</span>
            </Link>
          </nav>
        </>
      )}

      {/* User Profile / Logout Anchor at Bottom */}
      <div className="mt-auto pt-4 border-t border-slate-800">
        <div className="flex items-center gap-3 px-2">
          <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-sm font-bold text-emerald-500 uppercase">
            {user?.username?.charAt(0) || 'U'}
          </div>
          <div>
            <div className="text-sm font-bold text-white capitalize">{user?.username || 'Analyst'}</div>
            <div className="text-xs text-slate-500 capitalize">{userRole}</div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default Sidebar;