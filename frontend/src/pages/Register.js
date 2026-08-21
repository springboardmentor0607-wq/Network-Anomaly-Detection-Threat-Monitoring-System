import "./Auth.css";
import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function Register() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();

    console.log("Register button clicked");

    if (password !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    try {
      const response = await axios.post(
        "http://127.0.0.1:8000/register",
        {
          username: username,
          email: email,
          password: password
        }
      );

      console.log("Registration response:", response.data);

      alert("Registration successful!");

      navigate("/login");

    } catch (error) {
      console.error("Registration error:", error);

      if (error.response) {
        console.log("Backend response:", error.response.data);

        const detail =
          error.response.data?.detail ||
          error.response.data?.message ||
          "Registration failed";

        alert(detail);
      } else {
        alert("Cannot connect to backend server.");
      }
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">

        <h1>🛡️ Create Account</h1>

        <p className="subtitle">
          Join NetShield AI Threat Monitoring System
        </p>

        <form onSubmit={handleRegister}>

          <input
            type="text"
            placeholder="Enter Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />

          <input
            type="email"
            placeholder="Enter Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Enter Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />

          <button type="submit">
            Register
          </button>

        </form>

        <p className="register-link">
          Already have an account?{" "}
          <a href="/login">
            Login
          </a>
        </p>

      </div>
    </div>
  );
}
export default Register;
