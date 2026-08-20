"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  Search, 
  Home,
  ShieldAlert, 
  Map, 
  Database, 
  Settings, 
  User,
  PanelLeftClose,
  LogOut
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";

export default function Sidebar() {
  const { role, isAuthenticated, isMounted, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    if (isMounted && !isAuthenticated) {
      router.push("/get-started");
    }
  }, [isMounted, isAuthenticated, router]);

  const handleLogout = () => {
    logout();
    router.push("/get-started");
  };

  const navItems = [
    { name: "Dashboard", href: "/", icon: Home },
    { name: "Threat Logs", href: "/threats", icon: ShieldAlert },
    { name: "Network Map", href: "/map", icon: Map },
    { name: "ML Datasets", href: "/datasets", icon: Database },
    { name: "Profile", href: "/profile", icon: User },
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  return (
    <aside className="w-[260px] bg-white border-r border-gray-100 h-screen flex flex-col fixed left-0 top-0 overflow-y-auto">
      {/* Logo Area */}
      <div className="p-6 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-lg">
            N
          </div>
          <span className="text-xl font-bold text-gray-900 tracking-tight">NetShield</span>
        </div>
        <button className="text-gray-400 hover:text-gray-600">
          <PanelLeftClose className="w-4 h-4" />
        </button>
      </div>
      
      {/* Search Area */}
      <div className="px-6 mb-6">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search" 
            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
            <kbd className="hidden sm:inline-block bg-white border border-gray-200 rounded px-1.5 text-[10px] font-medium text-gray-500">⌘</kbd>
            <kbd className="hidden sm:inline-block bg-white border border-gray-200 rounded px-1.5 text-[10px] font-medium text-gray-500">K</kbd>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="px-4 flex-1">
        <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Main Menu</p>
        <nav className="space-y-1">
          {navItems.map((item) => {
            // Check if active (exact match for root, or starts with for others)
            const isActive = pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href));
            
            return (
              <Link 
                key={item.name}
                href={item.href} 
                className={`flex items-center space-x-3 px-4 py-2.5 rounded-xl transition-all duration-200 ${
                  isActive 
                    ? "bg-blue-50 text-blue-700 font-medium" 
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <item.icon className={`w-5 h-5 ${isActive ? "text-blue-600" : "text-gray-400"}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>
      
      {/* Footer Area */}
      <div className="p-6 mt-auto">
        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold flex-shrink-0">
              {mounted && role === 'admin' ? 'SA' : 'A'}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-semibold text-gray-900 truncate">
                {mounted && role === 'admin' ? 'Administrator' : 'Analyst'}
              </p>
              <p className="text-xs text-gray-500 truncate">Workspace</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            title="Log Out"
            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
