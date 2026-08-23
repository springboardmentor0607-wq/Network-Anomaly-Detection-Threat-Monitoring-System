import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { ShieldCheckIcon, LockClosedIcon, EnvelopeIcon, KeyIcon } from '@heroicons/react/24/outline';
import Toast from '../../components/common/Toast';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [toast, setToast] = useState(null);
  const { login, loading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const user = await login(email, password);
      setToast({ message: `Welcome back, ${user.name}!`, type: 'success' });
      
      setTimeout(() => {
        if (user.role === 'admin') {
          navigate('/admin/dashboard');
        } else {
          navigate('/analyst/dashboard');
        }
      }, 500);
    } catch (err) {
      setToast({ message: typeof err === 'string' ? err : 'Invalid credentials', type: 'error' });
    }
  };

  const handleDemoFill = (role) => {
    if (role === 'admin') {
      setEmail('admin@netshield.ai');
      setPassword('password123');
    } else {
      setEmail('analyst@netshield.ai');
      setPassword('password123');
    }
  };

  return (
    <div className="min-h-screen bg-[#060911] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md glass-card rounded-2xl p-8 border border-cyan-500/30 shadow-2xl relative z-10">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-tr from-cyan-400 to-blue-600 flex items-center justify-center text-black shadow-glow-cyan">
            <ShieldCheckIcon className="w-8 h-8 stroke-2" />
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight font-mono">
            NetShield<span className="text-cyan-400">.AI</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-medium">Network Anomaly & Threat Engine</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">Email Address</label>
            <div className="relative">
              <EnvelopeIcon className="w-5 h-5 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="analyst@netshield.ai"
                className="w-full pl-11 pr-4 py-2.5 bg-slate-900/80 border border-slate-700/60 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">Password</label>
            <div className="relative">
              <KeyIcon className="w-5 h-5 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-11 pr-4 py-2.5 bg-slate-900/80 border border-slate-700/60 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all font-mono"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-extrabold rounded-xl shadow-glow-cyan transition-all duration-200 tracking-wider uppercase text-xs flex items-center justify-center space-x-2"
          >
            <LockClosedIcon className="w-4 h-4 stroke-2" />
            <span>{loading ? 'Authenticating...' : 'Sign In to SOC Console'}</span>
          </button>
        </form>

        {/* Demo Account Fill Helpers */}
        <div className="mt-6 pt-6 border-t border-slate-800 text-center">
          <p className="text-xs text-slate-400 mb-2 font-medium">Quick Demo Access:</p>
          <div className="flex items-center justify-center space-x-3">
            <button
              onClick={() => handleDemoFill('analyst')}
              type="button"
              className="px-3 py-1.5 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 rounded-lg text-xs font-mono text-cyan-300 transition-all"
            >
              Analyst Account
            </button>
            <button
              onClick={() => handleDemoFill('admin')}
              type="button"
              className="px-3 py-1.5 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 rounded-lg text-xs font-mono text-emerald-300 transition-all"
            >
              Admin Account
            </button>
          </div>
        </div>

        <div className="mt-6 text-center text-xs text-slate-400">
          Need an account?{' '}
          <Link to="/register" className="text-cyan-400 hover:underline font-semibold">
            Register User
          </Link>
        </div>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default LoginPage;
