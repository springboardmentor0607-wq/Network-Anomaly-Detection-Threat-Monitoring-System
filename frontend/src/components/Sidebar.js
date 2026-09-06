import React, { useContext } from 'react';
import { NavLink } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import {
  FaShieldAlt, FaTachometerAlt, FaNetworkWired, FaCloudUploadAlt,
  FaExclamationTriangle, FaBell, FaFileAlt, FaChartLine,
  FaCog, FaUserCog, FaHistory, FaUser, FaSignOutAlt,
  FaChevronLeft, FaChevronRight, FaFire, FaEye, FaGlobe, FaLayerGroup,
  FaCalendarAlt
} from 'react-icons/fa';

const Sidebar = ({ collapsed, setCollapsed }) => {
  const { user, logout } = useContext(AuthContext);

  const mainItems = [
    { path: '/dashboard', label: 'Dashboard', icon: <FaTachometerAlt /> },
    { path: '/upload', label: 'Upload', icon: <FaCloudUploadAlt /> },
    { path: '/network-monitor', label: 'Network Monitor', icon: <FaNetworkWired /> },
    { path: '/threats', label: 'Threat Detection', icon: <FaExclamationTriangle /> },
    { path: '/alerts', label: 'Alerts', icon: <FaBell /> },
    { path: '/incidents', label: 'Incidents', icon: <FaFire /> },
    { path: '/notifications', label: 'Notifications', icon: <FaLayerGroup /> },
    { path: '/reports', label: 'Reports', icon: <FaFileAlt /> },
    { path: '/threat-intelligence', label: 'Threat Intelligence', icon: <FaGlobe /> },
    { path: '/attack-visualization', label: 'Attack Visualization', icon: <FaEye /> },
    { path: '/weekly-security-trends', label: 'Weekly Security Trends', icon: <FaCalendarAlt /> },
    { path: '/security-analytics', label: 'Security Analytics', icon: <FaChartLine /> },
    { path: '/settings', label: 'Settings', icon: <FaCog /> }
  ];

  const adminItems = [
    { path: '/user-management', label: 'User Management', icon: <FaUserCog /> },
    { path: '/audit-logs', label: 'Audit Logs', icon: <FaHistory /> }
  ];

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <div className="brand">
          <FaShieldAlt className="brand-icon" />
          {!collapsed && (
            <div className="brand-text-container">
              <span className="brand-title">NETSHIELD AI</span>
              <span className="brand-subtitle">THREAT MONITORING</span>
            </div>
          )}
        </div>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="btn btn-outline"
          style={{ padding: '4px 6px', borderRadius: '4px' }}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <FaChevronRight size={10} /> : <FaChevronLeft size={10} />}
        </button>
      </div>

      <nav className="sidebar-nav">
        {!collapsed && <div className="nav-section-title">NAVIGATION</div>}
        {mainItems.map((item, index) => (
          <NavLink
            key={`${item.path}-${index}`}
            to={item.path}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            title={collapsed ? item.label : ''}
          >
            <span className="nav-icon">{item.icon}</span>
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}

        {user?.role === 'ADMIN' && (
          <>
            {!collapsed && <div className="nav-section-title" style={{ marginTop: 10, color: 'var(--severity-critical)' }}>ADMINISTRATION</div>}
            {adminItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                title={collapsed ? item.label : ''}
              >
                <span className="nav-icon">{item.icon}</span>
                {!collapsed && <span>{item.label}</span>}
              </NavLink>
            ))}
          </>
        )}
      </nav>

      <div className="sidebar-footer">
        <NavLink
          to="/profile"
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          style={{ marginBottom: 4 }}
          title={collapsed ? 'Profile' : ''}
        >
          <span className="nav-icon"><FaUser /></span>
          {!collapsed && <span>Profile</span>}
        </NavLink>

        <button
          onClick={logout}
          className="nav-item"
          style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
          title={collapsed ? 'Logout' : ''}
        >
          <span className="nav-icon" style={{ color: 'var(--severity-critical)' }}><FaSignOutAlt /></span>
          {!collapsed && <span style={{ color: 'var(--severity-critical)', fontWeight: 700 }}>Logout</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
