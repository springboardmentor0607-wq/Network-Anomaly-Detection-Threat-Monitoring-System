import React from 'react';
import {
  Activity,
  Cpu,
  HardDrive,
  MemoryStick,
  Server,
  ShieldCheck,
  Wifi,
  Clock
} from 'lucide-react';

const SystemMonitoring = () => {
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
                System Monitoring
              </h1>

              <p className="text-sm text-slate-400">
                Real-time monitoring of NetShield AI system performance
              </p>
            </div>

          </div>
        </div>

        {/* System Status */}
        <div className="bg-[#0d1527] border border-[#1b2a4a] rounded-2xl p-6 mb-6">

          <div className="flex items-center justify-between">

            <div className="flex items-center gap-3">
              <ShieldCheck className="w-6 h-6 text-green-400" />

              <div>
                <h2 className="font-bold text-lg">
                  System Operational
                </h2>

                <p className="text-xs text-slate-400">
                  All critical services are running normally
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-green-400 text-sm">
              <span className="w-2 h-2 rounded-full bg-green-400" />
              Online
            </div>

          </div>

        </div>

        {/* Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">

          {/* CPU */}
          <div className="bg-[#0d1527] border border-[#1b2a4a] rounded-2xl p-5">

            <div className="flex justify-between items-start">
              <Cpu className="w-6 h-6 text-cyan-400" />

              <span className="text-xs text-green-400">
                Normal
              </span>
            </div>

            <p className="text-xs text-slate-400 uppercase mt-4">
              CPU Usage
            </p>

            <h2 className="text-2xl font-bold mt-2">
              42%
            </h2>

            <div className="w-full h-2 bg-[#070b14] rounded-full mt-4">
              <div
                className="h-2 bg-cyan-400 rounded-full"
                style={{ width: '42%' }}
              />
            </div>

          </div>

          {/* Memory */}
          <div className="bg-[#0d1527] border border-[#1b2a4a] rounded-2xl p-5">

            <div className="flex justify-between items-start">
              <MemoryStick className="w-6 h-6 text-cyan-400" />

              <span className="text-xs text-green-400">
                Normal
              </span>
            </div>

            <p className="text-xs text-slate-400 uppercase mt-4">
              Memory Usage
            </p>

            <h2 className="text-2xl font-bold mt-2">
              61%
            </h2>

            <div className="w-full h-2 bg-[#070b14] rounded-full mt-4">
              <div
                className="h-2 bg-cyan-400 rounded-full"
                style={{ width: '61%' }}
              />
            </div>

          </div>

          {/* Storage */}
          <div className="bg-[#0d1527] border border-[#1b2a4a] rounded-2xl p-5">

            <div className="flex justify-between items-start">
              <HardDrive className="w-6 h-6 text-cyan-400" />

              <span className="text-xs text-green-400">
                Healthy
              </span>
            </div>

            <p className="text-xs text-slate-400 uppercase mt-4">
              Storage
            </p>

            <h2 className="text-2xl font-bold mt-2">
              38%
            </h2>

            <div className="w-full h-2 bg-[#070b14] rounded-full mt-4">
              <div
                className="h-2 bg-cyan-400 rounded-full"
                style={{ width: '38%' }}
              />
            </div>

          </div>

          {/* Network */}
          <div className="bg-[#0d1527] border border-[#1b2a4a] rounded-2xl p-5">

            <div className="flex justify-between items-start">
              <Wifi className="w-6 h-6 text-cyan-400" />

              <span className="text-xs text-green-400">
                Stable
              </span>
            </div>

            <p className="text-xs text-slate-400 uppercase mt-4">
              Network Load
            </p>

            <h2 className="text-2xl font-bold mt-2">
              27%
            </h2>

            <div className="w-full h-2 bg-[#070b14] rounded-full mt-4">
              <div
                className="h-2 bg-cyan-400 rounded-full"
                style={{ width: '27%' }}
              />
            </div>

          </div>

        </div>

        {/* Services */}
        <div className="bg-[#0d1527] border border-[#1b2a4a] rounded-2xl p-6">

          <div className="flex items-center gap-3 mb-6">
            <Server className="text-cyan-400" />

            <div>
              <h2 className="text-xl font-bold">
                System Services
              </h2>

              <p className="text-sm text-slate-400">
                Current status of NetShield AI services
              </p>
            </div>
          </div>

          <div className="space-y-4">

            <div className="flex items-center justify-between bg-[#070b14] border border-[#1b2a4a] rounded-xl p-4">

              <div className="flex items-center gap-3">
                <Activity className="text-cyan-400" />

                <div>
                  <p className="font-semibold">
                    AI Detection Engine
                  </p>

                  <p className="text-xs text-slate-400">
                    Machine learning threat detection
                  </p>
                </div>
              </div>

              <span className="text-green-400 text-sm">
                Running
              </span>

            </div>

            <div className="flex items-center justify-between bg-[#070b14] border border-[#1b2a4a] rounded-xl p-4">

              <div className="flex items-center gap-3">
                <Server className="text-cyan-400" />

                <div>
                  <p className="font-semibold">
                    API Server
                  </p>

                  <p className="text-xs text-slate-400">
                    Backend API services
                  </p>
                </div>
              </div>

              <span className="text-green-400 text-sm">
                Running
              </span>

            </div>

            <div className="flex items-center justify-between bg-[#070b14] border border-[#1b2a4a] rounded-xl p-4">

              <div className="flex items-center gap-3">
                <ShieldCheck className="text-green-400" />

                <div>
                  <p className="font-semibold">
                    Security Monitor
                  </p>

                  <p className="text-xs text-slate-400">
                    Threat monitoring service
                  </p>
                </div>
              </div>

              <span className="text-green-400 text-sm">
                Active
              </span>

            </div>

            <div className="flex items-center justify-between bg-[#070b14] border border-[#1b2a4a] rounded-xl p-4">

              <div className="flex items-center gap-3">
                <Clock className="text-cyan-400" />

                <div>
                  <p className="font-semibold">
                    Monitoring Uptime
                  </p>

                  <p className="text-xs text-slate-400">
                    Continuous system monitoring
                  </p>
                </div>
              </div>

              <span className="text-cyan-400 text-sm">
                99.9%
              </span>

            </div>

          </div>

        </div>

      </div>
    </div>
  );
};

export default SystemMonitoring;