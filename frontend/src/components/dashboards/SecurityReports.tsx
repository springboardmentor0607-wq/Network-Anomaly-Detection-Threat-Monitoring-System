'use client';

import React, { useEffect, useState } from 'react';
import { ClipboardList, Download, FileText, AlertOctagon, TrendingUp, ShieldCheck, PieChart as PieChartIcon } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';

const riskScores = [
  { department: 'Engineering', score: 85, color: '#ef4444' },
  { department: 'Finance', score: 65, color: '#f97316' },
  { department: 'HR', score: 35, color: '#eab308' },
  { department: 'Marketing', score: 20, color: '#22c55e' },
  { department: 'Operations', score: 50, color: '#3b82f6' },
];

const anomalyTrends = [
  { day: 'Mon', anomalies: 120, detected: 118, missed: 2 },
  { day: 'Tue', anomalies: 150, detected: 145, missed: 5 },
  { day: 'Wed', anomalies: 90, detected: 89, missed: 1 },
  { day: 'Thu', anomalies: 220, detected: 215, missed: 5 },
  { day: 'Fri', anomalies: 300, detected: 295, missed: 5 },
  { day: 'Sat', anomalies: 80, detected: 80, missed: 0 },
  { day: 'Sun', anomalies: 60, detected: 60, missed: 0 },
];

type Report = {
  id: string;
  name: string;
  type: string;
  date: string;
  size: string;
};

export default function SecurityReports() {
  const [reports, setReports] = useState<Report[]>([]);

  useEffect(() => {
    fetch('http://localhost:8000/api/reports/list')
      .then(res => res.json())
      .then(data => setReports(data))
      .catch(err => console.error("Error fetching reports:", err));
  }, []);

  const handleDownload = (id: string) => {
    window.open(`http://localhost:8000/api/reports/download/${id}`, "_blank");
  };
  return (
    <div className="space-y-6 w-full animate-blur-fade-up" style={{ animationDelay: "100ms" }}>
      {/* Title Bar */}
      <div className="flex justify-between items-center pb-4 border-b border-white/10">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-wider flex items-center gap-2">
            <ClipboardList className="text-blue-400" />
            Anomaly Detection Reports
          </h2>
          <p className="text-gray-400 text-sm mt-1">Generated risk scoring systems and threat detection summaries</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors font-medium text-sm">
          <Download className="w-4 h-4" /> Export Report (PDF)
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Risk Scoring System */}
        <div className="lg:col-span-1 space-y-6">
          <div className="rounded-2xl liquid-glass !bg-black/40 !backdrop-blur-xl border border-white/10 p-6">
            <h3 className="font-bold text-white text-lg flex items-center gap-2 mb-4">
              <AlertOctagon className="text-red-400" /> Overall Risk Score
            </h3>
            <div className="flex items-end gap-2 mb-2">
              <span className="text-6xl font-bold text-orange-500 tracking-tighter">72</span>
              <span className="text-gray-400 text-sm mb-2">/ 100 (High)</span>
            </div>
            <p className="text-xs text-gray-400">Based on recent anomaly detection confidence and volume.</p>
          </div>

          <div className="rounded-2xl liquid-glass !bg-black/40 !backdrop-blur-xl border border-white/10 p-6">
            <h3 className="font-bold text-white text-base mb-4">Risk by Department</h3>
            <div className="space-y-4">
              {riskScores.map((dept, i) => (
                <div key={i}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-300">{dept.department}</span>
                    <span className="text-white font-mono">{dept.score}/100</span>
                  </div>
                  <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                    <div 
                      className="h-1.5 rounded-full transition-all" 
                      style={{ width: `${dept.score}%`, backgroundColor: dept.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Weekly Threat Trends & Reports Table */}
        <div className="lg:col-span-3 space-y-6">
          <div className="rounded-2xl liquid-glass !bg-black/40 !backdrop-blur-xl border border-white/10 p-6">
            <h3 className="font-bold text-white text-lg flex items-center gap-2 mb-6">
              <TrendingUp className="text-green-400" /> Anomaly Detection Efficacy (7 Days)
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={anomalyTrends} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#9ca3af" }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#9ca3af" }} />
                <Tooltip contentStyle={{ background: "#000", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 8, color: "#fff" }} cursor={{ fill: "rgba(255,255,255,0.05)" }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="detected" name="Detected Anomalies" stackId="a" fill="#3b82f6" radius={[0, 0, 4, 4]} />
                <Bar dataKey="missed" name="Missed (False Negatives)" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-2xl liquid-glass !bg-black/40 !backdrop-blur-xl border border-white/10 overflow-hidden">
            <div className="flex justify-between items-center px-6 py-4 border-b border-white/10 bg-white/5">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <FileText className="text-gray-300 w-5 h-5" />
                Available Generated Reports
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-xs text-gray-400 uppercase tracking-wider bg-black/40 border-b border-white/10">
                    <th className="px-6 py-3">Report Name</th>
                    <th className="px-6 py-3">Type</th>
                    <th className="px-6 py-3">Date Generated</th>
                    <th className="px-6 py-3">Size</th>
                    <th className="px-6 py-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {reports.map((report) => (
                    <tr key={report.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 font-medium text-white flex items-center gap-2">
                          <FileText className="w-4 h-4 text-blue-400" /> {report.name}
                      </td>
                      <td className="px-6 py-4 text-gray-300">{report.type}</td>
                      <td className="px-6 py-4 text-gray-400">{report.date}</td>
                      <td className="px-6 py-4 text-gray-400 font-mono">{report.size}</td>
                      <td 
                        className="px-6 py-4 text-blue-400 cursor-pointer hover:text-blue-300 font-medium"
                        onClick={() => handleDownload(report.id)}
                      >
                        Download
                      </td>
                    </tr>
                  ))}
                  {reports.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                        No reports available.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
