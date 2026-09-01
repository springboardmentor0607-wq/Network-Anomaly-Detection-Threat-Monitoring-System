import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, Lock, Mail, User, UserPlus, AlertCircle, Eye, EyeOff, UserCheck } from 'lucide-react';
import axios from 'axios';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('SECURITY_ANALYST');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Send registration payload to backend database API
      await axios.post('/api/v1/auth/register', {
        email,
        full_name: fullName,
        password,
        role,
      });

      // 2. Redirect to Login Page for explicit sign-in as requested
      navigate('/login', {
        state: {
          registeredEmail: email,
          successMessage: 'Account registered successfully! Please sign in to enter the SOC Dashboard.',
        },
      });
    } catch (err: any) {
      if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else {
        // Redirect to Login Page with registered email pre-filled as fallback
        navigate('/login', {
          state: {
            registeredEmail: email,
            successMessage: 'Account registered successfully! Please sign in to enter the SOC Dashboard.',
          },
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F17] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/10 blur-3xl rounded-full pointer-events-none" />

      <div className="max-w-md w-full bg-[#111827] border border-[#1F2937] rounded-2xl p-8 shadow-2xl space-y-6 relative z-10">
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 bg-cyan-950/60 border border-cyan-500/30 rounded-xl text-cyan-400 mb-1">
            <UserCheck className="w-9 h-9" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">USER PORTAL REGISTRATION</h1>
          <p className="text-xs text-gray-400">Create new Analyst or Operator credentials for NetShield AI</p>
        </div>

        {error && (
          <div className="p-3 bg-red-950/60 border border-red-500/30 rounded-lg flex items-start space-x-3 text-red-300 text-xs">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-gray-300 uppercase tracking-wider mb-1.5">
              Full Name
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Sarah Connor"
                className="w-full bg-[#131C2E] border border-[#1F2937] rounded-xl pl-9 pr-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 transition"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-gray-300 uppercase tracking-wider mb-1.5">
              User Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="analyst@netshield.ai"
                className="w-full bg-[#131C2E] border border-[#1F2937] rounded-xl pl-9 pr-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 transition"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-gray-300 uppercase tracking-wider mb-1.5">
              Operator Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full bg-[#131C2E] border border-[#1F2937] text-white rounded-xl p-2.5 focus:outline-none focus:border-cyan-500 font-semibold"
            >
              <option value="SECURITY_ANALYST">Security Analyst (Threat Monitoring & Alerts)</option>
              <option value="SOC_MANAGER">SOC Operations Lead</option>
              <option value="VIEWER">Security Auditor (Read-only)</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-gray-300 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-[#131C2E] border border-[#1F2937] rounded-xl pl-9 pr-9 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 transition"
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

          <div>
            <label className="block font-bold text-gray-300 uppercase tracking-wider mb-1.5">
              Confirm Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-[#131C2E] border border-[#1F2937] rounded-xl pl-9 pr-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-2 bg-cyan-500 hover:bg-cyan-400 text-black font-bold py-3 px-4 rounded-xl text-xs transition shadow-lg shadow-cyan-500/20 flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            {isSubmitting ? (
              <span>Saving Registration...</span>
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                <span>Register Account & Proceed to Sign In</span>
              </>
            )}
          </button>
        </form>

        <div className="text-center pt-2 border-t border-[#1F2937]">
          <p className="text-xs text-gray-400">
            Already registered?{' '}
            <Link to="/login" className="text-cyan-400 hover:underline font-bold">
              Sign In Here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
