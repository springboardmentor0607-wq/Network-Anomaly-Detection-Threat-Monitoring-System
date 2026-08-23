const getNetworkStats = async () => {
  return {
    trafficGraph: {
      timestamps: ['12:00', '13:00', '14:00', '15:00', '16:00', '17:00'],
      inboundMbps: [420, 580, 890, 750, 920, 1100],
      outboundMbps: [310, 420, 610, 520, 700, 850]
    },
    protocolDistribution: [
      { protocol: 'TCP', percentage: 65 },
      { protocol: 'UDP', percentage: 22 },
      { protocol: 'ICMP', percentage: 8 },
      { protocol: 'IGMP/Other', percentage: 5 }
    ],
    deviceCount: {
      total: 452,
      servers: 32,
      firewalls: 4,
      routers: 12,
      workstations: 404
    },
    bandwidth: {
      totalCapacityGbps: 10,
      currentUsageGbps: 3.85,
      peakUsageGbps: 6.90
    },
    latencyMs: 3.8
  };
};

module.exports = { getNetworkStats };
