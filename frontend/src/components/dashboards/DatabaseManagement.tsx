"use client";

import { useState, useEffect } from "react";
import { Database, Server, HardDrive, Users, Activity, RefreshCw, Archive, Trash2, Cpu, Network, FileDown, Clock, CheckCircle2 } from "lucide-react";

interface DBStatus {
  postgres: {
    status: string;
    size_mb: number;
    total_users: number;
    qps: number;
    connections: number;
    cpu_usage: number;
  };
  mongodb: {
    status: string;
    size_mb: number;
    total_telemetry: number;
    qps: number;
    connections: number;
    cpu_usage: number;
  };
}

interface DatasetInfo {
  id: string;
  name: string;
  size: string;
  status: "Loaded" | "Not Loaded" | "Partial";
  records: number;
  color: string;
}

export default function DatabaseManagement() {
  const [dbStatus, setDbStatus] = useState<DBStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isIngesting, setIsIngesting] = useState<string | null>(null);

  // Mocking datasets based on CICIDS2017 and UNSW-NB15 structures
  const [datasets, setDatasets] = useState<DatasetInfo[]>([
    { id: "cicids-friday", name: "CICIDS2017 (Friday DDoS/PortScan)", size: "450 MB", status: "Loaded", records: 80000, color: "blue" },
    { id: "cicids-wednesday", name: "CICIDS2017 (Wednesday DoS/Heartbleed)", size: "820 MB", status: "Not Loaded", records: 0, color: "gray" },
    { id: "cicids-thursday", name: "CICIDS2017 (Thursday Web/Infiltration)", size: "680 MB", status: "Not Loaded", records: 0, color: "gray" },
    { id: "unsw-part1", name: "UNSW-NB15 (Part 1)", size: "1.2 GB", status: "Partial", records: 25000, color: "amber" },
  ]);

  const operationsLog = [
    { id: 1, action: "Triggered MongoDB Backup", time: "10 mins ago", user: "admin", status: "success" },
    { id: 2, action: "Optimized Postgres Tables", time: "2 hours ago", user: "system", status: "success" },
    { id: 3, action: "Ingested 80,000 rows from Friday-WorkingHours", time: "Yesterday", user: "admin", status: "success" },
    { id: 4, action: "Pruned telemetry logs older than 30 days", time: "3 days ago", user: "system", status: "success" },
  ];

  const fetchStatus = async () => {
    try {
      const res = await fetch("http://52.66.252.155:8000/api/database/status");
      if (res.ok) {
        const data = await res.json();
        // Decorate with mock advanced metrics if backend doesn't provide them yet
        setDbStatus({
          postgres: {
            ...data.postgres,
            qps: Math.floor(Math.random() * 50) + 10,
            connections: Math.floor(Math.random() * 5) + 2,
            cpu_usage: Math.floor(Math.random() * 20) + 5,
          },
          mongodb: {
            ...data.mongodb,
            qps: Math.floor(Math.random() * 500) + 200,
            connections: Math.floor(Math.random() * 20) + 10,
            cpu_usage: Math.floor(Math.random() * 60) + 20,
          }
        });
      }
    } catch (err) {
      console.error("Failed to fetch database status", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 10000); // Poll every 10s
    return () => clearInterval(interval);
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleIngest = (datasetId: string, name: string) => {
    setIsIngesting(datasetId);
    showToast(`Started ingesting ${name}...`);
    
    // Simulate ingestion process
    setTimeout(() => {
      setDatasets(prev => prev.map(ds => {
        if (ds.id === datasetId) {
          return { ...ds, status: "Loaded", records: ds.records || 150000, color: "blue" };
        }
        return ds;
      }));
      setIsIngesting(null);
      showToast(`Successfully ingested ${name} into MongoDB.`);
    }, 3000);
  };

  if (loading && !dbStatus) {
    return (
      <div className="flex items-center justify-center h-[500px] text-gray-400">
        <RefreshCw className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  const renderMetric = (label: string, value: string | number, Icon: any, color: string) => (
    <div className="flex items-center gap-3 bg-black/40 p-3 rounded-lg border border-white/5">
      <div className={`p-2 rounded bg-${color}-500/10`}>
        <Icon className={`w-4 h-4 text-${color}-400`} />
      </div>
      <div>
        <p className="text-xs text-gray-500 uppercase font-semibold">{label}</p>
        <p className="text-lg font-bold text-white">{value}</p>
      </div>
    </div>
  );

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8 animate-blur-fade-up pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-8 right-8 bg-green-500/90 text-white px-6 py-3 rounded-lg shadow-2xl z-50 flex items-center gap-2 animate-in slide-in-from-right-10">
          <Activity className="w-4 h-4" />
          {toastMessage}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
            <Database className="w-6 h-6 text-blue-400" />
            Database Management
          </h2>
          <p className="text-gray-400 text-sm mt-1">
            Real-time status, storage metrics, and dataset ingestion for NetShield data stores.
          </p>
        </div>
        <button
          onClick={() => {
            setLoading(true);
            fetchStatus();
          }}
          className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-lg transition-colors text-sm font-medium"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh Metrics
        </button>
      </div>

      {/* Advanced Metrics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* PostgreSQL Card */}
        <div className="rounded-2xl liquid-glass !bg-black/40 !backdrop-blur-xl border border-white/10 overflow-hidden group hover:border-blue-500/30 transition-colors flex flex-col">
          <div className="p-5 border-b border-white/10 bg-gradient-to-r from-blue-900/20 to-transparent flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-black/40 flex items-center justify-center border border-white/10 shadow-[0_0_15px_rgba(59,130,246,0.2)]">
                <Server className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h3 className="font-bold text-white leading-tight">PostgreSQL</h3>
                <p className="text-xs text-gray-400">Users & Configuration</p>
              </div>
            </div>
            <span className={`px-2.5 py-1 rounded-full text-[10px] uppercase tracking-wider font-bold border ${dbStatus?.postgres?.status === "Online" ? "bg-green-500/20 text-green-400 border-green-500/40" : "bg-red-500/20 text-red-400 border-red-500/40"}`}>
              {dbStatus?.postgres?.status || "Unknown"}
            </span>
          </div>
          
          <div className="p-5 grid grid-cols-2 gap-3 flex-1">
            {renderMetric("Storage Size", `${dbStatus?.postgres?.size_mb || 0} MB`, HardDrive, "blue")}
            {renderMetric("Total Users", dbStatus?.postgres?.total_users || 0, Users, "blue")}
            {renderMetric("Active Conns", dbStatus?.postgres?.connections || 0, Network, "purple")}
            {renderMetric("Queries/Sec", dbStatus?.postgres?.qps || 0, Activity, "cyan")}
          </div>

          <div className="p-4 border-t border-white/10 bg-white/5 flex gap-3">
            <button onClick={() => showToast("PostgreSQL Backup Triggered")} className="flex-1 flex justify-center items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition-colors">
              <Archive className="w-3.5 h-3.5" /> Trigger Backup
            </button>
            <button onClick={() => showToast("Optimizing PostgreSQL Tables...")} className="flex-1 flex justify-center items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-lg transition-colors border border-white/5">
              Optimize DB
            </button>
          </div>
        </div>

        {/* MongoDB Card */}
        <div className="rounded-2xl liquid-glass !bg-black/40 !backdrop-blur-xl border border-white/10 overflow-hidden group hover:border-green-500/30 transition-colors flex flex-col">
          <div className="p-5 border-b border-white/10 bg-gradient-to-r from-green-900/20 to-transparent flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-black/40 flex items-center justify-center border border-white/10 shadow-[0_0_15px_rgba(34,197,94,0.2)]">
                <Database className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <h3 className="font-bold text-white leading-tight">MongoDB</h3>
                <p className="text-xs text-gray-400">Telemetry & ML Assets</p>
              </div>
            </div>
            <span className={`px-2.5 py-1 rounded-full text-[10px] uppercase tracking-wider font-bold border ${dbStatus?.mongodb?.status === "Online" ? "bg-green-500/20 text-green-400 border-green-500/40" : "bg-red-500/20 text-red-400 border-red-500/40"}`}>
              {dbStatus?.mongodb?.status || "Unknown"}
            </span>
          </div>
          
          <div className="p-5 grid grid-cols-2 gap-3 flex-1">
            {renderMetric("Storage Size", `${dbStatus?.mongodb?.size_mb || 0} MB`, HardDrive, "green")}
            {renderMetric("Total Records", (dbStatus?.mongodb?.total_telemetry || 0).toLocaleString(), Activity, "green")}
            {renderMetric("CPU Usage", `${dbStatus?.mongodb?.cpu_usage || 0}%`, Cpu, "amber")}
            {renderMetric("Queries/Sec", dbStatus?.mongodb?.qps || 0, Activity, "cyan")}
          </div>

          <div className="p-4 border-t border-white/10 bg-white/5 flex gap-3">
            <button onClick={() => showToast("MongoDB Backup Triggered")} className="flex-1 flex justify-center items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-500 text-white text-xs font-semibold rounded-lg transition-colors">
              <Archive className="w-3.5 h-3.5" /> Trigger Backup
            </button>
            <button onClick={() => showToast("Clearing Logs older than 30 days...")} className="flex-1 flex justify-center items-center gap-2 px-3 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 text-xs font-semibold rounded-lg transition-colors border border-red-500/20">
              <Trash2 className="w-3.5 h-3.5" /> Prune Logs
            </button>
          </div>
        </div>
      </div>

      {/* Dataset Ingestion & Management */}
      <div className="rounded-2xl liquid-glass !bg-black/40 !backdrop-blur-xl border border-white/10 overflow-hidden">
        <div className="p-5 border-b border-white/10 bg-white/5">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <FileDown className="w-5 h-5 text-purple-400" />
            ML Dataset Ingestion
          </h3>
          <p className="text-sm text-gray-400 mt-1">Manage the ingestion of massive network traffic datasets into the MongoDB store.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead>
              <tr className="text-xs text-gray-400 font-semibold border-b border-white/10 bg-black/40">
                <th className="px-6 py-4">Dataset Segment</th>
                <th className="px-6 py-4">File Size</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Records Loaded</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {datasets.map((ds) => (
                <tr key={ds.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-200">{ds.name}</td>
                  <td className="px-6 py-4 text-gray-400">{ds.size}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] uppercase font-bold border border-${ds.color}-500/40 text-${ds.color}-400 bg-${ds.color}-500/10`}>
                      {ds.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-300 font-mono">
                    {ds.records > 0 ? ds.records.toLocaleString() : "-"}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      disabled={ds.status === "Loaded" || isIngesting !== null}
                      onClick={() => handleIngest(ds.id, ds.name)}
                      className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                        ds.status === "Loaded"
                          ? "bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700"
                          : isIngesting === ds.id
                          ? "bg-purple-600/50 text-white cursor-wait border border-purple-500/50"
                          : "bg-purple-600 hover:bg-purple-500 text-white border border-purple-500"
                      }`}
                    >
                      {isIngesting === ds.id ? (
                        <span className="flex items-center gap-2"><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Ingesting...</span>
                      ) : ds.status === "Loaded" ? (
                        "Fully Loaded"
                      ) : (
                        "Ingest Data"
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Operations Log */}
      <div className="rounded-2xl liquid-glass !bg-black/40 !backdrop-blur-xl border border-white/10 overflow-hidden">
        <div className="p-5 border-b border-white/10 bg-white/5">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-gray-400" />
            Recent Database Operations
          </h3>
        </div>
        <div className="p-2">
          {operationsLog.map((op) => (
            <div key={op.id} className="flex items-center justify-between p-3 hover:bg-white/5 rounded-xl transition-colors">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-green-500/10 rounded-full border border-green-500/20">
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-200">{op.action}</p>
                  <p className="text-xs text-gray-500 mt-0.5">Executed by <span className="text-blue-400">@{op.user}</span></p>
                </div>
              </div>
              <span className="text-xs text-gray-500">{op.time}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
