import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { motion } from 'framer-motion';

const fadeInUp = {
  initial: { opacity: 0, y: 15 },
  animate: { opacity: 1, y: 0 },
  transition: { type: 'spring', damping: 24, stiffness: 260 }
};

const SecurityAnalytics = () => {
  const { theme } = useOutletContext() || { theme: 'dark' };
  const isDark = theme === 'dark';
  
  const [telemetry, setTelemetry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pipelineState, setPipelineState] = useState({ is_active: false, current_step: 0, status_text: 'Idle' });
  const [retrainMessage, setRetrainMessage] = useState(null);

  // Fetch telemetry and pipeline status from FastAPI
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('http://localhost:8000/api/models/telemetry');
        if (res.ok) {
          const data = await res.json();
          if (data.status === 'success') setTelemetry(data);
        }

        const statusRes = await fetch('http://localhost:8000/api/models/retrain-status');
        if (statusRes.ok) {
          const statusData = await statusRes.json();
          setPipelineState(statusData);
        }
      } catch (err) {
        console.error("Telemetry fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 1000); // Poll every 1s for real-time workflow progression
    return () => clearInterval(interval);
  }, []);

  const handleForceRetraining = async () => {
    setRetrainMessage(null);
    try {
      const res = await fetch('http://localhost:8000/api/models/retrain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (res.ok) {
        const data = await res.json();
        setRetrainMessage({ type: 'success', text: data.message });
      } else {
        setRetrainMessage({ type: 'error', text: 'Failed to trigger pipeline.' });
      }
    } catch (err) {
      setRetrainMessage({ type: 'error', text: 'Network error connecting to AI daemon.' });
    }
  };

  // Surface Tokens
  const cardMaterial = isDark 
    ? 'bg-[#121214]/65 border border-white/[0.08] shadow-[0_4px_24px_rgba(0,0,0,0.35)] backdrop-blur-xl rounded-2xl' 
    : 'bg-white/70 border border-black/[0.06] shadow-[0_4px_20px_rgba(0,0,0,0.03)] backdrop-blur-xl rounded-2xl';
  const textPrimary = isDark ? 'text-[#F2F2F0]' : 'text-[#1D1D1F]';
  const textMuted = isDark ? 'text-[#9A9A97]' : 'text-[#86868B]';

  const getStatusColor = (status) => {
    if (status === 'Deployed') return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
    return 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20';
  };

  return (
    <div className="space-y-6 transition-colors duration-500">
      
      {/* Top Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className={`text-[24px] font-semibold tracking-tight ${textPrimary}`}>AI Engine & Model Operations</h2>
          <p className={`text-[13px] ${textMuted} mt-0.5`}>Manage machine learning workflows, model training, and behavioral analysis</p>
        </div>
        
        <div className="flex items-center gap-3">
          {retrainMessage && (
            <span className={`text-[12px] font-medium px-3 py-1.5 rounded-lg ${retrainMessage.type === 'success' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
              {retrainMessage.text}
            </span>
          )}
          <button 
            onClick={handleForceRetraining}
            disabled={pipelineState.is_active}
            className="px-4 py-2 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-600 dark:text-purple-300 text-[13px] font-bold rounded-lg transition-colors flex items-center gap-2 active:scale-95 shadow-sm disabled:opacity-50 cursor-pointer"
          >
            {pipelineState.is_active ? (
              <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            )}
            {pipelineState.is_active ? 'Pipeline Running...' : 'Force Global Retraining'}
          </button>
        </div>
      </div>

      {/* AI Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Global Model Accuracy', value: telemetry ? telemetry.global_accuracy : '-', subtext: 'Aggregate from metrics files', active: false },
          { label: 'Active ML Models', value: telemetry ? telemetry.active_models_count : '-', subtext: 'Loaded in memory', active: false },
          { label: 'Inference Latency', value: telemetry ? telemetry.inference_latency : '-', subtext: 'Real-time WebSocket bounds', active: false },
          { label: 'Continuous Pipeline', value: pipelineState.is_active ? 'Retraining' : 'Active', subtext: pipelineState.status_text, active: !pipelineState.is_active },
        ].map((metric, i) => (
          <motion.div {...fadeInUp} transition={{ delay: i * 0.1 }} key={i} className={`${cardMaterial} p-5 flex flex-col justify-between hover:scale-[1.01] transition-transform`}>
            <h3 className={`text-[12px] uppercase tracking-wide font-medium ${textMuted} mb-3`}>{metric.label}</h3>
            <div>
              <div className="flex items-center gap-2">
                {metric.active && <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>}
                {pipelineState.is_active && i === 3 && <span className="flex h-2.5 w-2.5 rounded-full bg-purple-500 animate-ping"></span>}
                <div className={`text-[28px] font-semibold tracking-tight ${textPrimary}`}>
                  {loading ? <span className="w-12 h-6 inline-block bg-black/10 dark:bg-white/10 rounded animate-pulse" /> : metric.value}
                </div>
              </div>
              <div className={`text-[12px] ${textMuted} mt-1`}>{metric.subtext}</div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* 100% REAL 5-STEP TRAINING WORKFLOW VISUAL */}
      <motion.div {...fadeInUp} transition={{ delay: 0.3 }} className={`${cardMaterial} p-6`}>
        <div className="flex justify-between items-center mb-8">
          <h2 className={`text-[15px] font-semibold tracking-tight ${textPrimary}`}>Continuous Training Workflow</h2>
          {pipelineState.is_active && (
            <span className="text-[12px] font-mono text-purple-500 font-bold animate-pulse">
              [Pipeline Active: Step {pipelineState.current_step}/5]
            </span>
          )}
        </div>
        
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 relative">
          <div className={`hidden md:block absolute top-1/2 left-0 w-full h-[1px] -z-10 ${isDark ? 'bg-white/[0.1]' : 'bg-black/[0.1]'}`}></div>
          
          {[
            { step: 1, title: 'Data Ingestion', desc: 'Parsing live PCAP & Logs' },
            { step: 2, title: 'Feature Extraction', desc: 'Vectorizing network behavior' },
            { step: 3, title: 'Model Training', desc: 'Executing Scikit/XGBoost Sync' },
            { step: 4, title: 'Validation', desc: 'Checking precision/recall' },
            { step: 5, title: 'Deployment', desc: 'Hot-swapping weights' }
          ].map((node) => {
            const isCompleted = pipelineState.current_step > node.step;
            const isCurrent = pipelineState.current_step === node.step;

            return (
              <div key={node.step} className={`flex flex-col items-center p-4 rounded-xl border w-full md:w-48 relative z-0 shadow-sm transition-all duration-300 ${
                isCurrent ? 'ring-2 ring-purple-500 shadow-purple-500/20' : ''
              } ${isDark ? 'bg-[#0A0A0B] border-white/[0.07]' : 'bg-white border-black/[0.05]'}`}>
                
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold mb-3 transition-all ${
                  isCompleted ? 'bg-emerald-500 text-white shadow-sm' :
                  isCurrent ? 'bg-purple-500 text-white animate-bounce shadow-md' :
                  (isDark ? 'bg-white/[0.05] text-[#9A9A97] border border-white/[0.1]' : 'bg-black/5 text-[#86868B] border border-black/10')
                }`}>
                  {isCompleted ? '✓' : node.step}
                </div>
                
                <h4 className={`text-[13px] font-bold text-center ${textPrimary}`}>{node.title}</h4>
                <p className={`text-[11px] text-center mt-1 ${isCurrent ? 'text-purple-500 font-medium' : textMuted}`}>
                  {isCurrent ? pipelineState.status_text : node.desc}
                </p>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Model Inventory Table */}
      <motion.div {...fadeInUp} transition={{ delay: 0.4 }} className={`${cardMaterial} overflow-hidden`}>
        <div className={`px-6 py-4 border-b flex justify-between items-center ${isDark ? 'border-white/[0.07] bg-white/[0.01]' : 'border-black/[0.05] bg-black/[0.01]'}`}>
          <h2 className={`text-[15px] font-semibold tracking-tight ${textPrimary}`}>Active Production Models</h2>
          <span className={`text-[11px] font-mono px-2.5 py-1 rounded-md ${isDark ? 'bg-white/5 text-[#9A9A97]' : 'bg-black/5 text-[#86868B]'}`}>
            Live Memory State
          </span>
        </div>
        
        <div className="overflow-x-auto min-h-[200px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className={`border-b text-[11px] uppercase tracking-wider ${isDark ? 'bg-white/[0.02] border-white/[0.07] text-[#9A9A97]' : 'bg-black/[0.02] border-black/[0.05] text-[#86868B]'}`}>
                <th className="px-6 py-3 font-semibold">Model Name & Version</th>
                <th className="px-6 py-3 font-semibold">Classification Type</th>
                <th className="px-6 py-3 font-semibold">Status</th>
                <th className="px-6 py-3 font-semibold">Accuracy Rating</th>
                <th className="px-6 py-3 font-semibold">Latency</th>
                <th className="px-6 py-3 font-semibold">Last Updated</th>
                <th className="px-6 py-3 font-semibold text-right">Config</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDark ? 'divide-white/[0.03]' : 'divide-black/[0.05]'}`}>
              {loading ? (
                <tr><td colSpan={7} className={`py-12 text-center ${textMuted}`}>Querying model memory...</td></tr>
              ) : !telemetry || !telemetry.models ? (
                <tr><td colSpan={7} className={`py-12 text-center ${textMuted}`}>No active models detected.</td></tr>
              ) : (
                telemetry.models.map((model) => (
                  <tr key={model.id} className={`transition-colors group text-[13px] ${isDark ? 'hover:bg-white/[0.02]' : 'hover:bg-black/[0.02]'}`}>
                    <td className="px-6 py-4">
                      <div className={`font-semibold ${textPrimary}`}>{model.name}</div>
                      <div className={`text-[11px] font-mono mt-0.5 ${textMuted}`}>{model.version}</div>
                    </td>
                    <td className={`px-6 py-4 font-mono text-[12px] ${textPrimary}`}>{model.type}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold border flex items-center gap-1.5 w-max ${getStatusColor(model.status)}`}>
                        {model.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 w-32">
                        <span className="text-[12px] font-bold w-9 text-emerald-500">
                          {model.accuracy}%
                        </span>
                        <div className={`flex-1 h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-white/10' : 'bg-black/10'}`}>
                          <div 
                            className="h-full rounded-full bg-emerald-500" 
                            style={{ width: `${model.accuracy}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className={`px-6 py-4 font-mono text-[12px] ${textMuted}`}>{model.latency}</td>
                    <td className={`px-6 py-4 ${textMuted}`}>{model.lastUpdated}</td>
                    <td className="px-6 py-4 text-right">
                      <button className={`text-[12px] font-semibold transition-colors ${textMuted} hover:${textPrimary}`}>
                        Tune
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
      
    </div>
  );
};

export default SecurityAnalytics;