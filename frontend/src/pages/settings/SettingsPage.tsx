import React, { useState } from 'react';
import { Card } from '../../components/common/Card';
import { Settings as SettingsIcon, Shield, Radio, Volume2, Key, Database, Save, CheckCircle } from 'lucide-react';
import { useTelemetry } from '../../contexts/TelemetryContext';

export const SettingsPage: React.FC = () => {
  const { demoMode, setDemoMode, audioAlerts, setAudioAlerts } = useTelemetry();
  const [riskThreshold, setRiskThreshold] = useState<number>(75);
  const [simSpeed, setSimSpeed] = useState<number>(2500);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">System Settings & Thresholds</h2>
          <p className="text-xs text-gray-400">Configure real-time monitoring thresholds, alert triggers, and telemetry stream speeds.</p>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-4 bg-emerald-950/80 border border-emerald-500/50 rounded-xl text-emerald-300 text-xs font-bold flex items-center space-x-2 animate-in fade-in duration-200">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>System configuration updated successfully.</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Telemetry Stream Settings */}
        <Card title="Telemetry Stream & Simulation">
          <div className="space-y-4">
            <div className="flex items-center justify-between py-2 border-b border-[#1F2937]">
              <div>
                <h4 className="text-xs font-bold text-white">Demonstration Mode (DEMO MODE)</h4>
                <p className="text-[11px] text-gray-400">Simulate synthetic live packet traffic, threat alerts, and dynamic risk scoring.</p>
              </div>
              <button
                type="button"
                onClick={() => setDemoMode(!demoMode)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                  demoMode ? 'bg-cyan-500' : 'bg-gray-700'
                }`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${demoMode ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>

            <div className="py-2 border-b border-[#1F2937]">
              <div className="flex justify-between items-center mb-1">
                <h4 className="text-xs font-bold text-white">Simulation Packet Stream Interval (ms)</h4>
                <span className="text-xs font-bold text-cyan-400">{simSpeed} ms</span>
              </div>
              <input
                type="range"
                min="500"
                max="5000"
                step="250"
                value={simSpeed}
                onChange={(e) => setSimSpeed(Number(e.target.value))}
                className="w-full h-2 bg-[#131C2E] rounded-lg appearance-none cursor-pointer accent-cyan-500"
              />
            </div>

            <div className="flex items-center justify-between py-2">
              <div>
                <h4 className="text-xs font-bold text-white">Sound Notifications for Critical Alerts</h4>
                <p className="text-[11px] text-gray-400">Play an audible audio warning whenever an anomaly with risk score &gt; 80 is detected.</p>
              </div>
              <button
                type="button"
                onClick={() => setAudioAlerts(!audioAlerts)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                  audioAlerts ? 'bg-cyan-500' : 'bg-gray-700'
                }`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${audioAlerts ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
          </div>
        </Card>

        {/* Risk Thresholds & Escalation */}
        <Card title="Alert Escalation & Risk Scoring Rules">
          <div className="space-y-4">
            <div className="py-2 border-b border-[#1F2937]">
              <div className="flex justify-between items-center mb-1">
                <h4 className="text-xs font-bold text-white">Critical Alert Escalation Risk Score Threshold</h4>
                <span className="text-xs font-bold text-red-400">{riskThreshold} / 100</span>
              </div>
              <input
                type="range"
                min="50"
                max="95"
                step="5"
                value={riskThreshold}
                onChange={(e) => setRiskThreshold(Number(e.target.value))}
                className="w-full h-2 bg-[#131C2E] rounded-lg appearance-none cursor-pointer accent-red-500"
              />
              <p className="mt-1 text-[11px] text-gray-400">Anomalies exceeding this threshold will automatically generate high-priority alerts and trigger toasts.</p>
            </div>
          </div>
        </Card>

        {/* Threat Intelligence Integrations */}
        <Card title="Threat Intelligence API Integration">
          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-gray-300 mb-1">AbuseIPDB API Key (Optional)</label>
              <input
                type="password"
                placeholder="Paste key (e.g. 8fa12c9e41...)"
                className="w-full bg-[#131C2E] border border-[#1F2937] rounded-xl px-4 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block font-bold text-gray-300 mb-1">VirusTotal API Key (Optional)</label>
              <input
                type="password"
                placeholder="Paste key (e.g. 4d92a18...)"
                className="w-full bg-[#131C2E] border border-[#1F2937] rounded-xl px-4 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>
        </Card>

        <button
          type="submit"
          className="px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs rounded-xl shadow-lg shadow-cyan-500/20 transition flex items-center space-x-2"
        >
          <Save className="w-4 h-4" />
          <span>Save System Settings</span>
        </button>
      </form>
    </div>
  );
};
