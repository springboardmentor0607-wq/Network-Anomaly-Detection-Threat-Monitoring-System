"use client";

import { 
  Home, Activity, ShieldAlert, Target, Bell, 
  FileText, Network, Globe, Search, ClipboardList,
  UserCircle, Users, ShieldCheck, Cpu, Key, Database, Settings
} from "lucide-react";

export type SidebarTab = 
  | "dashboard" | "live-monitoring" | "anomaly-detection" | "threat-analysis" | "alerts"
  | "logs" | "packet-analysis" | "threat-intelligence" | "investigation" | "reports"
  | "search" | "notifications" | "profile"
  | "user-management" | "roles" | "machine-learning" | "detection-rules" | "database" | "settings";

interface CinematicSidebarProps {
  role: "admin" | "analyst";
  activeTab: SidebarTab;
  setActiveTab: (tab: SidebarTab) => void;
  onLogout: () => void;
}

export default function CinematicSidebar({ role, activeTab, setActiveTab, onLogout }: CinematicSidebarProps) {
  const analystTabs = [
    { id: "dashboard", label: "Dashboard", icon: Home },
    { id: "live-monitoring", label: "Live Monitoring", icon: Activity },
    { id: "anomaly-detection", label: "Anomaly Detection", icon: Target },
    { id: "threat-analysis", label: "Threat Analysis", icon: ShieldAlert },
    { id: "alerts", label: "Alerts", icon: Bell },
    { id: "logs", label: "Logs", icon: FileText },
    { id: "packet-analysis", label: "Packet Analysis", icon: Network },
    { id: "threat-intelligence", label: "Threat Intelligence", icon: Globe },
    { id: "investigation", label: "Investigation", icon: Search },
    { id: "reports", label: "Reports", icon: ClipboardList },
    { id: "search", label: "Search", icon: Search },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "profile", label: "Profile", icon: UserCircle },
  ];

  const adminTabs = [
    { id: "dashboard", label: "Dashboard", icon: Home },
    { id: "user-management", label: "User Management", icon: Users },
    { id: "roles", label: "Roles & Access", icon: ShieldCheck },
    { id: "live-monitoring", label: "Live Monitoring", icon: Activity },
    { id: "alerts", label: "Alert Management", icon: Bell },
    { id: "threat-analysis", label: "Threat Analysis", icon: ShieldAlert },
    { id: "machine-learning", label: "Machine Learning", icon: Cpu },
    { id: "detection-rules", label: "Detection Rules", icon: Key },
    { id: "logs", label: "Log Management", icon: FileText },
    { id: "packet-analysis", label: "Packet Management", icon: Network },
    { id: "database", label: "Database Management", icon: Database },
    { id: "settings", label: "Settings", icon: Settings },
    { id: "reports", label: "Reports", icon: ClipboardList },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "profile", label: "Profile", icon: UserCircle },
  ];

  const tabs = role === "admin" ? adminTabs : analystTabs;

  return (
    <aside className="w-[280px] h-screen bg-black/40 backdrop-blur-xl border-r border-white/10 flex flex-col fixed left-0 top-0 overflow-hidden z-40 animate-blur-fade-up">
      {/* Logo Area */}
      <div className="p-6 flex items-center gap-3 border-b border-white/10 shrink-0">
        <div className="w-9 h-9 rounded-full liquid-glass flex items-center justify-center">
          <ShieldCheck className="w-5 h-5 text-white" />
        </div>
        <span className="font-bold text-lg tracking-widest text-white">NETSHIELD</span>
      </div>

      {/* Tabs */}
      <div className="flex-1 overflow-y-auto p-4 space-y-1 custom-scrollbar">
        <p className="px-3 text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-3 mt-2">
          {role === "admin" ? "Administrator Console" : "Analyst Workspace"}
        </p>
        
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as SidebarTab)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 ${
                isActive 
                  ? "bg-white/10 text-white shadow-lg border border-white/20" 
                  : "text-gray-400 hover:bg-white/5 hover:text-gray-200 border border-transparent"
              }`}
            >
              <tab.icon className={`w-4 h-4 ${isActive ? "text-white" : "text-gray-400"}`} />
              <span className="text-sm font-medium">{tab.label}</span>
              {isActive && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              )}
            </button>
          );
        })}
      </div>
      
      {/* Footer User Area */}
      <div className="p-4 border-t border-white/10 shrink-0">
        <div className="rounded-xl liquid-glass p-3 border border-white/10 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 overflow-hidden">
             <div className="w-8 h-8 rounded-full bg-cyan-950/40 border border-cyan-500/30 text-cyan-400 flex items-center justify-center font-bold flex-shrink-0 text-xs">
               {role === 'admin' ? 'SA' : 'A'}
             </div>
             <div className="overflow-hidden">
               <p className="text-xs font-semibold text-white truncate">
                 {role === 'admin' ? 'Administrator' : 'Analyst'}
               </p>
               <p className="text-[10px] text-green-400 truncate flex items-center gap-1">
                 <span className="w-1.5 h-1.5 rounded-full bg-green-500" /> Online
               </p>
             </div>
          </div>
          <button 
             onClick={onLogout}
             title="Log Out"
             className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors flex-shrink-0"
          >
             <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
          </button>
        </div>
      </div>
    </aside>
  );
}
