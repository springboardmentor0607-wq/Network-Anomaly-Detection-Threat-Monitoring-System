const getSystemMetrics = async () => {
  return {
    cpu: {
      usage: 28.5,
      cores: 8,
      loadAvg: [1.2, 1.5, 1.1]
    },
    ram: {
      totalGb: 16,
      usedGb: 9.8,
      freeGb: 6.2,
      usagePercent: 61.25
    },
    disk: {
      totalGb: 512,
      usedGb: 210,
      freeGb: 302,
      usagePercent: 41.0
    },
    firewall: {
      status: 'ONLINE',
      activeRules: 1420,
      blockedPacketsToday: 84920
    },
    ids: {
      status: 'ONLINE',
      signaturesLoaded: 24500,
      inspectionEngine: 'Suricata Core v7.0'
    },
    riskScore: 14, // 0 - 100 scale (lower is better)
    servicesHealth: {
      apiServer: 'ONLINE',
      database: 'ONLINE',
      packetCollector: 'ONLINE',
      aiService: 'ONLINE',
      authentication: 'ONLINE',
      storage: 'ONLINE'
    }
  };
};

module.exports = { getSystemMetrics };
