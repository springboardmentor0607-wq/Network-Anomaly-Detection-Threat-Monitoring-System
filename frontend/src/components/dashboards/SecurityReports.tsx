'use client';

import React, { useEffect, useState, useRef } from 'react';
import {
  ClipboardList, Download, FileText, AlertOctagon,
  TrendingUp, ShieldCheck, RefreshCw
} from 'lucide-react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis,
  Tooltip, ResponsiveContainer, CartesianGrid, Legend
} from 'recharts';

// ─── Types ─────────────────────────────────────────────────────
interface AttackCategory { name: string; value: number; }
interface TimelinePoint  { time: string; attacks: number; }
interface ThreatAnalysis {
  total_predictions: number;
  most_frequent_attack: string;
  risk_score_distribution: { Low: number; Medium: number; High: number; Critical: number };
  attack_distribution: Record<string, number>;
  anomalies_detected: number;
  system_status: string;
}
interface Report { id: string; name: string; type: string; date: string; size: string; }

// ─── Component ─────────────────────────────────────────────────
export default function SecurityReports({ dataset = "CICIDS2017" }: { dataset?: string }) {
  const [reports, setReports]             = useState<Report[]>([]);
  const [attackCats, setAttackCats]       = useState<AttackCategory[]>([]);
  const [timeline, setTimeline]           = useState<TimelinePoint[]>([]);
  const [threatAnalysis, setThreatAnalysis] = useState<ThreatAnalysis | null>(null);
  const [loading, setLoading]             = useState(true);
  const [exporting, setExporting]         = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [rptRes, catRes, tlRes, taRes] = await Promise.all([
          fetch('http://localhost:8000/api/reports/list'),
          fetch(`http://localhost:8000/api/network/dashboard-stats?dataset=${dataset}`),
          fetch(`http://localhost:8000/api/network/attack-timeline?dataset=${dataset}`),
          fetch(`http://localhost:8000/api/ml/reports/threat-analysis?dataset=${dataset}`),
        ]);

        if (rptRes.ok) setReports(await rptRes.json());

        if (catRes.ok) {
          const stats = await catRes.json();
          setAttackCats(stats.attack_categories || []);
        }

        if (tlRes.ok) {
          const tl: TimelinePoint[] = await tlRes.json();
          // Only show hours that have data to keep chart clean
          setTimeline(tl.filter((p) => p.attacks > 0));
        }

        if (taRes.ok) setThreatAnalysis(await taRes.json());
      } catch (err) {
        console.error('Failed to load security reports:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [dataset]);

  // ─── Overall Risk Score ────────────────────────────────────────
  const computeOverallRisk = (): number => {
    if (!threatAnalysis) return 72;
    const dist = threatAnalysis.risk_score_distribution;
    const total = dist.Low + dist.Medium + dist.High + dist.Critical || 1;
    return Math.round(
      ((dist.Medium * 30 + dist.High * 65 + dist.Critical * 90) / total)
    );
  };

  const overallRisk = computeOverallRisk();
  const riskColor = overallRisk >= 70 ? '#ef4444' : overallRisk >= 40 ? '#f97316' : '#22c55e';

  // ─── Risk Distribution Bars ────────────────────────────────────
  const riskBars = threatAnalysis
    ? [
        { department: 'Critical', score: threatAnalysis.risk_score_distribution.Critical, color: '#ef4444' },
        { department: 'High',     score: threatAnalysis.risk_score_distribution.High,     color: '#f97316' },
        { department: 'Medium',   score: threatAnalysis.risk_score_distribution.Medium,   color: '#eab308' },
        { department: 'Low',      score: threatAnalysis.risk_score_distribution.Low,      color: '#22c55e' },
      ]
    : [];

  const maxBar = Math.max(...riskBars.map((b) => b.score), 1);

  // ─── Export as PDF (print dialog) ─────────────────────────────
  const handleExport = () => {
    setExporting(true);
    setTimeout(() => {
      window.print();
      setExporting(false);
    }, 200);
  };

  const handleDownload = (id: string) => {
    window.open(`http://localhost:8000/api/reports/download/${id}`, '_blank');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-white font-mono animate-pulse">
        <RefreshCw className="w-5 h-5 mr-2 animate-spin" /> Loading Reports...
      </div>
    );
  }

  return (
    <div ref={printRef} className="space-y-6 w-full animate-blur-fade-up" style={{ animationDelay: '100ms' }}>

      {/* ── Title Bar ───────────────────────────────────────── */}
      <div className="flex justify-between items-center pb-4 border-b border-white/10">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-wider flex items-center gap-2">
            <ClipboardList className="text-blue-400" />
            Anomaly Detection Reports
          </h2>
          <p className="text-gray-400 text-sm mt-1">
            Risk scoring, threat summaries &amp; detection efficacy — {dataset}
          </p>
        </div>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white rounded-lg transition-colors font-medium text-sm"
        >
          {exporting ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          Export Report (PDF)
        </button>
      </div>

      {/* ── Summary Stats ────────────────────────────────────── */}
      {threatAnalysis && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Predictions', value: threatAnalysis.total_predictions.toLocaleString() },
            { label: 'Anomalies Detected', value: threatAnalysis.anomalies_detected.toLocaleString() },
            { label: 'Top Attack', value: threatAnalysis.most_frequent_attack || 'N/A' },
            { label: 'System Status', value: threatAnalysis.system_status },
          ].map((s, i) => (
            <div key={i} className="rounded-2xl liquid-glass !bg-black/40 !backdrop-blur-xl border border-white/10 p-4">
              <p className="text-xs text-gray-400 uppercase tracking-wide">{s.label}</p>
              <p className="text-lg font-bold text-white mt-1 truncate">{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── Main Grid ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

        {/* Risk Scoring Panel */}
        <div className="lg:col-span-1 space-y-6">
          <div className="rounded-2xl liquid-glass !bg-black/40 !backdrop-blur-xl border border-white/10 p-6">
            <h3 className="font-bold text-white text-lg flex items-center gap-2 mb-4">
              <AlertOctagon className="text-red-400" /> Overall Risk Score
            </h3>
            <div className="flex items-end gap-2 mb-2">
              <span className="text-6xl font-bold tracking-tighter" style={{ color: riskColor }}>
                {overallRisk}
              </span>
              <span className="text-gray-400 text-sm mb-2">
                / 100 ({overallRisk >= 70 ? 'High' : overallRisk >= 40 ? 'Medium' : 'Low'})
              </span>
            </div>
            <p className="text-xs text-gray-400">
              Computed from risk distribution across {threatAnalysis?.total_predictions?.toLocaleString() || 'N/A'} predictions.
            </p>
          </div>

          {riskBars.length > 0 && (
            <div className="rounded-2xl liquid-glass !bg-black/40 !backdrop-blur-xl border border-white/10 p-6">
              <h3 className="font-bold text-white text-base mb-4">Risk Distribution</h3>
              <div className="space-y-4">
                {riskBars.map((bar, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-300">{bar.department}</span>
                      <span className="text-white font-mono">{bar.score.toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="h-1.5 rounded-full transition-all duration-700"
                        style={{
                          width: `${Math.round((bar.score / maxBar) * 100)}%`,
                          backgroundColor: bar.color
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Charts & Reports */}
        <div className="lg:col-span-3 space-y-6">

          {/* Attack Category Bar Chart */}
          {attackCats.length > 0 && (
            <div className="rounded-2xl liquid-glass !bg-black/40 !backdrop-blur-xl border border-white/10 p-6">
              <h3 className="font-bold text-white text-lg flex items-center gap-2 mb-6">
                <TrendingUp className="text-green-400" /> Attack Category Distribution
              </h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={attackCats} margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: '#9ca3af' }}
                    interval={0}
                    angle={-20}
                    textAnchor="end"
                    height={40}
                  />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9ca3af' }} />
                  <Tooltip
                    contentStyle={{ background: '#000', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8, color: '#fff' }}
                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  />
                  <Bar dataKey="value" name="Incidents" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Hourly Attack Timeline */}
          {timeline.length > 0 && (
            <div className="rounded-2xl liquid-glass !bg-black/40 !backdrop-blur-xl border border-white/10 p-6">
              <h3 className="font-bold text-white text-lg flex items-center gap-2 mb-6">
                <ShieldCheck className="text-purple-400" /> Hourly Attack Activity
              </h3>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={timeline} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9ca3af' }} />
                  <Tooltip contentStyle={{ background: '#000', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8, color: '#fff' }} />
                  <Line type="monotone" dataKey="attacks" stroke="#ef4444" strokeWidth={2} dot={false} name="Attacks" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Reports Table */}
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
