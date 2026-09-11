import { useState } from "react";
import axios from "axios";

function CSVUpload() {

    const [dataset, setDataset] = useState("cic");
    const [file, setFile] = useState(null);
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);

    async function uploadFile() {

        if (!file) {
            alert("Please select a CSV file.");
            return;
        }

        const formData = new FormData();

        formData.append("dataset", dataset);
        formData.append("file", file);

        try {

            setLoading(true);

            const response = await axios.post(

                "https://network-anomaly-detection-threat-5ihm.onrender.com/api/upload/predict",

                formData,

                {
                    headers: {
                        "Content-Type": "multipart/form-data",
                    },
                }

            );

            setResult(response.data);

        } catch (error) {

            console.error(error);

            alert("Prediction Failed");

        } finally {

            setLoading(false);

        }

    }

    return (

        <div className="section">

            <h2>📂 Upload Network Traffic CSV</h2>

            <br />

            <label>Dataset</label>

            <br />

            <select
                value={dataset}
                onChange={(e) => setDataset(e.target.value)}
            >

                <option value="cic">
                    CICIDS2017
                </option>

                <option value="unsw">
                    UNSW-NB15
                </option>

            </select>

            <br /><br />

            <input

                type="file"

                accept=".csv"

                onChange={(e) => setFile(e.target.files[0])}

            />

            <br /><br />

            <button onClick={uploadFile}>

                {loading ? "Uploading..." : "Upload & Predict"}

            </button>

            <br /><br />

            {

                result && (

                    <div>

                        <h3>Prediction Summary</h3>

                        <p>

                            <b>Dataset:</b> {result.dataset}

                        </p>

                        <p>

                            <b>Total Records:</b> {result.total_records}

                        </p>

                        <h4>Attack Distribution</h4>

                        <ul>

                            {

                                Object.entries(result.summary).map(

                                    ([attack, count]) => (

                                        <li key={attack}>

                                            {attack} : {count}

                                        </li>

                                    )

                                )

                            }

                        </ul>

                    </div>

                )

            }

        </div>

    );

}

export default CSVUpload;