import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FaShieldAlt,
  FaEnvelope,
  FaLock,
  FaEye,
  FaEyeSlash,
  FaSpinner,
  FaExclamationCircle
} from "react-icons/fa";
import "../styles/Login.css";

function Login() {
  const navigate = useNavigate();

  useEffect(() => {
    const userJson = localStorage.getItem("netshield_user");
    if (userJson) {
      try {
        const user = JSON.parse(userJson);
        if (user && user.role) {
          const r = user.role;
          if (r === "Security Administrator" || r === "Admin" || r === "admin") {
            navigate("/admin/dashboard", { replace: true });
          } else {
            navigate("/analyst/dashboard", { replace: true });
          }
        }
      } catch (e) {
        localStorage.removeItem("netshield_user");
      }
    }
  }, [navigate]);

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);


  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear field-specific error as user types
    if (errors[name] || errors.server) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
        server: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    const emailTrimmed = formData.email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailTrimmed) {
      newErrors.email = "Email Address is required";
    } else if (!emailRegex.test(emailTrimmed)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    setErrors({});

    try {
      const response = await fetch("http://127.0.0.1:5000/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email.trim(),
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Save user state in localStorage for Topbar & Profile
        const userEmail = data.email || formData.email.trim();
        const userFullName = data.full_name || data.fullName || userEmail.split("@")[0];
        const userName = data.username || userEmail.split("@")[0];

        localStorage.setItem(
          "netshield_user",
          JSON.stringify({
            email: userEmail,
            role: data.role,
            fullName: userFullName,
            username: userName,
            lastLogin: new Date().toLocaleString(),
          })
        );

        // Redirect based on role
        if (data.role === "Security Administrator" || data.role === "Admin" || data.role === "admin") {
          navigate("/admin/dashboard");
        } else {
          navigate("/analyst/dashboard");
        }
      } else {
        // Handle backend error responses (400, 401, 404, etc.)
        const errorMsg = data.message || "Authentication failed. Please check your credentials.";
        const lowerMsg = errorMsg.toLowerCase();

        const newErrors = { server: errorMsg };

        if (lowerMsg.includes("user not found")) {
          newErrors.email = "No account found with this email address";
        } else if (lowerMsg.includes("incorrect password")) {
          newErrors.password = "Incorrect password entered";
        } else if (lowerMsg.includes("invalid email")) {
          newErrors.email = "Invalid email format";
        }

        setErrors(newErrors);
      }
    } catch (error) {
      console.error("Login request failed:", error);
      setErrors({
        server: "Server Connection Error! Please ensure the Flask backend is running on port 5000.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="shield-icon-badge">
            <FaShieldAlt className="shield-icon" />
          </div>
          <h1>
            NetShield <span className="highlight-text">AI</span>
          </h1>
          <p className="subtitle">
            Enterprise Network Threat Detection & Anomaly Intelligence
          </p>
        </div>

        {errors.server && (
          <div className="auth-alert auth-alert-error">
            <FaExclamationCircle className="alert-icon" />
            <span>{errors.server}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <div className="input-wrapper">
              <FaEnvelope className="field-icon" />
              <input
                id="email"
                type="email"
                name="email"
                placeholder="e.g. analyst@netshield.ai"
                value={formData.email}
                onChange={handleChange}
                className={errors.email ? "input-error" : ""}
                disabled={loading}
                autoComplete="email"
              />
            </div>
            {errors.email && <span className="error-text">{errors.email}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="input-wrapper">
              <FaLock className="field-icon" />
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Enter your account password"
                value={formData.password}
                onChange={handleChange}
                className={errors.password ? "input-error" : ""}
                disabled={loading}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="eye-btn"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
            {errors.password && <span className="error-text">{errors.password}</span>}
          </div>

          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? (
              <>
                <FaSpinner className="spin-icon" />
                <span>Authenticating...</span>
              </>
            ) : (
              <span>Login to SOC Portal</span>
            )}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Don't have an account?{" "}
            <Link to="/register" className="auth-link">
              Create Account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
