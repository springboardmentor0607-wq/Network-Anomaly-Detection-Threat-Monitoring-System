import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { TrafficContext } from '../context/TrafficContext'; // 1. Import Global Traffic Brain

const Header = ({ title }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { anomalies } = useContext(TrafficContext); // 2. Pull live anomalies
  
  // State to toggle the notification dropdown visibility
  const [showNotifications, setShowNotifications] = useState(false);

  const handleLogout = () => {
    logout(); 
    navigate('/login');
  };

  const getInitials = (name) => {
    if (!name) return '??';
    const parts = name.split(' ');
    if (parts.length > 1) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <header className="bg-gray-800 h-16 border-b border-gray-700 flex items-center justify-between px-6 relative z-50">
      <h1 className="text-xl font-semibold text-gray-100">{title}</h1>
      
      <div className="flex items-center space-x-6">
        
        {/* --- LIVE NOTIFICATION BELL START --- */}
        <div className="relative">
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 text-gray-400 hover:text-white transition-colors"
          >
            {/* Bell SVG Icon */}
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
            </svg>

            {/* Red Pulsing Badge for Live Threats */}
            {anomalies.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse border-2 border-gray-800"></span>
            )}
          </button>

          {/* Notification Dropdown Panel */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-gray-900 border border-gray-700 rounded-lg shadow-2xl overflow-hidden z-50">
              <div className="px-4 py-3 border-b border-gray-800 bg-gray-800/50 flex justify-between items-center">
                <h3 className="text-sm font-semibold text-gray-200">Recent Alerts</h3>
                <span className="text-xs bg-red-500/10 text-red-400 px-2 py-0.5 rounded-full border border-red-500/20">
                  {anomalies.length} Critical
                </span>
              </div>
              
              <div className="max-h-80 overflow-y-auto">
                {anomalies.length === 0 ? (
                  <div className="p-6 text-center text-sm text-gray-500">
                    Network is secure. No recent threats.
                  </div>
                ) : (
                  anomalies.slice(0, 5).map((alert) => (
                    <div 
                      key={alert.id} 
                      onClick={() => {
                        setShowNotifications(false);
                        navigate('/dashboard/threats');
                      }}
                      className="p-4 border-b border-gray-800 hover:bg-gray-800/50 cursor-pointer transition-colors group"
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-semibold text-red-400 text-xs tracking-wide">{alert.type}</span>
                        <span className="text-[10px] text-gray-500">{alert.time}</span>
                      </div>
                      <p className="text-xs text-gray-400 truncate">Source: {alert.source}</p>
                      <span className="text-[10px] text-indigo-400 group-hover:text-indigo-300 mt-2 inline-block">
                        View in Threat Monitor &rarr;
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
        {/* --- LIVE NOTIFICATION BELL END --- */}

        {/* Dynamic User Profile Section */}
        <div className="flex items-center space-x-3 border-l border-gray-700 pl-6">
          <div className="flex flex-col text-right hidden sm:flex">
            <span className="text-sm font-semibold text-gray-200">
              {user?.full_name || 'Loading...'}
            </span>
            <span className="text-xs text-gray-400 capitalize">
              {user?.role || 'Analyst'}
            </span>
          </div>
          
          {/* Dynamic Avatar Initials */}
          <div className="h-9 w-9 bg-indigo-600 rounded-full flex items-center justify-center font-bold text-sm text-white shadow-inner">
            {getInitials(user?.full_name)}
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="text-sm text-gray-400 hover:text-white border border-gray-600 hover:border-gray-500 hover:bg-gray-700 rounded px-4 py-1.5 transition-all duration-200"
        >
          Log Out
        </button>
      </div>
    </header>
  );
};

export default Header;