import { useEffect, useState } from "react";
import API from "./api/api";
import "./Dashboard.css";
import jsPDF from "jspdf";

function Reports() {
  const [performance, setPerformance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const getPerformance = async () => {
      try {
        const response = await API.get(
          "/reports/model-performance"
        );

        console.log(
          "Model performance:",
          response.data
        );

        setPerformance(response.data);
      } catch (err) {
        console.error("Reports error:", err);

        setError(
          "Unable to load model performance."
        );
      } finally {
        setLoading(false);
      }
    };

    getPerformance();
  }, []);

  // ==============================
  // DOWNLOAD PDF REPORT
  // ==============================

  const downloadReport = () => {
    if (!performance) {
      return;
    }

    const doc = new jsPDF();

    const pageWidth =
      doc.internal.pageSize.getWidth();

    let y = 20;

    // ==============================
    // TITLE
    // ==============================

    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");

    doc.text(
      "NetShield AI",
      pageWidth / 2,
      y,
      { align: "center" }
    );

    y += 10;

    doc.setFontSize(16);
    doc.setFont("helvetica", "normal");

    doc.text(
      "SOC Security Analysis Report",
      pageWidth / 2,
      y,
      { align: "center" }
    );

    y += 12;

    // ==============================
    // DATE
    // ==============================

    doc.setFontSize(10);

    doc.text(
      `Generated: ${new Date().toLocaleString()}`,
      20,
      y
    );

    y += 15;

    // ==============================
    // MODEL PERFORMANCE
    // ==============================

    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");

    doc.text(
      "Model Performance",
      20,
      y
    );

    y += 10;

    // Intrusion Detection

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");

    doc.text(
      "1. Intrusion Detection",
      20,
      y
    );

    y += 7;

    doc.setFont("helvetica", "normal");

    doc.text(
      `Model: ${performance.intrusion_detection.model}`,
      25,
      y
    );

    y += 6;

    doc.text(
      `Accuracy: ${performance.intrusion_detection.accuracy}%`,
      25,
      y
    );

    y += 6;

    doc.text(
      `Status: ${performance.intrusion_detection.status}`,
      25,
      y
    );

    y += 12;

    // Threat Classification

    doc.setFont("helvetica", "bold");

    doc.text(
      "2. Threat Classification",
      20,
      y
    );

    y += 7;

    doc.setFont("helvetica", "normal");

    doc.text(
      `Model: ${performance.threat_classification.model}`,
      25,
      y
    );

    y += 6;

    doc.text(
      `Accuracy: ${performance.threat_classification.accuracy}%`,
      25,
      y
    );

    y += 6;

    doc.text(
      `Precision: ${performance.threat_classification.precision}%`,
      25,
      y
    );

    y += 6;

    doc.text(
      `Recall: ${performance.threat_classification.recall}%`,
      25,
      y
    );

    y += 6;

    doc.text(
      `F1 Score: ${performance.threat_classification.f1_score}%`,
      25,
      y
    );

    y += 6;

    doc.text(
      `Status: ${performance.threat_classification.status}`,
      25,
      y
    );

    y += 12;

    // Anomaly Detection

    doc.setFont("helvetica", "bold");

    doc.text(
      "3. Anomaly Detection",
      20,
      y
    );

    y += 7;

    doc.setFont("helvetica", "normal");

    doc.text(
      `Model: ${performance.anomaly_detection.model}`,
      25,
      y
    );

    y += 6;

    doc.text(
      `Anomalies Detected: ${performance.anomaly_detection.anomalies_detected}`,
      25,
      y
    );

    y += 6;

    doc.text(
      `Anomaly Percentage: ${performance.anomaly_detection.anomaly_percentage}%`,
      25,
      y
    );

    y += 6;

    doc.text(
      `Status: ${performance.anomaly_detection.status}`,
      25,
      y
    );

    y += 15;

    // ==============================
    // SYSTEM STATUS
    // ==============================

    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");

    doc.text(
      "System Status",
      20,
      y
    );

    y += 9;

    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");

    doc.text(
      performance.overall_status,
      20,
      y
    );

    y += 15;

    // ==============================
    // FOOTER
    // ==============================

    doc.setFontSize(9);

    doc.text(
      "NetShield AI - AI Powered Network Threat Detection System",
      pageWidth / 2,
      285,
      { align: "center" }
    );

    // ==============================
    // SAVE PDF
    // ==============================

    doc.save(
      "NetShield_AI_Model_Performance_Report.pdf"
    );
  };

  // ==============================
  // LOADING
  // ==============================

  if (loading) {
    return (
      <div className="result-box">
        <h2>📊 Model Performance</h2>

        <p>
          Loading model performance...
        </p>
      </div>
    );
  }

  // ==============================
  // ERROR
  // ==============================

  if (error) {
    return (
      <div className="result-box">
        <h2>📊 Model Performance</h2>

        <p>{error}</p>
      </div>
    );
  }

  // ==============================
  // REPORT PAGE
  // ==============================

  return (
    <div>

      <h1>📊 Model Performance</h1>

      {/* DOWNLOAD BUTTON */}

      <div className="buttons">

        <button
          onClick={downloadReport}
        >
          📥 Download PDF Report
        </button>

      </div>

      {/* SUMMARY CARDS */}

      <div className="cards">

        <div className="card">

          <h2>
            {
              performance
                .intrusion_detection
                .accuracy
            }%
          </h2>

          <p>
            Intrusion Detection
          </p>

          <small>
            {
              performance
                .intrusion_detection
                .model
            }
          </small>

        </div>


        <div className="card">

          <h2>
            {
              performance
                .threat_classification
                .accuracy
            }%
          </h2>

          <p>
            Threat Classification
          </p>

          <small>
            {
              performance
                .threat_classification
                .model
            }
          </small>

        </div>


        <div className="card">

          <h2>
            {
              performance
                .anomaly_detection
                .anomaly_percentage
            }%
          </h2>

          <p>
            Anomaly Detection
          </p>

          <small>
            {
              performance
                .anomaly_detection
                .model
            }
          </small>

        </div>

      </div>


      {/* INTRUSION DETECTION */}

      <div className="chart-card">

        <h2>
          🛡️ Intrusion Detection
        </h2>

        <p>
          <strong>Model:</strong>{" "}
          {
            performance
              .intrusion_detection
              .model
          }
        </p>

        <p>
          <strong>Accuracy:</strong>{" "}
          {
            performance
              .intrusion_detection
              .accuracy
          }%
        </p>

        <p>
          <strong>Status:</strong>{" "}
          {
            performance
              .intrusion_detection
              .status
          }
        </p>

      </div>


      {/* THREAT CLASSIFICATION */}

      <div className="chart-card">

        <h2>
          🚨 Threat Classification
        </h2>

        <p>
          <strong>Model:</strong>{" "}
          {
            performance
              .threat_classification
              .model
          }
        </p>

        <p>
          <strong>Accuracy:</strong>{" "}
          {
            performance
              .threat_classification
              .accuracy
          }%
        </p>

        <p>
          <strong>Precision:</strong>{" "}
          {
            performance
              .threat_classification
              .precision
          }%
        </p>

        <p>
          <strong>Recall:</strong>{" "}
          {
            performance
              .threat_classification
              .recall
          }%
        </p>

        <p>
          <strong>F1 Score:</strong>{" "}
          {
            performance
              .threat_classification
              .f1_score
          }%
        </p>

        <p>
          <strong>Status:</strong>{" "}
          {
            performance
              .threat_classification
              .status
          }
        </p>

      </div>


      {/* ANOMALY DETECTION */}

      <div className="chart-card">

        <h2>
          🔍 Anomaly Detection
        </h2>

        <p>
          <strong>Model:</strong>{" "}
          {
            performance
              .anomaly_detection
              .model
          }
        </p>

        <p>
          <strong>Anomalies Detected:</strong>{" "}
          {
            performance
              .anomaly_detection
              .anomalies_detected
          }
        </p>

        <p>
          <strong>Anomaly Percentage:</strong>{" "}
          {
            performance
              .anomaly_detection
              .anomaly_percentage
          }%
        </p>

        <p>
          <strong>Status:</strong>{" "}
          {
            performance
              .anomaly_detection
              .status
          }
        </p>

      </div>


      {/* SYSTEM STATUS */}

      <div className="result-box">

        <h2>
          🛡️ System Status
        </h2>

        <p>
          {
            performance
              .overall_status
          }
        </p>

      </div>

    </div>
  );
}

export default Reports;

