import { useEffect, useState } from 'react';
import api from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import HeaderNav from '../components/HeaderNav';

export default function Reports() {
  const [threatAnalysis, setThreatAnalysis] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [crossVal, setCrossVal] = useState(null);
  const [modelSummary, setModelSummary] = useState('');
  const [activeTab, setActiveTab] = useState('threat_analysis');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadReports = async () => {
    setLoading(true);
    try {
      const [threatRes, metricsRes, crossValRes, summaryRes] = await Promise.allSettled([
        api.get('/reports/threat_analysis.json'),
        api.get('/reports/metrics.json'),
        api.get('/reports/cross_validation.json'),
        api.get('/reports/model_summary.md'),
      ]);

      if (threatRes.status === 'fulfilled') {
        setThreatAnalysis(threatRes.value.data);
      } else {
        setThreatAnalysis(null);
      }

      if (metricsRes.status === 'fulfilled') {
        setMetrics(metricsRes.value.data);
      }

      if (crossValRes.status === 'fulfilled') {
        setCrossVal(crossValRes.value.data);
      }

      if (summaryRes.status === 'fulfilled') {
        setModelSummary(typeof summaryRes.value.data === 'string' ? summaryRes.value.data : JSON.stringify(summaryRes.value.data, null, 2));
      }

      setError('');
    } catch (err) {
      setError(err?.response?.data?.detail || 'Unable to load report artifacts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const downloadFile = (filename, content, mimeType) => {
    const blob = new Blob([typeof content === 'object' ? JSON.stringify(content, null, 2) : content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const downloadBackendBlob = async (endpoint, defaultFilename) => {
    try {
      const response = await api.get(endpoint, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', defaultFilename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(`Failed to download ${defaultFilename}:`, err);
      alert(`Error downloading ${defaultFilename}. Please try again.`);
    }
  };

  const reportDownloads = [
    {
      name: 'Executive Threat Report (PDF)',
      filename: 'NetShield_Threat_Report.pdf',
      action: () => downloadBackendBlob('/reports/pdf', 'NetShield_Threat_Report.pdf'),
      btnColor: 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/30 font-bold',
    },
    {
      name: 'Threat Intelligence Data (CSV)',
      filename: 'NetShield_Threat_Report.csv',
      action: () => downloadBackendBlob('/reports/csv', 'NetShield_Threat_Report.csv'),
      btnColor: 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30 font-bold',
    },
    {
      name: 'Threat Analysis Report (JSON)',
      filename: 'threat_analysis.json',
      action: () => downloadFile('threat_analysis.json', threatAnalysis, 'application/json'),
      btnColor: 'bg-blue-600 hover:bg-blue-500',
    },
    {
      name: 'Evaluation Metrics (JSON)',
      filename: 'metrics.json',
      action: () => downloadFile('metrics.json', metrics, 'application/json'),
      btnColor: 'bg-indigo-600 hover:bg-indigo-500',
    },
    {
      name: 'Cross Validation Report (JSON)',
      filename: 'cross_validation.json',
      action: () => downloadFile('cross_validation.json', crossVal, 'application/json'),
      btnColor: 'bg-purple-600 hover:bg-purple-500',
    },
    {
      name: 'Model Summary Report (Markdown)',
      filename: 'model_summary.md',
      action: () => downloadFile('model_summary.md', modelSummary, 'text/markdown'),
      btnColor: 'bg-slate-700 hover:bg-slate-600',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <HeaderNav
          title="Threat Reports & Model Artifacts"
          subtitle="Access automated threat analysis reports, model metrics, cross validation records, and downloadable artifacts."
          onRefresh={loadReports}
        />

        {error ? <div className="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">{error}</div> : null}

        {loading ? (
          <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-12 text-center text-slate-300">
            <LoadingSpinner label="Loading report artifacts…" className="justify-center" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Download Report Buttons Grid */}
            <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 shadow-xl">
              <div className="mb-4">
                <h2 className="text-xl font-bold text-white">Download Automated Reports</h2>
                <p className="text-sm text-slate-400">Export generated report artifacts directly to your local workstation</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {reportDownloads.map((item) => (
                  <button
                    key={item.filename}
                    type="button"
                    onClick={item.action}
                    className={`flex items-center justify-between rounded-2xl p-4 text-xs font-semibold text-white shadow-lg transition ${item.btnColor}`}
                  >
                    <span>{item.name}</span>
                    <span className="text-base">📥</span>
                  </button>
                ))}
              </div>
            </section>

            {/* Interactive Report Viewers Tabs */}
            <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div>
                  <h2 className="text-xl font-bold text-white">Report Artifact Viewer</h2>
                  <p className="text-sm text-slate-400">Inspect live content of backend evaluation reports</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: 'threat_analysis', label: 'Threat Analysis' },
                    { id: 'metrics', label: 'Metrics' },
                    { id: 'cross_validation', label: 'Cross Validation' },
                    { id: 'model_summary', label: 'Model Summary' },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition ${
                        activeTab === tab.id
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                          : 'border border-slate-800 bg-slate-950 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tab Content Display */}
              <div className="mt-4">
                {activeTab === 'threat_analysis' && (
                  <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-5">
                    <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-blue-400">Threat Analysis Report (`threat_analysis.json`)</h3>
                    <pre className="max-h-[500px] overflow-auto rounded-xl border border-slate-800 bg-slate-900 p-4 font-mono text-xs text-slate-200">
                      {JSON.stringify(threatAnalysis, null, 2)}
                    </pre>
                  </div>
                )}

                {activeTab === 'metrics' && (
                  <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-5">
                    <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-indigo-400">Evaluation Metrics (`metrics.json`)</h3>
                    <pre className="max-h-[500px] overflow-auto rounded-xl border border-slate-800 bg-slate-900 p-4 font-mono text-xs text-slate-200">
                      {JSON.stringify(metrics, null, 2)}
                    </pre>
                  </div>
                )}

                {activeTab === 'cross_validation' && (
                  <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-5">
                    <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-purple-400">5-Fold Cross Validation (`cross_validation.json`)</h3>
                    <pre className="max-h-[500px] overflow-auto rounded-xl border border-slate-800 bg-slate-900 p-4 font-mono text-xs text-slate-200">
                      {JSON.stringify(crossVal, null, 2)}
                    </pre>
                  </div>
                )}

                {activeTab === 'model_summary' && (
                  <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-5">
                    <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-emerald-400">Model Summary Documentation (`model_summary.md`)</h3>
                    <pre className="max-h-[500px] overflow-auto rounded-xl border border-slate-800 bg-slate-900 p-4 font-mono text-xs text-slate-200 whitespace-pre-wrap">
                      {modelSummary || '# NetShield AI - Model Summary\nLoading documentation...'}
                    </pre>
                  </div>
                )}
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
