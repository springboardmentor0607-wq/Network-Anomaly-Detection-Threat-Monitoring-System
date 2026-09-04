import React from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate
} from 'react-router-dom';

import Sidebar from './components/Sidebar';

import Login from './pages/Login';
import Register from './pages/Register';

import Dashboard from './pages/Dashboard';
import NetworkStatus from './pages/NetworkStatus';
import AIManagement from './pages/AIManagement';
import ModelTraining from './pages/ModelTraining';
import ModelEvaluation from './pages/ModelEvaluation';
import TestModel from './pages/TestModel';
import AnomalyDetection from './pages/AnomalyDetection';
import ThreatReports from './pages/ThreatReports';
import SystemMonitoring from './pages/SystemMonitoring';
import Settings from './pages/Settings';
import ModelManagement from './pages/ModelManagement';


/* ==============================
   PROTECTED LAYOUT
================================ */

const ProtectedLayout = ({ children }) => {

  const token = localStorage.getItem('netshield_token');

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex min-h-screen bg-[#070b14]">

      <Sidebar />

      <main className="flex-1 overflow-y-auto">
        {children}
      </main>

    </div>
  );
};


/* ==============================
   APPLICATION
================================ */

function App() {

  return (

    <BrowserRouter>

      <Routes>

        {/* =========================
            PUBLIC ROUTES
        ========================== */}

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/register"
          element={<Register />}
        />


        {/* =========================
            DASHBOARD
        ========================== */}

        <Route
          path="/"
          element={
            <ProtectedLayout>
              <Dashboard />
            </ProtectedLayout>
          }
        />


        {/* =========================
            MAIN
        ========================== */}

        <Route
          path="/network-status"
          element={
            <ProtectedLayout>
              <NetworkStatus />
            </ProtectedLayout>
          }
        />

        <Route
          path="/ai-management"
          element={
            <ProtectedLayout>
              <AIManagement />
            </ProtectedLayout>
          }
        />


        {/* =========================
            MODEL MANAGEMENT
        ========================== */}

        <Route
          path="/model-management"
          element={
            <ProtectedLayout>
              <ModelEvaluation />
            </ProtectedLayout>
          }
        />

        <Route
          path="/model-training"
          element={
            <ProtectedLayout>
              <ModelTraining />
            </ProtectedLayout>
          }
        />

        <Route
          path="/model-evaluation"
          element={
            <ProtectedLayout>
              <ModelEvaluation />
            </ProtectedLayout>
          }
        />

        <Route
          path="/test-model"
          element={
            <ProtectedLayout>
              <TestModel />
            </ProtectedLayout>
          }
        />


        {/* =========================
            AI / THREATS
        ========================== */}

        <Route
          path="/anomaly-detection"
          element={
            <ProtectedLayout>
              <AnomalyDetection />
            </ProtectedLayout>
          }
        />

        <Route
          path="/threat-reports"
          element={
            <ProtectedLayout>
              <ThreatReports />
            </ProtectedLayout>
          }
        />


        {/* =========================
            SYSTEM
        ========================== */}

        <Route
          path="/system-monitoring"
          element={
            <ProtectedLayout>
              <SystemMonitoring />
            </ProtectedLayout>
          }
        />

        <Route
          path="/settings"
          element={
            <ProtectedLayout>
              <Settings />
            </ProtectedLayout>
          }
        />


        {/* =========================
            UNKNOWN ROUTE
        ========================== */}

        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />

      </Routes>

    </BrowserRouter>
  );
}


export default App;