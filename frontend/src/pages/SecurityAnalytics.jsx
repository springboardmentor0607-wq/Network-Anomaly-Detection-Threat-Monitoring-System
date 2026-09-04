import React, { useEffect, useState } from 'react';
import { socAPI } from '../services/api';
import { BarChart2, Download, FileText, Printer, Clock, Activity, ShieldCheck } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function SecurityAnalytics() {
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    socAPI.getAnalyticsSummary().then(res => setAnalytics(res.data)).catch(console.error);
  }, []);

  const exportReport = (format) => {
    window.open(`http://localhost:8000/api/reports/${format}`, '_blank');
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <BarChart2 className="w-6 h-6 text-[#00f0ff]" /> Security Analytics & SOC KPIs
          </h1>
          <p className="text-sm text-slate-400">Real-time SQLAlchemy database aggregations and live binary report exports.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => exportReport('pdf')} className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-[#070b14] px-4 py-2 rounded-xl font-bold text-xs transition">
            <Printer className="w-4 h-4" /> Export PDF
          </button>
          <button onClick={() => exportReport('csv')} className="flex items-center gap-2 bg-[#00f0ff] hover:bg-cyan-400 text-[#070b14] px-4 py-2 rounded-xl font-bold text-xs transition">
            <Download className="w-4 h-4" /> Export CSV
          </button>
          <button onClick={() => exportReport('json')} className="flex items-center gap-2 bg-[#131f38] hover:bg-[#1b2a4a] text-slate-200 border border-[#1b2a4a] px-4 py-2 rounded-xl font-bold text-xs transition">
            <FileText className="w-4 h-4" /> Export JSON
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {[
          { label: 'MTTA (Mean Time to Acknowledge)', val: analytics?.mtta || 'N/A', icon: Clock },
          { label: 'MTTR (Mean Time to Resolve)', val: analytics?.mttr || 'N/A', icon: Activity },
          { label: 'Critical Alert Rate', val: analytics?.critical_alert_rate || '0.00%', icon: ShieldCheck },
          { label: 'Total Analyzed Flows', val: analytics?.total_alerts || '0', icon: BarChart2 }
        ].map((c, i) => {
          const Icon = c.icon;
          return (
            <div key={i} className="bg-[#0d1527] border border-[#1b2a4a] p-5 rounded-2xl space-y-2">
              <span className="text-xs text-slate-400 font-semibold">{c.label}</span>
              <div className="flex justify-between items-end">
                <span className="text-2xl font-bold text-white">{c.val}</span>
                <Icon className="w-6 h-6 text-slate-500" />
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-[#0d1527] border border-[#1b2a4a] p-6 rounded-2xl space-y-4">
        <h2 className="text-base font-bold text-white">Threat Category Distribution</h2>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={analytics?.attack_distribution || []}>
              <XAxis dataKey="attack_vector" stroke="#475569" />
              <YAxis stroke="#475569" />
              <Tooltip contentStyle={{ backgroundColor: '#0d1527', borderColor: '#1b2a4a', color: '#fff' }} />
              <Bar dataKey="count" fill="#00f0ff" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
