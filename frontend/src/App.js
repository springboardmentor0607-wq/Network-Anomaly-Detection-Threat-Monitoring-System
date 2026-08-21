import React from "react";
import AlertInvestigation from "./pages/AlertInvestigation";
import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import LiveNetwork from "./pages/LiveNetwork";
import ThreatAlerts from "./pages/ThreatAlerts";
import Investigation from "./pages/Investigation";
import ThreatTimeline from "./pages/ThreatTimeline";
import AIPredictions from "./pages/AIPredictions";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* LOGIN */}
        <Route
          path="/login"
          element={<Login />}
        />

        {/* REGISTER */}
        <Route
          path="/register"
          element={<Register />}
        />

        {/* DASHBOARD */}
        <Route
          path="/dashboard"
          element={<Dashboard />}
        />
       

        {/* LIVE NETWORK */}
        <Route
          path="/live-network"
          element={<LiveNetwork />}
        />
        <Route
          path="/alert-investigation/:alertId"
          element={<AlertInvestigation />}
        />

        {/* THREAT ALERTS */}
        <Route
          path="/threat-alerts"
          element={<ThreatAlerts />}
        />

        {/* INVESTIGATION */}
        <Route
          path="/investigation"
          element={<Investigation />}
        />

        {/* THREAT TIMELINE */}
        <Route
          path="/threat-timeline"
          element={<ThreatTimeline />}
        />

        {/* AI PREDICTIONS */}
        <Route
          path="/ai-predictions"
          element={<AIPredictions />}
        />

        {/* DEFAULT */}
        <Route
          path="/"
          element={<Login />}
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;