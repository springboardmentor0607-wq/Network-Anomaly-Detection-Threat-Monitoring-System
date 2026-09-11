import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/Login.css";

function Login() {

  const navigate = useNavigate();

  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    setLoginData({
      ...loginData,
      [e.target.name]: e.target.value,
    });
  };

  const handleLogin = async (e) => {

    e.preventDefault();

    if (!loginData.email || !loginData.password) {
      alert("Please enter Email and Password.");
      return;
    }

    try {

      const response = await axios.post(
        "http://127.0.0.1:8000/auth/login",
        {
          email: loginData.email,
          password: loginData.password,
        }
      );

      console.log(response.data);

      // Save user details
      localStorage.setItem("userName", response.data.name);
      localStorage.setItem("userRole", response.data.role);

      const role = response.data.role;

      if (role === "Administrator") {

        navigate("/admin");

      } else if (role === "Security Analyst") {

        navigate("/security");

      } else {

        alert("Unknown Role");

      }

    } catch (error) {

      console.error(error);

      if (error.response) {

        alert(error.response.data.detail);

      } else {

        alert("Server Error");

      }

    }

  };

  return (

    <div className="login-page">

      <div className="left-panel">

        <h1>🛡️ NetShield AI</h1>

        <p>
          AI Powered Network Intrusion Detection &
          <br />
          Threat Monitoring System
        </p>

        <img
          src="https://cdn-icons-png.flaticon.com/512/2092/2092757.png"
          alt="Cyber Security"
        />

      </div>

      <div className="login-card">

        <h2>Welcome Back</h2>

        <p>Please login to continue</p>

        <input
          type="email"
          name="email"
          placeholder="Email Address"
          value={loginData.email}
          onChange={handleChange}
        />

        <input
          type="password"
          name="password"
          placeholder="Password"
          value={loginData.password}
          onChange={handleChange}
        />

        <button onClick={handleLogin}>
          Login
        </button>

        <p className="register">
          New User?
          <Link to="/register"> Register Here</Link>
        </p>

      </div>

    </div>

  );

}

export default Login;