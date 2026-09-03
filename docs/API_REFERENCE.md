# NetShield — API Reference

> **Complete API Documentation with Request/Response Examples**  
> Base URL: `http://localhost:8000`  
> Interactive Docs: `http://localhost:8000/docs` (Swagger UI)

---

## Authentication

All protected endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

---

## Auth Endpoints `/api/auth`

### POST `/api/auth/login`
Authenticate and receive a JWT access token.

**Request (form-data):**
```
username=admin
password=yourpassword
```

**Response 200:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

**Response 401:**
```json
{ "detail": "Incorrect username or password" }
```

---

### POST `/api/auth/register`
Register a new user account.

**Request (JSON):**
```json
{
  "username": "analyst1",
  "email": "analyst@company.com",
  "password": "securepassword",
  "role": "analyst"
}
```

**Response 200:**
```json
{
  "id": 2,
  "username": "analyst1",
  "email": "analyst@company.com",
  "role": "analyst"
}
```

---

## ML Prediction Endpoints `/api/ml`

### POST `/api/ml/predict`
Run ML inference on a network flow's features.

**Request (JSON):**
```json
{
  "features": {
    "Destination Port": 80,
    "Flow Duration": 1000000,
    "Total Fwd Packets": 5,
    "Total Backward Packets": 4,
    "Flow Bytes/s": 800.0,
    "Flow Packets/s": 9.0,
    "SYN Flag Count": 1,
    "ACK Flag Count": 5
  },
  "dataset": "CICIDS2017"
}
```

**dataset options:** `"CICIDS2017"` | `"UNSW-NB15"`

**Response 200:**
```json
{
  "is_anomaly": false,
  "threat_class": "BENIGN",
  "confidence": 0.9987,
  "risk_score": 0,
  "status": "success"
}
```

**Response 200 (attack detected):**
```json
{
  "is_anomaly": true,
  "threat_class": "DDoS",
  "confidence": 0.9995,
  "risk_score": 100,
  "status": "success"
}
```

---

### GET `/api/ml/reports/metrics`
Retrieve trained model performance metrics.

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `dataset` | string | `CICIDS2017` | Dataset model to query |

**Response 200:**
```json
{
  "model_accuracy": 0.9979980814947658,
  "precision": 0.9979036007355095,
  "recall": 0.9979980814947658,
  "f1_score": 0.9978844022036828,
  "roc_auc": 0.9999386256093431,
  "false_positive_rate": 0.0003
}
```

---

### GET `/api/ml/reports/cross-validation`
Retrieve 5-fold stratified cross-validation results.

**Response 200:**
```json
{
  "accuracy": [0.9985, 0.9975, 0.9979, 0.9979, 0.9977],
  "precision": [0.9984, 0.9975, 0.9978, 0.9978, 0.9977],
  "recall": [0.9985, 0.9975, 0.9979, 0.9979, 0.9977],
  "f1_score": [0.9984, 0.9975, 0.9978, 0.9978, 0.9977]
}
```

---

### GET `/api/ml/reports/threat-analysis`
Retrieve threat distribution and prediction statistics.

**Response 200:**
```json
{
  "total_predictions": 150000,
  "most_frequent_attack": "DoS / DDoS",
  "risk_score_distribution": {
    "Low": 89000,
    "Medium": 12000,
    "High": 31000,
    "Critical": 18000
  },
  "attack_distribution": {
    "DoS / DDoS": 45000,
    "PortScan": 22000,
    "Web Attack": 15000
  },
  "anomalies_detected": 61000,
  "system_status": "Active"
}
```

---

### GET `/api/ml/reports/epoch-metrics`
Download training epoch metrics as CSV.

**Response:** `text/csv`  
**Columns:** `epoch, train_mlogloss, test_mlogloss`

---

## Network Endpoints `/api/network`

### GET `/api/network/summary`
Get high-level dashboard summary counts.

**Query Parameters:** `dataset` (optional)

**Response 200:**
```json
{
  "total_packets": 2800000,
  "total_alerts": 650000,
  "status": "Active"
}
```

---

### GET `/api/network/traffic-data`
Get paginated network traffic records.

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `skip` | int | 0 | Pagination offset |
| `limit` | int | 50 | Records per page |
| `protocol` | string | null | Filter by protocol (e.g. "TCP") |
| `threat_level` | string | null | "High" or "Low" |
| `dataset` | string | null | Dataset filter |

**Response 200:**
```json
{
  "data": [
    {
      "id": "64abc123",
      "source_ip": "192.168.1.100",
      "destination_ip": "8.8.8.8",
      "source_port": 54321,
      "destination_port": 443,
      "protocol": "TCP",
      "flow_duration": 1500000,
      "packets": 14,
      "bytes": 2000,
      "label": "BENIGN",
      "threat_level": "Low",
      "prediction": "Normal",
      "confidence": 99,
      "dataset": "CICIDS2017",
      "timestamp": "2017-07-03T09:12:00"
    }
  ],
  "total": 2800000
}
```

---

### GET `/api/network/dashboard-stats`
Get data for dashboard charts.

**Query Parameters:** `dataset`, `severity`, `attack_type`, `time_range`

**Response 200:**
```json
{
  "attack_categories": [
    { "name": "DoS / DDoS", "value": 85000 },
    { "name": "Port Scan", "value": 35000 }
  ],
  "protocols": [
    { "name": "TCP", "value": 2100000 },
    { "name": "UDP", "value": 600000 }
  ],
  "targeted_ips": [
    { "ip": "192.168.1.1", "hits": 15000 }
  ],
  "system_health": {
    "database_node": "CONNECTED",
    "pipeline_loading": "READY",
    "memory_footprint": "1293.3 MB",
    "ingested_rows": 2800000,
    "server_latency": "24.5ms"
  }
}
```

---

### GET `/api/network/attack-timeline`
Get hourly attack count for timeline chart.

**Response 200:**
```json
[
  { "time": "00:00", "attacks": 120 },
  { "time": "01:00", "attacks": 85 },
  { "time": "14:00", "attacks": 3200 }
]
```

---

### GET `/api/network/anomaly-data`
Get anomaly detection dashboard data.

**Response 200:**
```json
{
  "graph": [
    { "time": "09:00", "benign": 5000, "anomaly": 120 }
  ],
  "classification": [
    { "name": "DDoS", "value": 45000, "color": "#ef4444" }
  ],
  "insights": [
    {
      "timestamp": "2017-07-07T14:23:00",
      "source_ip": "203.0.113.42",
      "target_ip": "192.168.1.5",
      "predicted_threat": "DDoS",
      "confidence": 99,
      "action": "Blocked"
    }
  ]
}
```

---

### GET `/api/network/recent-alerts`
Get most recent security alerts.

**Query Parameters:** `limit` (default: 10), `dataset`

**Response 200:**
```json
[
  {
    "id": "64abc456",
    "source_ip": "203.0.113.5",
    "destination_ip": "192.168.1.1",
    "destination_port": 80,
    "anomaly_type": "DDoS",
    "severity": "High",
    "timestamp": "2017-07-07T14:23:00"
  }
]
```

---

## Live Traffic Endpoints `/api/live`

### WebSocket `/api/live/stream`
Connect for real-time traffic updates.

```javascript
const ws = new WebSocket('ws://localhost:8000/api/live/stream');
ws.onmessage = (event) => {
  const packet = JSON.parse(event.data);
  // { source_ip, destination_ip, protocol, label, risk_score, ... }
};
```

---

## Reports Endpoints `/api/reports`

### GET `/api/reports/list`
List all downloadable report files.

**Response 200:**
```json
[
  {
    "id": "cicids_metrics",
    "name": "CICIDS2017 Model Metrics",
    "type": "JSON",
    "date": "2026-08-15",
    "size": "228 B"
  }
]
```

---

### GET `/api/reports/download/{report_id}`
Download a specific report file.

**Response:** File download (JSON or CSV)

---

## Error Responses

| Status | Description |
|--------|-------------|
| `400` | Bad request — invalid input format |
| `401` | Unauthorized — missing or invalid JWT |
| `403` | Forbidden — insufficient role permissions |
| `404` | Not found — resource doesn't exist |
| `422` | Unprocessable entity — validation error |
| `500` | Internal server error |

---

## Example: cURL Requests

```bash
# Login
curl -X POST http://localhost:8000/api/auth/login \
  -d "username=admin&password=secret"

# ML Prediction
curl -X POST http://localhost:8000/api/ml/predict \
  -H "Content-Type: application/json" \
  -d '{"features": {"Destination Port": 80, "SYN Flag Count": 9000}, "dataset": "CICIDS2017"}'

# Get metrics
curl http://localhost:8000/api/ml/reports/metrics?dataset=CICIDS2017

# Get traffic data
curl "http://localhost:8000/api/network/traffic-data?skip=0&limit=10"
```
