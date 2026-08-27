"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
    Shield,
    Search,
    User,
    Activity,
    ShieldAlert,
    AlertTriangle,
    ArrowRight,
    Database,
    Server,
    Users,
    Star,
    Lock,
    Globe,
    Menu,
    X,
    LogOut,
    Target, Bell, FileText, Network, ClipboardList, UserCircle, ShieldCheck, Cpu, Key, Settings
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import AdvancedTrafficChart from "@/components/AdvancedTrafficChart";
import AlertFeed from "@/components/AlertFeed";
import CinematicSidebar, { SidebarTab } from "@/components/dashboards/CinematicSidebar";
import PlaceholderView from "@/components/dashboards/PlaceholderView";
import ProcessedTelemetryTable, { TelemetryRow } from "@/components/ProcessedTelemetryTable";
import DashboardStatsCharts from "@/components/DashboardStatsCharts";
import ModelPerformance from "@/components/dashboards/ModelPerformance";
import AttackVisualization from "@/components/dashboards/AttackVisualization";
import DatabaseManagement from "@/components/dashboards/DatabaseManagement";
import UserManagement from "@/components/dashboards/UserManagement";
import RoleManagement from "@/components/dashboards/RoleManagement";
import AnomalyDetection from "@/components/dashboards/AnomalyDetection";
import SecurityReports from "@/components/dashboards/SecurityReports";
import AlertManagement from "@/components/dashboards/AlertManagement";
import DetectionRules from "@/components/dashboards/DetectionRules";
import LogManagement from "@/components/dashboards/LogManagement";
import Notifications, { SystemNotification } from "@/components/dashboards/Notifications";
import {
    AreaChart,
    Area,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    CartesianGrid,
} from "recharts";

// ─── Custom Tooltip ─────────────────────────────────────────────────────────
const CustomBarTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-black/90 text-white text-xs px-3 py-2 rounded-lg border border-white/20 shadow-xl">
                <p className="font-semibold">{label}</p>
                <p>{payload[0].value.toLocaleString()}</p>
            </div>
        );
    }
    return null;
};

export default function DashboardCinematicPage() {
    const { role, isAuthenticated, isMounted, logout } = useAuth();
    const router = useRouter();
    const [mounted, setMounted] = useState(false);
    const [activeTab, setActiveTab] = useState<SidebarTab>("dashboard");
    const [datasetSource, setDatasetSource] = useState<"CICIDS2017" | "UNSW-NB15" | "Live Capture">("CICIDS2017");
    const [selectedDataset, setSelectedDataset] = useState<string>("Monday-WorkingHours.pcap_ISCX.csv");
    const [dataSource, setDataSource] = useState<"historical" | "live">("historical");

    // Dynamic State
    const [portData, setPortData] = useState<any[]>([]);
    const [summaryData, setSummaryData] = useState<any>({ total_packets: 0, total_alerts: 0, status: "Unknown" });
    const [dashboardStats, setDashboardStats] = useState<any>({ attack_categories: [], protocols: [], targeted_ips: [], system_health: {} });
    const [historicalFlowData, setHistoricalFlowData] = useState<any[]>([]);

    // Global Live Traffic State
    const [telemetryData, setTelemetryData] = useState<TelemetryRow[]>([]);
    const [isCapturing, setIsCapturing] = useState(false);
    const wsRef = useRef<WebSocket | null>(null);

    // Notifications State
    const [notifications, setNotifications] = useState<SystemNotification[]>([]);
    const [toast, setToast] = useState<SystemNotification | null>(null);

    const triggerNotification = (notif: SystemNotification) => {
        setNotifications(prev => [notif, ...prev].slice(0, 100)); // Keep last 100
        setToast(notif);
        setTimeout(() => {
            setToast(current => current?.id === notif.id ? null : current);
        }, 5000);
    };

    const toggleCapture = () => {
        if (isCapturing) {
            if (wsRef.current) {
                wsRef.current.close();
                wsRef.current = null;
            }
            setIsCapturing(false);
        } else {
            const ws = new WebSocket("ws://localhost:8000/api/live/ws");
            ws.onopen = () => setIsCapturing(true);
            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    const newRow: TelemetryRow = {
                        id: Math.random().toString(36).substr(2, 9),
                        source: data.source || "N/A",
                        dest: data.dest || "N/A",
                        srcPort: data.srcPort?.toString() || "0",
                        dstPort: data.dstPort?.toString() || "0",
                        protocol: data.protocol || "UNKNOWN",
                        packets: data.packets || 1,
                        bytes: data.bytes || 0,
                        threatLevel: data.threatLevel || "Low",
                        prediction: data.prediction || "BENIGN",
                        confidence: data.confidence || 0,
                        timestamp: new Date().toISOString(),
                    };
                    setTelemetryData(prev => [newRow, ...prev].slice(0, 50));
                    
                    if (newRow.threatLevel === "High" || newRow.threatLevel === "Critical") {
                        triggerNotification({
                            id: Math.random().toString(36).substr(2, 9),
                            timestamp: new Date().toISOString(),
                            severity: newRow.threatLevel,
                            message: `${newRow.threatLevel} Threat Detected: ${newRow.prediction} from ${newRow.source}`,
                            source: "Live Telemetry",
                            read: false
                        });
                    }
                } catch (e) {
                    console.error("Error parsing WebSocket message", e);
                }
            };
            ws.onclose = () => {
                setIsCapturing(false);
                wsRef.current = null;
            };
            wsRef.current = ws;
        }
    };

    // Cleanup websocket on full page unmount
    useEffect(() => {
        return () => {
            if (wsRef.current) wsRef.current.close();
        };
    }, []);

    const renderPlaceholder = () => {
        const map: Record<string, { title: string, desc: string, icon: any }> = {
            "live-monitoring": { title: "Live Monitoring", desc: "Real-time network traffic and connected devices stream.", icon: Activity },
            "anomaly-detection": { title: "Anomaly Detection", desc: "View detected anomalies, confidence scores, and AI predictions.", icon: Target },
            "threat-analysis": { title: "Threat Analysis", desc: "Deep dive into incident timelines and related events.", icon: ShieldAlert },
            "alerts": { title: "Alert Management", desc: "Active, acknowledged, and resolved security alerts.", icon: Bell },
            "logs": { title: "Log Management", desc: "Centralized Zeek, network, authentication, and HTTP logs.", icon: FileText },
            "packet-analysis": { title: "Packet Analysis", desc: "View and analyze PCAP files and packet flows.", icon: Network },
            "threat-intelligence": { title: "Threat Intelligence", desc: "Malicious IP lookups, MITRE ATT&CK mapping, and CVE info.", icon: Globe },
            "investigation": { title: "Investigation Workspace", desc: "Add notes, assign status, and gather incident evidence.", icon: Search },
            "reports": { title: "Security Reports", desc: "Daily, weekly, and monthly reports with export options.", icon: ClipboardList },
            "search": { title: "Global Search", desc: "Search across IPs, domains, usernames, and alert IDs.", icon: Search },
            "notifications": { title: "Notifications", desc: "System alerts, critical updates, and investigation status.", icon: Bell },
            "profile": { title: "My Profile", desc: "Manage your account, password, and notification preferences.", icon: UserCircle },
            "user-management": { title: "User Management", desc: "Add, edit, or remove platform users and analysts.", icon: Users },
            "roles": { title: "Roles & Access Management", desc: "Configure RBAC permissions and access controls.", icon: ShieldCheck },
            "machine-learning": { title: "Machine Learning Models", desc: "Upload, retrain, and monitor AI model performance.", icon: Cpu },
            "detection-rules": { title: "Detection Rules", desc: "Manage YARA, Zeek, and custom signature rules.", icon: Key },
            "database": { title: "Database Management", desc: "MongoDB and PostgreSQL status, backups, and restores.", icon: Database },
            "settings": { title: "System Settings", desc: "Configure Zeek, Kafka, SIEM integrations, and API keys.", icon: Settings },
        };
        const data = map[activeTab];
        if (!data) return null;
        if (activeTab === "live-monitoring") {
            return <ProcessedTelemetryTable telemetryData={telemetryData} isCapturing={isCapturing} toggleCapture={toggleCapture} clearTelemetryData={() => setTelemetryData([])} />;
        }
        if (activeTab === "machine-learning") {
            return <ModelPerformance dataset={selectedDataset} />;
        }
        if (activeTab === "threat-analysis") {
            return <AttackVisualization dataset={selectedDataset} dataSource={dataSource} telemetryData={telemetryData} />;
        }
        if (activeTab === "database") {
            return <DatabaseManagement />;
        }
        if (activeTab === "user-management") {
            return <UserManagement />;
        }
        if (activeTab === "roles") {
            return <RoleManagement />;
        }
        if (activeTab === "anomaly-detection") {
            return <AnomalyDetection dataset={selectedDataset} dataSource={dataSource} telemetryData={telemetryData} />;
        }
        if (activeTab === "alerts") {
            return <AlertManagement dataset={selectedDataset} dataSource={dataSource} telemetryData={telemetryData} />;
        }
        if (activeTab === "detection-rules") {
            return <DetectionRules />;
        }
        if (activeTab === "logs") {
            return <LogManagement dataset={selectedDataset} dataSource={dataSource} telemetryData={telemetryData} />;
        }
        if (activeTab === "reports") {
            return <SecurityReports />;
        }
        if (activeTab === "notifications") {
            return (
                <Notifications 
                    notifications={notifications} 
                    clearNotifications={() => setNotifications([])}
                    markAsRead={(id) => setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))}
                />
            );
        }
        return <PlaceholderView title={data.title} description={data.desc} icon={data.icon} />;
    };

    useEffect(() => {
        setMounted(true);
        if (isMounted && !isAuthenticated) {
            router.push("/login-cinematic");
        }
    }, [isMounted, isAuthenticated, router]);

    useEffect(() => {
        const fetchPorts = async () => {
            try {
                const res = await fetch(`http://localhost:8000/api/network/port-usage?dataset=${selectedDataset}`);
                if (res.ok) {
                    const data = await res.json();
                    setPortData(data.map((item: any) => ({ label: item.name, value: item.count })));
                }
            } catch (err) {}
        };
        const fetchSummary = async () => {
            try {
                const res = await fetch(`http://localhost:8000/api/network/summary?dataset=${selectedDataset}`);
                if (res.ok) setSummaryData(await res.json());
            } catch (err) {}
        };
        const fetchDashboardStats = async () => {
            try {
                const res = await fetch(`http://localhost:8000/api/network/dashboard-stats?dataset=${selectedDataset}`);
                if (res.ok) setDashboardStats(await res.json());
            } catch (err) {}
        };
        const fetchHistoricalFlow = async () => {
            try {
                const res = await fetch(`http://localhost:8000/api/network/traffic-flow?dataset=${selectedDataset}`);
                if (res.ok) setHistoricalFlowData(await res.json());
            } catch (err) {}
        };

        if (role === "admin" || role === "analyst") {
            fetchPorts();
            fetchSummary();
            fetchDashboardStats();
            fetchHistoricalFlow();
            const interval = setInterval(() => {
                fetchPorts();
                fetchSummary();
                fetchDashboardStats();
                fetchHistoricalFlow();
            }, 10000);
            return () => clearInterval(interval);
        }
    }, [role, selectedDataset]);

    // Derived Real Data
    const livePackets = telemetryData.length * 12; // Estimate scale
    const liveAlerts = telemetryData.filter(d => d.threatLevel === "High" || d.threatLevel === "Critical").length * 5;

    const topStatsAdmin = [
        { label: "Total Rows DB", value: dataSource === "historical" ? (dashboardStats.system_health?.ingested_rows?.toLocaleString() || "0") : (livePackets + summaryData.total_packets).toLocaleString(), icon: Server },
        { label: "Data Source", value: dataSource === "historical" ? "MongoDB" : "WebSocket", icon: Database },
        { label: "Anomalies", value: dataSource === "historical" ? (summaryData.total_alerts?.toLocaleString() || "0") : liveAlerts.toString(), icon: Activity },
        { label: "System Latency", value: dashboardStats.system_health?.server_latency || "0ms", icon: Globe },
        { label: "Total Packets", value: dataSource === "historical" ? (summaryData.total_packets?.toLocaleString() || "0") : (livePackets).toString(), icon: Shield },
    ];

    const statsAnalyst = [
        {
            title: "Total Packets Processed",
            value: dataSource === "historical" ? summaryData.total_packets?.toLocaleString() || "0" : livePackets.toLocaleString(),
            change: "Real-time",
            changeType: "positive",
            lastMonth: "Live",
            icon: Activity,
        },
        {
            title: "Threats Blocked",
            value: dataSource === "historical" ? summaryData.total_alerts?.toLocaleString() || "0" : liveAlerts.toLocaleString(),
            change: dataSource === "historical" ? "DB View" : "Live View",
            changeType: "positive",
            lastMonth: "Auto",
            icon: AlertTriangle,
        },
        {
            title: "Targeted Nodes",
            value: dashboardStats.targeted_ips?.length?.toString() || "0",
            change: "DB View",
            changeType: "positive",
            lastMonth: "N/A",
            icon: ShieldAlert,
        },
        {
            title: "Database Status",
            value: dashboardStats.system_health?.database_node || "Unknown",
            change: "Connected",
            changeType: "positive",
            lastMonth: "Online",
            icon: Database,
        }
    ];

    const budgetBreakdown = (dashboardStats.attack_categories || []).slice(0, 5).map((item: any) => ({
        label: item.name,
        value: item.value.toLocaleString(),
        width: `${Math.min(100, Math.max(10, (item.value / (summaryData.total_alerts || 1)) * 100))}%`
    }));

    const topNodes = (dashboardStats.targeted_ips || []).slice(0, 4).map((item: any, i: number) => ({
        id: item.ip,
        location: "External Node",
        load: "N/A",
        revenue: item.hits.toLocaleString() + " hits",
        rating: 5.0 - (i * 0.5)
    }));

    // Area Chart uses Live Telemetry or Historical Data to show bandwidth over time
    const areaData = dataSource === "live"
        ? [...telemetryData].reverse().map((t, i) => ({
            day: i.toString(),
            income: t.bytes,
            expense: t.threatLevel === "High" || t.threatLevel === "Critical" ? t.bytes : 0
        }))
        : historicalFlowData;

    // Derived Live Data for Top Ports
    const currentPortData = dataSource === "live" ? (() => {
        const portCounts: Record<string, number> = {};
        telemetryData.forEach(t => {
            const port = t.dstPort && t.dstPort !== "0" ? t.dstPort : t.srcPort;
            portCounts[port] = (portCounts[port] || 0) + 1;
        });
        return Object.entries(portCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([label, value]) => ({ label: `Port ${label}`, value }));
    })() : portData;

    // Derived Live Data for Threat Distribution
    const currentBudgetBreakdown = dataSource === "live" ? (() => {
        const categories: Record<string, number> = {};
        telemetryData.forEach(t => {
            let label = (t.prediction || "").trim();
            if (label.toLowerCase() === "nan" || label.toLowerCase() === "benign" || label.toLowerCase() === "normal" || !label) {
                return;
            }
            if (label.toLowerCase().includes("dos") || label.toLowerCase().includes("ddos")) {
                label = "DoS / DDoS";
            } else if (label.toLowerCase().includes("web attack")) {
                label = "Web Attack";
            }
            categories[label] = (categories[label] || 0) + 1;
        });
        const totalAlerts = Math.max(1, Object.values(categories).reduce((a, b) => a + b, 0));
        return Object.entries(categories)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([label, value]) => ({
                label,
                value: value.toLocaleString(),
                width: `${Math.min(100, Math.max(10, (value / totalAlerts) * 100))}%`
            }));
    })() : budgetBreakdown;

    // Derived Live Data for Top Active Nodes
    const currentTopNodes = dataSource === "live" ? (() => {
        const ips: Record<string, { hits: number, severity: string }> = {};
        telemetryData.forEach(t => {
            if (t.threatLevel === "High" || t.threatLevel === "Critical" || t.threatLevel === "Medium") {
                if (!ips[t.source]) ips[t.source] = { hits: 0, severity: t.threatLevel };
                ips[t.source].hits += 1;
                // upgrade severity if encountered
                if (t.threatLevel === "Critical") ips[t.source].severity = "Critical";
                if (t.threatLevel === "High" && ips[t.source].severity !== "Critical") ips[t.source].severity = "High";
            }
        });
        return Object.entries(ips)
            .sort((a, b) => b[1].hits - a[1].hits)
            .slice(0, 4)
            .map(([ip, data], i) => ({
                id: ip,
                location: "External Node",
                load: "N/A",
                revenue: data.hits.toLocaleString() + " hits",
                rating: 5.0 - (i * 0.5),
                severity: data.severity
            }));
    })() : topNodes;

    const handleLogout = () => {
        logout();
        router.push("/login-cinematic");
    };

    if (!mounted || !isMounted || !isAuthenticated) {
        return <div className="min-h-screen bg-black" />;
    }

    return (
        <div className="min-h-screen w-full bg-black text-white relative font-sans flex selection:bg-white/20">
            {/* Background Video */}
            <video
                src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260406_094145_4a271a6c-3869-4f1c-8aa7-aeb0cb227994.mp4"
                autoPlay
                loop
                muted
                playsInline
                className="fixed inset-0 w-full h-full object-cover pointer-events-none"
                style={{ zIndex: 0 }}
            />

            {/* Background Blur Overlay for readability */}
            <div
                className="fixed inset-0 backdrop-blur-2xl bg-black/50 pointer-events-none"
                style={{ zIndex: 1 }}
            />

            {/* Sidebar */}
            <CinematicSidebar
                role={role as "admin" | "analyst"}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                onLogout={handleLogout}
            />

            {/* Main Dashboard Content */}
            <main className="relative z-10 flex-1 p-4 sm:p-6 md:p-8 lg:p-12 ml-[280px] w-full h-screen overflow-y-auto">
                {activeTab === "dashboard" ? (
                    <div className="max-w-7xl mx-auto space-y-8">
                        {/* Title Bar */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-blur-fade-up" style={{ animationDelay: "200ms" }}>
                            <div>
                                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                                    {role === "admin" ? "Administrator Command Center" : "Security Analyst Workspace"}
                                </h1>
                                <p className="text-xs sm:text-sm text-gray-400 mt-1">
                                    Real-time threat monitoring and infrastructure telemetry.
                                </p>
                            </div>
                            <div className="flex flex-col sm:flex-row items-center gap-3 self-start sm:self-auto">
                                <button 
                                    onClick={() => setDataSource(prev => prev === "historical" ? "live" : "historical")}
                                    className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-colors ${dataSource === "historical" ? "bg-white/20 text-white border-white/40" : "bg-green-500/20 text-green-400 border-green-500/40"}`}
                                >
                                    Mode: {dataSource === "historical" ? "Historical (DB)" : "Live Stream (WS)"}
                                </button>
                                {dataSource === "historical" && (
                                    <>
                                        <select
                                            value={datasetSource}
                                            className="bg-black/40 text-gray-300 text-xs px-3 py-1.5 rounded-full liquid-glass border border-white/20 outline-none focus:border-white/40 cursor-pointer hover:bg-white/10 transition-colors [&>option]:bg-gray-900 [&>option]:text-white"
                                            onChange={(e) => {
                                                const source = e.target.value as "CICIDS2017" | "UNSW-NB15" | "Live Capture";
                                                setDatasetSource(source);
                                                setSelectedDataset(source === "CICIDS2017" ? "Monday-WorkingHours.pcap_ISCX.csv" : source === "UNSW-NB15" ? "UNSW-NB15_1.csv" : "Live Capture|All Time");
                                            }}
                                        >
                                            <option value="CICIDS2017">CIC-IDS-2017 Dataset</option>
                                            <option value="UNSW-NB15">UNSW-NB15 Dataset</option>
                                            <option value="Live Capture">Live Sniffing Captures (DB)</option>
                                        </select>

                                        {datasetSource === "CICIDS2017" ? (
                                            <select
                                                value={selectedDataset}
                                                className="bg-black/40 text-gray-300 text-xs px-3 py-1.5 rounded-full liquid-glass border border-white/20 outline-none focus:border-white/40 cursor-pointer hover:bg-white/10 transition-colors [&>option]:bg-gray-900 [&>option]:text-white"
                                                onChange={(e) => setSelectedDataset(e.target.value)}
                                            >
                                                <option value="Monday-WorkingHours.pcap_ISCX.csv">Monday (Normal Traffic)</option>
                                                <option value="Tuesday-WorkingHours.pcap_ISCX.csv">Tuesday (Normal Traffic)</option>
                                                <option value="Wednesday-workingHours.pcap_ISCX.csv">Wednesday (Mixed)</option>
                                                <option value="Thursday-WorkingHours-Morning-WebAttacks.pcap_ISCX.csv">Thursday (Web Attacks)</option>
                                                <option value="Thursday-WorkingHours-Afternoon-Infilteration.pcap_ISCX.csv">Thursday (Infiltration)</option>
                                                <option value="Friday-WorkingHours-Morning.pcap_ISCX.csv">Friday (Normal Morning)</option>
                                                <option value="Friday-WorkingHours-Afternoon-PortScan.pcap_ISCX.csv">Friday (PortScan Attack)</option>
                                                <option value="Friday-WorkingHours-Afternoon-DDos.pcap_ISCX.csv">Friday (DDoS Attack)</option>
                                            </select>
                                        ) : datasetSource === "UNSW-NB15" ? (
                                            <select
                                                value={selectedDataset}
                                                className="bg-black/40 text-gray-300 text-xs px-3 py-1.5 rounded-full liquid-glass border border-white/20 outline-none focus:border-white/40 cursor-pointer hover:bg-white/10 transition-colors [&>option]:bg-gray-900 [&>option]:text-white"
                                                onChange={(e) => setSelectedDataset(e.target.value)}
                                            >
                                                <option value="UNSW-NB15_1.csv">Partition 1 (Fuzzers, DoS, Exploits)</option>
                                                <option value="UNSW-NB15_2.csv">Partition 2 (Generic, Backdoors)</option>
                                                <option value="UNSW-NB15_3.csv">Partition 3 (Analysis, Shellcode)</option>
                                                <option value="UNSW-NB15_4.csv">Partition 4 (Worms, Reconnaissance)</option>
                                                <option value="NUSW-NB15_GT.csv">Ground Truth (Normal + Attacks)</option>
                                            </select>
                                        ) : datasetSource === "Live Capture" ? (
                                            <select
                                                value={selectedDataset}
                                                className="bg-black/40 text-gray-300 text-xs px-3 py-1.5 rounded-full liquid-glass border border-white/20 outline-none focus:border-white/40 cursor-pointer hover:bg-white/10 transition-colors [&>option]:bg-gray-900 [&>option]:text-white"
                                                onChange={(e) => setSelectedDataset(e.target.value)}
                                            >
                                                <option value="Live Capture|All Time">All Live Captures (All Time)</option>
                                                <option value="Live Capture|Today">Today</option>
                                                <option value="Live Capture|Last Hour">Last Hour</option>
                                                <option value="Live Capture|Last 10 Minutes">Last 10 Minutes</option>
                                            </select>
                                        ) : null}
                                    </>
                                )}
                                <span className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-full liquid-glass border border-green-500/30 text-green-400 font-medium">
                                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                    Systems Operational
                                </span>
                            </div>
                        </div>

                        {/* ── ANALYST VIEW ─────────────────────────────────────────────────── */}
                        {role === "analyst" && (
                            <div className="space-y-6">
                                {/* Stats Grid */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                                    {statsAnalyst.map((stat, i) => (
                                        <div
                                            key={i}
                                            className="rounded-2xl liquid-glass !bg-black/40 !backdrop-blur-xl p-5 border border-white/10 flex flex-col justify-between animate-blur-fade-up hover:border-white/20 transition-all group"
                                            style={{ animationDelay: `${300 + i * 50}ms` }}
                                        >
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className="w-10 h-10 rounded-xl liquid-glass flex items-center justify-center border border-white/10 group-hover:scale-105 transition-transform">
                                                    <stat.icon className="w-5 h-5 text-white" />
                                                </div>
                                                <h3 className="text-xs sm:text-sm font-medium text-gray-400">{stat.title}</h3>
                                            </div>

                                            <div className="flex items-baseline gap-3 mb-4">
                                                <span className="text-2xl sm:text-3xl font-bold text-white tracking-tight">{stat.value}</span>
                                                <span className="text-xs font-semibold text-green-400 bg-green-950/40 border border-green-500/20 px-2 py-0.5 rounded-full">
                                                    {stat.change}
                                                </span>
                                            </div>

                                            <div className="flex items-center justify-between text-xs text-gray-400 border-t border-white/10 pt-3">
                                                <span><strong className="text-white font-medium">{stat.lastMonth}</strong> vs last month</span>
                                                <ArrowRight className="w-3.5 h-3.5 text-gray-500 group-hover:translate-x-1 transition-transform" />
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <DashboardStatsCharts dataset={selectedDataset} />

                                {/* Charts & Feed */}
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                    <div
                                        className="lg:col-span-2 rounded-2xl liquid-glass !bg-black/40 !backdrop-blur-xl p-6 border border-white/10 animate-blur-fade-up"
                                        style={{ animationDelay: "500ms" }}
                                    >
                                        <div className="flex items-center justify-between mb-6">
                                            <h3 className="text-base sm:text-lg font-bold text-white">Traffic Analytics</h3>
                                            <span className="text-xs font-medium text-gray-400 liquid-glass px-3 py-1.5 rounded-lg border border-white/10">
                                                Live Telemetry
                                            </span>
                                        </div>
                                        {/* Apply dark theme styles to chart wrapper if needed */}
                                        <div className="w-full overflow-hidden text-gray-200">
                                            <AdvancedTrafficChart dataset={selectedDataset} />
                                        </div>
                                    </div>

                                    <div
                                        className="lg:col-span-1 rounded-2xl liquid-glass !bg-black/40 !backdrop-blur-xl p-6 border border-white/10 animate-blur-fade-up overflow-hidden"
                                        style={{ animationDelay: "600ms" }}
                                    >
                                        <AlertFeed dataset={selectedDataset} />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ── ADMIN VIEW ───────────────────────────────────────────────────── */}
                        {role === "admin" && (
                            <div className="space-y-6">
                                {/* Top Horizontal Stats Bar */}
                                <div
                                    className="rounded-2xl liquid-glass !bg-black/40 !backdrop-blur-xl border border-white/10 px-6 py-4 flex items-center gap-4 flex-wrap animate-blur-fade-up"
                                    style={{ animationDelay: "300ms" }}
                                >
                                    {topStatsAdmin.map((s, i) => (
                                        <div key={i} className="flex items-center gap-3 flex-1 min-w-[140px] py-2">
                                            <div className="w-10 h-10 rounded-xl liquid-glass flex items-center justify-center border border-white/10">
                                                <s.icon className="w-5 h-5 text-gray-300 flex-shrink-0" />
                                            </div>
                                            <div>
                                                <p className="text-lg sm:text-xl font-bold text-white leading-none">{s.value}</p>
                                                <p className="text-xs text-gray-400 mt-1">{s.label}</p>
                                            </div>
                                            {i < topStatsAdmin.length - 1 && (
                                                <div className="hidden lg:block w-px h-8 bg-white/10 ml-auto" />
                                            )}
                                        </div>
                                    ))}
                                </div>

                                {/* 3-Column Charts Grid */}
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                    {/* Area Chart */}
                                    <div
                                        className="lg:col-span-1 rounded-2xl liquid-glass !bg-black/40 !backdrop-blur-xl border border-white/10 p-6 flex flex-col justify-between gap-4 animate-blur-fade-up"
                                        style={{ animationDelay: "400ms" }}
                                    >
                                        <div>
                                            <p className="text-3xl font-bold text-white tracking-tight">{areaData.length > 0 ? areaData[areaData.length-1].income : "0"} Bytes</p>
                                            <div className="flex items-center gap-4 mt-2">
                                                <span className="flex items-center gap-1.5 text-xs text-gray-400">
                                                    <span className="w-2 h-2 rounded-full bg-white inline-block" />
                                                    Normal Traffic
                                                </span>
                                                <span className="flex items-center gap-1.5 text-xs text-gray-400">
                                                    <span className="w-2 h-2 rounded-full bg-red-400 inline-block" />
                                                    Threat Traffic
                                                </span>
                                            </div>
                                        </div>
                                        <ResponsiveContainer width="100%" height={180}>
                                            <AreaChart data={areaData} margin={{ top: 5, right: 0, left: -30, bottom: 0 }}>
                                                <defs>
                                                    <linearGradient id="incomeGradCinematic" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#ffffff" stopOpacity={0.4} />
                                                        <stop offset="95%" stopColor="#ffffff" stopOpacity={0} />
                                                    </linearGradient>
                                                    <linearGradient id="expenseGradCinematic" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
                                                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                                    </linearGradient>
                                                </defs>
                                                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#9ca3af" }} />
                                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#9ca3af" }} />
                                                <Tooltip contentStyle={{ background: "#000", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 12, color: "#fff", fontSize: 12 }} />
                                                <Area type="monotone" dataKey="income" stroke="#ffffff" strokeWidth={2} fill="url(#incomeGradCinematic)" dot={false} isAnimationActive={false} />
                                                <Area type="monotone" dataKey="expense" stroke="#ef4444" strokeWidth={2} fill="url(#expenseGradCinematic)" dot={false} isAnimationActive={false} />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>

                                    {/* Bar Chart */}
                                    <div
                                        className="lg:col-span-1 rounded-2xl liquid-glass !bg-black/40 !backdrop-blur-xl border border-white/10 p-6 flex flex-col justify-between gap-4 animate-blur-fade-up"
                                        style={{ animationDelay: "500ms" }}
                                    >
                                        <div className="flex items-center justify-between">
                                            <h3 className="font-bold text-white text-base">Top Port Usage</h3>
                                            <span className="text-xs text-gray-400">Live</span>
                                        </div>
                                        <ResponsiveContainer width="100%" height={190}>
                                            <BarChart data={currentPortData} margin={{ top: 5, right: 0, left: -30, bottom: 0 }}>
                                                <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.05)" />
                                                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#9ca3af" }} />
                                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#9ca3af" }} />
                                                <Tooltip content={<CustomBarTooltip />} cursor={{ fill: "rgba(255,255,255,0.05)" }} />
                                                <Bar
                                                    dataKey="value"
                                                    radius={[4, 4, 0, 0]}
                                                    fill="rgba(255,255,255,0.8)"
                                                    label={false}
                                                />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>

                                    {/* Budget Breakdown */}
                                    <div
                                        className="lg:col-span-1 rounded-2xl liquid-glass !bg-black/40 !backdrop-blur-xl border border-white/10 p-6 flex flex-col gap-4 animate-blur-fade-up"
                                        style={{ animationDelay: "600ms" }}
                                    >
                                        <h3 className="font-bold text-white text-base">Threat Distribution</h3>
                                        {currentBudgetBreakdown.length > 0 ? (
                                            <div className="space-y-4">
                                                {currentBudgetBreakdown.map((item: any, i: number) => (
                                                    <div key={i}>
                                                        <div className="flex justify-between text-xs sm:text-sm mb-1.5">
                                                            <span className="text-gray-400">{item.label}</span>
                                                            <span className="font-semibold text-white">{item.value}</span>
                                                        </div>
                                                        <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                                                            <div
                                                                className="h-full rounded-full bg-red-500 transition-all duration-700 shadow-[0_0_8px_rgba(239,68,68,0.5)]"
                                                                style={{ width: item.width }}
                                                            />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="flex-1 flex flex-col items-center justify-center text-center opacity-50">
                                                <Shield className="w-10 h-10 text-gray-500 mb-2" />
                                                <p className="text-sm font-medium text-gray-400">No Threats Detected</p>
                                                <p className="text-xs text-gray-500">This dataset partition contains only normal traffic.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Bottom Grid: Nodes Table & Tips */}
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                    {/* Nodes Table */}
                                    <div
                                        className="lg:col-span-2 rounded-2xl liquid-glass !bg-black/40 !backdrop-blur-xl border border-white/10 overflow-hidden animate-blur-fade-up"
                                        style={{ animationDelay: "700ms" }}
                                    >
                                        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
                                            <h3 className="font-bold text-white text-base">Top Active Nodes</h3>
                                            <button className="text-xs text-white font-medium liquid-glass border border-white/20 px-3 py-1.5 rounded-lg hover:bg-white/10 transition-colors">
                                                Full Telemetry
                                            </button>
                                        </div>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left text-sm">
                                                <thead>
                                                    <tr className="text-xs text-gray-400 font-normal border-b border-white/10">
                                                        <th className="px-6 py-3">IP Address</th>
                                                        <th className="px-6 py-3">Type</th>
                                                        <th className="px-6 py-3">Hits</th>
                                                        <th className="px-6 py-3">Severity</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {currentTopNodes.length > 0 ? currentTopNodes.map((node: any, i: number) => (
                                                        <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                                            <td className="px-6 py-4">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-8 h-8 rounded-xl liquid-glass flex items-center justify-center border border-white/10">
                                                                        <Server className="w-4 h-4 text-gray-300" />
                                                                    </div>
                                                                    <div>
                                                                        <p className="font-medium text-white text-sm">{node.id}</p>
                                                                        <p className="text-xs text-gray-400">{node.location}</p>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4 font-medium text-gray-300">{node.load}</td>
                                                            <td className="px-6 py-4 font-semibold text-white">{node.revenue}</td>
                                                            <td className="px-6 py-4">
                                                                <span className={`flex items-center gap-1 font-medium text-sm ${node.severity === "Critical" || node.severity === "High" ? "text-red-400" : "text-yellow-400"}`}>
                                                                    <ShieldAlert className="w-3.5 h-3.5" />
                                                                    {node.severity || "High"}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    )) : (
                                                        <tr>
                                                            <td colSpan={4} className="px-6 py-12 text-center text-gray-500 text-sm">
                                                                No active threat nodes detected in this time frame.
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    {/* Optimization Tip Card */}
                                    <div
                                        className="lg:col-span-1 rounded-2xl liquid-glass !bg-black/40 !backdrop-blur-xl border border-white/10 p-6 flex flex-col items-center justify-between gap-4 text-center animate-blur-fade-up"
                                        style={{ animationDelay: "800ms" }}
                                    >
                                        <div className="w-full flex flex-col items-center gap-3 mt-2">
                                            <div className="flex items-end gap-2 h-16">
                                                {[
                                                    { h: "h-12", bg: "bg-white/30" },
                                                    { h: "h-8", bg: "bg-green-400/80" },
                                                    { h: "h-10", bg: "bg-white/50" },
                                                    { h: "h-16", bg: "bg-white" },
                                                ].map((b, idx) => (
                                                    <div key={idx} className={`w-6 rounded-t-lg ${b.h} ${b.bg}`} />
                                                ))}
                                            </div>
                                        </div>
                                        <div>
                                            <p className="font-bold text-white text-base">Infrastructure Optimization</p>
                                            <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                                                Three of your firewall nodes are running above 80% capacity. Consider horizontal scaling to prevent bottlenecks.
                                            </p>
                                        </div>
                                        <button className="w-full bg-white hover:bg-gray-200 text-black text-sm font-semibold py-3 rounded-full transition-all shadow-lg active:scale-95">
                                            VIEW RECOMMENDATIONS
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    renderPlaceholder()
                )}
            </main>

            {/* Active Notification Toast */}
            {toast && (
                <div className={`fixed top-8 right-8 px-6 py-4 rounded-xl shadow-2xl z-50 flex items-start gap-4 animate-in slide-in-from-right-10 max-w-sm ${
                    toast.severity === 'Critical' ? 'bg-red-500/90 text-white' : 
                    toast.severity === 'High' ? 'bg-orange-500/90 text-white' : 'bg-blue-500/90 text-white'
                }`}>
                    {toast.severity === 'Critical' || toast.severity === 'High' ? (
                        <ShieldAlert className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    ) : (
                        <Bell className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    )}
                    <div>
                        <p className="font-bold text-sm mb-1">{toast.severity} Alert</p>
                        <p className="text-sm opacity-90 leading-tight">{toast.message}</p>
                    </div>
                    <button 
                        onClick={() => setToast(null)}
                        className="p-1 hover:bg-white/20 rounded-md transition-colors ml-2 flex-shrink-0"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}
        </div>
    );
}
