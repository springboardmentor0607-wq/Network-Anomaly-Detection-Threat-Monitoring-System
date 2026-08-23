const Alert = require('../models/Alert');
const Incident = require('../models/Incident');

const getOverview = async (dateRange = 'LAST_7_DAYS') => {
  const dateFilter = getDateFilter(dateRange);

  const [totalAlerts, criticalCount, highCount, mediumCount, lowCount, openIncidents, resolvedIncidents] = await Promise.all([
    Alert.countDocuments(dateFilter),
    Alert.countDocuments({ ...dateFilter, severity: 'CRITICAL' }),
    Alert.countDocuments({ ...dateFilter, severity: 'HIGH' }),
    Alert.countDocuments({ ...dateFilter, severity: 'MEDIUM' }),
    Alert.countDocuments({ ...dateFilter, severity: 'LOW' }),
    Incident.countDocuments({ status: { $in: ['OPEN', 'ACKNOWLEDGED', 'INVESTIGATING'] } }),
    Incident.countDocuments({ status: { $in: ['RESOLVED', 'CLOSED'] } })
  ]);

  return {
    totalThreats: totalAlerts,
    criticalThreats: criticalCount,
    highThreats: highCount,
    mediumThreats: mediumCount,
    lowThreats: lowCount,
    openIncidents,
    resolvedIncidents
  };
};

const getAttackDistribution = async (dateRange = 'LAST_7_DAYS') => {
  const dateFilter = getDateFilter(dateRange);

  const agg = await Alert.aggregate([
    { $match: dateFilter },
    { $group: { _id: '$attackType', count: { $sum: 1 }, avgRisk: { $avg: '$riskScore' } } },
    { $sort: { count: -1 } }
  ]);

  return agg.map(item => ({
    attackType: item._id,
    count: item.count,
    avgRiskScore: Math.round(item.avgRisk || 50)
  }));
};

const getSeverityDistribution = async (dateRange = 'LAST_7_DAYS') => {
  const dateFilter = getDateFilter(dateRange);

  const agg = await Alert.aggregate([
    { $match: dateFilter },
    { $group: { _id: '$severity', count: { $sum: 1 } } }
  ]);

  const severityMap = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0, INFO: 0 };
  agg.forEach(item => {
    if (severityMap[item._id] !== undefined) {
      severityMap[item._id] = item.count;
    }
  });

  return severityMap;
};

const getRiskDistribution = async (dateRange = 'LAST_7_DAYS') => {
  const dateFilter = getDateFilter(dateRange);

  const agg = await Alert.aggregate([
    { $match: dateFilter },
    {
      $bucket: {
        groupBy: '$riskScore',
        boundaries: [0, 26, 51, 76, 101],
        default: 'Unknown',
        output: { count: { $sum: 1 } }
      }
    }
  ]);

  const ranges = {
    'Low (0-25)': 0,
    'Medium (26-50)': 0,
    'High (51-75)': 0,
    'Critical (76-100)': 0
  };

  agg.forEach(b => {
    if (b._id === 0) ranges['Low (0-25)'] = b.count;
    else if (b._id === 26) ranges['Medium (26-50)'] = b.count;
    else if (b._id === 51) ranges['High (51-75)'] = b.count;
    else if (b._id === 76) ranges['Critical (76-100)'] = b.count;
  });

  return ranges;
};

const getTimeline = async (dateRange = 'LAST_7_DAYS') => {
  const dateFilter = getDateFilter(dateRange);

  const agg = await Alert.aggregate([
    { $match: dateFilter },
    {
      $group: {
        _id: {
          year: { $year: '$timestamp' },
          month: { $month: '$timestamp' },
          day: { $dayOfMonth: '$timestamp' },
          hour: { $hour: '$timestamp' }
        },
        count: { $sum: 1 },
        criticalCount: { $sum: { $cond: [{ $eq: ['$severity', 'CRITICAL'] }, 1, 0] } }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1, '_id.hour': 1 } }
  ]);

  return agg.map(item => {
    const d = new Date(item._id.year, item._id.month - 1, item._id.day, item._id.hour);
    return {
      timestamp: d.toISOString(),
      label: `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:00`,
      total: item.count,
      critical: item.criticalCount
    };
  });
};

const getProtocolDistribution = async (dateRange = 'LAST_7_DAYS') => {
  const dateFilter = getDateFilter(dateRange);

  const agg = await Alert.aggregate([
    { $match: dateFilter },
    { $group: { _id: '$protocol', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);

  return agg.map(item => ({
    protocol: item._id || 'TCP',
    count: item.count
  }));
};

const getTopSources = async (limit = 5) => {
  const agg = await Alert.aggregate([
    { $group: { _id: '$sourceIp', count: { $sum: 1 }, attackTypes: { $addToSet: '$attackType' }, maxRisk: { $max: '$riskScore' } } },
    { $sort: { count: -1 } },
    { $limit: limit }
  ]);

  return agg.map(item => ({
    sourceIp: item._id,
    count: item.count,
    attackTypes: item.attackTypes,
    maxRiskScore: item.maxRisk
  }));
};

const getTopDestinations = async (limit = 5) => {
  const agg = await Alert.aggregate([
    { $group: { _id: '$destinationIp', count: { $sum: 1 }, alertTypes: { $addToSet: '$attackType' } } },
    { $sort: { count: -1 } },
    { $limit: limit }
  ]);

  return agg.map(item => ({
    destinationIp: item._id,
    count: item.count,
    alertTypes: item.alertTypes
  }));
};

const getSocMetrics = async () => {
  const totalAlerts = await Alert.countDocuments();
  const resolvedAlerts = await Alert.countDocuments({ status: { $in: ['RESOLVED', 'CLOSED'] } });
  const criticalAlerts = await Alert.countDocuments({ severity: 'CRITICAL' });

  // Calculate Mean Time to Acknowledge (MTTA) and Mean Time to Resolve (MTTR) from Incidents
  const incidents = await Incident.find({ status: { $in: ['RESOLVED', 'CLOSED'] } }).lean();

  let totalMttaMinutes = 0;
  let totalMttrMinutes = 0;
  let ackCount = 0;
  let resCount = 0;

  incidents.forEach(inc => {
    const created = new Date(inc.createdAt).getTime();
    const ackEvent = inc.timeline.find(t => t.action === 'ASSIGNED' || t.action === 'STATUS_ACKNOWLEDGED');
    if (ackEvent) {
      const ackTime = new Date(ackEvent.timestamp).getTime();
      const diffMins = Math.max(1, Math.round((ackTime - created) / (1000 * 60)));
      totalMttaMinutes += diffMins;
      ackCount++;
    }

    if (inc.resolvedAt) {
      const resTime = new Date(inc.resolvedAt).getTime();
      const diffMins = Math.max(5, Math.round((resTime - created) / (1000 * 60)));
      totalMttrMinutes += diffMins;
      resCount++;
    }
  });

  const mttaMinutes = ackCount > 0 ? Math.round(totalMttaMinutes / ackCount) : 4;
  const mttrMinutes = resCount > 0 ? Math.round(totalMttrMinutes / resCount) : 22;
  const resolutionRate = totalAlerts > 0 ? Math.round((resolvedAlerts / totalAlerts) * 100) : 100;
  const criticalRate = totalAlerts > 0 ? Math.round((criticalAlerts / totalAlerts) * 100) : 0;

  return {
    mttaMinutes,
    mttrMinutes,
    resolutionRate,
    criticalAlertRate: criticalRate,
    totalAlerts,
    resolvedAlerts
  };
};

function getDateFilter(dateRange) {
  const now = new Date();
  if (dateRange === 'TODAY') {
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return { timestamp: { $gte: startOfDay } };
  }
  if (dateRange === 'LAST_7_DAYS') {
    const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return { timestamp: { $gte: start } };
  }
  if (dateRange === 'LAST_30_DAYS') {
    const start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    return { timestamp: { $gte: start } };
  }
  return {};
}

module.exports = {
  getOverview,
  getAttackDistribution,
  getSeverityDistribution,
  getRiskDistribution,
  getTimeline,
  getProtocolDistribution,
  getTopSources,
  getTopDestinations,
  getSocMetrics
};
