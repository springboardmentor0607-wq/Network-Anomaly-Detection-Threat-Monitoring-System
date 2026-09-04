import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../services/api';
import { ShieldAlert, Lock, Mail, User, ArrowRight } from 'lucide-react';

const Register = () => {
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [department, setDepartment] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [role, setRole] = useState('analyst');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await API.post('/auth/register', {
        full_name: fullName,
        email,
        phone_number: phoneNumber,
        department,
        employee_id: employeeId,
        role,
        password
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
        'Registration failed'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#070b14] p-6">

      <div className="w-full max-w-lg bg-[#0d1527] border border-[#1b2a4a] rounded-2xl p-8 shadow-2xl">

        {/* Header */}
        <div className="text-center mb-7">

          <div className="inline-flex p-3 bg-cyan-500/10 rounded-xl border border-cyan-500/30 mb-3">
            <ShieldAlert className="w-8 h-8 text-cyan-400" />
          </div>

          <h1 className="text-2xl font-bold text-white">
            NetShield <span className="text-cyan-400">AI</span>
          </h1>

          <p className="text-xs text-slate-400 mt-2">
            Request Security Operations Access
          </p>

        </div>

        {/* Error */}
        {error && (
          <div className="mb-5 p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Full Name */}
          <div>
            <label className="text-xs font-semibold text-slate-300">
              Full Name
            </label>

            <div className="flex items-center gap-2 bg-[#070b14] border border-[#1b2a4a] px-3 py-2.5 rounded-xl mt-1">
              <User className="w-4 h-4 text-slate-500" />

              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                placeholder="Enter full name"
                className="bg-transparent text-sm text-white outline-none w-full"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="text-xs font-semibold text-slate-300">
              Email Address
            </label>

            <div className="flex items-center gap-2 bg-[#070b14] border border-[#1b2a4a] px-3 py-2.5 rounded-xl mt-1">
              <Mail className="w-4 h-4 text-slate-500" />

              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="Enter email"
                className="bg-transparent text-sm text-white outline-none w-full"
              />
            </div>
          </div>

          {/* Phone */}
          <div>
            <label className="text-xs font-semibold text-slate-300">
              Phone Number
            </label>

            <input
              type="text"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="Enter phone number"
              className="w-full mt-1 bg-[#070b14] border border-[#1b2a4a] px-3 py-2.5 rounded-xl text-sm text-white outline-none"
            />
          </div>

          {/* Department + Employee ID */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            <div>
              <label className="text-xs font-semibold text-slate-300">
                Department
              </label>

              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="Security"
                className="w-full mt-1 bg-[#070b14] border border-[#1b2a4a] px-3 py-2.5 rounded-xl text-sm text-white outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300">
                Employee ID
              </label>

              <input
                type="text"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                placeholder="Employee ID"
                className="w-full mt-1 bg-[#070b14] border border-[#1b2a4a] px-3 py-2.5 rounded-xl text-sm text-white outline-none"
              />
            </div>

          </div>

          {/* Role */}
          <div>
            <label className="text-xs font-semibold text-slate-300">
              Access Role
            </label>

            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full mt-1 bg-[#070b14] border border-[#1b2a4a] px-3 py-2.5 rounded-xl text-sm text-white outline-none"
            >
              <option value="analyst">Security Analyst</option>
              <option value="admin">Security Administrator</option>
            </select>
          </div>

          {/* Password */}
          <div>
            <label className="text-xs font-semibold text-slate-300">
              Password
            </label>

            <div className="flex items-center gap-2 bg-[#070b14] border border-[#1b2a4a] px-3 py-2.5 rounded-xl mt-1">
              <Lock className="w-4 h-4 text-slate-500" />

              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                placeholder="Create password"
                className="bg-transparent text-sm text-white outline-none w-full"
              />
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-cyan-400 hover:bg-cyan-300 disabled:opacity-60 text-[#070b14] font-bold py-3 rounded-xl transition mt-5"
          >
            {loading ? 'Creating Account...' : 'Request Access'}

            {!loading && (
              <ArrowRight className="w-4 h-4" />
            )}
          </button>

        </form>

        {/* Login */}
        <div className="text-center text-sm text-slate-400 mt-6">
          Already have an account?{' '}

          <Link
            to="/login"
            className="text-cyan-400 hover:text-cyan-300 font-semibold"
          >
            Sign In
          </Link>
        </div>

      </div>

    </div>
  );
};

export default Register;