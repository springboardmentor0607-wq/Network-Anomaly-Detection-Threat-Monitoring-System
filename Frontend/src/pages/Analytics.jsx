import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { motion } from 'framer-motion';

const fadeInUp = {
  initial: { opacity: 0, y: 15 },
  animate: { opacity: 1, y: 0 },
  transition: { type: 'spring', damping: 24, stiffness: 260 }
};

const Analytics = () => {
  const { theme } = useOutletContext() || { theme: 'dark' };
  const isDark = theme === 'dark';

  // Wire export button to existing FastAPI CSV endpoint
  const handleExport = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/alerts/export');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `SOC_Analytics_Report_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (error) {
      console.error("Export failed", error);
    }
  };

  // Surface Tokens
  const cardMaterial = isDark 
    ? 'bg-[#121214]/65 border border-white/[0.08] shadow-[0_4px_24px_rgba(0,0,0,0.35)] backdrop-blur-xl rounded-2xl' 
    : 'bg-white/70 border border-black/[0.06] shadow-[0_4px_20px_rgba(0,0,0,0.03)] backdrop-blur-xl rounded-2xl';
  const insetMaterial = isDark ? 'bg-white/[0.02] border-white/[0.04]' : 'bg-black/[0.02] border-black/[0.04]';
  const textPrimary = isDark ? 'text-[#F2F2F0]' : 'text-[#1D1D1F]';
  const textMuted = isDark ? 'text-[#9A9A97]' : 'text-[#86868B]';

  return (
    <div className="space-y-6 transition-colors duration-500">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className={`text-[24px] font-semibold tracking-tight ${textPrimary}`}>Dataset Analytics & Reports</h2>
          <p className={`text-[13px] ${textMuted} mt-0.5`}>Analyze training data, evaluate models, and generate compliance reports</p>
        </div>
        <button 
          onClick={handleExport}
          className={`px-4 py-2 text-[13px] font-medium rounded-lg transition-colors active:scale-95 shadow-sm ${isDark ? 'bg-white text-[#0A0A0B] hover:bg-gray-200' : 'bg-[#0071E3] text-white hover:bg-[#0077ED]'}`}
        >
          Generate CSV Report
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Dataset Loader Module */}
        <motion.div {...fadeInUp} className={`${cardMaterial} p-6 h-[320px] flex flex-col`}>
          <h2 className={`text-[15px] font-semibold tracking-tight mb-4 ${textPrimary}`}>Active Training Datasets</h2>
          <div className="space-y-3 flex-1">
            <div className={`flex items-center justify-between p-4 border rounded-xl ${insetMaterial}`}>
              <div>
                <div className={`text-[14px] font-bold ${textPrimary}`}>CICIDS2017</div>
                <div className={`text-[11px] ${textMuted}`}>Intrusion Detection Evaluation Dataset</div>
              </div>
              <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-bold uppercase tracking-wider rounded-md">Loaded</span>
            </div>
            <div className={`flex items-center justify-between p-4 border rounded-xl ${insetMaterial}`}>
              <div>
                <div className={`text-[14px] font-bold ${textPrimary}`}>UNSW-NB15</div>
                <div className={`text-[11px] ${textMuted}`}>Network Intrusion Dataset</div>
              </div>
              <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-bold uppercase tracking-wider rounded-md">Loaded</span>
            </div>
          </div>
        </motion.div>

        {/* Analytics Placeholder */}
        <motion.div {...fadeInUp} transition={{ delay: 0.1 }} className={`${cardMaterial} p-6 h-[320px] flex flex-col`}>
          <div className="flex justify-between items-center mb-4">
            <h2 className={`text-[15px] font-semibold tracking-tight ${textPrimary}`}>Model Evaluation Metrics</h2>
          </div>
          <div className={`flex-1 border border-dashed rounded-xl flex flex-col items-center justify-center p-6 text-center ${isDark ? 'border-white/[0.1]' : 'border-black/[0.1]'}`}>
            <span className={`text-[13px] font-semibold mb-2 ${textPrimary}`}>Data Synchronization Active</span>
            <span className={`text-[11px] leading-relaxed max-w-[80%] ${textMuted}`}>
              Full Confusion Matrix and F1-Scores are available in the <strong>Model Performance</strong> tab. Live stream inference data is currently bypassing static analytical rendering to prioritize system resources.
            </span>
          </div>
        </motion.div>
      </div>
      
    </div>
  );
};

export default Analytics;