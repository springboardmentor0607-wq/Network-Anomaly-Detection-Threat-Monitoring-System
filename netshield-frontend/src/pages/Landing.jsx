import { Link } from "react-router-dom";
import {
  FaNetworkWired,
  FaBrain,
  FaExclamationTriangle,
  FaBell,
  FaChartBar,
  FaSignInAlt,
  FaUserPlus,
  FaReact,
  FaPython,
  FaDatabase,
  FaDocker,
  FaAws,
  FaServer,
  FaCode,
  FaProjectDiagram,
  FaSearch,
  FaChartPie,
  FaShieldAlt
} from "react-icons/fa";
import "../styles/Landing.css";

const capabilities = [
  {
    icon: <FaNetworkWired style={{ color: "#38bdf8" }} />,
    title: "Network Monitoring",
    description: "Real-time network traffic and flow monitoring."
  },
  {
    icon: <FaBrain style={{ color: "#c084fc" }} />,
    title: "AI Anomaly Detection",
    description: "Detect abnormal network behaviour using Random Forest."
  },
  {
    icon: <FaExclamationTriangle style={{ color: "#f59e0b" }} />,
    title: "Threat Classification",
    description: "Identify attack types and assess risk."
  },
  {
    icon: <FaBell style={{ color: "#ef4444" }} />,
    title: "Alert & Incident Management",
    description: "Track security alerts through resolution."
  },
  {
    icon: <FaChartBar style={{ color: "#10b981" }} />,
    title: "Security Analytics",
    description: "Analyze threats, trends, and security events."
  }
];

const navStripItems = [
  { label: "Detect", icon: <FaSearch style={{ color: "#00f2fe" }} /> },
  { label: "Analyze", icon: <FaChartPie style={{ color: "#38bdf8" }} /> },
  { label: "Alert", icon: <FaBell style={{ color: "#ef4444" }} /> },
  { label: "Protect", icon: <FaShieldAlt style={{ color: "#10b981" }} /> }
];

const technologies = [
  { name: "React", icon: <FaReact style={{ color: "#61dafb" }} /> },
  { name: "Vite", icon: <FaCode style={{ color: "#38bdf8" }} /> },
  { name: "Python", icon: <FaPython style={{ color: "#3776ab" }} /> },
  { name: "Flask", icon: <FaServer style={{ color: "#cbd5e1" }} /> },
  { name: "PostgreSQL", icon: <FaDatabase style={{ color: "#336791" }} /> },
  { name: "Scikit-learn", icon: <FaBrain style={{ color: "#f7931e" }} /> },
  { name: "Random Forest", icon: <FaProjectDiagram style={{ color: "#10b981" }} /> },
  { name: "Wireshark / TShark", icon: <FaNetworkWired style={{ color: "#1679a7" }} /> },
  { name: "Docker", icon: <FaDocker style={{ color: "#2496ed" }} /> },
  { name: "AWS EC2", icon: <FaAws style={{ color: "#ff9900" }} /> }
];

const datasets = [
  {
    name: "UNSW-NB15",
    description: "Network intrusion dataset"
  },
  {
    name: "CICIDS2017",
    description: "Cybersecurity network traffic dataset"
  }
];

function Landing() {
  return (
    <div className="landing-container">
      {/* Top Navbar Header */}
      <header className="landing-navbar">
        <div className="landing-title-nav">
          <svg width="22" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="nav-shield-icon">
            <path d="M12 2L4 5.5V11.5C4 16.5 7.5 20.8 12 22C16.5 20.8 20 16.5 20 11.5V5.5L12 2Z" fill="#2563eb" stroke="#94a3b8" strokeWidth="1.5" strokeLinejoin="round" />
            <path d="M12 2V22C16.5 20.8 20 16.5 20 11.5V5.5L12 2Z" fill="#38bdf8" />
          </svg>
          <span className="nav-title-text">NetShield <span className="logo-highlight">AI</span></span>
        </div>

        <div className="nav-actions">
          <Link to="/login" className="btn-ghost btn-sm">
            <FaSignInAlt style={{ marginRight: "4px" }} /> Login
          </Link>
          <Link to="/register" className="btn-primary btn-sm">
            <FaUserPlus style={{ marginRight: "4px" }} /> Register
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero-section">
        <h1 className="hero-title">
          <span className="title-main">NetShield </span>
          <span className="title-gradient">AI</span>
        </h1>

        <p className="hero-subtitle">
          Network Anomaly Detection & Threat Monitoring System
        </p>

        <div className="hero-cta">
          <Link to="/login" className="btn-primary btn-cyan-glow">
            Access SOC Portal
          </Link>
          <Link to="/register" className="btn-ghost">
            Register
          </Link>
        </div>

        {/* Cybersecurity Navigation Strip */}
        <div className="cyber-strip">
          {navStripItems.map((item, idx) => (
            <div key={idx} className="strip-item">
              <span className="strip-icon">{item.icon}</span>
              <span className="strip-label">{item.label}</span>
              {idx < navStripItems.length - 1 && <span className="strip-divider">•</span>}
            </div>
          ))}
        </div>
      </section>

      {/* Core Capabilities Section */}
      <section className="section-container">
        <h2 className="section-title centered-title">Core Capabilities</h2>
        <div className="capabilities-single-row">
          {capabilities.map((item, index) => (
            <div key={index} className="capability-card">
              <div className="capability-icon">{item.icon}</div>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Technologies Section (All 10 in ONE single row on desktop) */}
      <section className="section-container">
        <h2 className="section-title centered-title">Technologies</h2>
        <div className="tech-single-row">
          {technologies.map((tech, index) => (
            <div key={index} className="tech-card-compact">
              <div className="tech-icon">{tech.icon}</div>
              <span className="tech-name">{tech.name}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Datasets Section */}
      <section className="section-container">
        <h2 className="section-title centered-title">Datasets</h2>
        <div className="datasets-cards-grid">
          {datasets.map((ds, index) => (
            <div key={index} className="dataset-card">
              <div className="dataset-icon-wrapper">
                <FaDatabase style={{ color: "#c084fc", fontSize: "1.2rem" }} />
              </div>
              <div className="dataset-info">
                <h3>{ds.name}</h3>
                <p>{ds.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-brand">
          <span>NetShield AI</span>
        </div>
        <span>© 2026 Security Operations Center</span>
      </footer>
    </div>
  );
}

export default Landing;
