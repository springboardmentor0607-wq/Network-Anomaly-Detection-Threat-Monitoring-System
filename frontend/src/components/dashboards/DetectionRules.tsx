"use client";

import React, { useState } from 'react';
import { Shield, Plus, Settings, Play, Pause, Trash2, Edit3, Search } from 'lucide-react';

const mockRules = [
  { id: 'RUL-001', name: 'SQL Injection Attempt', engine: 'Suricata', status: 'Active', severity: 'Critical', matches: 124 },
  { id: 'RUL-002', name: 'Large ICMP Flood', engine: 'Zeek', status: 'Active', severity: 'High', matches: 89 },
  { id: 'RUL-003', name: 'Suspicious SSH Login', engine: 'YARA', status: 'Inactive', severity: 'Medium', matches: 0 },
  { id: 'RUL-004', name: 'Ransomware C2 Beacon', engine: 'Suricata', status: 'Active', severity: 'Critical', matches: 2 },
  { id: 'RUL-005', name: 'Nmap Xmas Scan', engine: 'Zeek', status: 'Active', severity: 'Medium', matches: 512 },
];

export default function DetectionRules() {
  const [search, setSearch] = useState("");

  const filtered = mockRules.filter(r => r.name.toLowerCase().includes(search.toLowerCase()) || r.engine.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6 animate-blur-fade-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Shield className="text-purple-400" />
            Detection Rules
          </h2>
          <p className="text-gray-400 text-sm mt-1">Manage YARA, Zeek, and Suricata intrusion detection signatures.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg text-sm text-white font-medium transition-colors">
          <Plus className="w-4 h-4" /> Create Rule
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            type="text"
            placeholder="Search rules..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-black/40 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:border-purple-500 outline-none transition-colors"
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white hover:bg-white/10 transition-colors">
          <Settings className="w-4 h-4" /> Engine Settings
        </button>
      </div>

      {/* Rules Grid / Table */}
      <div className="rounded-2xl liquid-glass !bg-black/40 !backdrop-blur-xl border border-white/10 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="text-xs text-gray-400 uppercase tracking-wider bg-white/5 border-b border-white/10">
              <th className="px-6 py-4">Rule Name</th>
              <th className="px-6 py-4">Engine</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Severity</th>
              <th className="px-6 py-4">Matches (24h)</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filtered.map((rule, i) => (
              <tr key={i} className="hover:bg-white/5 transition-colors">
                <td className="px-6 py-4 font-medium text-gray-200">
                  <div className="flex flex-col">
                    <span>{rule.name}</span>
                    <span className="text-xs text-gray-500">{rule.id}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-gray-400">{rule.engine}</td>
                <td className="px-6 py-4">
                  {rule.status === 'Active' ? (
                    <span className="text-green-400 flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div> Active</span>
                  ) : (
                    <span className="text-gray-500 flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-gray-600"></div> Inactive</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded text-xs border ${rule.severity === 'Critical' ? 'border-red-500/30 text-red-400 bg-red-500/10' : rule.severity === 'High' ? 'border-orange-500/30 text-orange-400 bg-orange-500/10' : 'border-yellow-500/30 text-yellow-400 bg-yellow-500/10'}`}>
                    {rule.severity}
                  </span>
                </td>
                <td className="px-6 py-4 text-gray-400">{rule.matches}</td>
                <td className="px-6 py-4 flex justify-end gap-2">
                  <button className="p-1.5 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded transition-colors" title="Toggle Status">
                    {rule.status === 'Active' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </button>
                  <button className="p-1.5 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded transition-colors" title="Edit">
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button className="p-1.5 text-red-400 hover:text-white bg-red-500/10 hover:bg-red-500/20 rounded transition-colors" title="Delete">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
