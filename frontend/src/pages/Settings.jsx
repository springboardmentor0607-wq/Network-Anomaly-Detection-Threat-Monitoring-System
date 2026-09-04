import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  User,
  Shield,
  Bell,
  Save,
  CheckCircle
} from 'lucide-react';

const Settings = () => {
  const [saved, setSaved] = useState(false);

  const [notifications, setNotifications] = useState(true);
  const [liveMonitoring, setLiveMonitoring] = useState(true);
  const [autoDetection, setAutoDetection] = useState(true);

  const handleSave = () => {
    setSaved(true);

    setTimeout(() => {
      setSaved(false);
    }, 2500);
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-white p-6">

      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="mb-8 flex items-center gap-3">

          <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30">
            <SettingsIcon className="w-7 h-7 text-cyan-400" />
          </div>

          <div>
            <h1 className="text-3xl font-bold">
              Settings
            </h1>

            <p className="text-sm text-slate-400">
              Configure NetShield AI security operations
            </p>
          </div>

        </div>

        {/* Profile */}
        <div className="bg-[#0d1527] border border-[#1b2a4a] rounded-2xl p-6 mb-6">

          <div className="flex items-center gap-3 mb-6">

            <User className="text-cyan-400" />

            <div>
              <h2 className="text-xl font-bold">
                Profile Settings
              </h2>

              <p className="text-sm text-slate-400">
                Security operations account information
              </p>
            </div>

          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

            <div>
              <label className="text-xs text-slate-400">
                Full Name
              </label>

              <input
                type="text"
                defaultValue="Security Analyst"
                className="w-full mt-2 bg-[#070b14] border border-[#1b2a4a] rounded-xl px-4 py-3 text-sm text-white outline-none"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400">
                Email Address
              </label>

              <input
                type="email"
                defaultValue="analyst@netshield.ai"
                className="w-full mt-2 bg-[#070b14] border border-[#1b2a4a] rounded-xl px-4 py-3 text-sm text-white outline-none"
              />
            </div>

          </div>

        </div>

        {/* Security */}
        <div className="bg-[#0d1527] border border-[#1b2a4a] rounded-2xl p-6 mb-6">

          <div className="flex items-center gap-3 mb-6">

            <Shield className="text-cyan-400" />

            <div>
              <h2 className="text-xl font-bold">
                Security Settings
              </h2>

              <p className="text-sm text-slate-400">
                Configure threat detection behavior
              </p>
            </div>

          </div>

          <div className="space-y-5">

            {/* Live Monitoring */}
            <div className="flex items-center justify-between">

              <div>
                <p className="font-semibold">
                  Live Monitoring
                </p>

                <p className="text-xs text-slate-400">
                  Continuously monitor network activity
                </p>
              </div>

              <button
                type="button"
                onClick={() => setLiveMonitoring(!liveMonitoring)}
                className={`w-12 h-6 rounded-full transition ${
                  liveMonitoring
                    ? 'bg-cyan-400'
                    : 'bg-slate-700'
                }`}
              >
                <span
                  className={`block w-5 h-5 bg-white rounded-full transition ${
                    liveMonitoring
                      ? 'translate-x-6'
                      : 'translate-x-0.5'
                  }`}
                />
              </button>

            </div>

            {/* AI Detection */}
            <div className="flex items-center justify-between">

              <div>
                <p className="font-semibold">
                  Automatic AI Detection
                </p>

                <p className="text-xs text-slate-400">
                  Automatically analyze suspicious network traffic
                </p>
              </div>

              <button
                type="button"
                onClick={() => setAutoDetection(!autoDetection)}
                className={`w-12 h-6 rounded-full transition ${
                  autoDetection
                    ? 'bg-cyan-400'
                    : 'bg-slate-700'
                }`}
              >
                <span
                  className={`block w-5 h-5 bg-white rounded-full transition ${
                    autoDetection
                      ? 'translate-x-6'
                      : 'translate-x-0.5'
                  }`}
                />
              </button>

            </div>

          </div>

        </div>

        {/* Notifications */}
        <div className="bg-[#0d1527] border border-[#1b2a4a] rounded-2xl p-6 mb-6">

          <div className="flex items-center gap-3 mb-6">

            <Bell className="text-cyan-400" />

            <div>
              <h2 className="text-xl font-bold">
                Notifications
              </h2>

              <p className="text-sm text-slate-400">
                Manage security alerts and notifications
              </p>
            </div>

          </div>

          <div className="flex items-center justify-between">

            <div>
              <p className="font-semibold">
                Threat Alerts
              </p>

              <p className="text-xs text-slate-400">
                Receive alerts when critical threats are detected
              </p>
            </div>

            <button
              type="button"
              onClick={() => setNotifications(!notifications)}
              className={`w-12 h-6 rounded-full transition ${
                notifications
                  ? 'bg-cyan-400'
                  : 'bg-slate-700'
              }`}
            >
              <span
                className={`block w-5 h-5 bg-white rounded-full transition ${
                  notifications
                    ? 'translate-x-6'
                    : 'translate-x-0.5'
                }`}
              />
            </button>

          </div>

        </div>

        {/* Save */}
        <div className="flex justify-end">

          <button
            type="button"
            onClick={handleSave}
            className="flex items-center gap-2 bg-cyan-400 hover:bg-cyan-300 text-[#070b14] font-bold px-6 py-3 rounded-xl transition"
          >
            {saved ? (
              <>
                <CheckCircle className="w-5 h-5" />
                Saved
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Save Settings
              </>
            )}
          </button>

        </div>

      </div>

    </div>
  );
};

export default Settings;