import { Link } from 'react-router-dom';

export default function AccessDenied() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex min-h-screen max-w-4xl items-center justify-center px-4 py-6 sm:px-6 lg:px-8">
        <div className="w-full rounded-3xl border border-slate-800 bg-slate-900/70 p-8 text-center shadow-2xl shadow-blue-950/30 backdrop-blur">
          <p className="text-sm uppercase tracking-[0.35em] text-blue-400">Access Denied</p>
          <h1 className="mt-3 text-2xl font-semibold text-white">You do not have permission to view this page.</h1>
          <p className="mt-3 text-sm text-slate-400">This area is restricted to Security Administrators only.</p>
          <div className="mt-6 flex justify-center gap-3">
            <Link to="/dashboard" className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 transition hover:border-slate-600 hover:text-white">Return to Dashboard</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
