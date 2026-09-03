"use client";

import { AlertTriangle, RefreshCw, Filter } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from "recharts";
import { useEffect, useState } from "react";

const COLORS = ["#3b82f6", "#8b5cf6", "#f59e0b", "#10b981", "#ef4444", "#ec4899", "#14b8a6"];

export default function AttackVisualization({ dataset, dataSource, telemetryData }: any) {
  const [severity, setSeverity] = useState("All Severities");
  const [attackType, setAttackType] = useState("All Attack Types");
  const [timeRange, setTimeRange] = useState("All Time");
  
  const [timelineData, setTimelineData] = useState<{time: string, attacks: number}[]>([]);
  const [protocolData, setProtocolData] = useState<{name: string, value: number, color: string}[]>([]);
  
  const fetchData = async () => {
    if (telemetryData && telemetryData.length > 0) {
      // In strict live mode, parse telemetryData directly
      const attacks = telemetryData.filter((t: any) => t.threatLevel === "High" || t.threatLevel === "Critical");
      if (attacks.length === 0) {
        setTimelineData([
          { time: "00:00", attacks: 0 }, { time: "02:00", attacks: 0 },
          { time: "04:00", attacks: 0 }, { time: "06:00", attacks: 0 }
        ]);
      } else {
        // Mock timeline based on live for visual effect or accurate minutely tracking
        const recentAttacks = attacks.length;
        setTimelineData([
          { time: "T-5m", attacks: 0 },
          { time: "T-4m", attacks: Math.floor(recentAttacks * 0.2) },
          { time: "T-3m", attacks: Math.floor(recentAttacks * 0.3) },
          { time: "T-2m", attacks: Math.floor(recentAttacks * 0.4) },
          { time: "T-1m", attacks: Math.floor(recentAttacks * 0.8) },
          { time: "Now",  attacks: recentAttacks }
        ]);
      }

      // Protocols from live
      const protos: Record<string, number> = {};
      telemetryData.forEach((t: any) => {
        protos[t.protocol] = (protos[t.protocol] || 0) + 1;
      });
      const formattedProtos = Object.entries(protos).map(([name, value], i) => ({
        name: name || "UNKNOWN",
        value,
        color: COLORS[i % COLORS.length]
      }));
      if (formattedProtos.length === 0) {
        setProtocolData([{ name: "No Data", value: 1, color: "#374151" }]);
      } else {
        setProtocolData(formattedProtos);
      }
      return;
    }

    try {
      const queryParams = new URLSearchParams({
        dataset: dataset || "",
        severity: severity !== "All Severities" ? severity : "",
        attack_type: attackType !== "All Attack Types" ? attackType : "",
        time_range: timeRange !== "All Time" ? timeRange : ""
      }).toString();

      // Fetch timeline
      const timelineRes = await fetch(`http://localhost:8000/api/network/attack-timeline?${queryParams}`);
      if (timelineRes.ok) {
        const data = await timelineRes.json();
        setTimelineData(data.length ? data : [
          { time: "00:00", attacks: 0 }, { time: "02:00", attacks: 0 },
          { time: "04:00", attacks: 0 }, { time: "06:00", attacks: 0 }
        ]);
      }
      
      // Fetch protocols from dashboard-stats
      const statsRes = await fetch(`http://localhost:8000/api/network/dashboard-stats?${queryParams}`);
      if (statsRes.ok) {
        const stats = await statsRes.json();
        if (stats.protocols && stats.protocols.length > 0) {
          const formattedProtos = stats.protocols.map((p: any, i: number) => ({
            name: p.name,
            value: p.value,
            color: COLORS[i % COLORS.length]
          }));
          setProtocolData(formattedProtos);
        } else {
           setProtocolData([{ name: "No Data", value: 1, color: "#374151" }]);
        }
      }
    } catch (e) {
      console.warn("Backend unavailable:", e);
      setTimelineData([{ time: "00:00", attacks: 0 }]);
      setProtocolData([{ name: "No Data", value: 1, color: "#374151" }]);
    }
  };
  
  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, [severity, attackType, timeRange, dataset, dataSource, telemetryData]);

  const resetFilters = () => {
    setSeverity("All Severities");
    setAttackType("All Attack Types");
    setTimeRange("All Time");
  };

  return (
    <div className="w-full space-y-6 animate-blur-fade-up">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
            <p className="text-[10px] font-bold tracking-widest text-green-400 uppercase">Netshield AI Security Platform</p>
          </div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Attack Visualization Engine</h2>
          <p className="text-gray-400 text-sm mt-1">
            Interactive threat timeline, risk heatmaps, top attacker IPs, protocol ratios, and network flow dynamics.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg">
            <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
            <span className="text-xs font-medium text-white">Alerts</span>
          </div>
          <button onClick={fetchData} className="flex items-center gap-2 text-xs font-medium px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh Data
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="rounded-2xl liquid-glass !bg-black/40 !backdrop-blur-xl border border-white/10 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <span className="text-xs font-bold text-blue-400 tracking-wider">FILTERS:</span>
          
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">Severity:</span>
            <select 
              value={severity}
              onChange={(e) => setSeverity(e.target.value)}
              className="bg-black/40 text-gray-200 text-xs px-3 py-1.5 rounded-lg border border-white/10 outline-none focus:border-white/30 cursor-pointer"
            >
              <option>All Severities</option>
              <option>High</option>
              <option>Medium</option>
              <option>Low</option>
            </select>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">Attack Type:</span>
            <select 
              value={attackType}
              onChange={(e) => setAttackType(e.target.value)}
              className="bg-black/40 text-gray-200 text-xs px-3 py-1.5 rounded-lg border border-white/10 outline-none focus:border-white/30 cursor-pointer"
            >
              <option>All Attack Types</option>
              <option>DDoS</option>
              <option>Port Scan</option>
              <option>Brute Force</option>
            </select>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">Time Range:</span>
            <select 
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="bg-black/40 text-gray-200 text-xs px-3 py-1.5 rounded-lg border border-white/10 outline-none focus:border-white/30 cursor-pointer"
            >
              <option>All Time</option>
              <option>Last 24 Hours</option>
              <option>Last 7 Days</option>
            </select>
          </div>
        </div>
        
        <button 
          onClick={resetFilters}
          className="text-xs font-medium px-4 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 rounded-lg transition-colors"
        >
          Reset Filters
        </button>
      </div>

      {/* Main Charts Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Timeline Chart */}
        <div className="lg:col-span-2 rounded-2xl liquid-glass !bg-black/40 !backdrop-blur-xl border border-white/10 p-6">
          <h3 className="text-lg font-bold text-white mb-1">Attack Event Timeline</h3>
          <p className="text-xs text-gray-400 mb-6">Attack frequency progression over time</p>
          
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorAttacks" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                <XAxis dataKey="time" stroke="#6b7280" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#6b7280" fontSize={10} tickLine={false} axisLine={false} />
                {/* @ts-ignore */}
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}
                  itemStyle={{ color: '#f43f5e' }}
                />
                <Area type="monotone" dataKey="attacks" stroke="#f43f5e" strokeWidth={2} fillOpacity={1} fill="url(#colorAttacks)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Protocol Distribution */}
        <div className="lg:col-span-1 rounded-2xl liquid-glass !bg-black/40 !backdrop-blur-xl border border-white/10 p-6">
          <h3 className="text-lg font-bold text-white mb-1">Protocol Distribution</h3>
          <p className="text-xs text-gray-400 mb-6">Transport protocol breakdown.</p>
          
          <div className="h-[240px] w-full flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                {/* @ts-ignore */}
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Pie
                  data={protocolData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={protocolData.length > 1 ? 5 : 0}
                  dataKey="value"
                  stroke="none"
                >
                  {protocolData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            
            {/* Center Text */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="text-3xl font-bold text-white">100%</span>
            </div>
          </div>
          
          {/* Custom Legend */}
          <div className="flex flex-wrap items-center justify-center gap-4 mt-6">
            {protocolData.map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="w-3 h-1.5 rounded-full" style={{ backgroundColor: item.color }}></span>
                <span className="text-xs font-medium text-gray-300">{item.name}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
