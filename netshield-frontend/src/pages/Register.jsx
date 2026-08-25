import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FaShieldAlt,
  FaUser,
  FaEnvelope,
  FaLock,
  FaUserShield,
  FaEye,
  FaEyeSlash,
  FaSpinner,
  FaExclamationCircle,
  FaCheckCircle
} from "react-icons/fa";
import "../styles/Register.css";

function Register() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "",
  });

  const [errors, setErrors] = useState({});
  const [successMsg, setSuccessMsg] = useState("");

  // Dynamic Password Strength Meter logic
  const getPasswordStrength = (pass) => {
    if (!pass) return { level: "empty", label: "", percentage: 0 };
    let score = 0;
    if (pass.length >= 8) score += 1;
    if (/[a-z]/.test(pass) && /[A-Z]/.test(pass)) score += 1;
    if (/\d/.test(pass)) score += 1;
    if (/[^a-zA-Z0-9]/.test(pass)) score += 1;

    if (score <= 1) return { level: "weak", label: "Weak", percentage: 33 };
    if (score === 2 || score === 3) return { level: "medium", label: "Medium", percentage: 66 };
    return { level: "strong", label: "Strong", percentage: 100 };
  };

  const strength = getPasswordStrength(formData.password);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

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

    const fullNameTrimmed = formData.fullName.trim();
    const emailTrimmed = formData.email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // Full Name
    if (!fullNameTrimmed) {
      newErrors.fullName = "Full Name is required";
    } else if (fullNameTrimmed.length < 2) {
      newErrors.fullName = "Full Name must be at least 2 characters";
    }

    // Email
    if (!emailTrimmed) {
      newErrors.email = "Email Address is required";
    } else if (!emailRegex.test(emailTrimmed)) {
      newErrors.email = "Please enter a valid email address";
    }

    // Password
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters long";
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = "Password must include uppercase, lowercase, and a number";
    }

    // Confirm Password
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    // Role
    if (!formData.role) {
      newErrors.role = "Please select a security role";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    setErrors({});
    setSuccessMsg("");

    try {
      const response = await fetch("http://127.0.0.1:5000/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          full_name: formData.fullName.trim(),
          email: formData.email.trim(),
          password: formData.password,
          role: formData.role,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMsg("Account created successfully! Redirecting to login portal...");
        setFormData({
          fullName: "",
          email: "",
          password: "",
          confirmPassword: "",
          role: "",
        });

        setTimeout(() => {
          navigate("/login");
        }, 1500);
      } else {
        const errorMsg = data.message || "Registration failed. Please try again.";
        const lowerMsg = errorMsg.toLowerCase();

        const newErrors = { server: errorMsg };

        if (lowerMsg.includes("already registered") || lowerMsg.includes("duplicate")) {
          newErrors.email = "Email address is already registered";
        }

        setErrors(newErrors);
      }
    } catch (error) {
      console.error("Registration request failed:", error);
      setErrors({
        server: "Server Error! Ensure Flask backend is running on port 5000.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card auth-card-wide">
        <div className="auth-header">
          <div className="shield-icon-badge">
            <FaShieldAlt className="shield-icon" />
          </div>
          <h1>
            NetShield <span className="highlight-text">AI</span>
          </h1>
          <p className="subtitle">
            Account Registration for Security Operations & Administration
          </p>
        </div>

        {errors.server && (
          <div className="auth-alert auth-alert-error">
            <FaExclamationCircle className="alert-icon" />
            <span>{errors.server}</span>
          </div>
        )}

        {successMsg && (
          <div className="auth-alert auth-alert-success">
            <FaCheckCircle className="alert-icon" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="auth-form">
          <div className="form-group">
            <label htmlFor="fullName">Full Name</label>
            <div className="input-wrapper">
              <FaUser className="field-icon" />
              <input
                id="fullName"
                type="text"
                name="fullName"
                placeholder="e.g. Alex Mercer"
                value={formData.fullName}
                onChange={handleChange}
                className={errors.fullName ? "input-error" : ""}
                disabled={loading}
              />
            </div>
            {errors.fullName && <span className="error-text">{errors.fullName}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <div className="input-wrapper">
              <FaEnvelope className="field-icon" />
              <input
                id="email"
                type="email"
                name="email"
                placeholder="e.g. alex.mercer@netshield.ai"
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
                placeholder="Min. 8 chars (uppercase, lowercase, number)"
                value={formData.password}
                onChange={handleChange}
                className={errors.password ? "input-error" : ""}
                disabled={loading}
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

            {formData.password && (
              <div className="password-strength-container">
                <div className="strength-bar-track">
                  <div
                    className={`strength-bar-fill strength-${strength.level}`}
                    style={{ width: `${strength.percentage}%` }}
                  ></div>
                </div>
                <span className={`strength-label label-${strength.level}`}>
                  Password Strength: {strength.label}
                </span>
              </div>
            )}

            {errors.password && <span className="error-text">{errors.password}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <div className="input-wrapper">
              <FaLock className="field-icon" />
              <input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                placeholder="Re-enter your password"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={errors.confirmPassword ? "input-error" : ""}
                disabled={loading}
              />
              <button
                type="button"
                className="eye-btn"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                tabIndex={-1}
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
              >
                {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
            {errors.confirmPassword && (
              <span className="error-text">{errors.confirmPassword}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="role">Security Role</label>
            <div className="input-wrapper">
              <FaUserShield className="field-icon" />
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                className={errors.role ? "input-error" : ""}
                disabled={loading}
              >
                <option value="">Select Security Role</option>
                <option value="Security Analyst">Security Analyst</option>
                <option value="Security Administrator">Security Administrator</option>
              </select>
            </div>
            {errors.role && <span className="error-text">{errors.role}</span>}
          </div>

          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? (
              <>
                <FaSpinner className="spin-icon" />
                <span>Creating Account...</span>
              </>
            ) : (
              <span>Create Account</span>
            )}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Already have an account?{" "}
            <Link to="/login" className="auth-link">
              Login to Portal
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Register;