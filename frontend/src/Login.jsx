import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import "./App.css";


function Login() {


  const navigate = useNavigate();


  const [formData,setFormData] = useState({

    email:"",
    password:""

  });



  const handleChange=(e)=>{


    setFormData({

      ...formData,

      [e.target.name]:e.target.value

    });


  };






  const handleLogin=async()=>{


    try{


      // remove previous session

      localStorage.removeItem("user");



      const response = await fetch(

        "http://127.0.0.1:8000/login",

        {

          method:"POST",

          headers:{

            "Content-Type":"application/json"

          },


          body:JSON.stringify(formData)

        }

      );




      const data = await response.json();






      if(response.ok){



        // Save database user session

        localStorage.setItem(

          "user",

          JSON.stringify(data)

        );




        alert(data.message);





        // Role based dashboard redirect


        if(data.role==="analyst"){


          navigate("/analyst-dashboard");


        }



        else if(data.role==="admin"){


          navigate("/admin-dashboard");


        }



        else{


          alert("Invalid user role");


        }




      }



      else{


        alert(data.detail || "Invalid login");


      }





    }

    catch(error){


      console.log(error);


      alert(

        "Backend server not running"

      );


    }



  };







  return (


    <div className="container">





      <div className="left-panel">


        <div className="logo">


          <span className="logo-icon">
            ⛊
          </span>


          <span className="logo-text">
            NetShield AI
          </span>


        </div>





        <h1>

          Intelligent <span>Network</span>

          <br/>

          Threat Detection


        </h1>





        <p className="desc">

          AI-powered Network Anomaly Detection &

          Threat Monitoring System


        </p>






        <div className="features">


          <p>
            ✔ Real-time Network Monitoring
          </p>


          <p>
            ✔ AI-powered Threat Detection
          </p>


          <p>
            ✔ Role-Based Access Control
          </p>


          <p>
            ✔ Security Analytics Dashboard
          </p>



        </div>





        <div className="footer">

          © 2026 NetShield AI

        </div>




      </div>









      <div className="right-panel">



        <div className="login-box">


          <h2>
            Welcome Back
          </h2>


          <p>
            Sign in to continue
          </p>







          <label>
            Email Address
          </label>



          <input

            type="email"

            name="email"

            placeholder="Enter your email"

            value={formData.email}

            onChange={handleChange}

          />







          <label>
            Password
          </label>



          <input

            type="password"

            name="password"

            placeholder="Enter password"

            value={formData.password}

            onChange={handleChange}

          />









          <div className="options">


            <label>


              <input type="checkbox"/>


              Remember Me


            </label>




            <a href="#">

              Forgot Password?

            </a>



          </div>









          <button onClick={handleLogin}>


            Login


          </button>








          <div className="register">


            Don't have an account?


            <Link to="/register">

              Register

            </Link>



          </div>







        </div>




      </div>






    </div>


  );

}



export default Login;