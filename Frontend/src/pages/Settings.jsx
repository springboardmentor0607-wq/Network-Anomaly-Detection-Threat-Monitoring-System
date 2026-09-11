import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';

const Settings = () => {
  const outletContext = useOutletContext();
  const theme = outletContext?.theme || 'dark';
  
  const [activeTab, setActiveTab] = useState('System');
  const [settings, setSettings] = useState({
    fastapiUrl: 'http://localhost:8000/api/v1',
    retention: '30 Days',
    interface: 'en0 (MacBook Air Network)',
    promiscuous: true,
    jwtExpiry: 60,
    mfaEnforced: false,
    baselineSensitivity: 85,
    autoBan: true,
    profileName: 'Admin User',
    profileEmail: 'admin@netshield.com'
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch('http://localhost:8000/api/system/settings');
        if (res.ok) {
          const data = await res.json();
          if (data.settings) {
            setSettings(data.settings);
          }
        }
      } catch (err) {
        console.warn("Using default configurations.", err);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage(null);
    try {
      const res = await fetch('http://localhost:8000/api/system/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      if (res.ok) setSaveMessage('Settings saved successfully.');
      else setSaveMessage('Failed to save settings.');
    } catch (err) {
      setSaveMessage('Network error. Settings updated locally.');
    } finally {
      setTimeout(() => { setIsSaving(false); setSaveMessage(null); }, 3000);
    }
  };

  const cardMaterial = 'bg-white/70 dark:bg-[#121214]/65 border border-black/[0.06] dark:border-white/[0.08] shadow-[0_4px_20px_rgba(0,0,0,0.03)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.35)] backdrop-blur-xl rounded-2xl';
  const textPrimary = 'text-[#1D1D1F] dark:text-[#F2F2F0]';
  const textMuted = 'text-[#86868B] dark:text-[#9A9A97]';
  const borderSubtle = 'border-black/[0.05] dark:border-white/[0.07]';
  const inputStyle = 'w-full rounded-lg px-4 py-3 sm:py-2.5 text-[14px] sm:text-[13px] bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/[0.07] focus:border-black/20 dark:focus:border-white/20 text-[#1D1D1F] dark:text-[#F2F2F0] focus:outline-none transition-colors';
  const toggleCardStyle = 'flex items-center justify-between p-5 rounded-xl border bg-black/[0.02] dark:bg-white/[0.02] border-black/[0.04] dark:border-white/[0.04]';

  return (
    <div className="space-y-6 max-w-5xl transition-colors duration-500 pb-12">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h2 className={`text-[24px] font-semibold tracking-tight ${textPrimary}`}>System Settings</h2>
          <p className={`text-[13px] ${textMuted} mt-0.5`}>Manage platform configurations, security policies, and AI engine parameters</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        
        <div className="col-span-1 flex flex-row md:flex-col overflow-x-auto md:overflow-x-visible space-x-2 md:space-x-0 md:space-y-1 pb-2 md:pb-0 hide-scrollbar">
          {['System', 'Security & AI', 'Account'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`whitespace-nowrap md:w-full text-left px-4 py-2.5 md:py-3 rounded-xl text-[13px] font-semibold transition-all ${
                activeTab === tab 
                  ? 'bg-black/[0.06] dark:bg-white/[0.08] text-black dark:text-white shadow-sm'
                  : `${textMuted} hover:text-[#1D1D1F] dark:hover:text-[#F2F2F0] hover:bg-black/[0.04] dark:hover:bg-white/[0.04]`
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className={`col-span-1 md:col-span-3 ${cardMaterial} p-6 sm:p-8 min-h-[500px] flex flex-col justify-between`}>
          
          <div>
            {activeTab === 'System' && (
              <div className="space-y-8">
                <div>
                  <h3 className={`text-[16px] font-semibold tracking-tight ${textPrimary} mb-5`}>API & Backend Configuration</h3>
                  <div className="space-y-5">
                    <div>
                      <label className={`block text-[12px] font-medium uppercase tracking-wide ${textMuted} mb-2`}>FastAPI Base URL</label>
                      <input 
                        type="text" 
                        value={settings.fastapiUrl}
                        onChange={(e) => setSettings({...settings, fastapiUrl: e.target.value})}
                        className={`${inputStyle} font-mono`}
                      />
                    </div>
                    <div>
                      <label className={`block text-[12px] font-medium uppercase tracking-wide ${textMuted} mb-2`}>Database Retention Policy</label>
                      <select 
                        value={settings.retention}
                        onChange={(e) => setSettings({...settings, retention: e.target.value})}
                        className={inputStyle}
                      >
                        <option>30 Days</option>
                        <option>60 Days</option>
                        <option>90 Days</option>
                        <option>Indefinitely</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className={`border-t pt-8 ${borderSubtle}`}>
                  <h3 className={`text-[16px] font-semibold tracking-tight ${textPrimary} mb-5`}>Network Interface</h3>
                  <div className="space-y-5">
                    <div>
                      <label className={`block text-[12px] font-medium uppercase tracking-wide ${textMuted} mb-2`}>Primary Capture Interface</label>
                      <select 
                        value={settings.interface}
                        onChange={(e) => setSettings({...settings, interface: e.target.value})}
                        className={`${inputStyle} font-mono`}
                      >
                        <option>eth0 (192.168.1.0/24)</option>
                        <option>wlan0 (10.0.0.0/16)</option>
                        <option>docker0 (172.17.0.0/16)</option>
                      </select>
                    </div>
                    <div className={toggleCardStyle}>
                      <div className="pr-4">
                        <div className={`text-[14px] font-semibold ${textPrimary}`}>Promiscuous Mode</div>
                        <div className={`text-[12px] ${textMuted} mt-0.5 leading-relaxed`}>Capture all traffic on the network segment</div>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={settings.promiscuous}
                        onChange={(e) => setSettings({...settings, promiscuous: e.target.checked})}
                        className="w-5 h-5 flex-shrink-0 accent-emerald-500 cursor-pointer" 
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'Security & AI' && (
              <div className="space-y-8">
                <div>
                  <h3 className={`text-[16px] font-semibold tracking-tight ${textPrimary} mb-5`}>Authentication Settings</h3>
                  <div className="space-y-5">
                    <div>
                      <label className={`block text-[12px] font-medium uppercase tracking-wide ${textMuted} mb-2`}>JWT Token Expiry (Minutes)</label>
                      <input 
                        type="number" 
                        value={settings.jwtExpiry}
                        onChange={(e) => setSettings({...settings, jwtExpiry: parseInt(e.target.value) || 0})}
                        className={inputStyle}
                      />
                    </div>
                    <div className={toggleCardStyle}>
                      <div className="pr-4">
                        <div className={`text-[14px] font-semibold ${textPrimary}`}>Enforce 2FA Globally</div>
                        <div className={`text-[12px] ${textMuted} mt-0.5 leading-relaxed`}>Require all analysts and admins to use MFA</div>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={settings.mfaEnforced}
                        onChange={(e) => setSettings({...settings, mfaEnforced: e.target.checked})}
                        className="w-5 h-5 flex-shrink-0 accent-emerald-500 cursor-pointer" 
                      />
                    </div>
                  </div>
                </div>

                <div className={`border-t pt-8 ${borderSubtle}`}>
                  <h3 className={`text-[16px] font-semibold tracking-tight ${textPrimary} mb-5`}>Anomaly Detection Engine</h3>
                  <div className="space-y-6">
                    <div>
                      <div className="flex justify-between mb-2">
                        <label className={`text-[12px] font-medium uppercase tracking-wide ${textMuted}`}>Baseline Sensitivity</label>
                        <span className="text-[12px] font-bold text-emerald-500">{settings.baselineSensitivity}%</span>
                      </div>
                      <input 
                        type="range" min="1" max="100" 
                        value={settings.baselineSensitivity}
                        onChange={(e) => setSettings({...settings, baselineSensitivity: parseInt(e.target.value)})}
                        className="w-full h-1.5 bg-gray-200 dark:bg-white/20 rounded-lg appearance-none cursor-pointer accent-emerald-500" 
                      />
                    </div>
                    <div className={toggleCardStyle}>
                      <div className="pr-4">
                        <div className={`text-[14px] font-semibold ${textPrimary}`}>Auto-Ban Malicious IPs</div>
                        <div className={`text-[12px] ${textMuted} mt-0.5 leading-relaxed`}>Automatically update firewall rules for severe threats</div>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={settings.autoBan}
                        onChange={(e) => setSettings({...settings, autoBan: e.target.checked})}
                        className="w-5 h-5 flex-shrink-0 accent-emerald-500 cursor-pointer" 
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'Account' && (
              <div className="space-y-8">
                <div>
                  <h3 className={`text-[16px] font-semibold tracking-tight ${textPrimary} mb-5`}>Profile Information</h3>
                  <div className="space-y-5">
                    <div className="flex flex-col sm:flex-row gap-4 sm:gap-5">
                      <div className="flex-1">
                        <label className={`block text-[12px] font-medium uppercase tracking-wide ${textMuted} mb-2`}>Full Name</label>
                        <input 
                          type="text" 
                          value={settings.profileName}
                          onChange={(e) => setSettings({...settings, profileName: e.target.value})}
                          className={inputStyle}
                        />
                      </div>
                    </div>
                    <div>
                      <label className={`block text-[12px] font-medium uppercase tracking-wide ${textMuted} mb-2`}>Email Address</label>
                      <input 
                        type="email" 
                        value={settings.profileEmail}
                        onChange={(e) => setSettings({...settings, profileEmail: e.target.value})}
                        className={inputStyle}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className={`mt-10 pt-6 border-t flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${borderSubtle}`}>
            <span className={`text-[13px] font-medium ${saveMessage?.includes('success') ? 'text-emerald-600 dark:text-emerald-500' : 'text-red-600 dark:text-red-500'}`}>
              {saveMessage}
            </span>
            <button 
              onClick={handleSave}
              disabled={isSaving}
              className="w-full sm:w-auto px-6 py-2.5 text-[13px] font-semibold rounded-lg transition-colors active:scale-95 shadow-sm bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 disabled:opacity-50"
            >
              {isSaving ? 'Applying...' : 'Save Configuration'}
            </button>
          </div>
          
        </div>
      </div>
    </div>
  );
};

export default Settings;