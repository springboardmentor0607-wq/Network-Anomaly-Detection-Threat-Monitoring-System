"use client";

import { Shield, ShieldAlert, Activity, Search, RefreshCw, Play, Square } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";

export interface TelemetryRow {
  id: string;
  source: string;
  dest: string;
  srcPort: string;
  dstPort: string;
  protocol: string;
  packets: number;
  bytes: number;
  threatLevel: string;
  prediction: string;
  confidence: number;
  timestamp?: string;
}

interface Props {
  telemetryData?: TelemetryRow[];
  isCapturing?: boolean;
  toggleCapture?: () => void;
  clearTelemetryData?: () => void;
}

export default function ProcessedTelemetryTable({ telemetryData = [], isCapturing = false, toggleCapture = () => {}, clearTelemetryData = () => {} }: Props) {
  const { role } = useAuth();
  
  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [filterProtocol, setFilterProtocol] = useState("All Protocols");
  const [filterThreat, setFilterThreat] = useState("All Threat Levels");

  const clearFilters = () => {
    setSearchQuery("");
    setFilterProtocol("All Protocols");
    setFilterThreat("All Threat Levels");
  };

  // Dynamically extract unique protocols from the current telemetry data
  const uniqueProtocols = Array.from(new Set(telemetryData.map(row => row.protocol))).filter(Boolean).sort();

  // Filter Logic
  const filteredData = telemetryData.filter(row => {
    const matchesSearch = searchQuery === "" || 
      row.source.includes(searchQuery) || 
      row.dest.includes(searchQuery) ||
      row.srcPort.includes(searchQuery) ||
      row.dstPort.includes(searchQuery) ||
      row.protocol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      row.prediction.toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesProtocol = filterProtocol === "All Protocols" || row.protocol === filterProtocol;
    const matchesThreat = filterThreat === "All Threat Levels" || row.threatLevel === filterThreat;
    
    return matchesSearch && matchesProtocol && matchesThreat;
  });

  return (
    <div className="w-full space-y-6 animate-blur-fade-up">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
            Processed Traffic Telemetry
            {isCapturing && (
              <span className="flex items-center gap-1.5 text-[10px] font-bold tracking-widest text-red-400 uppercase bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                Live AI Capture
              </span>
            )}
          </h2>
          <p className="text-gray-400 text-sm mt-1">
            Packet-level flow records from the ingestion pipeline with real-time threat classification.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg">
            <span className="text-xs text-gray-400">Role:</span>
            <span className="text-xs font-medium text-white">
              {role === "admin" ? "Security Administrator" : "Security Analyst"}
            </span>
          </div>
          <button 
            onClick={toggleCapture}
            className={`flex items-center gap-2 text-xs font-medium px-4 py-2 text-white rounded-lg transition-colors ${
              isCapturing ? "bg-red-600 hover:bg-red-500" : "bg-green-600 hover:bg-green-500"
            }`}
          >
            {isCapturing ? <Square className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            {isCapturing ? "Stop Capture" : "Start Live Sniffing"}
          </button>
          <button onClick={clearTelemetryData} className="flex items-center gap-2 text-xs font-medium px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors">
            <RefreshCw className="w-3.5 h-3.5" /> Clear Data
          </button>
          <Link href="/dashboard-cinematic" className="flex items-center gap-2 text-xs font-medium px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-lg transition-colors">
            ← Dashboard
          </Link>
        </div>
      </div>

      {/* Main Table Area */}
      <div className="rounded-2xl liquid-glass !bg-black/40 !backdrop-blur-xl border border-white/10 overflow-hidden">
        {/* Filters and Search Bar */}
        <div className="p-4 border-b border-white/10 bg-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-xl">
             <Search className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
             <input 
               type="text" 
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
               placeholder="Search IP, port, protocol, label..." 
               className="w-full bg-black/40 border border-white/10 rounded-lg pl-11 pr-4 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-blue-500/50 transition-colors"
             />
          </div>
          <div className="flex items-center gap-3">
            <select 
              value={filterProtocol}
              onChange={(e) => setFilterProtocol(e.target.value)}
              className="bg-black/40 border border-white/10 text-gray-300 text-sm rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500/50 appearance-none min-w-[140px] [&>option]:bg-gray-900 [&>option]:text-white">
              <option>All Protocols</option>
              {uniqueProtocols.map(protocol => (
                <option key={protocol} value={protocol}>{protocol}</option>
              ))}
            </select>
            <select 
              value={filterThreat}
              onChange={(e) => setFilterThreat(e.target.value)}
              className="bg-black/40 border border-white/10 text-gray-300 text-sm rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500/50 appearance-none min-w-[150px] [&>option]:bg-gray-900 [&>option]:text-white">
              <option>All Threat Levels</option>
              <option>Low</option>
              <option>Medium</option>
              <option>High</option>
              <option>Critical</option>
            </select>
            <button onClick={clearFilters} className="px-4 py-2 text-sm text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors">
              Clear Filters
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead>
              <tr className="text-[10px] text-gray-400 font-bold uppercase tracking-wider border-b border-white/10 bg-black/20">
                <th className="px-6 py-4">Timestamp</th>
                <th className="px-6 py-4">Source IP</th>
                <th className="px-6 py-4">Destination IP</th>
                <th className="px-6 py-4">Src Port</th>
                <th className="px-6 py-4">Dst Port</th>
                <th className="px-6 py-4">Protocol</th>
                <th className="px-6 py-4">Packets</th>
                <th className="px-6 py-4">Bytes</th>
                <th className="px-6 py-4">Threat Level</th>
                <th className="px-6 py-4">Prediction</th>
                <th className="px-6 py-4">Confidence</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-6 py-12 text-center text-gray-500">
                    {telemetryData.length === 0 
                      ? (isCapturing ? "Waiting for live packets..." : "Click 'Start Live Sniffing' to begin capture.")
                      : "No packets match the current filters."}
                  </td>
                </tr>
              ) : (
                filteredData.map((row) => (
                  <tr key={row.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 font-mono text-gray-400 text-[10px]">
                      {row.timestamp ? new Date(row.timestamp).toLocaleString() : "-"}
                    </td>
                    <td className="px-6 py-4 font-mono text-gray-200">{row.source}</td>
                    <td className="px-6 py-4 font-mono text-gray-200">{row.dest}</td>
                    <td className="px-6 py-4 font-mono text-cyan-400">{row.srcPort}</td>
                    <td className="px-6 py-4 font-mono text-cyan-400">{row.dstPort}</td>
                    <td className="px-6 py-4">
                      <span className="text-gray-300">{row.protocol}</span>
                    </td>
                    <td className="px-6 py-4 text-gray-300">{row.packets}</td>
                    <td className="px-6 py-4 text-gray-300">{row.bytes}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-[10px] font-medium border ${
                        row.threatLevel === "Critical" ? "border-red-500/20 text-red-400 bg-red-500/10" :
                        row.threatLevel === "High" ? "border-orange-500/20 text-orange-400 bg-orange-500/10" :
                        row.threatLevel === "Medium" ? "border-yellow-500/20 text-yellow-400 bg-yellow-500/10" :
                        "border-green-500/20 text-green-400 bg-green-500/10"
                      }`}>
                        {row.threatLevel}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`font-medium ${row.prediction === "BENIGN" ? "text-green-400" : "text-red-400"}`}>
                        {row.prediction === "BENIGN" ? (
                          <span className="flex items-center gap-1.5"><Shield className="w-3 h-3"/> {row.prediction}</span>
                        ) : (
                          <span className="flex items-center gap-1.5"><ShieldAlert className="w-3 h-3"/> {row.prediction}</span>
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <div className={`h-full ${row.prediction === "BENIGN" ? "bg-green-500" : "bg-red-500"}`} style={{ width: `${row.confidence}%` }}></div>
                        </div>
                        <span className="text-gray-400 font-mono">{row.confidence}%</span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
