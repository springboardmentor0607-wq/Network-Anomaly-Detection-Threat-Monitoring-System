import React, { useState, useEffect } from 'react';
import { Play, Pause, Trash2, Radio, Search, Filter, ShieldAlert, Activity, RefreshCw } from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import {
  TrafficFlowRecord,
  INITIAL_MOCK_FLOWS,
  generateRandomFlow,
  PROTOCOL_OPTIONS,
} from '../../constants/mockTrafficData';

export const MonitoringPage: React.FC = () => {
  const [flows, setFlows] = useState<TrafficFlowRecord[]>(INITIAL_MOCK_FLOWS);
  const [isStreaming, setIsStreaming] = useState<boolean>(true);
  const [streamIntervalMs, setStreamIntervalMs] = useState<number>(2000);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedProtocol, setSelectedProtocol] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  // Simulated live traffic streaming effect
  useEffect(() => {
    if (!isStreaming) return;

    const interval = setInterval(() => {
      const newFlow = generateRandomFlow();
      setFlows((prevFlows) => [newFlow, ...prevFlows.slice(0, 99)]); // Maintain 100 flow buffer
    }, streamIntervalMs);

    return () => clearInterval(interval);
  }, [isStreaming, streamIntervalMs]);

  // Filter flows based on user search and dropdown selections
  const filteredFlows = flows.filter((flow) => {
    const matchesSearch =
      flow.source_ip.includes(searchQuery) ||
      flow.destination_ip.includes(searchQuery) ||
      flow.source_port.toString().includes(searchQuery) ||
      flow.destination_port.toString().includes(searchQuery);

    const matchesProtocol = selectedProtocol === 'ALL' || flow.protocol === selectedProtocol;
    const matchesStatus =
      selectedStatus === 'ALL' ||
      (selectedStatus === 'ANOMALOUS' && flow.status === 'anomalous') ||
      (selectedStatus === 'BENIGN' && flow.status === 'benign');

    return matchesSearch && matchesProtocol && matchesStatus;
  });

  const totalAnomalies = flows.filter((f) => f.status === 'anomalous').length;
  const avgRiskScore = flows.length > 0 ? Math.round(flows.reduce((acc, f) => acc + f.risk_score, 0) / flows.length) : 0;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header & Live Telemetry Control Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#1F2937] pb-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center space-x-2">
            <Radio className={`w-5 h-5 ${isStreaming ? 'text-cyan-400 animate-pulse' : 'text-gray-500'}`} />
            <span>Real-Time Live Traffic Monitor</span>
          </h2>
          <p className="text-xs text-gray-400">
            Simulated streaming telemetry pipeline feeding live inference models.
          </p>
        </div>

        {/* Control Toolbar */}
        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant={isStreaming ? 'danger' : 'primary'}
            size="sm"
            onClick={() => setIsStreaming(!isStreaming)}
            icon={isStreaming ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          >
            {isStreaming ? 'Pause Telemetry' : 'Resume Telemetry'}
          </Button>

          <div className="flex items-center space-x-2 bg-[#131C2E] border border-[#1F2937] px-3 py-1.5 rounded-lg text-xs">
            <span className="text-gray-400 font-medium">Speed:</span>
            <select
              value={streamIntervalMs}
              onChange={(e) => setStreamIntervalMs(Number(e.target.value))}
              className="bg-transparent text-cyan-400 font-bold focus:outline-none cursor-pointer"
            >
              <option value={1000} className="bg-[#111827]">1s (High Speed)</option>
              <option value={2000} className="bg-[#111827]">2s (Standard)</option>
              <option value={5000} className="bg-[#111827]">5s (Relaxed)</option>
            </select>
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => setFlows([])}
            icon={<Trash2 className="w-4 h-4 text-gray-400" />}
          >
            Clear Stream
          </Button>
        </div>
      </div>

      {/* Live Stream Telemetry KPI Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#111827] border border-[#1F2937] p-4 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400 uppercase font-semibold">Stream Status</p>
            <p className="text-lg font-bold text-white flex items-center space-x-2 mt-0.5">
              <span className={`w-2.5 h-2.5 rounded-full ${isStreaming ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`} />
              <span>{isStreaming ? 'STREAMING ACTIVE' : 'PAUSED'}</span>
            </p>
          </div>
          <Activity className="w-6 h-6 text-cyan-400" />
        </div>

        <div className="bg-[#111827] border border-[#1F2937] p-4 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400 uppercase font-semibold">Buffer Capacity</p>
            <p className="text-xl font-bold text-white mt-0.5">{flows.length} / 100 Flows</p>
          </div>
          <RefreshCw className="w-6 h-6 text-indigo-400" />
        </div>

        <div className="bg-[#111827] border border-[#1F2937] p-4 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400 uppercase font-semibold">Captured Anomalies</p>
            <p className="text-xl font-bold text-red-400 mt-0.5">{totalAnomalies} Detected</p>
          </div>
          <ShieldAlert className="w-6 h-6 text-red-400" />
        </div>

        <div className="bg-[#111827] border border-[#1F2937] p-4 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400 uppercase font-semibold">Avg Stream Risk</p>
            <p className="text-xl font-bold text-cyan-400 mt-0.5">{avgRiskScore} / 100</p>
          </div>
          <Activity className="w-6 h-6 text-cyan-400" />
        </div>
      </div>

      {/* Filter and Search Controls Toolbar */}
      <Card>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Source IP, Target IP, or Port..."
              className="w-full bg-[#131C2E] border border-[#1F2937] rounded-lg pl-9 pr-4 py-2 text-gray-100 placeholder-gray-500 focus:outline-none focus:border-cyan-500 transition"
            />
          </div>

          {/* Protocol & Status Dropdowns */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <Filter className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-gray-400 font-medium">Protocol:</span>
              <select
                value={selectedProtocol}
                onChange={(e) => setSelectedProtocol(e.target.value)}
                className="bg-[#131C2E] border border-[#1F2937] rounded-lg px-2.5 py-1.5 text-cyan-400 font-semibold focus:outline-none"
              >
                {PROTOCOL_OPTIONS.map((proto) => (
                  <option key={proto} value={proto} className="bg-[#111827]">{proto}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-gray-400 font-medium">Status:</span>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="bg-[#131C2E] border border-[#1F2937] rounded-lg px-2.5 py-1.5 text-cyan-400 font-semibold focus:outline-none"
              >
                <option value="ALL" className="bg-[#111827]">ALL FLOWS</option>
                <option value="ANOMALOUS" className="bg-[#111827]">ANOMALOUS ONLY</option>
                <option value="BENIGN" className="bg-[#111827]">BENIGN ONLY</option>
              </select>
            </div>
          </div>
        </div>
      </Card>

      {/* Streaming Traffic Table */}
      <Card title={`Live Telemetry Stream (${filteredFlows.length} Active Records)`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#131C2E] text-gray-400 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-3">Timestamp</th>
                <th className="p-3">Source IP : Port</th>
                <th className="p-3">Target IP : Port</th>
                <th className="p-3">Protocol</th>
                <th className="p-3">Packets / Bytes</th>
                <th className="p-3">Anomaly Score</th>
                <th className="p-3">Risk Score</th>
                <th className="p-3">Classification</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1F2937]">
              {filteredFlows.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-gray-500">
                    No streaming traffic matching the current filter parameters.
                  </td>
                </tr>
              ) : (
                filteredFlows.map((flow) => (
                  <tr
                    key={flow.id}
                    className={`transition ${
                      flow.status === 'anomalous'
                        ? 'bg-red-950/20 hover:bg-red-950/40'
                        : 'hover:bg-[#131C2E]/60'
                    }`}
                  >
                    <td className="p-3 font-mono text-gray-400">{new Date(flow.timestamp).toLocaleTimeString()}</td>
                    <td className="p-3 font-mono text-gray-200">{flow.source_ip} : <span className="text-gray-400">{flow.source_port}</span></td>
                    <td className="p-3 font-mono text-cyan-400 font-semibold">{flow.destination_ip} : <span className="text-gray-400">{flow.destination_port}</span></td>
                    <td className="p-3 font-bold text-gray-300">{flow.protocol}</td>
                    <td className="p-3 font-mono text-gray-400">{flow.packets.toLocaleString()} pkts / {(flow.bytes / 1024).toFixed(1)} KB</td>
                    <td className="p-3 font-mono font-bold text-amber-400">{(flow.anomaly_score * 100).toFixed(0)}%</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded font-bold text-xs ${
                          flow.risk_score >= 80
                            ? 'bg-purple-950 text-purple-400 border border-purple-500/30'
                            : flow.risk_score >= 60
                            ? 'bg-red-950 text-red-400 border border-red-500/30'
                            : flow.risk_score >= 30
                            ? 'bg-amber-950 text-amber-400 border border-amber-500/30'
                            : 'bg-emerald-950 text-emerald-400 border border-emerald-500/30'
                        }`}
                      >
                        {flow.risk_score}
                      </span>
                    </td>
                    <td className="p-3 font-semibold text-white">{flow.classification}</td>
                    <td className="p-3">
                      {flow.status === 'anomalous' ? (
                        <Badge variant="red" size="sm">ANOMALOUS</Badge>
                      ) : (
                        <Badge variant="emerald" size="sm">BENIGN</Badge>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
