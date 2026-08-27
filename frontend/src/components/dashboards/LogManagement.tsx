"use client";

import React, { useState, useEffect } from 'react';
import { Terminal, Download, Filter, Search, Play, Pause } from 'lucide-react';

export default function LogManagement({ dataset, dataSource, telemetryData }: any) {
  const [logs, setLogs] = useState<any[]>([]);
  const [isLive, setIsLive] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (dataSource === "live" && isLive) {
      const formattedLogs = telemetryData.map((t: any) => ({
        timestamp: t.timestamp,
        level: t.threatLevel === "Critical" ? "ERROR" : t.threatLevel === "High" ? "WARN" : "INFO",
        source: t.source,
        message: `Connection from ${t.source}:${t.sourcePort} to ${t.dest}:${t.destPort} [${t.protocol}] - ${t.prediction} - Confidence: ${t.confidence}%`
      }));
      setLogs(formattedLogs);
    }
  }, [dataSource, telemetryData, isLive]);

  useEffect(() => {
    if (dataSource !== "live") {
      const fetchLogs = async () => {
        try {
          const queryParams = new URLSearchParams({ dataset: dataset || "" }).toString();
          const res = await fetch(`http://localhost:8000/api/network/traffic-data?${queryParams}&limit=200`);
          if (res.ok) {
            const data = await res.json();
            setLogs(data.data.map((t: any) => ({
              timestamp: t.timestamp,
              level: t.threat_level === "High" ? "WARN" : "INFO",
              source: t.source_ip,
              message: `Connection from ${t.source_ip}:${t.source_port} to ${t.destination_ip}:${t.destination_port} [${t.protocol}] - ${t.prediction} - Confidence: ${t.confidence}%`
            })));
          }
        } catch (e) {
          console.warn("Backend unavailable:", e);
        }
      };
      fetchLogs();
    }
  }, [dataset, dataSource]);

  const filteredLogs = logs.filter(l => 
    l.message?.toLowerCase().includes(search.toLowerCase()) || 
    l.source?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-blur-fade-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Terminal className="text-emerald-400" />
            Centralized Logs
          </h2>
          <p className="text-gray-400 text-sm mt-1">Raw system, network, and authentication logs.</p>
        </div>
        <div className="flex items-center gap-3">
          {dataSource === "live" && (
            <button 
              onClick={() => setIsLive(!isLive)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isLive ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-white/5 text-gray-400 border border-white/10'}`}
            >
              {isLive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              {isLive ? "Pause Stream" : "Resume Stream"}
            </button>
          )}
          <button className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white hover:bg-white/10 transition-colors">
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            type="text"
            placeholder="Search logs via regex or keywords..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-black/40 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:border-emerald-500 outline-none transition-colors"
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white hover:bg-white/10 transition-colors">
          <Filter className="w-4 h-4" /> Advanced Filter
        </button>
      </div>

      {/* Terminal Output */}
      <div className="rounded-2xl bg-[#0a0a0a] border border-white/10 overflow-hidden font-mono text-xs shadow-2xl">
        <div className="bg-white/5 px-4 py-2 flex items-center gap-2 border-b border-white/10">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
            <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
          </div>
          <span className="text-gray-500 ml-2">/var/log/netshield/traffic.log</span>
        </div>
        <div className="p-4 h-[600px] overflow-y-auto space-y-1 custom-scrollbar">
          {filteredLogs.length > 0 ? filteredLogs.map((log, i) => (
            <div key={i} className="flex hover:bg-white/5 px-2 py-1 rounded transition-colors group">
              <span className="text-gray-500 w-40 flex-shrink-0">{new Date(log.timestamp).toISOString().replace('T', ' ').substring(0, 19)}</span>
              <span className={`w-16 flex-shrink-0 font-bold ${log.level === 'ERROR' ? 'text-red-500' : log.level === 'WARN' ? 'text-yellow-500' : 'text-blue-400'}`}>
                [{log.level}]
              </span>
              <span className="text-emerald-400/80 w-32 flex-shrink-0 truncate pr-4">{log.source}</span>
              <span className="text-gray-300 break-all">{log.message}</span>
            </div>
          )) : (
            <div className="text-gray-500 italic p-4">No matching logs found...</div>
          )}
        </div>
      </div>
    </div>
  );
}
