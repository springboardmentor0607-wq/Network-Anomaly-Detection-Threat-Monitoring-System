import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { FaShieldAlt, FaUser, FaEnvelope, FaLock, FaCheckCircle, FaUserPlus } from 'react-icons/fa';

const Register = () => {
  const { register } = useContext(AuthContext);
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters in length.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Password and Confirm Password do not match.');
      return;
    }

    setLoading(true);

    try {
      await register(name, email, password, confirmPassword);
      setSuccess('Account created successfully! Redirecting to login page...');
      setTimeout(() => {
        navigate('/login');
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Please check inputs.');
      setLoading(false);
    }
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
      <div className="netshield-card" style={{ width: '100%', maxWidth: 440, padding: 32, backgroundColor: '#0B1D2D' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <FaShieldAlt style={{ fontSize: '3.3rem', color: '#00F0FF', filter: 'drop-shadow(0 0 14px rgba(0, 240, 255, 0.7))', marginBottom: 12 }} />
          <h1 style={{ fontSize: '1.7rem', fontWeight: 900, color: '#FFFFFF', letterSpacing: '-0.02em' }}>Register Analyst</h1>
          <p style={{ color: '#94A3B8', fontSize: '0.85rem', marginTop: 4 }}>
            Create Security Analyst credentials on NetShield AI
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

        {success && (
          <div style={{
            backgroundColor: 'rgba(34, 197, 94, 0.12)',
            border: '1px solid #22C55E',
            color: '#22C55E',
            padding: '10px 14px',
            borderRadius: 8,
            marginBottom: 20,
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>
            <FaCheckCircle /> {success}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', color: '#94A3B8', fontSize: '0.8rem', fontWeight: 700, marginBottom: 6 }}>FULL NAME</label>
            <div style={{ position: 'relative' }}>
              <FaUser style={{ position: 'absolute', left: 12, top: 13, color: '#64748B' }} />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Doe"
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

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', color: '#94A3B8', fontSize: '0.8rem', fontWeight: 700, marginBottom: 6 }}>EMAIL ADDRESS</label>
            <div style={{ position: 'relative' }}>
              <FaEnvelope style={{ position: 'absolute', left: 12, top: 13, color: '#64748B' }} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jane@netshield.ai"
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

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', color: '#94A3B8', fontSize: '0.8rem', fontWeight: 700, marginBottom: 6 }}>PASSWORD</label>
            <div style={{ position: 'relative' }}>
              <FaLock style={{ position: 'absolute', left: 12, top: 13, color: '#64748B' }} />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="•••••••• (Min 6 characters)"
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

          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', color: '#94A3B8', fontSize: '0.8rem', fontWeight: 700, marginBottom: 6 }}>CONFIRM PASSWORD</label>
            <div style={{ position: 'relative' }}>
              <FaLock style={{ position: 'absolute', left: 12, top: 13, color: '#64748B' }} />
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
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
            <FaUserPlus /> {loading ? 'Creating Analyst Account...' : 'Register Account'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 20, fontSize: '0.85rem', color: '#94A3B8' }}>
          Already registered? <Link to="/login" style={{ color: '#1683FF', fontWeight: 700, textDecoration: 'none' }}>Sign In to Portal</Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
