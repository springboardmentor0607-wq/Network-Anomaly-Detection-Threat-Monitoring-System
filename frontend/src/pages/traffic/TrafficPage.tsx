import React, { useState, useEffect } from 'react';
import { Download, Search, Filter, Activity, Server, Network, ArrowDownUp, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { apiClient } from '../../api/client';
import { PROTOCOL_OPTIONS } from '../../constants/traffic';

export const TrafficPage: React.FC = () => {
  const [flows, setFlows] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedProtocol, setSelectedProtocol] = useState('ALL');
  
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRows, setTotalRows] = useState(0);
  const [loading, setLoading] = useState(false);

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Load stats
  useEffect(() => {
    apiClient.getTrafficStats().then(res => {
      setStats(res.data);
    }).catch(err => console.error("Failed to load traffic stats", err));
  }, []);

  // Load paginated flows
  useEffect(() => {
    setLoading(true);
    const protocolFilter = selectedProtocol === 'ALL' ? undefined : selectedProtocol;
    const searchFilter = debouncedSearch.trim() || undefined;

    apiClient.getTraffic(currentPage, pageSize, protocolFilter, searchFilter)
      .then(res => {
        setFlows(res.data.items);
        setTotalPages(res.data.total_pages);
        setTotalRows(res.data.total);
      })
      .catch(err => console.error("Failed to fetch traffic flows", err))
      .finally(() => setLoading(false));
  }, [currentPage, pageSize, selectedProtocol, debouncedSearch]);

  const exportToCSV = () => {
    const headers = ['ID,Timestamp,SourceIP,DestinationIP,Protocol,SourcePort,DestinationPort,Packets,Bytes\n'];
    const rows = flows.map(
      (f) => `${f.id},${f.timestamp},${f.source_ip},${f.destination_ip},${f.protocol},${f.source_port},${f.destination_port},${f.packets},${f.bytes}`
    );
    const blob = new Blob([headers.concat(rows.join('\n')).join('')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `netshield_traffic_export_${Date.now()}.csv`;
    a.click();
  };

  const formatBytes = (bytes: number) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#333333] pb-4">
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
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#121212] border border-[#333333] p-4 rounded-xl flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400 uppercase font-semibold">Total Telemetry Volume</p>
              <p className="text-xl font-bold text-white mt-0.5">{formatBytes(stats.total_bytes)}</p>
            </div>
            <Network className="w-6 h-6 text-cyan-400" />
          </div>
          <div className="bg-[#121212] border border-[#333333] p-4 rounded-xl flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400 uppercase font-semibold">Total Packets</p>
              <p className="text-xl font-bold text-emerald-400 mt-0.5">{stats.total_packets.toLocaleString()}</p>
            </div>
            <ArrowDownUp className="w-6 h-6 text-emerald-400" />
          </div>
          <div className="bg-[#121212] border border-[#333333] p-4 rounded-xl flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400 uppercase font-semibold">Top Source Target</p>
              <p className="text-sm font-bold text-indigo-400 mt-0.5 truncate">
                {stats.top_sources?.[0]?.ip || 'N/A'}
              </p>
            </div>
            <Server className="w-6 h-6 text-indigo-400" />
          </div>
          <div className="bg-[#121212] border border-[#333333] p-4 rounded-xl flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400 uppercase font-semibold">Analyzed Flows</p>
              <p className="text-xl font-bold text-amber-400 mt-0.5">{stats.total_flows.toLocaleString()}</p>
            </div>
            <Activity className="w-6 h-6 text-amber-400" />
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <Card>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search flows by IP address..."
              className="w-full bg-[#000000] border border-[#333333] rounded-lg pl-9 pr-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 transition"
            />
          </div>

          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <Filter className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-gray-400 font-medium">Protocol Filter:</span>
              <select
                value={selectedProtocol}
                onChange={(e) => {
                  setSelectedProtocol(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-[#000000] border border-[#333333] rounded-lg px-2.5 py-1.5 text-cyan-400 font-semibold focus:outline-none"
              >
                <option value="ALL" className="bg-[#121212]">ALL</option>
                {PROTOCOL_OPTIONS.map((p) => (
                  <option key={p} value={p} className="bg-[#121212]">{p}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </Card>

      {/* Traffic Table with Pagination Controls */}
      <Card title={`Historical Telemetry Flows (${totalRows} Total Matches)`}>
        <div className="overflow-x-auto min-h-[300px]">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#000000] text-gray-400 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-3">Flow ID</th>
                <th className="p-3">Timestamp</th>
                <th className="p-3">Source IP : Port</th>
                <th className="p-3">Destination IP : Port</th>
                <th className="p-3">Protocol</th>
                <th className="p-3">Packets / Bytes</th>
                <th className="p-3">Duration</th>
                <th className="p-3">Source Data</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1F2937]">
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-gray-400">Loading flow data...</td>
                </tr>
              ) : flows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-gray-500">No traffic flows found.</td>
                </tr>
              ) : (
                flows.map((flow) => (
                  <tr key={flow.id} className="hover:bg-[#2A2A2A]/60 transition">
                    <td className="p-3 font-mono font-bold text-cyan-400" title={flow.id}>
                      {flow.id.substring(0, 8)}...
                    </td>
                    <td className="p-3 font-mono text-gray-400">{new Date(flow.timestamp).toLocaleString()}</td>
                    <td className="p-3 font-mono text-gray-200">{flow.source_ip} : {flow.source_port}</td>
                    <td className="p-3 font-mono text-cyan-400">{flow.destination_ip} : {flow.destination_port}</td>
                    <td className="p-3 font-bold text-gray-300">{flow.protocol}</td>
                    <td className="p-3 font-mono text-gray-400">{flow.packets} pkts / {(flow.bytes / 1024).toFixed(1)} KB</td>
                    <td className="p-3 font-mono text-gray-400">{flow.duration ? flow.duration.toFixed(3) : '0'}s</td>
                    <td className="p-3 text-gray-400">{flow.dataset_source}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="flex items-center justify-between border-t border-[#333333] pt-4 mt-4 text-xs">
          <div className="flex items-center space-x-2 text-gray-400">
            <span>Rows per page:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-[#000000] border border-[#333333] rounded px-2 py-1 text-cyan-400 font-semibold focus:outline-none"
            >
              <option value={5} className="bg-[#121212]">5</option>
              <option value={10} className="bg-[#121212]">10</option>
              <option value={25} className="bg-[#121212]">25</option>
              <option value={50} className="bg-[#121212]">50</option>
            </select>
          </div>

          <div className="flex items-center space-x-3">
            <span className="text-gray-400">
              Page <span className="font-bold text-white">{currentPage}</span> of <span className="font-bold text-white">{totalPages || 1}</span>
            </span>
            <div className="flex items-center space-x-1">
              <button
                disabled={currentPage <= 1 || loading}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="p-1.5 bg-[#000000] border border-[#333333] rounded text-gray-300 hover:text-white disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={currentPage >= totalPages || loading}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="p-1.5 bg-[#000000] border border-[#333333] rounded text-gray-300 hover:text-white disabled:opacity-40"
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
