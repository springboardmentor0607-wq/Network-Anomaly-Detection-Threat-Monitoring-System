import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const fadeInUp = {
  initial: { opacity: 0, y: 15 },
  animate: { opacity: 1, y: 0 },
  transition: { type: 'spring', damping: 24, stiffness: 260 }
};

const Alerts = () => {
  const { theme } = useOutletContext() || { theme: 'dark' };
  const isDark = theme === 'dark';
  
  const [activeTab, setActiveTab] = useState('Open');
  const [alertsList, setAlertsList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch live alerts from MongoDB via FastAPI
  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/alerts', {
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });
        if (response.ok) {
          const data = await response.json();
          if (data.status === 'success') {
            const formattedAlerts = data.alerts.map(a => ({
              id: a.id,
              time: a.time || new Date(a.timestamp).toLocaleTimeString(),
              type: a.type,
              source: a.source,
              target: 'Network Asset', 
              severity: a.severity,
              status: a.status || 'Open',
              assignee: a.assignee || 'Unassigned'
            }));
            setAlertsList(formattedAlerts);
          }
        }
      } catch (error) {
        console.error("Failed to fetch alerts:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAlerts();
    const interval = setInterval(fetchAlerts, 5000); 
    return () => clearInterval(interval);
  }, []);

  const handleAlertUpdate = async (alertId, field, value) => {
    setAlertsList(prev => prev.map(a => a.id === alertId ? { ...a, [field]: value } : a));
    try {
      await fetch(`http://localhost:8000/api/alerts/${alertId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value })
      });
    } catch (error) {
      console.error(`Failed to update ${field}:`, error);
    }
  };

  const handleExport = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/alerts/export');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `SOC_Alerts_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (error) {
      console.error("Export failed", error);
    }
  };

  const handleAcknowledgeAll = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/alerts/acknowledge-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (res.ok) {
        const response = await fetch('http://localhost:8000/api/alerts', {
          headers: { 'Cache-Control': 'no-cache' }
        });
        const data = await response.json();
        if (data.status === 'success') {
          setAlertsList(data.alerts.map(a => ({
            id: a.id,
            time: a.time || new Date(a.timestamp).toLocaleTimeString(),
            type: a.type,
            source: a.source,
            target: 'Network Asset',
            severity: a.severity,
            status: a.status || 'Open',
            assignee: a.assignee || 'Unassigned'
          })));
        }
      }
    } catch (err) {
      console.error("Failed to bulk acknowledge alerts:", err);
    }
  };

  // Surface Tokens
  const cardMaterial = isDark 
    ? 'bg-[#121214]/65 border border-white/[0.08] shadow-[0_4px_24px_rgba(0,0,0,0.35)] backdrop-blur-xl rounded-2xl' 
    : 'bg-white/70 border border-black/[0.06] shadow-[0_4px_20px_rgba(0,0,0,0.03)] backdrop-blur-xl rounded-2xl';
  const textPrimary = isDark ? 'text-[#F2F2F0]' : 'text-[#1D1D1F]';
  const textMuted = isDark ? 'text-[#9A9A97]' : 'text-[#86868B]';

  const getSeverityBadge = (severity) => {
    switch (severity) {
      case 'Critical': return 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20';
      case 'High': return 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20';
      case 'Medium': return 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20';
      case 'Low': return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
      default: return isDark ? 'bg-white/10 text-white border-white/20' : 'bg-black/5 text-black border-black/10';
    }
  };

  const getStatusIndicator = (status) => {
    if (status === 'Open') return <span className="flex h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.5)]"></span>;
    if (status === 'Investigating') return <span className="flex h-2.5 w-2.5 rounded-full bg-amber-500"></span>;
    if (status === 'Resolved' || status === 'Closed') return <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500"></span>;
    if (status === 'False Positive') return <span className="flex h-2.5 w-2.5 rounded-full bg-gray-500"></span>;
    return <span className="flex h-2.5 w-2.5 rounded-full bg-gray-400"></span>;
  };

  const filteredAlerts = alertsList.filter(alert => activeTab === 'All Alerts' || alert.status === activeTab);
  const openAlertsCount = alertsList.filter(a => a.status === 'Open').length;

  return (
    <div className="space-y-6 transition-colors duration-500">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className={`text-[24px] font-semibold tracking-tight ${textPrimary}`}>Incident Alert Queue</h2>
          <p className={`text-[13px] ${textMuted} mt-0.5`}>Real-time threat alerts and incident prioritization</p>
        </div>
        <div className="flex gap-3">
          <button onClick={handleExport} className={`px-4 py-2 text-[13px] font-medium rounded-lg transition-colors active:scale-95 ${isDark ? 'bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.07] text-[#D6D6D3]' : 'bg-black/[0.03] hover:bg-black/[0.06] border border-black/[0.05] text-[#1D1D1F]'}`}>
            Export Logs
          </button>
          <button 
            onClick={handleAcknowledgeAll}
            className={`px-4 py-2 text-[13px] font-medium rounded-lg transition-colors active:scale-95 flex items-center gap-2 shadow-sm cursor-pointer ${isDark ? 'bg-white text-black hover:bg-gray-200' : 'bg-black text-white hover:bg-gray-800'}`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            Acknowledge All
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Unassigned Critical', value: alertsList.filter(a => a.severity === 'Critical' && a.assignee === 'Unassigned').length, subtext: 'Immediate action required', alert: true },
          { label: 'Active Incidents', value: alertsList.filter(a => a.status === 'Investigating').length, subtext: 'Currently under investigation', alert: false },
          { label: 'Total Logs (24h)', value: alertsList.length, subtext: 'Recorded in database', alert: false },
          { label: 'Auto-Remediated', value: '98%', subtext: 'Threats blocked by AI policies', alert: false },
        ].map((metric, i) => (
          <motion.div {...fadeInUp} transition={{ delay: i * 0.1 }} key={i} className={`${cardMaterial} p-5 flex flex-col justify-between hover:scale-[1.01] transition-transform`}>
            <h3 className={`text-[12px] font-medium uppercase tracking-wide ${textMuted} mb-3`}>{metric.label}</h3>
            <div>
              <div className={`text-[28px] font-semibold tracking-tight ${metric.alert && metric.value > 0 ? 'text-red-500' : textPrimary}`}>
                {loading ? '-' : metric.value}
              </div>
              <div className={`text-[12px] ${textMuted} mt-1`}>{metric.subtext}</div>
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div {...fadeInUp} transition={{ delay: 0.3 }} className={`${cardMaterial} overflow-hidden flex flex-col`}>
        
        <div className={`px-6 py-4 border-b flex justify-between items-center ${isDark ? 'border-white/[0.07] bg-white/[0.01]' : 'border-black/[0.05] bg-black/[0.01]'}`}>
          <div className="flex gap-6">
            {['Open', 'Investigating', 'False Positive', 'Closed', 'All Alerts'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-3 text-[13px] font-medium transition-colors relative ${
                  activeTab === tab ? textPrimary : `${textMuted} hover:${textPrimary}`
                }`}
              >
                {tab}
                {tab === 'Open' && openAlertsCount > 0 && (
                  <span className="ml-2 bg-red-500/10 text-red-500 py-0.5 px-2 rounded-full text-[10px] font-bold">{openAlertsCount}</span>
                )}
                {activeTab === tab && (
                  <motion.div layoutId="activeTab" className={`absolute bottom-0 left-0 w-full h-0.5 rounded-t-full ${isDark ? 'bg-white' : 'bg-black'}`}></motion.div>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto min-h-[300px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className={`border-b text-[11px] uppercase tracking-wider ${isDark ? 'bg-white/[0.02] border-white/[0.07] text-[#9A9A97]' : 'bg-black/[0.02] border-black/[0.05] text-[#86868B]'}`}>
                <th className="px-6 py-3 font-semibold w-8"></th>
                <th className="px-6 py-3 font-semibold">Alert ID</th>
                <th className="px-6 py-3 font-semibold">Time</th>
                <th className="px-6 py-3 font-semibold">Severity</th>
                <th className="px-6 py-3 font-semibold">Threat Description</th>
                <th className="px-6 py-3 font-semibold">Target Asset</th>
                <th className="px-6 py-3 font-semibold">Assignee</th>
                <th className="px-6 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDark ? 'divide-white/[0.03]' : 'divide-black/[0.05]'}`}>
              <AnimatePresence>
                {loading ? (
                  <tr><td colSpan={8} className={`py-12 text-center ${textMuted}`}>Loading secure logs...</td></tr>
                ) : filteredAlerts.length === 0 ? (
                  <tr>
                    <td colSpan={8}>
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-12 text-center flex flex-col items-center justify-center">
                        <svg className={`w-8 h-8 mb-3 opacity-30 ${textMuted}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className={`text-[14px] font-medium ${textMuted}`}>No alerts found in this view.</p>
                        <p className={`text-[12px] opacity-70 mt-1 ${textMuted}`}>Queue is clear.</p>
                      </motion.div>
                    </td>
                  </tr>
                ) : (
                  filteredAlerts.map((alert) => (
                    <motion.tr 
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      key={alert.id} 
                      className={`transition-colors group text-[13px] ${alert.status === 'Open' ? (isDark ? 'bg-red-500/[0.03]' : 'bg-red-50') : (isDark ? 'hover:bg-white/[0.02]' : 'hover:bg-black/[0.02]')}`}
                    >
                      <td className="px-6 py-4">{getStatusIndicator(alert.status)}</td>
                      <td className={`px-6 py-4 font-mono text-[11px] ${textMuted}`}>{alert.id.substring(0, 8)}...</td>
                      <td className={`px-6 py-4 ${textMuted}`}>{alert.time}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold border ${getSeverityBadge(alert.severity)}`}>
                          {alert.severity}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className={`font-semibold ${textPrimary}`}>{alert.type}</div>
                        <div className={`text-[11px] font-mono mt-0.5 ${textMuted}`}>SRC: {alert.source}</div>
                      </td>
                      <td className={`px-6 py-4 font-mono text-[12px] ${textPrimary}`}>{alert.target}</td>
                      
                      <td className="px-6 py-4">
                        <span className={`flex items-center gap-2 ${alert.assignee === 'Unassigned' ? 'text-orange-500 italic' : textMuted}`}>
                          {alert.assignee !== 'Unassigned' && alert.assignee !== 'System (Auto)' && (
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold ${isDark ? 'bg-white/10 text-white' : 'bg-black/10 text-black'}`}>
                              {alert.assignee.split(' ')[0][0]}
                            </div>
                          )}
                          <span className={`text-[12px] font-medium ${alert.assignee !== 'Unassigned' ? textPrimary : ''}`}>
                            {alert.assignee}
                          </span>
                        </span>
                      </td>
                      
                      <td className="px-6 py-4 text-right space-x-3">
                        {alert.status === 'Open' && (
                          <button onClick={() => handleAlertUpdate(alert.id, 'status', 'Investigating')} className="text-[12px] text-emerald-500 hover:text-emerald-400 font-bold transition-colors">Triage</button>
                        )}
                        {alert.status === 'Investigating' && (
                          <button onClick={() => handleAlertUpdate(alert.id, 'status', 'Closed')} className="text-[12px] text-blue-500 hover:text-blue-400 font-bold transition-colors">Resolve</button>
                        )}
                        <button className={`text-[12px] font-semibold transition-colors ${textMuted} hover:${textPrimary}`}>Details</button>
                      </td>
                    </motion.tr>
                  ))
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </motion.div>
      
    </div>
  );
};

export default Alerts;