import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/Register.css";

function Register() {

  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "",
    password: "",
    confirmPassword: "",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleRegister = async (e) => {

    e.preventDefault();

    if (
      !formData.name ||
      !formData.email ||
      !formData.role ||
      !formData.password ||
      !formData.confirmPassword
    ) {
      alert("Please fill all fields.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    try {

      const response = await axios.post(
        "http://127.0.0.1:8000/auth/register",
        {
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: formData.role,
        }
      );

      alert(response.data.message);

      // Clear form
      setFormData({
        name: "",
        email: "",
        role: "",
        password: "",
        confirmPassword: "",
      });

      // Go to Login page
      navigate("/");

    } catch (error) {

      console.error(error);

      if (error.response) {
        alert(error.response.data.detail);
      } else {
        alert("Registration Failed");
      }

    }

  };

  return (

    <div className="register-page">

      <div className="left-panel">

        <h1>🛡 NetShield AI</h1>

        <p>
          Create your account to access the
          <br />
          AI Powered Cybersecurity Monitoring Dashboard.
        </p>

        <img
          src="https://cdn-icons-png.flaticon.com/512/2092/2092757.png"
          alt="Cyber Security"
        />

      </div>

      <div className="register-card">

        <h2>Create Account</h2>

        <p>Register to continue</p>

        <input
          type="text"
          name="name"
          placeholder="Full Name"
          value={formData.name}
          onChange={handleChange}
        />

        <input
          type="email"
          name="email"
          placeholder="Email Address"
          value={formData.email}
          onChange={handleChange}
        />

        <select
          name="role"
          value={formData.role}
          onChange={handleChange}
        >
          <option value="">Select Role</option>

          <option value="Administrator">
            Administrator
          </option>

          <option value="Security Analyst">
            Security Analyst
          </option>

        </select>

        <input
          type="password"
          name="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
        />

        <input
          type="password"
          name="confirmPassword"
          placeholder="Confirm Password"
          value={formData.confirmPassword}
          onChange={handleChange}
        />

        <button onClick={handleRegister}>
          Create Account
        </button>

        <p className="login-link">
          Already have an account?
          <Link to="/"> Login Here</Link>
        </p>

      </div>

    </div>

  );

}

export default Register;