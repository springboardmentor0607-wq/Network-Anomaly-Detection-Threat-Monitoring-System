import { Link } from "react-router-dom";
import {
  FaShieldAlt,
  FaNetworkWired,
  FaBrain,
  FaChartLine,
  FaUserShield,
  FaCode,
  FaDatabase,
  FaCheckCircle,
  FaSignInAlt,
  FaUserPlus
} from "react-icons/fa";
import "../styles/Landing.css";

const features = [
  {
    icon: <FaNetworkWired style={{ color: "#38bdf8" }} />,
    bg: "rgba(56, 189, 248, 0.12)",
    title: "Network Traffic Monitoring",
    description: "Monitor incoming and outgoing network traffic."
  },
  {
    icon: <FaBrain style={{ color: "#c084fc" }} />,
    bg: "rgba(192, 132, 252, 0.12)",
    title: "AI Threat Detection",
    description: "Detect suspicious activities using the Random Forest Classifier."
  },
  {
    icon: <FaChartLine style={{ color: "#10b981" }} />,
    bg: "rgba(16, 185, 129, 0.12)",
    title: "Traffic Analytics",
    description: "Visualize packet statistics and anomaly trends."
  },
  {
    icon: <FaUserShield style={{ color: "#00f2fe" }} />,
    bg: "rgba(0, 242, 254, 0.12)",
    title: "Role-Based Access",
    description: "Separate dashboards for Security Analyst and Security Administrator."
  }
];

const technologies = [
  "React",
  "Flask",
  "Python",
  "PostgreSQL",
  "Scikit-learn",
  "Random Forest"
];

const datasets = [
  "UNSW-NB15",
  "CICIDS2017"
];

function Landing() {
  return (
    <div className="landing-container">
      {/* Navbar Header */}
      <header className="landing-navbar">
        <div className="landing-logo">
          <FaShieldAlt style={{ color: "#00f2fe" }} />
          <span>NetShield <span className="logo-highlight">AI</span></span>
        </div>

        <div className="nav-actions">
          <Link to="/login" className="btn-ghost">
            <FaSignInAlt style={{ marginRight: "6px" }} /> Login
          </Link>
          <Link to="/register" className="btn-primary">
            <FaUserPlus style={{ marginRight: "6px" }} /> Register
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-badge">
          <FaCheckCircle /> Enterprise SOC Defense Platform
        </div>

        <h1 className="hero-title">
          <span className="title-gradient">NetShield AI</span>
        </h1>

        <h2 className="hero-subtitle">
          Network Anomaly Detection & Threat Monitoring System
        </h2>

        <p className="hero-description">
          NetShield AI is an AI-powered Network Intrusion Detection System that uses a Random Forest Classifier trained on the UNSW-NB15 and CICIDS2017 cybersecurity datasets to detect anomalous network traffic, classify cyber attacks, generate risk scores, and provide real-time threat analysis through interactive dashboards and reports.
        </p>

        <div className="hero-cta">
          <Link to="/login" className="btn-primary btn-large">
            Access SOC Portal
          </Link>
          <Link to="/register" className="btn-ghost btn-large">
            Create Operator Account
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="section-header">
          <h2>Core Capabilities & Modules</h2>
          <p>Comprehensive Cyber Security Operations & Automated ML Intelligence</p>
        </div>

        <div className="features-grid">
          {features.map((item, index) => (
            <div key={index} className="feature-card">
              <div className="feature-icon-wrapper" style={{ background: item.bg }}>
                {item.icon}
              </div>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Technology Section */}
      <section className="tech-section">
        <div className="section-header">
          <h2>Technologies & Datasets</h2>
          <p>Underlying Machine Learning Models, Backend Frameworks & Datasets</p>
        </div>

        {/* Row 1: Technologies */}
        <div style={{ marginBottom: "28px" }}>
          <h3 style={{ fontSize: "1.05rem", color: "#38bdf8", marginBottom: "14px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
            <FaCode /> Technologies
          </h3>
          <div className="tech-grid">
            {technologies.map((tech, index) => (
              <div key={index} className="tech-badge">
                <FaCode style={{ color: "#38bdf8", fontSize: "0.85rem" }} />
                <span>{tech}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Row 2: Datasets */}
        <div>
          <h3 style={{ fontSize: "1.05rem", color: "#c084fc", marginBottom: "14px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
            <FaDatabase /> Datasets
          </h3>
          <div className="tech-grid">
            {datasets.map((ds, index) => (
              <div key={index} className="tech-badge" style={{ borderColor: "rgba(192, 132, 252, 0.4)", background: "rgba(192, 132, 252, 0.1)" }}>
                <FaDatabase style={{ color: "#c084fc", fontSize: "0.85rem" }} />
                <span>{ds}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div>
          🛡️ <strong>NetShield AI</strong> — Enterprise Network Security System
        </div>
        <div>
          © 2026 Security Operations Center (SOC). All Rights Reserved.
        </div>
      </footer>
    </div>
  );
}

export default Landing;

