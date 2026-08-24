import "./Login.css";
import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post(
        "http://127.0.0.1:8000/login",
        {
          email: email.trim(),
          password: password,
        }
      );

      console.log("Login response:", response.data);

      // Save logged-in user if backend returns user information
      if (response.data?.user) {
        localStorage.setItem(
          "netshield_user",
          JSON.stringify(response.data.user)
        );
      }

      // Save login status
      localStorage.setItem("netshield_logged_in", "true");

      alert("Login successful!");

      // Open Dashboard
      navigate("/dashboard", { replace: true });

    } catch (error) {
      console.error("Login error:", error);

      if (error.response) {
        const detail =
          error.response.data?.detail ||
          error.response.data?.message ||
          "Invalid email or password";

        alert(detail);
      } else {
        alert("Cannot connect to backend server.");
      }
    }
  };

  return (
    <div className="login-page">

      {/* Left cybersecurity section */}
      <div className="login-left">

        <div className="brand">
          <div className="shield-icon">🛡️</div>

          <div>
            <h1>NetShield AI</h1>
            <span>AI-Powered Network Security</span>
          </div>
        </div>

        <div className="security-content">

          <p className="security-tag">
            CYBERSECURITY OPERATIONS CENTER
          </p>

          <h2>
            Protect Your Network.
            <br />
            <span>Detect Threats.</span>
          </h2>

          <p className="description">
            Advanced AI-powered network anomaly detection and
            real-time threat monitoring for modern digital
            infrastructure.
          </p>

          <div className="security-status">

            <div className="status-item">
              <span className="status-dot"></span>
              <div>
                <strong>AI Threat Detection</strong>
                <small>Active & Monitoring</small>
              </div>
            </div>

            <div className="status-item">
              <span className="status-dot"></span>
              <div>
                <strong>Real-Time Monitoring</strong>
                <small>Network Protected</small>
              </div>
            </div>

            <div className="status-item">
              <span className="status-dot"></span>
              <div>
                <strong>Threat Intelligence</strong>
                <small>System Operational</small>
              </div>
            </div>

          </div>

        </div>

        <div className="login-footer">
          <span>NETSHIELD AI</span>
          <span>•</span>
          <span>SECURE NETWORK OPERATIONS</span>
        </div>

      </div>

      {/* Right login section */}
      <div className="login-right">

        <div className="login-card">

          <div className="login-card-header">

            <div className="login-card-icon">
              🔐
            </div>

            <h2>Welcome Back</h2>

            <p>
              Sign in to access your security dashboard
            </p>

          </div>

          <form onSubmit={handleLogin}>

            <label>Email Address</label>

            <div className="input-wrapper">

              <span>✉️</span>

              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
                required
              />

            </div>

            <label>Password</label>

            <div className="input-wrapper">

              <span>🔒</span>

              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
                required
              />

            </div>

            <div className="login-options">

              <label className="remember">
                <input type="checkbox" />
                <span>Remember me</span>
              </label>

              <span className="forgot">
                Forgot password?
              </span>

            </div>

            <button
              className="login-button"
              type="submit"
            >
              <span>Login to NetShield AI</span>
              <span>→</span>
            </button>

          </form>

          <div className="divider">
            <span>SECURE ACCESS</span>
          </div>

          <p className="create-account">
            Don't have an account?

            <a href="/register">
              Create Account
            </a>
          </p>

          <div className="security-note">
            🔒 Your connection is protected by NetShield AI
            security protocols.
          </div>

        </div>

      </div>

    </div>
  );
}

export default Login;