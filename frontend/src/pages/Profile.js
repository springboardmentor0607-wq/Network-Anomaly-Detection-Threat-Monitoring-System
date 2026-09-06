import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { FaUserCircle, FaShieldAlt, FaEnvelope, FaIdBadge } from 'react-icons/fa';

const Profile = () => {
  const { user } = useContext(AuthContext);

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Operator Profile</h1>
          <p className="page-subtitle">Authenticated Analyst credentials & role capabilities</p>
        </div>
      </div>

      <div className="netshield-card" style={{ maxWidth: 640 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 24, paddingBottom: 20, borderBottom: '1px solid #163A52' }}>
          <FaUserCircle style={{ fontSize: '4rem', color: '#1683FF' }} />
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#F8FAFC' }}>{user?.name}</h2>
            <div style={{ color: '#22C55E', fontWeight: 700, fontSize: '0.85rem', marginTop: 2 }}>{user?.role}</div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: 12, background: 'rgba(8, 24, 39, 0.6)', borderRadius: 8, border: '1px solid #163A52' }}>
            <span style={{ color: '#94A3B8', display: 'flex', alignItems: 'center', gap: 8 }}>
              <FaIdBadge /> User ID
            </span>
            <span style={{ fontWeight: 700 }}>#{user?.id}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', padding: 12, background: 'rgba(8, 24, 39, 0.6)', borderRadius: 8, border: '1px solid #163A52' }}>
            <span style={{ color: '#94A3B8', display: 'flex', alignItems: 'center', gap: 8 }}>
              <FaEnvelope /> Email Address
            </span>
            <span style={{ fontWeight: 700 }}>{user?.email}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', padding: 12, background: 'rgba(8, 24, 39, 0.6)', borderRadius: 8, border: '1px solid #163A52' }}>
            <span style={{ color: '#94A3B8', display: 'flex', alignItems: 'center', gap: 8 }}>
              <FaShieldAlt /> System Privileges
            </span>
            <span className={`badge ${user?.role === 'ADMIN' ? 'badge-critical' : 'badge-low'}`}>
              {user?.role === 'ADMIN' ? 'FULL ADMINISTRATOR' : 'SOC SECURITY ANALYST'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
