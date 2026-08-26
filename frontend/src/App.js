import React from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Analytics from "./pages/Analytics";
import Predictions from "./pages/Predictions";
import LiveNetwork from "./pages/LiveNetwork";
import ThreatAlerts from "./pages/ThreatAlerts";
import Investigation from "./pages/Investigation";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* =====================================================
            AUTHENTICATION
        ====================================================== */}

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/register"
          element={<Register />}
        />


        {/* =====================================================
            MAIN DASHBOARD
        ====================================================== */}

        <Route
          path="/dashboard"
          element={<Dashboard />}
        />


        {/* =====================================================
            ANALYTICS
        ====================================================== */}

        <Route
          path="/analytics"
          element={<Analytics />}
        />


        {/* =====================================================
            PREDICTIONS
        ====================================================== */}

        <Route
          path="/predictions"
          element={<Predictions />}
        />


        {/* =====================================================
            LIVE NETWORK MONITOR
        ====================================================== */}

        <Route
          path="/live-network"
          element={<LiveNetwork />}
        />


        {/* =====================================================
            THREAT ALERTS
        ====================================================== */}

        <Route
          path="/threat-alerts"
          element={<ThreatAlerts />}
        />


        {/* =====================================================
            INCIDENT INVESTIGATION
            IMPORTANT:
            This must match ThreatAlerts.js:
            navigate(`/investigation/${id}`)
        ====================================================== */}

        <Route
          path="/investigation/:alertId"
          element={<Investigation />}
        />


        {/* =====================================================
            OPTIONAL OLD INVESTIGATION URL
            Keeps old links working if you have any.
        ====================================================== */}

        <Route
          path="/investigate/:id"
          element={<Investigation />}
        />


        {/* =====================================================
            DEFAULT ROUTE
        ====================================================== */}

        <Route
          path="/"
          element={
            <Navigate
              to="/login"
              replace
            />
          }
        />


        {/* =====================================================
            UNKNOWN URL
        ====================================================== */}

        <Route
          path="*"
          element={
            <Navigate
              to="/login"
              replace
            />
          }
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;