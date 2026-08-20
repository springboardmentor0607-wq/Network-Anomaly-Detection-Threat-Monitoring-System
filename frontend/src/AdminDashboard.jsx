import {useEffect,useState} from "react";
import API from "./api/api";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from "recharts";


function AdminDashboard(){


const navigate = useNavigate();


const [activePage,setActivePage]=useState("Dashboard");


const [users,setUsers]=useState([]);

const [modelPerformance, setModelPerformance] = useState(null);
const [modelLoading, setModelLoading] = useState(true);



const COLORS=[
"#22c55e",
"#ef4444",
"#3b82f6",
"#f59e0b"
];





// ==========================
// GET USERS FROM DATABASE
// ==========================

const getUsers=async()=>{


try{

const response = await API.get("/users");
setUsers(response.data);

}

catch(error){
console.log(error);

}

};

useEffect(() => {

  getUsers();
  getModelPerformance();

}, []);

const getModelPerformance = async () => {
  try {
    const response = await API.get(
      "/reports/model-performance"
    );

    setModelPerformance(response.data);
  } catch (error) {
    console.log(
      "Model performance error:",
      error
    );
  } finally {
    setModelLoading(false);
  }
};

// ==========================
// UPDATE ROLE
// ==========================


const changeRole=async(id,role)=>{

try{

await API.put(

`/users/${id}/role?role=${role}`

);

alert("Role updated successfully");

getUsers();

}

catch(error){

console.log(error);

alert("Role update failed");

}


};


// ==========================
// DELETE USER
// ==========================


const deleteUser=async(id)=>{

try{

await API.delete(

`/users/${id}`

);

alert("User deleted");

getUsers();


}

catch(error){

console.log(error);

alert("Delete failed");

}

};



// ==========================
// LOGOUT
// ==========================


const logout=()=>{

localStorage.removeItem("user");

navigate("/login");

};


const userData=[

{
name:"Users",
value:users.length
},

{
name:"Inactive",
value:0
}

];


const threatData=[

{
name:"Resolved",
value:85
},

{
name:"Pending",
value:15
}

];


return(


<div className="dashboard">


{/* SIDEBAR */}


<div className="sidebar">

<div className="logo">

<span className="logo-icon">
⛊
</span>

<span className="logo-text">
NetShield AI
</span>

</div>

<ul>

<li onClick={()=>setActivePage("Dashboard")}>
🏠 Dashboard
</li>


<li onClick={()=>setActivePage("Users")}>
👥 User Management
</li>


<li onClick={()=>setActivePage("Analytics")}>
📊 Analytics
</li>


<li onClick={()=>setActivePage("RBAC")}>
🔐 Role Based Access
</li>


<li onClick={()=>setActivePage("Settings")}>
⚙️ Settings
</li>


<li onClick={()=>setActivePage("Profile")}>
👤 Profile
</li>


<li onClick={logout}>
🚪 Logout
</li>


</ul>


</div>


<div className="main">


<h1>
Security Administrator Dashboard
</h1>


{/* =====================
 DASHBOARD
===================== */}

{
activePage==="Dashboard" &&

<>

<div className="cards">


<div className="card">

<h2>
{users.length}
</h2>

<p>
Total Users
</p>

</div>

<div className="card">

<h2>
{users.filter(
u=>u.role==="analyst"
).length}
</h2>

<p>
Security Analysts
</p>

</div>

<div className="card">

<h2>
{users.filter(
u=>u.role==="admin"
).length}
</h2>

<p>
Administrators
</p>

</div>

<div className="card">

<h2>
99%
</h2>

<p>
System Health
</p>

</div>

</div>


<div className="prediction-box">


<h2>
👥 User Distribution
</h2>


<ResponsiveContainer width="100%" height={300}>


<PieChart>


<Pie

data={userData}

dataKey="value"

outerRadius={110}

>


{

userData.map(
(item,index)=>(

<Cell

key={index}

fill={COLORS[index]}

/>

)

)

}


</Pie>

<Tooltip/>

</PieChart>

</ResponsiveContainer>

</div>

<div className="prediction-box">

<h2>
Threat Report Status
</h2>

<ResponsiveContainer width="100%" height={300}>

<BarChart data={threatData}>

<CartesianGrid strokeDasharray="5 5"/>

<XAxis dataKey="name"/>

<YAxis/>

<Tooltip/>

<Bar dataKey="value">

{

threatData.map(
(item,index)=>(


<Cell

key={index}

fill={COLORS[index+2]}

/>

)

)

}

</Bar>

</BarChart>

</ResponsiveContainer>

</div>

{/* =====================
   AI MODEL STATUS
===================== */}

<div className="prediction-box">

  <h2>
    🤖 AI Model Performance
  </h2>

  {modelLoading ? (

    <p>
      Loading model performance...
    </p>

  ) : !modelPerformance ? (

    <p>
      Model performance unavailable.
    </p>

  ) : (

    <div className="cards">

      <div className="card">

        <h2>
          {modelPerformance
            .intrusion_detection
            .accuracy}%
        </h2>

        <p>
          Intrusion Detection
        </p>

        <small>
          {
            modelPerformance
              .intrusion_detection
              .model
          }
        </small>

      </div>


      <div className="card">

        <h2>
          {modelPerformance
            .threat_classification
            .accuracy}%
        </h2>

        <p>
          Threat Classification
        </p>

        <small>
          {
            modelPerformance
              .threat_classification
              .model
          }
        </small>

      </div>


      <div className="card">

        <h2>
          {modelPerformance
            .anomaly_detection
            .anomaly_percentage}%
        </h2>

        <p>
          Anomaly Detection
        </p>

        <small>
          {
            modelPerformance
              .anomaly_detection
              .model
          }
        </small>

      </div>

    </div>

  )}

</div>

</>

}

{/* =====================
 USERS
===================== */}

{
activePage==="Users" &&

<div className="prediction-box">

<h2>
👥 User Management
</h2>

<table>

<thead>

<tr>

<th>
Name
</th>

<th>
Email
</th>

<th>
Role
</th>

<th>
Action
</th>

</tr>

</thead>

<tbody>

{

users.map(user=>(

<tr key={user.id}>

<td>
{user.full_name}
</td>


<td>
{user.email}
</td>


<td>

<select

value={user.role}

onChange={(e)=>
changeRole(
user.id,
e.target.value
)
}

>

<option value="analyst">
Security Analyst
</option>

<option value="admin">
Administrator
</option>

</select>

</td>

<td>

<button

onClick={()=>
deleteUser(user.id)
}

>

Delete

</button>

</td>

</tr>

))

}

</tbody>

</table>

</div>

}


{/* ANALYTICS */}

{
activePage==="Analytics" &&

<div className="prediction-box">

<h2>
📊 Security Analytics
</h2>

<div className="cards">

<div className="card">

<h2>
5421
</h2>

<p>
Network Events
</p>

</div>

<div className="card">

<h2>
36
</h2>

<p>
Blocked Threats
</p>

</div>

<div className="card">

<h2>
12
</h2>

<p>
Critical Alerts
</p>

</div>

</div>

</div>

}

{/* RBAC */}

{
activePage==="RBAC" &&

<div className="prediction-box">

<h2>
🔐 Role Based Access Control
</h2>

<p>
Administrator → Full System Access
</p>

<p>
Security Analyst → Monitoring & Reports Access
</p>

<p>
Viewer → Read Only Access
</p>

</div>

}

{/* SETTINGS */}

{
activePage==="Settings" &&

<div className="prediction-box">

<h2>
⚙️ System Settings
</h2>

<p>
Database Status:

<span style={{color:"#22c55e"}}>
 Connected
</span>

</p>

<p>
AI Model Status:

<span style={{color:"#22c55e"}}>
 Running
</span>

</p>

<p>
Security Monitoring:
Enabled
</p>

</div>

}

{/* PROFILE */}

{
activePage==="Profile" &&

<div className="prediction-box">

<h2>
👤 Administrator Profile
</h2>

<p>
Name: System Administrator
</p>

<p>
Role: Security Administrator
</p>

<p>
Platform: NetShield AI
</p>

</div>

}

</div>

</div>

);

}

export default AdminDashboard;