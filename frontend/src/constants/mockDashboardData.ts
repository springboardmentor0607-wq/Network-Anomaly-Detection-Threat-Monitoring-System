export interface TrafficDataPoint {
  time: string;
  totalFlows: number;
  anomalies: number;
  bandwidthMbps: number;
}

export interface AttackDistributionItem {
  name: string;
  value: number;
  color: string;
}

export interface ProtocolItem {
  protocol: string;
  flows: number;
  percentage: number;
}

export interface SeverityItem {
  severity: string;
  count: number;
  color: string;
}

export interface MockAlert {
  id: string;
  alert_id: string;
  timestamp: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  type: string;
  source_ip: string;
  destination_ip: string;
  risk_score: number;
  assigned_to: string;
  status: 'NEW' | 'ACKNOWLEDGED' | 'INVESTIGATING' | 'RESOLVED';
}

export interface MockSuspiciousIP {
  ip: string;
  country: string;
  countryCode: string;
  threatScore: number;
  attackCount: number;
  primaryAttack: string;
}

export interface MockIncident {
  id: string;
  incident_id: string;
  title: string;
  severity: 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
  owner: string;
  alert_count: number;
  created_at: string;
}

export const MOCK_TRAFFIC_TIMELINE: TrafficDataPoint[] = [
  { time: '00:00', totalFlows: 4200, anomalies: 32, bandwidthMbps: 120 },
  { time: '02:00', totalFlows: 3800, anomalies: 18, bandwidthMbps: 105 },
  { time: '04:00', totalFlows: 3100, anomalies: 14, bandwidthMbps: 85 },
  { time: '06:00', totalFlows: 4900, anomalies: 45, bandwidthMbps: 140 },
  { time: '08:00', totalFlows: 8500, anomalies: 128, bandwidthMbps: 310 },
  { time: '10:00', totalFlows: 12400, anomalies: 215, bandwidthMbps: 480 },
  { time: '12:00', totalFlows: 14800, anomalies: 340, bandwidthMbps: 560 },
  { time: '14:00', totalFlows: 16200, anomalies: 410, bandwidthMbps: 620 },
  { time: '16:00', totalFlows: 15100, anomalies: 290, bandwidthMbps: 590 },
  { time: '18:00', totalFlows: 11300, anomalies: 175, bandwidthMbps: 410 },
  { time: '20:00', totalFlows: 7900, anomalies: 88, bandwidthMbps: 260 },
  { time: '22:00', totalFlows: 5600, anomalies: 48, bandwidthMbps: 180 },
];

export const MOCK_ATTACK_DISTRIBUTION: AttackDistributionItem[] = [
  { name: 'DoS / DDoS', value: 42, color: '#EF4444' },
  { name: 'Port Scan', value: 24, color: '#F59E0B' },
  { name: 'Brute Force', value: 16, color: '#06B6D4' },
  { name: 'Web Attack', value: 10, color: '#A855F7' },
  { name: 'Exploits', value: 8, color: '#3B82F6' },
];

export const MOCK_PROTOCOL_DISTRIBUTION: ProtocolItem[] = [
  { protocol: 'TCP', flows: 94820, percentage: 66.4 },
  { protocol: 'UDP', flows: 38400, percentage: 26.8 },
  { protocol: 'ICMP', flows: 6830, percentage: 4.8 },
  { protocol: 'HTTP/HTTPS', flows: 2800, percentage: 2.0 },
];

export const MOCK_SEVERITY_DISTRIBUTION: SeverityItem[] = [
  { severity: 'Low (0-29)', count: 842, color: '#10B981' },
  { severity: 'Medium (30-59)', count: 312, color: '#F59E0B' },
  { severity: 'High (60-79)', count: 114, color: '#F97316' },
  { severity: 'Critical (80-100)', count: 38, color: '#EF4444' },
];

export const MOCK_RECENT_ALERTS: MockAlert[] = [
  {
    id: '1',
    alert_id: 'ALT-2026-0094',
    timestamp: '2 mins ago',
    severity: 'CRITICAL',
    type: 'SYN Flood DDoS Attack',
    source_ip: '203.0.113.24',
    destination_ip: '10.0.0.5',
    risk_score: 94,
    assigned_to: 'Lead Analyst',
    status: 'NEW',
  },
  {
    id: '2',
    alert_id: 'ALT-2026-0093',
    timestamp: '8 mins ago',
    severity: 'HIGH',
    type: 'SSH Brute Force Attempt',
    source_ip: '198.51.100.88',
    destination_ip: '10.0.0.12',
    risk_score: 78,
    assigned_to: 'Unassigned',
    status: 'INVESTIGATING',
  },
  {
    id: '3',
    alert_id: 'ALT-2026-0092',
    timestamp: '15 mins ago',
    severity: 'CRITICAL',
    type: 'SQL Injection Exfiltration',
    source_ip: '192.168.1.105',
    destination_ip: '10.0.0.20',
    risk_score: 88,
    assigned_to: 'SOC Manager User',
    status: 'ACKNOWLEDGED',
  },
  {
    id: '4',
    alert_id: 'ALT-2026-0091',
    timestamp: '32 mins ago',
    severity: 'MEDIUM',
    type: 'Reconnaissance Port Scan',
    source_ip: '45.33.32.156',
    destination_ip: '10.0.0.1',
    risk_score: 54,
    assigned_to: 'Lead Analyst',
    status: 'RESOLVED',
  },
];

export const MOCK_SUSPICIOUS_IPS: MockSuspiciousIP[] = [
  { ip: '203.0.113.24', country: 'Russian Federation', countryCode: 'RU', threatScore: 94, attackCount: 1420, primaryAttack: 'DDoS' },
  { ip: '198.51.100.88', country: 'China', countryCode: 'CN', threatScore: 78, attackCount: 840, primaryAttack: 'Brute Force' },
  { ip: '45.33.32.156', country: 'United States', countryCode: 'US', threatScore: 68, attackCount: 512, primaryAttack: 'Port Scan' },
  { ip: '185.220.101.5', country: 'Germany (Tor Exit)', countryCode: 'DE', threatScore: 82, attackCount: 690, primaryAttack: 'Web Attack' },
];

export const MOCK_INCIDENTS: MockIncident[] = [
  {
    id: '1',
    incident_id: 'INC-2026-0012',
    title: 'Distributed Denial of Service on Core Auth Gateway',
    severity: 'CRITICAL',
    status: 'IN_PROGRESS',
    owner: 'SOC Manager User',
    alert_count: 8,
    created_at: '25 mins ago',
  },
  {
    id: '2',
    incident_id: 'INC-2026-0011',
    title: 'Credential Stuffing Outbreak on Internal Subnet',
    severity: 'HIGH',
    status: 'OPEN',
    owner: 'Lead Security Analyst',
    alert_count: 5,
    created_at: '2 hours ago',
  },
];
