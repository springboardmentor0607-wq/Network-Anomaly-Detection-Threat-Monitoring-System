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

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const testTraffic = async () => {
    setError("");
    setResult(null);

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

  const handleFileChange = (event) => {
  const file = event.target.files[0];

  if (!file) {
    return;
  }

  if (!file.name.toLowerCase().endsWith(".csv")) {
    setFileError("Please select a CSV file.");
    setSelectedFile(null);
    return;
  }

  setSelectedFile(file);
  setFileResult(null);
  setFileError("");
};


const testCSVFile = async () => {

  if (!selectedFile) {
    setFileError("Please select a CSV file first.");
    return;
  }

  setFileLoading(true);
  setFileError("");
  setFileResult(null);

  try {

    const formData = new FormData();

    formData.append(
      "file",
      selectedFile
    );

    const response = await API.post(
      "/model-testing/upload",
      formData
    );

    console.log(
      "CSV test result:",
      response.data
    );

    setFileResult(
      response.data
    );

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
    <div className="result-box">

      <h2>🧪 AI Model Testing</h2>

      <p>
        Enter network traffic features and test the
        trained Random Forest model in real time.
      </p>

      <div className="testing-form">

        <label>
          Duration
          <input
            type="number"
            step="any"
            name="duration"
            value={formData.duration}
            onChange={handleChange}
            placeholder="Example: 0.5"
          />
        </label>

        <label>
          Source Packets
          <input
            type="number"
            name="src_packets"
            value={formData.src_packets}
            onChange={handleChange}
            placeholder="Example: 10"
          />
        </label>

        <label>
          Destination Packets
          <input
            type="number"
            name="dst_packets"
            value={formData.dst_packets}
            onChange={handleChange}
            placeholder="Example: 8"
          />
        </label>

        <label>
          Source Bytes
          <input
            type="number"
            name="src_bytes"
            value={formData.src_bytes}
            onChange={handleChange}
            placeholder="Example: 500"
          />
        </label>

        <label>
          Destination Bytes
          <input
            type="number"
            name="dst_bytes"
            value={formData.dst_bytes}
            onChange={handleChange}
            placeholder="Example: 1200"
          />
        </label>

        <label>
          Protocol
          <input
            type="text"
            name="protocol"
            value={formData.protocol}
            onChange={handleChange}
            placeholder="Example: 80"
          />
        </label>

      </div>

      <button
        onClick={testTraffic}
        disabled={loading}
      >
        {loading
          ? "🔄 Testing..."
          : "🔍 Test Traffic"}
      </button>

      {error && (
        <div className="result-box">
          <h3>❌ Testing Error</h3>
          <p>{error}</p>
        </div>
      )}

      {result && (
        <div className="result-box">

          <h2>📊 Model Test Result</h2>

          <p>
            <strong>Prediction:</strong>{" "}
            <span
              className={
                result.prediction === "Attack"
                  ? "status attack"
                  : "status normal"
              }
            >
              {result.prediction === "Attack"
                ? "🔴 ATTACK"
                : "🟢 NORMAL"}
            </span>
          </p>

          <p>
            <strong>Confidence:</strong>{" "}
            {result.confidence || "N/A"}
          </p>

          <p>
            <strong>Attack Type:</strong>{" "}
            {result.attack_type || "None"}
          </p>

          <p>
            <strong>Severity:</strong>{" "}
            {result.severity || "LOW"}
          </p>

        </div>
      )}

<div className="result-box">

  <h2>📁 Upload Test Dataset</h2>

  <p>
    Upload a CSV file containing network
    traffic features to test the trained
    Random Forest model.
  </p>

  <input
    type="file"
    accept=".csv"
    onChange={handleFileChange}
  />

  {selectedFile && (
    <p>
      Selected file:
      <strong> {selectedFile.name}</strong>
    </p>
  )}

  <button
    onClick={testCSVFile}
    disabled={!selectedFile || fileLoading}
  >
    {fileLoading
      ? "Testing..."
      : "🔍 Test CSV File"}
  </button>

  {fileError && (
    <p className="error">
      ❌ {fileError}
    </p>
  )}

</div>

{fileResult && (
  <div className="result-box">

    <h2>📊 CSV Model Test Result</h2>

    <p>
      <strong>File:</strong>{" "}
      {fileResult.filename}
    </p>

    <p>
      <strong>Total Records:</strong>{" "}
      {fileResult.total_records}
    </p>

    <p>
      <strong>Normal Records:</strong>{" "}
      {fileResult.normal_records}
    </p>

    <p>
      <strong>Attack Records:</strong>{" "}
      {fileResult.attack_records}
    </p>

    <p>
      <strong>Attack Percentage:</strong>{" "}
      {fileResult.attack_percentage}%
    </p>

    {fileResult.evaluation && (
      <>
        <hr />

        <h3>📈 Evaluation Metrics</h3>

        <p>
          <strong>Accuracy:</strong>{" "}
          {fileResult.evaluation.accuracy}%
        </p>

        <p>
          <strong>Precision:</strong>{" "}
          {fileResult.evaluation.precision}%
        </p>

        <p>
          <strong>Recall:</strong>{" "}
          {fileResult.evaluation.recall}%
        </p>

        <p>
          <strong>F1 Score:</strong>{" "}
          {fileResult.evaluation.f1_score}%
        </p>
      </>
    )}

  </div>
)}

    </div>

    
  );
}

export default ModelTesting;

