import React from 'react';
import { Link } from 'react-router-dom';
import { FaShieldAlt, FaBrain, FaNetworkWired, FaFire, FaChartLine, FaArrowRight } from 'react-icons/fa';

const Home = () => {
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#02060D',
      color: '#F8FAFC',
      backgroundImage: 'radial-gradient(ellipse at 50% 20%, rgba(0, 240, 255, 0.08) 0%, rgba(2, 6, 13, 0) 70%)',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Navigation Header */}
      <header style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '24px 48px',
        borderBottom: '1px solid rgba(22, 131, 255, 0.15)',
        backdropFilter: 'blur(16px)',
        backgroundColor: 'rgba(6, 17, 32, 0.85)',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <FaShieldAlt style={{ fontSize: '2.5rem', color: '#00F0FF', filter: 'drop-shadow(0 0 10px rgba(0, 240, 255, 0.6))' }} />
          <div>
            <span style={{ fontSize: '1.4rem', fontWeight: 900, color: '#FFFFFF', letterSpacing: '0.04em' }}>NETSHIELD AI</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 16 }}>
          <Link to="/login" className="btn btn-secondary" style={{ padding: '9px 20px', borderRadius: 8 }}>
            Login
          </Link>
          <Link to="/register" className="btn btn-primary" style={{ padding: '9px 20px', borderRadius: 8 }}>
            Create Account
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main style={{ flex: 1, maxWidth: 1180, margin: '0 auto', padding: '60px 24px', textAlign: 'center' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          padding: '6px 16px',
          borderRadius: 20,
          background: 'rgba(0, 240, 255, 0.1)',
          border: '1px solid rgba(0, 240, 255, 0.3)',
          color: '#00F0FF',
          fontSize: '0.86rem',
          fontWeight: 800,
          marginBottom: 24,
          letterSpacing: '0.08em'
        }}>
          <span>DETECT. ANALYZE. PROTECT.</span>
        </div>

        <h1 style={{
          fontSize: '3.2rem',
          fontWeight: 900,
          lineHeight: 1.15,
          color: '#FFFFFF',
          marginBottom: 20,
          letterSpacing: '-0.02em'
        }}>
          AI-Powered Network Security Monitoring & Attack Detection
        </h1>

        <p style={{
          fontSize: '1.2rem',
          color: '#94A3B8',
          maxWidth: 820,
          margin: '0 auto 36px auto',
          lineHeight: 1.6
        }}>
          NetShield AI analyzes network traffic using machine learning to identify malicious activity, classify cyberattacks, calculate risk levels, and provide real-time security insights.
        </p>

        {/* Call to Actions */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 18, marginBottom: 64, flexWrap: 'wrap' }}>
          <Link to="/register" className="btn btn-primary" style={{ padding: '14px 34px', fontSize: '1.05rem', borderRadius: 10, display: 'inline-flex', alignItems: 'center', gap: 10 }}>
            <span>Get Started</span>
            <FaArrowRight />
          </Link>
          <Link to="/dashboard" className="btn btn-secondary" style={{ padding: '14px 34px', fontSize: '1.05rem', borderRadius: 10 }}>
            <span>View Dashboard</span>
          </Link>
        </div>

        {/* 4 Feature Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: 22,
          textAlign: 'left'
        }}>
          <div className="netshield-card" style={{ padding: '28px 24px', borderTop: '3px solid #00F0FF' }}>
            <div style={{ width: 50, height: 50, borderRadius: 12, backgroundColor: 'rgba(0, 240, 255, 0.15)', color: '#00F0FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', marginBottom: 16 }}>
              <FaBrain />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#FFFFFF', marginBottom: 10 }}>AI-Powered Detection</h3>
            <p style={{ fontSize: '0.9rem', color: '#94A3B8', lineHeight: 1.5, margin: 0 }}>
              Detect suspicious network traffic using machine learning algorithms trained on comprehensive network flow datasets.
            </p>
          </div>

          <div className="netshield-card" style={{ padding: '28px 24px', borderTop: '3px solid #00E676' }}>
            <div style={{ width: 50, height: 50, borderRadius: 12, backgroundColor: 'rgba(0, 230, 118, 0.15)', color: '#00E676', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', marginBottom: 16 }}>
              <FaNetworkWired />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#FFFFFF', marginBottom: 10 }}>Real-Time Monitoring</h3>
            <p style={{ fontSize: '0.9rem', color: '#94A3B8', lineHeight: 1.5, margin: 0 }}>
              Monitor network activity and security events continuously with a synchronized 30-second live telemetry refresh.
            </p>
          </div>

          <div className="netshield-card" style={{ padding: '28px 24px', borderTop: '3px solid #FF1744' }}>
            <div style={{ width: 50, height: 50, borderRadius: 12, backgroundColor: 'rgba(255, 23, 68, 0.15)', color: '#FF1744', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', marginBottom: 16 }}>
              <FaFire />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#FFFFFF', marginBottom: 10 }}>Attack Classification</h3>
            <p style={{ fontSize: '0.9rem', color: '#94A3B8', lineHeight: 1.5, margin: 0 }}>
              Identify different network attack types automatically including DDoS, SSH-Patator, FTP-Patator, and Port Scans.
            </p>
          </div>

          <div className="netshield-card" style={{ padding: '28px 24px', borderTop: '3px solid #FFB300' }}>
            <div style={{ width: 50, height: 50, borderRadius: 12, backgroundColor: 'rgba(255, 179, 0, 0.15)', color: '#FFB300', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', marginBottom: 16 }}>
              <FaChartLine />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#FFFFFF', marginBottom: 10 }}>Risk Assessment</h3>
            <p style={{ fontSize: '0.9rem', color: '#94A3B8', lineHeight: 1.5, margin: 0 }}>
              Calculate confidence, risk score (0–100), and severity for every detected threat with instant incident dispatch.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer style={{
        padding: '24px',
        textAlign: 'center',
        borderTop: '1px solid rgba(22, 131, 255, 0.12)',
        color: '#64748B',
        fontSize: '0.84rem'
      }}>
        NetShield AI — AI-Powered Network Security Monitoring & Attack Detection Platform
      </footer>
    </div>
  );
};

export default Home;
