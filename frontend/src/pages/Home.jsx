import React from 'react';
import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center relative overflow-hidden font-sans">
      {/* Background glowing gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-blue-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none" />

      {/* Main Content Container */}
      <div className="max-w-2xl px-6 text-center z-10 flex flex-col items-center">
        {/* Title */}
        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-white mb-6 leading-tight">
          NetShield AI
        </h1>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6 justify-center">
          <Link
            to="/login"
            className="px-8 py-4 rounded-xl font-medium bg-gradient-to-r from-blue-600 to-indigo-600 text-white"
          >
            Sign In
          </Link>
          <Link
            to="/register"
            className="px-8 py-4 rounded-xl font-medium border border-slate-800 text-white"
          >
            Create Account
          </Link>
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-6 text-slate-650 text-xs font-mono tracking-widest uppercase z-10 select-none">
        NetShield AI
      </div>
    </div>
  );
}
