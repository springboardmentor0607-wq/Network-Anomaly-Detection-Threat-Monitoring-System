import { useState } from "react";
import "./AdminDashboard.css";

function SettingsPage() {
  const [settings, setSettings] = useState({
    company: "NetShield AI",
    email: "admin@netshield.ai",
    aiModel: "Random Forest",
    database: "MongoDB",
    backup: "Daily",
    theme: "Light",
    threshold: 90,
  });

  const [saved, setSaved] = useState(false);

  // ==========================================
  // HANDLE SETTINGS CHANGE
  // ==========================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setSettings((previous) => ({
      ...previous,
      [name]:
        name === "threshold"
          ? Number(value)
          : value,
    }));

    setSaved(false);
  };

  // ==========================================
  // SAVE SETTINGS
  // ==========================================

  const saveSettings = () => {
    localStorage.setItem(
      "netshield_settings",
      JSON.stringify(settings)
    );

    setSaved(true);

    setTimeout(() => {
      setSaved(false);
    }, 3000);
  };

  // ==========================================
  // RESET SETTINGS
  // ==========================================

  const resetSettings = () => {
    const defaultSettings = {
      company: "NetShield AI",
      email: "admin@netshield.ai",
      aiModel: "Random Forest",
      database: "MongoDB",
      backup: "Daily",
      theme: "Light",
      threshold: 90,
    };

    setSettings(defaultSettings);

    localStorage.setItem(
      "netshield_settings",
      JSON.stringify(defaultSettings)
    );

    setSaved(false);
  };

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <>
      {/* ==========================================
          TOP BAR
      ========================================== */}

      <div className="topbar">
        <div>
          <h1>⚙ System Settings</h1>

          <p>
            Configure NetShield AI platform settings
          </p>
        </div>

        <h3 className="status-green">
          🟢 System Active
        </h3>
      </div>

      {/* ==========================================
          SUMMARY
      ========================================== */}

      <div className="cards">
        <div className="card">
          <h2>6</h2>
          <p>Configurations</p>
        </div>

        <div className="card">
          <h2>100%</h2>
          <p>System Health</p>
        </div>

        <div className="card">
          <h2>5</h2>
          <p>Connected Services</p>
        </div>

        <div className="card">
          <h2>{settings.backup}</h2>
          <p>Backup Schedule</p>
        </div>
      </div>

      {/* ==========================================
          ORGANIZATION SETTINGS
      ========================================== */}

      <div className="section">
        <h2>🏢 Organization Settings</h2>

        <table>
          <tbody>
            <tr>
              <th>Company Name</th>

              <td>
                <input
                  type="text"
                  name="company"
                  value={settings.company}
                  onChange={handleChange}
                />
              </td>
            </tr>

            <tr>
              <th>Administrator Email</th>

              <td>
                <input
                  type="email"
                  name="email"
                  value={settings.email}
                  onChange={handleChange}
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ==========================================
          AI CONFIGURATION
      ========================================== */}

      <div className="section">
        <h2>🤖 AI Configuration</h2>

        <table>
          <tbody>
            <tr>
              <th>AI Model</th>

              <td>
                <select
                  name="aiModel"
                  value={settings.aiModel}
                  onChange={handleChange}
                >
                  <option value="Random Forest">
                    Random Forest
                  </option>

                  <option value="XGBoost">
                    XGBoost
                  </option>

                  <option value="Decision Tree">
                    Decision Tree
                  </option>

                  <option value="Neural Network">
                    Neural Network
                  </option>
                </select>
              </td>
            </tr>

            <tr>
              <th>Detection Threshold</th>

              <td>
                <input
                  type="range"
                  name="threshold"
                  min="50"
                  max="100"
                  value={settings.threshold}
                  onChange={handleChange}
                />

                <strong style={{ marginLeft: "12px" }}>
                  {settings.threshold}%
                </strong>
              </td>
            </tr>

            <tr>
              <th>Model Status</th>

              <td className="status-green">
                🟢 Active
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ==========================================
          DATABASE SETTINGS
      ========================================== */}

      <div className="section">
        <h2>🗄 Database Settings</h2>

        <table>
          <tbody>
            <tr>
              <th>Database</th>

              <td>
                <select
                  name="database"
                  value={settings.database}
                  onChange={handleChange}
                >
                  <option value="MongoDB">
                    MongoDB
                  </option>

                  <option value="PostgreSQL">
                    PostgreSQL
                  </option>
                </select>
              </td>
            </tr>

            <tr>
              <th>Connection</th>

              <td className="status-green">
                🟢 Connected
              </td>
            </tr>

            <tr>
              <th>Database Type</th>

              <td>
                Document Database
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ==========================================
          BACKUP SETTINGS
      ========================================== */}

      <div className="section">
        <h2>💾 Backup Settings</h2>

        <table>
          <tbody>
            <tr>
              <th>Automatic Backup</th>

              <td>
                <select
                  name="backup"
                  value={settings.backup}
                  onChange={handleChange}
                >
                  <option value="Daily">
                    Daily
                  </option>

                  <option value="Weekly">
                    Weekly
                  </option>

                  <option value="Monthly">
                    Monthly
                  </option>
                </select>
              </td>
            </tr>

            <tr>
              <th>Backup Status</th>

              <td className="status-green">
                🟢 Scheduled
              </td>
            </tr>

            <tr>
              <th>Last Backup</th>

              <td>
                System-managed
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ==========================================
          APPEARANCE
      ========================================== */}

      <div className="section">
        <h2>🎨 Appearance</h2>

        <table>
          <tbody>
            <tr>
              <th>Theme</th>

              <td>
                <select
                  name="theme"
                  value={settings.theme}
                  onChange={handleChange}
                >
                  <option value="Light">
                    Light
                  </option>

                  <option value="Dark">
                    Dark
                  </option>
                </select>
              </td>
            </tr>

            <tr>
              <th>Interface</th>

              <td>
                Administrator Dashboard
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ==========================================
          SYSTEM STATUS
      ========================================== */}

      <div className="section">
        <h2>🛡 Platform Status</h2>

        <table>
          <tbody>
            <tr>
              <th>NetShield AI</th>

              <td className="status-green">
                🟢 Operational
              </td>
            </tr>

            <tr>
              <th>AI Detection Engine</th>

              <td className="status-green">
                🟢 Active
              </td>
            </tr>

            <tr>
              <th>MongoDB</th>

              <td className="status-green">
                🟢 Connected
              </td>
            </tr>

            <tr>
              <th>Threat Intelligence</th>

              <td className="status-green">
                🟢 Available
              </td>
            </tr>

            <tr>
              <th>PDF Reporting</th>

              <td className="status-green">
                🟢 Available
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ==========================================
          SAVE SETTINGS
      ========================================== */}

      <div className="section">
        {saved && (
          <div className="success-message">
            ✅ Settings saved successfully.
          </div>
        )}

        <button
          className="action-btn"
          onClick={saveSettings}
        >
          💾 Save Settings
        </button>

        <button
          className="action-btn"
          onClick={resetSettings}
          style={{ marginLeft: "10px" }}
        >
          🔄 Reset
        </button>
      </div>
    </>
  );
}

export default SettingsPage;