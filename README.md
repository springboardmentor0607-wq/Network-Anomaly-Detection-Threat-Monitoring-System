# NetShield AI

NetShield AI is a FastAPI and React security operations platform for network intrusion classification, anomaly scoring, threat records, SOC alerts, incidents, reporting, and model management. The repository contains the completed Milestones 1-3 application and the Milestone 4 validation and demonstration materials.

## Problem Statement

Security operations teams need a single workflow for inspecting network traffic, identifying suspicious behavior, recording threats, and reviewing operational response data. NetShield AI combines supervised NSL-KDD classification with Isolation Forest anomaly scoring and a browser-based SOC interface.

## Objectives

- Classify network traffic into `NORMAL`, `PROBE`, `DOS`, `R2L`, or `U2R`.
- Produce confidence, anomaly, risk, severity, and recommended-action results.
- Persist predictions, threats, alerts, notifications, incidents, and model records.
- Provide authenticated dashboard, SOC, reporting, and model-management workflows.
- Support local and containerized development without exposing secrets in source control.

## Features

- JWT authentication with registration, login, and `/api/auth/me`.
- Argon2 password hashing with compatibility for existing bcrypt hashes.
- React dashboard and protected SOC pages.
- NSL-KDD Random Forest, Logistic Regression, and Decision Tree training paths.
- Persisted classifier, preprocessor, Isolation Forest, and metrics artifacts.
- Single-traffic and CSV batch prediction.
- Threat hunt over the included `KDDTest+` dataset.
- Alerts, notifications, incidents, threat intelligence records, and CSV/PDF/JSON reports.

## Architecture

```text
Browser (React/Vite)
	|
	| Axios JSON + Bearer JWT
	v
FastAPI (/api)
  |             |
  |             +-- Auth, dashboard, SOC, reports, model APIs
  |
  +-- SQLAlchemy -> SQLite (backend/netshield.db by default)
  +-- ML pipeline -> saved_models/*.joblib + metrics.json
	|
	+-- NSL-KDD dataset -> preprocessing -> classifier + anomaly scoring
```

### Frontend

The frontend is under `frontend/` and uses React, React Router, Axios, Tailwind CSS, Recharts, and Vite. `frontend/src/services/api.js` reads `VITE_API_URL` and attaches the stored bearer token to API requests. Report downloads also use Axios so protected endpoints receive the token.

### Backend

The backend is under `backend/` and uses FastAPI, SQLAlchemy, Pydantic, JWT bearer authentication, and SQLite by default. API routers are mounted from `backend/app/main.py`; non-auth routers require a valid bearer token.

### Machine Learning

Training reads `backend/dataset/KDDTrain+.csv` and evaluates against `KDDTest+.csv`. `DataPreprocessor` label-encodes protocol/service/flag values and standardizes numeric features. The classifier produces a traffic class and confidence. Isolation Forest contributes an anomaly score; the risk engine maps class, confidence, and anomaly score to risk, severity, and an action.

## API Flow

1. Register or log in through `POST /api/auth/register` or `POST /api/auth/login`.
2. Store the returned JWT in the browser session.
3. Send `Authorization: Bearer <token>` to protected endpoints.
4. Submit traffic to `POST /api/predict`.
5. The backend loads the persisted artifacts, preprocesses the input, predicts, scores risk, and stores prediction/alert records.
6. The frontend displays the prediction and related SOC records.

Authentication endpoints:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`

## Local Setup

### Backend

Python 3.11 is the Docker baseline. Python 3.13 works for the current source, but persisted scikit-learn artifacts should be regenerated with the same scikit-learn version used by the runtime.

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
python seed.py
python -m uvicorn app.main:app --reload --port 8000 --env-file .env
```

The seed command creates baseline records, the default user, model artifacts, and demo data. It does not delete existing records.

### Frontend

```powershell
cd frontend
npm ci
$env:VITE_API_URL = "http://localhost:8000/api"
npm run dev
```

Open `http://localhost:5173`.

## Environment Variables

Configure these in the backend environment; do not commit real values:

- `SECRET_KEY`: long random JWT signing secret.
- `ALGORITHM`: normally `HS256`.
- `ACCESS_TOKEN_EXPIRE_MINUTES`: JWT lifetime.
- `DATABASE_URL`: SQLAlchemy URL; default local database is `backend/netshield.db`.
- `CORS_ORIGINS`: comma-separated browser origins.
- `VITE_API_URL`: frontend build-time API base URL, including `/api`.

## Docker

Build and run the backend from `backend/`:

```powershell
docker build -t netshield-backend .
docker run --rm -p 8000:8000 --env-file .env `
	-v "${PWD}/netshield.db:/app/netshield.db" `
	-v "${PWD}/saved_models:/app/saved_models" `
	netshield-backend
```

For a durable deployment, configure a persistent database/artifact volume or use a managed database and artifact store. Build the frontend with the reachable backend URL:

```powershell
cd frontend
docker build --build-arg VITE_API_URL=https://backend.example.com/api -t netshield-frontend .
docker run --rm -p 5173:5173 netshield-frontend
```

The backend Docker image uses Python 3.11. The frontend image uses Node 20.

## Model Testing and Validation

The checked-in evaluation artifact is `backend/saved_models/metrics.json`. It records accuracy `0.7250`, macro precision `0.6981`, macro recall `0.5405`, macro F1 `0.5507`, ROC-AUC `0.5592`, 125,973 training samples, and 22,543 test samples. These are the recorded NSL-KDD evaluation values, not production guarantees.

Functional inference was also executed against the persisted classifier, preprocessor, and Isolation Forest. A representative valid input returned `NORMAL`, confidence `0.9998`, anomaly score `0.3712`, risk score `12.42`, and severity `Low`.

The runtime emitted a scikit-learn persistence warning because the saved artifacts report version `1.9.0` while the current local interpreter has `1.7.1`. Inference completed, but the recommended manual action is to retrain and save artifacts in the target deployment environment, then rerun the validation report.

See [MILESTONE4_VALIDATION.md](MILESTONE4_VALIDATION.md) for commands and results.

## End-to-End Demonstration

Use [DEMO_GUIDE.md](DEMO_GUIDE.md) for the 2-3 minute walkthrough. The normal path is register/login, open the dashboard, submit a traffic vector in Test ML Model, review the prediction and alert, then show reports and model evaluation.

## Limitations and Future Enhancements

- SQLite and local joblib files are suitable for local/demo use; production should use durable managed storage.
- Model training and threat hunting run synchronously in API requests.
- Threat intelligence enrichment currently records internal indicators; external provider calls are not implemented.
- Tokens are stored in browser local storage; an HttpOnly cookie/refresh-token design would reduce exposure.
- Add migrations, rate limiting, upload limits, background jobs, artifact version selection, and deployment CI/CD.

## Milestone 4 Materials

- [MILESTONE4_VALIDATION.md](MILESTONE4_VALIDATION.md)
- [PRESENTATION_OUTLINE.md](PRESENTATION_OUTLINE.md)
- [DEMO_GUIDE.md](DEMO_GUIDE.md)
