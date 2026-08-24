import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Settings() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'Security Administrator';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex min-h-screen max-w-4xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <header className="mb-6 rounded-3xl border border-slate-800 bg-slate-900/70 p-5 shadow-2xl shadow-blue-950/30 backdrop-blur">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-blue-400">Settings</p>
              <h1 className="mt-2 text-2xl font-semibold text-white">
                {isAdmin ? 'Administrative settings' : 'User settings'}
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-400">
                {isAdmin
                  ? 'Configure system and operational settings for the Security Administrator.'
                  : 'Review your account preferences and user-level settings for the Security Analyst.'}
              </p>
            </div>
            <Link to="/dashboard" className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300 transition hover:border-slate-600 hover:text-white">Back to Dashboard</Link>
          </div>
        </header>

        <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5">
          <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-300">
            Settings access remains restricted to administrators, while analysts are kept out of this space.
          </div>
        </section>
      </div>
    </div>
  );
}
