from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
import joblib
import os
import pandas as pd
from sqlalchemy.orm import Session
from database import SessionLocal
import models
from datetime import datetime, timedelta


router = APIRouter()


# ============================================================
# DATABASE DEPENDENCY
# ============================================================

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ============================================================
# MODEL PATHS
# ============================================================

MODEL_DIR = "ml/saved_models"

INTRUSION_MODEL_PATH = os.path.join(MODEL_DIR, "intrusion_model.pkl")
ATTACK_MODEL_PATH = os.path.join(MODEL_DIR, "attack_classifier.pkl")
ISOLATION_MODEL_PATH = os.path.join(MODEL_DIR, "isolation_forest.pkl")
PROTOCOL_ENCODER_PATH = os.path.join(MODEL_DIR, "protocol_encoder.pkl")

CICIDS_ATTACK_MODEL_PATH = os.path.join(
    MODEL_DIR, "attack_classifier.pkl"
)
CICIDS_ATTACK_ENCODER_PATH = os.path.join(
    MODEL_DIR, "attack_label_encoder.pkl"
)

UNSW_ATTACK_MODEL_PATH = os.path.join(
    MODEL_DIR, "unsw_attack_classifier.pkl"
)
UNSW_ATTACK_ENCODER_PATH = os.path.join(
    MODEL_DIR, "unsw_attack_label_encoder.pkl"
)
UNSW_FEATURE_ENCODERS_PATH = os.path.join(
    MODEL_DIR, "unsw_feature_encoders.pkl"
)


# ============================================================
# LOAD MODELS
# ============================================================

try:
    intrusion_model = joblib.load(INTRUSION_MODEL_PATH)
    print("Intrusion model loaded successfully")
except Exception as e:
    intrusion_model = None
    print("Intrusion model loading error:", e)


try:
    protocol_encoder = joblib.load(PROTOCOL_ENCODER_PATH)
    print("Protocol encoder loaded successfully")
except Exception as e:
    protocol_encoder = None
    print("Protocol encoder loading error:", e)


try:
    cicids_attack_model = joblib.load(CICIDS_ATTACK_MODEL_PATH)
    cicids_attack_encoder = joblib.load(CICIDS_ATTACK_ENCODER_PATH)
    print("CICIDS2017 attack classifier loaded successfully")
except Exception as e:
    cicids_attack_model = None
    cicids_attack_encoder = None
    print("CICIDS2017 classifier loading error:", e)


try:
    unsw_attack_model = joblib.load(UNSW_ATTACK_MODEL_PATH)
    unsw_attack_encoder = joblib.load(UNSW_ATTACK_ENCODER_PATH)
    unsw_feature_encoders = joblib.load(UNSW_FEATURE_ENCODERS_PATH)
    print("UNSW-NB15 attack classifier loaded successfully")
except Exception as e:
    unsw_attack_model = None
    unsw_attack_encoder = None
    unsw_feature_encoders = {}
    print("UNSW-NB15 classifier loading error:", e)


# ============================================================
# GENERIC TRAFFIC DATA SCHEMA
# ============================================================

class TrafficData(BaseModel):
    duration: float
    src_packets: float
    dst_packets: float
    src_bytes: float
    dst_bytes: float
    protocol: str


# ============================================================
# CICIDS2017 TRAFFIC DATA SCHEMA
# ============================================================

class CICIDSTrafficData(BaseModel):
    source_ip: str = "Unknown"
    destination_ip: str = "Unknown"
    protocol: str = "TCP"
    destination_port: int
    duration: float
    src_packets: float
    dst_packets: float
    src_bytes: float
    dst_bytes: float
    flow_bytes_per_sec: float
    flow_packets_per_sec: float


# ============================================================
# UNSW-NB15 TRAFFIC DATA SCHEMA
# ============================================================

class UNSWTrafficData(BaseModel):
    source_ip: str = "Unknown"
    destination_ip: str = "Unknown"
    proto: str
    service: str
    state: str
    dur: float
    spkts: float
    dpkts: float
    sbytes: float
    dbytes: float
    rate: float
    sload: float
    dload: float
    sloss: float
    dloss: float
    sinpkt: float
    dinpkt: float
    sjit: float
    djit: float
    swin: float
    stcpb: float
    dtcpb: float
    dwin: float
    tcprtt: float
    synack: float
    ackdat: float
    smean: float
    dmean: float
    trans_depth: float
    response_body_len: float
    ct_src_dport_ltm: float
    ct_dst_sport_ltm: float
    is_ftp_login: float
    ct_ftp_cmd: float
    ct_flw_http_mthd: float
    is_sm_ips_ports: float


# ============================================================
# RISK + SEVERITY
# ============================================================

def calculate_risk(attack_type):
    attack = str(attack_type).lower()

    mapping = {
        "dos hulk": 90,
        "dos goldeneye": 85,
        "dos slowhttptest": 80,
        "dos slowloris": 80,
        "ftp-patator": 75,
        "ssh-patator": 75,
        "exploits": 85,
        "generic": 80,
        "dos": 90,
        "fuzzers": 70,
        "reconnaissance": 60,
        "analysis": 50,
        "backdoor": 90,
        "shellcode": 95,
        "worms": 95,
        "benign": 0,
        "normal": 0,
    }

    return mapping.get(attack, 50)


def calculate_severity(risk_score):
    if risk_score >= 90:
        return "Critical"
    if risk_score >= 70:
        return "High"
    if risk_score >= 30:
        return "Medium"
    return "Low"


# ============================================================
# SAVE SECURITY ALERT WITH 60-SECOND DEDUPLICATION
# ============================================================

def save_security_alert(
    db: Session,
    dataset: str,
    source: str,
    source_ip: str,
    destination_ip: str,
    protocol: str,
    attack_type: str,
    detection_details: str,
):
    risk_score = calculate_risk(attack_type)
    severity = calculate_severity(risk_score)
    now = datetime.utcnow()
    cutoff = now - timedelta(seconds=60)

    existing = (
        db.query(models.Alert)
        .filter(
            models.Alert.dataset == dataset,
            models.Alert.attack_type == attack_type,
            models.Alert.protocol == protocol,
            models.Alert.status == "Open",
            models.Alert.detected_at >= cutoff,
        )
        .order_by(models.Alert.id.desc())
        .first()
    )

    if existing:
        return existing, False

    new_alert = models.Alert(
        dataset=dataset,
        source=source,
        source_ip=source_ip,
        destination_ip=destination_ip,
        protocol=protocol,
        attack_type=attack_type,
        severity=severity,
        risk_score=risk_score,
        risk_level=severity,
        status="Open",
        detection_details=detection_details,
        detected_at=now,
        timestamp=now,
    )

    db.add(new_alert)
    db.commit()
    db.refresh(new_alert)

    return new_alert, True


# ============================================================
# EXISTING COMBINED INTRUSION PREDICTION
# ============================================================

@router.post("/predict")
def predict_traffic(
    data: TrafficData,
    db: Session = Depends(get_db),
):
    if intrusion_model is None:
        raise HTTPException(
            status_code=500,
            detail="Intrusion model is not loaded",
        )

    try:
        protocol_value = str(data.protocol).strip()

        if protocol_encoder is not None:
            try:
                encoded_protocol = protocol_encoder.transform(
                    [protocol_value]
                )[0]
            except Exception:
                try:
                    encoded_protocol = protocol_encoder.transform(
                        [protocol_value.upper()]
                    )[0]
                except Exception:
                    try:
                        encoded_protocol = protocol_encoder.transform(
                            [protocol_value.lower()]
                        )[0]
                    except Exception:
                        encoded_protocol = 0
        else:
            encoded_protocol = 0

        features = pd.DataFrame(
            [[
                data.duration,
                data.src_packets,
                data.dst_packets,
                data.src_bytes,
                data.dst_bytes,
                encoded_protocol,
            ]],
            columns=[
                "duration",
                "src_packets",
                "dst_packets",
                "src_bytes",
                "dst_bytes",
                "protocol",
            ],
        )

        prediction = intrusion_model.predict(features)[0]

        confidence = 0.0
        if hasattr(intrusion_model, "predict_proba"):
            probabilities = intrusion_model.predict_proba(features)[0]
            confidence = max(probabilities) * 100

        if int(prediction) == 1:
            alert, created = save_security_alert(
                db=db,
                dataset="Combined Dataset",
                source="Live Network Traffic",
                source_ip="Unknown",
                destination_ip="Unknown",
                protocol=protocol_value,
                attack_type="Network Intrusion",
                detection_details=(
                    "Combined intrusion model detected "
                    "suspicious network traffic."
                ),
            )

            return {
                "prediction": "Attack",
                "confidence": f"{confidence:.2f}%",
                "attack_type": "Network Intrusion",
                "severity": alert.severity,
                "risk_score": alert.risk_score,
                "risk_level": alert.risk_level,
                "alert_id": alert.id,
                "alert_created": created,
            }

        return {
            "prediction": "Normal",
            "confidence": f"{confidence:.2f}%",
            "attack_type": "None",
            "severity": "LOW",
            "risk_score": 0,
            "risk_level": "LOW",
            "alert_id": None,
        }

    except Exception as e:
        print("Prediction error:", str(e))
        try:
            db.rollback()
        except Exception:
            pass

        raise HTTPException(
            status_code=500,
            detail=str(e),
        )


# ============================================================
# CICIDS2017 ATTACK PREDICTION
# ============================================================

@router.post("/predict/cicids")
def predict_cicids(
    data: CICIDSTrafficData,
    db: Session = Depends(get_db),
):
    if cicids_attack_model is None:
        raise HTTPException(
            status_code=500,
            detail="CICIDS2017 classifier is not loaded",
        )

    if cicids_attack_encoder is None:
        raise HTTPException(
            status_code=500,
            detail="CICIDS2017 label encoder is not loaded",
        )

    try:
        features = pd.DataFrame(
            [[
                data.destination_port,
                data.duration,
                data.src_packets,
                data.dst_packets,
                data.src_bytes,
                data.dst_bytes,
                data.flow_bytes_per_sec,
                data.flow_packets_per_sec,
            ]],
            columns=[
                "Destination Port",
                "Flow Duration",
                "Total Fwd Packets",
                "Total Backward Packets",
                "Total Length of Fwd Packets",
                "Total Length of Bwd Packets",
                "Flow Bytes/s",
                "Flow Packets/s",
            ],
        )

        prediction = cicids_attack_model.predict(features)[0]

        confidence = 0.0

        if hasattr(cicids_attack_model, "predict_proba"):

            probabilities = cicids_attack_model.predict_proba(
                features
             )[0]

            confidence = max(probabilities) * 100

        attack_type = cicids_attack_encoder.inverse_transform(
            [prediction]
        )[0]

        if str(attack_type).upper() == "BENIGN":
            return {
                "dataset": "CICIDS2017",
                "prediction": "Normal",
                "attack_type": "BENIGN",
                "severity": "Low",
                "risk_score": 0,
                "risk_level": "Low",
                "confidence": f"{confidence:.2f}%",
                "alert_id": None,
                "alert_created": False
            }

        alert, created = save_security_alert(
            db=db,
            dataset="CICIDS2017",
            source="CICIDS2017 Network Traffic",
            source_ip=data.source_ip,
            destination_ip=data.destination_ip,
            protocol=data.protocol,
            attack_type=attack_type,
            detection_details=(
                "CICIDS2017 Random Forest attack "
                f"classifier detected {attack_type}."
            ),
        )

        return {
            "dataset": "CICIDS2017",
            "prediction": "Attack",
            "attack_type": attack_type,
            "severity": alert.severity,
            "risk_score": alert.risk_score,
            "risk_level": alert.risk_level,
            "confidence": f"{confidence:.2f}%",
            "alert_id": alert.id,
            "alert_created": created
        }

    except Exception as e:
        print("CICIDS2017 prediction error:", str(e))
        try:
            db.rollback()
        except Exception:
            pass

        raise HTTPException(
            status_code=500,
            detail=str(e),
        )


# ============================================================
# UNSW-NB15 ATTACK PREDICTION
# ============================================================

@router.post("/predict/unsw")
def predict_unsw(
    data: UNSWTrafficData,
    db: Session = Depends(get_db),
):

    if unsw_attack_model is None:
        raise HTTPException(
            status_code=500,
            detail="UNSW-NB15 classifier is not loaded",
        )

    if unsw_attack_encoder is None:
        raise HTTPException(
            status_code=500,
            detail="UNSW-NB15 label encoder is not loaded",
        )

    if not unsw_feature_encoders:
        raise HTTPException(
            status_code=500,
            detail="UNSW-NB15 feature encoders are not loaded",
        )

    try:

        # ----------------------------------------------------
        # Encode categorical features FIRST
        # ----------------------------------------------------

        proto_encoder = unsw_feature_encoders["proto"]
        service_encoder = unsw_feature_encoders["service"]
        state_encoder = unsw_feature_encoders["state"]

        proto_value = str(data.proto)
        service_value = str(data.service)
        state_value = str(data.state)

        if proto_value in proto_encoder.classes_:
            encoded_proto = int(
                proto_encoder.transform([proto_value])[0]
            )
        else:
            encoded_proto = 0

        if service_value in service_encoder.classes_:
            encoded_service = int(
                service_encoder.transform([service_value])[0]
            )
        else:
            encoded_service = 0

        if state_value in state_encoder.classes_:
            encoded_state = int(
                state_encoder.transform([state_value])[0]
            )
        else:
            encoded_state = 0

        # ----------------------------------------------------
        # Create NUMERIC model input
        # ----------------------------------------------------

        feature_values = [
            data.dur,
            encoded_proto,
            encoded_service,
            encoded_state,
            data.spkts,
            data.dpkts,
            data.sbytes,
            data.dbytes,
            data.rate,
            data.sload,
            data.dload,
            data.sloss,
            data.dloss,
            data.sinpkt,
            data.dinpkt,
            data.sjit,
            data.djit,
            data.swin,
            data.stcpb,
            data.dtcpb,
            data.dwin,
            data.tcprtt,
            data.synack,
            data.ackdat,
            data.smean,
            data.dmean,
            data.trans_depth,
            data.response_body_len,
            data.ct_src_dport_ltm,
            data.ct_dst_sport_ltm,
            data.is_ftp_login,
            data.ct_ftp_cmd,
            data.ct_flw_http_mthd,
            data.is_sm_ips_ports,
        ]

        features = pd.DataFrame(
            [feature_values],
            columns=[
                "dur",
                "proto",
                "service",
                "state",
                "spkts",
                "dpkts",
                "sbytes",
                "dbytes",
                "rate",
                "sload",
                "dload",
                "sloss",
                "dloss",
                "sinpkt",
                "dinpkt",
                "sjit",
                "djit",
                "swin",
                "stcpb",
                "dtcpb",
                "dwin",
                "tcprtt",
                "synack",
                "ackdat",
                "smean",
                "dmean",
                "trans_depth",
                "response_body_len",
                "ct_src_dport_ltm",
                "ct_dst_sport_ltm",
                "is_ftp_login",
                "ct_ftp_cmd",
                "ct_flw_http_mthd",
                "is_sm_ips_ports",
            ],
        )

        # Make absolutely sure every model input is numeric
        features = features.apply(
            pd.to_numeric,
            errors="coerce"
        ).fillna(0)

        # ----------------------------------------------------
        # Prediction
        # ----------------------------------------------------

        prediction = unsw_attack_model.predict(
            features
        )[0]

        confidence = 0.0

        if hasattr(unsw_attack_model, "predict_proba"):

            probabilities = unsw_attack_model.predict_proba(
                features
            )[0]

            confidence = max(probabilities) * 100

        attack_type = (
            unsw_attack_encoder
            .inverse_transform([prediction])[0]
        )

        # ----------------------------------------------------
        # NORMAL TRAFFIC
        # ----------------------------------------------------

        if str(attack_type).lower() == "normal":

            return {
                "dataset": "UNSW-NB15",
                "prediction": "Normal",
                "attack_type": "Normal",
                "severity": "Low",
                "risk_score": 0,
                "risk_level": "Low",
                "confidence": f"{confidence:.2f}%",
                "alert_id": None,
                "alert_created": False,
            }

        # ----------------------------------------------------
        # ATTACK → CREATE DATABASE ALERT
        # ----------------------------------------------------

        alert, created = save_security_alert(

            db=db,

            dataset="UNSW-NB15",

            source="UNSW-NB15 Network Traffic",

            source_ip=data.source_ip,

            destination_ip=data.destination_ip,

            protocol=data.proto,

            attack_type=attack_type,

            detection_details=(
                "UNSW-NB15 Random Forest attack "
                f"classifier detected {attack_type}."
            ),
        )

        return {
            "dataset": "UNSW-NB15",
            "prediction": "Attack",
            "attack_type": attack_type,
            "severity": alert.severity,
            "risk_score": alert.risk_score,
            "risk_level": alert.risk_level,
            "confidence": f"{confidence:.2f}%",
            "alert_id": alert.id,
            "alert_created": created,
        }

    except Exception as e:

        print(
            "UNSW-NB15 prediction error:",
            str(e)
        )

        try:
            db.rollback()
        except Exception:
            pass

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

# ============================================================
# MODEL PERFORMANCE
# ============================================================

@router.get("/reports/model-performance")
def model_performance():

    intrusion_exists = os.path.exists(
        INTRUSION_MODEL_PATH
    )

    attack_exists = os.path.exists(
        ATTACK_MODEL_PATH
    )

    isolation_exists = os.path.exists(
        ISOLATION_MODEL_PATH
    )

    return {
        "intrusion_detection": {
            "model": "Random Forest",
            "accuracy": 99.28,
            "status": (
                "Trained"
                if intrusion_exists
                else "Model Missing"
            ),
        },

        "threat_classification": {
            "model": "Random Forest",
            "accuracy": 99.86,
            "precision": 99.0,
            "recall": 99.0,
            "f1_score": 99.0,
            "status": (
                "Trained"
                if attack_exists
                else "Model Missing"
            ),
        },

        "anomaly_detection": {
            "model": "Isolation Forest",
            "anomalies_detected": 151774,
            "anomaly_percentage": 10.0,
            "status": (
                "Trained"
                if isolation_exists
                else "Model Missing"
            ),
        },

        "overall_status":
            "AI Threat Detection System Operational",
    }
