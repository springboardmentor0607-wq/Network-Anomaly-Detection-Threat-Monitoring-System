import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const fadeInUp = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: { type: 'spring', damping: 25, stiffness: 300 }
};

const Logs = () => {
  const { theme } = useOutletContext() || { theme: 'dark' };
  const isDark = theme === 'dark';

  const [logType, setLogType] = useState('All');
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchLogs = async (isManual = false) => {
    if (isManual) setIsRefreshing(true);
    try {
      // Connects to your FastAPI backend to retrieve actual infrastructure/system logs
      const response = await fetch('http://localhost:8000/api/logs');
      if (response.ok) {
        const data = await response.json();
        if (data.status === 'success' && data.logs) {
          setLogs(data.logs);
        }
      } else {
        console.warn("Logs endpoint returned an error status.");
      }
    } catch (error) {
      console.error("Failed to connect to backend logs stream:", error);
    } finally {
      setLoading(false);
      if (isManual) setTimeout(() => setIsRefreshing(false), 500); // UI feedback delay
    }
  };

  // Initial fetch and auto-polling setup (every 10 seconds)
  useEffect(() => {
    fetchLogs();
    const interval = setInterval(() => fetchLogs(), 10000);
    return () => clearInterval(interval);
  }, []);

  const filteredLogs = logs.filter(log => logType === 'All' || log.level === logType);

  // Surface Tokens
  const textPrimary = isDark ? 'text-[#F2F2F0]' : 'text-[#1D1D1F]';
  const textMuted = isDark ? 'text-[#9A9A97]' : 'text-[#86868B]';
  const cardMaterial = isDark 
    ? 'bg-[#121214]/65 border border-white/[0.08] shadow-[0_4px_24px_rgba(0,0,0,0.35)] backdrop-blur-xl rounded-2xl' 
    : 'bg-white/70 border border-black/[0.06] shadow-[0_4px_20px_rgba(0,0,0,0.03)] backdrop-blur-xl rounded-2xl';

  // Log Level Styling
  const getLevelColor = (level) => {
    switch(level) {
      case 'ERROR': return isDark ? 'text-red-400' : 'text-red-600';
      case 'WARN': return isDark ? 'text-amber-400' : 'text-amber-600';
      case 'INFO': return isDark ? 'text-sky-400' : 'text-blue-600';
      default: return textMuted;
    }
  };

  return (
    <div className="space-y-6 h-[calc(100vh-8rem)] flex flex-col transition-colors duration-500">
      
      {/* HEADER BAR */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className={`text-[24px] font-semibold tracking-tight ${textPrimary}`}>System & Event Logs</h2>
          <p className={`text-[13px] ${textMuted} mt-0.5`}>Raw application, database, and infrastructure event stream</p>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Manual Refresh Button */}
          <button 
            onClick={() => fetchLogs(true)}
            className={`flex items-center justify-center p-2 rounded-full transition-all active:scale-90 ${isDark ? 'hover:bg-white/10 text-white' : 'hover:bg-black/5 text-black'}`}
            title="Refresh Logs"
          >
            <svg className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>

          {/* Filter Toggles */}
          <div className={`flex items-center gap-1.5 p-1.5 rounded-xl ${isDark ? 'bg-white/5' : 'bg-black/5'}`}>
            {['All', 'INFO', 'WARN', 'ERROR'].map(level => (
              <button 
                key={level} 
                onClick={() => setLogType(level)}
                className={`px-4 py-1.5 rounded-lg text-[12px] font-semibold transition-all active:scale-95 cursor-pointer border ${
                  logType === level 
                    ? `bg-white text-black shadow-sm dark:bg-[#1C1C1E] dark:text-white dark:border-white/10` 
                    : `border-transparent ${textMuted} hover:${textPrimary} hover:bg-black/5 dark:hover:bg-white/5`
                }`}
              >
                {level}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* CONSOLE TERMINAL WINDOW */}
      <motion.div {...fadeInUp} className={`flex-1 flex flex-col overflow-hidden font-mono ${cardMaterial}`}>
        
        {/* Terminal Header */}
        <div className={`px-4 py-3 flex items-center border-b ${isDark ? 'border-white/10 bg-white/[0.02]' : 'border-black/5 bg-black/[0.01]'}`}>
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-400"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-amber-400"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400"></div>
          </div>
          <span className={`ml-4 text-[11px] font-semibold tracking-wider uppercase ${textMuted}`}>Live Console Output</span>
        </div>

        {/* Terminal Output Body */}
        <div className={`flex-1 overflow-y-auto p-4 space-y-1.5 ${isDark ? 'bg-[#0A0A0B]/50' : 'bg-[#F9F9F8]/50'}`}>
          <AnimatePresence mode="popLayout">
            {loading && logs.length === 0 ? (
              <motion.div exit={{ opacity: 0 }} className={`text-[12px] flex items-center gap-2 ${textMuted}`}>
                <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
                Establishing secure connection to event stream...
              </motion.div>
            ) : filteredLogs.length === 0 ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`text-[12px] ${textMuted}`}>
                No matching logs found in current buffer.
              </motion.div>
            ) : (
              filteredLogs.map((log, index) => (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.02 }}
                  key={log.id || index} 
                  className={`flex flex-col sm:flex-row sm:gap-4 text-[12px] py-1.5 px-3 rounded-md transition-colors ${isDark ? 'hover:bg-white/[0.04]' : 'hover:bg-black/[0.03]'}`}
                >
                  <div className="flex gap-4 shrink-0">
                    <span className={`${textMuted} w-20 shrink-0`}>
                      {log.time || log.timestamp || new Date().toLocaleTimeString()}
                    </span>
                    <span className={`w-12 shrink-0 font-bold ${getLevelColor(log.level)}`}>
                      {log.level}
                    </span>
                  </div>
                  <div className="flex gap-3">
                    <span className={`w-32 shrink-0 truncate ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`} title={log.source}>
                      [{log.source}]
                    </span>
                    <span className={textPrimary}>{log.message}</span>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
        
      </motion.div>
    </div>
  );
};

export default Logs;