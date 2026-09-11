import axios from "axios";

const api = axios.create({
    baseURL: "https://network-anomaly-detection-threat-5ihm.onrender.com",
});

export default api;
