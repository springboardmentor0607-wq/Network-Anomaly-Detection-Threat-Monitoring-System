import { Routes, Route } from "react-router-dom";
import Login from "./Login";
import Register from "./Register";
import AnalystDashboard from "./AnalystDashboard";
import AdminDashboard from "./AdminDashboard";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/analyst-dashboard" element={<AnalystDashboard />} />
      <Route path="/admin-dashboard" element={<AdminDashboard />} />
    </Routes>
  );
}

export default App;