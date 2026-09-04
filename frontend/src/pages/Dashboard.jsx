import React, { useEffect, useState } from 'react';
import API from '../services/api';
import { 
  ShieldAlert, Activity, Cpu, CheckCircle2, 
  Clock, ShieldCheck, Users, HardDrive, Download 
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const Dashboard = () => {
  const [summary, setSummary] = useState(null);
  const [trends, setTrends] = useState([]);
  const [huntLoading, setHuntLoading] = useState(false);
  const [huntError, setHuntError] = useState('');
  const [huntResults, setHuntResults] = useState(null);

  const handleThreatHunt = async () => {
    setHuntLoading(true);
    setHuntError('');
    try {
      const response = await API.post('/threat-hunt');
      setHuntResults(response.data);
    } catch (error) {
      setHuntResults(null);
      setHuntError(error.response?.data?.detail || 'Threat Hunt failed.');
    } finally {
      setHuntLoading(false);
    }
  };

  useEffect(() => {
    API.get('/dashboard/summary').then(res => setSummary(res.data)).catch(console.error);
    API.get('/dashboard/threat-trends').then(res => setTrends(res.data)).catch(console.error);
  }, []);

  return (
    <div className="p-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#0d1527] p-6 rounded-2xl border border-[#1b2a4a]">
        <div>
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/10 text-[#00f0ff] border border-cyan-500/30">
              • LIVE MONITORING
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              AI: ACTIVE
            </span>
          </div>
          <h1 className="text-3xl font-bold text-white mt-2">Cyber Defense Command Center</h1>
          <p className="text-slate-400 text-sm mt-1">
            Real-time AI-powered monitoring and intelligent threat detection across enterprise infrastructure.
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={handleThreatHunt} disabled={huntLoading} className="flex items-center gap-2 bg-[#00f0ff] hover:bg-cyan-400 disabled:opacity-50 text-[#070b14] px-4 py-2.5 rounded-xl font-semibold text-sm transition shadow-lg shadow-cyan-500/20">
            <Activity className="w-4 h-4" /> {huntLoading ? 'Hunting...' : 'Threat Hunt'}
          </button>
          <a href="http://localhost:8000/api/threats/export" className="flex items-center gap-2 bg-[#131f38] hover:bg-[#1b2a4a] text-slate-200 px-4 py-2.5 rounded-xl font-semibold text-sm transition border border-[#1b2a4a]">
            <Download className="w-4 h-4" /> Export Report
          </a>
        </div>
      </div>

      {(huntError || huntResults) && (
        <div className={`p-4 rounded-xl border ${huntError ? 'border-rose-500/30 bg-rose-500/10 text-rose-400' : 'border-cyan-500/30 bg-cyan-500/10 text-cyan-300'}`}>
          {huntError || `Threat Hunt scanned ${huntResults.scanned_rows} rows and found ${huntResults.threat_count} threats.`}
          {huntResults?.results?.length > 0 && (
            <div className="mt-3 space-y-1 text-sm text-slate-300">
              {huntResults.results.slice(0, 5).map((result) => (
                <div key={result.row}>Row {result.row}: {result.predicted_class} ({result.severity}, risk {result.risk_score})</div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: "NETWORK EVENTS", value: summary?.network_events || "284,917", change: "+12.4%", icon: Activity, color: "cyan" },
          { title: "CRITICAL THREATS", value: summary?.critical_threats || "7", change: "+18.2%", icon: ShieldAlert, color: "rose" },
          { title: "BLOCKED ATTACKS", value: summary?.blocked_attacks || "1,893", change: "+5.7%", icon: ShieldCheck, color: "emerald" },
          { title: "AI ACCURACY", value: summary?.ai_accuracy || "98.42%", change: "+0.3%", icon: Cpu, color: "blue" },
          { title: "RESPONSE TIME", value: summary?.response_time || "1.4s", change: "22.1%", icon: Clock, color: "cyan" },
          { title: "NETWORK HEALTH", value: summary?.network_health || "97.8%", change: "+0.8%", icon: CheckCircle2, color: "emerald" },
          { title: "ACTIVE ANALYSTS", value: summary?.active_analysts || "12", change: "SOC Live", icon: Users, color: "blue" },
          { title: "PROTECTED HOSTS", value: summary?.protected_devices || "4,847", change: "100%", icon: HardDrive, color: "cyan" }
        ].map((card, i) => {
          const Icon = card.icon;
          return (
            <div key={i} className="bg-[#0d1527] border border-[#1b2a4a] p-5 rounded-xl space-y-3">
              <div className="flex justify-between items-center text-xs text-slate-400 font-semibold tracking-wider">
                <span>{card.title}</span>
                <span className="text-[#00f0ff] bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">{card.change}</span>
              </div>
              <div className="flex justify-between items-end">
                <span className="text-2xl font-bold text-white">{card.value}</span>
                <Icon className="w-6 h-6 text-slate-500" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Real-time Threat Chart */}
      <div className="bg-[#0d1527] border border-[#1b2a4a] p-6 rounded-2xl space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-lg font-bold text-white">Network Traffic & Threat Volume</h2>
            <p className="text-xs text-slate-400">Chronological distribution of normal flows vs. filtered attacks</p>
          </div>
          <span className="text-xs text-slate-400 bg-[#070b14] px-3 py-1.5 rounded-lg border border-[#1b2a4a]">Last 24 Hours</span>
        </div>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trends}>
              <defs>
                <linearGradient id="threatGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ff3366" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#ff3366" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="time" stroke="#475569" />
              <YAxis stroke="#475569" />
              <Tooltip contentStyle={{ backgroundColor: '#0d1527', borderColor: '#1b2a4a', color: '#fff' }} />
              <Area type="monotone" dataKey="threats" stroke="#ff3366" strokeWidth={2} fillOpacity={1} fill="url(#threatGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;