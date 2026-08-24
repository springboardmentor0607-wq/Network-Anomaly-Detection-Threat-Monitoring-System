import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'
import { AuthProvider } from './context/AuthContext.jsx'
import { TrafficProvider } from './context/TrafficContext.jsx' // Import the new global brain

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* BrowserRouter MUST be the outermost wrapper */}
    <BrowserRouter>
      {/* AuthProvider manages user logins */}
      <AuthProvider>
        {/* TrafficProvider manages the live AI stream globally */}
        <TrafficProvider>
          <App />
        </TrafficProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
)