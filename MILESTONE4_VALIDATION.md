# Milestone 4 Validation Report

## Scope

This report records functional checks performed against the existing NetShield AI implementation. It does not claim a cloud deployment was verified from this workspace.

## Model Purpose

The model pipeline classifies NSL-KDD network traffic into `NORMAL`, `PROBE`, `DOS`, `R2L`, or `U2R`. An Isolation Forest adds an anomaly score. The risk engine combines the predicted class, classifier confidence, and anomaly score into a risk score, severity, and recommended action.

## Inputs

The single-prediction API accepts these 22 features:

`duration`, `protocol_type`, `service`, `flag`, `src_bytes`, `dst_bytes`, `land`, `wrong_fragment`, `urgent`, `hot`, `num_failed_logins`, `logged_in`, `num_compromised`, `root_shell`, `su_attempted`, `num_root`, `num_file_creations`, `num_shells`, `num_access_files`, `num_outbound_cmds`, `is_host_login`, `is_guest_login`.

## Persisted Evaluation Metrics

Source: `backend/saved_models/metrics.json`.

| Metric | Value |
|---|---:|
| Accuracy | 0.7250 |
| Macro precision | 0.6981 |
| Macro recall | 0.5405 |
| Macro F1 | 0.5507 |
| ROC-AUC | 0.5592 |
| Training samples | 125,973 |
| Test samples | 22,543 |

The R2L recall in the recorded classification report is approximately 0.0113. Metrics are dataset evaluation results and should not be presented as production detection guarantees.

## Functional Inference Check

A read-only Python check loaded:

- `backend/saved_models/classifier.joblib`
- `backend/saved_models/preprocessor.joblib`
- `backend/saved_models/isolation_forest.joblib`

It submitted a valid 22-feature traffic vector and returned:

```text
prediction: NORMAL
confidence: 0.9998
anomaly_score: 0.3712
risk_score: 12.42
severity: Low
action: Allow Traffic
```

Result: **functional inference passed**.

## Backend Checks

Executed successfully:

```powershell
cd backend
python -m compileall -q app seed.py
```

The application exposes:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/predict`
- `POST /api/predict/batch`
- `POST /api/threat-hunt`
- model management and report endpoints

Authentication and protected-route behavior were verified previously with registration, login, JWT profile access, invalid credential `401` responses, and authenticated dashboard access.

## Frontend Check

Run from `frontend/`:

```powershell
npm ci
npm run build
```

The production build completed successfully during Milestone 4 verification. The build output includes a Vite chunk-size warning; it is an optimization item, not a build failure.

## Compatibility Warning

The local inference check emitted scikit-learn persistence warnings because the saved artifacts report scikit-learn `1.9.0` while the current interpreter has `1.7.1`. Inference completed, but deployment should retrain artifacts using the exact scikit-learn version installed in the target runtime, then rerun this report.

## End-to-End Status

The application path is implemented as:

`User -> React login -> FastAPI JWT -> protected API -> preprocessing -> classifier/anomaly scoring -> prediction/alert persistence -> React result`

The code-level and local inference portions passed. A browser-driven demonstration against a currently running frontend and backend was not claimed because the local backend was unavailable during the final probe. Follow [DEMO_GUIDE.md](DEMO_GUIDE.md) to run the services and perform the final live demonstration.
