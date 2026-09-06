import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { FaShieldAlt, FaEnvelope, FaLock, FaSignInAlt } from 'react-icons/fa';

const Login = () => {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid email or password. Please try again.');
      setLoading(false);
    }
  };

  const handleFillDemo = (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError('');
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#030912',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20
    }}>
      <div className="netshield-card" style={{ width: '100%', maxWidth: 420, padding: 32, backgroundColor: '#0B1D2D' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <FaShieldAlt style={{ fontSize: '3.3rem', color: '#00F0FF', filter: 'drop-shadow(0 0 14px rgba(0, 240, 255, 0.7))', marginBottom: 12 }} />
          <h1 style={{ fontSize: '1.7rem', fontWeight: 900, color: '#FFFFFF', letterSpacing: '-0.02em' }}>NetShield AI</h1>
          <p style={{ color: '#94A3B8', fontSize: '0.85rem', marginTop: 4 }}>
            Security Operations Center & Threat Monitoring
          </p>
        </div>

        {error && (
          <div style={{
            backgroundColor: 'rgba(255, 23, 68, 0.12)',
            border: '1px solid #FF1744',
            color: '#FF1744',
            padding: '10px 14px',
            borderRadius: 8,
            marginBottom: 20,
            fontSize: '0.85rem'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', color: '#94A3B8', fontSize: '0.8rem', fontWeight: 700, marginBottom: 6 }}>
              EMAIL ADDRESS
            </label>
            <div style={{ position: 'relative' }}>
              <FaEnvelope style={{ position: 'absolute', left: 12, top: 13, color: '#64748B' }} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="analyst@netshield.ai"
                style={{
                  width: '100%',
                  padding: '10px 12px 10px 38px',
                  backgroundColor: '#081827',
                  border: '1px solid #163A52',
                  borderRadius: 8,
                  color: '#F8FAFC',
                  fontSize: '0.9rem'
                }}
              />
            </div>
          </div>

          <div style={{ marginBottom: 22 }}>
            <label style={{ display: 'block', color: '#94A3B8', fontSize: '0.8rem', fontWeight: 700, marginBottom: 6 }}>
              PASSWORD
            </label>
            <div style={{ position: 'relative' }}>
              <FaLock style={{ position: 'absolute', left: 12, top: 13, color: '#64748B' }} />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{
                  width: '100%',
                  padding: '10px 12px 10px 38px',
                  backgroundColor: '#081827',
                  border: '1px solid #163A52',
                  borderRadius: 8,
                  color: '#F8FAFC',
                  fontSize: '0.9rem'
                }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center', padding: '11px', fontSize: '0.95rem' }}
          >
            <FaSignInAlt /> {loading ? 'Authenticating...' : 'Sign In to Portal'}
          </button>
        </form>

        <div style={{ marginTop: 24, padding: 14, background: 'rgba(7, 21, 34, 0.7)', borderRadius: 8, border: '1px solid #163A52' }}>
          <div style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 700, marginBottom: 8, textAlign: 'center' }}>
            CLICK TO FILL VERIFIED CREDENTIALS
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              onClick={() => handleFillDemo('analyst@netshield.ai', 'Analyst@123')}
              className="btn btn-outline"
              style={{ flex: 1, justifyContent: 'center', fontSize: '0.75rem', padding: '6px 8px' }}
            >
              Analyst Demo
            </button>
            <button
              type="button"
              onClick={() => handleFillDemo('admin@netshield.ai', 'Admin@123')}
              className="btn btn-outline"
              style={{ flex: 1, justifyContent: 'center', fontSize: '0.75rem', padding: '6px 8px' }}
            >
              Admin Demo
            </button>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: 20, fontSize: '0.85rem', color: '#94A3B8' }}>
          Need an account? <Link to="/register" style={{ color: '#1683FF', fontWeight: 700, textDecoration: 'none' }}>Register as Analyst</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
