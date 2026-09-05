import { useState } from "react";
import API from "./api/api";
import "./Dashboard.css";

function ModelTesting() {
  const [formData, setFormData] = useState({
    duration: "",
    src_packets: "",
    dst_packets: "",
    src_bytes: "",
    dst_bytes: "",
    protocol: ""
  });

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [selectedFile, setSelectedFile] = useState(null);
  const [fileResult, setFileResult] = useState(null);
  const [fileLoading, setFileLoading] = useState(false);
  const [fileError, setFileError] = useState("");

  // ==============================
  // HANDLE INPUT CHANGE
  // ==============================
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });

    setError("");
  };

  // ==============================
  // TEST SINGLE TRAFFIC
  // ==============================
  const testTraffic = async () => {
    setError("");
    setResult(null);

    // Basic validation
    const fields = [
      "duration",
      "src_packets",
      "dst_packets",
      "src_bytes",
      "dst_bytes",
      "protocol"
    ];

    const missingField = fields.some(
      (field) => formData[field] === ""
    );

    if (missingField) {
      setError("Please fill in all traffic features before testing.");
      return;
    }

    try {
      setLoading(true);

      const response = await API.post("/predict", {
        duration: Number(formData.duration),
        src_packets: Number(formData.src_packets),
        dst_packets: Number(formData.dst_packets),
        src_bytes: Number(formData.src_bytes),
        dst_bytes: Number(formData.dst_bytes),
        protocol: String(formData.protocol)
      });

      console.log("Model Test Result:", response.data);

      setResult(response.data);

    } catch (error) {
      console.error(
        "Model testing error:",
        error.response?.data || error.message
      );

      setError(
        error.response?.data?.detail ||
        "Unable to test the traffic."
      );
    } finally {
      setLoading(false);
    }
  };

  // ==============================
  // CSV FILE SELECTION
  // ==============================
  const handleFileChange = (event) => {
    const file = event.target.files[0];

    if (!file) {
      return;
    }

    if (!file.name.toLowerCase().endsWith(".csv")) {
      setFileError("Please select a CSV file.");
      setSelectedFile(null);
      setFileResult(null);
      return;
    }

    setSelectedFile(file);
    setFileResult(null);
    setFileError("");
  };

  // ==============================
  // TEST CSV FILE
  // ==============================
  const testCSVFile = async () => {
    if (!selectedFile) {
      setFileError("Please select a CSV file first.");
      return;
    }

    setFileLoading(true);
    setFileError("");
    setFileResult(null);

    try {
      const uploadData = new FormData();

      uploadData.append(
        "file",
        selectedFile
      );

      const response = await API.post(
        "/model-testing/upload",
        uploadData
      );

      console.log(
        "CSV test result:",
        response.data
      );

      setFileResult(response.data);

    } catch (error) {
      console.error(
        "CSV testing error:",
        error.response?.data || error.message
      );

      const message =
        error.response?.data?.detail?.message ||
        error.response?.data?.detail ||
        error.response?.data?.message ||
        error.message ||
        "Unable to test CSV file.";

      setFileError(String(message));

    } finally {
      setFileLoading(false);
    }
  };

  return (
    <div className="model-testing-page">

      {/* =====================================
          AI MODEL TESTING
      ====================================== */}

      <div className="result-box model-testing-card">

        <div className="model-testing-header">
          <h2>🧪 AI Model Testing</h2>

          <p>
            Enter network traffic features and test the
            trained Random Forest model in real time.
          </p>
        </div>

        <div className="testing-form">

          {/* Duration */}
          <div className="testing-field">
            <label htmlFor="duration">
              Duration
            </label>

            <input
              id="duration"
              type="number"
              step="any"
              min="0"
              name="duration"
              value={formData.duration}
              onChange={handleChange}
              placeholder="Example: 0.5"
            />
          </div>

          {/* Source Packets */}
          <div className="testing-field">
            <label htmlFor="src_packets">
              Source Packets
            </label>

            <input
              id="src_packets"
              type="number"
              min="0"
              name="src_packets"
              value={formData.src_packets}
              onChange={handleChange}
              placeholder="Example: 10"
            />
          </div>

          {/* Destination Packets */}
          <div className="testing-field">
            <label htmlFor="dst_packets">
              Destination Packets
            </label>

            <input
              id="dst_packets"
              type="number"
              min="0"
              name="dst_packets"
              value={formData.dst_packets}
              onChange={handleChange}
              placeholder="Example: 8"
            />
          </div>

          {/* Source Bytes */}
          <div className="testing-field">
            <label htmlFor="src_bytes">
              Source Bytes
            </label>

            <input
              id="src_bytes"
              type="number"
              min="0"
              name="src_bytes"
              value={formData.src_bytes}
              onChange={handleChange}
              placeholder="Example: 500"
            />
          </div>

          {/* Destination Bytes */}
          <div className="testing-field">
            <label htmlFor="dst_bytes">
              Destination Bytes
            </label>

            <input
              id="dst_bytes"
              type="number"
              min="0"
              name="dst_bytes"
              value={formData.dst_bytes}
              onChange={handleChange}
              placeholder="Example: 1200"
            />
          </div>

          {/* Protocol */}
          <div className="testing-field">
            <label htmlFor="protocol">
              Protocol
            </label>

            <input
              id="protocol"
              type="text"
              name="protocol"
              value={formData.protocol}
              onChange={handleChange}
              placeholder="Example: 80"
            />

            <small>
              Enter the protocol value used by the trained model.
            </small>
          </div>

        </div>

        {/* Test Button */}
        <button
          className="model-test-button"
          onClick={testTraffic}
          disabled={loading}
        >
          {loading
            ? "🔄 Testing..."
            : "🔍 Test Traffic"}
        </button>

      </div>


      {/* =====================================
          MANUAL TEST ERROR
      ====================================== */}

      {error && (
        <div className="result-box model-error-box">
          <h3>❌ Testing Error</h3>
          <p>{error}</p>
        </div>
      )}


      {/* =====================================
          MANUAL TEST RESULT
      ====================================== */}

      {result && (
        <div className="result-box model-result-card">

          <h2>📊 Model Test Result</h2>

          <div className="model-result-grid">

            <div className="model-result-item">
              <span>Prediction</span>

              <strong
                className={
                  result.prediction === "Attack"
                    ? "prediction-attack"
                    : "prediction-normal"
                }
              >
                {result.prediction === "Attack"
                  ? "🔴 ATTACK"
                  : "🟢 NORMAL"}
              </strong>
            </div>

            <div className="model-result-item">
              <span>Confidence</span>

              <strong>
                {result.confidence || "N/A"}
              </strong>
            </div>

            <div className="model-result-item">
              <span>Attack Type</span>

              <strong>
                {result.attack_type || "None"}
              </strong>
            </div>

            <div className="model-result-item">
              <span>Severity</span>

              <strong>
                {result.severity || "LOW"}
              </strong>
            </div>

            {result.risk_score !== undefined && (
              <div className="model-result-item">
                <span>Risk Score</span>

                <strong>
                  {result.risk_score}
                </strong>
              </div>
            )}

            {result.risk_level && (
              <div className="model-result-item">
                <span>Risk Level</span>

                <strong>
                  {result.risk_level}
                </strong>
              </div>
            )}

          </div>

        </div>
      )}


      {/* =====================================
          CSV UPLOAD
      ====================================== */}

      <div className="result-box csv-testing-card">

        <h2>📁 Upload Test Dataset</h2>

        <p>
          Upload a CSV file containing network traffic
          features to test the trained Random Forest model.
        </p>

        <div className="csv-upload-area">

          <label className="csv-file-label">
            📂 Choose CSV File

            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
            />
          </label>

          {selectedFile && (
            <div className="selected-file">
              <span>Selected file:</span>

              <strong>
                {selectedFile.name}
              </strong>
            </div>
          )}

        </div>

        <button
          className="csv-test-button"
          onClick={testCSVFile}
          disabled={!selectedFile || fileLoading}
        >
          {fileLoading
            ? "🔄 Testing CSV..."
            : "🔍 Test CSV File"}
        </button>

        {fileError && (
          <div className="model-error-box">
            ❌ {fileError}
          </div>
        )}

      </div>


      {/* =====================================
          CSV RESULT
      ====================================== */}

      {fileResult && (
        <div className="result-box csv-result-card">

          <h2>📊 CSV Model Test Result</h2>

          <div className="csv-summary-grid">

            <div className="csv-stat">
              <span>File</span>
              <strong>
                {fileResult.filename}
              </strong>
            </div>

            <div className="csv-stat">
              <span>Total Records</span>
              <strong>
                {fileResult.total_records}
              </strong>
            </div>

            <div className="csv-stat">
              <span>Normal Records</span>
              <strong>
                {fileResult.normal_records}
              </strong>
            </div>

            <div className="csv-stat">
              <span>Attack Records</span>
              <strong>
                {fileResult.attack_records}
              </strong>
            </div>

            <div className="csv-stat">
              <span>Attack Percentage</span>
              <strong>
                {fileResult.attack_percentage}%
              </strong>
            </div>

          </div>


          {/* Evaluation */}
          {fileResult.evaluation && (
            <div className="evaluation-section">

              <hr />

              <h3>📈 Evaluation Metrics</h3>

              <div className="evaluation-grid">

                <div className="evaluation-item">
                  <span>Accuracy</span>
                  <strong>
                    {fileResult.evaluation.accuracy}%
                  </strong>
                </div>

                <div className="evaluation-item">
                  <span>Precision</span>
                  <strong>
                    {fileResult.evaluation.precision}%
                  </strong>
                </div>

                <div className="evaluation-item">
                  <span>Recall</span>
                  <strong>
                    {fileResult.evaluation.recall}%
                  </strong>
                </div>

                <div className="evaluation-item">
                  <span>F1 Score</span>
                  <strong>
                    {fileResult.evaluation.f1_score}%
                  </strong>
                </div>

              </div>

            </div>
          )}

        </div>
      )}

    </div>
  );
}

export default ModelTesting;