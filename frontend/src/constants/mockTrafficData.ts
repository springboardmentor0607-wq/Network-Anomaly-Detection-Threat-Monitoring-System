export interface TrafficFlowRecord {
  id: string;
  timestamp: string;
  source_ip: string;
  destination_ip: string;
  source_port: number;
  destination_port: number;
  protocol: 'TCP' | 'UDP' | 'ICMP' | 'HTTP' | 'HTTPS';
  packets: number;
  bytes: number;
  duration: number;
  anomaly_score: number;
  risk_score: number;
  classification: string;
  status: 'anomalous' | 'benign';
}

export const PROTOCOL_OPTIONS = ['ALL', 'TCP', 'UDP', 'ICMP', 'HTTP', 'HTTPS'];
export const SEVERITY_OPTIONS = ['ALL', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

export const INITIAL_MOCK_FLOWS: TrafficFlowRecord[] = [
  {
    id: 'FLOW-1001',
    timestamp: new Date().toISOString(),
    source_ip: '192.168.1.45',
    destination_ip: '10.0.0.12',
    source_port: 52341,
    destination_port: 443,
    protocol: 'TCP',
    packets: 42,
    bytes: 18432,
    duration: 1.42,
    anomaly_score: 0.82,
    risk_score: 78,
    classification: 'Suspicious',
    status: 'anomalous',
  },
  {
    id: 'FLOW-1002',
    timestamp: new Date(Date.now() - 3000).toISOString(),
    source_ip: '10.0.0.88',
    destination_ip: '172.16.0.4',
    source_port: 41230,
    destination_port: 80,
    protocol: 'TCP',
    packets: 12,
    bytes: 4200,
    duration: 0.28,
    anomaly_score: 0.12,
    risk_score: 15,
    classification: 'Normal Traffic',
    status: 'benign',
  },
  {
    id: 'FLOW-1003',
    timestamp: new Date(Date.now() - 6000).toISOString(),
    source_ip: '203.0.113.24',
    destination_ip: '10.0.0.5',
    source_port: 58912,
    destination_port: 8080,
    protocol: 'UDP',
    packets: 1420,
    bytes: 980400,
    duration: 5.12,
    anomaly_score: 0.94,
    risk_score: 92,
    classification: 'DoS SYN Flood',
    status: 'anomalous',
  },
  {
    id: 'FLOW-1004',
    timestamp: new Date(Date.now() - 9000).toISOString(),
    source_ip: '198.51.100.88',
    destination_ip: '10.0.0.2',
    source_port: 33412,
    destination_port: 22,
    protocol: 'TCP',
    packets: 540,
    bytes: 124000,
    duration: 3.84,
    anomaly_score: 0.88,
    risk_score: 84,
    classification: 'SSH Brute Force',
    status: 'anomalous',
  },
  {
    id: 'FLOW-1005',
    timestamp: new Date(Date.now() - 12000).toISOString(),
    source_ip: '192.168.1.110',
    destination_ip: '8.8.8.8',
    source_port: 53210,
    destination_port: 53,
    protocol: 'UDP',
    packets: 2,
    bytes: 148,
    duration: 0.04,
    anomaly_score: 0.05,
    risk_score: 8,
    classification: 'DNS Query',
    status: 'benign',
  },
];

export function generateRandomFlow(): TrafficFlowRecord {
  const isAnomaly = Math.random() < 0.25; // 25% chance of anomaly in stream
  const protocols: ('TCP' | 'UDP' | 'ICMP' | 'HTTP' | 'HTTPS')[] = ['TCP', 'UDP', 'ICMP', 'HTTP', 'HTTPS'];
  const srcIPs = ['192.168.1.45', '203.0.113.24', '198.51.100.88', '10.0.0.15', '45.33.32.156', '172.16.4.12'];
  const dstIPs = ['10.0.0.5', '10.0.0.12', '10.0.0.20', '10.0.0.1', '172.16.0.4'];
  const dstPorts = [80, 443, 22, 53, 8080, 3389, 21];

  const srcIp = srcIPs[Math.floor(Math.random() * srcIPs.length)];
  const dstIp = dstIPs[Math.floor(Math.random() * dstIPs.length)];
  const proto = protocols[Math.floor(Math.random() * protocols.length)];
  const dstPort = dstPorts[Math.floor(Math.random() * dstPorts.length)];

  const anomalyScore = isAnomaly ? parseFloat((0.65 + Math.random() * 0.33).toFixed(2)) : parseFloat((Math.random() * 0.3).toFixed(2));
  const riskScore = isAnomaly ? Math.floor(60 + Math.random() * 39) : Math.floor(Math.random() * 35);
  const classifications = isAnomaly
    ? ['Suspicious Spike', 'DoS Vector', 'Port Scan', 'Reconnaissance', 'Exploit Payload']
    : ['Benign Flow', 'HTTP GET', 'TLS Session', 'DNS Lookup'];

  return {
    id: `FLOW-${Math.floor(1000 + Math.random() * 9000)}`,
    timestamp: new Date().toISOString(),
    source_ip: srcIp,
    destination_ip: dstIp,
    source_port: Math.floor(1024 + Math.random() * 60000),
    destination_port: dstPort,
    protocol: proto,
    packets: isAnomaly ? Math.floor(200 + Math.random() * 2000) : Math.floor(2 + Math.random() * 50),
    bytes: isAnomaly ? Math.floor(50000 + Math.random() * 1500000) : Math.floor(100 + Math.random() * 15000),
    duration: parseFloat((Math.random() * 4.5).toFixed(2)),
    anomaly_score: anomalyScore,
    risk_score: riskScore,
    classification: classifications[Math.floor(Math.random() * classifications.length)],
    status: isAnomaly ? 'anomalous' : 'benign',
  };
}
