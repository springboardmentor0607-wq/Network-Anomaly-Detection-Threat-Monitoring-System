import React, { useState } from 'react';
import Toast from '../../components/common/Toast';

const SettingsPage = () => {
  const [toast, setToast] = useState(null);

  const handleSave = (e) => {
    e.preventDefault();
    setToast({ message: 'System configuration updated successfully', type: 'success' });
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-xl font-extrabold text-white tracking-tight">System & Security Settings</h2>
        <p className="text-xs text-slate-400">Configure Thresholds, API Endpoints, & Notification Integrations</p>
      </div>

      <form onSubmit={handleSave} className="glass-card rounded-2xl p-6 border border-slate-800 space-y-5 font-mono text-xs">
        <div>
          <label className="block text-slate-300 mb-1 font-bold">API Backend Base URL</label>
          <input type="text" defaultValue="/api" className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-cyan-300" />
        </div>

        <div>
          <label className="block text-slate-300 mb-1 font-bold">AI Anomaly Risk Threshold (0.00 - 1.00)</label>
          <input type="number" step="0.05" defaultValue="0.75" className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white" />
        </div>

        <div>
          <label className="block text-slate-300 mb-1 font-bold">Packet Capture Engine Buffer Size (MB)</label>
          <input type="number" defaultValue="2048" className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white" />
        </div>

        <button type="submit" className="px-5 py-2.5 bg-cyan-500 text-black font-extrabold uppercase rounded-xl shadow-glow-cyan">
          Save Configuration
        </button>
      </form>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default SettingsPage;
