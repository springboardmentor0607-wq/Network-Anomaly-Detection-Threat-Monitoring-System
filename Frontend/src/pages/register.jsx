import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import NetworkField from '../components/NetworkField';
import { authAPI } from '../services/api';

const Register = () => {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('analyst');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    setError('');
    setLoading(true);

    try {
      // Connect to FastAPI backend via authAPI
      await authAPI.register({ 
        full_name: fullName, 
        username: username, 
        email: email, 
        password: password, 
        role: role 
      });
      
      // If successful, send them to login
      navigate('/login');
    } catch (err) {
      setError(err.message || 'Registration failed. Is FastAPI running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-[#F2F2F0] relative overflow-hidden flex">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        * { font-family: 'Inter', sans-serif; }
      `}</style>

      <NetworkField />

      {/* Left panel — brand */}
      <div className="hidden lg:flex lg:w-[45%] relative z-10 border-r border-white/[0.07] items-center justify-center bg-[#0A0A0B]/40 backdrop-blur-[2px]">
        <div className="px-10">
          <div className="flex items-center gap-2.5 mb-8">
            <div className="w-1.5 h-1.5 rounded-full bg-white" />
            <span className="font-semibold tracking-tight text-[15px]">NetShield AI</span>
          </div>
          
          {/* Dynamic Content Based on Role */}
          <h2 className="font-semibold tracking-tight text-[28px] leading-[1.15] mb-4 transition-all duration-300">
            {role === 'analyst' 
              ? 'Set up your analyst console.' 
              : 'Set up your admin workspace.'}
          </h2>
          <p className="text-[#9A9A97] text-[14px] leading-relaxed max-w-sm transition-all duration-300">
            {role === 'analyst'
              ? 'Create an account to start monitoring live traffic, reviewing anomalies, and responding to threats from a single dashboard.'
              : 'Create an account to manage team access, configure system-wide security policies, and oversee overall network infrastructure.'}
          </p>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-16 relative z-10">
        <Link
          to="/"
          className="absolute top-8 left-8 text-[13px] text-[#9A9A97] hover:text-white transition-colors flex items-center gap-1.5"
        >
          &larr; Back to home
        </Link>

        <div className="w-full max-w-sm bg-[#0A0A0B]/35 backdrop-blur-sm rounded-2xl p-8 border border-white/[0.07]">
          <div className="mb-8">
            <h1 className="font-semibold tracking-tight text-[26px] mb-2">Register</h1>
            <p className="text-[#9A9A97] text-[14px]">Create your account to access the console.</p>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-[#D6D6D3] text-[13px] font-medium mb-2" htmlFor="fullName">
                Full name
              </label>
              <input
                id="fullName"
                type="text"
                className="w-full px-3.5 py-2.5 rounded-lg bg-white/[0.04] text-white border border-white/10 focus:outline-none focus:border-white/30 transition-colors text-[14px]"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-[#D6D6D3] text-[13px] font-medium mb-2" htmlFor="username">
                Username
              </label>
              <input
                id="username"
                type="text"
                className="w-full px-3.5 py-2.5 rounded-lg bg-white/[0.04] text-white border border-white/10 focus:outline-none focus:border-white/30 transition-colors text-[14px]"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-[#D6D6D3] text-[13px] font-medium mb-2" htmlFor="email">
                Email address
              </label>
              <input
                id="email"
                type="email"
                className="w-full px-3.5 py-2.5 rounded-lg bg-white/[0.04] text-white border border-white/10 focus:outline-none focus:border-white/30 transition-colors text-[14px]"
                placeholder="analyst@netshield.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-[#D6D6D3] text-[13px] font-medium mb-2" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                className="w-full px-3.5 py-2.5 rounded-lg bg-white/[0.04] text-white border border-white/10 focus:outline-none focus:border-white/30 transition-colors text-[14px]"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-[#D6D6D3] text-[13px] font-medium mb-2" htmlFor="confirmPassword">
                Confirm password
              </label>
              <input
                id="confirmPassword"
                type="password"
                className="w-full px-3.5 py-2.5 rounded-lg bg-white/[0.04] text-white border border-white/10 focus:outline-none focus:border-white/30 transition-colors text-[14px]"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-[#D6D6D3] text-[13px] font-medium mb-2">Role</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRole('analyst')}
                  className={`py-2.5 rounded-lg text-[13px] font-medium border transition-colors ${
                    role === 'analyst'
                      ? 'bg-white text-[#0A0A0B] border-white'
                      : 'bg-white/[0.04] text-[#D6D6D3] border-white/10 hover:border-white/25'
                  }`}
                >
                  Security Analyst
                </button>
                <button
                  type="button"
                  onClick={() => setRole('administrator')}
                  className={`py-2.5 rounded-lg text-[13px] font-medium border transition-colors ${
                    role === 'administrator'
                      ? 'bg-white text-[#0A0A0B] border-white'
                      : 'bg-white/[0.04] text-[#D6D6D3] border-white/10 hover:border-white/25'
                  }`}
                >
                  Administrator
                </button>
              </div>
            </div>

            {error && <p className="text-red-400 text-[13px]">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-white text-[#0A0A0B] text-[14px] font-medium py-2.5 rounded-lg hover:bg-[#E5E5E2] transition-colors mt-2 disabled:opacity-50"
            >
              {loading ? 'Registering...' : 'Register'}
            </button>
          </form>

          <p className="text-center text-[#9A9A97] text-[13px] mt-8">
            Already have an account?{' '}
            <Link to="/login" className="text-white hover:underline">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;