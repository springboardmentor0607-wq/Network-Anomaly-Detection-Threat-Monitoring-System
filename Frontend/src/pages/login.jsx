import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import NetworkField from '../components/NetworkField';
import { authAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  
  // Theme sync with localStorage
  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem('theme') !== 'light';
  });

  useEffect(() => {
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await authAPI.login({ email, password });
      console.log("LOGIN API RESPONSE:", data); // <-- Check your browser console to see what fields come back!
      
      // Safely handle token extraction whether it's access_token or token
      const token = data.access_token || data.token;
      const user = data.user || data.account;

      if (!token) {
        throw new Error("Authentication token missing from server response.");
      }

      login(token, user);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Cannot connect to server. Is FastAPI running?');
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

  return (
    <div className={`min-h-screen ${bgMain} ${textMain} relative overflow-hidden flex transition-colors duration-500 ease-in-out`}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        * { font-family: 'Inter', sans-serif; }
      `}</style>

      <NetworkField isDark={isDark} />

      {/* Theme Toggle Button (Absolute Top Right) */}
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
      <div className={`hidden lg:flex lg:w-[55%] relative z-10 border-r ${borderSubtle} items-center justify-center ${panelBg} backdrop-blur-[4px] transition-colors duration-500`}>
        <div className="px-10">
          <div className="flex items-center gap-2.5 mb-8">
            <div className={`w-1.5 h-1.5 rounded-full ${dotColor} transition-colors duration-500`} />
            <span className="font-semibold tracking-tight text-[15px]">NetShield AI</span>
          </div>
          <h2 className="font-semibold tracking-tight text-[28px] leading-[1.15] mb-4">
            Network monitoring, read the way an analyst would.
          </h2>
          <p className={`${textMuted} text-[14px] leading-relaxed max-w-sm transition-colors duration-500`}>
            Sign in to view live traffic, review flagged anomalies, and respond
            to alerts from your security operations dashboard.
          </p>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 relative z-10">
        <Link
          to="/"
          className={`absolute top-8 left-8 text-[13px] ${textMuted} hover:${textMain} transition-colors flex items-center gap-1.5`}
        >
          &larr; Back to home
        </Link>

        <div className={`w-full max-w-sm ${cardBg} backdrop-blur-xl rounded-2xl p-8 border ${borderSubtle} transition-colors duration-500 shadow-2xl`}>
          <div className="mb-8">
            <h1 className="font-semibold tracking-tight text-[26px] mb-2">Log in</h1>
            <p className={`${textMuted} text-[14px] transition-colors duration-500`}>Enter your credentials to access the console.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className={`block ${textMain} text-[13px] font-medium mb-2 transition-colors duration-500`} htmlFor="email">
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

            <div>
              <label className={`block ${textMain} text-[13px] font-medium mb-2 transition-colors duration-500`} htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                className={`w-full px-3.5 py-2.5 rounded-lg ${inputBg} ${textMain} border ${inputBorder} focus:outline-none transition-colors duration-300 text-[14px]`}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {error && <p className="text-red-500 text-[13px]">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className={`w-full ${btnPrimaryBg} text-[14px] font-medium py-2.5 rounded-lg active:scale-[0.97] transition-all duration-200 mt-2 disabled:opacity-50`}
            >
              {loading ? 'Logging in...' : 'Log in'}
            </button>
          </form>

          <p className={`text-center ${textMuted} text-[13px] mt-8 transition-colors duration-500`}>
            Don&apos;t have an account?{' '}
            <Link to="/register" className={`${textMain} hover:underline font-medium`}>
              Register
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;