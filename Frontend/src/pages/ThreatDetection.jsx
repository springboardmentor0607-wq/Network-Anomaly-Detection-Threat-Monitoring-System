import React, { useState, useEffect } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';
import { useOutletContext } from 'react-router-dom'; 
import { motion, AnimatePresence } from 'framer-motion';
import FluidSheet from '../components/FluidSheet'; 

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend, Filler);

// Apple-style entrance transitions
const fadeInUp = {
  initial: { opacity: 0, y: 15 },
  animate: { opacity: 1, y: 0 },
  transition: { type: 'spring', damping: 24, stiffness: 260 }
};

const ThreatDetection = () => {
  const { theme } = useOutletContext() || { theme: 'dark' };
  const isDark = theme === 'dark';
  
  const [liveThreats, setLiveThreats] = useState([]);
  const [stats, setStats] = useState({ riskScore: 0, totalDeviations: 0 });
  const [uniqueActorCount, setUniqueActorCount] = useState(0);
  
  const [chartData, setChartData] = useState(null);
  const [availableTypes, setAvailableTypes] = useState([]);
  const [selectedType, setSelectedType] = useState('All');
  const [loadingTrends, setLoadingTrends] = useState(true);

  const [heatmapAssets, setHeatmapAssets] = useState(['-', '-', '-']);
  const [heatmapVectors, setHeatmapVectors] = useState(['-', '-', '-']);
  const [heatmapProbabilities, setHeatmapProbabilities] = useState([[0,0,0], [0,0,0], [0,0,0]]);
  const [trajectoryPoints, setTrajectoryPoints] = useState([]);
  const [trajectoryLabels, setTrajectoryLabels] = useState([]);

  const [isExporting, setIsExporting] = useState(false);
  const [selectedIP, setSelectedIP] = useState(null);
  const [ipHistory, setIpHistory] = useState([]);

  // Royal Upgrade: Dynamic Team State
  const [teamMembers, setTeamMembers] = useState(['Unassigned', 'Loading Team...']);
  const statusOptions = ['Open', 'Investigating', 'False Positive', 'Closed'];

  const gridColor = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';
  const textColor = isDark ? '#9A9A97' : '#86868B';

  // Fetch Live Team Roster from Backend
  useEffect(() => {
    const fetchTeamMembers = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
        const res = await fetch('http://localhost:8000/api/users', { headers });
        
        if (res.ok) {
          const data = await res.json();
          if (data.status === 'success' && data.users) {
            const activeAnalysts = data.users.map(u => `${u.full_name || u.username} (${u.role})`);
            setTeamMembers(['Unassigned', ...activeAnalysts]);
            return;
          }
        }
        throw new Error("Users endpoint not ready");
      } catch (error) {
        console.warn("Using mock team data:", error.message);
        setTeamMembers(['Unassigned', 'Admin (Lead)', 'Sarah (L2)', 'David (L1)']);
      }
    };
    fetchTeamMembers();
  }, []);

  useEffect(() => {
    const fetchCoreSOCData = async () => {
      try {
        const statsRes = await fetch('http://localhost:8000/api/network/stats');
        const statsData = await statsRes.json();
        if (statsData.status === 'success') setStats(statsData);

        const alertsRes = await fetch('http://localhost:8000/api/alerts');
        const alertsData = await alertsRes.json();
        if (alertsData.status === 'success') {
          setLiveThreats(alertsData.alerts.slice(0, 10));
          const allUniqueIPs = new Set(
            alertsData.alerts.map(t => t.source).filter(src => src && src !== 'Unknown' && src !== '-')
          );
          setUniqueActorCount(allUniqueIPs.size);
        }

        const matrixRes = await fetch('http://localhost:8000/api/alerts/matrix');
        const matrixData = await matrixRes.json();
        if (matrixData.status === 'success') {
          setHeatmapAssets(matrixData.assets);
          setHeatmapVectors(matrixData.vectors);
          setHeatmapProbabilities(matrixData.matrix);
        }

        const forecastRes = await fetch('http://localhost:8000/api/alerts/forecast');
        const forecastData = await forecastRes.json();
        if (forecastData.status === 'success') {
          setTrajectoryLabels(forecastData.labels);
          setTrajectoryPoints(forecastData.data);
        }
      } catch (error) {
        console.error("Backend Sync Error:", error);
      }
    };
    fetchCoreSOCData();
  }, []);

  useEffect(() => {
    const fetchTrends = async () => {
      setLoadingTrends(true);
      try {
        const url = selectedType === 'All' ? 'http://localhost:8000/api/alerts/trends' : `http://localhost:8000/api/alerts/trends?attack_type=${encodeURIComponent(selectedType)}`;
        const response = await fetch(url);
        const data = await response.json();

        if (data.status === 'success') {
          setAvailableTypes(data.available_types || []);
          setChartData({
            labels: data.labels.length > 0 ? data.labels : ['No Data'],
            datasets: [
              { label: 'Total Attacks', data: data.total_data.length > 0 ? data.total_data : [0], backgroundColor: 'rgba(99, 102, 241, 0.6)', borderColor: '#6366f1', borderWidth: 1, borderRadius: 4 },
              { label: 'High/Critical', data: data.critical_data.length > 0 ? data.critical_data : [0], backgroundColor: 'rgba(239, 68, 68, 0.6)', borderColor: '#ef4444', borderWidth: 1, borderRadius: 4 }
            ]
          });
        }
      } catch (error) {} finally { setLoadingTrends(false); }
    };
    fetchTrends();
  }, [selectedType]);

  const handleAlertUpdate = async (alertId, field, value) => {
    setLiveThreats(prev => prev.map(t => t.id === alertId ? { ...t, [field]: value } : t));
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

  const handleExportReport = async () => {
    setIsExporting(true);
    try {
      const response = await fetch('http://localhost:8000/api/alerts/export');
      if (!response.ok) throw new Error('Backend compilation failed');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `SOC_Threat_Intelligence_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to export report:", error);
      alert("Failed to generate backend report. Ensure FastAPI is running.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleIPClick = (ip) => {
    if (!ip || ip === 'Unknown' || ip === '-') return;
    setSelectedIP(ip);
    setIpHistory(liveThreats.filter(t => t.source === ip));
  };

  const barChartOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { position: 'top', labels: { color: textColor, font: { family: 'system-ui, sans-serif' } } }, tooltip: { mode: 'index', intersect: false } },
    scales: { 
      x: { grid: { display: false }, ticks: { color: textColor, font: { family: 'JetBrains Mono, monospace', size: 10 } } }, 
      y: { border: { display: false }, grid: { color: gridColor, drawBorder: false }, ticks: { color: textColor, font: { family: 'JetBrains Mono, monospace', size: 10 } } } 
    },
    animation: { duration: 800, easing: 'easeOutQuart' } // Apple-style sweeping draw
  };

  const trajectoryData = {
    labels: trajectoryLabels.length > 0 ? trajectoryLabels : ['Pending'],
    datasets: [{
      label: 'Volume Trajectory & Forecast',
      data: trajectoryPoints.length > 0 ? trajectoryPoints : [0],
      borderColor: isDark ? '#ef4444' : '#dc2626',
      backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : 'rgba(220, 38, 38, 0.1)',
      fill: true, tension: 0.4, borderWidth: 2, pointRadius: 3
    }]
  };

  const getRiskColor = (score) => {
    if (score >= 8.0) return 'text-red-600 dark:text-red-400';
    if (score >= 6.0) return 'text-orange-500 dark:text-orange-400';
    return 'text-emerald-600 dark:text-emerald-400';
  };

  const calculateNumericRisk = (severity) => {
    if (severity === 'Critical') return 9.5;
    if (severity === 'High') return 7.5;
    if (severity === 'Medium') return 5.0;
    return 2.5;
  };

  const cardMaterial = isDark 
    ? 'bg-[#121214]/65 border border-white/[0.08] shadow-[0_4px_24px_rgba(0,0,0,0.35)] backdrop-blur-xl rounded-2xl' 
    : 'bg-white/70 border border-black/[0.06] shadow-[0_4px_20px_rgba(0,0,0,0.03)] backdrop-blur-xl rounded-2xl';
  
  const textPrimary = isDark ? 'text-[#F2F2F0]' : 'text-[#1D1D1F]';
  const textMuted = isDark ? 'text-[#9A9A97]' : 'text-[#86868B]';

  return (
    <div className="space-y-6 transition-colors duration-500 relative">
      
      {/* HEADER BAR */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className={`text-[20px] font-semibold tracking-tight ${textPrimary}`}>Intrusion Prediction Engine</h2>
          <p className={`text-[13px] ${textMuted} mt-0.5`}>AI-driven threat forecasting and attack probability analysis</p>
        </div>
        <div className={`flex items-center gap-4 ${isDark ? 'bg-red-500/10 border-red-500/20' : 'bg-red-50 border-red-200'} border px-5 py-3 rounded-xl transition-colors`}>
          <div className="flex flex-col">
            <span className={`text-[11px] ${isDark ? 'text-red-400/80' : 'text-red-600'} uppercase tracking-wider font-bold`}>Global Risk Score</span>
            <div className="flex items-baseline gap-1">
              <span className={`text-[24px] font-bold ${isDark ? 'text-red-400' : 'text-red-600'} leading-none tracking-tight`}>{stats.riskScore || '--'}</span>
              <span className={`text-[13px] ${isDark ? 'text-red-400/60' : 'text-red-500/60'}`}>/100</span>
            </div>
          </div>
        </div>
      </div>

      {/* METRICS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Logged Threats', value: stats.totalDeviations.toString(), subtext: 'Persisted in Database' },
          { label: 'Active Threat Actors', value: uniqueActorCount.toString(), subtext: 'Unique IPs identified' },
          { label: 'Most Vulnerable Asset', value: heatmapAssets[0] !== '-' ? heatmapAssets[0] : 'None', subtext: 'Highest attack volume' },
          { label: 'Auto-Mitigation', value: '98%', subtext: 'Systems armed' },
        ].map((metric, i) => (
          <motion.div {...fadeInUp} key={i} className={`${cardMaterial} p-5 flex flex-col justify-between hover:scale-[1.01] transition-transform`}>
            <h3 className={`text-[13px] ${textMuted} font-medium tracking-wide uppercase mb-3`}>{metric.label}</h3>
            <div>
              <div className={`text-[22px] font-semibold tracking-tight ${textPrimary}`}>{metric.value}</div>
              <div className={`text-[12px] ${textMuted} mt-1`}>{metric.subtext}</div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* PROBABILITY MATRIX */}
        <motion.div {...fadeInUp} className={`${cardMaterial} p-6 min-h-[300px] flex flex-col`}>
          <div className="flex justify-between items-center mb-6">
            <h3 className={`text-[15px] font-semibold tracking-tight ${textPrimary}`}>Attack Probability Matrix</h3>
            <span className={`text-[11px] ${textMuted} px-2.5 py-1 font-medium rounded-md ${isDark ? 'bg-white/[0.03] border border-white/[0.05]' : 'bg-black/[0.02] border border-black/[0.04]'}`}>
              Synced w/ MongoDB
            </span>
          </div>
          
          <div className="flex-grow flex flex-col justify-center">
            <div className="grid grid-cols-4 gap-2 text-center">
              <div></div>
              {heatmapVectors.map((vec, i) => <div key={i} className={`text-[11px] font-semibold ${textMuted} self-end pb-2 truncate px-1`} title={vec}>{vec}</div>)}
              
              {heatmapAssets.map((asset, rowIndex) => (
                <React.Fragment key={rowIndex}>
                  <div className={`text-[11px] font-semibold ${textMuted} self-center pr-2 text-right truncate`} title={asset}>{asset}</div>
                  {heatmapProbabilities[rowIndex] && heatmapProbabilities[rowIndex].map((prob, colIndex) => {
                    const isValid = heatmapVectors[colIndex] !== '-' && asset !== '-';
                    const cellBg = isValid 
                      ? `rgba(${isDark ? '239, 68, 68' : '220, 38, 38'}, ${Math.max(0.12, prob)})` 
                      : (isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)');
                    const cellBorder = isValid 
                      ? `rgba(${isDark ? '239, 68, 68' : '220, 38, 38'}, 0.3)` 
                      : (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)');
                    const cellText = isValid 
                      ? (isDark ? '#fca5a5' : '#991b1b') 
                      : (isDark ? '#4b5563' : '#d1d5db');

                    return (
                      <div 
                        key={colIndex} 
                        className="rounded-lg h-10 md:h-12 flex items-center justify-center text-[12px] font-bold transition-transform hover:scale-105 shadow-sm"
                        style={{ backgroundColor: cellBg, border: `1px solid ${cellBorder}`, color: cellText }}
                      >
                        {isValid ? `${Math.round(prob * 100)}%` : '--'}
                      </div>
                    )
                  })}
                </React.Fragment>
              ))}
            </div>
          </div>
        </motion.div>

        {/* LIVE TRAJECTORY */}
        <motion.div {...fadeInUp} className={`${cardMaterial} p-6 min-h-[300px] flex flex-col`}>
          <div className="flex justify-between items-center mb-4">
            <h3 className={`text-[15px] font-semibold tracking-tight ${textPrimary}`}>Live Attack Trajectory</h3>
            <div className={`text-[11px] font-bold px-3 py-1 rounded shadow-sm transition-colors ${isDark ? 'bg-white/10 text-[#F2F2F0]' : 'bg-white text-[#1D1D1F] border border-black/5'}`}>
              Forecasting
            </div>
          </div>
          <div className="flex-grow w-full relative">
            <Line key={theme} data={trajectoryData} options={barChartOptions} />
          </div>
        </motion.div>
      </div>

      {/* TRENDS CHART */}
      <motion.div {...fadeInUp} className={`${cardMaterial} p-6 w-full`}>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className={`text-[16px] font-semibold tracking-tight ${textPrimary}`}>Weekly Threat Trends</h3>
            <p className={`text-[12px] ${textMuted} mt-0.5`}>Time-series aggregation of detected anomalies</p>
          </div>
          
          <select 
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className={`text-[12px] font-medium px-3 py-1.5 rounded-lg outline-none cursor-pointer transition-colors ${isDark ? 'bg-white/5 text-[#F2F2F0] hover:bg-white/10' : 'bg-black/5 text-[#1D1D1F] hover:bg-black/10'}`}
          >
            <option value="All" className={isDark ? 'bg-[#1C1C1E]' : 'bg-white'}>All Attack Types</option>
            {availableTypes.map(type => (
              <option key={type} value={type} className={isDark ? 'bg-[#1C1C1E]' : 'bg-white'}>{type}</option>
            ))}
          </select>
        </div>

        <div className="h-[300px] w-full relative">
          <AnimatePresence mode="wait">
            {loadingTrends ? (
              <motion.div 
                key="loading" 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className={`absolute inset-0 flex items-center justify-center text-[13px] ${textMuted}`}
              >
                Aggregating timeline data...
              </motion.div>
            ) : chartData ? (
              <motion.div 
                key="chart" 
                initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, ease: 'easeOut' }}
                className="w-full h-full"
              >
                <Bar key={`${theme}-${selectedType}`} data={chartData} options={barChartOptions} />
              </motion.div>
            ) : (
              <motion.div key="empty" className={`absolute inset-0 flex items-center justify-center ${textMuted}`}>
                No trend data available
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* REAL TIME FEED */}
      <motion.div {...fadeInUp} className={`${cardMaterial} overflow-hidden w-full max-w-full`}>
        <div className={`px-6 py-4 border-b flex justify-between items-center ${isDark ? 'border-white/[0.07] bg-white/[0.01]' : 'border-black/[0.05] bg-black/[0.01]'}`}>
          <div>
            <h2 className={`text-[15px] font-semibold tracking-tight ${textPrimary}`}>Real-Time Incident Triage Feed</h2>
            <p className={`text-[11px] ${textMuted} mt-0.5`}>Click any Source IP to view context enrichment timeline.</p>
          </div>
          
          <button 
            onClick={handleExportReport}
            disabled={isExporting}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0071E3] hover:bg-[#0077ED] text-white text-[12px] font-medium transition-all shadow-sm disabled:opacity-50 active:scale-95 cursor-pointer"
          >
            {isExporting ? (
              <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            ) : (
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            )}
            {isExporting ? 'Generating...' : 'Export CSV'}
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className={`border-b text-[11px] uppercase tracking-wider ${isDark ? 'border-white/[0.07] text-[#86868B] bg-white/[0.02]' : 'border-black/[0.05] text-[#9A9A97] bg-black/[0.02]'}`}>
                <th className="px-6 py-3 font-semibold">Threat Vector</th>
                <th className="px-6 py-3 font-semibold">Source IP</th>
                <th className="px-6 py-3 font-semibold">Risk (0-10)</th>
                <th className="px-6 py-3 font-semibold">Assignee</th>
                <th className="px-6 py-3 font-semibold">Triage Status</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDark ? 'divide-white/[0.03]' : 'divide-black/[0.05]'}`}>
              {liveThreats.map((threat) => (
                <tr key={threat.id || threat._id} className={`hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors text-[13px] ${textPrimary}`}>
                  <td className="px-6 py-4 font-medium">{threat.type}</td>
                  <td 
                    className="px-6 py-4 font-mono text-[12px] cursor-pointer text-[#0071E3] dark:text-[#0A84FF] hover:underline"
                    onClick={() => handleIPClick(threat.source)}
                    title="Click to view IP historical context"
                  >
                    {threat.source || 'Unknown'}
                  </td>
                  <td className="px-6 py-4"><span className={`font-bold ${getRiskColor(calculateNumericRisk(threat.severity))}`}>{calculateNumericRisk(threat.severity).toFixed(1)}</span></td>
                  
                  <td className="px-6 py-4">
                    <select
                      value={threat.assignee || 'Unassigned'}
                      onChange={(e) => handleAlertUpdate(threat.id || threat._id, 'assignee', e.target.value)}
                      className="bg-transparent border-none text-[12px] font-medium px-2 py-1 outline-none cursor-pointer max-w-[150px]"
                    >
                      {teamMembers.map(m => <option key={m} value={m} className={isDark ? 'bg-[#1C1C1E]' : 'bg-white'}>{m}</option>)}
                    </select>
                  </td>

                  <td className="px-6 py-4">
                    <select
                      value={threat.status || 'Open'}
                      onChange={(e) => handleAlertUpdate(threat.id || threat._id, 'status', e.target.value)}
                      className={`bg-transparent border-none text-[11px] font-bold uppercase tracking-wider px-2 py-1 outline-none cursor-pointer ${
                        threat.status === 'Closed' ? 'text-emerald-500' 
                        : threat.status === 'Investigating' ? 'text-amber-500' 
                        : threat.status === 'False Positive' ? 'text-[#86868B]'
                        : 'text-red-500'
                      }`}
                    >
                      {statusOptions.map(s => <option key={s} value={s} className={isDark ? 'bg-[#1C1C1E]' : 'bg-white'}>{s}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* FLUID THREAT CONTEXT SHEET */}
      <FluidSheet 
        isOpen={!!selectedIP} 
        onClose={() => setSelectedIP(null)} 
        title={`Threat Context: ${selectedIP}`}
        isDark={isDark}
      >
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className={`p-5 rounded-xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-black/5 border-black/10'}`}>
              <p className={`text-[11px] uppercase tracking-wide font-bold mb-1.5 ${textMuted}`}>Total Exploits Logged</p>
              <p className={`text-3xl font-semibold tracking-tight ${textPrimary}`}>{ipHistory.length}</p>
            </div>
            <div className={`p-5 rounded-xl border ${isDark ? 'bg-red-500/10 border-red-500/20' : 'bg-red-50 border-red-200'}`}>
              <p className="text-[11px] uppercase tracking-wide font-bold mb-1.5 text-red-600 dark:text-red-400">Peak Threat Risk</p>
              <p className="text-3xl font-semibold tracking-tight text-red-600 dark:text-red-400">
                {Math.max(...ipHistory.map(t => calculateNumericRisk(t.severity)), 0).toFixed(1)}<span className="text-lg opacity-60">/10</span>
              </p>
            </div>
          </div>

          <div className="flex justify-between items-center mt-8 mb-4">
             <h4 className={`text-[15px] font-semibold tracking-tight ${textPrimary}`}>Historical Attack Timeline</h4>
             <button 
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors text-[13px] font-bold active:scale-95 shadow-md"
                onClick={() => alert(`Firewall rule initiated: Block ${selectedIP}`)}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Deploy Block Rule
              </button>
          </div>

          <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-300 dark:before:via-gray-700 before:to-transparent">
            {ipHistory.map((incident, idx) => {
              const timeString = incident.timestamp 
                ? new Date(incident.timestamp).toLocaleString() 
                : new Date(Date.now() - idx * 60000).toLocaleString(); 

              return (
                <motion.div 
                  initial={{ opacity: 0, x: idx % 2 === 0 ? -20 : 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1, type: 'spring' }}
                  key={idx} 
                  className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active"
                >
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full border-[3px] shadow-sm z-10 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 ${isDark ? 'border-[#0A0A0B] bg-red-500/20 text-red-400' : 'border-white bg-red-100 text-red-500'}`}>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                  </div>
                  
                  <div className={`w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-5 rounded-2xl shadow-sm border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white/60 border-black/5'} backdrop-blur-md hover:scale-[1.02] transition-transform`}>
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <span className={`font-semibold text-[15px] tracking-tight block ${isDark ? 'text-red-400' : 'text-red-600'}`}>{incident.type}</span>
                        <span className={`text-[11px] font-mono ${textMuted}`}>{timeString}</span>
                      </div>
                      <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded ${
                          incident.status === 'Closed' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400' 
                          : 'bg-black/5 text-[#86868B] dark:bg-white/10 dark:text-[#9A9A97]'
                      }`}>
                        {incident.status || 'Open'}
                      </span>
                    </div>
                    <div className={`space-y-1 mt-3 pt-3 border-t ${isDark ? 'border-white/5' : 'border-black/5'}`}>
                      <p className={`text-[13px] font-mono flex justify-between ${textPrimary}`}>
                        <span className={textMuted}>AI Confidence:</span> {incident.confidence}
                      </p>
                      <p className={`text-[13px] font-mono flex justify-between ${textPrimary}`}>
                        <span className={textMuted}>Targeted Protocol:</span> {incident.protocol || 'TCP'}
                      </p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </FluidSheet>

    </div>
  );
};

export default ThreatDetection;