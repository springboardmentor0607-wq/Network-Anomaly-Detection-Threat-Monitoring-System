import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import {
  Shield,
  Users,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
} from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();

  const [accessLevel, setAccessLevel] = useState('analyst');
  const [email, setEmail] = useState('analyst@netshield.ai');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError('');
    setLoading(true);

    try {
      const res = await API.post('/auth/login', {
        email,
        password,
      });

      localStorage.setItem(
        'netshield_token',
        res.data.access_token
      );

      localStorage.setItem(
        'netshield_user',
        JSON.stringify(res.data.user)
      );

      navigate('/');
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          'Invalid email or password'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050914] flex items-center justify-center px-4 py-8">

      <div className="w-full max-w-[680px]">

        <div className="rounded-[22px] border border-[#1d2a42] bg-[#070d1c] px-10 py-10 shadow-2xl">

          {/* LOGO */}
          <div className="flex flex-col items-center">

            <div className="w-[72px] h-[72px] rounded-[20px] bg-black flex items-center justify-center mb-4">
              <Shield
                className="w-11 h-11 text-cyan-400"
                strokeWidth={2}
              />
            </div>

            <h1 className="text-[30px] font-bold text-white">
              NetShield{' '}
              <span className="text-cyan-400">
                AI
              </span>
            </h1>

            <p className="text-slate-400 text-sm mt-1">
              AI Security Operations
            </p>

          </div>

          {/* WELCOME */}
          <div className="text-center mt-8 mb-8">

            <h2 className="text-[32px] font-bold text-white">
              Welcome Back
            </h2>

            <p className="text-slate-400 mt-2">
              Sign in to access your security operations dashboard
            </p>

          </div>

          {/* ACCESS LEVEL */}
          <div className="mb-7">

            <label className="block text-sm font-bold text-slate-200 uppercase mb-3">
              Access Level
            </label>

            <div className="grid grid-cols-2 gap-3">

              {/* SECURITY ANALYST */}
              <button
                type="button"
                onClick={() => setAccessLevel('analyst')}
                className={`h-[62px] rounded-xl border flex items-center justify-center gap-3 transition ${
                  accessLevel === 'analyst'
                    ? 'border-cyan-400 bg-cyan-400/10 text-cyan-400'
                    : 'border-[#1d2a42] bg-[#080f20] text-slate-400'
                }`}
              >

                <Users className="w-5 h-5" />

                <span className="font-semibold">
                  Security Analyst
                </span>

              </button>

              {/* SECURITY ADMINISTRATOR */}
              <button
                type="button"
                onClick={() =>
                  setAccessLevel('administrator')
                }
                className={`h-[62px] rounded-xl border flex items-center justify-center gap-3 transition ${
                  accessLevel === 'administrator'
                    ? 'border-cyan-400 bg-cyan-400/10 text-cyan-400'
                    : 'border-[#1d2a42] bg-[#080f20] text-slate-400'
                }`}
              >

                <Shield className="w-5 h-5" />

                <span className="font-semibold">
                  Security Administrator
                </span>

              </button>

            </div>
          </div>

          {/* ERROR */}
          {error && (
            <div className="mb-5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          {/* FORM */}
          <form onSubmit={handleSubmit}>

            {/* EMAIL */}
            <div className="mb-5">

              <label className="block text-sm font-bold text-slate-200 uppercase mb-2">
                Email Address
              </label>

              <div className="flex items-center gap-3 h-[62px] rounded-xl border border-[#1d2a42] bg-[#080f20] px-4">

                <Mail className="w-5 h-5 text-slate-400" />

                <input
                  type="email"
                  value={email}
                  onChange={(e) =>
                    setEmail(e.target.value)
                  }
                  required
                  className="w-full bg-transparent outline-none text-white placeholder:text-slate-600"
                  placeholder="Enter your email"
                />

              </div>

            </div>

            {/* PASSWORD */}
            <div className="mb-5">

              <label className="block text-sm font-bold text-slate-200 uppercase mb-2">
                Password
              </label>

              <div className="flex items-center gap-3 h-[62px] rounded-xl border border-[#1d2a42] bg-[#080f20] px-4">

                <Lock className="w-5 h-5 text-slate-400" />

                <input
                  type={
                    showPassword
                      ? 'text'
                      : 'password'
                  }
                  value={password}
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
                  required
                  className="w-full bg-transparent outline-none text-white placeholder:text-slate-600"
                  placeholder="Enter your password"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(!showPassword)
                  }
                  className="text-slate-400 hover:text-cyan-400"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>

              </div>

            </div>

            {/* REMEMBER / FORGOT */}
            <div className="flex items-center justify-between mb-7">

              <label className="flex items-center gap-3 text-sm text-slate-300">

                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) =>
                    setRememberMe(e.target.checked)
                  }
                  className="w-5 h-5 accent-cyan-400"
                />

                Remember me

              </label>

              <button
                type="button"
                onClick={() =>
                  setError(
                    'Please contact your administrator to reset your password.'
                  )
                }
                className="text-cyan-400 text-sm font-semibold"
              >
                Forgot Password?
              </button>

            </div>

            {/* SIGN IN */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-[64px] rounded-xl bg-cyan-400 hover:bg-cyan-300 text-[#04101b] font-bold text-lg flex items-center justify-center gap-3 transition disabled:opacity-60"
            >

              {loading
                ? 'Signing In...'
                : 'Sign In'}

              {!loading && (
                <ArrowRight className="w-5 h-5" />
              )}

            </button>

          </form>

          {/* OR */}
          <div className="flex items-center gap-4 my-7">

            <div className="flex-1 h-px bg-[#1d2a42]" />

            <span className="text-slate-500 text-sm">
              OR
            </span>

            <div className="flex-1 h-px bg-[#1d2a42]" />

          </div>

          {/* GOOGLE */}
          <button
            type="button"
            onClick={() =>
              setError(
                'Google authentication is not configured yet.'
              )
            }
            className="w-full h-[62px] rounded-xl border border-[#1d2a42] bg-[#080f20] text-white font-semibold flex items-center justify-center gap-3"
          >

            <span className="text-lg font-bold">
              G
            </span>

            Sign in with Google

          </button>

          {/* REQUEST CLEARANCE */}
          <div className="text-center mt-7 text-sm text-slate-400">

            Don't have an account?{' '}

            <button
              type="button"
              onClick={() =>
                setError(
                  'Please contact your security administrator for account clearance.'
                )
              }
              className="text-cyan-400 font-semibold"
            >
              Request clearance
            </button>

          </div>

        </div>
      </div>
    </div>
  );
};

export default Login;