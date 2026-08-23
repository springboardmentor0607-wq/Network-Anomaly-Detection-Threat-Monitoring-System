import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldExclamationIcon } from '@heroicons/react/24/outline';

const NotFoundPage = () => {
  return (
    <div className="min-h-screen bg-[#060911] flex flex-col items-center justify-center p-4 text-center font-mono">
      <ShieldExclamationIcon className="w-16 h-16 text-rose-500 mb-4 animate-bounce" />
      <h1 className="text-4xl font-extrabold text-white mb-2">404 - ACCESS DENIED</h1>
      <p className="text-xs text-slate-400 mb-6">The requested SOC resource node does not exist or has been isolated.</p>
      <Link to="/login" className="px-5 py-2.5 bg-cyan-500 text-black font-extrabold rounded-xl text-xs uppercase shadow-glow-cyan">
        Return to Login
      </Link>
    </div>
  );
};

export default NotFoundPage;
