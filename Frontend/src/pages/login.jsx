import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import NetworkField from '../components/NetworkField';
import { authAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
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
      
      // Passes the access token and full user object (including role) to AuthContext
      login(data.access_token, data.user);
      
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Cannot connect to server. Is FastAPI running?');
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
      <div className="hidden lg:flex lg:w-[55%] relative z-10 border-r border-white/[0.07] items-center justify-center bg-[#0A0A0B]/40 backdrop-blur-[2px]">
        <div className="px-10">
          <div className="flex items-center gap-2.5 mb-8">
            <div className="w-1.5 h-1.5 rounded-full bg-white" />
            <span className="font-semibold tracking-tight text-[15px]">NetShield AI</span>
          </div>
          <h2 className="font-semibold tracking-tight text-[28px] leading-[1.15] mb-4">
            Network monitoring, read the way an analyst would.
          </h2>
          <p className="text-[#9A9A97] text-[14px] leading-relaxed max-w-sm">
            Sign in to view live traffic, review flagged anomalies, and respond
            to alerts from your security operations dashboard.
          </p>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 relative z-10">
        <Link
          to="/"
          className="absolute top-8 left-8 text-[13px] text-[#9A9A97] hover:text-white transition-colors flex items-center gap-1.5"
        >
          &larr; Back to home
        </Link>

        <div className="w-full max-w-sm bg-[#0A0A0B]/35 backdrop-blur-sm rounded-2xl p-8 border border-white/[0.07]">
          <div className="mb-8">
            <h1 className="font-semibold tracking-tight text-[26px] mb-2">Log in</h1>
            <p className="text-[#9A9A97] text-[14px]">Enter your credentials to access the console.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
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
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {error && <p className="text-red-400 text-[13px]">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-white text-[#0A0A0B] text-[14px] font-medium py-2.5 rounded-lg hover:bg-[#E5E5E2] transition-colors mt-2 disabled:opacity-50"
            >
              {loading ? 'Logging in...' : 'Log in'}
            </button>
          </form>

          <p className="text-center text-[#9A9A97] text-[13px] mt-8">
            Don&apos;t have an account?{' '}
            <Link to="/register" className="text-white hover:underline">
              Register
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;