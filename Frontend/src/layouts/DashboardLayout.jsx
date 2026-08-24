import React, { useState, useRef, useEffect, useContext } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; 
import { TrafficContext } from '../context/TrafficContext'; // 1. Import Global Traffic Brain

const DashboardLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth(); 
  const { anomalies } = useContext(TrafficContext); // 2. Pull live anomalies
  
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  
  const dropdownRef = useRef(null);
  const notificationRef = useRef(null);

  const userRole = user?.role || 'analyst';

  const handleLogout = () => {
    logout(); 
    navigate('/login');
  };

  const getInitials = (name) => {
    if (!name) return 'AS';
    const parts = name.split(' ');
    if (parts.length > 1) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setIsNotificationOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navModules = [
    { name: 'Overview', path: '/dashboard', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2z' },
    { name: 'Network Traffic', path: '/dashboard/traffic', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
    { name: 'Anomaly Detection', path: '/dashboard/anomaly', icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' },
    { name: 'Model Performance', path: '/dashboard/performance', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2  2h-2a2 2 0 01-2-2z' },
    { name: 'Threat Detection', path: '/dashboard/threats', icon: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z' },
    { name: 'Incident Alerts', path: '/dashboard/alerts', icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' },
    { name: 'Security Analytics', path: '/dashboard/security', icon: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
    { name: 'System Logs', path: '/dashboard/logs', icon: 'M4 6h16M4 10h16M4 14h16M4 18h16' },
    { name: 'Reports & Analytics', path: '/dashboard/analytics', icon: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
  ];

  const adminModules = [
    { name: 'Team Management', path: '/dashboard/team', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
    { name: 'Devices Monitor', path: '/dashboard/devices', icon: 'M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01' },
    { name: 'System Settings', path: '/dashboard/settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' },
  ];

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-[#F2F2F0] flex font-sans">
      
      {/* Sidebar */}
      <aside className="w-64 border-r border-white/[0.07] bg-[#0A0A0B] flex flex-col fixed h-full z-20">
        <div className="h-16 flex items-center px-6 border-b border-white/[0.07]">
          <div className="w-2 h-2 rounded-full bg-white mr-2.5" />
          <span className="font-bold tracking-tight text-[15px]">NetShield AI</span>
        </div>

        <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
          <div className="px-3 mb-2 text-[11px] font-semibold text-[#9A9A97] uppercase tracking-wider">Modules</div>
          
          {navModules.map((item) => (
            <Link
              key={item.name}
              to={item.path}
              className={`flex items-center px-3 py-2.5 rounded-lg text-[13px] font-medium transition-colors ${
                location.pathname === item.path 
                  ? 'bg-white/[0.08] text-white' 
                  : 'text-[#9A9A97] hover:bg-white/[0.04] hover:text-[#D6D6D3]'
              }`}
            >
              <svg className="w-4 h-4 mr-3 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
              </svg>
              {item.name}
            </Link>
          ))}

          {userRole === 'administrator' && (
            <>
              <div className="px-3 mt-8 mb-2 text-[11px] font-semibold text-[#9A9A97] uppercase tracking-wider">Administration</div>
              {adminModules.map((item) => (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`flex items-center px-3 py-2.5 rounded-lg text-[13px] font-medium transition-colors ${
                    location.pathname === item.path 
                      ? 'bg-white/[0.08] text-white' 
                      : 'text-[#9A9A97] hover:bg-white/[0.04] hover:text-[#D6D6D3]'
                  }`}
                >
                  <svg className="w-4 h-4 mr-3 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                  </svg>
                  {item.name}
                </Link>
              ))}
            </>
          )}
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 ml-64 flex flex-col min-h-screen">
        {/* Top Header */}
        <header className="h-16 border-b border-white/[0.07] bg-[#0A0A0B]/80 backdrop-blur-md sticky top-0 z-10 flex items-center justify-between px-8">
          <h1 className="text-[15px] font-medium text-[#D6D6D3]">
            {navModules.find(m => m.path === location.pathname)?.name || 
             adminModules.find(m => m.path === location.pathname)?.name || 
             'Dashboard'}
          </h1>
          
          <div className="flex items-center gap-4">
            
            {/* Clickable Notifications Dropdown */}
            <div className="relative" ref={notificationRef}>
              <button 
                onClick={() => {
                  setIsNotificationOpen(!isNotificationOpen);
                  setIsDropdownOpen(false); 
                }}
                className="flex items-center justify-center w-8 h-8 rounded-full border border-white/10 hover:border-white/30 transition-colors cursor-pointer text-[#9A9A97] hover:text-white relative outline-none"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                
                {/* 3. DYNAMIC PULSING RED BADGE */}
                {anomalies.length > 0 && (
                  <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border border-[#0A0A0B] animate-pulse"></span>
                )}
              </button>

              {/* Notification Menu */}
              {isNotificationOpen && (
                <div className="absolute right-0 mt-3 w-80 bg-[#0A0A0B] border border-white/[0.07] rounded-xl shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-200 flex flex-col overflow-hidden">
                  <div className="px-4 py-3 border-b border-white/[0.07] flex justify-between items-center bg-white/[0.01]">
                    <h3 className="text-[13px] font-medium text-[#F2F2F0]">Notifications ({anomalies.length})</h3>
                  </div>
                  
                  <div className="max-h-[300px] overflow-y-auto divide-y divide-white/[0.03]">
                    {/* 4. DYNAMIC NOTIFICATIONS MAPPING */}
                    {anomalies.length === 0 ? (
                      <div className="px-4 py-8 text-center text-[12px] text-[#9A9A97]">
                        Network is secure. No recent threats.
                      </div>
                    ) : (
                      anomalies.slice(0, 5).map((notif) => (
                        <div 
                          key={notif.id} 
                          onClick={() => {
                            setIsNotificationOpen(false);
                            navigate('/dashboard/threats'); // 5. Click transports to Threat Monitor
                          }}
                          className="px-4 py-3 hover:bg-white/[0.04] transition-colors cursor-pointer border-l-2 border-transparent hover:border-red-500"
                        >
                          <div className="flex justify-between items-start mb-1">
                            <span className="text-[13px] font-semibold text-red-400">{notif.type}</span>
                            <span className="text-[10px] text-[#9A9A97] opacity-70">{notif.time}</span>
                          </div>
                          <p className="text-[11px] text-[#D6D6D3] leading-relaxed mb-0.5">Source: {notif.source}</p>
                          <p className="text-[10px] text-[#9A9A97] italic">{notif.description}</p>
                        </div>
                      ))
                    )}
                  </div>
                  
                  {anomalies.length > 0 && (
                    <div className="px-4 py-2 border-t border-white/[0.07] text-center bg-white/[0.01]">
                      <Link 
                        to="/dashboard/threats" 
                        onClick={() => setIsNotificationOpen(false)} 
                        className="text-[12px] text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
                      >
                        View all in Threat Monitor &rarr;
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Clickable Profile Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button 
                onClick={() => {
                  setIsDropdownOpen(!isDropdownOpen);
                  setIsNotificationOpen(false); 
                }}
                className="flex items-center gap-2 pl-4 border-l border-white/[0.07] hover:opacity-80 transition-opacity text-left outline-none"
              >
                <div className="w-7 h-7 rounded bg-white/10 flex items-center justify-center text-[12px] font-bold text-white">
                  {getInitials(user?.full_name)}
                </div>
                <div className="flex flex-col">
                  <span className="text-[12px] font-medium leading-tight text-[#F2F2F0]">
                    {user?.full_name || 'Loading...'}
                  </span>
                  <span className="text-[10px] text-[#9A9A97] leading-tight capitalize">
                    {userRole}
                  </span>
                </div>
                <svg className={`w-3.5 h-3.5 text-[#9A9A97] ml-1 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {isDropdownOpen && (
                <div className="absolute right-0 mt-3 w-56 bg-[#0A0A0B] border border-white/[0.07] rounded-xl shadow-2xl py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="px-4 py-2.5 border-b border-white/[0.07] mb-1">
                    <p className="text-[11px] text-[#9A9A97] mb-0.5">Signed in as</p>
                    <p className="text-[13px] font-medium text-[#F2F2F0] truncate">
                      {user?.email}
                    </p>
                    <p className="text-[11px] text-[#9A9A97] truncate mt-0.5">
                      {user?.full_name}
                    </p>
                  </div>
                  
                  <Link 
                    to="/dashboard/profile" 
                    onClick={() => setIsDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-[13px] text-[#D6D6D3] hover:bg-white/[0.04] hover:text-white transition-colors"
                  >
                    <svg className="w-4 h-4 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    My Profile
                  </Link>
                  
                  <button 
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-[13px] text-red-400 hover:bg-red-400/10 transition-colors border-t border-white/[0.07] mt-1 pt-2 cursor-pointer"
                  >
                    <svg className="w-4 h-4 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Sign Out
                  </button>
                </div>
              )}
            </div>

          </div>
        </header>

        <div className="flex-1 p-8">
          <Outlet />
        </div>
      </main>

    </div>
  );
};

export default DashboardLayout;