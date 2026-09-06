import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

// ── Password strength bar ──────────────────────────────────────────────────
function PasswordStrengthBar({ password }) {
  const getStrength = (pw) => {
    if (!pw) return { score: 0, label: '', color: '' };
    let score = 0;
    if (pw.length >= 8) score++;
    if (pw.length >= 12) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    if (score <= 1) return { score, label: 'Weak', color: '#ef4444' };
    if (score <= 2) return { score, label: 'Fair', color: '#f59e0b' };
    if (score <= 3) return { score, label: 'Good', color: '#3b82f6' };
    return { score, label: 'Strong', color: '#10b981' };
  };
  const { score, label, color } = getStrength(password);
  if (!password) return null;
  return (
    <div className="mt-1.5">
      <div className="flex gap-1 mb-1">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-1.5 flex-1 rounded-full transition-all duration-300"
            style={{ backgroundColor: i <= score ? color : 'var(--border-primary)' }}
          />
        ))}
      </div>
      <p className="text-xs" style={{ color }}>{label} password</p>
    </div>
  );
}

// ── Profile info row ───────────────────────────────────────────────────────
function ProfileRow({ icon, label, value }) {
  return (
    <div
      className="flex items-center gap-4 rounded-2xl border p-4"
      style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}
    >
      <span className="text-xl w-8 text-center flex-shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wider mb-0.5" style={{ color: 'var(--text-muted)' }}>
          {label}
        </p>
        <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-heading)' }}>
          {value || <span style={{ color: 'var(--text-muted)' }}>Not available</span>}
        </p>
      </div>
    </div>
  );
}

// ── Main Settings Page ─────────────────────────────────────────────────────
export default function Settings() {
  const { user, logout } = useAuth();
  const { isDark } = useTheme();
  const isAdmin = user?.role === 'Security Administrator';

  // Profile data
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState('');

  // Change Password state
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showPasswords, setShowPasswords] = useState(false);
  const [pwForm, setPwForm] = useState({ current_password: '', new_password: '', confirm_password: '' });
  const [pwLoading, setPwLoading] = useState(false);
  const [pwSuccess, setPwSuccess] = useState('');
  const [pwError, setPwError] = useState('');
  const [passwordChanged, setPasswordChanged] = useState(false);

  // Load profile from /auth/me
  useEffect(() => {
    const loadProfile = async () => {
      setProfileLoading(true);
      try {
        const res = await api.get('/auth/me');
        setProfile(res.data);
      } catch (err) {
        setProfileError(err?.response?.data?.detail || 'Unable to load profile.');
      } finally {
        setProfileLoading(false);
      }
    };
    loadProfile();
  }, []);

  const details = profile || user || {};

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric',
      });
    } catch { return dateStr; }
  };

  // ── Change Password handler ────────────────────────────────────────────
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPwError('');
    setPwSuccess('');

    if (!pwForm.current_password) { setPwError('Current password is required.'); return; }
    if (pwForm.new_password.length < 8) { setPwError('New password must be at least 8 characters.'); return; }
    if (pwForm.new_password !== pwForm.confirm_password) { setPwError('New password and confirmation do not match.'); return; }
    if (pwForm.current_password === pwForm.new_password) { setPwError('New password must be different from your current password.'); return; }

    setPwLoading(true);
    try {
      const res = await api.post('/auth/change-password', {
        current_password: pwForm.current_password,
        new_password: pwForm.new_password,
        confirm_password: pwForm.confirm_password,
      });
      setPwSuccess(res.data?.message || 'Password updated successfully.');
      setPwForm({ current_password: '', new_password: '', confirm_password: '' });
      setPasswordChanged(true);
    } catch (err) {
      const detail = err?.response?.data?.detail;
      setPwError(Array.isArray(detail) ? detail.map((d) => d.msg).join('; ') : (detail || 'Failed to update password.'));
    } finally {
      setPwLoading(false);
    }
  };

  const inputStyle = {
    width: '100%',
    backgroundColor: 'var(--bg-input)',
    border: '1px solid var(--border-primary)',
    color: 'var(--text-primary)',
    borderRadius: '0.75rem',
    padding: '0.625rem 0.875rem',
    fontSize: '0.875rem',
    outline: 'none',
  };

  const roleColor = isAdmin
    ? { bg: 'var(--accent-blue-bg)', text: 'var(--accent-blue)', border: 'var(--border-accent)' }
    : { bg: 'rgba(16,185,129,0.15)', text: 'var(--status-success)', border: 'rgba(16,185,129,0.3)' };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      <div className="mx-auto flex min-h-screen max-w-3xl flex-col px-4 py-6 sm:px-6 lg:px-8">

        {/* ── Page Header ── */}
        <header
          className="mb-6 rounded-3xl border p-5 shadow-xl backdrop-blur"
          style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-primary)' }}
        >
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-blue-400">
                {isAdmin ? 'Administrator Settings' : 'Account Settings'}
              </p>
              <h1 className="mt-2 text-2xl font-bold" style={{ color: 'var(--text-heading)' }}>
                {isAdmin ? 'Profile & Settings' : 'My Profile & Settings'}
              </h1>
              <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
                {isAdmin
                  ? 'Manage your administrator account and password.'
                  : 'View your account details and manage your password.'}
              </p>
            </div>
            <Link
              to="/dashboard"
              className="self-start rounded-xl border px-4 py-2 text-sm font-medium transition hover:bg-blue-600 hover:text-white hover:border-blue-600"
              style={{ borderColor: 'var(--border-primary)', color: 'var(--text-label)' }}
            >
              ← Dashboard
            </Link>
          </div>
        </header>

        {profileError && (
          <div className="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-400">
            ⚠️ {profileError}
          </div>
        )}

        {profileLoading ? (
          <div
            className="flex flex-col items-center justify-center rounded-3xl border p-16 gap-3"
            style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-primary)' }}
          >
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
            <p style={{ color: 'var(--text-secondary)' }}>Loading profile…</p>
          </div>
        ) : (
          <div className="space-y-5">

            {/* ── Account Profile ── */}
            <section
              className="rounded-3xl border p-6 shadow-xl"
              style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-primary)' }}
            >
              {/* Avatar row */}
              <div
                className="flex items-center gap-4 mb-5 pb-5 border-b"
                style={{ borderColor: 'var(--border-primary)' }}
              >
                <div
                  className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl text-xl font-bold shadow-lg"
                  style={{ background: 'linear-gradient(135deg, var(--accent-blue), #7c3aed)', color: '#fff' }}
                >
                  {(details.full_name || details.email || '?').charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-lg font-bold" style={{ color: 'var(--text-heading)' }}>
                    {details.full_name || 'Unknown User'}
                  </h2>
                  <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                    {details.email}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span
                      className="rounded-full border px-3 py-0.5 text-xs font-bold uppercase"
                      style={{ backgroundColor: roleColor.bg, color: roleColor.text, borderColor: roleColor.border }}
                    >
                      {details.role}
                    </span>
                    <span
                      className="rounded-full border px-3 py-0.5 text-xs font-bold uppercase"
                      style={
                        details.is_active !== false
                          ? { backgroundColor: 'rgba(16,185,129,0.12)', color: '#059669', borderColor: 'rgba(16,185,129,0.3)' }
                          : { backgroundColor: 'rgba(239,68,68,0.12)', color: '#dc2626', borderColor: 'rgba(239,68,68,0.3)' }
                      }
                    >
                      {details.is_active !== false ? '✓ Active' : '✗ Inactive'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Profile info grid — no gender */}
              <div className="grid gap-3 sm:grid-cols-2">
                <ProfileRow icon="👤" label="Full Name" value={details.full_name} />
                <ProfileRow icon="✉️" label="Email Address" value={details.email} />
                <ProfileRow icon="🎭" label="Role" value={details.role} />
                <ProfileRow icon="📅" label="Member Since" value={formatDate(details.created_at)} />
              </div>
            </section>

            {/* ── Change Password ── */}
            <section
              className="rounded-3xl border p-6 shadow-xl"
              style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-primary)' }}
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-base font-bold" style={{ color: 'var(--text-heading)' }}>
                    🔐 Change Password
                  </h2>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                    Update your account password
                  </p>
                </div>
                {!showPasswordForm && !pwSuccess && (
                  <button
                    type="button"
                    id="open-change-password-btn"
                    onClick={() => { setShowPasswordForm(true); setPwError(''); setPwSuccess(''); }}
                    className="rounded-xl border px-4 py-2 text-sm font-semibold transition hover:bg-blue-600 hover:text-white hover:border-blue-600"
                    style={{ borderColor: 'var(--border-secondary)', color: 'var(--text-label)', backgroundColor: 'var(--bg-card)' }}
                  >
                    Change Password
                  </button>
                )}
              </div>

              {/* Success state */}
              {pwSuccess && (
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-4 text-sm">
                  <p className="font-semibold text-emerald-400">✅ {pwSuccess}</p>
                  {passwordChanged && (
                    <div className="mt-3 flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={logout}
                        className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-500 transition"
                      >
                        Log Out Now
                      </button>
                      <button
                        type="button"
                        onClick={() => { setPwSuccess(''); setPasswordChanged(false); setShowPasswordForm(false); }}
                        className="rounded-xl border px-4 py-2 text-xs font-semibold transition"
                        style={{ borderColor: 'var(--border-secondary)', color: 'var(--text-label)', backgroundColor: 'var(--bg-card)' }}
                      >
                        Stay Logged In
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Password form */}
              {showPasswordForm && !pwSuccess && (
                <form onSubmit={handlePasswordSubmit} className="space-y-4" id="settings-change-password-form">
                  {pwError && (
                    <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-400">
                      ⚠️ {pwError}
                    </div>
                  )}

                  {/* Show passwords toggle */}
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={showPasswords}
                      onChange={(e) => setShowPasswords(e.target.checked)}
                      className="rounded"
                    />
                    <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Show passwords</span>
                  </label>

                  {/* Current Password */}
                  <div>
                    <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text-label)' }}>
                      Current Password
                    </label>
                    <input
                      id="settings-current-password"
                      type={showPasswords ? 'text' : 'password'}
                      value={pwForm.current_password}
                      onChange={(e) => setPwForm((f) => ({ ...f, current_password: e.target.value }))}
                      placeholder="Enter your current password"
                      required
                      style={inputStyle}
                      autoComplete="current-password"
                    />
                  </div>

                  {/* New Password */}
                  <div>
                    <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text-label)' }}>
                      New Password
                    </label>
                    <input
                      id="settings-new-password"
                      type={showPasswords ? 'text' : 'password'}
                      value={pwForm.new_password}
                      onChange={(e) => setPwForm((f) => ({ ...f, new_password: e.target.value }))}
                      placeholder="Minimum 8 characters"
                      required
                      minLength={8}
                      style={inputStyle}
                      autoComplete="new-password"
                    />
                    <PasswordStrengthBar password={pwForm.new_password} />
                  </div>

                  {/* Confirm New Password */}
                  <div>
                    <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text-label)' }}>
                      Confirm New Password
                    </label>
                    <input
                      id="settings-confirm-password"
                      type={showPasswords ? 'text' : 'password'}
                      value={pwForm.confirm_password}
                      onChange={(e) => setPwForm((f) => ({ ...f, confirm_password: e.target.value }))}
                      placeholder="Re-enter your new password"
                      required
                      minLength={8}
                      style={inputStyle}
                      autoComplete="new-password"
                    />
                    {pwForm.confirm_password && pwForm.new_password && (
                      <p
                        className="mt-1.5 text-xs"
                        style={{
                          color: pwForm.new_password === pwForm.confirm_password
                            ? 'var(--status-success)' : 'var(--status-danger)',
                        }}
                      >
                        {pwForm.new_password === pwForm.confirm_password ? '✓ Passwords match' : '✗ Passwords do not match'}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-3 pt-1">
                    <button
                      type="submit"
                      id="settings-submit-password-btn"
                      disabled={pwLoading}
                      className="rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {pwLoading ? (
                        <span className="flex items-center gap-2">
                          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          Updating…
                        </span>
                      ) : 'Update Password'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowPasswordForm(false);
                        setPwForm({ current_password: '', new_password: '', confirm_password: '' });
                        setPwError('');
                      }}
                      className="rounded-xl border px-6 py-2.5 text-sm font-semibold transition"
                      style={{ borderColor: 'var(--border-secondary)', color: 'var(--text-label)', backgroundColor: 'var(--bg-card)' }}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </section>

            {/* ── Quick Links ── */}
            <section
              className="rounded-3xl border p-5 shadow-xl"
              style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-primary)' }}
            >
              <h2 className="text-sm font-bold mb-3" style={{ color: 'var(--text-heading)' }}>
                Quick Navigation
              </h2>
              <div className="flex flex-wrap gap-2">
                <Link
                  to="/dashboard"
                  className="rounded-xl border px-4 py-2 text-xs font-semibold transition hover:bg-blue-600 hover:text-white hover:border-blue-600"
                  style={{ borderColor: 'var(--border-primary)', color: 'var(--text-label)', backgroundColor: 'var(--bg-card)' }}
                >
                  🏠 Dashboard
                </Link>
                <Link
                  to="/incidents"
                  className="rounded-xl border px-4 py-2 text-xs font-semibold transition hover:bg-blue-600 hover:text-white hover:border-blue-600"
                  style={{ borderColor: 'var(--border-primary)', color: 'var(--text-label)', backgroundColor: 'var(--bg-card)' }}
                >
                  🛡️ {isAdmin ? 'All Incidents' : 'My Incidents'}
                </Link>
                <Link
                  to="/reports"
                  className="rounded-xl border px-4 py-2 text-xs font-semibold transition hover:bg-blue-600 hover:text-white hover:border-blue-600"
                  style={{ borderColor: 'var(--border-primary)', color: 'var(--text-label)', backgroundColor: 'var(--bg-card)' }}
                >
                  📊 Reports
                </Link>
                {isAdmin && (
                  <>
                    <Link
                      to="/user-management"
                      className="rounded-xl border px-4 py-2 text-xs font-semibold transition hover:bg-blue-600 hover:text-white hover:border-blue-600"
                      style={{ borderColor: 'var(--border-primary)', color: 'var(--text-label)', backgroundColor: 'var(--bg-card)' }}
                    >
                      👥 User Management
                    </Link>
                    <Link
                      to="/audit-logs"
                      className="rounded-xl border px-4 py-2 text-xs font-semibold transition hover:bg-blue-600 hover:text-white hover:border-blue-600"
                      style={{ borderColor: 'var(--border-primary)', color: 'var(--text-label)', backgroundColor: 'var(--bg-card)' }}
                    >
                      📋 Audit Logs
                    </Link>
                  </>
                )}
                <button
                  type="button"
                  onClick={logout}
                  className="rounded-xl border px-4 py-2 text-xs font-semibold transition hover:bg-rose-600 hover:text-white hover:border-rose-600"
                  style={{ borderColor: 'var(--border-primary)', color: 'var(--text-label)', backgroundColor: 'var(--bg-card)' }}
                >
                  🚪 Sign Out
                </button>
              </div>
            </section>

          </div>
        )}
      </div>
    </div>
  );
}
