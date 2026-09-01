import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Shield, Lock, Mail, Eye, EyeOff, AlertCircle, KeyRound, UserPlus, ShieldAlert, UserCheck, CheckCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const registeredEmail = location.state?.registeredEmail || '';
  const initialSuccessMsg = location.state?.successMessage || null;

  const [portalType, setPortalType] = useState<'USER' | 'ADMIN'>('USER');
  const [email, setEmail] = useState(registeredEmail);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(initialSuccessMsg);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (registeredEmail) {
      setEmail(registeredEmail);
    }
  }, [registeredEmail]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setIsSubmitting(true);
    try {
      await login({ email, password });
      navigate('/');
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Failed to authenticate. Please check your credentials.';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0E27] via-[#0F1629] to-[#0A0E27] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-sky-500/5 blur-3xl rounded-full pointer-events-none" />

      <div className="max-w-md w-full bg-gradient-to-br from-[#0F1629] to-[#0A0E27] border border-[#1A2540] rounded-2xl p-8 shadow-2xl space-y-6 relative z-10">
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 bg-sky-500/15 border border-sky-500/40 rounded-xl text-sky-400 mb-1">
            <Shield className="w-9 h-9" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">NETSHIELD AI</h1>
          <p className="text-xs text-gray-500">Security Operations Center Authentication</p>
        </div>

        {/* Portal Switcher Tabs: USER PORTAL vs ADMIN PORTAL */}
        <div className="grid grid-cols-2 bg-[#0A0E27] p-1 border border-[#1A2540] rounded-xl text-xs font-bold">
          <button
            type="button"
            onClick={() => {
              setPortalType('USER');
              if (!registeredEmail) setEmail('');
              setPassword('');
              setError(null);
            }}
            className={`py-2.5 rounded-lg flex items-center justify-center space-x-2 transition ${
              portalType === 'USER'
                ? 'bg-gradient-to-r from-sky-500 to-sky-600 text-white shadow-md font-extrabold'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>USER PORTAL</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setPortalType('ADMIN');
              setEmail('');
              setPassword('');
              setError(null);
            }}
            className={`py-2.5 rounded-lg flex items-center justify-center space-x-2 transition ${
              portalType === 'ADMIN'
                ? 'bg-gradient-to-r from-rose-500 to-rose-600 text-white shadow-md font-extrabold'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            <span>ADMIN PORTAL</span>
          </button>
        </div>

        {/* Success Notification Banner */}
        {successMsg && (
          <div className="p-3 bg-emerald-500/15 border border-emerald-500/40 rounded-xl flex items-start space-x-3 text-emerald-300 text-xs animate-in fade-in duration-200">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Error Notification */}
        {error && (
          <div className="p-3 bg-rose-500/15 border border-rose-500/40 rounded-lg flex items-start space-x-3 text-rose-300 text-xs">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Form Inputs */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              {portalType === 'ADMIN' ? 'System Administrator Email' : 'Operator / Analyst Email'}
            </label>
            <div className="relative">
              <Mail className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={portalType === 'ADMIN' ? 'admin@domain.com' : 'user@domain.com'}
                className="w-full bg-[#151D35] border border-[#1A2540] rounded-lg pl-10 pr-4 py-2.5 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-sky-500 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-[#151D35] border border-[#1A2540] rounded-lg pl-10 pr-10 py-2.5 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-sky-500 transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full font-bold py-3 px-4 rounded-lg text-xs transition shadow-lg flex items-center justify-center space-x-2 disabled:opacity-50 ${
              portalType === 'ADMIN'
                ? 'bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-400 hover:to-rose-500 text-white shadow-rose-950/50'
                : 'bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-400 hover:to-sky-500 text-white shadow-sky-950/50'
            }`}
          >
            {isSubmitting ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <KeyRound className="w-4 h-4" />
                <span>{portalType === 'ADMIN' ? 'Sign In as Administrator' : 'Sign In to User Dashboard'}</span>
              </>
            )}
          </button>
        </form>

        {/* Links & Subtext */}
        {portalType === 'USER' ? (
          <div className="text-center border-t border-[#1A2540] pt-4">
            <p className="text-xs text-gray-500">
              Don't have an operator account?{' '}
              <Link to="/register" className="text-sky-400 hover:underline font-bold inline-flex items-center space-x-1">
                <span>Register User Account Here</span>
                <UserPlus className="w-3.5 h-3.5 inline ml-0.5" />
              </Link>
            </p>
          </div>
        ) : (
          <div className="border-t border-[#1A2540] pt-4 text-center">
            <p className="text-[11px] text-gray-500">
              🔒 Administrator Access • Public self-registration disabled for Admin tier.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
