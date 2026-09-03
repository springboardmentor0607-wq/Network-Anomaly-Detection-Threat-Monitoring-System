# NetShield — Presentation Notes

> **Milestone 4 Final Demo — Speaker Guide**  
> Week 8 End-to-End Platform Demonstration

---

## Slide Structure (Suggested)

```
1. Title Slide
2. Problem Statement
3. Solution Overview
4. System Architecture
5. Technology Stack
6. Live Demo
   a. Dashboard Overview
   b. AI Threat Detection
   c. Model Performance Metrics
   d. Attack Visualization
7. Model Training & Results
8. Evaluation & Testing
9. Conclusion & Future Work
```

---

## Slide 1: Title

**NetShield 🛡️**  
*AI-Powered Network Intrusion Detection & SIEM Platform*

- Team: [Your names]
- Course: [Course name]
- Date: September 2026

---

## Slide 2: Problem Statement

> "Cyberattacks cost organizations $8 trillion globally in 2023. Traditional signature-based IDS systems miss 40% of novel threats."

**Problems with traditional NIDS:**
- Rule-based — can't detect zero-day attacks
- High false positive rates (alert fatigue)
- No real-time risk scoring
- Poor scalability for enterprise networks

---

## Slide 3: Our Solution — NetShield

**AI-powered dual-model approach:**
- **Isolation Forest** — unsupervised anomaly detection (catches unknown threats)
- **XGBoost** — supervised multi-class classification (names the attack)
- **Risk Scoring** — 0–100 scale for prioritization

**Key differentiators:**
- 99.79% detection accuracy (CIC-IDS-2017)
- < 50ms inference latency per flow
- Real-time WebSocket monitoring
- Professional SIEM dashboard

---

## Slide 4: System Architecture

Show the architecture diagram from `docs/ARCHITECTURE.md`.

**Talk points:**
- 3-tier architecture: Frontend → FastAPI → MongoDB
- ML engine runs inside the backend (no separate service)
- Docker Compose ties everything together in one command
- JWT authentication with Role-Based Access Control

---

## Slide 5: Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, React 19, Tailwind CSS v4 |
| Backend | FastAPI (Python 3.11) |
| Database | MongoDB 7 + SQLite |
| ML | XGBoost + Isolation Forest, Scikit-learn |
| Dataset | CIC-IDS-2017 (885 MB, 2.8M flows) |
| DevOps | Docker Compose |

---

## Slide 6: Live Demo Script

### Step 1 — Login (30 seconds)
- Open `http://localhost:3001`
- Show the cinematic login screen
- Login with admin credentials
- **Say:** "This JWT-secured authentication uses RBAC — admins have full access, analysts have read-only access"

### Step 2 — Main Dashboard (1 minute)
- Show the live traffic summary cards (total packets, alerts)
- Point to the attack category chart
- Show the Attack Timeline chart
- Show the Top Targeted IPs
- **Say:** "Everything here is backed by real data from the CIC-IDS-2017 dataset — 2.8 million network flows"

### Step 3 — AI Model Performance (1 minute)
- Navigate to **Model Performance**
- Show 99.79% accuracy, 99.99% ROC-AUC
- Scroll to the 5-fold cross-validation table
- Show the Threat Analysis JSON viewer
- **Say:** "Our XGBoost classifier achieved 99.79% accuracy after 5-fold stratified cross-validation. The false positive rate is just 0.03%"

### Step 4 — Anomaly Detection (45 seconds)
- Navigate to **Anomaly Detection**
- Show the Benign vs Anomaly over time chart
- Show the classification pie chart (DDoS, PortScan, etc.)
- Show the recent insights feed
- **Say:** "The Isolation Forest flags statistical outliers in real time. Each flow gets an anomaly flag AND a named threat class."

### Step 5 — Attack Visualization (45 seconds)
- Navigate to **Attack Visualization**
- Show the geographic attack map / chart
- Show MITRE ATT&CK mapping
- **Say:** "We've mapped detected attacks to MITRE ATT&CK framework categories for threat intelligence context"

### Step 6 — Live Demo Script (Terminal) — Optional (1 minute)
Run in terminal:
```bash
python backend/scripts/generate_test_report.py
```
Show the colored output — DDoS detected, port scan flagged, BENIGN traffic cleared.

### Step 7 — Docker Deployment (30 seconds)
Show:
```bash
docker compose up --build
docker compose ps
```
- **Say:** "The entire platform — backend, frontend, and database — deploys with a single command"

---

## Slide 7: Model Training Results

Show the metrics table:

| Model | Accuracy | F1-Score | ROC-AUC | CV Mean |
|-------|----------|----------|---------|---------|
| CIC-IDS-2017 | 99.79% | 99.78% | 0.9999 | 99.76% |
| UNSW-NB15 | 99.82% | 99.81% | 0.9999 | 99.78% |

**Highlight:**
- Trained on 8 attack categories
- 5-fold stratified cross-validation ensures generalizability
- No overfitting: test accuracy ≈ CV accuracy

---

## Slide 8: Testing & Evaluation

**Test Coverage:**
- 30+ pytest tests across API and ML layers
- Tests verify: model accuracy > 95%, response structure, edge cases

**Performance Benchmarks:**

| Metric | Target | Achieved |
|--------|--------|----------|
| Anomaly Detection Accuracy | > 95% | **99.79%** ✅ |
| False Positive Rate | < 5% | **0.03%** ✅ |
| Alert Latency | < 100ms | **< 50ms** ✅ |
| API Response Time | < 500ms | **< 100ms** ✅ |
| Traffic Processing | 1,000+ flows/s | **10,000+** ✅ |

---

## Slide 9: Milestones Summary

| Milestone | Week | Status |
|-----------|------|--------|
| Architecture & Auth Setup | 2 | ✅ Complete |
| AI Models & Threat Classification | 4 | ✅ Complete |
| Alert Management & Visualization | 6 | ✅ Complete |
| Testing, Deployment & Docs | 8 | ✅ **Complete** |

---

## Slide 10: Conclusion

**Achievements:**
- Built a production-ready NIDS/SIEM platform from scratch
- Achieved 99.79% threat detection accuracy using ML ensemble
- Deployed full-stack with Docker in a single command
- 30+ automated tests validating all system components
- Professional documentation (API Reference, Architecture, ML Report)

**Future Work:**
- Integrate Zeek for live packet capture in production
- Add TensorFlow deep learning model for sequential attack detection
- Connect to real SIEM platforms (Splunk, ElasticSearch)
- Deploy to AWS with auto-scaling

---

## Q&A Preparation

**Q: Why XGBoost over deep learning?**  
A: XGBoost achieves 99.79% accuracy with 100x faster training and inference vs neural networks on tabular network flow data. We also maintain interpretability.

**Q: How does risk scoring work?**  
A: Risk Score = 40 (if anomaly detected) + confidence × 60 (if attack classified). Ranges 0–100.

**Q: How does it handle new/unknown attacks?**  
A: The Isolation Forest operates unsupervised — it detects statistical outliers without needing labeled attack data. This covers zero-day scenarios.

**Q: Can this run on real network traffic?**  
A: Yes — the live capture module uses pyshark to intercept real packets, extract flow features, and run them through the same ML pipeline in real time.

**Q: What's the dataset used?**  
A: CIC-IDS-2017 from the Canadian Institute for Cybersecurity — 2.8 million flows, 15 attack categories, widely used in academic NIDS research.

---

## Demo Checklist (Before Presentation)

- [ ] Backend running: `uvicorn app.main:app --port 8000`
- [ ] Frontend running: `npm run dev` (port 3001)
- [ ] MongoDB running with data loaded
- [ ] Login works with admin credentials
- [ ] Model Performance page loads metrics
- [ ] Test report script ready to run
- [ ] Docker Desktop running (for Docker demo)
- [ ] Browser tabs pre-opened: Dashboard, Swagger docs, Terminal
