import { useEffect, useState } from "react";
import "./SecurityDashboard.css";

const API_BASE_URL = "http://127.0.0.1:8000";

function SecurityReportsPage() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ==========================================
  // HELPERS
  // ==========================================

  const formatNumber = (value) => {
    return Number(value || 0).toLocaleString();
  };

  const formatPercentage = (value) => {
    return Number(value || 0).toFixed(2);
  };

  // ==========================================
  // LOAD REAL THREAT INTELLIGENCE REPORT
  // ==========================================

  const loadReport = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_BASE_URL}/reports/threat-intelligence`
      );

      if (!response.ok) {
        throw new Error(
          "Failed to load threat intelligence report"
        );
      }

      const data = await response.json();

      console.log(
        "Threat Intelligence Report:",
        data
      );

      setReport(data);
    } catch (err) {
      console.error(
        "Threat Intelligence Error:",
        err
      );

      setError(
        err.message ||
          "Unable to load threat intelligence report."
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // LOAD WHEN PAGE OPENS
  // ==========================================

  useEffect(() => {
    loadReport();
  }, []);

  // ==========================================
  // DOWNLOAD PDF REPORT
  // ==========================================

  const downloadPdf = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/reports/threat-intelligence/pdf`
      );

      if (!response.ok) {
        throw new Error(
          "Failed to download PDF"
        );
      }

      const blob = await response.blob();

      const url =
        window.URL.createObjectURL(blob);

      const link =
        document.createElement("a");

      link.href = url;

      link.download =
        "NetShield_AI_Threat_Intelligence_Report.pdf";

      document.body.appendChild(link);

      link.click();

      link.remove();

      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error(
        "PDF download error:",
        error
      );

      alert(
        "Failed to download Threat Intelligence Report."
      );
    }
  };

  // ==========================================
  // LOADING
  // ==========================================

  if (loading && !report) {
    return (
      <div className="section">
        <h2>
          ⏳ Loading NetShield AI Threat Intelligence...
        </h2>

        <p>
          Fetching the latest security report from
          the backend.
        </p>
      </div>
    );
  }

  // ==========================================
  // ERROR
  // ==========================================

  if (error && !report) {
    return (
      <div className="section">
        <h2>
          ❌ Failed to Load Report
        </h2>

        <p>
          {error}
        </p>

        <br />

        <button onClick={loadReport}>
          Try Again
        </button>
      </div>
    );
  }

  // ==========================================
  // REAL REPORT DATA
  // ==========================================

  const summary =
    report?.summary || {};

  const threatIntelligence =
    report?.threat_intelligence || {};

  const incidentIntelligence =
    report?.incident_intelligence || {};

  const alertIntelligence =
    report?.alert_intelligence || {};

  const networkIntelligence =
    report?.network_intelligence || {};

  const recommendations =
    report?.recommendations || [];

  const attackDistribution =
    threatIntelligence.attack_distribution || {};

  const datasetDistribution =
    threatIntelligence.dataset_distribution || {};

  const severityDistribution =
    alertIntelligence.severity_distribution || {};

  const incidentStatusDistribution =
    incidentIntelligence.status_distribution || {};

  const protocolDistribution =
    networkIntelligence.protocol_distribution || {};

  const topSourceIps =
    networkIntelligence.top_source_ips || {};

  const topDestinationIps =
    networkIntelligence.top_destination_ips || {};

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <>
      {/* ======================================
          HEADER
      ====================================== */}

      <div className="topbar">

        <div>

          <h1>
            📄 Security Reports
          </h1>

          <p>
            Threat intelligence generated from
            NetShield AI predictions, alerts,
            incidents, and PCAP network analysis.
          </p>

          <p>
            <b>Generated:</b>{" "}
            {report?.generated_at
              ? new Date(
                  report.generated_at
                ).toLocaleString()
              : "Not available"}
          </p>

        </div>

        <button
          onClick={downloadPdf}
          style={{
            background: "#2563EB",
            color: "white",
            border: "none",
            padding: "12px 20px",
            borderRadius: "6px",
            cursor: "pointer",
            height: "45px",
          }}
        >
          ⬇ Download Report
        </button>

      </div>

      {/* ======================================
          KPI CARDS
      ====================================== */}

      <div className="cards">

        <div className="card">
          <h2>
            {formatNumber(
              summary.total_records
            )}
          </h2>

          <p>
            Total Records
          </p>
        </div>

        <div className="card">
          <h2>
            {formatNumber(
              summary.total_threats
            )}
          </h2>

          <p>
            Total Threats
          </p>
        </div>

        <div className="card">
          <h2>
            {formatNumber(
              summary.total_alerts
            )}
          </h2>

          <p>
            Total Alerts
          </p>
        </div>

        <div className="card">
          <h2>
            {formatNumber(
              summary.total_incidents
            )}
          </h2>

          <p>
            Total Incidents
          </p>
        </div>

        <div className="card">
          <h2>
            {formatPercentage(
              summary.average_confidence
            )}
            %
          </h2>

          <p>
            AI Confidence
          </p>
        </div>

        <div className="card">
          <h2>
            {formatNumber(
              summary.total_pcap_analyses
            )}
          </h2>

          <p>
            PCAP Analyses
          </p>
        </div>

      </div>

      {/* ======================================
          THREAT SUMMARY
      ====================================== */}

      <div className="section">

        <h2>
          🚨 Threat Intelligence Summary
        </h2>

        <table>

          <tbody>

            <tr>
              <th>
                Total Records Analyzed
              </th>

              <td>
                {formatNumber(
                  summary.total_records
                )}
              </td>
            </tr>

            <tr>
              <th>
                Detected Threats
              </th>

              <td>
                {formatNumber(
                  summary.total_threats
                )}
              </td>
            </tr>

            <tr>
              <th>
                Benign Records
              </th>

              <td>
                {formatNumber(
                  summary.total_benign
                )}
              </td>
            </tr>

            <tr>
              <th>
                Threat Percentage
              </th>

              <td>
                {formatPercentage(
                  summary.threat_percentage
                )}
                %
              </td>
            </tr>

            <tr>
              <th>
                Benign Percentage
              </th>

              <td>
                {formatPercentage(
                  summary.benign_percentage
                )}
                %
              </td>
            </tr>

            <tr>
              <th>
                Average AI Confidence
              </th>

              <td>
                {formatPercentage(
                  summary.average_confidence
                )}
                %
              </td>
            </tr>

          </tbody>

        </table>

      </div>

      {/* ======================================
          ATTACK DISTRIBUTION
      ====================================== */}

      <div className="section">

        <h2>
          ⚔ Attack Distribution
        </h2>

        <table>

          <thead>

            <tr>
              <th>
                Attack Type
              </th>

              <th>
                Count
              </th>
            </tr>

          </thead>

          <tbody>

            {Object.keys(
              attackDistribution
            ).length > 0 ? (

              Object.entries(
                attackDistribution
              ).map(
                ([attack, count]) => (
                  <tr key={attack}>

                    <td>
                      {attack}
                    </td>

                    <td>
                      {formatNumber(count)}
                    </td>

                  </tr>
                )
              )

            ) : (

              <tr>
                <td colSpan="2">
                  No attack distribution data available.
                </td>
              </tr>

            )}

          </tbody>

        </table>

      </div>

      {/* ======================================
          DATASET DISTRIBUTION
      ====================================== */}

      <div className="section">

        <h2>
          🧠 AI Dataset Distribution
        </h2>

        <table>

          <thead>

            <tr>
              <th>
                Dataset
              </th>

              <th>
                Prediction Records
              </th>
            </tr>

          </thead>

          <tbody>

            {Object.keys(
              datasetDistribution
            ).length > 0 ? (

              Object.entries(
                datasetDistribution
              ).map(
                ([dataset, count]) => (
                  <tr key={dataset}>

                    <td>
                      {dataset}
                    </td>

                    <td>
                      {formatNumber(count)}
                    </td>

                  </tr>
                )
              )

            ) : (

              <tr>
                <td colSpan="2">
                  No dataset information available.
                </td>
              </tr>

            )}

          </tbody>

        </table>

      </div>

      {/* ======================================
          ALERT INTELLIGENCE
      ====================================== */}

      <div className="section">

        <h2>
          🔔 Alert Intelligence
        </h2>

        <table>

          <tbody>

            <tr>
              <th>
                Total Alerts
              </th>

              <td>
                {formatNumber(
                  alertIntelligence.total_alerts
                )}
              </td>
            </tr>

            {Object.entries(
              severityDistribution
            ).map(
              ([severity, count]) => (
                <tr key={severity}>

                  <th>
                    {severity} Severity
                  </th>

                  <td>
                    {formatNumber(count)}
                  </td>

                </tr>
              )
            )}

          </tbody>

        </table>

      </div>

      {/* ======================================
          INCIDENT INTELLIGENCE
      ====================================== */}

      <div className="section">

        <h2>
          🔍 Incident Intelligence
        </h2>

        <table>

          <thead>

            <tr>
              <th>
                Incident Status
              </th>

              <th>
                Count
              </th>
            </tr>

          </thead>

          <tbody>

            {Object.keys(
              incidentStatusDistribution
            ).length > 0 ? (

              Object.entries(
                incidentStatusDistribution
              ).map(
                ([status, count]) => (
                  <tr key={status}>

                    <td>
                      {status}
                    </td>

                    <td>
                      {formatNumber(count)}
                    </td>

                  </tr>
                )
              )

            ) : (

              <tr>
                <td colSpan="2">
                  No incidents available.
                </td>
              </tr>

            )}

          </tbody>

        </table>

      </div>

      {/* ======================================
          WIRESHARK / PCAP NETWORK INTELLIGENCE
      ====================================== */}

      <div className="section">

        <h2>
          🌐 Wireshark Network Intelligence
        </h2>

        <table>

          <tbody>

            <tr>
              <th>
                PCAP Analyses
              </th>

              <td>
                {formatNumber(
                  networkIntelligence.pcap_analyses
                )}
              </td>
            </tr>

            <tr>
              <th>
                Total Packets
              </th>

              <td>
                {formatNumber(
                  networkIntelligence.total_packets
                )}
              </td>
            </tr>

            <tr>
              <th>
                Total Bytes
              </th>

              <td>
                {formatNumber(
                  networkIntelligence.total_bytes
                )}
              </td>
            </tr>

            <tr>
              <th>
                TCP Packets
              </th>

              <td>
                {formatNumber(
                  networkIntelligence.tcp_packets
                )}
              </td>
            </tr>

            <tr>
              <th>
                UDP Packets
              </th>

              <td>
                {formatNumber(
                  networkIntelligence.udp_packets
                )}
              </td>
            </tr>

            <tr>
              <th>
                ICMP Packets
              </th>

              <td>
                {formatNumber(
                  networkIntelligence.icmp_packets
                )}
              </td>
            </tr>

          </tbody>

        </table>

      </div>

      {/* ======================================
          PROTOCOL DISTRIBUTION
      ====================================== */}

      <div className="section">

        <h2>
          📡 Network Protocol Distribution
        </h2>

        <table>

          <thead>

            <tr>
              <th>
                Protocol
              </th>

              <th>
                Packets
              </th>
            </tr>

          </thead>

          <tbody>

            {Object.keys(
              protocolDistribution
            ).length > 0 ? (

              Object.entries(
                protocolDistribution
              ).map(
                ([protocol, count]) => (
                  <tr key={protocol}>

                    <td>
                      {protocol}
                    </td>

                    <td>
                      {formatNumber(count)}
                    </td>

                  </tr>
                )
              )

            ) : (

              <tr>
                <td colSpan="2">
                  No protocol data available.
                </td>
              </tr>

            )}

          </tbody>

        </table>

      </div>

      {/* ======================================
          TOP SOURCE IPS
      ====================================== */}

      <div className="section">

        <h2>
          🔼 Top Source IP Addresses
        </h2>

        <table>

          <thead>

            <tr>
              <th>
                Source IP
              </th>

              <th>
                Packets
              </th>
            </tr>

          </thead>

          <tbody>

            {Object.keys(
              topSourceIps
            ).length > 0 ? (

              Object.entries(
                topSourceIps
              ).map(
                ([ip, count]) => (
                  <tr key={ip}>

                    <td>
                      {ip}
                    </td>

                    <td>
                      {formatNumber(count)}
                    </td>

                  </tr>
                )
              )

            ) : (

              <tr>
                <td colSpan="2">
                  No source IP data available.
                </td>
              </tr>

            )}

          </tbody>

        </table>

      </div>

      {/* ======================================
          TOP DESTINATION IPS
      ====================================== */}

      <div className="section">

        <h2>
          🔽 Top Destination IP Addresses
        </h2>

        <table>

          <thead>

            <tr>
              <th>
                Destination IP
              </th>

              <th>
                Packets
              </th>
            </tr>

          </thead>

          <tbody>

            {Object.keys(
              topDestinationIps
            ).length > 0 ? (

              Object.entries(
                topDestinationIps
              ).map(
                ([ip, count]) => (
                  <tr key={ip}>

                    <td>
                      {ip}
                    </td>

                    <td>
                      {formatNumber(count)}
                    </td>

                  </tr>
                )
              )

            ) : (

              <tr>
                <td colSpan="2">
                  No destination IP data available.
                </td>
              </tr>

            )}

          </tbody>

        </table>

      </div>

      {/* ======================================
          SECURITY RECOMMENDATIONS
      ====================================== */}

      <div className="section">

        <h2>
          💡 Security Recommendations
        </h2>

        <ol>

          {recommendations.length > 0 ? (

            recommendations.map(
              (recommendation, index) => (
                <li
                  key={index}
                  style={{
                    marginBottom: "12px",
                    fontSize: "16px",
                  }}
                >
                  {recommendation}
                </li>
              )
            )

          ) : (

            <li>
              No recommendations available.
            </li>

          )}

        </ol>

      </div>

      {/* ======================================
          REFRESH BUTTON
      ====================================== */}

      <div
        style={{
          marginTop: "30px",
          marginBottom: "30px",
        }}
      >

        <button
          onClick={loadReport}
          disabled={loading}
          style={{
            background: "#16A34A",
            color: "white",
            border: "none",
            padding: "12px 22px",
            borderRadius: "6px",
            cursor: loading
              ? "not-allowed"
              : "pointer",
            fontSize: "16px",
          }}
        >
          {loading
            ? "Refreshing..."
            : "🔄 Refresh Live Report"}
        </button>

      </div>
    </>
  );
}

export default SecurityReportsPage;