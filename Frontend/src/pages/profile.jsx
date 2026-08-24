import React from 'react';
import { useAuth } from '../context/AuthContext'; // 1. Import AuthContext

const Profile = () => {
  const { user } = useAuth(); // 2. Grab real user data

  // Helper to split full name into first and last name fields
  const getNames = (fullName) => {
    if (!fullName) return { firstName: 'User', lastName: '' };
    const parts = fullName.split(' ');
    return {
      firstName: parts[0] || '',
      lastName: parts.slice(1).join(' ') || ''
    };
  };

  // Helper for avatar initials
  const getInitials = (name) => {
    if (!name) return 'US';
    const parts = name.split(' ');
    if (parts.length > 1) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const { firstName, lastName } = getNames(user?.full_name);

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-[18px] font-semibold text-[#F2F2F0]">My Profile</h2>
        <p className="text-[13px] text-[#9A9A97]">Manage your personal account settings, security, and sessions</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Column - Avatar & Quick Info */}
        <div className="col-span-1 space-y-6">
          <div className="bg-[#0A0A0B]/60 backdrop-blur-sm border border-white/[0.07] rounded-xl p-6 flex flex-col items-center text-center">
            {/* Dynamic Initials */}
            <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center text-[24px] font-bold text-white mb-4">
              {getInitials(user?.full_name)}
            </div>
            {/* Dynamic Name */}
            <h3 className="text-[16px] font-medium text-[#F2F2F0]">{user?.full_name || 'Loading...'}</h3>
            {/* Dynamic Role */}
            <p className="text-[12px] text-[#9A9A97] mb-4 capitalize">{user?.role || 'Analyst'}</p>
            <button className="w-full py-2 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.07] text-[#D6D6D3] text-[12px] font-medium rounded-lg transition-colors">
              Change Avatar
            </button>
          </div>
        </div>

        {/* Right Column - Forms & Settings */}
        <div className="col-span-1 md:col-span-2 space-y-6">
          
          {/* Personal Information */}
          <div className="bg-[#0A0A0B]/60 backdrop-blur-sm border border-white/[0.07] rounded-xl p-6">
            <h3 className="text-[15px] font-medium text-[#F2F2F0] mb-4">Personal Information</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#9A9A97] text-[12px] mb-1.5">First Name</label>
                  <input type="text" value={firstName} readOnly className="w-full bg-white/[0.02] border border-white/[0.07] rounded-md px-3 py-2 text-[13px] text-[#D6D6D3] focus:outline-none focus:border-white/20" />
                </div>
                <div>
                  <label className="block text-[#9A9A97] text-[12px] mb-1.5">Last Name</label>
                  <input type="text" value={lastName} readOnly className="w-full bg-white/[0.02] border border-white/[0.07] rounded-md px-3 py-2 text-[13px] text-[#D6D6D3] focus:outline-none focus:border-white/20" />
                </div>
              </div>
              <div>
                <label className="block text-[#9A9A97] text-[12px] mb-1.5">Email Address</label>
                {/* Dynamic Email */}
                <input type="email" value={user?.email || ''} readOnly className="w-full bg-white/[0.02] border border-white/[0.07] rounded-md px-3 py-2 text-[13px] text-[#D6D6D3] focus:outline-none focus:border-white/20" />
              </div>
              <div className="pt-2">
                <button className="px-4 py-2 bg-white text-[#0A0A0B] hover:bg-[#E5E5E2] text-[12px] font-medium rounded-lg transition-colors">
                  Save Changes
                </button>
              </div>
            </div>
          </div>

          {/* Security & Authentication */}
          <div className="bg-[#0A0A0B]/60 backdrop-blur-sm border border-white/[0.07] rounded-xl p-6">
            <h3 className="text-[15px] font-medium text-[#F2F2F0] mb-4">Security</h3>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[13px] font-medium text-[#F2F2F0]">Account Password</div>
                  <div className="text-[11px] text-[#9A9A97]">Last changed recently</div>
                </div>
                <button className="px-4 py-2 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.07] text-[#D6D6D3] text-[12px] font-medium rounded-lg transition-colors">
                  Update Password
                </button>
              </div>
              
              <div className="border-t border-white/[0.05] pt-4 flex items-center justify-between">
                <div>
                  <div className="text-[13px] font-medium text-[#F2F2F0]">Two-Factor Authentication (2FA)</div>
                  <div className="text-[11px] text-emerald-400">Currently Enabled via Authenticator App</div>
                </div>
                <button className="px-4 py-2 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.07] text-[#D6D6D3] text-[12px] font-medium rounded-lg transition-colors">
                  Manage 2FA
                </button>
              </div>
            </div>
          </div>

          {/* Active Sessions */}
          <div className="bg-[#0A0A0B]/60 backdrop-blur-sm border border-white/[0.07] rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-white/[0.07] bg-white/[0.01]">
              <h3 className="text-[15px] font-medium text-[#F2F2F0]">Active Sessions</h3>
            </div>
            <div className="divide-y divide-white/[0.03]">
              {[
                { device: 'MacBook Pro - Chrome', location: 'Udaipur, India', time: 'Current Session', ip: '103.119.24.11', active: true },
                { device: 'iPhone 14 - Safari', location: 'Udaipur, India', time: '2 hours ago', ip: '103.119.24.45', active: false },
              ].map((session, i) => (
                <div key={i} className="px-6 py-4 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <svg className="w-6 h-6 text-[#9A9A97]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      {session.active 
                        ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      }
                    </svg>
                    <div>
                      <div className="text-[13px] font-medium text-[#F2F2F0] flex items-center gap-2">
                        {session.device} 
                        {session.active && <span className="bg-emerald-500/20 text-emerald-400 text-[9px] px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">Active</span>}
                      </div>
                      <div className="text-[11px] text-[#9A9A97]">{session.location} • {session.ip} • {session.time}</div>
                    </div>
                  </div>
                  {!session.active && (
                    <button className="text-[12px] text-red-400 hover:text-red-300 font-medium">Revoke</button>
                  )}
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Profile;