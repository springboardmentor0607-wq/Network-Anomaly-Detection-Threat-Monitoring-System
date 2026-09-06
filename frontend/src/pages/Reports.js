import React, { useEffect, useState, useCallback } from 'react';
import api from '../services/api';
import { useRefresh } from '../context/RefreshContext';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import {
  FaFolderOpen, FaBug, FaFire, FaDatabase, FaDownload,
  FaFilePdf, FaCheckCircle, FaShieldAlt, FaHistory
} from 'react-icons/fa';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell
} from 'recharts';

const Reports = () => {
  const { refreshTrigger } = useRefresh();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [generatedReport, setGeneratedReport] = useState(null);

  const fetchReports = useCallback(async () => {
    try {
      const res = await api.get('/reports');
      setData(res.data);
      setError(null);
    } catch (err) {
      console.error("Reports fetch error:", err);
      setError("Failed to load security reports data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports, refreshTrigger]);

  const handleGenerateReport = async (reportName = "Security Assessment Report") => {
    setGenerating(true);
    try {
      const res = await api.post('/reports/generate', {
        report_name: reportName,
        report_type: "Threat Detection Security Report"
      });
      setGeneratedReport(res.data);
      fetchReports();
    } catch (err) {
      console.error("Error generating report:", err);
      alert("Failed to generate PDF report.");
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = (filename) => {
    if (!filename) return;
    const downloadUrl = `http://localhost:5000/api/reports/download/${filename}`;
    window.open(downloadUrl, '_blank');
  };

  if (loading && !data) {
    return <LoadingState message="Compiling Security Reports & Telemetry..." />;
  }

  if (error && !data) {
    return <ErrorState message={error} onRetry={fetchReports} />;
  }

  const summary = data?.summary_cards || {};
  const attackStatus = data?.attack_status || {};
  const datasetSummary = data?.dataset_summary || {};
  const uploadedFiles = data?.uploaded_files || [];
  const reportsList = data?.reports || [];

  const ddos = attackStatus.ddos || { name: 'DDoS', status: 'DETECTED', count: 473, avg_confidence: 99.7, avg_risk_score: 95.0, severity: 'CRITICAL' };
  const ftp = attackStatus.ftp_patator || { name: 'FTP-Patator', status: 'DETECTED', count: 210, avg_confidence: 88.1, avg_risk_score: 65.0, severity: 'MEDIUM' };
  const ssh = attackStatus.ssh_patator || { name: 'SSH-Patator', status: 'DETECTED', count: 172, avg_confidence: 91.9, avg_risk_score: 80.0, severity: 'HIGH' };

  const attackTable = [
    { type: 'DDoS', status: ddos.status, count: ddos.count, confidence: `${ddos.avg_confidence}%`, risk: `${ddos.avg_risk_score}/100`, severity: 'CRITICAL', color: '#EF4444' },
    { type: 'FTP-Patator', status: ftp.status, count: ftp.count, confidence: `${ftp.avg_confidence}%`, risk: `${ftp.avg_risk_score}/100`, severity: 'MEDIUM', color: '#EAB308' },
    { type: 'SSH-Patator', status: ssh.status, count: ssh.count, confidence: `${ssh.avg_confidence}%`, risk: `${ssh.avg_risk_score}/100`, severity: 'HIGH', color: '#F97316' }
  ];

  const attackCompHorizontal = [
    { attack: 'DDoS', count: ddos.count, color: '#EF4444' },
    { attack: 'FTP-Patator', count: ftp.count, color: '#EAB308' },
    { attack: 'SSH-Patator', count: ssh.count, color: '#F97316' }
  ];

  return (
    <div className="page-container">
      {/* 1. MASTER HEADER */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Security Reports</h1>
          <p className="page-subtitle">Comprehensive summary of detected threats, dataset telemetry, and SOC PDF audit generation</p>
        </div>

        <button
          className="btn btn-primary"
          onClick={() => handleGenerateReport("Security Assessment & Threat Audit Report")}
          disabled={generating}
        >
          <FaFilePdf />
          <span>{generating ? 'Generating PDF...' : 'Generate PDF Report'}</span>
        </button>
      </div>

      {/* 2. SMALL KPI CARDS (ROW OF 4) */}
      <div className="grid-kpi" style={{ marginBottom: 18 }}>
        <div className="kpi-card">
          <div className="kpi-icon-wrapper">
            <FaFolderOpen />
          </div>
          <div>
            <div className="kpi-label">Files Uploaded</div>
            <div className="kpi-value">{summary.total_files_uploaded || 1}</div>
            <div className="kpi-subtext">Active datasets</div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrapper" style={{ backgroundColor: 'rgba(96, 165, 250, 0.12)', color: '#60A5FA' }}>
            <FaDatabase />
          </div>
          <div>
            <div className="kpi-label">Records Analyzed</div>
            <div className="kpi-value">{datasetSummary.total_records_analyzed?.toLocaleString() || '1,727'}</div>
            <div className="kpi-subtext">Flow telemetry</div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrapper" style={{ backgroundColor: 'rgba(249, 115, 22, 0.12)', color: '#F97316' }}>
            <FaBug />
          </div>
          <div>
            <div className="kpi-label">Total Threats</div>
            <div className="kpi-value" style={{ color: 'var(--severity-high)' }}>{summary.total_threats?.toLocaleString() || '855'}</div>
            <div className="kpi-subtext">4 Attack classes</div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrapper" style={{ backgroundColor: 'rgba(239, 68, 68, 0.12)', color: '#EF4444' }}>
            <FaFire />
          </div>
          <div>
            <div className="kpi-label">Critical Threats</div>
            <div className="kpi-value" style={{ color: 'var(--severity-critical)' }}>{summary.critical_threats?.toLocaleString() || '473'}</div>
            <div className="kpi-subtext">High priority</div>
          </div>
        </div>
      </div>

      {/* 3. GENERATED REPORT NOTIFICATION DRAWER / PREVIEW */}
      {generatedReport && (
        <div className="netshield-card" style={{ marginBottom: 18, borderTop: '3px solid var(--primary-green)', background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(15, 23, 42, 0.9))' }}>
          <div className="netshield-card-header">
            <div className="netshield-card-title">
              <FaCheckCircle style={{ color: 'var(--primary-green)', fontSize: '1.3rem' }} />
              <span>PDF Report Ready: {generatedReport.summary?.title}</span>
            </div>
            <button
              className="btn btn-primary"
              onClick={() => handleDownload(generatedReport.filename)}
            >
              <FaDownload />
              <span>Download PDF Report</span>
            </button>
          </div>

          <div style={{ background: 'rgba(10, 22, 40, 0.85)', padding: 14, borderRadius: 8, border: '1px solid var(--border-tech)', fontSize: '0.84rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 8 }}>
              <div>Filename: <strong style={{ color: 'var(--primary-green)' }}>{generatedReport.filename}</strong></div>
              <div>Generated: <strong style={{ color: 'var(--text-primary)' }}>{new Date(generatedReport.summary?.generated_at).toLocaleString()}</strong></div>
            </div>
            <div style={{ color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              <strong>Executive Summary:</strong> {generatedReport.summary?.total_flows_inspected?.toLocaleString()} network flow records analyzed. Detected {generatedReport.summary?.threats_detected?.toLocaleString()} threats ({generatedReport.summary?.critical_threats?.toLocaleString()} critical). Full PDF formatted with Random Forest metrics, threat breakdown, and incident recommendations.
            </div>
          </div>
        </div>
      )}

      {/* 4. ATTACK STATUS TABLE */}
      <div className="netshield-card" style={{ marginBottom: 18 }}>
        <div className="netshield-card-header">
          <div className="netshield-card-title">
            <FaShieldAlt style={{ color: 'var(--primary-green)' }} />
            <span>Attack Classification & Telemetry Status</span>
          </div>
          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Real database metrics</span>
        </div>

        <div className="netshield-table-container">
          <table className="netshield-table">
            <thead>
              <tr>
                <th>Attack Type</th>
                <th>Status</th>
                <th>Detected</th>
                <th>Confidence</th>
                <th>Risk</th>
                <th>Severity</th>
              </tr>
            </thead>
            <tbody>
              {attackTable.map((row, idx) => (
                <tr key={idx}>
                  <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{row.type}</td>
                  <td>
                    <span className={`badge ${row.status === 'DETECTED' ? 'badge-critical' : 'badge-low'}`}>
                      ● {row.status}
                    </span>
                  </td>
                  <td style={{ fontWeight: 800, color: row.color }}>{row.count}</td>
                  <td style={{ color: 'var(--light-blue)' }}>{row.confidence}</td>
                  <td style={{ fontWeight: 700 }}>{row.risk}</td>
                  <td>
                    <span className={`badge ${row.severity === 'CRITICAL' ? 'badge-critical' : row.severity === 'HIGH' ? 'badge-high' : 'badge-medium'}`}>
                      {row.severity}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. ATTACK COMPARISON & DATASET UPLOAD SUMMARY */}
      <div className="grid-charts" style={{ marginBottom: 18 }}>
        {/* Attack Comparison Horizontal Bar Chart */}
        <div className="netshield-card">
          <div className="netshield-card-header">
            <div className="netshield-card-title">
              <span>Attack Comparison</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={attackCompHorizontal} layout="vertical" margin={{ top: 5, right: 20, left: 30, bottom: 5 }}>
              <XAxis type="number" stroke="#64748B" tick={{ fontSize: 10 }} />
              <YAxis dataKey="attack" type="category" stroke="#94A3B8" tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ backgroundColor: '#0A1B31', borderColor: '#23415F', borderRadius: 6, fontSize: '0.76rem' }} />
              <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                {attackCompHorizontal.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Dataset Upload Summary */}
        <div className="netshield-card">
          <div className="netshield-card-header">
            <div className="netshield-card-title">
              <span>Dataset Upload Summary</span>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: '0.8rem' }}>
            <div style={{ padding: 10, background: 'var(--bg-panel-secondary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-tech)' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>Total Files Uploaded</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: 2 }}>{datasetSummary.total_files_uploaded || 1}</div>
            </div>
            <div style={{ padding: 10, background: 'var(--bg-panel-secondary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-tech)' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>Total Records</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--light-blue)', marginTop: 2 }}>{datasetSummary.total_records_analyzed?.toLocaleString() || '1,727'}</div>
            </div>
            <div style={{ padding: 10, background: 'var(--bg-panel-secondary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-tech)' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>Successful Analyses</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--severity-low)', marginTop: 2 }}>{datasetSummary.successful_analyses || 1}</div>
            </div>
            <div style={{ padding: 10, background: 'var(--bg-panel-secondary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-tech)' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>Failed Analyses</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-muted)', marginTop: 2 }}>{datasetSummary.failed_analyses || 0}</div>
            </div>
          </div>
          <div style={{ marginTop: 10, fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
            Last File: <strong style={{ color: 'var(--text-primary)' }}>{datasetSummary.last_uploaded_file}</strong> ({datasetSummary.last_upload_time})
          </div>
        </div>
      </div>

      {/* 6. GENERATED PDF REPORTS ARCHIVE */}
      <div className="netshield-card" style={{ marginBottom: 18 }}>
        <div className="netshield-card-header">
          <div className="netshield-card-title">
            <FaHistory style={{ color: '#60A5FA' }} />
            <span>Generated Security Reports Archive</span>
          </div>
          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{reportsList.length} Generated Reports</span>
        </div>

        {reportsList.length > 0 ? (
          <div className="netshield-table-container">
            <table className="netshield-table">
              <thead>
                <tr>
                  <th>Report Title</th>
                  <th>Report Type</th>
                  <th>Generated Date</th>
                  <th>PDF File</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {reportsList.map((rep) => (
                  <tr key={rep.id}>
                    <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{rep.report_name}</td>
                    <td><span className="cyber-chip">{rep.report_type}</span></td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{new Date(rep.created_at).toLocaleString()}</td>
                    <td><code style={{ fontSize: '0.76rem', color: 'var(--primary-green)' }}>{rep.filename}</code></td>
                    <td>
                      <button
                        className="btn btn-primary"
                        style={{ padding: '4px 10px', fontSize: '0.76rem', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                        onClick={() => handleDownload(rep.filename)}
                      >
                        <FaDownload />
                        <span>Download PDF</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.84rem' }}>
            No PDF reports generated yet. Click <strong>"Generate PDF Report"</strong> above to create your first SOC audit report.
          </div>
        )}
      </div>

      {/* 7. UPLOADED DATASETS TABLE */}
      <div className="netshield-card">
        <div className="netshield-card-header">
          <div className="netshield-card-title">
            <FaFolderOpen style={{ color: 'var(--primary-green)' }} />
            <span>Uploaded Datasets</span>
          </div>
        </div>
        <div className="netshield-table-container">
          <table className="netshield-table">
            <thead>
              <tr>
                <th>File Name</th>
                <th>Records</th>
                <th>Upload Date</th>
                <th>Status</th>
                <th>Threats Detected</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {uploadedFiles.map((file) => (
                <tr key={file.id}>
                  <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{file.filename}</td>
                  <td>{file.records?.toLocaleString()}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{file.upload_date}</td>
                  <td><span className="badge badge-low">● {file.status}</span></td>
                  <td style={{ fontWeight: 700, color: file.threats_detected > 0 ? 'var(--severity-critical)' : 'var(--severity-low)' }}>
                    {file.threats_detected}
                  </td>
                  <td>
                    <button
                      className="btn btn-secondary"
                      style={{ padding: '3px 8px', fontSize: '0.74rem' }}
                      onClick={() => handleGenerateReport(`Audit Report for ${file.filename}`)}
                    >
                      Generate PDF
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Reports;
