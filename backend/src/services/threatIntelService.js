const ThreatIntelligence = require('../models/ThreatIntelligence');
const Alert = require('../models/Alert');

class ThreatIntelProvider {
  static async enrichIndicator(indicatorValue, type = 'IP') {
    // Abstracted external Threat Intel Provider (e.g. AbuseIPDB / VirusTotal / AlienVault OTX)
    return {
      provider: 'NetShield ThreatIntel Engine (External Provider Abstraction)',
      indicatorValue,
      type,
      reputationScore: Math.floor(70 + Math.random() * 28),
      externalReputation: 'KNOWN_MALICIOUS',
      blacklists: ['AbuseIPDB Top 100', 'Spamhaus DROP', 'Emerging Threats Botnet'],
      geoOrigin: 'External Autonomous System',
      enrichedAt: new Date().toISOString()
    };
  }
}

const getThreatIntelOverview = async () => {
  const [total, internalObserved, externalEnriched, criticalCount, highCount] = await Promise.all([
    ThreatIntelligence.countDocuments(),
    ThreatIntelligence.countDocuments({ isExternalEnriched: false }),
    ThreatIntelligence.countDocuments({ isExternalEnriched: true }),
    ThreatIntelligence.countDocuments({ threatLevel: 'CRITICAL' }),
    ThreatIntelligence.countDocuments({ threatLevel: 'HIGH' })
  ]);

  // Telemetry aggregation across real alerts
  const topSourcesAgg = await Alert.aggregate([
    { $group: { _id: '$sourceIp', count: { $sum: 1 }, attackTypes: { $addToSet: '$attackType' }, maxRisk: { $max: '$riskScore' } } },
    { $sort: { count: -1 } },
    { $limit: 5 }
  ]);

  return {
    summary: {
      totalIndicators: total,
      internalObserved,
      externalEnriched,
      criticalCount,
      highCount
    },
    topObservedSources: topSourcesAgg.map(item => ({
      sourceIp: item._id,
      occurrenceCount: item.count,
      attackTypes: item.attackTypes,
      maxRiskScore: item.maxRisk
    }))
  };
};

const getThreatIntelList = async (query = {}) => {
  const page = parseInt(query.page) || 1;
  const limit = parseInt(query.limit) || 10;
  const skip = (page - 1) * limit;

  const filter = {};
  if (query.type) filter.type = query.type.toUpperCase();
  if (query.threatLevel) filter.threatLevel = query.threatLevel.toUpperCase();
  if (query.search) {
    const searchRegex = new RegExp(query.search, 'i');
    filter.$or = [
      { indicatorValue: searchRegex },
      { category: searchRegex },
      { description: searchRegex }
    ];
  }

  const [data, total] = await Promise.all([
    ThreatIntelligence.find(filter).sort({ lastObserved: -1 }).skip(skip).limit(limit).lean(),
    ThreatIntelligence.countDocuments(filter)
  ]);

  return {
    data,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1
  };
};

const getThreatIntelById = async (intelId) => {
  const item = await ThreatIntelligence.findOne({ intelId }).lean();
  if (!item) {
    throw new Error(`Threat intelligence entry ${intelId} not found`);
  }

  // Also query related internal alerts for this indicator
  const relatedAlerts = await Alert.find({ sourceIp: item.indicatorValue }).limit(10).lean();
  return { ...item, relatedAlerts };
};

const enrichThreatIntel = async (intelId) => {
  const item = await ThreatIntelligence.findOne({ intelId });
  if (!item) {
    throw new Error(`Threat intelligence entry ${intelId} not found`);
  }

  const enrichedData = await ThreatIntelProvider.enrichIndicator(item.indicatorValue, item.type);
  item.isExternalEnriched = true;
  item.source = `${item.source} + Enriched via ${enrichedData.provider}`;
  item.rawTelemetryStats = { ...item.rawTelemetryStats, externalEnrichment: enrichedData };
  await item.save();

  return item;
};

module.exports = {
  ThreatIntelProvider,
  getThreatIntelOverview,
  getThreatIntelList,
  getThreatIntelById,
  enrichThreatIntel
};
