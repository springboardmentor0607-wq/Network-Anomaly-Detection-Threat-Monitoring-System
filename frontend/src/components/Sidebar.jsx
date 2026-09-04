import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  ShieldAlert, LayoutDashboard, Activity, Cpu, 
  Layers, Terminal, Eye, FileText, 
  Settings, LogOut, Globe, BarChart2
} from 'lucide-react';

const Sidebar = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('netshield_token');
    localStorage.removeItem('netshield_user');
    navigate('/login');
  };

  const navItems = [
    { label: 'MAIN', isHeader: true },
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/network-status', label: 'Network Status', icon: Activity },
    { to: '/ai-management', label: 'AI Management', icon: Cpu },
    { to: '/model-management', label: 'Model Management', icon: Layers },
    { to: '/model-training', label: 'Model Training', icon: Terminal },
    { to: '/test-model', label: 'Test Model', icon: Terminal },
    { to: '/anomaly-detection', label: 'Anomaly Detection', icon: Eye },
    { label: 'MILESTONE 3 SOC', isHeader: true },
    { to: '/threat-alerts', label: 'Threat Alerts', icon: ShieldAlert },
    { to: '/incidents', label: 'Incidents', icon: Layers },
    { to: '/threat-intelligence', label: 'Threat Intelligence', icon: Globe },
    { to: '/ai-threat-detection', label: 'AI Threat Detection', icon: Cpu },
    { to: '/security-analytics', label: 'Security Analytics', icon: BarChart2 },
    { label: 'REPORTS', isHeader: true },
    { to: '/reports', label: 'Reports', icon: FileText },
    { to: '/threat-reports', label: 'Threat Reports', icon: FileText },
    { label: 'SYSTEM', isHeader: true },
    { to: '/system-monitoring', label: 'System Monitoring', icon: Activity },
    { to: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-[#0d1527] border-r border-[#1b2a4a] min-h-screen flex flex-col justify-between p-4">
      <div>
        <div className="flex items-center gap-3 px-3 py-4 border-b border-[#1b2a4a] mb-6">
          <div className="p-2 bg-cyan-500/10 rounded-lg border border-cyan-500/30">
            <ShieldAlert className="w-7 h-7 text-[#00f0ff]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-wide">NetShield <span className="text-[#00f0ff]">AI</span></h1>
            <span className="text-xs text-slate-400">SOC Operations</span>
          </div>
        </div>

        <nav className="space-y-1">
          {navItems.map((item, idx) => {
            if (item.isHeader) {
              return (
                <div key={idx} className="text-[11px] font-semibold text-slate-500 px-3 pt-4 pb-1 uppercase tracking-wider">
                  {item.label}
                </div>
              );
            }
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive 
                      ? 'bg-blue-600/20 text-[#00f0ff] border border-blue-500/40 shadow-lg shadow-cyan-950/40' 
                      : 'text-slate-400 hover:text-slate-200 hover:bg-[#131f38]'
                  }`
                }
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      <div className="pt-4 border-t border-[#1b2a4a]">
        <button 
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
