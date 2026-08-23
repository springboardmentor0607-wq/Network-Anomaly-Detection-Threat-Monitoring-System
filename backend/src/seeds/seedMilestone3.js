const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const connectDB = require('../config/db');
const Alert = require('../models/Alert');
const Incident = require('../models/Incident');
const Notification = require('../models/Notification');
const ThreatIntelligence = require('../models/ThreatIntelligence');
const Report = require('../models/Report');
const User = require('../models/User');

const seedData = async () => {
  try {
    await connectDB();
    console.log('Seeding Milestone 3 DEMO Data...');

    // 1. Ensure Demo Users exist with valid password 'password123'
    let admin = await User.findOne({ email: 'admin@netshield.ai' });
    if (!admin) {
      admin = await User.create({
        name: 'Security Administrator',
        email: 'admin@netshield.ai',
        password: 'password123',
        role: 'admin',
        status: 'active'
      });
    } else {
      admin.password = 'password123';
      await admin.save();
    }

    let analyst = await User.findOne({ email: 'analyst@netshield.ai' });
    if (!analyst) {
      analyst = await User.create({
        name: 'Senior SOC Analyst',
        email: 'analyst@netshield.ai',
        password: 'password123',
        role: 'analyst',
        status: 'active'
      });
    } else {
      analyst.password = 'password123';
      await analyst.save();
    }

    // 2. Clear old demo records
    await Promise.all([
      Alert.deleteMany({ isDemoData: true }),
      Incident.deleteMany({ isDemoData: true }),
      Notification.deleteMany({ isDemoData: true }),
      ThreatIntelligence.deleteMany({ isDemoData: true }),
      Report.deleteMany({ isDemoData: true })
    ]);

    // 3. Seed Alerts
    const alertsToSeed = [
      {
        alertId: 'ALT-1001',
        timestamp: new Date(Date.now() - 15 * 60 * 1000),
        sourceIp: '192.168.1.108',
        destinationIp: '10.0.0.15',
        sourcePort: 54120,
        destinationPort: 80,
        protocol: 'TCP',
        attackType: 'DDoS',
        category: 'Volumetric DDoS Attack',
        severity: 'CRITICAL',
        confidenceScore: 0.98,
        riskScore: 94,
        modelUsed: 'Random Forest',
        status: 'INVESTIGATING',
        assignedTo: analyst._id.toString(),
        assignedToName: analyst.name,
        incidentId: 'INC-2001',
        description: 'High-volume HTTP flood targeting web application gateway. Peak rate 1.45 Gbps.',
        recommendation: 'Implement upstream BGP flowspec rate-limiting and deploy WAF mitigation rules.',
        occurrenceCount: 1420,
        isDemoData: true
      },
      {
        alertId: 'ALT-1002',
        timestamp: new Date(Date.now() - 45 * 60 * 1000),
        sourceIp: '192.168.1.120',
        destinationIp: '10.0.0.8',
        sourcePort: 48920,
        destinationPort: 22,
        protocol: 'TCP',
        attackType: 'SSH-Patator',
        category: 'Brute Force Intrusion',
        severity: 'HIGH',
        confidenceScore: 0.94,
        riskScore: 78,
        modelUsed: 'XGBoost',
        status: 'ACKNOWLEDGED',
        assignedTo: analyst._id.toString(),
        assignedToName: analyst.name,
        incidentId: 'INC-2002',
        description: 'Repeated SSH login failures using password dictionary dictionary_en.txt.',
        recommendation: 'Enforce SSH key-based authentication and block offending source IP range.',
        occurrenceCount: 350,
        isDemoData: true
      },
      {
        alertId: 'ALT-1003',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        sourceIp: '192.168.1.105',
        destinationIp: '10.0.0.22',
        sourcePort: 33412,
        destinationPort: 443,
        protocol: 'TCP',
        attackType: 'PortScan',
        category: 'Reconnaissance',
        severity: 'MEDIUM',
        confidenceScore: 0.91,
        riskScore: 62,
        modelUsed: 'Random Forest',
        status: 'NEW',
        assignedTo: null,
        description: 'Sequential TCP SYN scanning across ports 1-1024 detected.',
        recommendation: 'Audit exposed ports, restrict ingress access, and update firewall ACLs.',
        occurrenceCount: 1024,
        isDemoData: true
      },
      {
        alertId: 'ALT-1004',
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
        sourceIp: '192.168.1.150',
        destinationIp: '10.0.0.4',
        sourcePort: 51290,
        destinationPort: 8080,
        protocol: 'TCP',
        attackType: 'DoS Hulk',
        category: 'Denial of Service',
        severity: 'HIGH',
        confidenceScore: 0.96,
        riskScore: 85,
        modelUsed: 'Random Forest',
        status: 'RESOLVED',
        assignedTo: admin._id.toString(),
        assignedToName: admin.name,
        incidentId: 'INC-2003',
        description: 'HTTP GET flooding with obfuscated user-agent headers.',
        recommendation: 'Rate-limit request URI queries and block IP on web gateway.',
        occurrenceCount: 890,
        isDemoData: true
      },
      {
        alertId: 'ALT-1005',
        timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000),
        sourceIp: '192.168.1.199',
        destinationIp: '10.0.0.12',
        sourcePort: 60124,
        destinationPort: 4444,
        protocol: 'UDP',
        attackType: 'Botnet',
        category: 'Command & Control',
        severity: 'CRITICAL',
        confidenceScore: 0.97,
        riskScore: 92,
        modelUsed: 'Isolation Forest',
        status: 'CLOSED',
        assignedTo: analyst._id.toString(),
        assignedToName: analyst.name,
        incidentId: 'INC-2004',
        description: 'Outbound UDP beacons to known C2 server infrastructure.',
        recommendation: 'Isolate host host-12 immediately, run malware remediation, and revoke domain credentials.',
        occurrenceCount: 45,
        isDemoData: true
      }
    ];

    await Alert.insertMany(alertsToSeed);

    // 4. Seed Incidents
    const incidentsToSeed = [
      {
        incidentId: 'INC-2001',
        title: 'Critical Distributed Denial of Service (DDoS) Attack',
        description: 'Sustained 1.45 Gbps HTTP flood targeting enterprise public portal.',
        severity: 'CRITICAL',
        priority: 'CRITICAL',
        status: 'INVESTIGATING',
        assignedTo: analyst._id.toString(),
        assignedToName: analyst.name,
        team: 'Tier-1 SOC',
        relatedAlerts: ['ALT-1001'],
        attackTypes: ['DDoS'],
        affectedAssets: ['Enterprise Web Portal (10.0.0.15)', 'Inbound Edge Router'],
        sourceIps: ['192.168.1.108', '192.168.1.109'],
        destinationIps: ['10.0.0.15'],
        timeline: [
          { timestamp: new Date(Date.now() - 15 * 60 * 1000), action: 'INCIDENT_CREATED', user: 'System', details: 'Triggered by ALT-1001' },
          { timestamp: new Date(Date.now() - 12 * 60 * 1000), action: 'ASSIGNED', user: admin.name, details: `Assigned to ${analyst.name}` },
          { timestamp: new Date(Date.now() - 8 * 60 * 1000), action: 'STATUS_INVESTIGATING', user: analyst.name, details: 'Enabled BGP Flowspec filter rules' }
        ],
        notes: [
          { timestamp: new Date(Date.now() - 7 * 60 * 1000), user: analyst.name, note: 'BGP Flowspec activated. Traffic volume dropping to baseline.' }
        ],
        isDemoData: true
      },
      {
        incidentId: 'INC-2002',
        title: 'SSH Dictionary Brute Force Intrusion Attempt',
        description: 'Brute force credential stuffing against internal SSH jump host.',
        severity: 'HIGH',
        priority: 'HIGH',
        status: 'ACKNOWLEDGED',
        assignedTo: analyst._id.toString(),
        assignedToName: analyst.name,
        team: 'Tier-1 SOC',
        relatedAlerts: ['ALT-1002'],
        attackTypes: ['SSH-Patator'],
        affectedAssets: ['SSH Jump Gateway (10.0.0.8)'],
        sourceIps: ['192.168.1.120'],
        destinationIps: ['10.0.0.8'],
        timeline: [
          { timestamp: new Date(Date.now() - 45 * 60 * 1000), action: 'INCIDENT_CREATED', user: 'System', details: 'Triggered by ALT-1002' },
          { timestamp: new Date(Date.now() - 40 * 60 * 1000), action: 'ASSIGNED', user: analyst.name, details: `Self-assigned by ${analyst.name}` }
        ],
        notes: [
          { timestamp: new Date(Date.now() - 35 * 60 * 1000), user: analyst.name, note: 'Fail2ban rule deployed blocking 192.168.1.120 for 24h.' }
        ],
        isDemoData: true
      },
      {
        incidentId: 'INC-2003',
        title: 'Application Denial of Service (DoS Hulk)',
        description: 'Obfuscated HTTP GET query flooding causing web server thread exhaustion.',
        severity: 'HIGH',
        priority: 'MEDIUM',
        status: 'RESOLVED',
        assignedTo: admin._id.toString(),
        assignedToName: admin.name,
        team: 'SOC Core',
        relatedAlerts: ['ALT-1004'],
        attackTypes: ['DoS Hulk'],
        affectedAssets: ['Internal API Gateway (10.0.0.4)'],
        sourceIps: ['192.168.1.150'],
        destinationIps: ['10.0.0.4'],
        timeline: [
          { timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), action: 'INCIDENT_CREATED', user: 'System', details: 'Triggered by ALT-1004' },
          { timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), action: 'STATUS_RESOLVED', user: admin.name, details: 'Applied WAF rate limits' }
        ],
        notes: [
          { timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), user: admin.name, note: 'Web server connection pool restored to 100% capacity.' }
        ],
        resolvedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        isDemoData: true
      }
    ];

    await Incident.insertMany(incidentsToSeed);

    // 5. Seed Notifications
    const notificationsToSeed = [
      {
        notificationId: 'NOTIF-3001',
        userId: 'ALL',
        type: 'CRITICAL_ALERT',
        title: 'Critical Threat Alert: DDoS Attack',
        message: 'High risk attack detected from 192.168.1.108 to 10.0.0.15:80. Risk Score: 94/100',
        severity: 'CRITICAL',
        relatedAlert: 'ALT-1001',
        read: false,
        isDemoData: true
      },
      {
        notificationId: 'NOTIF-3002',
        userId: analyst._id.toString(),
        type: 'INCIDENT_ASSIGNMENT',
        title: 'Incident Assigned: INC-2001',
        message: 'You have been assigned to incident Critical Distributed Denial of Service (DDoS) Attack',
        severity: 'CRITICAL',
        relatedIncident: 'INC-2001',
        read: false,
        isDemoData: true
      },
      {
        notificationId: 'NOTIF-3003',
        userId: analyst._id.toString(),
        type: 'HIGH_ALERT',
        title: 'High Severity Alert: SSH-Patator',
        message: 'Brute force SSH attempt from 192.168.1.120 targeting host 10.0.0.8',
        severity: 'HIGH',
        relatedAlert: 'ALT-1002',
        read: true,
        isDemoData: true
      }
    ];

    await Notification.insertMany(notificationsToSeed);

    // 6. Seed Threat Intelligence
    const intelToSeed = [
      {
        intelId: 'INTEL-5001',
        indicatorValue: '192.168.1.108',
        type: 'IP',
        category: 'DDoS Botnet Node',
        threatLevel: 'CRITICAL',
        confidence: 98,
        description: 'Known Mirai variant C2 proxy participating in HTTP flood attacks.',
        firstObserved: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        lastObserved: new Date(),
        occurrenceCount: 1420,
        targetIndustries: ['Enterprise Web Services', 'Financial Systems'],
        mitigation: 'Block IP at edge firewall and drop all inbound TCP 80/443 requests.',
        isExternalEnriched: true,
        source: 'Internal Telemetry Observed + Enriched via AbuseIPDB & VirusTotal',
        rawTelemetryStats: { totalPackets: 154200, attackVector: 'DDoS' },
        isDemoData: true
      },
      {
        intelId: 'INTEL-5002',
        indicatorValue: '192.168.1.120',
        type: 'IP',
        category: 'SSH Brute-Force Host',
        threatLevel: 'HIGH',
        confidence: 94,
        description: 'Automated SSH dictionary attack source targeting port 22.',
        firstObserved: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        lastObserved: new Date(Date.now() - 45 * 60 * 1000),
        occurrenceCount: 350,
        targetIndustries: ['Linux Cloud Hosts', 'DevOps Infrastructure'],
        mitigation: 'Deploy Fail2ban rule and restrict SSH ingress to authorized IP subnets.',
        isExternalEnriched: false,
        source: 'Internal Telemetry Observed',
        rawTelemetryStats: { totalPackets: 4500, attackVector: 'SSH-Patator' },
        isDemoData: true
      },
      {
        intelId: 'INTEL-5003',
        indicatorValue: '192.168.1.105',
        type: 'IP',
        category: 'Reconnaissance Scanner',
        threatLevel: 'MEDIUM',
        confidence: 88,
        description: 'Massport / Nmap SYN scanner identifying open web & database ports.',
        firstObserved: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        lastObserved: new Date(Date.now() - 2 * 60 * 60 * 1000),
        occurrenceCount: 1024,
        targetIndustries: ['Corporate Networks'],
        mitigation: 'Enable TCP SYN cookies and close unused public listening ports.',
        isExternalEnriched: true,
        source: 'Internal Telemetry Observed + Enriched via AlienVault OTX',
        rawTelemetryStats: { totalPackets: 12000, attackVector: 'PortScan' },
        isDemoData: true
      }
    ];

    await ThreatIntelligence.insertMany(intelToSeed);

    console.log('✅ Milestone 3 DEMO Data Seeded Successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Seed Milestone 3 error:', err);
    process.exit(1);
  }
};

seedData();
