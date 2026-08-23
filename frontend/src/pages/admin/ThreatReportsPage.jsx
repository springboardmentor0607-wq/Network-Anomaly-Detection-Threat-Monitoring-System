import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Skeleton from '../../components/common/Skeleton';
import {
  DocumentTextIcon,
  ArrowDownTrayIcon,
  SparklesIcon,
  ArrowPathIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

const ThreatReportsPage = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  // Generator Form
  const [reportType, setReportType] = useState('EXECUTIVE_SUMMARY');
  const [reportFormat, setReportFormat] = useState('JSON');
  const [dateRange, setDateRange] = useState('LAST_7_DAYS');

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await api.get('/reports');
      if (res.data && res.data.data) {
        setReports(res.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleGenerateReport = async (e) => {
    e.preventDefault();
    setGenerating(true);
    try {
      const res = await api.post('/reports/generate', {
        type: reportType,
        format: reportFormat,
        dateRange
      });
      alert(`Report generated successfully! ID: ${res.data.data.reportId}`);
      fetchReports();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to generate report');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header Banner */}
      <div className="glass-card rounded-2xl p-6 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-wide font-mono flex items-center space-x-3">
            <DocumentTextIcon className="w-6 h-6 text-cyan-400" />
            <span>SOC Threat Reporting & Compliance Engine</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Automated SOC executive summaries, threat intel reports, incident audit logs, and security analytics exports (JSON, CSV, PDF).
          </p>
        </div>

        <button
          onClick={fetchReports}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold rounded-xl text-xs flex items-center space-x-2 border border-slate-700"
        >
          <ArrowPathIcon className="w-4 h-4" />
          <span>Refresh Reports</span>
        </button>
      </div>

      {/* Generator Form */}
      <form onSubmit={handleGenerateReport} className="glass-card rounded-2xl p-6 border border-slate-800 space-y-4 font-mono text-xs">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider text-cyan-400 flex items-center space-x-2">
          <SparklesIcon className="w-4 h-4" />
          <span>Generate New Security Audit Report</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="text-slate-400 block mb-1">REPORT TYPE:</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none"
            >
              <option value="EXECUTIVE_SUMMARY">Executive Security Summary</option>
              <option value="THREAT_INTEL">Threat Intelligence Report</option>
              <option value="SECURITY_ANALYTICS">Security Analytics & Attacks</option>
              <option value="ALERT_SUMMARY">Threat Alert Summary</option>
              <option value="INCIDENT_REPORT">Incident Lifecycle Audit</option>
            </select>
          </div>

          <div>
            <label className="text-slate-400 block mb-1">EXPORT FORMAT:</label>
            <select
              value={reportFormat}
              onChange={(e) => setReportFormat(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none"
            >
              <option value="JSON">JSON (Machine Readable)</option>
              <option value="CSV">CSV (Spreadsheet Data)</option>
              <option value="PDF">PDF (Executive Stream Format)</option>
            </select>
          </div>

          <div>
            <label className="text-slate-400 block mb-1">DATE RANGE:</label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none"
            >
              <option value="TODAY">Today</option>
              <option value="LAST_7_DAYS">Last 7 Days</option>
              <option value="LAST_30_DAYS">Last 30 Days</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={generating}
            className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-extrabold rounded-xl text-xs flex items-center space-x-2 shadow-glow-cyan"
          >
            <SparklesIcon className="w-4 h-4 stroke-[3]" />
            <span>{generating ? 'Generating Report...' : 'Generate Report'}</span>
          </button>
        </div>
      </form>

      {/* Generated Reports Table */}
      <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-4 font-mono text-xs">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-slate-800 pb-2">
          Generated Security Audit Reports Archive
        </h3>

        {loading ? (
          <Skeleton height="h-48" />
        ) : reports.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            No reports generated yet. Use the form above to export security reports.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase">
                  <th className="py-3 px-3">Report ID</th>
                  <th className="py-3 px-3">Title</th>
                  <th className="py-3 px-3">Format</th>
                  <th className="py-3 px-3">Date Range</th>
                  <th className="py-3 px-3">Size</th>
                  <th className="py-3 px-3">Generated At</th>
                  <th className="py-3 px-3 text-right">Download</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {reports.map((r) => (
                  <tr key={r.reportId || r._id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-3 font-bold text-cyan-300">{r.reportId}</td>
                    <td className="py-3 px-3 font-bold text-white max-w-[260px] truncate">{r.title}</td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        r.format === 'JSON' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' :
                        r.format === 'CSV' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' :
                        'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      }`}>
                        {r.format}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-300">{r.dateRange}</td>
                    <td className="py-3 px-3 text-slate-400">{r.fileSize || '1 KB'}</td>
                    <td className="py-3 px-3 text-slate-400">
                      {new Date(r.createdAt).toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <a
                        href={r.fileUrl}
                        download
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded-lg font-bold border border-slate-700 inline-flex items-center space-x-1.5"
                      >
                        <ArrowDownTrayIcon className="w-3.5 h-3.5" />
                        <span>Download</span>
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ThreatReportsPage;
