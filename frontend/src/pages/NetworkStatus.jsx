import React from 'react';
import {
  Activity,
  Wifi,
  Server,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';

const NetworkStatus = () => {
  return (
    <div className="min-h-screen bg-[#070b14] text-white p-6">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3">

            <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30">
              <Activity className="w-7 h-7 text-cyan-400" />
            </div>

            <div>
              <h1 className="text-3xl font-bold">
                Network Status
              </h1>

              <p className="text-sm text-slate-400">
                Real-time network infrastructure monitoring
              </p>
            </div>

          </div>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">

          <div className="bg-[#0d1527] border border-[#1b2a4a] rounded-2xl p-5">
            <Wifi className="text-cyan-400 mb-3" />

            <p className="text-xs text-slate-400 uppercase">
              Network Health
            </p>

            <h2 className="text-2xl font-bold mt-2">
              97.8%
            </h2>

            <p className="text-xs text-green-400 mt-2">
              Healthy
            </p>
          </div>

          <div className="bg-[#0d1527] border border-[#1b2a4a] rounded-2xl p-5">
            <Server className="text-cyan-400 mb-3" />

            <p className="text-xs text-slate-400 uppercase">
              Active Servers
            </p>

            <h2 className="text-2xl font-bold mt-2">
              24
            </h2>

            <p className="text-xs text-green-400 mt-2">
              All operational
            </p>
          </div>

          <div className="bg-[#0d1527] border border-[#1b2a4a] rounded-2xl p-5">
            <ShieldCheck className="text-green-400 mb-3" />

            <p className="text-xs text-slate-400 uppercase">
              Protected Nodes
            </p>

            <h2 className="text-2xl font-bold mt-2">
              184
            </h2>

            <p className="text-xs text-green-400 mt-2">
              Protected
            </p>
          </div>

          <div className="bg-[#0d1527] border border-[#1b2a4a] rounded-2xl p-5">
            <AlertTriangle className="text-yellow-400 mb-3" />

            <p className="text-xs text-slate-400 uppercase">
              Active Alerts
            </p>

            <h2 className="text-2xl font-bold mt-2">
              3
            </h2>

            <p className="text-xs text-yellow-400 mt-2">
              Requires monitoring
            </p>
          </div>

        </div>

        {/* Network Overview */}
        <div className="bg-[#0d1527] border border-[#1b2a4a] rounded-2xl p-6">

          <div className="flex items-center justify-between mb-6">

            <div>
              <h2 className="text-xl font-bold">
                Network Infrastructure
              </h2>

              <p className="text-sm text-slate-400 mt-1">
                Current status of monitored network components
              </p>
            </div>

            <div className="flex items-center gap-2 text-green-400 text-sm">
              <span className="w-2 h-2 rounded-full bg-green-400"></span>
              System Online
            </div>

          </div>

          <div className="space-y-4">

            <div className="flex items-center justify-between bg-[#070b14] border border-[#1b2a4a] rounded-xl p-4">
              <div className="flex items-center gap-3">
                <Wifi className="text-cyan-400" />

                <div>
                  <p className="font-semibold">
                    Core Network
                  </p>

                  <p className="text-xs text-slate-400">
                    Primary network infrastructure
                  </p>
                </div>
              </div>

              <span className="text-green-400 text-sm">
                Operational
              </span>
            </div>

            <div className="flex items-center justify-between bg-[#070b14] border border-[#1b2a4a] rounded-xl p-4">
              <div className="flex items-center gap-3">
                <Server className="text-cyan-400" />

                <div>
                  <p className="font-semibold">
                    Application Servers
                  </p>

                  <p className="text-xs text-slate-400">
                    Backend and application services
                  </p>
                </div>
              </div>

              <span className="text-green-400 text-sm">
                Operational
              </span>
            </div>

            <div className="flex items-center justify-between bg-[#070b14] border border-[#1b2a4a] rounded-xl p-4">
              <div className="flex items-center gap-3">
                <ShieldCheck className="text-green-400" />

                <div>
                  <p className="font-semibold">
                    Security Layer
                  </p>

                  <p className="text-xs text-slate-400">
                    AI threat detection and protection
                  </p>
                </div>
              </div>

              <span className="text-green-400 text-sm">
                Active
              </span>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};

export default NetworkStatus;