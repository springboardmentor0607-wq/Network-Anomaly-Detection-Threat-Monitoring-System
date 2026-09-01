import React, { useState } from 'react';
import { Download, Search, Filter, Activity, Server, Network, ArrowDownUp, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, BarChart, Bar, Cell } from 'recharts';
import { INITIAL_MOCK_FLOWS, TrafficFlowRecord, PROTOCOL_OPTIONS } from '../../constants/mockTrafficData';

export const TrafficPage: React.FC = () => {
  const [flows, setFlows] = useState<TrafficFlowRecord[]>(INITIAL_MOCK_FLOWS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProtocol, setSelectedProtocol] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  // Filter flows
  const filteredFlows = flows.filter((flow) => {
    const matchesSearch =
      flow.source_ip.includes(searchQuery) ||
      flow.destination_ip.includes(searchQuery) ||
      flow.source_port.toString().includes(searchQuery) ||
      flow.destination_port.toString().includes(searchQuery);

    const matchesProtocol = selectedProtocol === 'ALL' || flow.protocol === selectedProtocol;
    return matchesSearch && matchesProtocol;
  });

  // Pagination calculation
  const totalPages = Math.ceil(filteredFlows.length / pageSize) || 1;
  const paginatedFlows = filteredFlows.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const exportToCSV = () => {
    const headers = ['ID,Timestamp,SourceIP,DestinationIP,Protocol,SourcePort,DestinationPort,Packets,Bytes,AnomalyScore,RiskScore,Status\n'];
    const rows = filteredFlows.map(
      (f) => `${f.id},${f.timestamp},${f.source_ip},${f.destination_ip},${f.protocol},${f.source_port},${f.destination_port},${f.packets},${f.bytes},${f.anomaly_score},${f.risk_score},${f.status}`
    );
    const blob = new Blob([headers.concat(rows.join('\n')).join('')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `netshield_traffic_export_${Date.now()}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1F2937] pb-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center space-x-2">
            <Activity className="w-5 h-5 text-cyan-400" />
            <span>Traffic Flow Telemetry Analytics</span>
          </h2>
          <p className="text-xs text-gray-400">Deep inspection of network bandwidth, ports, and protocol distributions.</p>
        </div>
        <Button variant="primary" size="sm" onClick={exportToCSV} icon={<Download className="w-4 h-4" />}>
          Export CSV Telemetry
        </Button>
      </div>

      {/* Traffic Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#111827] border border-[#1F2937] p-4 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400 uppercase font-semibold">Total Telemetry Volume</p>
            <p className="text-xl font-bold text-white mt-0.5">4.82 GB</p>
          </div>
          <Network className="w-6 h-6 text-cyan-400" />
        </div>
        <div className="bg-[#111827] border border-[#1F2937] p-4 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400 uppercase font-semibold">Average Flow Rate</p>
            <p className="text-xl font-bold text-emerald-400 mt-0.5">1,240 flows/sec</p>
          </div>
          <ArrowDownUp className="w-6 h-6 text-emerald-400" />
        </div>
        <div className="bg-[#111827] border border-[#1F2937] p-4 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400 uppercase font-semibold">Top Target Port</p>
            <p className="text-xl font-bold text-indigo-400 mt-0.5">Port 443 (HTTPS)</p>
          </div>
          <Server className="w-6 h-6 text-indigo-400" />
        </div>
        <div className="bg-[#111827] border border-[#1F2937] p-4 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400 uppercase font-semibold">Active Unique IPs</p>
            <p className="text-xl font-bold text-amber-400 mt-0.5">1,842 Endpoints</p>
          </div>
          <Activity className="w-6 h-6 text-amber-400" />
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search flows by IP address or Port..."
              className="w-full bg-[#131C2E] border border-[#1F2937] rounded-lg pl-9 pr-4 py-2 text-gray-100 placeholder-gray-500 focus:outline-none focus:border-cyan-500 transition"
            />
          </div>

          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <Filter className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-gray-400 font-medium">Protocol Filter:</span>
              <select
                value={selectedProtocol}
                onChange={(e) => setSelectedProtocol(e.target.value)}
                className="bg-[#131C2E] border border-[#1F2937] rounded-lg px-2.5 py-1.5 text-cyan-400 font-semibold focus:outline-none"
              >
                {PROTOCOL_OPTIONS.map((p) => (
                  <option key={p} value={p} className="bg-[#111827]">{p}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </Card>

      {/* Traffic Table with Pagination Controls */}
      <Card title={`Historical Telemetry Flows (${filteredFlows.length} Total Matches)`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#131C2E] text-gray-400 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-3">Flow ID</th>
                <th className="p-3">Timestamp</th>
                <th className="p-3">Source IP : Port</th>
                <th className="p-3">Destination IP : Port</th>
                <th className="p-3">Protocol</th>
                <th className="p-3">Packets / Bytes</th>
                <th className="p-3">Duration</th>
                <th className="p-3">Risk Score</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1F2937]">
              {paginatedFlows.map((flow) => (
                <tr key={flow.id} className="hover:bg-[#131C2E]/60 transition">
                  <td className="p-3 font-mono font-bold text-cyan-400">{flow.id}</td>
                  <td className="p-3 font-mono text-gray-400">{new Date(flow.timestamp).toLocaleTimeString()}</td>
                  <td className="p-3 font-mono text-gray-200">{flow.source_ip} : {flow.source_port}</td>
                  <td className="p-3 font-mono text-cyan-400">{flow.destination_ip} : {flow.destination_port}</td>
                  <td className="p-3 font-bold text-gray-300">{flow.protocol}</td>
                  <td className="p-3 font-mono text-gray-400">{flow.packets} pkts / {(flow.bytes / 1024).toFixed(1)} KB</td>
                  <td className="p-3 font-mono text-gray-400">{flow.duration}s</td>
                  <td className="p-3 font-bold text-amber-400">{flow.risk_score}</td>
                  <td className="p-3">
                    {flow.status === 'anomalous' ? (
                      <Badge variant="red" size="sm">ANOMALOUS</Badge>
                    ) : (
                      <Badge variant="emerald" size="sm">BENIGN</Badge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="flex items-center justify-between border-t border-[#1F2937] pt-4 mt-4 text-xs">
          <div className="flex items-center space-x-2 text-gray-400">
            <span>Rows per page:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-[#131C2E] border border-[#1F2937] rounded px-2 py-1 text-cyan-400 font-semibold focus:outline-none"
            >
              <option value={5} className="bg-[#111827]">5</option>
              <option value={10} className="bg-[#111827]">10</option>
              <option value={25} className="bg-[#111827]">25</option>
            </select>
          </div>

          <div className="flex items-center space-x-3">
            <span className="text-gray-400">
              Page <span className="font-bold text-white">{currentPage}</span> of <span className="font-bold text-white">{totalPages}</span>
            </span>
            <div className="flex items-center space-x-1">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="p-1.5 bg-[#131C2E] border border-[#1F2937] rounded text-gray-300 hover:text-white disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="p-1.5 bg-[#131C2E] border border-[#1F2937] rounded text-gray-300 hover:text-white disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
