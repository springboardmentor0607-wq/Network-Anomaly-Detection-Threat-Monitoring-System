import React from 'react';

const Analytics = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-[18px] font-semibold text-[#F2F2F0]">Dataset Analytics & Reports</h2>
          <p className="text-[13px] text-[#9A9A97]">Analyze training data, evaluate models, and generate compliance reports</p>
        </div>
        <button className="px-4 py-2 bg-white text-[#0A0A0B] text-[13px] font-medium rounded-lg transition-colors">
          Generate PDF Report
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Dataset Loader Module */}
        <div className="bg-[#0A0A0B]/60 backdrop-blur-sm border border-white/[0.07] rounded-xl p-6 h-64 flex flex-col">
          <h2 className="text-[15px] font-medium mb-4">Active Training Datasets</h2>
          <div className="space-y-3 flex-1">
            <div className="flex items-center justify-between p-3 bg-white/[0.02] border border-white/[0.04] rounded-lg">
              <div>
                <div className="text-[13px] font-medium text-[#F2F2F0]">CICIDS2017</div>
                <div className="text-[11px] text-[#9A9A97]">Intrusion Detection Evaluation Dataset</div>
              </div>
              <span className="px-2 py-1 bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 text-[10px] rounded">Pending Load</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-white/[0.02] border border-white/[0.04] rounded-lg">
              <div>
                <div className="text-[13px] font-medium text-[#F2F2F0]">UNSW-NB15</div>
                <div className="text-[11px] text-[#9A9A97]">Network Intrusion Dataset</div>
              </div>
              <span className="px-2 py-1 bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 text-[10px] rounded">Pending Load</span>
            </div>
          </div>
        </div>

        {/* Analytics Placeholder */}
        <div className="bg-[#0A0A0B]/60 backdrop-blur-sm border border-white/[0.07] rounded-xl p-6 h-64 flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-[15px] font-medium">Model Evaluation Metrics</h2>
          </div>
          <div className="flex-1 border border-white/[0.03] border-dashed rounded-lg flex flex-col items-center justify-center text-[#9A9A97]">
            <span className="text-[13px] mb-2">[ F1-Score & Confusion Matrix ]</span>
            <span className="text-[11px] opacity-60">Requires datasets to be loaded and processed via FastAPI</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;