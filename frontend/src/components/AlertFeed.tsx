"use client";

import { useState, useEffect } from "react";
import { ShieldAlert, AlertTriangle, Info, Clock } from "lucide-react";

type Alert = {
  id: string;
  timestamp: string;
  severity: "critical" | "warning" | "info";
  message: string;
  source: string;
};

export default function AlertFeed({ dataset }: { dataset?: string }) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const queryParam = dataset ? `?dataset=${dataset}` : '';
        const res = await fetch(`http://localhost:8000/api/network/alerts${queryParam}`);
        if (res.ok) {
          const data = await res.json();
          setAlerts(data);
        } else {
          // Fallback mock data if endpoint fails
          setAlerts([
            { id: "1", timestamp: new Date().toISOString(), severity: "critical", message: "Multiple failed logins from 192.168.1.45", source: "Auth Server" },
            { id: "2", timestamp: new Date(Date.now() - 50000).toISOString(), severity: "warning", message: "High bandwidth usage detected", source: "Firewall Node 2" },
            { id: "3", timestamp: new Date(Date.now() - 120000).toISOString(), severity: "info", message: "Database backup completed", source: "DB Cluster" }
          ]);
        }
      } catch (err) {
        console.error(err);
        setAlerts([
          { id: "1", timestamp: new Date().toISOString(), severity: "critical", message: "Connection to analytics engine lost", source: "System" },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchAlerts();
    const interval = setInterval(fetchAlerts, 15000);
    return () => clearInterval(interval);
  }, [dataset]);

  if (loading && alerts.length === 0) {
    return (
      <div className="w-full h-full min-h-[300px] flex items-center justify-center text-gray-500">
        <Clock className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  const getSeverityStyles = (severity: string) => {
    switch (severity) {
      case "critical":
        return { bg: "bg-red-500/10", border: "border-red-500/20", icon: ShieldAlert, iconColor: "text-red-500" };
      case "warning":
        return { bg: "bg-amber-500/10", border: "border-amber-500/20", icon: AlertTriangle, iconColor: "text-amber-500" };
      default:
        return { bg: "bg-blue-500/10", border: "border-blue-500/20", icon: Info, iconColor: "text-blue-500" };
    }
  };

  return (
    <div className="flex flex-col h-full w-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-red-500" />
          <h3 className="font-bold text-white text-base">Live Alert Feed</h3>
        </div>
        <span className="flex items-center gap-2 text-xs">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /> Live
        </span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
        {alerts.map((alert) => {
          const styles = getSeverityStyles(alert.severity);
          const Icon = styles.icon;
          
          return (
            <div 
              key={alert.id}
              className={`p-4 rounded-xl border ${styles.border} ${styles.bg} flex gap-4 items-start transition-all hover:bg-white/5`}
            >
              <div className={`p-2 rounded-lg bg-black/40 ${styles.border} border flex-shrink-0`}>
                <Icon className={`w-4 h-4 ${styles.iconColor}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{alert.message}</p>
                <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                  <span className="truncate">{alert.source}</span>
                  <span className="w-1 h-1 rounded-full bg-gray-600" />
                  <span className="whitespace-nowrap">
                    {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
