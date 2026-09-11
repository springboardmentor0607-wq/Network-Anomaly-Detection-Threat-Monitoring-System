import { useState } from "react";
import axios from "axios";
import "./SecurityDashboard.css";

const API_BASE_URL = "https://network-anomaly-detection-threat-5ihm.onrender.com";

function AIPredictionsPage() {
  const [dataset, setDataset] = useState("cic");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const uploadCSV = async () => {
    if (!file) {
      alert("Please select a CSV file.");
      return;
    }

    const formData = new FormData();

    formData.append("dataset", dataset);
    formData.append("file", file);

    try {
      setLoading(true);
      setResult(null);

      const response = await axios.post(
        `${API_BASE_URL}/api/upload/predict`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setResult(response.data);
    } catch (err) {
      console.error("Prediction Error:", err);

      if (err.response) {
        alert(
          err.response.data?.detail ||
            "Prediction failed. Please check the selected dataset and CSV file."
        );
      } else {
        alert("Cannot connect to backend.");
      }
    } finally {
      setLoading(false);
    }
  };

  const attackDistribution =
    result?.summary?.attack_distribution || {};

  const threatDistribution =
    result?.summary?.threat_distribution || {};

  const attackTypes = Object.entries(attackDistribution);
  const threatTypes = Object.entries(threatDistribution);

  const totalTrainingRecords = 2016638 + 206138;

  return (
    <>
      {/* =====================================================
          HEADER
      ====================================================== */}

      <div className="topbar">
        <div>
          <h1>🤖 AI Threat Prediction</h1>

          <p>
            Upload a network traffic CSV and detect cyber attacks
            using trained Machine Learning models.
          </p>
        </div>
      </div>

      {/* =====================================================
          MODEL KPI CARDS
      ====================================================== */}

      <div className="cards">

        <div className="card">
          <h2>99.82%</h2>
          <p>CICIDS2017 Test Accuracy</p>
        </div>

        <div className="card">
          <h2>82.60%</h2>
          <p>UNSW-NB15 Test Accuracy</p>
        </div>

        <div className="card">
          <h2>{(totalTrainingRecords / 1000000).toFixed(2)}M+</h2>
          <p>Total Training Records</p>
        </div>

        <div className="card">
          <h2>Random Forest</h2>
          <p>ML Algorithm</p>
        </div>

      </div>

      {/* =====================================================
          CSV UPLOAD SECTION
      ====================================================== */}

      <div className="section">

        <h2>📂 Upload CSV Dataset</h2>

        <br />

        <label>
          <strong>Select Dataset</strong>
        </label>

        <br />
        <br />

        <select
          value={dataset}
          onChange={(e) => {
            setDataset(e.target.value);
            setFile(null);
            setResult(null);
          }}
        >
          <option value="cic">
            CICIDS2017
          </option>

          <option value="unsw">
            UNSW-NB15
          </option>
        </select>

        <br />
        <br />

        <label>
          <strong>Select CSV File</strong>
        </label>

        <br />
        <br />

        <input
          type="file"
          accept=".csv"
          onChange={(e) => {
            setFile(e.target.files?.[0] || null);
            setResult(null);
          }}
        />

        {file && (
          <>
            <br />
            <br />

            <p>
              <strong>Selected File:</strong>{" "}
              {file.name}
            </p>
          </>
        )}

        <br />

        <button
          onClick={uploadCSV}
          disabled={loading}
        >
          {loading
            ? "🤖 Predicting..."
            : "🚀 Upload & Predict"}
        </button>

      </div>

      {/* =====================================================
          LOADING MESSAGE
      ====================================================== */}

      {loading && (
        <div className="section">

          <h2>⏳ AI Prediction in Progress</h2>

          <p>
            The selected CSV file is being processed by the
            trained Random Forest model.
          </p>

          <p>
            Please wait...
          </p>

        </div>
      )}

      {/* =====================================================
          PREDICTION RESULT
      ====================================================== */}

      {result && (
        <>
          {/* =================================================
              RESULT KPI CARDS
          ================================================== */}

          <div className="cards">

            <div className="card">
              <h2>
                {Number(
                  result.original_records || 0
                ).toLocaleString()}
              </h2>

              <p>
                Original Records
              </p>
            </div>

            <div className="card">
              <h2>
                {Number(
                  result.processed_records || 0
                ).toLocaleString()}
              </h2>

              <p>
                Processed Records
              </p>
            </div>

            <div className="card">
              <h2>
                {Number(
                  result.average_confidence || 0
                ).toFixed(2)}
                %
              </h2>

              <p>
                Average Confidence
              </p>
            </div>

            <div className="card">
              <h2>
                {attackTypes.length}
              </h2>

              <p>
                Detected Categories
              </p>
            </div>

          </div>

          {/* =================================================
              PREDICTION SUMMARY
          ================================================== */}

          <div className="section">

            <h2>
              📊 Prediction Summary
            </h2>

            <br />

            <table>

              <tbody>

                <tr>
                  <th>
                    Dataset
                  </th>

                  <td>
                    {result.dataset === "CIC"
                      ? "CICIDS2017"
                      : result.dataset === "UNSW"
                      ? "UNSW-NB15"
                      : result.dataset || dataset}
                  </td>
                </tr>

                <tr>
                  <th>
                    Original Records
                  </th>

                  <td>
                    {Number(
                      result.original_records || 0
                    ).toLocaleString()}
                  </td>
                </tr>

                <tr>
                  <th>
                    Processed Records
                  </th>

                  <td>
                    {Number(
                      result.processed_records || 0
                    ).toLocaleString()}
                  </td>
                </tr>

                <tr>
                  <th>
                    Average Confidence
                  </th>

                  <td>
                    {Number(
                      result.average_confidence || 0
                    ).toFixed(2)}
                    %
                  </td>
                </tr>

                <tr>
                  <th>
                    Main Threat
                  </th>

                  <td>
                    {result.summary?.main_threat ||
                      "None"}
                  </td>
                </tr>

                <tr>
                  <th>
                    Severity
                  </th>

                  <td>
                    {result.summary?.severity ||
                      "Low"}
                  </td>
                </tr>

              </tbody>

            </table>

          </div>

          {/* =================================================
              ATTACK DISTRIBUTION
          ================================================== */}

          <div className="section">

            <h2>
              🚨 Attack Distribution
            </h2>

            <br />

            {attackTypes.length > 0 ? (

              <table>

                <thead>

                  <tr>
                    <th>
                      Attack Type
                    </th>

                    <th>
                      Detected Count
                    </th>

                    <th>
                      Classification
                    </th>
                  </tr>

                </thead>

                <tbody>

                  {attackTypes.map(
                    ([attack, count]) => {

                      const normalizedAttack =
                        String(attack).toUpperCase();

                      const isBenign =
                        normalizedAttack === "BENIGN" ||
                        normalizedAttack === "NORMAL";

                      return (
                        <tr key={attack}>

                          <td>
                            {attack}
                          </td>

                          <td>
                            {Number(
                              count || 0
                            ).toLocaleString()}
                          </td>

                          <td>
                            {isBenign
                              ? "Normal Traffic"
                              : "⚠️ Threat"}
                          </td>

                        </tr>
                      );
                    }
                  )}

                </tbody>

              </table>

            ) : (

              <p>
                No attack distribution data
                available.
              </p>

            )}

          </div>

          {/* =================================================
              THREAT DISTRIBUTION
          ================================================== */}

          <div className="section">

            <h2>
              🛡️ Threat Records
            </h2>

            <br />

            {threatTypes.length > 0 ? (

              <table>

                <thead>

                  <tr>
                    <th>
                      Threat Type
                    </th>

                    <th>
                      Count
                    </th>
                  </tr>

                </thead>

                <tbody>

                  {threatTypes.map(
                    ([attack, count]) => (

                      <tr key={attack}>

                        <td>
                          {attack}
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

            ) : (

              <p>
                No threats detected in the
                processed records.
              </p>

            )}

          </div>
        </>
      )}

      {/* =====================================================
          TRAINED AI MODELS
      ====================================================== */}

      <div className="section">

        <h2>
          🧠 Trained AI Models
        </h2>

        <br />

        <table>

          <thead>

            <tr>
              <th>
                Dataset
              </th>

              <th>
                Algorithm
              </th>

              <th>
                Test Accuracy
              </th>

              <th>
                Training Records
              </th>
            </tr>

          </thead>

          <tbody>

            <tr>
              <td>
                CICIDS2017
              </td>

              <td>
                Random Forest
              </td>

              <td>
                99.82%
              </td>

              <td>
                2,016,638
              </td>
            </tr>

            <tr>
              <td>
                UNSW-NB15
              </td>

              <td>
                Random Forest
              </td>

              <td>
                82.60%
              </td>

              <td>
                206,138
              </td>
            </tr>

          </tbody>

        </table>

      </div>

      {/* =====================================================
          MODEL PERFORMANCE
      ====================================================== */}

      <div className="section">

        <h2>
          📈 Model Performance
        </h2>

        <br />

        <table>

          <thead>

            <tr>
              <th>
                Metric
              </th>

              <th>
                CICIDS2017
              </th>

              <th>
                UNSW-NB15
              </th>
            </tr>

          </thead>

          <tbody>

            <tr>
              <td>
                Test Accuracy
              </td>

              <td>
                99.82%
              </td>

              <td>
                82.60%
              </td>
            </tr>

            <tr>
              <td>
                Test Precision
              </td>

              <td>
                99.82%
              </td>

              <td>
                82.13%
              </td>
            </tr>

            <tr>
              <td>
                Test Recall
              </td>

              <td>
                99.82%
              </td>

              <td>
                82.60%
              </td>
            </tr>

            <tr>
              <td>
                Test F1 Score
              </td>

              <td>
                99.82%
              </td>

              <td>
                80.35%
              </td>
            </tr>

          </tbody>

        </table>

      </div>

      {/* =====================================================
          NETSHIELD AI FEATURES
      ====================================================== */}

      <div className="section">

        <h2>
          🚀 NetShield AI Features
        </h2>

        <br />

        <table>

          <thead>

            <tr>
              <th>
                Capability
              </th>

              <th>
                Status
              </th>
            </tr>

          </thead>

          <tbody>

            <tr>
              <td>
                CICIDS2017 Threat Detection
              </td>

              <td>
                ✅ Enabled
              </td>
            </tr>

            <tr>
              <td>
                UNSW-NB15 Threat Detection
              </td>

              <td>
                ✅ Enabled
              </td>
            </tr>

            <tr>
              <td>
                CSV Upload Prediction
              </td>

              <td>
                ✅ Enabled
              </td>
            </tr>

            <tr>
              <td>
                Machine Learning Classification
              </td>

              <td>
                ✅ Enabled
              </td>
            </tr>

            <tr>
              <td>
                Attack Summary Report
              </td>

              <td>
                ✅ Enabled
              </td>
            </tr>

            <tr>
              <td>
                Automatic Security Alert Generation
              </td>

              <td>
                ✅ Enabled
              </td>
            </tr>

            <tr>
              <td>
                Role-Based Security Notifications
              </td>

              <td>
                ✅ Enabled
              </td>
            </tr>

          </tbody>

        </table>

      </div>
    </>
  );
}

export default AIPredictionsPage;