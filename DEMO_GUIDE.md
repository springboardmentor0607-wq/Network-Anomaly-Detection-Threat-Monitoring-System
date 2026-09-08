# NetShield AI Demo Guide

## URLs

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:8000`
- API docs: `http://localhost:8000/docs`

## Start the Application

Terminal 1:

```powershell
cd backend
.\.venv\Scripts\Activate.ps1
python -m uvicorn app.main:app --reload --port 8000
```

Terminal 2:

```powershell
cd frontend
npm run dev
```

Open the frontend URL in a browser.

## Login and Registration

1. Select **Register here** on the login page.
2. Enter a name, a valid email address, and a password of at least eight characters.
3. Submit registration. The backend creates an analyst account and returns a JWT.
4. The application opens the dashboard.
5. For a repeat demo, use the same registered account to log in again.

Do not put real passwords, tokens, or API keys in presentation material.

## Demo Inputs

Open **Test ML Model** and submit the prefilled valid network vector. The form uses the 22 fields required by the NSL-KDD preprocessing pipeline, including:

- Protocol: `tcp`
- Service: `http`
- Flag: `SF`
- Source bytes: `1816`
- Destination bytes: `5450`
- Logged in: `1`
- Remaining fields: the displayed defaults

## Features to Demonstrate

1. **Dashboard**: show authenticated summary cards and the Threat Hunt action.
2. **Test ML Model**: submit the vector and show predicted class, confidence, anomaly index, risk score, severity, and recommended action.
3. **Threat Alerts / Threat Reports**: show persisted security records and authenticated export buttons.
4. **Model Evaluation**: show the recorded confusion matrix and evaluation metrics.
5. **Incidents / Analytics**: show operational records and report export options.
6. **API docs**: optionally show the FastAPI OpenAPI surface at `/docs`.

## Expected Output

The representative validated vector produced:

- Prediction: `NORMAL`
- Confidence: approximately `0.9998` as a probability in the direct validation check
- Anomaly score: approximately `0.3712`
- Risk score: `12.42`
- Severity: `Low`
- Action: `Allow Traffic`

Exact values can vary if the model artifacts are retrained.

## What to Say

“NetShield AI authenticates the operator first, then sends a network feature vector from the React interface to the FastAPI prediction endpoint. The backend uses the persisted preprocessing and classifier artifacts, combines the classifier result with Isolation Forest anomaly scoring, calculates a risk response, and persists the operational record. The frontend then presents the prediction and the SOC workflow can continue into alerts, incidents, analytics, and reports.”

## Two-to-Three-Minute Script

**0:00-0:25 — Context**

“NetShield AI addresses the gap between network traffic classification and SOC response. It combines a React interface, authenticated FastAPI services, SQLAlchemy persistence, and an NSL-KDD model pipeline.”

**0:25-0:50 — Authentication**

Register or log in and point out that the application receives a JWT and uses it for protected API requests.

**0:50-1:30 — Inference**

Open Test ML Model, submit the displayed network vector, and explain the predicted class, confidence, anomaly score, risk score, severity, and recommended action.

**1:30-2:00 — Operations**

Show the dashboard, threat alerts/reports, and model evaluation. Explain that suspicious predictions can produce persisted SOC alert and notification records.

**2:00-2:30 — Validation and close**

Show the recorded evaluation metrics and state that a functional artifact-loading inference check passed. Mention that deployment should retrain artifacts with the exact target scikit-learn version because the current local artifact/runtime versions differ.

## Troubleshooting

- If the frontend calls the wrong backend, set `VITE_API_URL=http://localhost:8000/api` before starting Vite.
- If no model artifacts exist, run `python seed.py` from `backend/` or train through the model-training page.
- If authentication fails, confirm the backend is running on port 8000 and that the browser origin is included in `CORS_ORIGINS`.
- If a report download fails, log in again; report endpoints require a bearer token.
