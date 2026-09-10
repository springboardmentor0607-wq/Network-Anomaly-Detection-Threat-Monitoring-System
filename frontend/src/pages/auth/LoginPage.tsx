import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Shield, Lock, Mail, Eye, EyeOff, AlertCircle, KeyRound, UserPlus, ShieldAlert, UserCheck, CheckCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const ROLE_DASHBOARD_MAP: Record<string, string> = {
  ADMIN: '/dashboard/admin',
  SOC_MANAGER: '/dashboard/manager',
  SECURITY_ANALYST: '/dashboard/analyst',
  VIEWER: '/dashboard/viewer',
};

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, user } = useAuth();

  const registeredEmail = location.state?.registeredEmail || '';
  const initialSuccessMsg = location.state?.successMessage || null;
  const from = location.state?.from || null;

  const [portalType, setPortalType] = useState<'USER' | 'ADMIN'>('USER');
  const [email, setEmail] = useState(registeredEmail);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(initialSuccessMsg);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If already logged in, redirect appropriately
  useEffect(() => {
    if (user) {
      const dashboardPath = ROLE_DASHBOARD_MAP[user.role?.name || ''] || '/';
      navigate(dashboardPath, { replace: true });
    }
  }, [user, navigate]);

  useEffect(() => {
    if (registeredEmail) {
      setEmail(registeredEmail);
    }
  }, [registeredEmail]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setIsSubmitting(true);
    try {
      const { role } = await login({ email, password });
      const dashboardPath = ROLE_DASHBOARD_MAP[role] || '/';
      navigate(from || dashboardPath, { replace: true });
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Failed to authenticate. Please check your credentials.';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0B0F17', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', position: 'relative', overflow: 'hidden' }}>
      {/* Ambient background glow */}
      <div style={{ position: 'absolute', top: '25%', left: '50%', transform: 'translate(-50%, -50%)', width: '24rem', height: '24rem', background: 'rgba(6, 182, 212, 0.07)', borderRadius: '50%', filter: 'blur(80px)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '25%', right: '10%', width: '16rem', height: '16rem', background: 'rgba(139, 92, 246, 0.05)', borderRadius: '50%', filter: 'blur(60px)', pointerEvents: 'none' }} />

      <div style={{ maxWidth: '26rem', width: '100%', background: '#111827', border: '1px solid #1F2937', borderRadius: '1rem', padding: '2rem', boxShadow: '0 25px 50px rgba(0,0,0,0.5)', position: 'relative', zIndex: 10 }}>
        {/* Header Branding */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{ display: 'inline-flex', padding: '0.75rem', background: 'rgba(6, 182, 212, 0.1)', border: '1px solid rgba(6, 182, 212, 0.3)', borderRadius: '0.75rem', color: '#22D3EE', marginBottom: '0.75rem' }}>
            <Shield size={36} />
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', letterSpacing: '0.05em', margin: '0 0 0.25rem' }}>NETSHIELD AI</h1>
          <p style={{ fontSize: '0.75rem', color: '#9CA3AF', margin: 0 }}>Security Operations Center Platform</p>
        </div>

        {/* Portal Switcher Tabs */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', background: '#0B0F17', padding: '0.25rem', border: '1px solid #1F2937', borderRadius: '0.75rem', marginBottom: '1.25rem' }}>
          <button
            type="button"
            onClick={() => { setPortalType('USER'); if (!registeredEmail) setEmail(''); setPassword(''); setError(null); }}
            style={{ padding: '0.625rem', borderRadius: '0.625rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer', border: 'none', background: portalType === 'USER' ? '#06B6D4' : 'transparent', color: portalType === 'USER' ? '#000' : '#9CA3AF', transition: 'all 0.2s' }}
          >
            <UserCheck size={14} />
            <span>USER PORTAL</span>
          </button>
          <button
            type="button"
            onClick={() => { setPortalType('ADMIN'); setEmail(''); setPassword(''); setError(null); }}
            style={{ padding: '0.625rem', borderRadius: '0.625rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer', border: 'none', background: portalType === 'ADMIN' ? '#EF4444' : 'transparent', color: portalType === 'ADMIN' ? '#fff' : '#9CA3AF', transition: 'all 0.2s' }}
          >
            <ShieldAlert size={14} />
            <span>ADMIN PORTAL</span>
          </button>
        </div>

        {/* Demo Credentials Info */}
        <div style={{ background: 'rgba(6,182,212,0.05)', border: '1px solid rgba(6,182,212,0.15)', borderRadius: '0.5rem', padding: '0.75rem', marginBottom: '1rem', fontSize: '0.7rem', color: '#9CA3AF' }}>
          <strong style={{ color: '#22D3EE' }}>Demo Credentials</strong>
          <div style={{ marginTop: '0.4rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
            <span>Admin: <code style={{ color: '#A78BFA' }}>admin@netshield.ai</code></span>
            <span>Analyst: <code style={{ color: '#34D399' }}>analyst@netshield.ai</code></span>
            <span>Password: <code style={{ color: '#FBBF24' }}>AdminPass123!</code></span>
          </div>
        </div>

        {/* Success Notification Banner */}
        {successMsg && (
          <div style={{ padding: '0.75rem', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.4)', borderRadius: '0.5rem', display: 'flex', alignItems: 'flex-start', gap: '0.5rem', color: '#6EE7B7', fontSize: '0.75rem', marginBottom: '1rem' }}>
            <CheckCircle size={16} style={{ flexShrink: 0, marginTop: '0.1rem' }} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Error Notification */}
        {error && (
          <div style={{ padding: '0.75rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '0.5rem', display: 'flex', alignItems: 'flex-start', gap: '0.5rem', color: '#FCA5A5', fontSize: '0.75rem', marginBottom: '1rem' }}>
            <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '0.1rem' }} />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 600, color: '#D1D5DB', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
              {portalType === 'ADMIN' ? 'Administrator Email' : 'Analyst / Operator Email'}
            </label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#6B7280' }} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={portalType === 'ADMIN' ? 'admin@netshield.ai' : 'analyst@netshield.ai'}
                style={{ width: '100%', background: '#131C2E', border: '1px solid #1F2937', borderRadius: '0.625rem', paddingLeft: '2.5rem', paddingRight: '1rem', paddingTop: '0.625rem', paddingBottom: '0.625rem', fontSize: '0.875rem', color: '#F9FAFB', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 600, color: '#D1D5DB', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#6B7280' }} />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                style={{ width: '100%', background: '#131C2E', border: '1px solid #1F2937', borderRadius: '0.625rem', paddingLeft: '2.5rem', paddingRight: '2.5rem', paddingTop: '0.625rem', paddingBottom: '0.625rem', fontSize: '0.875rem', color: '#F9FAFB', outline: 'none', boxSizing: 'border-box' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#6B7280', cursor: 'pointer', padding: 0 }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              width: '100%',
              fontWeight: 700,
              padding: '0.75rem 1rem',
              borderRadius: '0.625rem',
              fontSize: '0.75rem',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              opacity: isSubmitting ? 0.6 : 1,
              background: portalType === 'ADMIN' ? '#EF4444' : '#06B6D4',
              color: portalType === 'ADMIN' ? '#fff' : '#000',
              transition: 'all 0.2s',
            }}
          >
            {isSubmitting ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <KeyRound size={15} />
                <span>{portalType === 'ADMIN' ? 'Sign In as Administrator' : 'Sign In to SOC Platform'}</span>
              </>
            )}
          </button>
        </form>

        {/* Links */}
        {portalType === 'USER' ? (
          <div style={{ textAlign: 'center', borderTop: '1px solid #1F2937', paddingTop: '1rem', marginTop: '1rem' }}>
            <p style={{ fontSize: '0.7rem', color: '#9CA3AF', margin: 0 }}>
              Don't have an operator account?{' '}
              <Link to="/register" style={{ color: '#22D3EE', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.25rem', textDecoration: 'none' }}>
                Register Here
                <UserPlus size={13} />
              </Link>
            </p>
          </div>
        ) : (
          <div style={{ borderTop: '1px solid #1F2937', paddingTop: '1rem', marginTop: '1rem', textAlign: 'center' }}>
            <p style={{ fontSize: '0.65rem', color: '#6B7280', margin: 0 }}>
              Administrator Access — Self-registration disabled for Admin tier.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
