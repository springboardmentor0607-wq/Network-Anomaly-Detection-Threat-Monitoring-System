import os
import io
import time
import json
import joblib
from pathlib import Path
import pandas as pd
import numpy as np
import logging
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session
from sqlalchemy import desc

from ..database.connection import get_db
from ..database.models import (
    MLModelRecord, Alert, Notification, Prediction, ThreatRecord
)
from ..schemas.schemas import TrafficInput, PredictionResponse, TrainRequest, ModelCreateRequest, ModelStatusRequest
from ..ml.preprocessor import DataPreprocessor, COLUMNS, SELECTED_FEATURES
from ..ml.train import train_model_pipeline, find_dataset_file
from ..ml.anomaly import AnomalyDetector
from ..services.threat_intel_service import ThreatIntelService

router = APIRouter(prefix="/api", tags=["Machine Learning Pipeline & AI Detection"])

REQUIRED_CSV_FEATURES = [
    "duration", "protocol_type", "service", "flag", "src_bytes", "dst_bytes",
    "land", "wrong_fragment", "urgent", "hot", "num_failed_logins", "logged_in",
    "num_compromised", "root_shell", "su_attempted", "num_root", "num_file_creations",
    "num_shells", "num_access_files", "num_outbound_cmds", "is_host_login", "is_guest_login"
]
BACKEND_DIR = Path(__file__).resolve().parents[2]
MODEL_DIR = BACKEND_DIR / "saved_models"
logger = logging.getLogger(__name__)


def model_response(model):
    return {
        "id": model.id,
        "name": model.name,
        "algorithm": model.algorithm,
        "version": model.version,
        "dataset": model.dataset,
        "accuracy": model.accuracy,
        "precision": model.precision,
        "recall": model.recall,
        "f1_score": model.f1_score,
        "roc_auc": model.roc_auc,
        "is_active": model.is_active,
        "status": model.status,
        "artifact_path": model.artifact_path,
        "created_at": model.created_at.strftime("%Y-%m-%d %H:%M")
    }


@router.post("/predict", response_model=PredictionResponse)
def predict_traffic(payload: TrafficInput, db: Session = Depends(get_db)):
    start_time = time.perf_counter()

    if not (MODEL_DIR / "classifier.joblib").exists() or not (MODEL_DIR / "preprocessor.joblib").exists():
        train_model_pipeline()

    try:
        clf = joblib.load(MODEL_DIR / "classifier.joblib")
        preprocessor = DataPreprocessor.load(str(MODEL_DIR / "preprocessor.joblib"))
        iso = AnomalyDetector.load(str(MODEL_DIR / "isolation_forest.joblib")) or AnomalyDetector()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed loading ML models: {str(e)}")

    input_dict = payload.model_dump()
    source_ip = input_dict.get("source_ip") or "192.168.1.100"
    
    # 1. Real Feature Scaling & Transformation
    feat_vector = preprocessor.transform_single(input_dict)

    # 2. Supervised Classification
    pred_class = str(clf.predict(feat_vector)[0])
    probabilities = clf.predict_proba(feat_vector)[0] if hasattr(clf, "predict_proba") else [0.95]
    confidence = float(np.max(probabilities))

    # 3. Anomaly Scoring
    anomaly_score = float(iso.score(feat_vector)) if iso.is_fitted else 0.15
    risk_score, severity, action = iso.evaluate_risk(pred_class, confidence, anomaly_score)

    latency_ms = round((time.perf_counter() - start_time) * 1000, 2)
    severity_clean = str(severity).upper()

    # 4. Save to Prediction Log
    pred_entry = Prediction(
        timestamp=datetime.utcnow(),
        attack_class=pred_class,
        probability=round(confidence, 4),
        confidence=round(confidence * 100, 2),
        risk_score=float(risk_score),
        risk_level=severity_clean,
        model_used="Random Forest Classifier",
        model_version="v2.0",
        source_ip=source_ip,
        inference_latency_ms=latency_ms
    )
    db.add(pred_entry)

    # 5. 5-Minute Deduplication & Correlation Window
    if pred_class.upper() != "NORMAL" or severity_clean in ["HIGH", "CRITICAL"]:
        five_mins_ago = datetime.utcnow() - timedelta(minutes=5)
        existing_alert = db.query(Alert).filter(
            Alert.source_ip == source_ip,
            Alert.attack_type == pred_class,
            Alert.last_seen >= five_mins_ago,
            Alert.status.notin_(["RESOLVED", "CLOSED"])
        ).first()

        if existing_alert:
            existing_alert.occurrences += 1
            existing_alert.last_seen = datetime.utcnow()
            existing_alert.risk_score = max(existing_alert.risk_score, float(risk_score))
            existing_alert.confidence = max(existing_alert.confidence, round(confidence * 100, 2))
            alert_id = existing_alert.id
        else:
            new_alert = Alert(
                timestamp=datetime.utcnow(),
                first_seen=datetime.utcnow(),
                last_seen=datetime.utcnow(),
                source_ip=source_ip,
                destination_ip=input_dict.get("destination_ip") or "10.0.0.15",
                target_port=80,
                protocol=payload.protocol_type.upper(),
                attack_type=pred_class,
                severity=severity_clean,
                risk_score=float(risk_score),
                confidence=round(confidence * 100, 2),
                occurrences=1,
                status="OPEN",
                recommended_action=action
            )
            db.add(new_alert)
            db.flush()
            alert_id = new_alert.id

            # 6. Real-Time Notification on Critical / High
            if severity_clean in ["HIGH", "CRITICAL"]:
                notification = Notification(
                    alert_id=alert_id,
                    title=f"Security Alert: {pred_class.upper()}",
                    message=f"Host {source_ip} exhibited {pred_class} pattern (Risk: {risk_score}/100)",
                    severity=severity_clean,
                    source_ip=source_ip,
                    attack_type=pred_class,
                    risk_score=float(risk_score),
                    is_read=False,
                    timestamp=datetime.utcnow()
                )
                db.add(notification)

            # 7. Threat Intelligence Telemetry
            ThreatIntelService.enrich_indicator(db, source_ip, pred_class, float(risk_score), severity_clean)

    db.commit()

    return {
        "predicted_class": pred_class,
        "probability": round(confidence, 4),
        "confidence": round(confidence * 100, 2),
        "anomaly_score": round(anomaly_score, 4),
        "risk_score": float(risk_score),
        "severity": severity_clean,
        "recommended_action": action,
        "model_used": "Random Forest Classifier",
        "model_version": "v2.0",
        "inference_latency": f"{latency_ms}ms",
        "prediction_time": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S"),
        "source_ip": source_ip
    }


@router.post("/predict/batch")
async def predict_batch_csv(file: UploadFile = File(...), db: Session = Depends(get_db)):
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Invalid file type. Please upload a standard CSV file.")

    content = await file.read()
    try:
        df = pd.read_csv(io.BytesIO(content))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed parsing CSV: {str(e)}")

    missing_cols = [c for c in REQUIRED_CSV_FEATURES if c not in df.columns]
    if missing_cols:
        raise HTTPException(
            status_code=422,
            detail=f"Incompatible CSV feature schema. Missing required columns: {', '.join(missing_cols)}"
        )

    clf = joblib.load(MODEL_DIR / "classifier.joblib")
    preprocessor = DataPreprocessor.load(str(MODEL_DIR / "preprocessor.joblib"))
    iso = AnomalyDetector.load(str(MODEL_DIR / "isolation_forest.joblib")) or AnomalyDetector()

    total_rows = len(df)
    processed_samples = []
    attack_count = 0
    normal_count = 0
    attack_dist = {}
    severity_breakdown = {"CRITICAL": 0, "HIGH": 0, "MEDIUM": 0, "LOW": 0}
    total_conf = 0.0
    total_risk = 0.0

    for idx, row in df.iterrows():
        row_dict = row.to_dict()
        feat_vec = preprocessor.transform_single(row_dict)
        pred = str(clf.predict(feat_vec)[0])
        prob = float(np.max(clf.predict_proba(feat_vec)[0])) if hasattr(clf, "predict_proba") else 0.95
        anom = float(iso.score(feat_vec)) if iso.is_fitted else 0.15
        risk, sev, _ = iso.evaluate_risk(pred, prob, anom)
        sev_clean = str(sev).upper()

        if pred.upper() == "NORMAL":
            normal_count += 1
        else:
            attack_count += 1

        attack_dist[pred] = attack_dist.get(pred, 0) + 1
        severity_breakdown[sev_clean] = severity_breakdown.get(sev_clean, 0) + 1
        total_conf += prob * 100
        total_risk += risk

        if len(processed_samples) < 50:
            processed_samples.append({
                "row_id": idx + 1,
                "predicted_class": pred,
                "confidence": f"{(prob * 100):.2f}%",
                "risk_score": risk,
                "severity": sev_clean
            })

    return {
        "total_rows": total_rows,
        "processed_rows": total_rows,
        "attack_count": attack_count,
        "normal_count": normal_count,
        "attack_distribution": attack_dist,
        "severity_distribution": severity_breakdown,
        "average_confidence": f"{(total_conf / total_rows):.2f}%",
        "average_risk_score": round(total_risk / total_rows, 2),
        "sample_evaluations": processed_samples
    }


@router.post("/models/train")
def train_model(req: TrainRequest, db: Session = Depends(get_db)):
    if not 0.1 <= req.test_size <= 0.5:
        raise HTTPException(status_code=422, detail="test_size must be between 0.1 and 0.5")
    if req.target_column != "label":
        raise HTTPException(status_code=422, detail="NSL-KDD requires the label target column")
    try:
        metrics = train_model_pipeline(
            algorithm=req.algorithm,
            dataset_name=req.dataset,
            test_size=req.test_size,
            random_state=req.random_state
        )
        db.query(MLModelRecord).update({"is_active": False, "status": "Ready"})
        record = MLModelRecord(
            name=f"{req.algorithm} - {req.dataset}",
            algorithm=req.algorithm,
            dataset=req.dataset,
            version=f"v2.{db.query(MLModelRecord).count() + 1}",
            accuracy=metrics["accuracy"],
            precision=metrics["precision"],
            recall=metrics["recall"],
            f1_score=metrics["f1_score"],
            roc_auc=metrics.get("roc_auc"),
            is_active=True,
            status="Active",
            artifact_path=str(MODEL_DIR / "classifier.joblib"),
            metrics_json=json.dumps(metrics)
        )
        db.add(record)
        db.commit()
        db.refresh(record)
        return {"message": "Training pipeline completed successfully", "model": model_response(record), "metrics": metrics}
    except ValueError as e:
        db.rollback()
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Training error: {str(e)}")


@router.post("/models", status_code=201)
def create_model(req: ModelCreateRequest, db: Session = Depends(get_db)):
    name = req.name.strip()
    if not name:
        raise HTTPException(status_code=422, detail="Model name is required")
    if req.algorithm not in {"Random Forest", "Random Forest Classifier", "Isolation Forest", "Logistic Regression", "Gradient Boosting"}:
        raise HTTPException(status_code=422, detail="Unsupported model algorithm")
    record = MLModelRecord(
        name=name,
        algorithm=req.algorithm,
        dataset=req.dataset.strip() or "NSL-KDD",
        version=f"v1.{db.query(MLModelRecord).count() + 1}",
        status="Ready",
        is_active=False,
        artifact_path=None
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return model_response(record)


@router.get("/models")
def list_models(db: Session = Depends(get_db)):
    records = db.query(MLModelRecord).order_by(MLModelRecord.created_at.desc()).all()
    return [model_response(m) for m in records]


@router.delete("/models/{model_id}", status_code=204)
def delete_model(model_id: int, db: Session = Depends(get_db)):
    record = db.query(MLModelRecord).filter(MLModelRecord.id == model_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Model not found")
    db.delete(record)
    db.commit()


@router.put("/models/{model_id}/status")
def update_model_status(model_id: int, req: ModelStatusRequest, db: Session = Depends(get_db)):
    record = db.query(MLModelRecord).filter(MLModelRecord.id == model_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Model not found")
    action = req.action.lower()
    if action in {"activate", "start"}:
        db.query(MLModelRecord).update({"is_active": False, "status": "Ready"})
        record.is_active = True
        record.status = "Active" if action == "activate" else "Running"
    elif action == "stop":
        record.is_active = False
        record.status = "Ready"
    else:
        raise HTTPException(status_code=422, detail="Action must be activate, start, or stop")
    db.commit()
    db.refresh(record)
    return model_response(record)


@router.get("/models/{model_id}/evaluation")
def get_model_evaluation(model_id: int, db: Session = Depends(get_db)):
    record = db.query(MLModelRecord).filter(MLModelRecord.id == model_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Model not found")
    return {"model": model_response(record), "metrics": json.loads(record.metrics_json) if record.metrics_json else None}


@router.post("/threat-hunt")
def threat_hunt(db: Session = Depends(get_db)):
    test_path = find_dataset_file("KDDTest+")
    classifier_path = MODEL_DIR / "classifier.joblib"
    logger.info(
        "Threat Hunt diagnostic: cwd=%s backend_dir=%s dataset_dir=%s checked_file=%s exists=%s classifier=%s classifier_exists=%s",
        Path.cwd(), BACKEND_DIR, BACKEND_DIR / "dataset", test_path, bool(test_path), classifier_path, classifier_path.exists()
    )
    if not test_path:
        raise HTTPException(status_code=422, detail=f"Threat Hunt dataset not found. Add a real file at {BACKEND_DIR / 'dataset' / 'KDDTest+.txt'} or KDDTest+.csv.")
    if not classifier_path.exists():
        raise HTTPException(status_code=409, detail="No trained classifier artifact is available")
    try:
        clf = joblib.load(classifier_path)
        preprocessor = DataPreprocessor.load(str(MODEL_DIR / "preprocessor.joblib"))
        iso = AnomalyDetector.load(str(MODEL_DIR / "isolation_forest.joblib")) or AnomalyDetector()
        if not preprocessor:
            raise ValueError("Preprocessor artifact is missing")
        df = pd.read_csv(test_path, names=COLUMNS)
        if df.empty:
            raise ValueError("Threat Hunt dataset is empty")
        features = df.copy()
        for col in preprocessor.categorical_cols:
            encoder = preprocessor.encoders[col]
            features[col] = features[col].astype(str).str.lower().apply(lambda value: encoder.transform([value])[0] if value in encoder.classes_ else 0)
        features[preprocessor.numeric_cols] = preprocessor.scaler.transform(features[preprocessor.numeric_cols])
        feature_frame = features[SELECTED_FEATURES]
        predictions = clf.predict(feature_frame)
        probabilities = clf.predict_proba(feature_frame) if hasattr(clf, "predict_proba") else None
        results = []
        for index, predicted in enumerate(predictions):
            vector = feature_frame.iloc[[index]].values
            confidence = float(np.max(probabilities[index])) if probabilities is not None else 1.0
            anomaly = float(iso.score(vector)) if iso.is_fitted else 0.0
            risk, severity, action = iso.evaluate_risk(str(predicted), confidence, anomaly)
            if str(predicted).upper() != "NORMAL" or severity in {"High", "Critical"}:
                results.append({"row": index + 1, "predicted_class": str(predicted), "confidence": round(confidence * 100, 2), "risk_score": risk, "severity": severity, "recommended_action": action})
        return {"dataset": "NSL-KDD", "scanned_rows": len(df), "threat_count": len(results), "results": results[:100]}
    except (ValueError, KeyError) as e:
        raise HTTPException(status_code=422, detail=f"Threat Hunt validation failed: {e}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Threat Hunt failed: {e}")


@router.get("/predictions/history")
def get_prediction_history(db: Session = Depends(get_db)):
    preds = db.query(Prediction).order_by(desc(Prediction.timestamp)).limit(50).all()
    return [{
        "id": p.id,
        "timestamp": p.timestamp.strftime("%Y-%m-%d %H:%M:%S"),
        "attack_class": p.attack_class,
        "probability": p.probability,
        "confidence": p.confidence,
        "risk_score": p.risk_score,
        "risk_level": p.risk_level,
        "model_used": p.model_used,
        "source_ip": p.source_ip,
        "inference_latency_ms": p.inference_latency_ms
    } for p in preds]
