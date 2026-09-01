import React, { useState } from 'react';
import { Card } from '../../components/common/Card';
import { FileSpreadsheet, Download, Filter, FileText, CheckCircle, Calendar } from 'lucide-react';

interface ReportItem {
  id: string;
  title: string;
  type: string;
  generatedAt: string;
  author: string;
  threats: number;
  incidents: number;
  avgRisk: number;
  summary: string;
}

export const ReportsPage: React.FC = () => {
  const [reports] = useState<ReportItem[]>([
    {
      id: 'RPT-2026-0810',
      title: 'Daily Executive Security Telemetry & Anomaly Briefing',
      type: 'DAILY',
      generatedAt: '2026-08-10T08:00:00Z',
      author: 'NetShield Automated Engine',
      threats: 142,
      incidents: 2,
      avgRisk: 34.2,
      summary: 'Over the past 24 hours, NetShield AI processed 4,892,100 network packets. 142 threat anomalies were flagged, primarily consisting of TCP SYN floods targeting edge API endpoints and automated SSH password spraying.',
    },
    {
      id: 'RPT-2026-0803',
      title: 'Weekly Threat Intelligence & Intrusion Trends',
      type: 'WEEKLY',
      generatedAt: '2026-08-03T00:00:00Z',
      author: 'Sarah Connor (SOC Lead)',
      threats: 984,
      incidents: 9,
      avgRisk: 28.5,
      summary: 'Weekly analysis indicates a 14.2% increase in external reconnaissance scanning from known TOR exit nodes. All identified malicious IPs were automatically ingested into local firewall blocklists.',
    },
    {
      id: 'RPT-2026-0731',
      title: 'Monthly AI Model Validation & False Positive Audit',
      type: 'MONTHLY',
      generatedAt: '2026-07-31T23:59:59Z',
      author: 'ML Ops Team',
      threats: 4120,
      incidents: 34,
      avgRisk: 31.0,
      summary: 'Monthly evaluation of XGBoost v2.4.1 classifier demonstrated 98.42% accuracy with a 1.2% false positive rate across CICIDS2017 validation holdout data.',
    },
  ]);

  const [selectedReport, setSelectedReport] = useState<ReportItem>(reports[0]);

  const handleDownload = (format: 'pdf' | 'csv') => {
    const text = `NETSHIELD AI SECURITY REPORT\nTitle: ${selectedReport.title}\nID: ${selectedReport.id}\nFormat: ${format.toUpperCase()}\nGenerated: ${selectedReport.generatedAt}\n\nSummary:\n${selectedReport.summary}`;
    const blob = new Blob([text], { type: format === 'csv' ? 'text/csv' : 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedReport.id}.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Security Reporting Center</h2>
          <p className="text-xs text-gray-400">Automated executive summaries, threat briefings, and CSV/PDF export capability.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Reports Navigation List */}
        <div className="space-y-3">
          {reports.map((rpt) => (
            <div
              key={rpt.id}
              onClick={() => setSelectedReport(rpt)}
              className={`p-4 rounded-xl border cursor-pointer transition ${
                selectedReport.id === rpt.id
                  ? 'bg-cyan-950/40 border-cyan-500/60 shadow-lg'
                  : 'bg-[#0F172A] border-[#1F2937] hover:border-gray-700'
              }`}
            >
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-bold text-cyan-400">{rpt.id}</span>
                <span className="px-2 py-0.5 bg-[#131C2E] border border-[#1F2937] text-gray-300 rounded text-[10px] font-bold">
                  {rpt.type}
                </span>
              </div>
              <h4 className="text-xs font-bold text-white line-clamp-1">{rpt.title}</h4>
              <span className="text-[11px] text-gray-500 block mt-2">{new Date(rpt.generatedAt).toLocaleDateString()}</span>
            </div>
          ))}
        </div>

        {/* Report Inspector & Export Card */}
        <div className="lg:col-span-2 space-y-6">
          <Card title={`Security Report Preview: ${selectedReport.id}`}>
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-base font-bold text-white">{selectedReport.title}</h3>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleDownload('pdf')}
                      className="px-3 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs rounded-lg shadow transition flex items-center space-x-1"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Export PDF</span>
                    </button>
                    <button
                      onClick={() => handleDownload('csv')}
                      className="px-3 py-1.5 bg-[#131C2E] hover:bg-[#1E293B] border border-[#1F2937] text-gray-200 font-semibold text-xs rounded-lg transition flex items-center space-x-1"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Export CSV</span>
                    </button>
                  </div>
                </div>
                <p className="text-xs text-gray-400">Author: {selectedReport.author} • Generated: {new Date(selectedReport.generatedAt).toLocaleString()}</p>
              </div>

              <div className="grid grid-cols-3 gap-4 text-center bg-[#0B0F17] p-4 rounded-xl border border-[#1F2937] text-xs">
                <div><span className="text-gray-400 block mb-1">Threat Anomalies</span><strong className="text-xl text-red-400">{selectedReport.threats}</strong></div>
                <div><span className="text-gray-400 block mb-1">Critical Incidents</span><strong className="text-xl text-amber-400">{selectedReport.incidents}</strong></div>
                <div><span className="text-gray-400 block mb-1">Average Risk Score</span><strong className="text-xl text-cyan-400">{selectedReport.avgRisk}/100</strong></div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">Executive Summary</h4>
                <p className="text-xs text-gray-300 leading-relaxed bg-[#131C2E] p-4 rounded-xl border border-[#1F2937]">
                  {selectedReport.summary}
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
