import React from 'react';
import { Brain, Activity, ShieldCheck, Zap } from 'lucide-react';

const AIManagement = () => {
  return (
    <div className="min-h-screen bg-[#070b14] text-white p-6">

      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30">
              <Brain className="w-7 h-7 text-cyan-400" />
            </div>

            <div>
              <h1 className="text-3xl font-bold">
                AI Management
              </h1>

              <p className="text-slate-400 text-sm">
                Manage and monitor NetShield AI security intelligence
              </p>
            </div>
          </div>
        </div>

        {/* AI Status */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">

          <div className="bg-[#0d1527] border border-[#1b2a4a] rounded-2xl p-5">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs text-slate-400 uppercase">
                  AI Status
                </p>

                <h2 className="text-xl font-bold mt-2 text-cyan-400">
                  Active
                </h2>
              </div>

              <Activity className="text-cyan-400" />
            </div>
          </div>

          <div className="bg-[#0d1527] border border-[#1b2a4a] rounded-2xl p-5">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs text-slate-400 uppercase">
                  Detection Engine
                </p>

                <h2 className="text-xl font-bold mt-2">
                  Random Forest
                </h2>
              </div>

              <Brain className="text-cyan-400" />
            </div>
          </div>

          <div className="bg-[#0d1527] border border-[#1b2a4a] rounded-2xl p-5">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs text-slate-400 uppercase">
                  Model Accuracy
                </p>

                <h2 className="text-xl font-bold mt-2 text-green-400">
                  98.42%
                </h2>
              </div>

              <ShieldCheck className="text-green-400" />
            </div>
          </div>

        </div>

        {/* AI Engine */}
        <div className="bg-[#0d1527] border border-[#1b2a4a] rounded-2xl p-6">

          <div className="flex items-center gap-3 mb-6">
            <Zap className="text-cyan-400" />

            <div>
              <h2 className="text-xl font-bold">
                AI Defense Engine
              </h2>

              <p className="text-sm text-slate-400">
                Intelligent network threat analysis
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            <div className="bg-[#070b14] border border-[#1b2a4a] rounded-xl p-5">
              <p className="text-sm text-slate-400">
                Anomaly Detection
              </p>

              <p className="text-lg font-semibold text-cyan-400 mt-2">
                Enabled
              </p>
            </div>

            <div className="bg-[#070b14] border border-[#1b2a4a] rounded-xl p-5">
              <p className="text-sm text-slate-400">
                Real-time Monitoring
              </p>

              <p className="text-lg font-semibold text-green-400 mt-2">
                Running
              </p>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
};

export default AIManagement;