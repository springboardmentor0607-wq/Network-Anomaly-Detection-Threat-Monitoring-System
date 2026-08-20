import { Link } from "react-router-dom";
import { useState } from "react";
import "./App.css";

function Register() {

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: ""
  });


  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };


  const handleRegister = async () => {

    if(formData.password !== formData.confirmPassword){
      alert("Passwords do not match");
      return;
    }


    try {

      const response = await fetch(
        "http://127.0.0.1:8000/register",
        {
          method:"POST",
          headers:{
            "Content-Type":"application/json"
          },
          body: JSON.stringify({
            full_name: formData.name,
            email: formData.email,
            password: formData.password,
            role: formData.role
          })
        }
      );


      const data = await response.json();

      alert(data.message);

    }
    catch(error){
      console.log(error);
      alert("Registration failed");
    }

  };


  return (
    <div className="container">

      <div className="left-panel">

        <div className="logo">
          <span className="logo-icon">⛊ </span>
          <span className="logo-text">NetShield AI</span>
        </div>

        <h1>
          Create Your
          <br />
          <span>Secure Account</span>
        </h1>

        <p className="desc">
          Register to access the AI-powered Network Anomaly Detection &
          Threat Monitoring System.
        </p>

        <div className="features">
          <p>✔ Secure Authentication</p>
          <p>✔ Role-Based Access</p>
          <p>✔ Network Monitoring</p>
          <p>✔ Security Analytics</p>
        </div>

        <div className="footer">
          © 2026 NetShield AI
        </div>

      </div>


      <div className="right-panel">

        <div className="login-box">

          <h2>Create Account</h2>
          <p>Register to continue</p>


          <label>Full Name</label>
          <input 
            type="text"
            name="name"
            placeholder="Enter your full name"
            onChange={handleChange}
          />


          <label>Email Address</label>
          <input 
            type="email"
            name="email"
            placeholder="Enter your email"
            onChange={handleChange}
          />


          <label>Password</label>
          <input 
            type="password"
            name="password"
            placeholder="Create password"
            onChange={handleChange}
          />


          <label>Confirm Password</label>
          <input 
            type="password"
            name="confirmPassword"
            placeholder="Confirm password"
            onChange={handleChange}
          />


          <label>Role</label>

          <select 
            name="role"
            onChange={handleChange}
          >
            <option value="">Select Role</option>
            <option value="analyst">
              Security Analyst
            </option>

            <option value="admin">
              Security Administrator
            </option>

          </select>


          <button onClick={handleRegister}>
            Create Account
          </button>


          <div className="register">
            Already have an account?
            <Link to="/login">Login</Link>
          </div>


        </div>

      </div>

    </div>
  );
}

export default Register;