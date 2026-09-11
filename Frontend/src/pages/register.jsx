import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import NetworkField from '../components/NetworkField';
import { authAPI } from '../services/api';

const Register = () => {
  const navigate = useNavigate();
  
  // Theme sync with localStorage
  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem('theme') !== 'light';
  });

  useEffect(() => {
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }, [isDark]);

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
      await authAPI.register({ 
        full_name: fullName, 
        username, 
        email, 
        password, 
        role 
      });
      navigate('/login');
    } catch (err) {
      setError(err.message || 'Registration failed. Is FastAPI running?');
    } finally {
      setLoading(false);
    }
  };

  // Dynamic Theme Colors
  const bgMain = isDark ? 'bg-[#0A0A0B]' : 'bg-[#F9F9F8]';
  const textMain = isDark ? 'text-[#F2F2F0]' : 'text-[#0A0A0B]';
  const textMuted = isDark ? 'text-[#9A9A97]' : 'text-[#6B6B66]';
  const borderSubtle = isDark ? 'border-white/[0.07]' : 'border-black/[0.07]';
  const panelBg = isDark ? 'bg-[#0A0A0B]/40' : 'bg-[#F9F9F8]/40';
  const cardBg = isDark ? 'bg-[#0A0A0B]/35' : 'bg-white/50';
  const inputBg = isDark ? 'bg-white/[0.04]' : 'bg-black/[0.03]';
  const inputBorder = isDark ? 'border-white/10 focus:border-white/30' : 'border-black/10 focus:border-black/30';
  const btnPrimaryBg = isDark ? 'bg-white text-[#0A0A0B] hover:bg-[#E5E5E2]' : 'bg-[#0A0A0B] text-white hover:bg-[#222]';
  const dotColor = isDark ? 'bg-white' : 'bg-[#0A0A0B]';

  // Role button dynamic states
  const roleActive = isDark 
    ? 'bg-white text-[#0A0A0B] border-white' 
    : 'bg-[#0A0A0B] text-white border-black';
  const roleInactive = isDark
    ? 'bg-white/[0.04] text-[#D6D6D3] border-white/10 hover:border-white/25'
    : 'bg-black/[0.04] text-[#4B4B48] border-black/10 hover:border-black/25';

  return (
    <div className={`min-h-screen ${bgMain} ${textMain} relative overflow-hidden flex transition-colors duration-500 ease-in-out`}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        * { font-family: 'Inter', sans-serif; }
      `}</style>

      <NetworkField isDark={isDark} />

      {/* Theme Toggle Button */}
      <button 
        onClick={() => setIsDark(!isDark)}
        className={`absolute top-8 right-8 z-50 p-2 rounded-full ${textMuted} hover:${textMain} active:scale-90 transition-all`}
        aria-label="Toggle Theme"
      >
        {isDark ? (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
          </svg>
        )}
      </button>

      {/* Left panel — brand */}
      <div className={`hidden lg:flex lg:w-[45%] relative z-10 border-r ${borderSubtle} items-center justify-center ${panelBg} backdrop-blur-[4px] transition-colors duration-500`}>
        <div className="px-10">
          <div className="flex items-center gap-2.5 mb-8">
            <div className={`w-1.5 h-1.5 rounded-full ${dotColor} transition-colors duration-500`} />
            <span className="font-semibold tracking-tight text-[15px]">NetShield AI</span>
          </div>
          
          <h2 className="font-semibold tracking-tight text-[28px] leading-[1.15] mb-4 transition-all duration-300">
            {role === 'analyst' 
              ? 'Set up your analyst console.' 
              : 'Set up your admin workspace.'}
          </h2>
          <p className={`${textMuted} text-[14px] leading-relaxed max-w-sm transition-all duration-300`}>
            {role === 'analyst'
              ? 'Create an account to start monitoring live traffic, reviewing anomalies, and responding to threats from a single dashboard.'
              : 'Create an account to manage team access, configure system-wide security policies, and oversee overall network infrastructure.'}
          </p>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 relative z-10">
        <Link
          to="/"
          className={`absolute top-8 left-8 text-[13px] ${textMuted} hover:${textMain} transition-colors flex items-center gap-1.5`}
        >
          &larr; Back to home
        </Link>

        <div className={`w-full max-w-sm ${cardBg} backdrop-blur-xl rounded-2xl p-8 border ${borderSubtle} transition-colors duration-500 shadow-2xl`}>
          <div className="mb-6">
            <h1 className="font-semibold tracking-tight text-[26px] mb-2">Register</h1>
            <p className={`${textMuted} text-[14px] transition-colors duration-500`}>Create your account to access the console.</p>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className={`block ${textMain} text-[13px] font-medium mb-1.5 transition-colors duration-500`} htmlFor="fullName">
                Full name
              </label>
              <input
                id="fullName"
                type="text"
                className={`w-full px-3.5 py-2.5 rounded-lg ${inputBg} ${textMain} border ${inputBorder} focus:outline-none transition-colors duration-300 text-[14px]`}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>

            <div>
              <label className={`block ${textMain} text-[13px] font-medium mb-1.5 transition-colors duration-500`} htmlFor="username">
                Username
              </label>
              <input
                id="username"
                type="text"
                className={`w-full px-3.5 py-2.5 rounded-lg ${inputBg} ${textMain} border ${inputBorder} focus:outline-none transition-colors duration-300 text-[14px]`}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            <div>
              <label className={`block ${textMain} text-[13px] font-medium mb-1.5 transition-colors duration-500`} htmlFor="email">
                Email address
              </label>
              <input
                id="email"
                type="email"
                className={`w-full px-3.5 py-2.5 rounded-lg ${inputBg} ${textMain} border ${inputBorder} focus:outline-none transition-colors duration-300 text-[14px]`}
                placeholder="analyst@netshield.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={`block ${textMain} text-[13px] font-medium mb-1.5 transition-colors duration-500`} htmlFor="password">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  className={`w-full px-3.5 py-2.5 rounded-lg ${inputBg} ${textMain} border ${inputBorder} focus:outline-none transition-colors duration-300 text-[14px]`}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className={`block ${textMain} text-[13px] font-medium mb-1.5 transition-colors duration-500`} htmlFor="confirmPassword">
                  Confirm
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  className={`w-full px-3.5 py-2.5 rounded-lg ${inputBg} ${textMain} border ${inputBorder} focus:outline-none transition-colors duration-300 text-[14px]`}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label className={`block ${textMain} text-[13px] font-medium mb-2 transition-colors duration-500`}>Role</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRole('analyst')}
                  className={`py-2.5 rounded-lg text-[13px] font-medium border transition-all active:scale-[0.97] ${role === 'analyst' ? roleActive : roleInactive}`}
                >
                  Security Analyst
                </button>
                <button
                  type="button"
                  onClick={() => setRole('administrator')}
                  className={`py-2.5 rounded-lg text-[13px] font-medium border transition-all active:scale-[0.97] ${role === 'administrator' ? roleActive : roleInactive}`}
                >
                  Administrator
                </button>
              </div>
            </div>

            {error && <p className="text-red-500 text-[13px]">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className={`w-full ${btnPrimaryBg} text-[14px] font-medium py-2.5 rounded-lg active:scale-[0.97] transition-all duration-200 mt-2 disabled:opacity-50`}
            >
              {loading ? 'Registering...' : 'Register'}
            </button>
          </form>

          <p className={`text-center ${textMuted} text-[13px] mt-6 transition-colors duration-500`}>
            Already have an account?{' '}
            <Link to="/login" className={`${textMain} hover:underline font-medium`}>
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;