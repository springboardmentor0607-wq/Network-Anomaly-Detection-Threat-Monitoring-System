import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

// ─── Password strength indicator ────────────────────────────────────────────
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
            style={{
              backgroundColor: i <= score ? color : 'var(--border-primary)',
            }}
          />
        ))}
      </div>
      <p className="text-xs" style={{ color }}>
        Password strength: {label}
      </p>
    </div>
  );
}

// ─── Info Card ───────────────────────────────────────────────────────────────
function InfoCard({ label, value, icon }) {
  return (
    <div
      className="rounded-2xl p-4 border"
      style={{
        backgroundColor: 'var(--bg-card)',
        borderColor: 'var(--border-primary)',
      }}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="text-base">{icon}</span>
        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
          {label}
        </p>
      </div>
      <p className="text-base font-semibold" style={{ color: 'var(--text-heading)' }}>
        {value || <span style={{ color: 'var(--text-muted)' }}>Not available</span>}
      </p>
    </div>
  );
}

// ─── Main Profile Page ───────────────────────────────────────────────────────
export default function Profile() {
  const { user, logout } = useAuth();
  const { isDark } = useTheme();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Change Password form state
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [pwForm, setPwForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [pwLoading, setPwLoading] = useState(false);
  const [pwSuccess, setPwSuccess] = useState('');
  const [pwError, setPwError] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [passwordChanged, setPasswordChanged] = useState(false);

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

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  const roleColor = details.role === 'Security Administrator'
    ? { bg: 'var(--accent-blue-bg)', text: 'var(--accent-blue)', border: 'var(--border-accent)' }
    : { bg: 'rgba(16,185,129,0.15)', text: 'var(--status-success)', border: 'rgba(16,185,129,0.3)' };

  // ─── Change Password Handler ────────────────────────────────────────────
  const handlePwSubmit = async (e) => {
    e.preventDefault();
    setPwError('');
    setPwSuccess('');

    // Client-side validation
    if (!pwForm.current_password) {
      setPwError('Current password is required.');
      return;
    }
    if (pwForm.new_password.length < 8) {
      setPwError('New password must be at least 8 characters.');
      return;
    }
    if (pwForm.new_password !== pwForm.confirm_password) {
      setPwError('New password and confirmation do not match.');
      return;
    }
    if (pwForm.current_password === pwForm.new_password) {
      setPwError('New password must be different from your current password.');
      return;
    }

    setPwLoading(true);
    try {
      const response = await api.post('/auth/change-password', {
        current_password: pwForm.current_password,
        new_password: pwForm.new_password,
        confirm_password: pwForm.confirm_password,
      });
      setPwSuccess(response.data?.message || 'Password updated successfully!');
      setPwForm({ current_password: '', new_password: '', confirm_password: '' });
      setPasswordChanged(true);
    } catch (err) {
      const detail = err?.response?.data?.detail;
      if (Array.isArray(detail)) {
        setPwError(detail.map((d) => d.msg).join('; '));
      } else {
        setPwError(detail || 'Failed to update password. Please try again.');
      }
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
    transition: 'border-color 0.2s ease',
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      <div className="mx-auto flex min-h-screen max-w-4xl flex-col px-4 py-6 sm:px-6 lg:px-8">

        {/* Header */}
        <header
          className="mb-6 rounded-3xl border p-5 shadow-2xl backdrop-blur"
          style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-primary)' }}
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.35em] text-blue-400">My Account</p>
              <h1 className="mt-2 text-2xl font-bold" style={{ color: 'var(--text-heading)' }}>
                Profile &amp; Security
              </h1>
              <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
                View your account details and manage your password
              </p>
            </div>
            <Link
              to="/dashboard"
              className="rounded-xl border px-4 py-2 text-sm font-medium transition hover:bg-blue-600 hover:text-white hover:border-blue-600"
              style={{ borderColor: 'var(--border-primary)', color: 'var(--text-label)' }}
            >
              ← Back to Dashboard
            </Link>
          </div>
        </header>

        {error && (
          <div className="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
            ⚠️ {error}
          </div>
        )}

        {loading ? (
          <div
            className="flex flex-col items-center justify-center rounded-3xl border p-12 text-center gap-3"
            style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-primary)' }}
          >
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
            <p style={{ color: 'var(--text-secondary)' }}>Loading profile…</p>
          </div>
        ) : (
          <div className="space-y-6">

            {/* ── Profile Info Card ── */}
            <section
              className="rounded-3xl border p-6 shadow-xl"
              style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-primary)' }}
            >
              {/* Avatar + Name Row */}
              <div className="flex items-center gap-5 mb-6 pb-5 border-b" style={{ borderColor: 'var(--border-primary)' }}>
                {/* Avatar circle */}
                <div
                  className="flex h-16 w-16 items-center justify-center rounded-2xl text-2xl font-bold shadow-lg"
                  style={{ background: 'linear-gradient(135deg, var(--accent-blue), #7c3aed)', color: '#fff' }}
                >
                  {(details.full_name || details.email || '?').charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold" style={{ color: 'var(--text-heading)' }}>
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
                      {details.role || 'Unknown Role'}
                    </span>
                    <span
                      className="rounded-full border px-3 py-0.5 text-xs font-bold uppercase"
                      style={
                        details.is_active
                          ? { backgroundColor: 'rgba(16,185,129,0.1)', color: '#6ee7b7', borderColor: 'rgba(16,185,129,0.3)' }
                          : { backgroundColor: 'rgba(239,68,68,0.1)', color: '#fca5a5', borderColor: 'rgba(239,68,68,0.3)' }
                      }
                    >
                      {details.is_active ? '✓ Active' : '✗ Inactive'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Info Grid */}
              <div className="grid gap-4 sm:grid-cols-2">
                <InfoCard icon="👤" label="Full Name" value={details.full_name} />
                <InfoCard icon="✉️" label="Email Address" value={details.email} />
                <InfoCard icon="🎭" label="Role" value={details.role} />
                <InfoCard icon="⚧" label="Gender" value={details.gender || 'Not specified'} />
                <InfoCard icon="✅" label="Account Status" value={details.is_active ? 'Active' : 'Inactive'} />
                <InfoCard icon="📅" label="Member Since" value={formatDate(details.created_at)} />
              </div>
            </section>

            {/* ── Change Password Section ── */}
            <section
              className="rounded-3xl border p-6 shadow-xl"
              style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-primary)' }}
            >
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: 'var(--text-heading)' }}>
                    🔐 Change Password
                  </h2>
                  <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                    Update your account password securely
                  </p>
                </div>
                {!showChangePassword && (
                  <button
                    type="button"
                    id="show-change-password-btn"
                    onClick={() => { setShowChangePassword(true); setPwError(''); setPwSuccess(''); }}
                    className="rounded-xl border px-4 py-2 text-sm font-semibold transition hover:bg-blue-600 hover:text-white hover:border-blue-600"
                    style={{ borderColor: 'var(--border-secondary)', color: 'var(--text-label)', backgroundColor: 'var(--bg-card)' }}
                  >
                    Change Password
                  </button>
                )}
              </div>

              {showChangePassword && (
                <form onSubmit={handlePwSubmit} className="space-y-4" id="change-password-form">
                  {/* Success message */}
                  {pwSuccess && (
                    <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
                      ✅ {pwSuccess}
                      {passwordChanged && (
                        <p className="mt-2 text-emerald-400 font-medium">
                          For security, please log in again with your new password.{' '}
                          <button
                            type="button"
                            onClick={logout}
                            className="underline hover:no-underline"
                          >
                            Log out now
                          </button>
                        </p>
                      )}
                    </div>
                  )}

                  {/* Error message */}
                  {pwError && (
                    <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
                      ⚠️ {pwError}
                    </div>
                  )}

                  {/* Show/hide toggle */}
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="show-passwords"
                      checked={showPasswords}
                      onChange={(e) => setShowPasswords(e.target.checked)}
                      className="rounded"
                    />
                    <label htmlFor="show-passwords" className="text-sm cursor-pointer" style={{ color: 'var(--text-secondary)' }}>
                      Show passwords
                    </label>
                  </div>

                  {/* Current Password */}
                  <div>
                    <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text-label)' }}>
                      Current Password
                    </label>
                    <input
                      id="current-password-input"
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
                      id="new-password-input"
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
                      id="confirm-password-input"
                      type={showPasswords ? 'text' : 'password'}
                      value={pwForm.confirm_password}
                      onChange={(e) => setPwForm((f) => ({ ...f, confirm_password: e.target.value }))}
                      placeholder="Re-enter your new password"
                      required
                      minLength={8}
                      style={inputStyle}
                      autoComplete="new-password"
                    />
                    {/* Match indicator */}
                    {pwForm.confirm_password && pwForm.new_password && (
                      <p
                        className="mt-1.5 text-xs"
                        style={{
                          color: pwForm.new_password === pwForm.confirm_password
                            ? 'var(--status-success)'
                            : 'var(--status-danger)',
                        }}
                      >
                        {pwForm.new_password === pwForm.confirm_password ? '✓ Passwords match' : '✗ Passwords do not match'}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-3 pt-2">
                    <button
                      type="submit"
                      id="submit-change-password-btn"
                      disabled={pwLoading}
                      className="rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {pwLoading ? (
                        <span className="flex items-center gap-2">
                          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          Updating…
                        </span>
                      ) : (
                        '🔒 Update Password'
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowChangePassword(false);
                        setPwForm({ current_password: '', new_password: '', confirm_password: '' });
                        setPwError('');
                        setPwSuccess('');
                        setPasswordChanged(false);
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

          </div>
        )}
      </div>
    </div>
  );
}
