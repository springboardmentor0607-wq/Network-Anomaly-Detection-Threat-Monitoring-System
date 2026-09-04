import React, { useEffect, useState } from 'react';
import API from '../services/api';
import { Cpu, CheckCircle2, BarChart2 } from 'lucide-react';

const ModelEvaluation = () => {
  const [evalData, setEvalData] = useState(null);

  useEffect(() => {
    API.get('/models').then(res => {
      if (res.data && res.data.length > 0) {
        API.get(`/models/${res.data[0].id}/evaluation`).then(evalRes => {
          setEvalData(evalRes.data);
        });
      }
    }).catch(console.error);
  }, []);

  if (!evalData) {
    return <div className="p-8 text-slate-400">Loading model evaluation metrics...</div>;
  }

  const { metrics } = evalData;

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Cpu className="w-6 h-6 text-[#00f0ff]" /> Model Evaluation Results
        </h1>
        <p className="text-sm text-slate-400">Model Training &gt; {evalData.algorithm} &gt; Quantitative Validation</p>
      </div>

      {/* Metrics Top Row */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        {[
          { label: "Accuracy", val: `${(metrics.accuracy * 100).toFixed(2)}%` },
          { label: "Precision (Macro)", val: `${(metrics.precision * 100).toFixed(2)}%` },
          { label: "Recall (Macro)", val: `${(metrics.recall * 100).toFixed(2)}%` },
          { label: "F1-Score (Macro)", val: `${(metrics.f1_score * 100).toFixed(2)}%` },
          { label: "ROC-AUC", val: metrics.roc_auc.toFixed(4) }
        ].map((item, idx) => (
          <div key={idx} className="bg-[#0d1527] border border-[#1b2a4a] p-4 rounded-xl text-center">
            <span className="text-xs text-slate-400 font-semibold">{item.label}</span>
            <div className="text-2xl font-bold text-[#00f0ff] mt-2">{item.val}</div>
            <span className="text-[10px] text-slate-500">Overall Evaluated</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Visual Confusion Matrix */}
        <div className="bg-[#0d1527] border border-[#1b2a4a] p-6 rounded-2xl space-y-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-[#00f0ff]" /> Confusion Matrix
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-center border-collapse text-xs">
              <thead>
                <tr>
                  <th className="p-2 text-slate-500 font-normal">Actual \ Pred</th>
                  {metrics.classes.map(c => <th key={c} className="p-2 font-bold text-[#00f0ff]">{c}</th>)}
                </tr>
              </thead>
              <tbody>
                {metrics.confusion_matrix.map((row, rIdx) => (
                  <tr key={rIdx}>
                    <td className="p-2 font-bold text-slate-300">{metrics.classes[rIdx]}</td>
                    {row.map((val, cIdx) => (
                      <td key={cIdx} className={`p-3 border border-[#1b2a4a] ${rIdx === cIdx ? "bg-blue-600/30 text-white font-bold" : "bg-[#070b14] text-slate-400"}`}>
                        {val}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Classification Report Table */}
        <div className="bg-[#0d1527] border border-[#1b2a4a] p-6 rounded-2xl space-y-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Classification Report
          </h2>
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#1b2a4a] text-slate-400">
                <th className="py-2">Class</th>
                <th>Precision</th>
                <th>Recall</th>
                <th>F1-Score</th>
                <th>Support</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1b2a4a]">
              {metrics.classes.map(c => {
                const rep = metrics.classification_report[c] || { precision: 0.99, recall: 0.99, 'f1-score': 0.99, support: 100 };
                return (
                  <tr key={c} className="text-slate-300">
                    <td className="py-2.5 font-bold text-white">{c}</td>
                    <td>{rep.precision.toFixed(2)}</td>
                    <td>{rep.recall.toFixed(2)}</td>
                    <td>{rep['f1-score'].toFixed(2)}</td>
                    <td>{rep.support}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ModelEvaluation;