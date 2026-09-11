import { useEffect, useState } from "react";
import axios from "axios";
import "./AdminDashboard.css";

const API = "https://network-anomaly-detection-threat-5ihm.onrender.com";

function ReportsPage() {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  // ==========================================
  // LOAD REAL REPORT DATA
  // ==========================================

  const loadReports = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await axios.get(
        `${API}/reports/threat-intelligence`
      );

      setReportData(response.data);
    } catch (err) {
      console.error(
        "Report loading error:",
        err
      );

      setError(
        err.response?.data?.detail ||
          "Unable to load security report information."
      );

      setReportData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  // ==========================================
  // DOWNLOAD PDF REPORT
  // ==========================================

  const downloadThreatReport = async () => {
    try {
      setGenerating(true);
      setError("");

      const response = await axios.get(
        `${API}/reports/threat-intelligence/pdf`,
        {
          responseType: "blob",
        }
      );

      const blob = new Blob(
        [response.data],
        {
          type: "application/pdf",
        }
      );

      const url =
        window.URL.createObjectURL(blob);

      const link =
        document.createElement("a");

      link.href = url;

      link.download =
        "NetShield_AI_Threat_Intelligence_Report.pdf";

      document.body.appendChild(link);

      link.click();

      document.body.removeChild(link);

      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(
        "PDF download error:",
        err
      );

      setError(
        "Unable to generate or download the PDF report."
      );
    } finally {
      setGenerating(false);
    }
  };

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <div className="section">
        <h2>📄 Loading Reports...</h2>

        <p>
          Fetching the latest NetShield AI
          threat intelligence information.
        </p>
      </div>
    );
  }

  // ==========================================
  // SAFE REAL VALUES
  // ==========================================

  const data = reportData || {};

  const totalPredictions = Number(
    data.total_predictions ??
      data.analyzed_predictions ??
      0
  );

  const totalRecords = Number(
    data.total_records ?? 0
  );

  const totalThreats = Number(
    data.total_threats ?? 0
  );

  const benignRecords = Number(
    data.benign_records ?? 0
  );

  const confidence = Number(
    data.average_confidence ?? 0
  );

  const threatPercentage = Number(
    data.threat_percentage ?? 0
  );

  const mostFrequentAttack =
    data.most_frequent_attack ||
    "None detected";

  const attackDistribution =
    data.attack_distribution || {};

  const datasetDistribution =
    data.dataset_distribution || {};

  // ==========================================
  // REPORT DATA AVAILABLE
  // ==========================================

  const hasReportData =
    totalPredictions > 0 ||
    totalRecords > 0;

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <div className="page">

      {/* ==========================================
          HEADER
      =========================================== */}

      <div className="topbar">

        <div>
          <h1>📄 Reports Center</h1>

          <p>
            Generate, view and download NetShield AI
            security and threat intelligence reports.
          </p>
        </div>

        <h3 className="status-green">
          🟢 Reporting System Active
        </h3>

      </div>

      {/* ==========================================
          ERROR
      =========================================== */}

      {error && (
        <div className="error-message">
          ⚠️ {error}
        </div>
      )}

      {/* ==========================================
          SUMMARY CARDS
      =========================================== */}

      <div className="cards">

        <div className="card">
          <h2>
            {hasReportData ? 1 : 0}
          </h2>

          <p>
            Available Reports
          </p>
        </div>

        <div className="card">
          <h2>
            {totalPredictions.toLocaleString()}
          </h2>

          <p>
            AI Analyses
          </p>
        </div>

        <div className="card">
          <h2>
            {totalThreats.toLocaleString()}
          </h2>

          <p>
            Threat Records
          </p>
        </div>

        <div className="card">
          <h2>
            {confidence.toFixed(2)}%
          </h2>

          <p>
            AI Confidence
          </p>
        </div>

      </div>

      {/* ==========================================
          SECURITY REPORT OVERVIEW
      =========================================== */}

      <div className="section">

        <h2>
          📊 Security Report Overview
        </h2>

        <table>

          <tbody>

            <tr>
              <th>
                Total AI Analyses
              </th>

              <td>
                {totalPredictions.toLocaleString()}
              </td>
            </tr>

            <tr>
              <th>
                Total Records Processed
              </th>

              <td>
                {totalRecords.toLocaleString()}
              </td>
            </tr>

            <tr>
              <th>
                Normal Records
              </th>

              <td>
                {benignRecords.toLocaleString()}
              </td>
            </tr>

            <tr>
              <th>
                Threat Records
              </th>

              <td>
                {totalThreats.toLocaleString()}
              </td>
            </tr>

            <tr>
              <th>
                Threat Percentage
              </th>

              <td>
                {threatPercentage.toFixed(2)}%
              </td>
            </tr>

            <tr>
              <th>
                Average AI Confidence
              </th>

              <td>
                {confidence.toFixed(2)}%
              </td>
            </tr>

            <tr>
              <th>
                Most Frequent Attack
              </th>

              <td>
                {mostFrequentAttack}
              </td>
            </tr>

          </tbody>

        </table>

      </div>

      {/* ==========================================
          AVAILABLE REPORTS
      =========================================== */}

      <div className="section">

        <h2>
          📁 Available Reports
        </h2>

        {!hasReportData ? (

          <p>
            No report data is currently available.
          </p>

        ) : (

          <table>

            <thead>

              <tr>
                <th>ID</th>
                <th>Report Name</th>
                <th>Category</th>
                <th>Status</th>
                <th>Download</th>
              </tr>

            </thead>

            <tbody>

              <tr>

                <td>
                  1
                </td>

                <td>
                  Threat Intelligence Report
                </td>

                <td>
                  Security / AI
                </td>

                <td className="status-green">
                  🟢 Ready
                </td>

                <td>

                  <button
                    className="action-btn"
                    onClick={
                      downloadThreatReport
                    }
                    disabled={generating}
                  >
                    {generating
                      ? "Generating..."
                      : "📥 Download PDF"}
                  </button>

                </td>

              </tr>

            </tbody>

          </table>

        )}

      </div>

      {/* ==========================================
          THREAT INTELLIGENCE
      =========================================== */}

      <div className="section">

        <h2>
          🚨 Threat Intelligence
        </h2>

        {Object.keys(
          attackDistribution
        ).length === 0 ? (

          <p>
            No attack distribution data is
            currently available.
          </p>

        ) : (

          <table>

            <thead>

              <tr>
                <th>
                  Attack Type
                </th>

                <th>
                  Detected Records
                </th>

                <th>
                  Status
                </th>
              </tr>

            </thead>

            <tbody>

              {Object.entries(
                attackDistribution
              ).map(
                ([attack, count]) => {

                  const isBenign =
                    String(
                      attack
                    ).toUpperCase() ===
                    "BENIGN";

                  return (
                    <tr key={attack}>

                      <td>
                        <strong>
                          {attack}
                        </strong>
                      </td>

                      <td>
                        {Number(
                          count || 0
                        ).toLocaleString()}
                      </td>

                      <td
                        className={
                          isBenign
                            ? "status-green"
                            : "status-red"
                        }
                      >
                        {isBenign
                          ? "🟢 Normal"
                          : "🚨 Threat"}
                      </td>

                    </tr>
                  );
                }
              )}

            </tbody>

          </table>

        )}

      </div>

      {/* ==========================================
          DATASET DISTRIBUTION
      =========================================== */}

      <div className="section">

        <h2>
          🗂 Dataset Reports
        </h2>

        {Object.keys(
          datasetDistribution
        ).length === 0 ? (

          <p>
            No dataset information is available.
          </p>

        ) : (

          <table>

            <thead>

              <tr>
                <th>
                  Dataset
                </th>

                <th>
                  Analyses
                </th>
              </tr>

            </thead>

            <tbody>

              {Object.entries(
                datasetDistribution
              ).map(
                ([dataset, count]) => (

                  <tr key={dataset}>

                    <td>
                      <strong>
                        {dataset}
                      </strong>
                    </td>

                    <td>
                      {Number(
                        count || 0
                      ).toLocaleString()}
                    </td>

                  </tr>

                )
              )}

            </tbody>

          </table>

        )}

      </div>

      {/* ==========================================
          QUICK REPORT
      =========================================== */}

      <div className="section">

        <h2>
          ⚡ Generate Quick Report
        </h2>

        <p>
          Generate the latest NetShield AI
          threat intelligence report as a PDF.
        </p>

        <button
          className="action-btn"
          onClick={
            downloadThreatReport
          }
          disabled={generating}
        >
          {generating
            ? "Generating PDF..."
            : "🤖 Generate AI Report"}
        </button>

      </div>

      {/* ==========================================
          REPORT SYSTEM STATUS
      =========================================== */}

      <div className="section">

        <h2>
          💾 Report System Status
        </h2>

        <table>

          <tbody>

            <tr>

              <th>
                Report Engine
              </th>

              <td className="status-green">
                🟢 Active
              </td>

            </tr>

            <tr>

              <th>
                Threat Intelligence API
              </th>

              <td className="status-green">
                🟢 Connected
              </td>

            </tr>

            <tr>

              <th>
                PDF Export
              </th>

              <td className="status-green">
                🟢 Available
              </td>

            </tr>

            <tr>

              <th>
                AI Model
              </th>

              <td className="status-green">
                Random Forest — Active
              </td>

            </tr>

            <tr>

              <th>
                Database
              </th>

              <td className="status-green">
                🟢 Connected
              </td>

            </tr>

          </tbody>

        </table>

      </div>

      {/* ==========================================
          REFRESH
      =========================================== */}

      <div className="section">

        <button
          className="action-btn"
          onClick={loadReports}
          disabled={loading}
        >
          {loading
            ? "Refreshing..."
            : "🔄 Refresh Reports"}
        </button>

      </div>

    </div>
  );
}

export default ReportsPage;