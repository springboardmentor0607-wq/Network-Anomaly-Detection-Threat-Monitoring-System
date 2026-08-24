import React, { useState } from 'react';

const SecurityAnalytics = () => {
  const [isRetraining, setIsRetraining] = useState(true);

  // Mock data for deployed machine learning models
  const models = [
    { id: 'mdl_lstm_01', name: 'Behavioral LSTM', version: 'v2.4.1', type: 'Time-Series Anomaly', accuracy: 98.2, status: 'Deployed', latency: '12ms', lastUpdated: '2 hours ago' },
    { id: 'mdl_rf_04', name: 'Random Forest Packet', version: 'v1.9.0', type: 'DDoS Classification', accuracy: 96.5, status: 'Deployed', latency: '8ms', lastUpdated: '1 day ago' },
    { id: 'mdl_xgb_beta', name: 'XGBoost Zero-Day', version: 'v3.0.0-rc', type: 'Intrusion Prediction', accuracy: 89.4, status: 'Training', latency: '-', lastUpdated: 'Currently running' },
    { id: 'mdl_bert_logs', name: 'LogBERT Parser', version: 'v1.1.2', type: 'Payload Analysis', accuracy: 99.1, status: 'Deployed', latency: '24ms', lastUpdated: '5 days ago' },
  ];

  const getStatusColor = (status) => {
    if (status === 'Deployed') return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    if (status === 'Training') return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
    return 'bg-white/10 text-white border-white/20';
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-[18px] font-semibold text-[#F2F2F0]">AI Engine & Model Operations</h2>
          <p className="text-[13px] text-[#9A9A97]">Manage machine learning workflows, model training, and behavioral analysis</p>
        </div>
        <button className="px-4 py-2 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-300 text-[13px] font-medium rounded-lg transition-colors flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Force Global Retraining
        </button>
      </div>

      {/* AI Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Global Model Accuracy', value: '97.8%', subtext: '+0.4% this week', active: false },
          { label: 'Active ML Models', value: '3', subtext: '1 currently in training', active: false },
          { label: 'Inference Latency (Avg)', value: '14.6 ms', subtext: 'Well below 50ms threshold', active: false },
          { label: 'Continuous Pipeline', value: 'Active', subtext: 'Ingesting 1.2M packets/sec', active: true },
        ].map((metric, i) => (
          <div key={i} className="bg-[#0A0A0B]/60 backdrop-blur-sm border border-white/[0.07] rounded-xl p-5 flex flex-col justify-between">
            <h3 className="text-[13px] font-medium text-[#9A9A97] mb-3">{metric.label}</h3>
            <div>
              <div className="flex items-center gap-2">
                {metric.active && <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse"></span>}
                <div className="text-[24px] font-semibold tracking-tight text-[#F2F2F0]">{metric.value}</div>
              </div>
              <div className="text-[12px] text-[#9A9A97] mt-1">{metric.subtext}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ML Pipeline Visualization */}
      <div className="bg-[#0A0A0B]/60 backdrop-blur-sm border border-white/[0.07] rounded-xl p-6">
        <h2 className="text-[15px] font-medium mb-6">Continuous Training Workflow</h2>
        
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 relative">
          {/* Background connecting line (hidden on mobile) */}
          <div className="hidden md:block absolute top-1/2 left-0 w-full h-[1px] bg-white/[0.1] -z-10"></div>
          
          {[
            { step: '1', title: 'Data Ingestion', desc: 'Parsing live PCAP & Logs', status: 'active' },
            { step: '2', title: 'Feature Extraction', desc: 'Vectorizing network behavior', status: 'active' },
            { step: '3', title: 'Model Training', desc: 'XGBoost Epoch 45/100', status: 'training' },
            { step: '4', title: 'Validation', desc: 'Checking precision/recall', status: 'pending' },
            { step: '5', title: 'Deployment', desc: 'Hot-swapping weights', status: 'pending' }
          ].map((node, i) => (
            <div key={i} className="flex flex-col items-center bg-[#0A0A0B] p-4 rounded-lg border border-white/[0.07] w-full md:w-48 relative z-0">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold mb-3 ${
                node.status === 'active' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                node.status === 'training' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30 ring-2 ring-purple-500/50 ring-offset-2 ring-offset-[#0A0A0B] animate-pulse' :
                'bg-white/[0.05] text-[#9A9A97] border border-white/[0.1]'
              }`}>
                {node.step}
              </div>
              <h4 className="text-[13px] font-medium text-[#F2F2F0] text-center">{node.title}</h4>
              <p className="text-[11px] text-[#9A9A97] text-center mt-1">{node.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Model Inventory Table */}
      <div className="bg-[#0A0A0B]/60 backdrop-blur-sm border border-white/[0.07] rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-white/[0.07] flex justify-between items-center bg-white/[0.01]">
          <h2 className="text-[15px] font-medium">Active Detection Models</h2>
          <button className="text-[12px] text-[#D6D6D3] bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.1] px-3 py-1.5 rounded transition-colors">
            Upload Custom Weights
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/[0.02] border-b border-white/[0.07] text-[#9A9A97] text-[11px] uppercase tracking-wider">
                <th className="px-6 py-3 font-semibold">Model Name & Version</th>
                <th className="px-6 py-3 font-semibold">Classification Type</th>
                <th className="px-6 py-3 font-semibold">Status</th>
                <th className="px-6 py-3 font-semibold">Accuracy Rating</th>
                <th className="px-6 py-3 font-semibold">Latency</th>
                <th className="px-6 py-3 font-semibold">Last Updated</th>
                <th className="px-6 py-3 font-semibold text-right">Config</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.03]">
              {models.map((model) => (
                <tr key={model.id} className="hover:bg-white/[0.02] transition-colors group text-[13px]">
                  <td className="px-6 py-4">
                    <div className="font-medium text-[#F2F2F0]">{model.name}</div>
                    <div className="text-[11px] text-[#9A9A97] font-mono mt-0.5">{model.version}</div>
                  </td>
                  <td className="px-6 py-4 text-[#D6D6D3]">{model.type}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-md text-[11px] font-semibold border flex items-center gap-1.5 w-max ${getStatusColor(model.status)}`}>
                      {model.status === 'Training' && (
                        <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      )}
                      {model.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 w-32">
                      <span className={`text-[12px] font-medium w-9 ${model.accuracy > 95 ? 'text-emerald-400' : 'text-purple-400'}`}>
                        {model.accuracy}%
                      </span>
                      <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${model.accuracy > 95 ? 'bg-emerald-500' : 'bg-purple-500'}`} 
                          style={{ width: `${model.accuracy}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-mono text-[#9A9A97] text-[12px]">{model.latency}</td>
                  <td className="px-6 py-4 text-[#9A9A97]">{model.lastUpdated}</td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-[12px] text-[#9A9A97] hover:text-white font-medium transition-colors">
                      Tune
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
    </div>
  );
};

export default SecurityAnalytics;