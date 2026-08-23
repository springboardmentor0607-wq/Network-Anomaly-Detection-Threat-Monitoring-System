const Incident = require('../models/Incident');
const Alert = require('../models/Alert');
const AuditLog = require('../models/AuditLog');
const notificationService = require('./notificationService');

const VALID_INCIDENT_TRANSITIONS = {
  OPEN: ['ACKNOWLEDGED', 'INVESTIGATING', 'CONTAINED', 'RESOLVED', 'CLOSED'],
  ACKNOWLEDGED: ['INVESTIGATING', 'CONTAINED', 'RESOLVED', 'CLOSED'],
  INVESTIGATING: ['CONTAINED', 'RESOLVED', 'CLOSED'],
  CONTAINED: ['RESOLVED', 'CLOSED', 'INVESTIGATING'],
  RESOLVED: ['CLOSED', 'INVESTIGATING'],
  CLOSED: []
};

const createIncident = async (data = {}, user = {}) => {
  const incidentId = `INC-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
  const creatorName = user.name || user.email || 'SOC System';

  const {
    title = 'Suspicious Network Intrusion Activity',
    description = '',
    severity = 'HIGH',
    priority = 'HIGH',
    assignedTo = null,
    assignedToName = null,
    team = 'Tier-1 SOC',
    relatedAlerts = [],
    attackTypes = [],
    affectedAssets = [],
    sourceIps = [],
    destinationIps = []
  } = data;

  const initialTimeline = [
    {
      timestamp: new Date(),
      action: 'INCIDENT_CREATED',
      user: creatorName,
      details: `Incident created with ${relatedAlerts.length} linked alert(s)`
    }
  ];

  if (assignedTo) {
    initialTimeline.push({
      timestamp: new Date(),
      action: 'ASSIGNED',
      user: creatorName,
      details: `Assigned to ${assignedToName || assignedTo}`
    });
  }

  const incident = await Incident.create({
    incidentId,
    title,
    description,
    severity,
    priority,
    status: assignedTo ? 'ACKNOWLEDGED' : 'OPEN',
    assignedTo,
    assignedToName,
    team,
    relatedAlerts,
    attackTypes,
    affectedAssets,
    sourceIps,
    destinationIps,
    timeline: initialTimeline,
    notes: []
  });

  // Link related alerts
  if (relatedAlerts.length > 0) {
    await Alert.updateMany(
      { alertId: { $in: relatedAlerts } },
      { $set: { incidentId: incident.incidentId, status: 'INVESTIGATING' } }
    );
  }

  await AuditLog.create({
    userId: user.id || user._id || 'system',
    userEmail: user.email || 'system@netshield.ai',
    action: 'INCIDENT_CREATED',
    details: `Created incident ${incidentId}: ${title}`,
    severity: 'warning'
  });

  if (assignedTo) {
    await notificationService.createNotification({
      userId: assignedTo,
      type: 'INCIDENT_ASSIGNMENT',
      title: `New Incident Assigned: ${incidentId}`,
      message: `You have been assigned to incident ${title} (${severity})`,
      severity,
      relatedIncident: incidentId
    });
  }

  return incident;
};

const getIncidents = async (query = {}) => {
  const page = parseInt(query.page) || 1;
  const limit = parseInt(query.limit) || 10;
  const skip = (page - 1) * limit;

  const filter = {};

  if (query.status) {
    filter.status = query.status.toUpperCase();
  }
  if (query.severity) {
    filter.severity = query.severity.toUpperCase();
  }
  if (query.priority) {
    filter.priority = query.priority.toUpperCase();
  }
  if (query.assignedTo) {
    filter.assignedTo = query.assignedTo;
  }
  if (query.search) {
    const searchRegex = new RegExp(query.search, 'i');
    filter.$or = [
      { incidentId: searchRegex },
      { title: searchRegex },
      { description: searchRegex },
      { attackTypes: searchRegex },
      { sourceIps: searchRegex }
    ];
  }

  const sort = { createdAt: -1 };

  const [data, total] = await Promise.all([
    Incident.find(filter).sort(sort).skip(skip).limit(limit).lean(),
    Incident.countDocuments(filter)
  ]);

  const summary = {
    total: await Incident.countDocuments(),
    OPEN: await Incident.countDocuments({ status: 'OPEN' }),
    ACKNOWLEDGED: await Incident.countDocuments({ status: 'ACKNOWLEDGED' }),
    INVESTIGATING: await Incident.countDocuments({ status: 'INVESTIGATING' }),
    CONTAINED: await Incident.countDocuments({ status: 'CONTAINED' }),
    RESOLVED: await Incident.countDocuments({ status: 'RESOLVED' }),
    CLOSED: await Incident.countDocuments({ status: 'CLOSED' })
  };

  return {
    data,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
    summary
  };
};

const getIncidentById = async (incidentId) => {
  const incident = await Incident.findOne({ incidentId }).lean();
  if (!incident) {
    throw new Error(`Incident ${incidentId} not found`);
  }

  // Populate linked alert details
  let alerts = [];
  if (incident.relatedAlerts && incident.relatedAlerts.length > 0) {
    alerts = await Alert.find({ alertId: { $in: incident.relatedAlerts } }).lean();
  }

  return { ...incident, alertDetails: alerts };
};

const updateIncidentStatus = async (incidentId, newStatus, user = {}) => {
  const incident = await Incident.findOne({ incidentId });
  if (!incident) {
    throw new Error(`Incident ${incidentId} not found`);
  }

  const currentStatus = incident.status;
  const allowed = VALID_INCIDENT_TRANSITIONS[currentStatus] || [];

  if (!allowed.includes(newStatus)) {
    throw new Error(`Invalid status transition from ${currentStatus} to ${newStatus}. Allowed: ${allowed.join(', ')}`);
  }

  incident.status = newStatus;
  const userName = user.name || user.email || 'System';

  incident.timeline.push({
    timestamp: new Date(),
    action: `STATUS_${newStatus}`,
    user: userName,
    details: `Status transitioned from ${currentStatus} to ${newStatus}`
  });

  if (newStatus === 'RESOLVED') {
    incident.resolvedAt = new Date();
  }
  if (newStatus === 'CLOSED') {
    incident.closedAt = new Date();
  }

  await incident.save();

  await AuditLog.create({
    userId: user.id || user._id || 'system',
    userEmail: user.email || 'system@netshield.ai',
    action: 'INCIDENT_STATUS_UPDATE',
    details: `Incident ${incidentId} status updated to ${newStatus}`,
    severity: 'info'
  });

  return incident;
};

const assignIncident = async (incidentId, assignedTo, assignedToName, user = {}) => {
  const incident = await Incident.findOne({ incidentId });
  if (!incident) {
    throw new Error(`Incident ${incidentId} not found`);
  }

  const assignerName = user.name || user.email || 'System';
  incident.assignedTo = assignedTo;
  incident.assignedToName = assignedToName || assignedTo;

  if (incident.status === 'OPEN') {
    incident.status = 'ACKNOWLEDGED';
  }

  incident.timeline.push({
    timestamp: new Date(),
    action: 'ASSIGNED',
    user: assignerName,
    details: `Assigned incident to ${assignedToName || assignedTo}`
  });

  await incident.save();

  await AuditLog.create({
    userId: user.id || user._id || 'system',
    userEmail: user.email || 'system@netshield.ai',
    action: 'INCIDENT_ASSIGNMENT',
    details: `Incident ${incidentId} assigned to ${assignedToName || assignedTo}`,
    severity: 'info'
  });

  await notificationService.createNotification({
    userId: assignedTo,
    type: 'INCIDENT_ASSIGNMENT',
    title: `Assigned Incident: ${incidentId}`,
    message: `You have been assigned to incident ${incident.title}`,
    severity: incident.severity,
    relatedIncident: incidentId
  });

  return incident;
};

const addIncidentNote = async (incidentId, noteText, user = {}) => {
  const incident = await Incident.findOne({ incidentId });
  if (!incident) {
    throw new Error(`Incident ${incidentId} not found`);
  }

  const userName = user.name || user.email || 'Analyst';

  incident.notes.push({
    timestamp: new Date(),
    user: userName,
    note: noteText
  });

  incident.timeline.push({
    timestamp: new Date(),
    action: 'NOTE_ADDED',
    user: userName,
    details: `Added note: "${noteText.substring(0, 50)}${noteText.length > 50 ? '...' : ''}"`
  });

  await incident.save();

  await AuditLog.create({
    userId: user.id || user._id || 'system',
    userEmail: user.email || 'system@netshield.ai',
    action: 'INCIDENT_NOTE',
    details: `Added investigation note to incident ${incidentId}`,
    severity: 'info'
  });

  return incident;
};

module.exports = {
  createIncident,
  getIncidents,
  getIncidentById,
  updateIncidentStatus,
  assignIncident,
  addIncidentNote
};
