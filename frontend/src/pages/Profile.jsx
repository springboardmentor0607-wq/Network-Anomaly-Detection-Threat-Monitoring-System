import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Profile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      try {
        const response = await api.get('/auth/me');
        setProfile(response.data);
        setError('');
      } catch (err) {
        setError(err?.response?.data?.detail || 'Unable to load profile details.');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const details = profile || user || {};

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex min-h-screen max-w-4xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <header className="mb-6 rounded-3xl border border-slate-800 bg-slate-900/70 p-5 shadow-2xl shadow-blue-950/30 backdrop-blur">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-blue-400">Profile</p>
              <h1 className="mt-2 text-2xl font-semibold text-white">Logged-in user details</h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-400">Review the authenticated account profile pulled from the backend API.</p>
            </div>
            <Link to="/dashboard" className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300 transition hover:border-slate-600 hover:text-white">Back to Dashboard</Link>
          </div>
        </header>

        {error ? <div className="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">{error}</div> : null}

        <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5">
          {loading ? (
            <p className="text-slate-300">Loading profile…</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                <p className="text-sm text-slate-400">Full Name</p>
                <p className="mt-2 text-lg font-semibold text-white">{details.full_name || 'Unavailable'}</p>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                <p className="text-sm text-slate-400">Email</p>
                <p className="mt-2 text-lg font-semibold text-white">{details.email || 'Unavailable'}</p>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                <p className="text-sm text-slate-400">Role</p>
                <p className="mt-2 text-lg font-semibold text-white">{details.role || 'Unavailable'}</p>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                <p className="text-sm text-slate-400">Status</p>
                <p className="mt-2 text-lg font-semibold text-white">{details.is_active ? 'Active' : 'Inactive'}</p>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
