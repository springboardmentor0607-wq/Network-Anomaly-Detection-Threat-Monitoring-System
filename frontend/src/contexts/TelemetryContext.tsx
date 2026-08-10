import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface TelemetryPacket {
  event_type: string;
  timestamp: string;
  source_ip: string;
  destination_ip: string;
  protocol: string;
  packets: number;
  bytes: number;
  attack_type: string;
  is_anomaly: boolean;
  anomaly_score: number;
  risk_score: number;
  demo_mode: boolean;
}

export interface ToastAlert {
  id: string;
  title: string;
  message: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  timestamp: string;
}

interface TelemetryContextType {
  demoMode: boolean;
  setDemoMode: (val: boolean) => void;
  audioAlerts: boolean;
  setAudioAlerts: (val: boolean) => void;
  latestPackets: TelemetryPacket[];
  activeAlertsCount: number;
  riskScore: number;
  systemStatus: 'SECURE' | 'LOW RISK' | 'ELEVATED' | 'HIGH RISK' | 'CRITICAL';
  toasts: ToastAlert[];
  dismissToast: (id: string) => void;
}

const TelemetryContext = createContext<TelemetryContextType | undefined>(undefined);

const INITIAL_PACKETS: TelemetryPacket[] = [
  {
    event_type: 'TELEMETRY_PACKET',
    timestamp: new Date().toISOString(),
    source_ip: '42.112.98.14',
    destination_ip: '192.168.1.100',
    protocol: 'TCP',
    packets: 4820,
    bytes: 674800,
    attack_type: 'DoS SYN Flood',
    is_anomaly: true,
    anomaly_score: 0.96,
    risk_score: 94,
    demo_mode: true,
  },
  {
    event_type: 'TELEMETRY_PACKET',
    timestamp: new Date(Date.now() - 4000).toISOString(),
    source_ip: '185.220.101.5',
    destination_ip: '192.168.1.250',
    protocol: 'SSH',
    packets: 1420,
    bytes: 89000,
    attack_type: 'SSH Brute Force',
    is_anomaly: true,
    anomaly_score: 0.91,
    risk_score: 86,
    demo_mode: true,
  },
  {
    event_type: 'TELEMETRY_PACKET',
    timestamp: new Date(Date.now() - 8000).toISOString(),
    source_ip: '192.168.1.45',
    destination_ip: '8.8.8.8',
    protocol: 'HTTPS',
    packets: 120,
    bytes: 4200,
    attack_type: 'Normal',
    is_anomaly: false,
    anomaly_score: 0.04,
    risk_score: 12,
    demo_mode: true,
  },
];

export const TelemetryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [demoMode, setDemoMode] = useState<boolean>(true);
  const [audioAlerts, setAudioAlerts] = useState<boolean>(false);
  const [latestPackets, setLatestPackets] = useState<TelemetryPacket[]>(INITIAL_PACKETS);
  const [toasts, setToasts] = useState<ToastAlert[]>([]);
  const [riskScore, setRiskScore] = useState<number>(45);

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Real-time telemetry simulation interval when DEMO MODE is active
  useEffect(() => {
    if (!demoMode) return;

    const interval = setInterval(() => {
      const isAnomaly = Math.random() < 0.35;
      const attackTypes = ['DoS SYN Flood', 'SSH Brute Force', 'DNS Tunneling', 'Port Scan', 'SQL Injection'];
      const attack_type = isAnomaly ? attackTypes[Math.floor(Math.random() * attackTypes.length)] : 'Normal';
      const srcIps = ['42.112.98.14', '185.220.101.5', '194.26.29.112', '10.0.4.12', '192.168.1.50'];
      const dstIps = ['192.168.1.100', '192.168.1.250', '192.168.1.105', '8.8.8.8'];
      const protocols = ['TCP', 'UDP', 'HTTP', 'HTTPS', 'DNS', 'SSH'];

      const anomaly_score = isAnomaly ? Number((0.75 + Math.random() * 0.23).toFixed(2)) : Number((Math.random() * 0.15).toFixed(2));
      const packet_risk = isAnomaly ? Math.floor(65 + Math.random() * 32) : Math.floor(5 + Math.random() * 20);

      const newPacket: TelemetryPacket = {
        event_type: 'TELEMETRY_PACKET',
        timestamp: new Date().toISOString(),
        source_ip: srcIps[Math.floor(Math.random() * srcIps.length)],
        destination_ip: dstIps[Math.floor(Math.random() * dstIps.length)],
        protocol: protocols[Math.floor(Math.random() * protocols.length)],
        packets: Math.floor(20 + Math.random() * 4000),
        bytes: Math.floor(1000 + Math.random() * 500000),
        attack_type,
        is_anomaly: isAnomaly,
        anomaly_score,
        risk_score: packet_risk,
        demo_mode: true,
      };

      setLatestPackets((prev) => [newPacket, ...prev.slice(0, 49)]);

      if (isAnomaly && packet_risk > 75) {
        setRiskScore((prev) => Math.min(100, Math.max(20, Math.round(prev * 0.9 + packet_risk * 0.1))));
        const toastId = 'toast-' + Date.now();
        const severity = packet_risk > 85 ? 'CRITICAL' : 'HIGH';
        setToasts((prev) => [
          {
            id: toastId,
            title: `${severity} Security Anomaly Detected`,
            message: `${attack_type} detected from ${newPacket.source_ip} (Risk Score: ${packet_risk})`,
            severity,
            timestamp: new Date().toLocaleTimeString(),
          },
          ...prev.slice(0, 4),
        ]);

        if (audioAlerts) {
          try {
            const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const osc = audioCtx.createOscillator();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(880, audioCtx.currentTime);
            osc.connect(audioCtx.destination);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.15);
          } catch (e) {
            // Audio context fallback
          }
        }
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [demoMode, audioAlerts]);

  let systemStatus: 'SECURE' | 'LOW RISK' | 'ELEVATED' | 'HIGH RISK' | 'CRITICAL' = 'ELEVATED';
  if (riskScore <= 20) systemStatus = 'SECURE';
  else if (riskScore <= 40) systemStatus = 'LOW RISK';
  else if (riskScore <= 60) systemStatus = 'ELEVATED';
  else if (riskScore <= 80) systemStatus = 'HIGH RISK';
  else systemStatus = 'CRITICAL';

  return (
    <TelemetryContext.Provider
      value={{
        demoMode,
        setDemoMode,
        audioAlerts,
        setAudioAlerts,
        latestPackets,
        activeAlertsCount: latestPackets.filter((p) => p.is_anomaly).length,
        riskScore,
        systemStatus,
        toasts,
        dismissToast,
      }}
    >
      {children}
    </TelemetryContext.Provider>
  );
};

export const useTelemetry = () => {
  const context = useContext(TelemetryContext);
  if (!context) {
    throw new Error('useTelemetry must be used within TelemetryProvider');
  }
  return context;
};
