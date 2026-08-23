const Threat = require('../models/Threat');

const mockThreats = [
  {
    _id: 'thr-001',
    sourceIp: '185.220.101.5',
    destinationIp: '10.0.1.25',
    protocol: 'HTTPS',
    threatName: 'DDoS Amplification Attack',
    severity: 'Critical',
    status: 'Active',
    detectedAt: new Date(Date.now() - 1000 * 60 * 5).toISOString()
  },
  {
    _id: 'thr-002',
    sourceIp: '192.168.1.150',
    destinationIp: '10.0.1.100',
    protocol: 'SSH',
    threatName: 'Credential Stuffing',
    severity: 'High',
    status: 'Investigating',
    detectedAt: new Date(Date.now() - 1000 * 60 * 25).toISOString()
  },
  {
    _id: 'thr-003',
    sourceIp: '103.253.144.10',
    destinationIp: '10.0.2.4',
    protocol: 'DNS',
    threatName: 'DNS Cache Poisoning',
    severity: 'High',
    status: 'Pending',
    detectedAt: new Date(Date.now() - 1000 * 60 * 60).toISOString()
  },
  {
    _id: 'thr-004',
    sourceIp: '192.168.10.15',
    destinationIp: '10.0.3.12',
    protocol: 'SMB',
    threatName: 'Lateral Movement Suspect',
    severity: 'Medium',
    status: 'Pending',
    detectedAt: new Date(Date.now() - 1000 * 60 * 120).toISOString()
  },
  {
    _id: 'thr-005',
    sourceIp: '172.16.0.44',
    destinationIp: '8.8.8.8',
    protocol: 'UDP',
    threatName: 'Unusual Outbound UDP Traffic',
    severity: 'Low',
    status: 'Resolved',
    detectedAt: new Date(Date.now() - 1000 * 60 * 240).toISOString()
  }
];

const getThreats = async (query = {}) => {
  try {
    const dbThreats = await Threat.find(query).sort({ detectedAt: -1 });
    if (dbThreats && dbThreats.length > 0) return dbThreats;
  } catch (error) {
    // DB offline, fallback to mock data
  }
  return mockThreats;
};

const updateThreatStatus = async (id, status) => {
  try {
    const updated = await Threat.findByIdAndUpdate(id, { status }, { new: true });
    if (updated) return updated;
  } catch (e) {}

  const threat = mockThreats.find(t => t._id === id);
  if (threat) threat.status = status;
  return threat || { _id: id, status };
};

module.exports = {
  getThreats,
  updateThreatStatus
};
