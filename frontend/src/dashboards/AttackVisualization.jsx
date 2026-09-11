import React, { useEffect, useState } from "react";

const API_URL = "https://network-anomaly-detection-threat-5ihm.onrender.com";

function AttackVisualization() {
  const [analytics, setAnalytics] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [pcap, setPcap] = useState(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    loadSecurityData();

    const interval = setInterval(() => {
      loadSecurityData(true);
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const loadSecurityData = async (backgroundRefresh = false) => {
    try {
      if (backgroundRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const [
        analyticsResponse,
        alertsResponse,
        incidentsResponse,
        pcapResponse,
      ] = await Promise.all([
        fetch(`${API_URL}/dashboard/analytics`),
        fetch(`${API_URL}/dashboard/alerts`),
        fetch(`${API_URL}/dashboard/incidents`),
        fetch(`${API_URL}/dashboard/pcap-analytics`),
      ]);

      if (!analyticsResponse.ok) {
        throw new Error(
          `Analytics API error: ${analyticsResponse.status}`
        );
      }

      const analyticsData = await analyticsResponse.json();

      const alertsData = alertsResponse.ok
        ? await alertsResponse.json()
        : { alerts: [] };

      const incidentsData = incidentsResponse.ok
        ? await incidentsResponse.json()
        : { incidents: [] };

      const pcapData = pcapResponse.ok
        ? await pcapResponse.json()
        : null;

      console.log("Security Analytics:", analyticsData);
      console.log("Alerts:", alertsData);
      console.log("Incidents:", incidentsData);
      console.log("PCAP:", pcapData);

      setAnalytics(analyticsData);

      setAlerts(
        Array.isArray(alertsData)
          ? alertsData
          : alertsData.alerts || []
      );

      setIncidents(
        Array.isArray(incidentsData)
          ? incidentsData
          : incidentsData.incidents || []
      );

      setPcap(pcapData);

      setLastUpdated(new Date());
    } catch (err) {
      console.error("Security analytics error:", err);

      setError(
        "Unable to load security visualization data. Please check that the FastAPI backend is running."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.loadingPage}>
        <div style={styles.loadingCard}>
          <div style={styles.loadingSpinner}>◌</div>
          <h2>Loading Security Analytics</h2>
          <p>Connecting to NetShield AI monitoring services...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.page}>
        <div style={styles.errorBox}>
          <div style={styles.errorIcon}>⚠</div>

          <h2 style={styles.errorTitle}>
            Security Analytics Unavailable
          </h2>

          <p style={styles.errorText}>{error}</p>

          <button
            onClick={() => loadSecurityData(false)}
            style={styles.primaryButton}
          >
            ↻ Retry Connection
          </button>
        </div>
      </div>
    );
  }

  /*
   * ============================================================
   * SECURITY ANALYTICS DATA
   * ============================================================
   */

  const totalRecords = Number(analytics?.total_records || 0);

  const totalThreats = Number(
    analytics?.total_threats || 0
  );

  const benignRecords = Number(
    analytics?.benign_records || 0
  );

  const threatPercentage = Number(
    analytics?.threat_percentage ??
      (totalRecords > 0
        ? (totalThreats / totalRecords) * 100
        : 0)
  );

  const benignPercentage = Number(
    analytics?.benign_percentage ??
      (totalRecords > 0
        ? (benignRecords / totalRecords) * 100
        : 0)
  );

  const averageConfidence = Number(
    analytics?.average_confidence || 0
  );

  const totalPredictions = Number(
    analytics?.total_predictions || 0
  );

  const analyzedPredictions = Number(
    analytics?.analyzed_predictions || 0
  );

  /*
   * ============================================================
   * ATTACK DISTRIBUTION
   * ============================================================
   */

  const attackDistribution =
    analytics?.attack_distribution || {};

  const datasetDistribution =
    analytics?.dataset_distribution || {};

  const mostFrequentAttack =
    analytics?.most_frequent_attack || "None";

  /*
   * ============================================================
   * ALERT DATA
   * ============================================================
   */

  const alertSummary = analytics?.alerts || {};

  const totalAlerts = Number(
    alertSummary.total ??
      analytics?.total_alerts ??
      alerts.length
  );

  const alertSeverity =
    analytics?.alert_severity_distribution ||
    getAlertSeverityDistribution(alerts);

  const criticalAlerts = Number(
    alertSeverity.Critical ||
      alertSeverity.critical ||
      0
  );

  const highAlerts = Number(
    alertSeverity.High ||
      alertSeverity.high ||
      0
  );

  const mediumAlerts = Number(
    alertSeverity.Medium ||
      alertSeverity.medium ||
      0
  );

  const lowAlerts = Number(
    alertSeverity.Low ||
      alertSeverity.low ||
      0
  );

  /*
   * ============================================================
   * INCIDENT DATA
   * ============================================================
   */

  const incidentSummary =
    analytics?.incidents || {};

  const totalIncidents = Number(
    incidentSummary.total ??
      analytics?.total_incidents ??
      incidents.length
  );

  const openIncidents = Number(
    incidentSummary.open ??
      analytics?.open_incidents ??
      countIncidentStatus(incidents, "Open")
  );

  const investigatingIncidents = Number(
    incidentSummary.investigating ??
      analytics?.investigating_incidents ??
      countIncidentStatus(incidents, "Investigating")
  );

  const resolvedIncidents = Number(
    incidentSummary.resolved ??
      analytics?.resolved_incidents ??
      countIncidentStatus(incidents, "Resolved")
  );

  /*
   * ============================================================
   * PCAP DATA
   * ============================================================
   */

  const totalPcapAnalyses = Number(
    pcap?.total_analyses || 0
  );

  const totalPackets = Number(
    pcap?.total_packets || 0
  );

  const totalBytes = Number(
    pcap?.total_bytes || 0
  );

  const protocolDistribution =
    pcap?.protocol_distribution || {};

  const sourceIPs =
    analytics?.top_source_ips ||
    pcap?.top_source_ips ||
    {};

  const destinationIPs =
    analytics?.top_destination_ips ||
    pcap?.top_destination_ips ||
    {};

  /*
   * ============================================================
   * RENDER
   * ============================================================
   */

  return (
    <div style={styles.page}>
      {/* ======================================================
          HEADER
      ====================================================== */}

      <div style={styles.header}>
        <div>
          <div style={styles.eyebrow}>
            NETSHIELD AI • SECURITY OPERATIONS
          </div>

          <h1 style={styles.title}>
            Security Analytics
          </h1>

          <p style={styles.subtitle}>
            Real-time network threat detection,
            alert monitoring and security intelligence
          </p>
        </div>

        <button
          onClick={() => loadSecurityData(false)}
          style={styles.refreshButton}
          disabled={refreshing}
        >
          {refreshing ? "Refreshing..." : "↻ Refresh"}
        </button>
      </div>

      {/* ======================================================
          CONNECTION STATUS
      ====================================================== */}

      <div style={styles.statusBar}>
        <div style={styles.statusLeft}>
          <span style={styles.statusDot}></span>

          <strong>Security monitoring active</strong>

          <span style={styles.separator}>•</span>

          <span>
            FastAPI + MongoDB
          </span>
        </div>

        <div style={styles.updatedText}>
          {lastUpdated
            ? `Updated ${lastUpdated.toLocaleTimeString()}`
            : "Updating..."}
        </div>
      </div>

      {/* ======================================================
          KPI CARDS
      ====================================================== */}

      <div style={styles.kpiGrid}>
        <MetricCard
          title="Total Records"
          value={formatNumber(totalRecords)}
          icon="◈"
          description="Network records analyzed"
        />

        <MetricCard
          title="Threat Records"
          value={formatNumber(totalThreats)}
          icon="!"
          description="Malicious records detected"
          danger={totalThreats > 0}
        />

        <MetricCard
          title="Benign Records"
          value={formatNumber(benignRecords)}
          icon="✓"
          description="Normal network activity"
          success
        />

        <MetricCard
          title="Threat Rate"
          value={`${threatPercentage.toFixed(2)}%`}
          icon="%"
          description="Percentage of detected threats"
          danger={threatPercentage > 0}
        />

        <MetricCard
          title="Average Confidence"
          value={`${averageConfidence.toFixed(1)}%`}
          icon="AI"
          description="Model prediction confidence"
        />

        <MetricCard
          title="Security Alerts"
          value={formatNumber(totalAlerts)}
          icon="!"
          description="Generated security alerts"
          danger={totalAlerts > 0}
        />

        <MetricCard
          title="Incidents"
          value={formatNumber(totalIncidents)}
          icon="◆"
          description="Security incidents"
          danger={openIncidents > 0}
        />

        <MetricCard
          title="PCAP Analyses"
          value={formatNumber(totalPcapAnalyses)}
          icon="⌁"
          description="Captured traffic analyses"
        />
      </div>

      {/* ======================================================
          THREAT OVERVIEW
      ====================================================== */}

      <div style={styles.sectionGrid}>
        <section style={styles.panel}>
          <PanelHeader
            title="Threat vs Benign Traffic"
            subtitle="Overall classification of analyzed network traffic"
          />

          <div style={styles.threatOverview}>
            <div
              style={{
                ...styles.donut,
                background: `conic-gradient(
                  #dc3545 0% ${Math.min(
                    Math.max(threatPercentage, 0),
                    100
                  )}%,
                  #2e8b57 ${Math.min(
                    Math.max(threatPercentage, 0),
                    100
                  )}% 100%
                )`,
              }}
            >
              <div style={styles.donutCenter}>
                <strong style={styles.donutPercentage}>
                  {threatPercentage.toFixed(2)}%
                </strong>

                <span style={styles.donutLabel}>
                  Threats
                </span>
              </div>
            </div>

            <div style={styles.legend}>
              <LegendItem
                label="Threat"
                value={`${formatNumber(
                  totalThreats
                )} records`}
                percentage={`${threatPercentage.toFixed(
                  2
                )}%`}
                color="#dc3545"
              />

              <LegendItem
                label="Benign"
                value={`${formatNumber(
                  benignRecords
                )} records`}
                percentage={`${benignPercentage.toFixed(
                  2
                )}%`}
                color="#2e8b57"
              />
            </div>
          </div>

          <div style={styles.miniStats}>
            <div>
              <span>Predictions</span>
              <strong>
                {formatNumber(totalPredictions)}
              </strong>
            </div>

            <div>
              <span>Analyzed</span>
              <strong>
                {formatNumber(analyzedPredictions)}
              </strong>
            </div>
          </div>
        </section>

        {/* ==================================================
            ATTACK DISTRIBUTION
        ================================================== */}

        <section style={styles.panel}>
          <PanelHeader
            title="Attack Type Distribution"
            subtitle="Detected attack categories"
          />

          <DistributionChart
            data={attackDistribution}
          />

          <div style={styles.highlightBox}>
            <span>Most frequent attack</span>

            <strong>
              {mostFrequentAttack}
            </strong>
          </div>
        </section>
      </div>

      {/* ======================================================
          ALERT ANALYTICS
      ====================================================== */}

      <section style={styles.panel}>
        <PanelHeader
          title="Alert Analytics"
          subtitle="Security alerts grouped by severity"
        />

        <div style={styles.analyticsGrid}>
          <StatusCard
            title="Critical"
            value={criticalAlerts}
            description="Immediate attention"
            className="critical"
          />

          <StatusCard
            title="High"
            value={highAlerts}
            description="High priority"
            className="high"
          />

          <StatusCard
            title="Medium"
            value={mediumAlerts}
            description="Requires review"
            className="medium"
          />

          <StatusCard
            title="Low"
            value={lowAlerts}
            description="Low priority"
            className="low"
          />
        </div>

        <div style={{ marginTop: "25px" }}>
          <DistributionChart
            data={alertSeverity}
          />
        </div>
      </section>

      {/* ======================================================
          INCIDENT ANALYTICS
      ====================================================== */}

      <section style={styles.panel}>
        <PanelHeader
          title="Incident Management"
          subtitle="Current security incident lifecycle"
        />

        <div style={styles.incidentCards}>
          <IncidentCard
            title="Open"
            value={openIncidents}
            total={totalIncidents}
          />

          <IncidentCard
            title="Investigating"
            value={investigatingIncidents}
            total={totalIncidents}
          />

          <IncidentCard
            title="Resolved"
            value={resolvedIncidents}
            total={totalIncidents}
          />

          <IncidentCard
            title="Total"
            value={totalIncidents}
            total={totalIncidents}
            neutral
          />
        </div>
      </section>

      {/* ======================================================
          SOURCE / DESTINATION IP
      ====================================================== */}

      <div style={styles.sectionGrid}>
        <IPVisualization
          title="Top Source IP Addresses"
          subtitle="Highest observed source traffic"
          data={sourceIPs}
        />

        <IPVisualization
          title="Top Destination IP Addresses"
          subtitle="Highest observed destination traffic"
          data={destinationIPs}
        />
      </div>

      {/* ======================================================
          NETWORK PROTOCOL
      ====================================================== */}

      <section style={styles.panel}>
        <PanelHeader
          title="Network Protocol Distribution"
          subtitle="Protocol activity obtained from PCAP analysis"
        />

        <DistributionChart
          data={protocolDistribution}
        />
      </section>

      {/* ======================================================
          DATASET DISTRIBUTION
      ====================================================== */}

      <section style={styles.panel}>
        <PanelHeader
          title="Dataset Distribution"
          subtitle="AI prediction workload by dataset"
        />

        <DistributionChart
          data={datasetDistribution}
        />
      </section>

      {/* ======================================================
          PCAP SUMMARY
      ====================================================== */}

      <section style={styles.panel}>
        <PanelHeader
          title="Network Monitoring Summary"
          subtitle="Traffic captured and analyzed through PCAP"
        />

        <div style={styles.pcapGrid}>
          <SummaryBox
            title="PCAP Analyses"
            value={formatNumber(
              totalPcapAnalyses
            )}
            description="Captured files analyzed"
          />

          <SummaryBox
            title="Packets"
            value={formatNumber(
              totalPackets
            )}
            description="Network packets analyzed"
          />

          <SummaryBox
            title="Traffic Volume"
            value={formatBytes(totalBytes)}
            description="Total analyzed bytes"
          />

          <SummaryBox
            title="Detection Engine"
            value="AI Active"
            description="Random Forest threat detection"
          />
        </div>
      </section>

      {/* ======================================================
          SECURITY SUMMARY
      ====================================================== */}

      <section style={styles.panel}>
        <PanelHeader
          title="Security Monitoring Summary"
          subtitle="Current NetShield AI security posture"
        />

        <div style={styles.summaryGrid}>
          <SummaryBox
            title="Threat Detection"
            value={
              totalThreats > 0
                ? "Threats Detected"
                : "No Threats Detected"
            }
            description={`${formatNumber(
              totalThreats
            )} malicious records identified`}
          />

          <SummaryBox
            title="Alert Management"
            value={`${formatNumber(
              totalAlerts
            )} Alerts`}
            description="Security alerts generated"
          />

          <SummaryBox
            title="Incident Response"
            value={`${formatNumber(
              openIncidents
            )} Open`}
            description={`${formatNumber(
              resolvedIncidents
            )} incidents resolved`}
          />

          <SummaryBox
            title="AI Confidence"
            value={`${averageConfidence.toFixed(
              1
            )}%`}
            description="Average prediction confidence"
          />
        </div>
      </section>

      {/* ======================================================
          FOOTER
      ====================================================== */}

      <footer style={styles.footer}>
        <div>
          <strong>NetShield AI</strong>
          <span>
            {" "}
            • Network Anomaly Detection & Threat
            Monitoring System
          </span>
        </div>

        <div>
          AI Detection • Alerts • Incidents •
          PCAP • MongoDB
        </div>
      </footer>
    </div>
  );
}

/*
 * ============================================================
 * PANEL HEADER
 * ============================================================
 */

function PanelHeader({
  title,
  subtitle,
}) {
  return (
    <div style={styles.panelHeader}>
      <h2 style={styles.panelTitle}>
        {title}
      </h2>

      <p style={styles.panelSubtitle}>
        {subtitle}
      </p>
    </div>
  );
}

/*
 * ============================================================
 * METRIC CARD
 * ============================================================
 */

function MetricCard({
  title,
  value,
  icon,
  description,
  danger = false,
  success = false,
}) {
  return (
    <div style={styles.metricCard}>
      <div
        style={{
          ...styles.metricIcon,
          ...(danger
            ? styles.metricIconDanger
            : {}),
          ...(success
            ? styles.metricIconSuccess
            : {}),
        }}
      >
        {icon}
      </div>

      <div style={styles.metricContent}>
        <div style={styles.metricTitle}>
          {title}
        </div>

        <div style={styles.metricValue}>
          {value}
        </div>

        <div style={styles.metricDescription}>
          {description}
        </div>
      </div>
    </div>
  );
}

/*
 * ============================================================
 * LEGEND ITEM
 * ============================================================
 */

function LegendItem({
  label,
  value,
  percentage,
  color,
}) {
  return (
    <div style={styles.legendItem}>
      <span
        style={{
          ...styles.legendDot,
          background: color,
        }}
      />

      <div style={styles.legendContent}>
        <strong>{label}</strong>

        <span>{value}</span>

        <small>{percentage}</small>
      </div>
    </div>
  );
}

/*
 * ============================================================
 * DISTRIBUTION CHART
 * ============================================================
 */

function DistributionChart({ data }) {
  const entries = Object.entries(data || {})
    .map(([label, value]) => [
      label,
      Number(value) || 0,
    ])
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  if (entries.length === 0) {
    return (
      <div style={styles.empty}>
        <span style={styles.emptyIcon}>
          ◌
        </span>

        <p>No data available</p>
      </div>
    );
  }

  const maxValue = Math.max(
    ...entries.map(([, value]) => value)
  );

  return (
    <div style={styles.distribution}>
      {entries.map(([label, value]) => {
        const percentage =
          maxValue > 0
            ? (value / maxValue) * 100
            : 0;

        return (
          <div
            key={label}
            style={styles.distributionRow}
          >
            <div
              style={styles.distributionHeader}
            >
              <span style={styles.distributionLabel}>
                {label}
              </span>

              <strong>
                {formatNumber(value)}
              </strong>
            </div>

            <div
              style={styles.barBackground}
            >
              <div
                style={{
                  ...styles.bar,
                  width: `${percentage}%`,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

/*
 * ============================================================
 * STATUS CARD
 * ============================================================
 */

function StatusCard({
  title,
  value,
  description,
  className,
}) {
  const classStyles = {
    critical: {
      border: "#dc3545",
      background: "#fff5f5",
    },
    high: {
      border: "#e67e22",
      background: "#fff8f0",
    },
    medium: {
      border: "#d4a017",
      background: "#fffdf0",
    },
    low: {
      border: "#2e8b57",
      background: "#f2fbf6",
    },
  };

  const current =
    classStyles[className] ||
    classStyles.low;

  return (
    <div
      style={{
        ...styles.statusCard,
        borderLeft: `4px solid ${current.border}`,
        background: current.background,
      }}
    >
      <span style={styles.statusCardTitle}>
        {title}
      </span>

      <strong style={styles.statusCardValue}>
        {formatNumber(value)}
      </strong>

      <span style={styles.statusCardDescription}>
        {description}
      </span>
    </div>
  );
}

/*
 * ============================================================
 * INCIDENT CARD
 * ============================================================
 */

function IncidentCard({
  title,
  value,
  total,
  neutral = false,
}) {
  const percentage =
    total > 0
      ? (value / total) * 100
      : 0;

  return (
    <div style={styles.incidentCard}>
      <div style={styles.incidentCardHeader}>
        <span>{title}</span>

        <strong>{formatNumber(value)}</strong>
      </div>

      <div
        style={styles.incidentProgressBackground}
      >
        <div
          style={{
            ...styles.incidentProgress,
            width: `${
              neutral
                ? 100
                : Math.min(percentage, 100)
            }%`,
          }}
        />
      </div>

      <small>
        {neutral
          ? "All security incidents"
          : `${percentage.toFixed(0)}% of incidents`}
      </small>
    </div>
  );
}

/*
 * ============================================================
 * IP VISUALIZATION
 * ============================================================
 */

function IPVisualization({
  title,
  subtitle,
  data,
}) {
  const entries = Object.entries(data || {})
    .map(([ip, value]) => [
      ip,
      Number(value) || 0,
    ])
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  return (
    <section style={styles.panel}>
      <PanelHeader
        title={title}
        subtitle={subtitle}
      />

      {entries.length === 0 ? (
        <div style={styles.empty}>
          <span style={styles.emptyIcon}>
            ◌
          </span>

          <p>No IP data available</p>
        </div>
      ) : (
        <div>
          {entries.map(
            ([ip, value], index) => {
              const maxValue = Math.max(
                ...entries.map(
                  ([, itemValue]) =>
                    itemValue
                )
              );

              const percentage =
                maxValue > 0
                  ? (value / maxValue) * 100
                  : 0;

              return (
                <div
                  key={ip}
                  style={styles.ipRow}
                >
                  <div
                    style={styles.ipHeader}
                  >
                    <span
                      style={styles.ipRank}
                    >
                      #{index + 1}
                    </span>

                    <code style={styles.ipAddress}>
                      {ip}
                    </code>

                    <strong>
                      {formatNumber(value)}
                    </strong>
                  </div>

                  <div
                    style={
                      styles.barBackground
                    }
                  >
                    <div
                      style={{
                        ...styles.bar,
                        width: `${percentage}%`,
                      }}
                    />
                  </div>
                </div>
              );
            }
          )}
        </div>
      )}
    </section>
  );
}

/*
 * ============================================================
 * SUMMARY BOX
 * ============================================================
 */

function SummaryBox({
  title,
  value,
  description,
}) {
  return (
    <div style={styles.summaryBox}>
      <div style={styles.summaryTitle}>
        {title}
      </div>

      <div style={styles.summaryValue}>
        {value}
      </div>

      <div style={styles.summaryDescription}>
        {description}
      </div>
    </div>
  );
}

/*
 * ============================================================
 * HELPERS
 * ============================================================
 */

function formatNumber(value) {
  if (
    value === undefined ||
    value === null ||
    Number.isNaN(Number(value))
  ) {
    return "0";
  }

  return Number(value).toLocaleString();
}

function formatBytes(bytes) {
  const value = Number(bytes || 0);

  if (value === 0) {
    return "0 B";
  }

  const units = [
    "B",
    "KB",
    "MB",
    "GB",
    "TB",
  ];

  const index = Math.floor(
    Math.log(value) / Math.log(1024)
  );

  const safeIndex = Math.min(
    index,
    units.length - 1
  );

  return `${(
    value /
    Math.pow(1024, safeIndex)
  ).toFixed(2)} ${units[safeIndex]}`;
}

function countIncidentStatus(
  incidents,
  status
) {
  return incidents.filter(
    (incident) =>
      String(
        incident?.status || ""
      ).toLowerCase() ===
      status.toLowerCase()
  ).length;
}

function getAlertSeverityDistribution(
  alerts
) {
  const distribution = {};

  alerts.forEach((alert) => {
    const severity =
      alert?.severity ||
      alert?.level ||
      "Unknown";

    distribution[severity] =
      (distribution[severity] || 0) + 1;
  });

  return distribution;
}

/*
 * ============================================================
 * STYLES
 * ============================================================
 */

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f4f6f9",
    padding: "30px",
    fontFamily:
      "Inter, Arial, sans-serif",
    color: "#172033",
    boxSizing: "border-box",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    gap: "20px",
    marginBottom: "20px",
    flexWrap: "wrap",
  },

  eyebrow: {
    fontSize: "11px",
    fontWeight: "700",
    letterSpacing: "1.5px",
    color: "#687386",
    marginBottom: "8px",
  },

  title: {
    margin: 0,
    fontSize: "32px",
    fontWeight: "750",
    letterSpacing: "-0.5px",
  },

  subtitle: {
    margin: "8px 0 0",
    color: "#6c7687",
    fontSize: "14px",
    lineHeight: "1.5",
  },

  refreshButton: {
    border: "1px solid #172033",
    background: "#172033",
    color: "#ffffff",
    padding: "11px 18px",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: "700",
    minWidth: "110px",
  },

  primaryButton: {
    border: "none",
    background: "#172033",
    color: "#ffffff",
    padding: "12px 20px",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "700",
  },

  statusBar: {
    background: "#ffffff",
    border: "1px solid #e2e6ec",
    borderRadius: "10px",
    padding: "12px 16px",
    marginBottom: "22px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    fontSize: "12px",
    color: "#657083",
    flexWrap: "wrap",
  },

  statusLeft: {
    display: "flex",
    alignItems: "center",
    gap: "9px",
  },

  statusDot: {
    width: "9px",
    height: "9px",
    borderRadius: "50%",
    background: "#20a464",
    display: "inline-block",
    boxShadow:
      "0 0 0 4px rgba(32,164,100,0.10)",
  },

  separator: {
    color: "#b8bec8",
  },

  updatedText: {
    color: "#8a94a4",
  },

  kpiGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(190px, 1fr))",
    gap: "14px",
    marginBottom: "22px",
  },

  metricCard: {
    background: "#ffffff",
    border: "1px solid #e2e6ec",
    borderRadius: "11px",
    padding: "17px",
    display: "flex",
    alignItems: "center",
    gap: "13px",
    minHeight: "92px",
    boxSizing: "border-box",
  },

  metricIcon: {
    width: "43px",
    height: "43px",
    minWidth: "43px",
    borderRadius: "9px",
    background: "#eef1f5",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontSize: "14px",
    fontWeight: "800",
    color: "#334155",
  },

  metricIconDanger: {
    background: "#fff0f1",
    color: "#c92f3c",
  },

  metricIconSuccess: {
    background: "#edf9f2",
    color: "#218653",
  },

  metricContent: {
    minWidth: 0,
  },

  metricTitle: {
    fontSize: "11px",
    color: "#737d8e",
    marginBottom: "5px",
    fontWeight: "600",
  },

  metricValue: {
    fontSize: "22px",
    fontWeight: "750",
    lineHeight: "1.1",
  },

  metricDescription: {
    marginTop: "5px",
    fontSize: "10px",
    color: "#9aa2af",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },

  sectionGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(360px, 1fr))",
    gap: "20px",
    alignItems: "start",
  },

  panel: {
    background: "#ffffff",
    border: "1px solid #e2e6ec",
    borderRadius: "11px",
    padding: "22px",
    marginBottom: "20px",
    boxSizing: "border-box",
  },

  panelHeader: {
    marginBottom: "20px",
  },

  panelTitle: {
    margin: 0,
    fontSize: "18px",
    fontWeight: "750",
    color: "#1b2537",
  },

  panelSubtitle: {
    margin: "6px 0 0",
    color: "#7c8797",
    fontSize: "12px",
    lineHeight: "1.5",
  },

  threatOverview: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "55px",
    padding: "8px 10px 20px",
    flexWrap: "wrap",
  },

  donut: {
    width: "175px",
    height: "175px",
    borderRadius: "50%",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    transform: "rotate(0deg)",
  },

  donutCenter: {
    width: "112px",
    height: "112px",
    borderRadius: "50%",
    background: "#ffffff",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    boxShadow:
      "0 1px 5px rgba(0,0,0,0.04)",
  },

  donutPercentage: {
    fontSize: "22px",
    fontWeight: "800",
  },

  donutLabel: {
    marginTop: "4px",
    fontSize: "11px",
    color: "#7d8796",
  },

  legend: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },

  legendItem: {
    display: "flex",
    alignItems: "flex-start",
    gap: "10px",
  },

  legendDot: {
    width: "10px",
    height: "10px",
    borderRadius: "50%",
    marginTop: "5px",
  },

  legendContent: {
    display: "flex",
    flexDirection: "column",
    gap: "3px",
    minWidth: "130px",
  },

  miniStats: {
    display: "grid",
    gridTemplateColumns:
      "repeat(2, 1fr)",
    gap: "10px",
    borderTop: "1px solid #edf0f4",
    paddingTop: "16px",
  },

  highlightBox: {
    marginTop: "22px",
    padding: "14px 16px",
    background: "#f7f8fa",
    borderRadius: "8px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "10px",
    fontSize: "12px",
    color: "#707a8b",
  },

  distribution: {
    display: "flex",
    flexDirection: "column",
    gap: "15px",
  },

  distributionRow: {
    width: "100%",
  },

  distributionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "7px",
    fontSize: "12px",
  },

  distributionLabel: {
    color: "#465164",
    fontWeight: "600",
    maxWidth: "75%",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },

  barBackground: {
    width: "100%",
    height: "8px",
    background: "#edf0f4",
    borderRadius: "20px",
    overflow: "hidden",
  },

  bar: {
    height: "100%",
    background: "#3949ab",
    borderRadius: "20px",
    transition:
      "width 0.5s ease",
    minWidth: "2px",
  },

  analyticsGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(160px, 1fr))",
    gap: "13px",
  },

  statusCard: {
    padding: "16px",
    borderRadius: "9px",
    minHeight: "105px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    boxSizing: "border-box",
  },

  statusCardTitle: {
    fontSize: "12px",
    color: "#6d7787",
    fontWeight: "650",
  },

  statusCardValue: {
    fontSize: "25px",
    margin: "5px 0",
  },

  statusCardDescription: {
    fontSize: "10px",
    color: "#929baa",
  },

  incidentCards: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "14px",
  },

  incidentCard: {
    border: "1px solid #e7eaf0",
    borderRadius: "9px",
    padding: "16px",
    background: "#fafbfc",
  },

  incidentCardHeader: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "12px",
    fontSize: "13px",
  },

  incidentProgressBackground: {
    height: "8px",
    background: "#e7ebf0",
    borderRadius: "20px",
    overflow: "hidden",
    marginBottom: "8px",
  },

  incidentProgress: {
    height: "100%",
    background: "#3949ab",
    borderRadius: "20px",
  },

  ipRow: {
    marginBottom: "17px",
  },

  ipHeader: {
    display: "grid",
    gridTemplateColumns:
      "38px 1fr auto",
    alignItems: "center",
    gap: "10px",
    marginBottom: "7px",
    fontSize: "12px",
  },

  ipRank: {
    color: "#8791a1",
    fontWeight: "700",
  },

  ipAddress: {
    color: "#354052",
    fontSize: "12px",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },

  pcapGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "14px",
  },

  summaryGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "14px",
  },

  summaryBox: {
    background: "#f7f8fa",
    border: "1px solid #eceff3",
    borderRadius: "9px",
    padding: "17px",
  },

  summaryTitle: {
    color: "#747e8e",
    fontSize: "11px",
    marginBottom: "8px",
    fontWeight: "650",
  },

  summaryValue: {
    fontSize: "18px",
    fontWeight: "750",
    marginBottom: "5px",
  },

  summaryDescription: {
    color: "#9099a7",
    fontSize: "11px",
    lineHeight: "1.4",
  },

  empty: {
    padding: "35px 20px",
    textAlign: "center",
    color: "#8a94a3",
    border: "1px dashed #dfe4ea",
    borderRadius: "8px",
  },

  emptyIcon: {
    display: "block",
    fontSize: "25px",
    marginBottom: "5px",
  },

  footer: {
    marginTop: "5px",
    padding: "20px 0 5px",
    borderTop: "1px solid #dfe4ea",
    display: "flex",
    justifyContent: "space-between",
    color: "#7d8796",
    fontSize: "11px",
    flexWrap: "wrap",
    gap: "15px",
  },

  loadingPage: {
    minHeight: "80vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "#f4f6f9",
    fontFamily:
      "Inter, Arial, sans-serif",
  },

  loadingCard: {
    background: "#ffffff",
    border: "1px solid #e2e6ec",
    borderRadius: "12px",
    padding: "35px",
    textAlign: "center",
    boxShadow:
      "0 5px 25px rgba(23,32,51,0.06)",
  },

  loadingSpinner: {
    fontSize: "35px",
    color: "#3949ab",
    marginBottom: "10px",
  },

  errorBox: {
    maxWidth: "600px",
    margin: "100px auto",
    background: "#ffffff",
    border: "1px solid #e2e6ec",
    borderRadius: "12px",
    padding: "35px",
    textAlign: "center",
  },

  errorIcon: {
    width: "55px",
    height: "55px",
    margin: "0 auto 15px",
    borderRadius: "50%",
    background: "#fff0f1",
    color: "#c92f3c",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "25px",
    fontWeight: "800",
  },

  errorTitle: {
    margin: "0 0 10px",
    fontSize: "21px",
  },

  errorText: {
    color: "#747e8e",
    fontSize: "13px",
    lineHeight: "1.5",
    marginBottom: "20px",
  },
};

export default AttackVisualization;