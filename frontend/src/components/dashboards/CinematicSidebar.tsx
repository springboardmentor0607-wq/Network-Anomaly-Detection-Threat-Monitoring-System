"use client";

import { useState } from "react";
import {
  Home, Activity, ShieldAlert, Target, Bell,
  FileText, Network, Globe, Search, ClipboardList,
  UserCircle, Users, ShieldCheck, Cpu, Key, Database, Settings,
  ChevronDown, ChevronRight
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
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({ "management-group": true });

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => ({ ...prev, [groupId]: !prev[groupId] }));
  };

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
  ];

  const adminTabs = [
    { id: "dashboard", label: "Dashboard", icon: Home },
    { id: "live-monitoring", label: "Live Monitoring", icon: Activity },
    { id: "alerts", label: "Alert Management", icon: Bell },
    { id: "threat-analysis", label: "Threat Analysis", icon: ShieldAlert },
    { id: "anomaly-detection", label: "Anomaly Detection", icon: Target },
    { id: "machine-learning", label: "Machine Learning", icon: Cpu },
    { id: "detection-rules", label: "Detection Rules", icon: Key },
    { id: "logs", label: "Log Management", icon: FileText },
    { id: "packet-analysis", label: "Packet Management", icon: Network },
    { id: "reports", label: "Reports", icon: ClipboardList },
    {
      id: "management-group",
      label: "Management",
      icon: Settings,
      subItems: [
        { id: "user-management", label: "User Management", icon: Users },
        { id: "roles", label: "Roles & Access", icon: ShieldCheck },
        { id: "database", label: "Database Management", icon: Database },
        { id: "settings", label: "System Settings", icon: Settings },
      ]
    }
  ];

  const tabs = role === "admin" ? adminTabs : analystTabs;

  return (
    <aside className="w-[280px] h-screen bg-black/40 backdrop-blur-xl border-r border-white/10 flex flex-col fixed left-0 top-0 overflow-hidden z-40 animate-blur-fade-up">
      {/* Logo Area */}
      <div className="p-6 flex items-center gap-3 border-b border-white/10 shrink-0">
        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-tr from-blue-600 to-cyan-400"></div>
          <ShieldAlert className="w-5 h-5 text-white relative z-10" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">NetShield<span className="text-blue-500">.ai</span></h1>
          <p className="text-[10px] text-gray-400 font-medium tracking-widest uppercase">Security Engine v2</p>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto p-4 space-y-1.5 custom-scrollbar">
        {tabs.map((tab) => {
          if (tab.subItems) {
            const Icon = tab.icon;
            const isExpanded = expandedGroups[tab.id];
            const hasActiveSub = tab.subItems.some(sub => sub.id === activeTab);
            return (
              <div key={tab.id} className="space-y-1">
                <button
                  onClick={() => toggleGroup(tab.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 ${hasActiveSub ? "text-white" : "text-gray-400 hover:text-white hover:bg-white/5"
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${hasActiveSub ? "text-blue-400" : ""}`} />
                    <span>{tab.label}</span>
                  </div>
                  {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>
                {isExpanded && (
                  <div className="pl-9 space-y-1 relative">
                    <div className="absolute left-5 top-0 bottom-0 w-px bg-white/10" />
                    {tab.subItems.map(subTab => {
                      const SubIcon = subTab.icon;
                      const isSubActive = activeTab === subTab.id;
                      return (
                        <button
                          key={subTab.id}
                          onClick={() => setActiveTab(subTab.id as SidebarTab)}
                          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-300 relative group ${isSubActive
                              ? "text-white bg-white/10 shadow-[inset_1px_1px_0_rgba(255,255,255,0.1)]"
                              : "text-gray-400 hover:text-white hover:bg-white/5"
                            }`}
                        >
                          {isSubActive && (
                            <div className="absolute -left-[17px] top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,1)] z-10" />
                          )}
                          <SubIcon className={`w-3.5 h-3.5 transition-transform duration-300 ${isSubActive ? "text-blue-400" : "group-hover:scale-110"}`} />
                          <span>{subTab.label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as SidebarTab)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 relative group overflow-hidden ${isActive
                  ? "text-white bg-white/10 shadow-[inset_1px_1px_0_rgba(255,255,255,0.1)]"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
            >
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-1/2 bg-blue-500 rounded-r-full shadow-[0_0_10px_rgba(59,130,246,1)]"></div>
              )}
              <Icon className={`w-4 h-4 transition-transform duration-300 ${isActive ? "text-blue-400 scale-110" : "group-hover:scale-110"}`} />
              <span className="z-10">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Footer Profile Area */}
      <div className="p-4 border-t border-white/10 shrink-0">
        <div className="rounded-xl liquid-glass p-3 border border-white/10 flex flex-col gap-3 hover:bg-white/5 transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-cyan-950/40 border border-cyan-500/30 text-cyan-400 flex items-center justify-center font-bold flex-shrink-0 text-sm">
              {role === 'admin' ? 'SA' : 'A'}
            </div>
            <div className="overflow-hidden flex-1">
              <p className="text-sm font-semibold text-white truncate">
                {role === 'admin' ? 'Administrator' : 'Analyst'}
              </p>
              <p className="text-[11px] text-gray-400 truncate">
                {role === 'admin' ? 'admin@netshield.ai' : 'analyst@netshield.ai'}
              </p>
            </div>
            <button title="Notifications" className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors relative">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></span>
            </button>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-white/10">
            <p className="text-[10px] text-green-400 truncate flex items-center gap-1.5 font-medium uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> Active Session
            </p>
            <button
              onClick={onLogout}
              title="Sign Out"
              className="px-3 py-1.5 text-[10px] font-bold text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors flex items-center gap-2 uppercase tracking-wider"
            >
              Sign Out
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
