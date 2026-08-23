import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import Badge from '../../components/common/Badge';

const ProfilePage = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-xl font-extrabold text-white tracking-tight">User Security Profile</h2>
        <p className="text-xs text-slate-400">Account Credentials & Access Roles</p>
      </div>

      <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-4 font-mono">
        <div className="flex items-center space-x-4 border-b border-slate-800 pb-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-400 to-blue-600 flex items-center justify-center text-black font-extrabold text-2xl shadow-glow-cyan">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">{user?.name}</h3>
            <span className="text-xs text-cyan-400 font-semibold">{user?.email}</span>
          </div>
        </div>

        <div className="space-y-3 text-xs">
          <div className="flex justify-between py-2 border-b border-slate-800/60">
            <span className="text-slate-400 uppercase">Assigned Role:</span>
            <Badge variant="info">{user?.role?.toUpperCase()}</Badge>
          </div>
          <div className="flex justify-between py-2 border-b border-slate-800/60">
            <span className="text-slate-400 uppercase">Account Status:</span>
            <Badge variant="online">ACTIVE</Badge>
          </div>
          <div className="flex justify-between py-2 border-b border-slate-800/60">
            <span className="text-slate-400 uppercase">Security Clearance Level:</span>
            <span className="text-white font-bold">LEVEL 3 - SOC OPERATOR</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-slate-400 uppercase">Multi-Factor Authentication:</span>
            <span className="text-emerald-400 font-bold">ENABLED (TOTP)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
