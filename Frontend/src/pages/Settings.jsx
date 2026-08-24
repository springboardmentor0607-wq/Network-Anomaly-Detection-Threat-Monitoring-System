import React, { useState } from 'react';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('System');

  return (
    <div className="space-y-6 max-w-5xl">
      
      {/* Top Header */}
      <div>
        <h2 className="text-[18px] font-semibold text-[#F2F2F0]">System Settings</h2>
        <p className="text-[13px] text-[#9A9A97]">Manage platform configurations, security policies, and AI engine parameters</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        
        {/* Settings Navigation Sidebar */}
        <div className="col-span-1 space-y-1">
          {['System', 'Security & AI', 'Account', 'Notifications'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`w-full text-left px-4 py-2.5 rounded-lg text-[13px] font-medium transition-colors ${
                activeTab === tab 
                  ? 'bg-white/[0.08] text-white' 
                  : 'text-[#9A9A97] hover:bg-white/[0.04] hover:text-[#D6D6D3]'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Settings Content Area */}
        <div className="col-span-1 md:col-span-3 bg-[#0A0A0B]/60 backdrop-blur-sm border border-white/[0.07] rounded-xl p-8">
          
          {/* SYSTEM TAB */}
          {activeTab === 'System' && (
            <div className="space-y-8 animate-in fade-in duration-300">
              <div>
                <h3 className="text-[15px] font-medium text-[#F2F2F0] mb-4">API & Backend Configuration</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-[#9A9A97] text-[12px] mb-1.5">FastAPI Base URL</label>
                    <input 
                      type="text" 
                      defaultValue="http://localhost:8000/api/v1" 
                      className="w-full bg-white/[0.02] border border-white/[0.07] rounded-md px-3 py-2 text-[13px] text-[#D6D6D3] focus:outline-none focus:border-white/20 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[#9A9A97] text-[12px] mb-1.5">Database Retention Policy (MongoDB)</label>
                    <select className="w-full bg-white/[0.02] border border-white/[0.07] rounded-md px-3 py-2 text-[13px] text-[#D6D6D3] focus:outline-none focus:border-white/20">
                      <option>30 Days</option>
                      <option>60 Days</option>
                      <option>90 Days</option>
                      <option>Indefinitely</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="border-t border-white/[0.05] pt-8">
                <h3 className="text-[15px] font-medium text-[#F2F2F0] mb-4">Network Interface</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-[#9A9A97] text-[12px] mb-1.5">Primary Capture Interface</label>
                    <select className="w-full bg-white/[0.02] border border-white/[0.07] rounded-md px-3 py-2 text-[13px] text-[#D6D6D3] focus:outline-none focus:border-white/20 font-mono">
                      <option>eth0 (192.168.1.0/24)</option>
                      <option>wlan0 (10.0.0.0/16)</option>
                      <option>docker0 (172.17.0.0/16)</option>
                    </select>
                  </div>
                  <div className="flex items-center justify-between bg-white/[0.02] border border-white/[0.04] p-4 rounded-lg">
                    <div>
                      <div className="text-[13px] font-medium text-[#F2F2F0]">Promiscuous Mode</div>
                      <div className="text-[11px] text-[#9A9A97]">Capture all traffic on the network segment</div>
                    </div>
                    <div className="relative inline-block w-10 mr-2 align-middle select-none">
                      <input type="checkbox" defaultChecked className="toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 border-[#0A0A0B] appearance-none cursor-pointer transition-transform duration-200 ease-in-out translate-x-5" />
                      <label className="toggle-label block overflow-hidden h-5 rounded-full bg-emerald-500 cursor-pointer"></label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SECURITY & AI TAB */}
          {activeTab === 'Security & AI' && (
            <div className="space-y-8 animate-in fade-in duration-300">
              <div>
                <h3 className="text-[15px] font-medium text-[#F2F2F0] mb-4">Authentication Settings</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-[#9A9A97] text-[12px] mb-1.5">JWT Token Expiry (Minutes)</label>
                    <input 
                      type="number" 
                      defaultValue="60" 
                      className="w-full bg-white/[0.02] border border-white/[0.07] rounded-md px-3 py-2 text-[13px] text-[#D6D6D3] focus:outline-none focus:border-white/20"
                    />
                  </div>
                  <div className="flex items-center justify-between bg-white/[0.02] border border-white/[0.04] p-4 rounded-lg">
                    <div>
                      <div className="text-[13px] font-medium text-[#F2F2F0]">Enforce 2FA Globally</div>
                      <div className="text-[11px] text-[#9A9A97]">Require all analysts and admins to use MFA</div>
                    </div>
                    <div className="relative inline-block w-10 mr-2 align-middle select-none">
                      <input type="checkbox" className="toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 border-[#0A0A0B] appearance-none cursor-pointer transition-transform duration-200 ease-in-out" />
                      <label className="toggle-label block overflow-hidden h-5 rounded-full bg-white/[0.1] cursor-pointer"></label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-white/[0.05] pt-8">
                <h3 className="text-[15px] font-medium text-[#F2F2F0] mb-4">Anomaly Detection Engine</h3>
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between mb-1.5">
                      <label className="text-[#9A9A97] text-[12px]">Baseline Sensitivity</label>
                      <span className="text-[12px] text-emerald-400">High (Aggressive)</span>
                    </div>
                    <input type="range" min="1" max="100" defaultValue="85" className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer" />
                    <p className="text-[11px] text-[#9A9A97] mt-2">Higher sensitivity will flag minor deviations but may increase false positives.</p>
                  </div>
                  <div className="flex items-center justify-between bg-white/[0.02] border border-white/[0.04] p-4 rounded-lg">
                    <div>
                      <div className="text-[13px] font-medium text-[#F2F2F0]">Auto-Ban Malicious IPs</div>
                      <div className="text-[11px] text-[#9A9A97]">Automatically update firewall rules for scores {'>'} 9.0</div>
                    </div>
                    <div className="relative inline-block w-10 mr-2 align-middle select-none">
                      <input type="checkbox" defaultChecked className="toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 border-[#0A0A0B] appearance-none cursor-pointer transition-transform duration-200 ease-in-out translate-x-5" />
                      <label className="toggle-label block overflow-hidden h-5 rounded-full bg-emerald-500 cursor-pointer"></label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ACCOUNT TAB */}
          {activeTab === 'Account' && (
            <div className="space-y-8 animate-in fade-in duration-300">
              <div>
                <h3 className="text-[15px] font-medium text-[#F2F2F0] mb-4">Profile Information</h3>
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="block text-[#9A9A97] text-[12px] mb-1.5">Full Name</label>
                      <input 
                        type="text" 
                        defaultValue="Ankit Singh" 
                        className="w-full bg-white/[0.02] border border-white/[0.07] rounded-md px-3 py-2 text-[13px] text-[#D6D6D3] focus:outline-none focus:border-white/20"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-[#9A9A97] text-[12px] mb-1.5">Role</label>
                      <input 
                        type="text" 
                        defaultValue="Administrator" 
                        disabled
                        className="w-full bg-white/[0.01] border border-white/[0.03] rounded-md px-3 py-2 text-[13px] text-[#9A9A97] cursor-not-allowed"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[#9A9A97] text-[12px] mb-1.5">Email Address</label>
                    <input 
                      type="email" 
                      defaultValue="ankit@netshield.com" 
                      className="w-full bg-white/[0.02] border border-white/[0.07] rounded-md px-3 py-2 text-[13px] text-[#D6D6D3] focus:outline-none focus:border-white/20"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* NOTIFICATIONS TAB */}
          {activeTab === 'Notifications' && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <h3 className="text-[15px] font-medium text-[#F2F2F0] mb-4">Alert Routing</h3>
              {[
                { title: 'Critical Threat Alerts', desc: 'Push notifications and emails for severity 8.0+' },
                { title: 'Model Retraining Updates', desc: 'Notify when a new ML model version is deployed' },
                { title: 'System Health Warnings', desc: 'Alerts for database connection drops or high latency' },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between bg-white/[0.02] border border-white/[0.04] p-4 rounded-lg">
                  <div>
                    <div className="text-[13px] font-medium text-[#F2F2F0]">{item.title}</div>
                    <div className="text-[11px] text-[#9A9A97]">{item.desc}</div>
                  </div>
                  <div className="relative inline-block w-10 mr-2 align-middle select-none">
                    <input type="checkbox" defaultChecked className="toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 border-[#0A0A0B] appearance-none cursor-pointer transition-transform duration-200 ease-in-out translate-x-5" />
                    <label className="toggle-label block overflow-hidden h-5 rounded-full bg-emerald-500 cursor-pointer"></label>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-white/[0.05] flex justify-end">
            <button className="px-5 py-2.5 bg-white text-[#0A0A0B] hover:bg-[#E5E5E2] text-[13px] font-medium rounded-lg transition-colors">
              Save Changes
            </button>
          </div>
          
        </div>
      </div>
    </div>
  );
};

export default Settings;