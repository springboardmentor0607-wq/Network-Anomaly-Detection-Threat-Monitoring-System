import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import {
  FaRobot,
  FaUpload,
  FaPlay,
  FaUndo,
  FaBrain,
  FaDatabase,
  FaCheckCircle,
  FaMicrochip,
  FaServer,
  FaClock,
  FaExclamationTriangle,
  FaChartLine,
  FaChartPie,
  FaChartBar,
  FaSearch,
  FaFileCsv,
  FaShieldAlt,
  FaSpinner,
  FaSlidersH,
  FaListAlt,
  FaExclamationCircle,
  FaTimesCircle,
  FaDownload,
  FaRandom
} from "react-icons/fa";

// Baseline manual flow preset
const BASELINE_MANUAL_FLOW = {
  source_ip: "192.168.1.105",
  dest_ip: "10.0.0.1",
  proto: "tcp",
  service: "http",
  state: "FIN",
  dur: 0.12,
  spkts: 10,
  dpkts: 8,
  sbytes: 752,
  dbytes: 1240,
  rate: 150,
  sttl: 62,
  dttl: 62,
  sload: 50133.3,
  dload: 82666.7,
  sloss: 0,
  dloss: 0,
  sinpkt: 12.5,
  dinpkt: 14.2,
  sjit: 1.2,
  djit: 1.8,
  swin: 255,
  stcpb: 1000,
  dtcpb: 1000,
  dwin: 255,
  tcprtt: 0.015,
  synack: 0.008,
  ackdat: 0.007,
  smean: 75,
  dmean: 155,
  trans_depth: 0,
  response_body_len: 0,
  ct_srv_src: 1,
  ct_state_ttl: 1,
  ct_dst_ltm: 1,
  ct_src_dport_ltm: 1,
  ct_dst_sport_ltm: 1,
  ct_dst_src_ltm: 1,
  is_ftp_login: 0,
  ct_ftp_cmd: 0,
  ct_flw_http_mthd: 0,
  ct_src_ltm: 1,
  ct_srv_dst: 1,
  is_sm_ips_ports: 0,
  swnd: 255,
  dwnd: 255
};

const initialPredictionResults = [
  { id: 1, timestamp: "2026-08-10 15:10:45", sourceIp: "192.168.1.104", destIp: "10.0.4.15", protocol: "TCP", prediction: "Normal Traffic", attackType: "Normal", confidence: "98.42%", confidence_score: 98.42, threat_level: "Low", risk_score: 10, status: "Normal Flow" },
  { id: 2, timestamp: "2026-08-10 15:10:42", sourceIp: "45.142.214.88", destIp: "10.0.0.1", protocol: "UDP", prediction: "Anomalous Traffic (DoS)", attackType: "DoS", confidence: "96.75%", confidence_score: 96.75, threat_level: "Critical", risk_score: 91, status: "Blocked" },
  { id: 3, timestamp: "2026-08-10 15:09:30", sourceIp: "192.168.1.112", destIp: "10.0.2.8", protocol: "HTTPS", prediction: "Normal Traffic", attackType: "Normal", confidence: "99.10%", confidence_score: 99.10, threat_level: "Low", risk_score: 8, status: "Normal Flow" },
  { id: 4, timestamp: "2026-08-10 15:08:15", sourceIp: "185.220.101.5", destIp: "10.0.0.5", protocol: "TCP", prediction: "Anomalous Traffic (Exploits)", attackType: "Exploits", confidence: "97.80%", confidence_score: 97.80, threat_level: "High", risk_score: 78, status: "Investigating" }
];

function AnomalyDetection() {
  const [activeTab, setActiveTab] = useState("manual"); // "manual" or "dataset"
  const [loading, setLoading] = useState(false);
  const [sampleLoading, setSampleLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [tableData, setTableData] = useState(initialPredictionResults);
  const [errorMessage, setErrorMessage] = useState("");
  const [successNotice, setSuccessNotice] = useState("");

  // Form State
  const [testForm, setTestForm] = useState(BASELINE_MANUAL_FLOW);
  const [actualClass, setActualClass] = useState(null); // Ground truth class (hidden until prediction)
  const [sampleInfo, setSampleInfo] = useState(null);
  const [singleResult, setSingleResult] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});

  // Analysis Summary State
  const [summary, setSummary] = useState({
    totalRecords: 257673,
    normal: 142100,
    anomalous: 115573,
    anomalyPct: "44.9%",
    normalPct: "55.1%",
    avgConfidence: "96.4%",
    avgRiskScore: 42.5,
    highThreats: 18450,
    criticalThreats: 12100,
    accuracy: "86.91%"
  });

  // Threat Classification Breakdown State
  const [threatCategories, setThreatCategories] = useState([
    { attack_type: "Normal", occurrences: 142100, percentage: "55.1%", avg_confidence: "98.2%", avg_risk_score: 10, threat_level: "Low" },
    { attack_type: "DoS", occurrences: 42100, percentage: "16.3%", avg_confidence: "96.4%", avg_risk_score: 91, threat_level: "Critical" },
    { attack_type: "Exploits", occurrences: 28500, percentage: "11.1%", avg_confidence: "94.8%", avg_risk_score: 76, threat_level: "High" },
    { attack_type: "Reconnaissance", occurrences: 22400, percentage: "8.7%", avg_confidence: "95.1%", avg_risk_score: 45, threat_level: "Medium" },
    { attack_type: "Fuzzers", occurrences: 14200, percentage: "5.5%", avg_confidence: "92.3%", avg_risk_score: 55, threat_level: "Medium" },
    { attack_type: "Generic", occurrences: 8373, percentage: "3.3%", avg_confidence: "91.0%", avg_risk_score: 70, threat_level: "High" }
  ]);

  // Distributions State
  const [severityDist, setSeverityDist] = useState({ Low: 142100, Medium: 36600, High: 36873, Critical: 42100 });
  const [riskDist, setRiskDist] = useState({ "0-25": 142100, "26-50": 36600, "51-75": 36873, "76-100": 42100 });
  const [confDist, setConfDist] = useState({ "<50%": 2100, "50-75%": 14500, "75-90%": 45000, "90-100%": 196073 });

  // Fetch model info on mount
  useEffect(() => {
    fetch("http://127.0.0.1:5000/model-info")
      .then((res) => res.json())
      .then((data) => {
        if (data && data.testing_accuracy) {
          setSummary((prev) => ({
            ...prev,
            accuracy: `${data.testing_accuracy}%`
          }));
        }
      })
      .catch(() => console.log("Model info offline."));
  }, []);

  const handleInputChange = (field, value) => {
    setTestForm((prev) => ({ ...prev, [field]: value }));
    if (validationErrors[field]) {
      setValidationErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  // 1. FETCH PREDEFINED TEST SAMPLE FROM manual_test_samples.csv
  const fetchManualTestSample = async (category = null) => {
    setErrorMessage("");
    setSuccessNotice("");
    setSampleLoading(true);
    setSingleResult(null);

    try {
      const url = category
        ? `http://127.0.0.1:5000/manual-test-sample/${encodeURIComponent(category)}`
        : `http://127.0.0.1:5000/manual-test-sample/load`;

      const response = await fetch(url);
      const data = await response.json();

      if (response.ok && data.features) {
        const fullForm = {
          source_ip: data.source_ip || "192.168.1.100",
          dest_ip: data.dest_ip || "10.0.0.1",
          proto: data.protocol || "tcp",
          service: data.service || "http",
          state: data.state || "FIN",
          ...data.features
        };

        setTestForm(fullForm);
        setActualClass(data.expected_attack);
        setSampleInfo({
          type: "manual_test_samples.csv",
          sampleId: data.sample_id,
          sampleName: data.sample_name,
          expectedAttack: data.expected_attack
        });
        setSuccessNotice(`Loaded predefined test sample "${data.sample_name}" from manual_test_samples.csv. Click [ ANALYZE TRAFFIC ] to evaluate model prediction.`);
      } else {
        setErrorMessage(data.message || "Failed to load sample from manual_test_samples.csv.");
      }
    } catch (err) {
      console.error("Fetch manual test sample error:", err);
      setErrorMessage("Backend connection error. Please ensure Flask backend is running on port 5000.");
    } finally {
      setSampleLoading(false);
    }
  };

  // 2. FETCH RANDOM REAL DATASET SAMPLE FROM UNSW-NB15 HELD-OUT TEST DATASET
  const fetchRandomRealTestSample = async (className = "random") => {
    setErrorMessage("");
    setSuccessNotice("");
    setSampleLoading(true);
    setSingleResult(null);

    try {
      const url = className === "random"
        ? "http://127.0.0.1:5000/test-sample/random"
        : `http://127.0.0.1:5000/test-sample/${encodeURIComponent(className)}`;

      const response = await fetch(url);
      const data = await response.json();

      if (response.ok && data.features) {
        const fullForm = {
          source_ip: data.source_ip || "192.168.1.100",
          dest_ip: data.dest_ip || "10.0.0.1",
          proto: data.protocol || "tcp",
          service: data.service || "http",
          state: data.state || "FIN",
          ...data.features
        };

        setTestForm(fullForm);
        setActualClass(data.actual_class);
        setSampleInfo({
          type: "UNSW_NB15_testing-set.csv",
          sampleIndex: data.sample_index,
          actualClass: data.actual_class
        });
        setSuccessNotice("Loaded random UNSW-NB15 held-out test sample. Network features are displayed below. Click [ ANALYZE TRAFFIC ] to evaluate model prediction.");
      } else {
        setErrorMessage(data.message || "UNSW-NB15 test dataset not found. Please verify the dataset path.");
      }
    } catch (err) {
      console.error("Fetch test sample error:", err);
      setErrorMessage("Backend connection error. Please ensure Flask backend is running on port 5000.");
    } finally {
      setSampleLoading(false);
    }
  };

  // MANUAL / TEST SAMPLE PREDICTION SUBMIT (POST /predict)
  const handleManualSubmit = async (e) => {
    e.preventDefault();
    setValidationErrors({});
    setErrorMessage("");

    const payload = {
      ...testForm,
      expected_attack: actualClass || undefined,
      actual_class: actualClass || undefined
    };

    setLoading(true);
    setSingleResult(null);

    try {
      const response = await fetch("http://127.0.0.1:5000/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (response.ok) {
        setSingleResult(data);

        const newEntry = {
          id: Date.now(),
          timestamp: new Date().toLocaleString(),
          sourceIp: data.source_ip || testForm.source_ip,
          destIp: data.dest_ip || testForm.dest_ip,
          protocol: (data.protocol || testForm.proto).toUpperCase(),
          prediction: data.prediction,
          attackType: data.attack_type,
          confidence: data.confidence,
          confidence_score: data.confidence_score,
          threat_level: data.threat_level,
          risk_score: data.risk_score,
          status: data.is_anomaly ? "Blocked" : "Normal Flow"
        };

        setTableData((prev) => [newEntry, ...prev]);
      } else {
        setErrorMessage(data.message || "Backend prediction error.");
      }
    } catch (err) {
      console.error("Predict API error:", err);
      setErrorMessage("Backend connection error! Check python app.py on http://127.0.0.1:5000.");
    } finally {
      setLoading(false);
    }
  };

  // DATASET ANALYSIS SUBMIT (POST /upload)
  const handleDatasetSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessNotice("");

    if (!selectedFile) {
      setErrorMessage("Please select a CSV dataset file first.");
      return;
    }

    if (!selectedFile.name.toLowerCase().endsWith(".csv")) {
      setErrorMessage("Unsupported format! Upload a valid .csv dataset file.");
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const response = await fetch("http://127.0.0.1:5000/upload", {
        method: "POST",
        body: formData
      });

      const data = await response.json();

      if (response.ok) {
        setSummary((prev) => ({
          ...prev,
          totalRecords: data.total_records || prev.totalRecords,
          normal: data.normal || prev.normal,
          anomalous: data.attacks || prev.anomalous,
          anomalyPct: `${data.anomaly_percentage}%`,
          normalPct: `${data.normal_percentage}%`,
          avgConfidence: data.avg_confidence || prev.avgConfidence,
          avgRiskScore: data.avg_risk_score || prev.avgRiskScore,
          highThreats: data.high_threats || 0,
          criticalThreats: data.critical_threats || 0
        }));

        if (data.threat_classification && data.threat_classification.length > 0) setThreatCategories(data.threat_classification);
        if (data.severity_distribution) setSeverityDist(data.severity_distribution);
        if (data.risk_distribution) setRiskDist(data.risk_distribution);
        if (data.confidence_distribution) setConfDist(data.confidence_distribution);
        if (data.predictions && data.predictions.length > 0) setTableData(data.predictions);

        setSuccessNotice(`Dataset Analysis Completed! Analyzed ${data.evaluated_records || data.total_records} records with saved Random Forest Classifier.`);
      } else {
        setErrorMessage(data.message || "Failed to analyze dataset.");
      }
    } catch (err) {
      console.error("Dataset upload error:", err);
      setErrorMessage("Backend connection error! Verify Flask server (python app.py) is online on port 5000.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setTestForm(BASELINE_MANUAL_FLOW);
    setActualClass(null);
    setSampleInfo(null);
    setSingleResult(null);
    setValidationErrors({});
    setSelectedFile(null);
    setErrorMessage("");
    setSuccessNotice("");
  };

  const filteredResults = tableData.filter(
    (item) =>
      (item.sourceIp && item.sourceIp.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.destIp && item.destIp.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.prediction && item.prediction.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.attackType && item.attackType.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.protocol && item.protocol.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="soc-layout">
      <Sidebar role="Security Analyst" />
      <Topbar title="AI Anomaly Detection Module" />

      <div className="soc-main-content">
        {/* Title & Subtitle */}
        <div className="dashboard-header">
          <div>
            <h1 className="dashboard-title">
              🤖 AI Anomaly Detection & Network Traffic Analysis
            </h1>
            <p className="dashboard-subtitle">
              Supervised end-to-end network traffic evaluation powered by the saved Random Forest Classifier (<code style={{ color: "#00f2fe" }}>netshield_model.pkl</code>).
            </p>
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            <button
              onClick={() => setActiveTab("manual")}
              className={`anomaly-btn-action ${activeTab === "manual" ? "active-tab-btn" : ""}`}
              style={{ background: activeTab === "manual" ? "rgba(0, 242, 254, 0.2)" : undefined, borderColor: activeTab === "manual" ? "#00f2fe" : undefined, color: activeTab === "manual" ? "#00f2fe" : undefined }}
            >
              <FaSlidersH /> Manual Analysis
            </button>
            <button
              onClick={() => setActiveTab("dataset")}
              className={`anomaly-btn-action ${activeTab === "dataset" ? "active-tab-btn" : ""}`}
              style={{ background: activeTab === "dataset" ? "rgba(0, 242, 254, 0.2)" : undefined, borderColor: activeTab === "dataset" ? "#00f2fe" : undefined, color: activeTab === "dataset" ? "#00f2fe" : undefined }}
            >
              <FaFileCsv /> Dataset Analysis
            </button>
          </div>
        </div>

        {/* Global Notifications */}
        {errorMessage && (
          <div className="soc-card" style={{ background: "rgba(239, 68, 68, 0.1)", borderColor: "rgba(239, 68, 68, 0.5)", marginBottom: "20px", color: "#fca5a5", display: "flex", alignItems: "center", gap: "12px" }}>
            <FaExclamationCircle style={{ fontSize: "1.3rem", color: "#ef4444", flexShrink: 0 }} />
            <div><strong>Notice:</strong> {errorMessage}</div>
          </div>
        )}

        {successNotice && (
          <div className="soc-card" style={{ background: "rgba(16, 185, 129, 0.1)", borderColor: "rgba(16, 185, 129, 0.5)", marginBottom: "20px", color: "#6ee7b7", display: "flex", alignItems: "center", gap: "12px" }}>
            <FaCheckCircle style={{ fontSize: "1.3rem", color: "#10b981", flexShrink: 0 }} />
            <div><strong>Success:</strong> {successNotice}</div>
          </div>
        )}

        {/* ================================================== */}
        {/* 1. MANUAL NETWORK TRAFFIC ANALYSIS SECTION */}
        {/* ================================================== */}
        {activeTab === "manual" && (
          <div className="soc-card" style={{ marginBottom: "24px", borderColor: "rgba(0, 242, 254, 0.3)" }}>
            
            {/* SECTION HEADER */}
            <div style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.1)", paddingBottom: "16px", marginBottom: "20px" }}>
              <h3 className="section-title" style={{ fontSize: "1.25rem", display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                <FaSlidersH style={{ color: "#00f2fe" }} /> Manual Network Traffic Analysis
              </h3>
              <p style={{ color: "#94a3b8", fontSize: "0.88rem", margin: 0 }}>
                Enter network-flow features manually or load a predefined test sample.
              </p>

              {/* DATASET TEST SAMPLE LOADER CONTROL BAR */}
              <div style={{ marginTop: "18px", background: "#0f172a", padding: "16px", borderRadius: "8px", border: "1px solid rgba(0, 242, 254, 0.3)" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "14px" }}>
                  <div>
                    <div style={{ fontSize: "0.98rem", color: "#f8fafc", fontWeight: "700", display: "flex", alignItems: "center", gap: "8px" }}>
                      <FaDatabase style={{ color: "#00f2fe" }} /> Predefined Test Sample Option
                    </div>
                    <div style={{ fontSize: "0.83rem", color: "#94a3b8", marginTop: "3px" }}>
                      Loads a predefined network-flow sample from <code style={{ color: "#00f2fe" }}>manual_test_samples.csv</code>.
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => fetchManualTestSample(null)}
                    className="anomaly-btn-primary"
                    disabled={sampleLoading}
                    style={{ padding: "10px 22px", fontSize: "0.9rem", background: "linear-gradient(135deg, #00f2fe 0%, #4facfe 100%)", boxShadow: "0 0 12px rgba(0, 242, 254, 0.3)" }}
                  >
                    {sampleLoading ? <FaSpinner className="spin-icon" /> : <FaDownload />}
                    {sampleLoading ? "Loading..." : "Load Test Sample"}
                  </button>
                </div>

                {/* CATEGORY QUICK-LOAD PRESETS FROM manual_test_samples.csv */}
                <div style={{ borderTop: "1px solid rgba(255, 255, 255, 0.08)", paddingTop: "12px", marginTop: "12px" }}>
                  <div style={{ fontSize: "0.78rem", color: "#38bdf8", fontWeight: "700", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    Load Stored Sample by Category:
                  </div>
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    {[
                      { name: "Normal", label: "Normal Flow" },
                      { name: "DoS", label: "DoS Attack" },
                      { name: "Reconnaissance", label: "Recon Scan" },
                      { name: "Exploits", label: "Exploit Payload" },
                      { name: "Fuzzers", label: "Fuzzers Sample" },
                      { name: "Generic", label: "Generic Attack" }
                    ].map((cat) => (
                      <button
                        key={cat.name}
                        type="button"
                        onClick={() => fetchManualTestSample(cat.name)}
                        disabled={sampleLoading}
                        style={{
                          padding: "6px 14px",
                          borderRadius: "6px",
                          fontSize: "0.8rem",
                          fontWeight: "600",
                          cursor: "pointer",
                          background: cat.name === "Normal" ? "rgba(16, 185, 129, 0.15)" : cat.name === "DoS" ? "rgba(239, 68, 68, 0.15)" : "rgba(56, 189, 248, 0.15)",
                          color: cat.name === "Normal" ? "#34d399" : cat.name === "DoS" ? "#fca5a5" : "#7dd3fc",
                          border: `1px solid ${cat.name === "Normal" ? "rgba(16, 185, 129, 0.3)" : cat.name === "DoS" ? "rgba(239, 68, 68, 0.3)" : "rgba(56, 189, 248, 0.3)"}`
                        }}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* REAL UNSW-NB15 DATASET CARD */}
              <div style={{ marginTop: "16px", background: "rgba(15, 23, 42, 0.8)", padding: "14px 16px", borderRadius: "8px", border: "1px solid #1e293b", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
                <div>
                  <div style={{ fontSize: "0.92rem", color: "#38bdf8", fontWeight: "700", display: "flex", alignItems: "center", gap: "6px" }}>
                    <FaDatabase /> Real UNSW-NB15 Test Analysis
                  </div>
                  <div style={{ fontSize: "0.82rem", color: "#94a3b8", marginTop: "2px" }}>
                    Evaluates a randomly selected record from the held-out UNSW-NB15 testing dataset.
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => fetchRandomRealTestSample("random")}
                  className="anomaly-btn-action"
                  disabled={sampleLoading}
                  style={{ padding: "8px 18px", fontSize: "0.85rem", background: "rgba(168, 85, 247, 0.15)", borderColor: "rgba(168, 85, 247, 0.4)", color: "#c084fc" }}
                >
                  {sampleLoading ? <FaSpinner className="spin-icon" /> : <FaRandom />}
                  Load Real UNSW-NB15 Record
                </button>
              </div>
            </div>

            {/* FORM INPUTS / TRAFFIC FEATURES DISPLAY */}
            <form onSubmit={handleManualSubmit}>
              {/* Traffic Flow Identifiers */}
              <div style={{ marginBottom: "20px" }}>
                <h4 style={{ fontSize: "0.92rem", color: "#38bdf8", marginBottom: "12px", borderBottom: "1px solid rgba(56, 189, 248, 0.2)", paddingBottom: "4px", display: "flex", alignItems: "center", gap: "6px" }}>
                  <FaServer /> 1. Network Traffic Flow Features (Source/Dest IP, Protocol, Service, State, Duration)
                </h4>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.78rem", color: "#cbd5e1", marginBottom: "4px" }}>Source IP</label>
                    <input type="text" value={testForm.source_ip || ""} onChange={(e) => handleInputChange("source_ip", e.target.value)} style={{ width: "100%", padding: "7px 10px", background: "#0f172a", border: "1px solid #334155", borderRadius: "6px", color: "#f8fafc", fontFamily: "var(--font-mono)", fontSize: "0.85rem" }} />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "0.78rem", color: "#cbd5e1", marginBottom: "4px" }}>Destination IP</label>
                    <input type="text" value={testForm.dest_ip || ""} onChange={(e) => handleInputChange("dest_ip", e.target.value)} style={{ width: "100%", padding: "7px 10px", background: "#0f172a", border: "1px solid #334155", borderRadius: "6px", color: "#f8fafc", fontFamily: "var(--font-mono)", fontSize: "0.85rem" }} />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "0.78rem", color: "#cbd5e1", marginBottom: "4px" }}>Protocol (proto)</label>
                    <input type="text" value={testForm.proto || "tcp"} onChange={(e) => handleInputChange("proto", e.target.value)} style={{ width: "100%", padding: "7px 10px", background: "#0f172a", border: "1px solid #334155", borderRadius: "6px", color: "#f8fafc", fontSize: "0.85rem" }} />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "0.78rem", color: "#cbd5e1", marginBottom: "4px" }}>Service (service)</label>
                    <input type="text" value={testForm.service || "http"} onChange={(e) => handleInputChange("service", e.target.value)} style={{ width: "100%", padding: "7px 10px", background: "#0f172a", border: "1px solid #334155", borderRadius: "6px", color: "#f8fafc", fontSize: "0.85rem" }} />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "0.78rem", color: "#cbd5e1", marginBottom: "4px" }}>State (state)</label>
                    <input type="text" value={testForm.state || "FIN"} onChange={(e) => handleInputChange("state", e.target.value)} style={{ width: "100%", padding: "7px 10px", background: "#0f172a", border: "1px solid #334155", borderRadius: "6px", color: "#f8fafc", fontSize: "0.85rem" }} />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "0.78rem", color: "#cbd5e1", marginBottom: "4px" }}>Duration (dur)</label>
                    <input type="number" step="any" value={testForm.dur ?? 0} onChange={(e) => handleInputChange("dur", e.target.value)} style={{ width: "100%", padding: "7px 10px", background: "#0f172a", border: "1px solid #334155", borderRadius: "6px", color: "#f8fafc", fontSize: "0.85rem" }} />
                  </div>
                </div>
              </div>

              {/* Key Flow Features Grid */}
              <div style={{ marginBottom: "20px" }}>
                <h4 style={{ fontSize: "0.92rem", color: "#38bdf8", marginBottom: "12px", borderBottom: "1px solid rgba(56, 189, 248, 0.2)", paddingBottom: "4px", display: "flex", alignItems: "center", gap: "6px" }}>
                  <FaSlidersH /> 2. Traffic Feature Statistics (spkts, sbytes, rate, sttl, sload, sinpkt, sjit, swin, tcprtt)
                </h4>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "12px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.78rem", color: "#cbd5e1", marginBottom: "4px" }}>spkts (Fwd Packets)</label>
                    <input type="number" value={testForm.spkts ?? 0} onChange={(e) => handleInputChange("spkts", e.target.value)} style={{ width: "100%", padding: "7px 10px", background: "#0f172a", border: "1px solid #334155", borderRadius: "6px", color: "#f8fafc", fontSize: "0.85rem" }} />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "0.78rem", color: "#cbd5e1", marginBottom: "4px" }}>dpkts (Bwd Packets)</label>
                    <input type="number" value={testForm.dpkts ?? 0} onChange={(e) => handleInputChange("dpkts", e.target.value)} style={{ width: "100%", padding: "7px 10px", background: "#0f172a", border: "1px solid #334155", borderRadius: "6px", color: "#f8fafc", fontSize: "0.85rem" }} />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "0.78rem", color: "#cbd5e1", marginBottom: "4px" }}>sbytes (Fwd Bytes)</label>
                    <input type="number" value={testForm.sbytes ?? 0} onChange={(e) => handleInputChange("sbytes", e.target.value)} style={{ width: "100%", padding: "7px 10px", background: "#0f172a", border: "1px solid #334155", borderRadius: "6px", color: "#f8fafc", fontSize: "0.85rem" }} />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "0.78rem", color: "#cbd5e1", marginBottom: "4px" }}>dbytes (Bwd Bytes)</label>
                    <input type="number" value={testForm.dbytes ?? 0} onChange={(e) => handleInputChange("dbytes", e.target.value)} style={{ width: "100%", padding: "7px 10px", background: "#0f172a", border: "1px solid #334155", borderRadius: "6px", color: "#f8fafc", fontSize: "0.85rem" }} />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "0.78rem", color: "#cbd5e1", marginBottom: "4px" }}>rate (Packets/s)</label>
                    <input type="number" step="any" value={testForm.rate ?? 0} onChange={(e) => handleInputChange("rate", e.target.value)} style={{ width: "100%", padding: "7px 10px", background: "#0f172a", border: "1px solid #334155", borderRadius: "6px", color: "#f8fafc", fontSize: "0.85rem" }} />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "0.78rem", color: "#cbd5e1", marginBottom: "4px" }}>sttl (Source TTL)</label>
                    <input type="number" value={testForm.sttl ?? 0} onChange={(e) => handleInputChange("sttl", e.target.value)} style={{ width: "100%", padding: "7px 10px", background: "#0f172a", border: "1px solid #334155", borderRadius: "6px", color: "#f8fafc", fontSize: "0.85rem" }} />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "0.78rem", color: "#cbd5e1", marginBottom: "4px" }}>sload (Bits/s)</label>
                    <input type="number" step="any" value={testForm.sload ?? 0} onChange={(e) => handleInputChange("sload", e.target.value)} style={{ width: "100%", padding: "7px 10px", background: "#0f172a", border: "1px solid #334155", borderRadius: "6px", color: "#f8fafc", fontSize: "0.85rem" }} />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "0.78rem", color: "#cbd5e1", marginBottom: "4px" }}>ct_srv_src (Count)</label>
                    <input type="number" value={testForm.ct_srv_src ?? 0} onChange={(e) => handleInputChange("ct_srv_src", e.target.value)} style={{ width: "100%", padding: "7px 10px", background: "#0f172a", border: "1px solid #334155", borderRadius: "6px", color: "#f8fafc", fontSize: "0.85rem" }} />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "16px" }}>
                <button type="button" onClick={handleReset} className="anomaly-btn-reset" style={{ padding: "8px 18px", fontSize: "0.9rem" }}>
                  <FaUndo /> Reset
                </button>
                <button type="submit" className="anomaly-btn-primary" disabled={loading} style={{ padding: "10px 28px", fontSize: "0.92rem", background: "linear-gradient(135deg, #00f2fe 0%, #4facfe 100%)" }}>
                  {loading ? <FaSpinner className="spin-icon" /> : <FaPlay />}
                  {loading ? "Evaluating Random Forest..." : "ANALYZE TRAFFIC"}
                </button>
              </div>
            </form>

            {/* AI PREDICTION RESULT & GROUND TRUTH EVALUATION CARDS */}
            {singleResult && (
              <div style={{ marginTop: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
                {/* 1. AI PREDICTION RESULT CARD */}
                <div className="soc-card prediction-result-card" style={{ borderColor: singleResult.is_anomaly ? "rgba(239, 68, 68, 0.6)" : "rgba(16, 185, 129, 0.6)", background: singleResult.is_anomaly ? "rgba(239, 68, 68, 0.08)" : "rgba(16, 185, 129, 0.08)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "12px" }}>
                    <div>
                      <h3 style={{ fontSize: "1.25rem", color: "#f8fafc", display: "flex", alignItems: "center", gap: "10px", margin: 0 }}>
                        🧠 AI Prediction Result
                      </h3>
                      <span style={{ fontSize: "0.8rem", color: "#94a3b8" }}>Model Engine: Random Forest Classifier (netshield_model.pkl)</span>
                    </div>

                    <span className={`badge badge-${(singleResult.threat_level || "low").toLowerCase()}`} style={{ fontSize: "0.9rem", padding: "6px 14px" }}>
                      Threat Level: {singleResult.threat_level}
                    </span>
                  </div>

                  {/* ALERT GENERATION INDICATOR BANNER */}
                  {singleResult.alert_generated ? (
                    <div style={{ background: "rgba(239, 68, 68, 0.15)", border: "1px solid #ef4444", borderRadius: "8px", padding: "10px 16px", marginBottom: "16px", color: "#fca5a5", fontSize: "0.9rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <FaExclamationTriangle style={{ color: "#ef4444" }} />
                        <strong>Security Alert Generated:</strong> <code style={{ color: "#f8fafc", fontFamily: "var(--font-mono)" }}>{singleResult.alert_id}</code> (Status: <span style={{ color: "#38bdf8", fontWeight: "700" }}>{singleResult.alert_status || "New"}</span>)
                      </div>
                      <span style={{ fontSize: "0.8rem", color: "#94a3b8" }}>Persisted in Security Alert Database</span>
                    </div>
                  ) : (
                    <div style={{ background: "rgba(16, 185, 129, 0.1)", border: "1px solid #10b981", borderRadius: "8px", padding: "10px 16px", marginBottom: "16px", color: "#6ee7b7", fontSize: "0.88rem", display: "flex", alignItems: "center", gap: "8px" }}>
                      <FaCheckCircle style={{ color: "#10b981" }} />
                      <span>Benign Normal Traffic — No Security Alert Generated.</span>
                    </div>
                  )}

                  <div className="soc-grid-4" style={{ marginBottom: "16px" }}>
                    <div className="soc-card" style={{ background: "#0f172a" }}>
                      <span className="model-info-label">Prediction</span>
                      <span className="model-info-value" style={{ color: singleResult.is_anomaly ? "#fca5a5" : "#6ee7b7", fontSize: "1.05rem" }}>
                        {singleResult.prediction}
                      </span>
                    </div>

                    <div className="soc-card" style={{ background: "#0f172a" }}>
                      <span className="model-info-label">Predicted Attack Type</span>
                      <span className="model-info-value" style={{ color: singleResult.is_anomaly ? "#fca5a5" : "#6ee7b7", fontSize: "1.05rem" }}>
                        {singleResult.attack_type}
                      </span>
                    </div>

                    <div className="soc-card" style={{ background: "#0f172a" }}>
                      <span className="model-info-label">Confidence (predict_proba)</span>
                      <span className="model-info-value" style={{ color: "#c084fc", fontSize: "1.1rem", fontFamily: "var(--font-mono)" }}>
                        {singleResult.confidence}
                      </span>
                    </div>

                    <div className="soc-card" style={{ background: "#0f172a" }}>
                      <span className="model-info-label">Risk Score</span>
                      <span className="model-info-value" style={{ color: singleResult.risk_score > 70 ? "#ef4444" : singleResult.risk_score > 40 ? "#f97316" : "#34d399", fontSize: "1.1rem", fontFamily: "var(--font-mono)" }}>
                        {singleResult.risk_score} / 100
                      </span>
                    </div>
                  </div>
                </div>

                {/* 2. TEST SAMPLE EVALUATION CARD (Ground Truth Comparison) */}
                {(singleResult.actual_class || actualClass) && (
                  <div className="soc-card" style={{ background: "rgba(15, 23, 42, 0.95)", borderColor: "#334155" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px", flexWrap: "wrap", gap: "12px" }}>
                      <h4 style={{ fontSize: "1.1rem", color: "#f8fafc", display: "flex", alignItems: "center", gap: "8px", margin: 0 }}>
                        <FaCheckCircle style={{ color: "#00f2fe" }} /> Test Sample Evaluation
                      </h4>

                      {/* Correct / Incorrect Result Badge */}
                      {(() => {
                        const actual = (singleResult.actual_class || actualClass || "").trim().toLowerCase();
                        const predicted = (singleResult.attack_type || "").trim().toLowerCase();
                        const isCorrect = actual === predicted || (actual === "normal" && predicted === "normal");

                        return isCorrect ? (
                          <span style={{ background: "rgba(16, 185, 129, 0.2)", border: "1px solid #10b981", color: "#34d399", padding: "6px 16px", borderRadius: "20px", fontSize: "0.9rem", fontWeight: "700", display: "flex", alignItems: "center", gap: "6px" }}>
                            <FaCheckCircle /> ✓ Correct Prediction
                          </span>
                        ) : (
                          <span style={{ background: "rgba(239, 68, 68, 0.2)", border: "1px solid #ef4444", color: "#fca5a5", padding: "6px 16px", borderRadius: "20px", fontSize: "0.9rem", fontWeight: "700", display: "flex", alignItems: "center", gap: "6px" }}>
                            <FaExclamationTriangle /> ✗ Incorrect Prediction
                          </span>
                        );
                      })()}
                    </div>

                    <div className="soc-grid-3">
                      <div className="soc-card" style={{ background: "#090d16" }}>
                        <span className="model-info-label">Expected Attack Type</span>
                        <span className="model-info-value" style={{ color: "#00f2fe", fontSize: "1.1rem" }}>
                          {singleResult.actual_class || actualClass}
                        </span>
                      </div>

                      <div className="soc-card" style={{ background: "#090d16" }}>
                        <span className="model-info-label">Predicted Attack Type</span>
                        <span className="model-info-value" style={{ color: singleResult.is_anomaly ? "#fca5a5" : "#6ee7b7", fontSize: "1.1rem" }}>
                          {singleResult.attack_type}
                        </span>
                      </div>

                      <div className="soc-card" style={{ background: "#090d16" }}>
                        <span className="model-info-label">Evaluation Status</span>
                        <span className="model-info-value" style={{ color: ((singleResult.actual_class || actualClass || "").trim().toLowerCase() === (singleResult.attack_type || "").trim().toLowerCase()) ? "#34d399" : "#fca5a5", fontSize: "1.05rem" }}>
                          {((singleResult.actual_class || actualClass || "").trim().toLowerCase() === (singleResult.attack_type || "").trim().toLowerCase()) ? "✓ Match (Accurate)" : "✗ Misclassified"}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ================================================== */}
        {/* 2. DATASET CSV UPLOAD SECTION */}
        {/* ================================================== */}
        {activeTab === "dataset" && (
          <div className="soc-card upload-banner-card" style={{ marginBottom: "24px" }}>
            <h3 className="section-title" style={{ fontSize: "1.2rem", display: "flex", alignItems: "center", gap: "8px" }}>
              <FaFileCsv style={{ color: "#00f2fe" }} /> Upload Network Traffic CSV Dataset
            </h3>
            <p className="banner-subtitle" style={{ color: "#94a3b8", fontSize: "0.88rem", marginBottom: "16px" }}>
              Upload exported PCAP flow datasets (UNSW-NB15 / CICIDS2017 schema). The pre-trained Random Forest model will evaluate all valid records.
            </p>

            <form onSubmit={handleDatasetSubmit} className="upload-form" style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
              <input
                type="file"
                accept=".csv"
                onChange={(e) => setSelectedFile(e.target.files[0])}
                className="file-input"
                style={{ flex: 1, minWidth: "260px" }}
              />
              <button type="submit" className="anomaly-btn-primary" disabled={loading} style={{ padding: "8px 24px", fontSize: "0.9rem" }}>
                {loading ? <FaSpinner className="spin-icon" /> : <FaUpload />}
                {loading ? "Analyzing Dataset..." : "ANALYZE DATASET"}
              </button>
            </form>
          </div>
        )}

        {/* ================================================== */}
        {/* 3. OVERALL ANALYSIS SUMMARY METRICS GRID */}
        {/* ================================================== */}
        <h3 className="section-title" style={{ marginBottom: "16px", fontSize: "1.15rem", display: "flex", alignItems: "center", gap: "8px" }}>
          <FaBrain style={{ color: "#00f2fe" }} /> Overall Analysis Summary
        </h3>

        <div className="soc-grid-4" style={{ marginBottom: "24px" }}>
          <div className="soc-card">
            <div className="soc-card-title"><FaMicrochip style={{ color: "#00f2fe" }} /> Total Records Analyzed</div>
            <div className="soc-card-value">{summary.totalRecords.toLocaleString()}</div>
            <div className="soc-card-subtext">Evaluated Flow Samples</div>
          </div>

          <div className="soc-card">
            <div className="soc-card-title"><FaCheckCircle style={{ color: "#10b981" }} /> Normal Traffic</div>
            <div className="soc-card-value" style={{ color: "#34d399" }}>{summary.normal.toLocaleString()}</div>
            <div className="soc-card-subtext">{summary.normalPct} Benign</div>
          </div>

          <div className="soc-card">
            <div className="soc-card-title"><FaExclamationTriangle style={{ color: "#ef4444" }} /> Anomalous Traffic</div>
            <div className="soc-card-value" style={{ color: "#fca5a5" }}>{summary.anomalous.toLocaleString()}</div>
            <div className="soc-card-subtext">{summary.anomalyPct} Threats</div>
          </div>

          <div className="soc-card">
            <div className="soc-card-title"><FaBrain style={{ color: "#c084fc" }} /> Average Confidence</div>
            <div className="soc-card-value" style={{ color: "#c084fc" }}>{summary.avgConfidence}</div>
            <div className="soc-card-subtext">predict_proba Mean</div>
          </div>

          <div className="soc-card">
            <div className="soc-card-title"><FaShieldAlt style={{ color: "#f59e0b" }} /> Average Risk Score</div>
            <div className="soc-card-value" style={{ color: summary.avgRiskScore > 70 ? "#ef4444" : "#f59e0b" }}>{summary.avgRiskScore} / 100</div>
            <div className="soc-card-subtext">Deterministic Score</div>
          </div>

          <div className="soc-card">
            <div className="soc-card-title"><FaExclamationTriangle style={{ color: "#f97316" }} /> High-Risk Threats</div>
            <div className="soc-card-value" style={{ color: "#fbbf24" }}>{summary.highThreats.toLocaleString()}</div>
            <div className="soc-card-subtext">High Severity</div>
          </div>

          <div className="soc-card">
            <div className="soc-card-title"><FaExclamationTriangle style={{ color: "#ef4444" }} /> Critical Threats</div>
            <div className="soc-card-value" style={{ color: "#ef4444" }}>{summary.criticalThreats.toLocaleString()}</div>
            <div className="soc-card-subtext">Critical Severity</div>
          </div>

          <div className="soc-card">
            <div className="soc-card-title"><FaShieldAlt style={{ color: "#38bdf8" }} /> Model Test Accuracy</div>
            <div className="soc-card-value" style={{ color: "#38bdf8" }}>{summary.accuracy}</div>
            <div className="soc-card-subtext">Random Forest Classifier</div>
          </div>
        </div>

        {/* ================================================== */}
        {/* 4. THREAT CLASSIFICATION BREAKDOWN */}
        {/* ================================================== */}
        <div className="soc-card" style={{ marginBottom: "24px" }}>
          <h3 className="section-title" style={{ marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
            <FaChartBar style={{ color: "#f97316" }} /> Threat Classification Breakdown
          </h3>

          <table className="soc-table">
            <thead>
              <tr>
                <th>Attack Type</th>
                <th>Occurrences</th>
                <th>Percentage</th>
                <th>Avg Confidence</th>
                <th>Avg Risk Score</th>
                <th>Threat Level</th>
              </tr>
            </thead>
            <tbody>
              {threatCategories.map((cat, i) => (
                <tr key={i}>
                  <td style={{ color: cat.attack_type === "Normal" ? "#6ee7b7" : "#38bdf8", fontWeight: "600" }}>{cat.attack_type}</td>
                  <td style={{ fontFamily: "var(--font-mono)" }}>{cat.occurrences.toLocaleString()}</td>
                  <td style={{ color: "#cbd5e1" }}>{cat.percentage}</td>
                  <td style={{ color: "#c084fc", fontFamily: "var(--font-mono)" }}>{cat.avg_confidence}</td>
                  <td style={{ fontFamily: "var(--font-mono)", color: cat.avg_risk_score > 70 ? "#ef4444" : cat.avg_risk_score > 40 ? "#f97316" : "#34d399" }}>
                    {cat.avg_risk_score} / 100
                  </td>
                  <td>
                    <span className={`badge badge-${(cat.threat_level || "low").toLowerCase()}`}>
                      {cat.threat_level}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ================================================== */}
        {/* 5. DYNAMIC VISUALIZATIONS GRID (5 CHARTS) */}
        {/* ================================================== */}
        <h3 className="section-title" style={{ marginBottom: "16px", fontSize: "1.15rem", display: "flex", alignItems: "center", gap: "8px" }}>
          <FaChartPie style={{ color: "#10b981" }} /> Dynamic Visualizations & Distribution Analytics
        </h3>

        <div className="soc-grid-2" style={{ marginBottom: "24px" }}>
          {/* Chart 1: Normal vs Anomalous Traffic */}
          <div className="soc-card">
            <h4 style={{ color: "#38bdf8", fontSize: "0.95rem", marginBottom: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
              <FaChartPie /> 1. Normal vs Anomalous Traffic
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", padding: "12px 0" }}>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", marginBottom: "4px" }}>
                  <span>Benign Traffic</span>
                  <span style={{ color: "#34d399" }}>{summary.normal.toLocaleString()} ({summary.normalPct})</span>
                </div>
                <div style={{ height: "10px", background: "#0f172a", borderRadius: "5px", overflow: "hidden" }}>
                  <div style={{ width: summary.normalPct, height: "100%", background: "#10b981" }}></div>
                </div>
              </div>

              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", marginBottom: "4px" }}>
                  <span>Anomalous Traffic</span>
                  <span style={{ color: "#fca5a5" }}>{summary.anomalous.toLocaleString()} ({summary.anomalyPct})</span>
                </div>
                <div style={{ height: "10px", background: "#0f172a", borderRadius: "5px", overflow: "hidden" }}>
                  <div style={{ width: summary.anomalyPct, height: "100%", background: "#ef4444" }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Chart 2: Threat Severity Distribution */}
          <div className="soc-card">
            <h4 style={{ color: "#38bdf8", fontSize: "0.95rem", marginBottom: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
              <FaShieldAlt /> 2. Threat Severity Distribution
            </h4>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "10px", padding: "10px 0" }}>
              <div style={{ background: "#0f172a", padding: "10px", borderRadius: "8px", borderLeft: "4px solid #10b981" }}>
                <div style={{ fontSize: "0.8rem", color: "#94a3b8" }}>Low Severity</div>
                <div style={{ fontSize: "1.1rem", fontWeight: "700", color: "#34d399" }}>{severityDist.Low?.toLocaleString() || 0}</div>
              </div>
              <div style={{ background: "#0f172a", padding: "10px", borderRadius: "8px", borderLeft: "4px solid #f59e0b" }}>
                <div style={{ fontSize: "0.8rem", color: "#94a3b8" }}>Medium Severity</div>
                <div style={{ fontSize: "1.1rem", fontWeight: "700", color: "#fbbf24" }}>{severityDist.Medium?.toLocaleString() || 0}</div>
              </div>
              <div style={{ background: "#0f172a", padding: "10px", borderRadius: "8px", borderLeft: "4px solid #f97316" }}>
                <div style={{ fontSize: "0.8rem", color: "#94a3b8" }}>High Severity</div>
                <div style={{ fontSize: "1.1rem", fontWeight: "700", color: "#f97316" }}>{severityDist.High?.toLocaleString() || 0}</div>
              </div>
              <div style={{ background: "#0f172a", padding: "10px", borderRadius: "8px", borderLeft: "4px solid #ef4444" }}>
                <div style={{ fontSize: "0.8rem", color: "#94a3b8" }}>Critical Severity</div>
                <div style={{ fontSize: "1.1rem", fontWeight: "700", color: "#ef4444" }}>{severityDist.Critical?.toLocaleString() || 0}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="soc-grid-2" style={{ marginBottom: "24px" }}>
          {/* Chart 3: Risk Score Distribution */}
          <div className="soc-card">
            <h4 style={{ color: "#38bdf8", fontSize: "0.95rem", marginBottom: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
              <FaChartBar /> 3. Risk Score Distribution Ranges
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {Object.entries(riskDist).map(([range, val]) => (
                <div key={range}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", color: "#cbd5e1" }}>
                    <span>Score Range {range}</span>
                    <span style={{ color: "#38bdf8", fontFamily: "var(--font-mono)" }}>{val} flows</span>
                  </div>
                  <div style={{ height: "8px", background: "#0f172a", borderRadius: "4px", overflow: "hidden", marginTop: "2px" }}>
                    <div style={{ width: `${Math.min(100, (val / (summary.totalRecords || 1)) * 100 * 2)}%`, height: "100%", background: "#38bdf8" }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Chart 4: Confidence Distribution */}
          <div className="soc-card">
            <h4 style={{ color: "#38bdf8", fontSize: "0.95rem", marginBottom: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
              <FaBrain /> 4. Prediction Confidence Distribution
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {Object.entries(confDist).map(([range, val]) => (
                <div key={range}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", color: "#cbd5e1" }}>
                    <span>Confidence Range {range}</span>
                    <span style={{ color: "#c084fc", fontFamily: "var(--font-mono)" }}>{val} flows</span>
                  </div>
                  <div style={{ height: "8px", background: "#0f172a", borderRadius: "4px", overflow: "hidden", marginTop: "2px" }}>
                    <div style={{ width: `${Math.min(100, (val / (summary.totalRecords || 1)) * 100 * 1.5)}%`, height: "100%", background: "#c084fc" }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ================================================== */}
        {/* 6. DETAILED ANALYSIS RESULT TABLE */}
        {/* ================================================== */}
        <div className="soc-card full-width-card">
          <div className="soc-card-header-title" style={{ flexWrap: "wrap", gap: "12px" }}>
            <h3 className="section-title">
              <FaRobot style={{ color: "#00f2fe" }} /> Analysis Results Table
            </h3>

            <div style={{ position: "relative", minWidth: "280px" }}>
              <FaSearch style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#64748b" }} />
              <input
                type="text"
                placeholder="Search IP, Protocol, Attack, or Prediction..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ width: "100%", padding: "8px 12px 8px 36px", background: "#0f172a", border: "1px solid #334155", borderRadius: "8px", color: "#f8fafc", fontSize: "0.85rem", outline: "none" }}
              />
            </div>
          </div>

          <table className="soc-table">
            <thead>
              <tr>
                <th>Record #</th>
                <th>Timestamp</th>
                <th>Source IP</th>
                <th>Destination IP</th>
                <th>Protocol</th>
                <th>Prediction</th>
                <th>Attack Type</th>
                <th>Confidence</th>
                <th>Threat Level</th>
                <th>Risk Score</th>
              </tr>
            </thead>
            <tbody>
              {filteredResults.length > 0 ? (
                filteredResults.map((item, idx) => (
                  <tr key={item.id || idx}>
                    <td style={{ color: "#94a3b8", fontFamily: "var(--font-mono)" }}>#{item.id || idx + 1}</td>
                    <td style={{ color: "#94a3b8", fontFamily: "var(--font-mono)" }}>{item.timestamp}</td>
                    <td style={{ color: "#38bdf8", fontFamily: "var(--font-mono)", fontWeight: "600" }}>{item.sourceIp}</td>
                    <td style={{ color: "#cbd5e1", fontFamily: "var(--font-mono)" }}>{item.destIp}</td>
                    <td><span className="badge badge-normal" style={{ fontSize: "0.75rem" }}>{item.protocol}</span></td>
                    <td>
                      <span style={{ color: (item.prediction || "").includes("Anomalous") ? "#fca5a5" : "#6ee7b7", fontWeight: "600" }}>
                        {item.prediction}
                      </span>
                    </td>
                    <td style={{ color: item.attackType === "Normal" ? "#6ee7b7" : "#38bdf8", fontWeight: "600" }}>{item.attackType}</td>
                    <td style={{ fontFamily: "var(--font-mono)", color: "#c084fc", fontWeight: "700" }}>{item.confidence}</td>
                    <td><span className={`badge badge-${(item.threat_level || "low").toLowerCase()}`}>{item.threat_level}</span></td>
                    <td style={{ fontFamily: "var(--font-mono)", color: item.risk_score > 70 ? "#ef4444" : item.risk_score > 40 ? "#f97316" : "#34d399", fontWeight: "700" }}>
                      {item.risk_score} / 100
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="10" style={{ textAlign: "center", padding: "24px", color: "#64748b" }}>
                    No analysis results matched your search query.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default AnomalyDetection;
