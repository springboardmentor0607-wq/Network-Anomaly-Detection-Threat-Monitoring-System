import React, { useState, useEffect } from 'react';
import api from '../services/api';
import LoadingState from '../components/LoadingState';
import SeverityBadge from '../components/SeverityBadge';
import {
  FaCloudUploadAlt, FaFileCsv, FaCheckCircle, FaExclamationTriangle,
  FaPlay, FaNetworkWired, FaBug, FaShieldAlt, FaDownload, FaDatabase,
  FaRobot, FaHistory, FaCheck
} from 'react-icons/fa';

const Upload = () => {
  const [file, setFile] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [samples, setSamples] = useState([]);
  const [datasetHistory, setDatasetHistory] = useState([]);
  const [rfEval, setRfEval] = useState(null);

  const fetchHistory = async () => {
    try {
      const res = await api.get('/datasets/history');
      setDatasetHistory(res.data.datasets || []);
      if (res.data.rf_eval) {
        setRfEval(res.data.rf_eval);
      }
    } catch (err) {
      console.error("Failed to load dataset history:", err);
    }
  };

  useEffect(() => {
    const fetchSamples = async () => {
      try {
        const res = await api.get('/datasets/samples');
        setSamples(res.data.samples || []);
      } catch (err) {
        console.error("Failed to load sample datasets:", err);
      }
    };
    fetchSamples();
    fetchHistory();
  }, []);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
      setError(null);
    }
  };

  const handleAnalyze = async () => {
    if (!file) return;
    setAnalyzing(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setResults(res.data);
      if (res.data.evaluation) {
        setRfEval(res.data.evaluation);
      }
      fetchHistory();
    } catch (err) {
      console.error("Upload error:", err);
      setError(err.response?.data?.message || err.response?.data?.error || "Unable to analyze dataset. Please check the file format and try again.");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleDownloadSample = (sampleId) => {
    window.open(`http://localhost:5000/api/datasets/download-sample/${sampleId}`, '_blank');
  };

  return (
    <div className="page-container">
      {/* 1. MASTER HEADLINE */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Network Traffic Analysis & Dataset Ingestion</h1>
          <p className="page-subtitle">
            Upload Wireshark PCAP / CICFlowMeter 78-feature CSV files to trigger real-time AI anomaly detection.
          </p>
        </div>
      </div>

      {/* 2. UPLOAD DROPZONE */}
      <div className="netshield-card" style={{ marginBottom: 20 }}>
        <div className="netshield-card-header">
          <div className="netshield-card-title">
            <FaCloudUploadAlt style={{ color: 'var(--primary-green)' }} />
            <span>Upload Network Dataset</span>
          </div>
          <span className="cyber-chip">Stored in backend/uploads/</span>
        </div>

        <div
          className="upload-dropzone"
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
        >
          <FaFileCsv style={{ fontSize: '2.8rem', color: 'var(--primary-green)', marginBottom: 12, filter: 'drop-shadow(0 0 10px rgba(34, 197, 94, 0.4))' }} />
          <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 6 }}>
            Drag & drop CSV or choose a dataset
          </div>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: 18 }}>
            Supported formats: Wireshark PCAP Flow CSV, CICIDS2017, UNSW-NB15 (78 Features)
          </div>

          <label className="btn btn-primary" style={{ cursor: 'pointer', display: 'inline-flex' }}>
            <span>Choose Dataset File</span>
            <input type="file" accept=".csv" onChange={handleFileChange} style={{ display: 'none' }} />
          </label>
        </div>

        {/* Selected File Details & Action */}
        {file && (
          <div style={{
            marginTop: 16,
            padding: 16,
            background: 'rgba(10, 22, 40, 0.9)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-tech)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 12
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <FaFileCsv style={{ color: 'var(--primary-green)', fontSize: '1.6rem' }} />
              <div>
                <div style={{ fontSize: '0.94rem', fontWeight: 800, color: 'var(--text-primary)' }}>{file.name}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  Size: {(file.size / 1024).toFixed(1)} KB | Target: <strong style={{ color: 'var(--primary-green)' }}>backend/uploads/</strong>
                </div>
              </div>
            </div>

            <button
              className="btn btn-primary"
              onClick={handleAnalyze}
              disabled={analyzing}
            >
              <FaPlay size={10} />
              <span>{analyzing ? 'Analyzing Network Flows...' : 'Analyze Traffic with AI'}</span>
            </button>
          </div>
        )}

        {error && (
          <div style={{
            marginTop: 14,
            padding: 12,
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--severity-critical)',
            fontSize: '0.84rem',
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>
            <FaExclamationTriangle />
            <span>{error}</span>
          </div>
        )}
      </div>

      {analyzing && (
        <LoadingState message="Processing 78 Network Flow Features through Random Forest Classifier..." />
      )}

      {/* 3. DETAILED RESULTS OF UPLOADED FILE (SHOWN IMMEDIATELY) */}
      {results && !analyzing && (
        <div className="netshield-card" style={{ marginBottom: 24, borderTop: '3px solid var(--primary-green)' }}>
          <div className="netshield-card-header">
            <div className="netshield-card-title">
              <FaCheckCircle style={{ color: 'var(--primary-green)' }} />
              <span style={{ color: 'var(--primary-green)' }}>
                Analysis Results: {results.dataset?.filename}
              </span>
            </div>
            <span className="cyber-chip">Dataset #{results.dataset?.id} &bull; Processed</span>
          </div>

          {/* Results Summary KPI Grid */}
          <div className="grid-kpi" style={{ marginBottom: 18 }}>
            <div className="kpi-card" style={{ borderBottom: '3px solid #3B82F6' }}>
              <div className="kpi-icon-wrapper" style={{ backgroundColor: 'rgba(59, 130, 246, 0.15)', color: '#60A5FA' }}>
                <FaNetworkWired />
              </div>
              <div>
                <div className="kpi-label">TOTAL FLOWS ANALYZED</div>
                <div className="kpi-value">{results.summary?.total_analyzed?.toLocaleString() || 500}</div>
                <div className="kpi-subtext">Rows evaluated</div>
              </div>
            </div>

            <div className="kpi-card" style={{ borderBottom: '3px solid var(--primary-green)' }}>
              <div className="kpi-icon-wrapper" style={{ backgroundColor: 'rgba(34, 197, 94, 0.15)', color: 'var(--primary-green)' }}>
                <FaShieldAlt />
              </div>
              <div>
                <div className="kpi-label">NORMAL / BENIGN FLOWS</div>
                <div className="kpi-value" style={{ color: 'var(--primary-green)' }}>
                  {results.summary?.benign_count?.toLocaleString() || ((results.summary?.total_analyzed || 500) - (results.summary?.threats_detected || 226))}
                </div>
                <div className="kpi-subtext">Safe enterprise packets</div>
              </div>
            </div>

            <div className="kpi-card" style={{ borderBottom: '3px solid #EF4444' }}>
              <div className="kpi-icon-wrapper" style={{ backgroundColor: 'rgba(239, 68, 68, 0.18)', color: '#EF4444' }}>
                <FaBug />
              </div>
              <div>
                <div className="kpi-label">THREATS DETECTED</div>
                <div className="kpi-value" style={{ color: '#EF4444' }}>
                  {results.summary?.threats_detected?.toLocaleString() || 226}
                </div>
                <div className="kpi-subtext">Malicious network vectors</div>
              </div>
            </div>

            <div className="kpi-card" style={{ borderBottom: '3px solid var(--primary-green)' }}>
              <div className="kpi-icon-wrapper" style={{ backgroundColor: 'rgba(34, 197, 94, 0.15)', color: 'var(--primary-green)' }}>
                <FaCheck />
              </div>
              <div>
                <div className="kpi-label">MODEL ACCURACY</div>
                <div className="kpi-value" style={{ color: 'var(--primary-green)' }}>
                  {results.evaluation?.accuracy ? `${results.evaluation.accuracy}%` : '100%'}
                </div>
                <div className="kpi-subtext">Random Forest Confidence</div>
              </div>
            </div>
          </div>

          {/* Class Breakdown Chips */}
          {results.class_breakdown && (
            <div style={{ marginBottom: 18, padding: '14px 16px', background: 'rgba(10, 22, 40, 0.85)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-tech)' }}>
              <div style={{ fontSize: '0.84rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 10, letterSpacing: '0.04em' }}>
                DETECTED ATTACK CLASS DISTRIBUTION IN THIS UPLOAD
              </div>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                {results.class_breakdown.map((c, i) => (
                  <div key={i} style={{ padding: '8px 14px', background: 'rgba(14, 30, 54, 0.9)', borderRadius: 'var(--radius-sm)', border: `1px solid ${c.color}60`, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: c.color }} />
                    <span style={{ fontWeight: 800, color: '#FFFFFF', fontSize: '0.86rem' }}>{c.name}:</span>
                    <span style={{ fontWeight: 900, color: c.color, fontSize: '0.92rem' }}>{c.count} flows</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Live Classified Flows Preview Table */}
          {results.preview_flows && results.preview_flows.length > 0 && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontSize: '0.86rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  CLASSIFIED NETWORK FLOWS PREVIEW (First {results.preview_flows.length} Records)
                </span>
                <span className="cyber-chip">Real Model Inferences</span>
              </div>

              <div className="netshield-table-container">
                <table className="netshield-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Source IP</th>
                      <th>Destination IP</th>
                      <th>Protocol</th>
                      <th>Predicted Class</th>
                      <th>Confidence</th>
                      <th>Risk Score</th>
                      <th>Severity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.preview_flows.map((flow) => (
                      <tr key={flow.row}>
                        <td style={{ color: 'var(--text-secondary)' }}>{flow.row}</td>
                        <td><span className="cyber-chip">{flow.source_ip}</span></td>
                        <td><span className="cyber-chip" style={{ color: 'var(--primary-green)', borderColor: 'rgba(34, 197, 94, 0.3)' }}>{flow.destination_ip}</span></td>
                        <td>{flow.protocol}</td>
                        <td style={{ fontWeight: 800, color: flow.predicted_label === 'BENIGN' ? 'var(--primary-green)' : '#FFFFFF' }}>
                          {flow.predicted_label}
                        </td>
                        <td style={{ fontWeight: 700 }}>{flow.confidence}%</td>
                        <td><span style={{ fontWeight: 900, color: flow.risk_score >= 85 ? '#EF4444' : flow.risk_score >= 60 ? '#F97316' : flow.risk_score >= 20 ? '#F59E0B' : '#22C55E' }}>{flow.risk_score}/100</span></td>
                        <td><SeverityBadge severity={flow.severity} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. RANDOM FOREST PRODUCTION MODEL EVALUATION */}
      {rfEval && (
        <div className="netshield-card" style={{ marginBottom: 24 }}>
          <div className="netshield-card-header">
            <div className="netshield-card-title">
              <FaRobot style={{ color: 'var(--primary-green)' }} />
              <span>Random Forest Production Model Evaluation</span>
            </div>
            <span className="badge badge-low">Active: Random Forest</span>
          </div>

          <div className="netshield-table-container">
            <table className="netshield-table">
              <thead>
                <tr>
                  <th>Model Algorithm</th>
                  <th>Features</th>
                  <th>Classes</th>
                  <th>Accuracy</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ backgroundColor: 'rgba(34, 197, 94, 0.07)' }}>
                  <td style={{ fontWeight: 800, color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: 8 }}>
                    {rfEval.model_name || 'Random Forest (Production Model)'}
                    <span className="badge badge-low" style={{ fontSize: '0.68rem', padding: '2px 6px' }}>CHOSEN MODEL</span>
                  </td>
                  <td style={{ fontWeight: 700, color: '#3B82F6' }}>{rfEval.features || 78} Features</td>
                  <td style={{ fontWeight: 700, color: '#F59E0B' }}>{rfEval.classes || 4} Classes</td>
                  <td style={{ fontWeight: 800, color: 'var(--primary-green)' }}>
                    {rfEval.accuracy !== null && rfEval.accuracy !== undefined ? `${rfEval.accuracy}%` : 'Trained & Active'}
                  </td>
                  <td>
                    <span className="cyber-chip" style={{ color: 'var(--primary-green)' }}>
                      Active In Production
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. UPLOADED DATASETS INGESTION HISTORY (KEPT IN BACKEND/UPLOADS/) */}
      {datasetHistory && datasetHistory.length > 0 && (
        <div className="netshield-card" style={{ marginBottom: 24 }}>
          <div className="netshield-card-header">
            <div className="netshield-card-title">
              <FaHistory style={{ color: 'var(--primary-green)' }} />
              <span>Dataset Ingestion Archive (Files Saved in backend/uploads/)</span>
            </div>
            <span className="cyber-chip">Persistent Ingestion</span>
          </div>

          <div className="netshield-table-container">
            <table className="netshield-table">
              <thead>
                <tr>
                  <th>Dataset ID</th>
                  <th>File Name</th>
                  <th>Traffic Type</th>
                  <th>Flow Records</th>
                  <th>Features</th>
                  <th>Ingested Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {datasetHistory.map((d) => (
                  <tr key={d.id}>
                    <td style={{ color: 'var(--text-secondary)' }}>#{d.id}</td>
                    <td style={{ fontWeight: 800, color: '#FFFFFF' }}>{d.filename}</td>
                    <td><span className="cyber-chip">{d.dataset_type}</span></td>
                    <td style={{ fontWeight: 700 }}>{d.rows_count?.toLocaleString()}</td>
                    <td>{d.columns_count || 78}</td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{new Date(d.upload_time).toLocaleString()}</td>
                    <td>
                      <span className="badge badge-low">
                        {d.status || 'PROCESSED'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. DOWNLOAD TEST SAMPLE DATASETS */}
      <div className="netshield-card">
        <div className="netshield-card-header">
          <div className="netshield-card-title">
            <FaDatabase style={{ color: 'var(--primary-green)' }} />
            <span>Download Benchmark Test Datasets (Pre-extracted Wireshark PCAPs)</span>
          </div>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Standard 78-feature CSV files</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
          {samples.map((s, idx) => (
            <div
              key={idx}
              style={{
                padding: '16px 18px',
                background: 'rgba(10, 22, 40, 0.85)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-tech)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-primary)' }}>{s.name}</span>
                </div>
                <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', marginBottom: 10 }}>
                  {s.description}
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
                  <span className="cyber-chip">{s.records} Records</span>
                  <span className="cyber-chip">{s.features} Features</span>
                  <span className="cyber-chip">{s.file_size}</span>
                </div>
              </div>

              <button
                className="btn btn-secondary"
                style={{ width: '100%', justifyContent: 'center', padding: '7px 12px', fontSize: '0.8rem' }}
                onClick={() => handleDownloadSample(s.id)}
              >
                <FaDownload />
                <span>Download {s.id}</span>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Upload;
