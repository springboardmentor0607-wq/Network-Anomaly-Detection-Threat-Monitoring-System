const Alert = require('../models/Alert');
const AuditLog = require('../models/AuditLog');
const notificationService = require('./notificationService');

const VALID_TRANSITIONS = {
  DETECTED: ['NEW', 'ACKNOWLEDGED', 'CLOSED'],
  NEW: ['ACKNOWLEDGED', 'INVESTIGATING', 'CLOSED'],
  ACKNOWLEDGED: ['INVESTIGATING', 'RESOLVED', 'CLOSED'],
  INVESTIGATING: ['RESOLVED', 'CLOSED'],
  RESOLVED: ['CLOSED', 'INVESTIGATING'],
  CLOSED: []
};

const ATTACK_RECOMMENDATIONS = {
  DDoS: 'Implement upstream BGP flowspec rate-limiting, deploy Web Application Firewall (WAF) rate limits, and block offending traffic vectors.',
  'DoS Hulk': 'Enable HTTP connection throttling, inspect Web server connection pools, and apply IP-based rate limiting.',
  DoS: 'Apply strict SYN-cookie protection and rate-limit suspicious ICMP/UDP flows at border routers.',
  PortScan: 'Audit exposed network ports, enable automated port-scan block rules, and verify firewall ingress policies.',
  'SSH-Patator': 'Enforce SSH key-based authentication, configure fail2ban login thresholds, and restrict SSH ingress to VPN subnets.',
  'Brute Force': 'Enforce multi-factor authentication (MFA), lock out accounts after 5 failed attempts, and block brute-force IP ranges.',
  Botnet: 'Isolate compromised host immediately, initiate endpoint anti-malware scan, and block Command & Control (C2) domains.',
  'Web Attack': 'Inspect HTTP payload for SQLi/XSS injection patterns, enable WAF inspection, and patch web application vulnerabilities.',
  Infiltration: 'Quarantine affected network segment, execute forensic memory dump, and revoke active domain credentials.',
  Heartbleed: 'Patch OpenSSL library immediately, revoke and reissue SSL/TLS certificates, and reset user passwords.'
};

const calculateSeverity = (riskScore, confidenceScore = 0.9, attackType = '', occurrenceCount = 1) => {
  const normAttack = attackType.trim();
  if (riskScore >= 85 || ['DDoS', 'Heartbleed', 'Infiltration', 'Botnet'].includes(normAttack)) {
    return 'CRITICAL';
  }
  if (riskScore >= 65 || ['DoS', 'DoS Hulk', 'Brute Force', 'SSH-Patator'].includes(normAttack)) {
    return 'HIGH';
  }
  if (riskScore >= 40 || ['PortScan', 'Web Attack'].includes(normAttack)) {
    return 'MEDIUM';
  }
  if (riskScore >= 20) {
    return 'LOW';
  }
  return 'INFO';
};

const processPrediction = async (predictionData) => {
  try {
    const {
      sourceIp = '192.168.1.100',
      destinationIp = '10.0.0.15',
      sourcePort = 49152,
      destinationPort = 80,
      protocol = 'TCP',
      attackType = 'DoS Hulk',
      category = 'Network Intrusion',
      riskScore = 85,
      confidenceScore = 0.95,
      modelUsed = 'Random Forest',
      description = ''
    } = predictionData;

    // Ignore benign traffic unless explicit warning requested
    if (attackType === 'BENIGN' || attackType === 'Normal') {
      return null;
    }

    const severity = calculateSeverity(riskScore, confidenceScore, attackType);

    // Deduplication check: 5-minute correlation window for active alerts
    const correlationWindow = new Date(Date.now() - 5 * 60 * 1000);
    let alert = await Alert.findOne({
      sourceIp,
      destinationIp,
      attackType,
      status: { $in: ['NEW', 'ACKNOWLEDGED', 'INVESTIGATING'] },
      lastDetectedAt: { $gte: correlationWindow }
    });

    let isNewAlert = false;
    if (alert) {
      alert.occurrenceCount += 1;
      alert.lastDetectedAt = new Date();
      alert.confidenceScore = Math.max(alert.confidenceScore, confidenceScore);
      alert.riskScore = Math.max(alert.riskScore, riskScore);
      alert.severity = calculateSeverity(alert.riskScore, alert.confidenceScore, alert.attackType, alert.occurrenceCount);
      await alert.save();
    } else {
      isNewAlert = true;
      const alertId = `ALT-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
      const recommendation = ATTACK_RECOMMENDATIONS[attackType] || 'Investigate source IP telemetry, block suspicious traffic, and update security rules.';

      alert = await Alert.create({
        alertId,
        timestamp: new Date(),
        sourceIp,
        destinationIp,
        sourcePort,
        destinationPort,
        protocol,
        attackType,
        category,
        severity,
        confidenceScore,
        riskScore,
        modelUsed,
        status: 'NEW',
        description: description || `Suspicious ${attackType} pattern detected from ${sourceIp} targeting ${destinationIp}:${destinationPort}`,
        recommendation,
        firstDetectedAt: new Date(),
        lastDetectedAt: new Date(),
        occurrenceCount: 1
      });
    }

    // Publish notification ONLY for NEW CRITICAL or HIGH alerts to avoid spamming duplicate notifications
    if (isNewAlert && ['CRITICAL', 'HIGH'].includes(alert.severity)) {
      await notificationService.createNotification({
        type: alert.severity === 'CRITICAL' ? 'CRITICAL_ALERT' : 'HIGH_ALERT',
        title: `${alert.severity} Alert: ${alert.attackType}`,
        message: `High risk attack detected from ${alert.sourceIp} to ${alert.destinationIp}:${alert.destinationPort}. Risk Score: ${alert.riskScore}/100`,
        severity: alert.severity,
        relatedAlert: alert.alertId
      });
    }

    return alert;
  } catch (err) {
    console.error('alertService.processPrediction error:', err);
    throw err;
  }
};

const getAlerts = async (query = {}) => {
  const page = parseInt(query.page) || 1;
  const limit = parseInt(query.limit) || 10;
  const skip = (page - 1) * limit;

  const filter = {};

  if (query.severity) {
    filter.severity = query.severity.toUpperCase();
  }
  if (query.status) {
    filter.status = query.status.toUpperCase();
  }
  if (query.attackType) {
    filter.attackType = new RegExp(query.attackType, 'i');
  }
  if (query.sourceIp) {
    filter.sourceIp = new RegExp(query.sourceIp, 'i');
  }
  if (query.search) {
    const searchRegex = new RegExp(query.search, 'i');
    filter.$or = [
      { alertId: searchRegex },
      { attackType: searchRegex },
      { sourceIp: searchRegex },
      { destinationIp: searchRegex },
      { description: searchRegex }
    ];
  }
  if (query.dateFrom || query.dateTo) {
    filter.timestamp = {};
    if (query.dateFrom) filter.timestamp.$gte = new Date(query.dateFrom);
    if (query.dateTo) filter.timestamp.$lte = new Date(query.dateTo);
  }

  const sort = {};
  if (query.sortBy) {
    sort[query.sortBy] = query.sortOrder === 'asc' ? 1 : -1;
  } else {
    sort.timestamp = -1;
  }

  const [data, total] = await Promise.all([
    Alert.find(filter).sort(sort).skip(skip).limit(limit).lean(),
    Alert.countDocuments(filter)
  ]);

  // Aggregate global counts for summary cards
  const summaryAgg = await Alert.aggregate([
    {
      $group: {
        _id: '$severity',
        count: { $sum: 1 }
      }
    }
  ]);

  const summary = {
    total: await Alert.countDocuments(),
    CRITICAL: 0,
    HIGH: 0,
    MEDIUM: 0,
    LOW: 0,
    INFO: 0,
    unresolved: await Alert.countDocuments({ status: { $in: ['NEW', 'ACKNOWLEDGED', 'INVESTIGATING'] } }),
    resolved: await Alert.countDocuments({ status: { $in: ['RESOLVED', 'CLOSED'] } })
  };

  summaryAgg.forEach(item => {
    if (summary[item._id] !== undefined) {
      summary[item._id] = item.count;
    }
  });

  return {
    data,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
    summary
  };
};

const getAlertById = async (alertId) => {
  const alert = await Alert.findOne({ alertId }).lean();
  if (!alert) {
    throw new Error(`Alert with ID ${alertId} not found`);
  }
  return alert;
};

const updateAlertStatus = async (alertId, newStatus, user = {}) => {
  const alert = await Alert.findOne({ alertId });
  if (!alert) {
    throw new Error(`Alert ${alertId} not found`);
  }

  const currentStatus = alert.status;
  const allowed = VALID_TRANSITIONS[currentStatus] || [];

  if (!allowed.includes(newStatus)) {
    throw new Error(`Invalid status transition from ${currentStatus} to ${newStatus}. Allowed: ${allowed.join(', ')}`);
  }

  alert.status = newStatus;
  await alert.save();

  // Log in AuditLog
  await AuditLog.create({
    userId: user.id || user._id || 'system',
    userEmail: user.email || 'system@netshield.ai',
    action: 'ALERT_STATUS_UPDATE',
    details: `Alert ${alertId} status changed from ${currentStatus} to ${newStatus}`,
    severity: newStatus === 'RESOLVED' || newStatus === 'CLOSED' ? 'info' : 'warning'
  });

  return alert;
};

const assignAlert = async (alertId, assignedTo, assignedToName, user = {}) => {
  const alert = await Alert.findOne({ alertId });
  if (!alert) {
    throw new Error(`Alert ${alertId} not found`);
  }

  alert.assignedTo = assignedTo;
  alert.assignedToName = assignedToName || assignedTo;
  if (alert.status === 'NEW') {
    alert.status = 'ACKNOWLEDGED';
  }
  await alert.save();

  await AuditLog.create({
    userId: user.id || user._id || 'system',
    userEmail: user.email || 'system@netshield.ai',
    action: 'ALERT_ASSIGNMENT',
    details: `Alert ${alertId} assigned to ${assignedToName || assignedTo}`,
    severity: 'info'
  });

  // Also send a notification to the assigned analyst
  await notificationService.createNotification({
    userId: assignedTo,
    type: 'INCIDENT_ASSIGNMENT',
    title: `Alert Assigned: ${alert.alertId}`,
    message: `You have been assigned to alert ${alert.alertId} (${alert.attackType})`,
    severity: alert.severity,
    relatedAlert: alert.alertId
  });

  return alert;
};

module.exports = {
  calculateSeverity,
  processPrediction,
  getAlerts,
  getAlertById,
  updateAlertStatus,
  assignAlert
};
