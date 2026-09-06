"use client";

import React, { useState, useEffect } from 'react';
import { Bell, Search, Filter, ShieldAlert, CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';

export default function AlertManagement({ dataset, dataSource, telemetryData }: any) {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  
  useEffect(() => {
    const fetchAlerts = async () => {
      if (telemetryData && telemetryData.length > 0) {
        const activeAlerts = telemetryData
          .filter((t: any) => t.threatLevel === "High" || t.threatLevel === "Critical")
          .map((t: any) => ({
            id: t.id,
            timestamp: t.timestamp,
            severity: t.threatLevel === "Critical" ? "critical" : "warning",
            message: `${t.prediction} attack detected from ${t.source}`,
            source: "Network Sensor",
            status: "Active"
          }));
        setAlerts(activeAlerts);
        return;
      }
      
      try {
        const queryParams = new URLSearchParams({ dataset: dataset || "" }).toString();
        const res = await fetch(`http://52.66.252.155:8000/api/network/alerts?${queryParams}&limit=100`);
        if (res.ok) {
          const data = await res.json();
          // Assign random statuses for UI demonstration of Incident Response
          setAlerts(data.map((a: any, i: number) => ({
            ...a,
            status: i % 5 === 0 ? "Resolved" : (i % 3 === 0 ? "Acknowledged" : "Active")
          })));
        }
      } catch (e) {
        console.warn("Backend unavailable:", e);
      }
    };
    
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 10000);
    return () => clearInterval(interval);
  }, [dataset, dataSource, telemetryData]);

  const filteredAlerts = alerts.filter(a => 
    a.message?.toLowerCase().includes(search.toLowerCase()) || 
    a.source?.toLowerCase().includes(search.toLowerCase())
  );

  const activeCount = alerts.filter(a => a.status === "Active").length;
  const resolvedCount = alerts.filter(a => a.status === "Resolved").length;

  return (
    <div className="space-y-6 animate-blur-fade-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Bell className="text-blue-400" />
            Alert Management
          </h2>
          <p className="text-gray-400 text-sm mt-1">Incident response, active threats, and resolution tracking.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="liquid-glass px-4 py-2 rounded-lg border border-red-500/30 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-red-400" />
            <span className="text-sm text-red-400 font-bold">{activeCount} Active</span>
          </div>
          <div className="liquid-glass px-4 py-2 rounded-lg border border-green-500/30 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-400" />
            <span className="text-sm text-green-400 font-bold">{resolvedCount} Resolved</span>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            type="text"
            placeholder="Search alerts by IP, type, or source..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-black/40 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:border-blue-500 outline-none transition-colors"
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white hover:bg-white/10 transition-colors">
          <Filter className="w-4 h-4" /> Filter
        </button>
      </div>

      {/* Table */}
      <div className="rounded-2xl liquid-glass !bg-black/40 !backdrop-blur-xl border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-xs text-gray-400 uppercase tracking-wider bg-white/5 border-b border-white/10">
                <th className="px-6 py-4">Severity</th>
                <th className="px-6 py-4">Timestamp</th>
                <th className="px-6 py-4">Message</th>
                <th className="px-6 py-4">Source</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredAlerts.length > 0 ? filteredAlerts.map((alert, i) => (
                <tr key={i} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4">
                    {alert.severity === 'critical' ? (
                      <span className="flex items-center gap-1.5 text-red-400 bg-red-500/10 px-2.5 py-1 rounded-full text-xs font-medium border border-red-500/20 w-fit">
                        <AlertTriangle className="w-3 h-3" /> Critical
                      </span>
                    ) : alert.severity === 'warning' ? (
                      <span className="flex items-center gap-1.5 text-orange-400 bg-orange-500/10 px-2.5 py-1 rounded-full text-xs font-medium border border-orange-500/20 w-fit">
                        <AlertTriangle className="w-3 h-3" /> High
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-full text-xs font-medium border border-blue-500/20 w-fit">
                        Info
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-gray-400 whitespace-nowrap flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5" />
                    {new Date(alert.timestamp).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-200">{alert.message}</td>
                  <td className="px-6 py-4 text-gray-400">{alert.source}</td>
                  <td className="px-6 py-4">
                    {alert.status === 'Resolved' ? (
                      <span className="text-green-400 flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5" /> Resolved</span>
                    ) : alert.status === 'Acknowledged' ? (
                      <span className="text-yellow-400 flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Acknowledged</span>
                    ) : (
                      <span className="text-red-400 font-bold flex items-center gap-1"><XCircle className="w-3.5 h-3.5" /> Active</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <button className="text-xs font-medium text-blue-400 hover:text-blue-300">Investigate</button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    <ShieldAlert className="w-8 h-8 mx-auto mb-3 opacity-50" />
                    No alerts found for the current filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
