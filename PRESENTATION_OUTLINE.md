# NetShield AI: Milestone 4 Presentation Outline

## 1. Project Overview

NetShield AI is an AI-assisted security operations platform for network traffic classification, anomaly scoring, threat records, SOC alerts, incidents, and reporting.

## 2. Problem Statement

Security teams need a connected workflow that turns network traffic observations into explainable risk results and operational response records.

## 3. Proposed Solution

A React SOC interface calls authenticated FastAPI services. The backend preprocesses network features, applies an NSL-KDD classifier and Isolation Forest, calculates risk, and persists the result for dashboard and incident workflows.

## 4. System Architecture

- React/Vite frontend
- Axios API client with bearer JWT
- FastAPI REST API
- SQLAlchemy database layer
- SQLite local persistence
- NSL-KDD datasets and joblib model artifacts
- Classifier plus Isolation Forest risk engine

## 5. Technologies Used

- Python, FastAPI, Pydantic, SQLAlchemy
- JWT, Argon2, bcrypt compatibility
- pandas, NumPy, scikit-learn, joblib
- React, React Router, Axios, Tailwind CSS, Recharts
- Docker for backend and frontend packaging

## 6. ML Workflow

1. Read `KDDTrain+` and `KDDTest+`.
2. Map labels into five attack categories.
3. Encode categorical fields and standardize numeric fields.
4. Train the selected classifier.
5. Persist classifier, preprocessor, anomaly detector, and metrics.
6. Predict a class and confidence for submitted traffic.
7. Add anomaly score, risk score, severity, and recommended action.

## 7. Frontend and Backend

The frontend provides login, dashboard, model testing/evaluation, threat views, SOC alerts, incidents, analytics, and reports. The backend exposes authentication, prediction, model, SOC, database, and report endpoints.

## 8. Deployment

The backend Dockerfile uses Python 3.11 and serves Uvicorn on port 8000. The frontend Dockerfile uses Node 20 and serves the built Vite application on port 5173. The frontend API URL is supplied through `VITE_API_URL` at build time. Durable production deployment requires persistent database and model-artifact storage.

## 9. Model Testing and Validation

Recorded NSL-KDD evaluation metrics are accuracy `0.7250`, macro precision `0.6981`, macro recall `0.5405`, macro F1 `0.5507`, and ROC-AUC `0.5592`. A functional inference check successfully loaded the artifacts and returned a valid `NORMAL` result with confidence, anomaly, risk, severity, and action fields.

Mention the scikit-learn artifact-version warning and the recommendation to retrain in the target runtime.

## 10. End-to-End Workflow and Demo

Register or log in, open the dashboard, submit the sample traffic vector in Test ML Model, inspect the returned classification and risk result, then review alerts, reports, and model evaluation.

## 11. Results

- Authenticated API flow is implemented.
- Protected API routes accept bearer tokens.
- Model artifacts load and produce valid inference output.
- Prediction records and high-risk alerts are persisted.
- Frontend production build completes.

## 12. Future Scope

- Managed database and artifact registry
- Exact-version model packaging and reproducible retraining
- Background training and threat-hunt jobs
- Upload limits and rate limiting
- External threat-intelligence provider integrations
- HttpOnly refresh-token authentication
- CI/CD and deployment smoke tests

## 13. Conclusion

NetShield AI connects ML inference with an operational SOC workflow. Milestone 4 adds deployment guidance, factual model validation, integration fixes for protected downloads and evaluation, documentation, and a repeatable demonstration plan.
