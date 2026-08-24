import { useEffect, useState } from 'react';
import api from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import HeaderNav from '../components/HeaderNav';

// Derive the backend root URL from the same env var used by api.js
const BACKEND_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1')
  .replace(/\/api\/v1\/?$/, '');

const reportUrl = (filename) => `${BACKEND_URL}/reports/${filename}`;

const formatPct = (val) => {
  if (val === undefined || val === null) return 'N/A';
  const num = typeof val === 'number' ? val : parseFloat(val);
  if (isNaN(num)) return String(val);
  if (num <= 1.0) {
    return `${(num * 100).toFixed(4)}%`;
  }
  return `${num.toFixed(4)}%`;
};

export default function ModelPerformance() {
  const [metrics, setMetrics] = useState(null);
  const [crossVal, setCrossVal] = useState(null);
  const [featureImportance, setFeatureImportance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [metricsRes, crossValRes, featuresRes] = await Promise.allSettled([
        api.get('/reports/metrics.json'),
        api.get('/reports/cross_validation.json'),
        api.get('/reports/feature-importance'),
      ]);

      if (metricsRes.status === 'fulfilled') {
        setMetrics(metricsRes.value.data);
      } else {
        setMetrics(null);
      }

      if (crossValRes.status === 'fulfilled') {
        setCrossVal(crossValRes.value.data);
      } else {
        setCrossVal(null);
      }

      if (featuresRes.status === 'fulfilled') {
        setFeatureImportance(featuresRes.value.data);
      } else {
        setFeatureImportance(null);
      }

      setError('');
    } catch (err) {
      setError(err?.response?.data?.detail || 'Unable to load model performance metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const topFeatures = featureImportance || [];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <HeaderNav
          title="Model Performance & Evaluation"
          subtitle="Detailed classification performance metrics, ROC/PR curves, confusion matrices, 5-fold cross validation, and feature importance rankings."
          onRefresh={loadData}
        />

        {error ? <div className="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">{error}</div> : null}

        {loading ? (
          <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-12 text-center text-slate-300">
            <LoadingSpinner label="Loading model evaluation metrics…" className="justify-center" />
          </div>
        ) : (
          <div className="space-y-8">
            {/* 1. Core Model Performance Metrics Cards */}
            <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6">
              <div className="mb-4">
                <h2 className="text-xl font-bold text-white">Classification Performance Metrics</h2>
                <p className="text-sm text-slate-400">Random Forest binary intrusion detection metrics from backend/reports/metrics.json</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                {[
                  { label: 'Model Accuracy', value: formatPct(metrics?.accuracy), color: 'text-blue-400' },
                  { label: 'Precision', value: formatPct(metrics?.precision), color: 'text-indigo-400' },
                  { label: 'Recall (Sensitivity)', value: formatPct(metrics?.recall), color: 'text-emerald-400' },
                  { label: 'F1 Score', value: formatPct(metrics?.f1_score), color: 'text-purple-400' },
                  { label: 'ROC-AUC', value: formatPct(metrics?.roc_auc), color: 'text-amber-400' },
                  { label: 'False Positive Rate', value: formatPct(metrics?.false_positive_rate), color: 'text-rose-400' },
                ].map((item) => (
                  <div key={item.label} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                    <p className="text-xs uppercase tracking-wider text-slate-400">{item.label}</p>
                    <p className={`mt-2 text-2xl font-bold ${item.color}`}>{item.value}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* 2. 5-Fold Stratified Cross-Validation Table */}
            <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6">
              <div className="mb-4">
                <h2 className="text-xl font-bold text-white">5-Fold Stratified Cross-Validation</h2>
                <p className="text-sm text-slate-400">Model generalization robustness across 5 stratified folds (backend/reports/cross_validation.json)</p>
              </div>
              <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/60">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="border-b border-slate-800 bg-slate-900/80 uppercase text-slate-400">
                    <tr>
                      <th className="p-3">Fold Index</th>
                      <th className="p-3">Accuracy</th>
                      <th className="p-3">Precision</th>
                      <th className="p-3">Recall</th>
                      <th className="p-3">F1 Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {[0, 1, 2, 3, 4].map((idx) => (
                      <tr key={idx} className="hover:bg-slate-900/40">
                        <td className="p-3 font-semibold text-slate-200">Fold {idx + 1}</td>
                        <td className="p-3 text-blue-400">{formatPct(crossVal?.per_fold_scores?.accuracy?.[idx])}</td>
                        <td className="p-3 text-indigo-400">{formatPct(crossVal?.per_fold_scores?.precision?.[idx])}</td>
                        <td className="p-3 text-emerald-400">{formatPct(crossVal?.per_fold_scores?.recall?.[idx])}</td>
                        <td className="p-3 text-purple-400">{formatPct(crossVal?.per_fold_scores?.f1_score?.[idx])}</td>
                      </tr>
                    ))}
                    <tr className="bg-blue-950/30 font-bold text-white">
                      <td className="p-3">Mean Score</td>
                      <td className="p-3 text-blue-400">{formatPct(crossVal?.mean_accuracy)}</td>
                      <td className="p-3 text-indigo-400">{formatPct(crossVal?.mean_precision)}</td>
                      <td className="p-3 text-emerald-400">{formatPct(crossVal?.mean_recall)}</td>
                      <td className="p-3 text-purple-400">{formatPct(crossVal?.mean_f1_score)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* 3. Confusion Matrix Section */}
            <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6">
              <div className="mb-4">
                <h2 className="text-xl font-bold text-white">Confusion Matrices</h2>
                <p className="text-sm text-slate-400">Standard sample counts and normalized True Positive / True Negative proportions</p>
              </div>
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                  <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-300">Standard Confusion Matrix (Sample Counts)</h3>
                  <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
                    <img
                      src={reportUrl('confusion_matrix_standard.png')}
                      onError={(e) => { e.target.onerror = null; e.target.src = reportUrl('confusion_matrix.png'); }}
                      alt="Standard Confusion Matrix"
                      className="w-full object-contain"
                    />
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                  <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-300">Normalized Confusion Matrix (Proportions)</h3>
                  <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
                    <img
                      src={reportUrl('confusion_matrix_normalized.png')}
                      alt="Normalized Confusion Matrix"
                      className="w-full object-contain"
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* 4. ROC Curve & Precision-Recall Curve Section */}
            <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6">
              <div className="mb-4">
                <h2 className="text-xl font-bold text-white">Evaluation Curves (ROC & Precision-Recall)</h2>
                <p className="text-sm text-slate-400">Diagnostic performance curves evaluating sensitivity vs specificity and precision vs recall</p>
              </div>
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                  <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-300">ROC Curve (AUC = 1.0000)</h3>
                  <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
                    <img
                      src={reportUrl('roc_curve.png')}
                      alt="ROC Curve"
                      className="w-full object-contain"
                    />
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                  <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-300">Precision-Recall Curve (AP = 0.9999)</h3>
                  <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950">
                    <img
                      src={reportUrl('precision_recall_curve.png')}
                      alt="Precision Recall Curve"
                      className="w-full object-contain"
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* 5. Feature Importance Section */}
            <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6">
              <div className="mb-4">
                <h2 className="text-xl font-bold text-white">Feature Importance Ranking</h2>
                <p className="text-sm text-slate-400">Top features driving Random Forest intrusion detection decisions</p>
              </div>
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                  <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-300">Feature Importance Decisions</h3>
                  <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
                    {topFeatures.length > 0 ? (
                      topFeatures.map((item) => (
                        <div key={item.rank} className="flex items-center justify-between rounded-xl border border-slate-800/80 bg-slate-900/80 p-2.5 text-xs">
                          <div className="flex items-center gap-3">
                            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-500/20 font-bold text-blue-400">{item.rank}</span>
                            <span className="font-medium text-slate-200">{item.feature || item.name}</span>
                          </div>
                          <span className="font-mono text-emerald-400">{(item.importance ?? item.score).toFixed(6)}</span>
                        </div>
                      ))
                    ) : (
                      <div className="text-center text-xs text-slate-500 py-6">No feature importance data available.</div>
                    )}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                  <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-300">Feature Importance Bar Chart Plot</h3>
                  <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
                    <img
                      src={reportUrl('feature_importance.png')}
                      alt="Feature Importance Chart"
                      className="w-full object-contain"
                    />
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
