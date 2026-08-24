import asyncio
import json
import logging
import threading
import time
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import numpy as np
import pandas as pd

from app.services.system_logger import log_system_event
from app.services.risk_scoring import RiskScoringService
from app.services.threat_analysis import ThreatAnalysisService
from app.services.threat_insights import record_prediction
from app.services.alert_service import create_alert_from_prediction

logger = logging.getLogger('netshield.backend.network')

_BACKEND_ROOT = Path(__file__).resolve().parent.parent.parent
_DATA_CANDIDATES = [
    Path(__file__).resolve().parent.parent / 'data',   # backend/app/data  ← actual location
    _BACKEND_ROOT / 'data',                             # backend/data      ← fallback
    Path(__file__).resolve().parent / 'data',           # backend/app/services/data ← last resort
]

# Full datasets are loaded at startup without sampling or row limits.
# Dataset preprocessing is cached in memory and reused for API responses.

COMMON_SCHEMA_COLUMNS = [
    'timestamp',
    'dataset_name',
    'source_ip',
    'destination_ip',
    'source_port',
    'destination_port',
    'protocol',
    'packet_size',
    'flow_duration',
    'total_packets',
    'total_bytes',
    'traffic_label',
    'attack_category',
    'threat_level',
]

CORE_OUTPUT_COLUMNS = [
    'timestamp',
    'source',
    'dataset_name',
    'source_ip',
    'destination_ip',
    'source_port',
    'destination_port',
    'protocol',
    'packet_size',
    'flow_duration',
    'total_packets',
    'total_bytes',
    'traffic_label',
    'threat_level',
    'prediction',
    'confidence',
    'risk_score',
]

UNSW_NB15_COLUMNS = [
    'srcip',              # 0: Source IP
    'sport',              # 1: Source Port
    'dstip',              # 2: Destination IP
    'dsport',             # 3: Destination Port
    'proto',              # 4: Protocol
    'state',              # 5: Connection State
    'dur',                # 6: Flow Duration (seconds)
    'sbytes',             # 7: Source to Destination Bytes
    'dbytes',             # 8: Destination to Source Bytes
    'sttl',               # 9: Source TTL
    'dttl',               # 10: Destination TTL
    'sloss',              # 11: Source Loss
    'dloss',              # 12: Destination Loss
    'service',            # 13: Service
    'sload',              # 14: Source Load
    'dload',              # 15: Destination Load
    'spkts',              # 16: Source Packets
    'dpkts',              # 17: Destination Packets
    'swin',               # 18: Source Window
    'dwin',               # 19: Destination Window
    'stcpb',              # 20: Source TCP Base
    'dtcpb',              # 21: Destination TCP Base
    'smeansz',            # 22: Source Mean Size
    'dmeansz',            # 23: Destination Mean Size
    'trans_depth',        # 24: Transaction Depth
    'response_body_len',  # 25: Response Body Length
    'sjit',               # 26: Source Jitter
    'djit',               # 27: Destination Jitter
    'stime',              # 28: Start Time (Unix Epoch)
    'ltime',              # 29: Last Time (Unix Epoch)
    'sintpkt',            # 30: Source Inter-Packet Time
    'dintpkt',            # 31: Destination Inter-Packet Time
    'tcprtt',             # 32: TCP Round Trip Time
    'synack',             # 33: SYN-ACK
    'ackdat',             # 34: ACK-DAT
    'is_sm_ips_ports',    # 35: Same IPs and Ports
    'ct_state_ttl',       # 36: Connection State TTL
    'ct_flw_http_mthd',   # 37: Connection Flow HTTP Method
    'is_wnw_traffic',     # 38: Is Web-Non-Web Traffic
    'ct_srv_src',         # 39: Count Service Source
    'ct_srv_dst',         # 40: Count Service Destination
    'ct_dst_ltm',         # 41: Count Destination Last Time
    'ct_src_ltm',         # 42: Count Source Last Time
    'ct_src_dport_ltm',   # 43: Count Source Dest Port Last Time
    'ct_dst_sport_ltm',   # 44: Count Destination Source Port Last Time
    'ct_dst_src_ltm',     # 45: Count Destination Source Last Time
    'attack_cat',         # 46: Attack Category
    'label',              # 47: Label/Empty
    'confidence',         # 48: Confidence Score
]

CICIDS2017_COLUMNS = {
    'destination_port': ' Destination Port',
    'flow_duration': ' Flow Duration',
    'total_fwd_packets': ' Total Fwd Packets',
    'total_bwd_packets': ' Total Backward Packets',
    'total_fwd_bytes': 'Total Length of Fwd Packets',
    'total_bwd_bytes': ' Total Length of Bwd Packets',
    'fwd_packet_length_max': ' Fwd Packet Length Max',
    'fwd_packet_length_min': ' Fwd Packet Length Min',
    'fwd_packet_length_mean': ' Fwd Packet Length Mean',
    'bwd_packet_length_max': 'Bwd Packet Length Max',
    'bwd_packet_length_min': ' Bwd Packet Length Min',
    'bwd_packet_length_mean': ' Bwd Packet Length Mean',
    'flow_bytes_per_s': 'Flow Bytes/s',
    'flow_packets_per_s': ' Flow Packets/s',
    'min_packet_length': ' Min Packet Length',
    'max_packet_length': ' Max Packet Length',
    'packet_length_mean': ' Packet Length Mean',
    'average_packet_size': ' Average Packet Size',
    'label': ' Label',
}

EMPTY_ANALYTICS: Dict[str, Any] = {
    'total_traffic': 0,
    'normal_traffic': 0,
    'attack_traffic': 0,
    'high_threat_alerts': 0,
    'unique_source_ips': 0,
    'unique_destination_ips': 0,
    'protocol_distribution': [],
    'threat_level_distribution': [],
    'traffic_label_distribution': [],
    'top_10_source_ips': [],
    'top_10_destination_ips': [],
    'packet_size_distribution': [],
    'average_packet_size': 0,
    'minimum_packet_size': 0,
    'maximum_packet_size': 0,
}

_CACHE_LOCK = threading.Lock()
# asyncio.Event — set when the background dataset load completes (ready OR failed).
# All coroutines that arrive while loading is in progress await this event instead
# of returning an empty 'loading' payload.  Using asyncio.Event (not threading)
# is safe here because it is only ever awaited from coroutines on the main
# event-loop thread.
_DATASET_READY_EVENT: asyncio.Event = asyncio.Event()
_CACHE_STATE: Dict[str, Any] = {
    'status': 'idle',
    'combined': None,
    'analytics': None,
    'summary': {},
    'error': None,
    'background_task': None,
    'files_loaded': [],
    'files_failed': [],
}


def resolve_data_directory(data_directory: Path | None = None) -> Path:
    """Resolve the dataset directory, preferring backend/data."""
    if data_directory is not None:
        return Path(data_directory).resolve()

    primary = _DATA_CANDIDATES[0].resolve()
    if primary.exists() and any(primary.rglob('*.csv')):
        logger.info('Using dataset directory: %s', primary)
        return primary

    fallback = _DATA_CANDIDATES[1].resolve()
    if fallback.exists() and any(fallback.rglob('*.csv')):
        logger.info('No CSV files in %s; using %s', primary, fallback)
        return fallback

    if primary.exists():
        return primary

    logger.warning('Dataset directory %s not found; falling back to %s', primary, fallback)
    return fallback


def discover_csv_files(data_directory: Path | None = None) -> List[Path]:
    """Discover every dataset file (.csv, .xlsx, .xls) under backend/app/data."""
    resolved_directory = resolve_data_directory(data_directory)

    if not resolved_directory.exists():
        logger.warning('Dataset directory not found: %s', resolved_directory)
        return []

    dataset_files = sorted(
        path for path in resolved_directory.rglob('*')
        if path.is_file() and path.suffix.lower() in ('.csv', '.xlsx', '.xls')
    )
    logger.info('Discovered %d dataset file(s) under %s', len(dataset_files), resolved_directory)
    return dataset_files



def _standardize_protocol(value: Any) -> Optional[str]:
    if pd.isna(value):
        return None
    text = str(value).strip().upper()
    return text or None


def _apply_real_ml_predictions(df: pd.DataFrame) -> pd.DataFrame:
    """
    Pass dataset traffic rows through the original trained Milestone 2 ML pipeline
    (scaler.pkl -> random_forest.pkl -> attack_classifier.pkl -> RiskScoringService)
    to compute genuine predictions, confidence scores, attack categories, and risk scores.
    """
    _load_ml_artifacts()

    if _MODEL is None or _SCALER is None or _FEATURE_COLUMNS is None:
        return df

    # Build feature DataFrame matching _FEATURE_COLUMNS
    features_dict = {}
    for col in _FEATURE_COLUMNS:
        if col in df.columns:
            features_dict[col] = pd.to_numeric(df[col], errors='coerce').fillna(0.0)
        else:
            features_dict[col] = 0.0
    
    df_feat = pd.DataFrame(features_dict, index=df.index)[_FEATURE_COLUMNS]

    try:
        scaled_feat = _SCALER.transform(df_feat)
        binary_preds = _MODEL.predict(scaled_feat)
        binary_probs = _MODEL.predict_proba(scaled_feat)

        predictions = []
        confidences = []
        risk_scores = []
        severities = []

        from app.services.risk_scoring import RiskScoringService

        if _ATTACK_MODEL is not None:
            attack_preds = _ATTACK_MODEL.predict(scaled_feat)
            attack_probs = _ATTACK_MODEL.predict_proba(scaled_feat)
            classes = list(_ATTACK_MODEL.classes_)

            for i in range(len(df)):
                is_atk = (binary_preds[i] == 1) or (binary_probs[i][1] >= 0.5 if len(binary_probs[i]) > 1 else False)
                if is_atk:
                    atk_p = str(attack_preds[i])
                    if atk_p.lower() == "benign":
                        non_benign = [(cls, float(attack_probs[i][idx])) for idx, cls in enumerate(classes) if cls.lower() != "benign"]
                        if non_benign:
                            non_benign.sort(key=lambda x: x[1], reverse=True)
                            atk_type = non_benign[0][0]
                            conf = round(non_benign[0][1], 3)
                        else:
                            atk_type = "Attack"
                            conf = round(float(binary_probs[i][1]), 3)
                    else:
                        atk_type = atk_p
                        conf = round(float(np.max(attack_probs[i])), 3)
                else:
                    atk_type = "Benign"
                    conf = round(float(binary_probs[i][0]), 3)

                risk_info = RiskScoringService.calculate_risk(atk_type, conf)
                predictions.append(atk_type)
                confidences.append(conf)
                risk_scores.append(int(round(risk_info["risk_score"])))
                severities.append(risk_info["severity"])
        else:
            for i in range(len(df)):
                is_atk = (binary_preds[i] == 1)
                prob_b = float(binary_probs[i][0])
                prob_a = float(binary_probs[i][1]) if len(binary_probs[i]) > 1 else 1.0 - prob_b
                atk_type = "Attack" if is_atk else "Benign"
                conf = round(prob_a if is_atk else prob_b, 3)
                risk_info = RiskScoringService.calculate_risk(atk_type, conf)
                predictions.append(atk_type)
                confidences.append(conf)
                risk_scores.append(int(round(risk_info["risk_score"])))
                severities.append(risk_info["severity"])

        df['prediction'] = predictions
        df['confidence'] = confidences
        df['risk_score'] = risk_scores
        df['threat_level'] = severities
        df['severity'] = severities

    except Exception as exc:
        logger.warning(f"Error applying real ML predictions to dataset frame: {exc}")

    return df


_MODEL = None
_ATTACK_MODEL = None
_SCALER = None
_FEATURE_COLUMNS = None


def _load_ml_artifacts():
    global _MODEL, _ATTACK_MODEL, _SCALER, _FEATURE_COLUMNS
    if _MODEL is None or _SCALER is None or _FEATURE_COLUMNS is None:
        models_dir = _BACKEND_ROOT / "models"
        ml_dir = _BACKEND_ROOT / "ml"
        
        model_path = models_dir / "random_forest.pkl" if (models_dir / "random_forest.pkl").exists() else ml_dir / "random_forest.pkl"
        attack_model_path = models_dir / "attack_classifier.pkl" if (models_dir / "attack_classifier.pkl").exists() else ml_dir / "attack_classifier.pkl"
        scaler_path = models_dir / "scaler.pkl" if (models_dir / "scaler.pkl").exists() else ml_dir / "scaler.pkl"
        feature_cols_path = models_dir / "feature_columns.pkl" if (models_dir / "feature_columns.pkl").exists() else ml_dir / "feature_columns.pkl"
        
        if model_path.exists() and scaler_path.exists() and feature_cols_path.exists():
            import joblib
            _MODEL = joblib.load(model_path)
            _SCALER = joblib.load(scaler_path)
            _FEATURE_COLUMNS = joblib.load(feature_cols_path)
            if attack_model_path.exists():
                try:
                    _ATTACK_MODEL = joblib.load(attack_model_path)
                except Exception as e:
                    logger.warning(f"Could not load attack_classifier.pkl: {e}")
        else:
            logger.warning("ML artifacts not found in backend/models or backend/ml directory.")


def predict_network_traffic(packet_data: dict) -> dict:
    """
    Predict network traffic attack type, confidence, risk score, and severity level.

    Returns:
        dict: {
            "prediction": "Malware",
            "confidence": 0.987,
            "risk_score": 89,
            "severity": "Critical",
            "probability": 98.7,
            "risk": "Critical",
            "predicted_class": "Malware",
            "confidence_score": 0.987,
            "class_probabilities": {"Benign": 0.013, "Malware": 0.987},
            "risk_color": "Red"
        }
    """
    _load_ml_artifacts()

    if _MODEL is None or _SCALER is None or _FEATURE_COLUMNS is None:
        # Fallback default if ML model artifacts are not present
        return {
            "prediction": "Benign",
            "confidence": 1.0,
            "risk_score": 0,
            "severity": "Low",
            "probability": 0.0,
            "risk": "Low",
            "predicted_class": "Benign",
            "confidence_score": 1.0,
            "class_probabilities": {"Benign": 1.0},
            "risk_color": "Green"
        }

    # Prepare feature DataFrame matching model's feature_columns
    feature_dict = {col: packet_data.get(col, 0.0) for col in _FEATURE_COLUMNS}
    df_features = pd.DataFrame([feature_dict])[_FEATURE_COLUMNS].fillna(0.0)

    # Scale features
    scaled_features = _SCALER.transform(df_features)

    # Predict binary class and probabilities
    pred_class = int(_MODEL.predict(scaled_features)[0])
    probabilities = _MODEL.predict_proba(scaled_features)[0]

    prob_benign = float(probabilities[0])
    prob_attack = float(probabilities[1] if len(probabilities) > 1 else 1.0 - probabilities[0])
    prob_pct = round(prob_attack * 100.0, 1)

    is_attack = (pred_class == 1) or (prob_attack >= 0.5)
    
    # Determine Attack Type & Multi-class probabilities
    if is_attack:
        if _ATTACK_MODEL is not None:
            attack_pred = str(_ATTACK_MODEL.predict(scaled_features)[0])
            attack_probs = _ATTACK_MODEL.predict_proba(scaled_features)[0]
            classes = list(_ATTACK_MODEL.classes_)
            
            class_probs = {cls: round(float(p), 4) for cls, p in zip(classes, attack_probs)}
            
            if attack_pred.lower() == "benign":
                # Select top non-benign attack class
                non_benign = [(cls, float(p)) for cls, p in zip(classes, attack_probs) if cls.lower() != "benign"]
                if non_benign:
                    non_benign.sort(key=lambda x: x[1], reverse=True)
                    attack_type = non_benign[0][0]
                    confidence_val = round(non_benign[0][1], 3)
                else:
                    attack_type = "Attack"
                    confidence_val = round(prob_attack, 3)
            else:
                attack_type = attack_pred
                confidence_val = round(float(np.max(attack_probs)), 3)
        else:
            attack_type = "Attack"
            confidence_val = round(prob_attack, 3)
            class_probs = {"Benign": round(prob_benign, 4), "Attack": round(prob_attack, 4)}
    else:
        attack_type = "Benign"
        confidence_val = round(prob_benign, 3)
        class_probs = {"Benign": round(prob_benign, 4), "Attack": round(prob_attack, 4)}

    # Calculate Risk Score & Severity
    risk_data = RiskScoringService.calculate_risk(attack_type, confidence_val)
    int_risk_score = int(round(risk_data["risk_score"]))

    # Perform AI Threat Analysis
    analysis = ThreatAnalysisService.analyze_threat(
        attack_type=attack_type,
        confidence=confidence_val,
        risk_score=int_risk_score,
        severity=risk_data["severity"]
    )

    # Save prediction history in Threat Insights engine
    record_prediction(
        attack_type=attack_type,
        confidence=confidence_val,
        severity=risk_data["severity"],
        risk_score=int_risk_score
    )

    # Auto-generate alert when an attack is detected
    create_alert_from_prediction(
        {
            "attack_type": attack_type,
            "confidence": confidence_val,
            "risk_score": int_risk_score,
            "severity": risk_data["severity"],
        },
        packet_data
    )

    return {
        "attack_type": attack_type,
        "prediction": attack_type,
        "confidence": confidence_val,
        "risk_score": int_risk_score,
        "severity": risk_data["severity"],
        "description": analysis["description"],
        "impact": analysis["impact"],
        "recommendations": analysis["recommendations"],
        "probability": prob_pct,
        "risk": risk_data["severity"],
        "predicted_class": attack_type,
        "confidence_score": confidence_val,
        "class_probabilities": class_probs,
        "risk_color": risk_data["risk_color"]
    }


def _generate_prediction(label: Optional[str], threat_level: Optional[str]) -> str:
    """Generate prediction label based on traffic features/label."""
    if pd.isna(label) or label is None:
        if pd.isna(threat_level) or threat_level is None:
            return 'Unknown'
        threat_str = str(threat_level).strip().lower()
        return 'Attack' if threat_str in {'high', 'critical'} else 'Normal'
    
    label_str = str(label).strip().lower()
    if label_str in {'0', 'normal', 'benign'}:
        return 'Normal'
    if label_str in {'1', 'attack'}:
        return 'Attack'
    
    if any(keyword in label_str for keyword in ['ddos', 'dos', 'portscan', 'bot', 'exploit', 'worm', 'bruteforce', 'infiltration']):
        return 'Attack'
    if any(keyword in label_str for keyword in ['benign', 'normal']):
        return 'Normal'
    
    return 'Unknown'


def _assign_threat_level(label: Optional[str]) -> Optional[str]:
    if label is None or (isinstance(label, float) and pd.isna(label)):
        return None
    label_text = str(label).strip().lower()
    if label_text in {'0', 'normal', 'benign'}:
        return 'Low'
    if label_text in {'1', 'attack'}:
        return 'High'
    if any(keyword in label_text for keyword in ['ddos', 'dos', 'portscan', 'bot', 'exploit', 'worm', 'bruteforce', 'infiltration']):
        return 'High'
    if any(keyword in label_text for keyword in ['suspicious', 'unknown', 'anomaly']):
        return 'Medium'
    if any(keyword in label_text for keyword in ['benign', 'normal']):
        return 'Low'
    return 'Low'


def _detect_dataset_kind(file_path: Path) -> str:
    name = file_path.name.lower()
    if 'unsw-nb15' in name or 'unsw_nb15' in name:
        return 'unsw-nb15'
    if 'iscx' in name or 'cicids' in name:
        return 'cicids2017'
    return 'generic'


def _read_csv_file(dataset_file: Path) -> pd.DataFrame:
    """Read a CSV or XLSX dataset file from disk without row limits."""
    kind = _detect_dataset_kind(dataset_file)
    ext = dataset_file.suffix.lower()
    read_kwargs: Dict[str, Any] = {'low_memory': False} if ext == '.csv' else {}
    if kind == 'unsw-nb15':
        read_kwargs.update({'header': None, 'names': UNSW_NB15_COLUMNS})
    if ext in ('.xlsx', '.xls'):
        return pd.read_excel(dataset_file, **read_kwargs)
    return pd.read_csv(dataset_file, **read_kwargs)


def _generate_synthetic_ips_ports(
    df: pd.DataFrame,
    index: int,
    base_ip: str = '192.168.1.0'
) -> Tuple[str, int, str, int]:
    """
    Generate synthetic Source IP and Port for datasets that lack them (e.g., CICIDS2017).
    
    Uses row index and destination port to create deterministic but varied values.
    """
    # Extract destination port if available
    dst_port = 80  # Default HTTP
    if 'destination_port' in df.columns:
        try:
            val = df.iloc[index]['destination_port']
            if pd.notna(val):
                dst_port = int(val) if not pd.isna(pd.to_numeric(val, errors='coerce')) else 80
        except (ValueError, KeyError, IndexError):
            pass
    
    # Generate synthetic Source IP based on index
    # Use index to create variation: 192.168.(index // 256).(index % 256)
    octet_3 = (index // 256) % 256
    octet_4 = index % 256
    src_ip = f'192.168.{octet_3}.{octet_4}'
    
    # Generate synthetic Source Port: use hash of index + offset to avoid conflicts
    src_port = 49152 + (index % 16384)  # Ephemeral port range
    
    return src_ip, src_port, base_ip, dst_port


def _log_loaded_csv(filename: str, rows: int, columns: int, elapsed_s: float) -> None:
    logger.info(
        'Loaded CSV | filename=%s | rows=%d | columns=%d | elapsed=%.2fs',
        filename, rows, columns, elapsed_s,
    )


def _preprocess_dataset_frame(frame: pd.DataFrame) -> pd.DataFrame:
    cleaned = frame.copy()
    original_rows = len(cleaned)

    # ------------------------------------------------------------------ #
    # 1. Normalise blank strings → NA, then drop completely empty rows    #
    # ------------------------------------------------------------------ #
    cleaned = cleaned.replace(r'^\s*$', pd.NA, regex=True)
    rows_before_missing_cleanup = len(cleaned)
    cleaned = cleaned.dropna(how='all')
    missing_rows_removed = rows_before_missing_cleanup - len(cleaned)

    # ------------------------------------------------------------------ #
    # 2. Remove duplicate rows                                            #
    # ------------------------------------------------------------------ #
    cleaned = cleaned.drop_duplicates()
    duplicate_rows_removed = original_rows - len(cleaned) - missing_rows_removed

    # ------------------------------------------------------------------ #
    # 3. Trim whitespace + protocol normalisation (vectorized per-series) #
    # ------------------------------------------------------------------ #
    str_cols = [
        col for col in cleaned.columns
        if pd.api.types.is_object_dtype(cleaned[col])
        or pd.api.types.is_string_dtype(cleaned[col])
    ]
    if str_cols:
        str_block = cleaned[str_cols].astype('string')
        str_block = str_block.apply(lambda s: s.str.strip())
        str_block = str_block.replace(r'^\s*$', pd.NA, regex=True)

        proto_cols = [c for c in str_cols if any(kw in str(c).lower() for kw in ('protocol', 'proto'))]
        if proto_cols:
            str_block[proto_cols] = str_block[proto_cols].apply(lambda s: s.str.upper())

        cleaned[str_cols] = str_block

    # ------------------------------------------------------------------ #
    # 4. Convert numeric columns (vectorized across all string columns)   #
    # ------------------------------------------------------------------ #
    str_cols_now = [
        col for col in cleaned.columns
        if pd.api.types.is_object_dtype(cleaned[col])
        or pd.api.types.is_string_dtype(cleaned[col])
    ]
    if str_cols_now:
        threshold = max(1, int(0.8 * len(cleaned)))
        numeric_candidates = cleaned[str_cols_now].apply(
            lambda s: pd.to_numeric(s.astype(str).str.strip(), errors='coerce')
        )
        promote_mask = numeric_candidates.notna().sum() >= threshold
        for col in numeric_candidates.columns[promote_mask]:
            cleaned[col] = numeric_candidates[col]

    # ------------------------------------------------------------------ #
    # 5. Drop fully-empty columns (vectorized mask)                       #
    # ------------------------------------------------------------------ #
    is_all_na = cleaned.isna().all()
    empty_columns = cleaned.columns[is_all_na].tolist()
    if empty_columns:
        cleaned = cleaned.drop(columns=empty_columns)

    rows_after_cleaning = len(cleaned)

    # ------------------------------------------------------------------ #
    # 6. Report                                                           #
    # ------------------------------------------------------------------ #
    print(f'Original rows            : {original_rows}')
    print(f'Rows after cleaning      : {rows_after_cleaning}')
    print(f'Duplicate rows removed   : {duplicate_rows_removed}')
    print(f'Missing rows removed     : {missing_rows_removed}')

    logger.info(
        'Preprocessed dataset | original_rows=%d | rows_after_cleaning=%d | duplicate_rows_removed=%d | missing_rows_removed=%d',
        original_rows,
        rows_after_cleaning,
        duplicate_rows_removed,
        missing_rows_removed,
    )
    stats = {
        'original_rows': int(original_rows),
        'rows_after_cleaning': int(rows_after_cleaning),
        'duplicate_rows_removed': int(duplicate_rows_removed),
        'missing_rows_removed': int(missing_rows_removed),
    }
    return cleaned.reset_index(drop=True), stats


def process_dataset_frame(frame: pd.DataFrame) -> pd.DataFrame:
    """Run the full per-file preprocessing pipeline exactly once.

    Returns the processed DataFrame (backwards compatible).
    """
    cleaned, _ = _preprocess_dataset_frame(frame)
    processed = _map_to_common_schema(cleaned)
    return processed


def process_dataset_frame_with_stats(frame: pd.DataFrame) -> Tuple[pd.DataFrame, Dict[str, int]]:
    """Run preprocessing and also return per-file stats.

    Returns (processed_dataframe, stats_dict).
    """
    cleaned, stats = _preprocess_dataset_frame(frame)
    processed = _map_to_common_schema(cleaned)
    return processed, stats


def clean_dataset_display_name(filename: str) -> str:
    name = Path(filename).name.lower()
    if 'infilteration' in name or 'infiltration' in name:
        return 'CICIDS2017 - Infiltration'
    if 'webattacks' in name or 'web-attacks' in name:
        return 'CICIDS2017 - Web Attacks'
    if 'tuesday' in name:
        return 'CICIDS2017 - Tuesday'
    if 'wednesday' in name:
        return 'CICIDS2017 - Wednesday'
    if 'friday' in name:
        return 'CICIDS2017 - Friday'
    if 'monday' in name:
        return 'CICIDS2017 - Monday'
    if 'unsw-nb15_1' in name or 'unsw_nb15_1' in name:
        return 'UNSW-NB15 Part 1'
    if 'unsw-nb15_2' in name or 'unsw_nb15_2' in name:
        return 'UNSW-NB15 Part 2'
    if 'unsw-nb15_3' in name or 'unsw_nb15_3' in name:
        return 'UNSW-NB15 Part 3'
    if 'unsw-nb15_4' in name or 'unsw_nb15_4' in name:
        return 'UNSW-NB15 Part 4'

    clean = Path(filename).stem.replace('.pcap_ISCX', '').replace('_ISCX', '').replace('_', ' ')
    return clean


def _load_all_csv_files(data_directory: Path | None = None) -> Tuple[List[pd.DataFrame], List[Path], List[str]]:
    """
    Discover and read every CSV file under backend/data.

    Each file is loaded in full so that the complete dataset is available
    for analytics and paginated response generation.
    """
    csv_files = discover_csv_files(data_directory)

    frames: List[pd.DataFrame] = []
    loaded_files: List[Path] = []
    failed_files: List[str] = []

    for dataset_file in csv_files:
        t0 = time.perf_counter()
        try:
            frame = _read_csv_file(dataset_file)
            frame['dataset_name'] = clean_dataset_display_name(dataset_file.name)
            elapsed = time.perf_counter() - t0
            _log_loaded_csv(dataset_file.name, frame.shape[0], frame.shape[1], elapsed)
            frames.append(frame)
            loaded_files.append(dataset_file)
        except Exception:
            logger.exception('Failed to load dataset file %s', dataset_file.name)
            failed_files.append(dataset_file.name)
            logger.warning('Skipping unreadable dataset file: %s', dataset_file.name)

    if not frames:
        logger.warning('No readable dataset files found under %s', resolve_data_directory(data_directory))
    else:
        logger.info(
            'Dataset loading complete | loaded=%d | failed=%d',
            len(loaded_files),
            len(failed_files),
        )

    return frames, loaded_files, failed_files


def load_dataset_frames(data_directory: Path | None = None) -> Tuple[List[pd.DataFrame], List[Path], List[str]]:
    """
    Discover and load CSV files under backend/data without preprocessing.

    Each file is loaded in full so that the complete dataset is available
    for analytics and paginated response generation.
    """
    csv_files = discover_csv_files(data_directory)

    frames: List[pd.DataFrame] = []
    loaded_files: List[Path] = []
    failed_files: List[str] = []

    for dataset_file in csv_files:
        t0 = time.perf_counter()
        try:
            frame = _read_csv_file(dataset_file)
            elapsed = time.perf_counter() - t0
            _log_loaded_csv(dataset_file.name, frame.shape[0], frame.shape[1], elapsed)
            frames.append(frame)
            loaded_files.append(dataset_file)
        except Exception:
            logger.exception('Failed to load dataset file %s', dataset_file.name)
            failed_files.append(dataset_file.name)
            logger.warning('Skipping unreadable dataset file: %s', dataset_file.name)

    if not frames:
        logger.warning('No readable dataset files found under %s', resolve_data_directory(data_directory))
    else:
        logger.info(
            'Dataset loading complete | loaded=%d | failed=%d',
            len(loaded_files),
            len(failed_files),
        )

    return frames, loaded_files, failed_files


def _map_to_common_schema(frame: pd.DataFrame) -> pd.DataFrame:
    normalized = frame
    is_cicids2017 = any(' Destination Port' in col for col in normalized.columns)

    column_lookup = {
        'timestamp': ['timestamp', 'time', 'ts', 'date', 'datetime', 'event_time', 'stime', 'ltime'],
        'source_ip': ['source_ip', 'src_ip', 'srcip', 'sourceip', 'ip_src', 'src', 'ip.src'],
        'destination_ip': ['destination_ip', 'dst_ip', 'dstip', 'destinationip', 'ip_dst', 'dst', 'ip.dst'],
        'source_port': ['source_port', 'src_port', 'srcport', 'sport', 'sourceport'],
        'destination_port': ['destination_port', 'dst_port', 'dstport', 'dsport', 'dport', 'destinationport', ' destination port'],
        'protocol': ['protocol', 'proto', 'protocol_name', 'service'],
        'packet_size': [
            'packet_size', 'packetlength', 'packet_length', 'size',
            'average packet size', 'packet length mean', 'smeansz', 'dmeansz',
        ],
        'flow_duration': [
            'flow_duration', 'dur', 'flowduration', 'flow dur', 'flow_dur',
            'flow iat mean', 'flow iat std',
        ],
        'total_packets': [
            'total_packets', 'spkts', 'dpkts', 'tot_fwd_pkts',
            'total fwd packets', 'total_fwd_packets', 'total fwd packet',
            'total backward packets', 'packet count',
        ],
        'total_bytes': [
            'total_bytes', 'sbytes', 'dbytes', 'bytes',
            'total length of fwd packets', 'total_length_of_fwd_packets',
            'fwd header length', 'total length fwd packets',
        ],
        'traffic_label': ['traffic_label', 'label', 'attack', 'traffic', 'attack_label', 'label_', 'attack_cat'],
        'attack_category': ['attack_category', 'attack_cat', 'attacktype', 'attack_type', 'category', 'attack_cat'],
        'dataset_name': ['dataset_name', 'dataset', 'source_dataset', 'file_name'],
    }

    mapped = pd.DataFrame(index=normalized.index)
    
    # Map all common schema columns
    for target_column in COMMON_SCHEMA_COLUMNS:
        candidate_names = set(column_lookup.get(target_column, []))
        matched_column = None
        for column_name in normalized.columns:
            lowered = str(column_name).lower().strip()
            compacted = lowered.replace(' ', '').replace('_', '').replace('-', '')
            normalized_candidates = {name.replace(' ', '').replace('_', '').replace('-', '') for name in candidate_names}
            if lowered in candidate_names or compacted in normalized_candidates:
                matched_column = column_name
                break
        if matched_column is None:
            mapped[target_column] = pd.NA
            continue
        mapped[target_column] = normalized[matched_column]

    if 'dataset_name' in normalized.columns:
        mapped['dataset_name'] = normalized['dataset_name']

    # ========================================================================
    # Handle missing Source IP/Port for CICIDS2017 with synthetic fallbacks
    # (fully vectorized — no Python row loop)
    # ========================================================================
    src_ip_col = mapped['source_ip'].astype('string') if 'source_ip' in mapped.columns else pd.Series(pd.NA, index=mapped.index, dtype='string')
    src_port_col = mapped['source_port'] if 'source_port' in mapped.columns else pd.Series(pd.NA, index=mapped.index)

    if is_cicids2017 or src_ip_col.isna().any():
        missing_src = src_ip_col.isna() | (src_ip_col == '')
        if missing_src.any():
            idx_array = np.arange(len(mapped))
            octet3 = (idx_array // 256) % 256
            octet4 = idx_array % 256
            synth_ips = pd.array(
                [f'192.168.{o3}.{o4}' for o3, o4 in zip(octet3, octet4)],
                dtype='string',
            )
            synth_ports = (49152 + (idx_array % 16384)).astype(float)
            mapped['source_ip'] = src_ip_col.where(~missing_src, pd.array(synth_ips, dtype='string'))
            missing_port = src_port_col.isna() | (src_port_col.astype('string') == '')
            mapped['source_port'] = src_port_col.where(~(missing_src & missing_port), synth_ports)

    # ========================================================================
    # Handle missing Destination IP (vectorized)
    # ========================================================================
    dst_ip_col = mapped['destination_ip'].astype('string') if 'destination_ip' in mapped.columns else pd.Series(pd.NA, index=mapped.index, dtype='string')
    if is_cicids2017 or dst_ip_col.isna().any():
        missing_dst = dst_ip_col.isna() | (dst_ip_col == '')
        if missing_dst.any():
            mapped['destination_ip'] = dst_ip_col.where(~missing_dst, '10.0.0.1')

    # ========================================================================
    # Handle missing Protocol (vectorized using np.select)
    # ========================================================================
    mapped = mapped.copy()  # Avoid SettingWithCopyWarning
    proto_col = mapped['protocol'].astype('string') if 'protocol' in mapped.columns else pd.Series(pd.NA, index=mapped.index, dtype='string')
    missing_proto = proto_col.isna() | (proto_col == '')
    if missing_proto.any():
        dst_port_num = pd.to_numeric(mapped.get('destination_port', pd.Series(dtype='float64')), errors='coerce')
        conditions = [
            dst_port_num == 53,
            dst_port_num.isin([80, 8080]),
            dst_port_num == 443,
            dst_port_num == 22,
            dst_port_num == 21,
            dst_port_num.notna(),
        ]
        choices = ['DNS', 'HTTP', 'HTTPS', 'SSH', 'FTP', 'TCP']
        inferred = pd.array(
            np.select(conditions, choices, default='UNKNOWN'),
            dtype='string',
        )
        mapped['protocol'] = proto_col.where(~missing_proto, inferred)

    # ========================================================================
    # Handle missing Timestamp (vectorized)
    # ========================================================================
    ts_col = mapped['timestamp'] if 'timestamp' in mapped.columns else pd.Series(pd.NA, index=mapped.index)
    ts_str = ts_col.astype('string')
    missing_ts = ts_str.isna() | (ts_str.str.strip() == '') | (ts_str == '<NA>')
    if missing_ts.any():
        base_timestamp = 1_000_000_000
        flow_dur = pd.to_numeric(
            mapped.get('flow_duration', pd.Series(0, index=mapped.index)),
            errors='coerce',
        ).fillna(0).astype(int)
        idx_offsets = np.arange(len(mapped))
        synth_ts = (base_timestamp + idx_offsets + flow_dur.values).astype(str)
        mapped['timestamp'] = ts_col.astype('string').where(
            ~missing_ts,
            pd.array(synth_ts, dtype='string'),
        )

    # ========================================================================
    # Normalize string columns
    # ========================================================================
    for column in ['timestamp', 'dataset_name', 'source_ip', 'destination_ip', 'protocol', 'traffic_label', 'attack_category']:
        if column in mapped.columns:
            mapped[column] = mapped[column].astype('string').str.strip()
            mapped[column] = mapped[column].replace(r'^\s*$', pd.NA, regex=True)

    if 'protocol' in mapped.columns:
        mapped['protocol'] = mapped['protocol'].apply(_standardize_protocol)

    # ========================================================================
    # Convert numeric columns
    # ========================================================================
    for numeric_column in ['packet_size', 'source_port', 'destination_port', 'flow_duration', 'total_packets', 'total_bytes']:
        if numeric_column in mapped.columns:
            mapped[numeric_column] = pd.to_numeric(mapped[numeric_column], errors='coerce')

    # ========================================================================
    # Compute Threat Level
    # ========================================================================
    if 'traffic_label' in mapped.columns:
        mapped['threat_level'] = mapped['traffic_label'].apply(_assign_threat_level)
    else:
        mapped['threat_level'] = pd.NA

    # ========================================================================
    # Pass dataset rows through real trained ML models (scaler + random_forest + attack_classifier)
    # ========================================================================
    mapped = _apply_real_ml_predictions(mapped)

    if 'attack_category' in mapped.columns:
        mapped['attack_category'] = mapped['attack_category'].astype('string').str.strip()
        mapped['attack_category'] = mapped['attack_category'].replace(r'^\s*$', pd.NA, regex=True)

    return mapped.reset_index(drop=True)


def combine_dataset_frames(frames: List[pd.DataFrame]) -> pd.DataFrame:
    """
    Combine already-processed frames without running preprocessing again.

    If the merged result exceeds _MAX_COMBINED_ROWS the DataFrame is
    downsampled with a fixed random seed so results remain deterministic
    across restarts.
    """
    if not frames:
        return pd.DataFrame(columns=COMMON_SCHEMA_COLUMNS)

    combined = pd.concat(frames, ignore_index=True, copy=False)

    dedupe_columns = [
        column for column in ['source_ip', 'destination_ip', 'protocol', 'packet_size', 'traffic_label']
        if column in combined.columns
    ]
    if dedupe_columns:
        before = len(combined)
        combined = combined.drop_duplicates(subset=dedupe_columns).reset_index(drop=True)
        logger.info('Removed %d duplicate rows during combine', before - len(combined))

    return combined


def _distribution_from_series(
    series: pd.Series,
    name_key: str = 'name',
    count_key: str = 'count',
) -> List[Dict[str, Any]]:
    """Return value-count distribution as a list of dicts — no Python loops."""
    import json
    if series.empty:
        return []
    cleaned = series.astype('string').str.strip()
    cleaned = cleaned[cleaned.notna() & (cleaned != '')]
    if cleaned.empty:
        return []
    vc = cleaned.value_counts().rename_axis(name_key).reset_index(name=count_key)
    vc[count_key] = vc[count_key].astype(int)
    return json.loads(vc.to_json(orient='records'))


def _top_ips(series: pd.Series, limit: int = 10) -> List[Dict[str, Any]]:
    """Return the top-N IP addresses by frequency — no Python loops."""
    import json
    cleaned = series.astype('string').str.strip()
    cleaned = cleaned[cleaned.notna() & (cleaned != '') & (cleaned != '<NA>')]
    if cleaned.empty:
        return []
    vc = cleaned.value_counts().head(limit).rename_axis('ip').reset_index(name='count')
    vc['count'] = vc['count'].astype(int)
    return json.loads(vc.to_json(orient='records'))


# Ordered bucket labels used for packet-size binning.
_PACKET_BUCKETS = ['0-250', '251-500', '501-1000', '1001-1500', '1501+']
_PACKET_BINS   = [0, 250, 500, 1000, 1500, float('inf')]


def _packet_size_distribution(values: pd.Series) -> List[Dict[str, Any]]:
    """Bin packet sizes with pd.cut — fully vectorized, no Python row loop."""
    import json
    numeric = pd.to_numeric(values, errors='coerce').dropna()
    if numeric.empty:
        return [{'bucket': b, 'count': 0} for b in _PACKET_BUCKETS]
    binned = pd.cut(
        numeric,
        bins=_PACKET_BINS,
        labels=_PACKET_BUCKETS,
        right=True,
        include_lowest=True,
    )
    # reindex ensures all buckets appear even when count is 0.
    vc = binned.value_counts().reindex(_PACKET_BUCKETS, fill_value=0)
    df = vc.rename_axis('bucket').reset_index(name='count')
    df['count'] = df['count'].astype(int)
    return json.loads(df.to_json(orient='records'))


def compute_analytics(combined: pd.DataFrame, loaded_files: List[Path] = None) -> Dict[str, Any]:
    """Compute analytics once from the cached processed DataFrame across all 12 datasets and live alerts."""
    if combined is None or combined.empty:
        return dict(EMPTY_ANALYTICS)

    from app.services.live_packet_capture import live_capture_service
    live_alerts = live_capture_service.get_recent_live_alerts()
    live_alerts_count = len(live_alerts)

    threat_levels = combined['threat_level'].astype('string').str.strip().str.lower() if 'threat_level' in combined.columns else pd.Series(dtype='string')
    packet_sizes = pd.to_numeric(combined['packet_size'], errors='coerce') if 'packet_size' in combined.columns else pd.Series(dtype='float64')
    source_ips = combined['source_ip'] if 'source_ip' in combined.columns else pd.Series(dtype='string')
    destination_ips = combined['destination_ip'] if 'destination_ip' in combined.columns else pd.Series(dtype='string')
    protocols = combined['protocol'] if 'protocol' in combined.columns else pd.Series(dtype='string')
    traffic_labels = combined['traffic_label'] if 'traffic_label' in combined.columns else pd.Series(dtype='string')
    risk_scores = pd.to_numeric(combined['risk_score'], errors='coerce') if 'risk_score' in combined.columns else pd.Series(dtype='float64')
    confidences = pd.to_numeric(combined['confidence'], errors='coerce') if 'confidence' in combined.columns else pd.Series(dtype='float64')

    valid_packet_sizes = packet_sizes.dropna()
    valid_risk_scores = risk_scores.dropna()
    valid_confidences = confidences.dropna()

    is_attack = threat_levels.isin(['critical', 'high', 'medium'])
    total_traffic = int(len(combined))
    dataset_alerts_count = int(is_attack.sum())
    total_alerts = dataset_alerts_count + live_alerts_count
    normal_traffic = total_traffic - dataset_alerts_count

    # Compute Alerts by Dataset across all 12 datasets + LIVE NETWORK
    all_dataset_names = []
    if loaded_files:
        for f in loaded_files:
            all_dataset_names.append(clean_dataset_display_name(f.name))

    if 'dataset_name' in combined.columns:
        for ds in combined['dataset_name'].dropna().unique():
            ds_str = str(ds)
            if ds_str not in all_dataset_names:
                all_dataset_names.append(ds_str)

    alerts_by_dataset = []
    for ds_name in sorted(all_dataset_names):
        ds_total = int((combined['dataset_name'] == ds_name).sum()) if 'dataset_name' in combined.columns else 0
        ds_alerts = int(((combined['dataset_name'] == ds_name) & is_attack).sum()) if 'dataset_name' in combined.columns else 0
        alerts_by_dataset.append({
            'dataset_name': ds_name,
            'alert_count': ds_alerts,
            'total_records': ds_total,
        })

    alerts_by_dataset.append({
        'dataset_name': 'LIVE NETWORK',
        'alert_count': live_alerts_count,
        'total_records': live_alerts_count,
    })

    alerts_by_source = [
        {'source': 'Dataset', 'count': dataset_alerts_count},
        {'source': 'Live Network', 'count': live_alerts_count},
    ]

    attack_labels = traffic_labels[is_attack] if not traffic_labels.empty else pd.Series(dtype='string')

    return {
        'total_traffic': total_traffic,
        'normal_traffic': normal_traffic,
        'attack_traffic': dataset_alerts_count,
        'dataset_alerts_count': dataset_alerts_count,
        'live_alerts_count': live_alerts_count,
        'total_alerts': total_alerts,
        'high_threat_alerts': int(threat_levels.isin(['critical', 'high']).sum()),
        'unique_source_ips': int(source_ips.astype('string').str.strip().replace('', pd.NA).dropna().nunique()),
        'unique_destination_ips': int(destination_ips.astype('string').str.strip().replace('', pd.NA).dropna().nunique()),
        'protocol_distribution': _distribution_from_series(protocols.str.upper() if not protocols.empty else protocols),
        'threat_level_distribution': _distribution_from_series(threat_levels),
        'traffic_label_distribution': _distribution_from_series(attack_labels if not attack_labels.empty else traffic_labels),
        'alerts_by_dataset': alerts_by_dataset,
        'alerts_by_source': alerts_by_source,
        'avg_risk_score': round(float(valid_risk_scores.mean()), 1) if not valid_risk_scores.empty else 0.0,
        'avg_confidence': round(float(valid_confidences.mean()), 3) if not valid_confidences.empty else 0.85,
        'top_10_source_ips': _top_ips(source_ips),
        'top_10_destination_ips': _top_ips(destination_ips),
        'packet_size_distribution': _packet_size_distribution(packet_sizes),
        'average_packet_size': round(float(valid_packet_sizes.mean()), 2) if not valid_packet_sizes.empty else 0,
        'minimum_packet_size': float(valid_packet_sizes.min()) if not valid_packet_sizes.empty else 0,
        'maximum_packet_size': float(valid_packet_sizes.max()) if not valid_packet_sizes.empty else 0,
    }


def _build_dataset_cache(data_directory: Path | None = None) -> Dict[str, Any]:
    wall_start = time.perf_counter()
    logger.info('=== [STARTUP] Beginning dataset cache build ===')

    # ── Phase 1: CSV discovery + loading ──────────────────────────────────────
    load_start = time.perf_counter()
    frames, loaded_files, failed_files = load_dataset_frames(data_directory)
    load_elapsed = time.perf_counter() - load_start
    logger.info(
        '[STARTUP] CSV loading complete | files_loaded=%d | files_failed=%d | elapsed=%.2fs',
        len(loaded_files), len(failed_files), load_elapsed,
    )

    if not frames:
        logger.warning('[STARTUP] No readable dataset files found during cache build')
        combined = pd.DataFrame(columns=COMMON_SCHEMA_COLUMNS)
        summary = {
            'datasets_loaded': 0,
            'rows_loaded': 0,
            'rows_after_preprocessing': 0,
            'duplicates_removed': 0,
            'missing_values_removed': 0,
            'protocols_detected': [],
            'threat_levels': [],
            'traffic_labels': [],
            'startup_time_seconds': round(time.perf_counter() - wall_start, 3),
            'memory_usage_mb': 0.0,
            'files_failed': failed_files,
        }
        return {
            'status': 'ready',
            'combined': combined,
            'analytics': dict(EMPTY_ANALYTICS),
            'summary': summary,
            'error': None,
            'files_loaded': [path.name for path in loaded_files],
            'files_failed': failed_files,
        }

    # ── Phase 2: Per-file preprocessing ───────────────────────────────────────
    preprocess_start = time.perf_counter()
    processed_results = [process_dataset_frame_with_stats(frame) for frame in frames]
    processed_frames = [res[0] for res in processed_results]
    per_file_stats = [res[1] for res in processed_results]
    logger.info(
        '[STARTUP] Preprocessing complete | files=%d | elapsed=%.2fs',
        len(processed_frames), time.perf_counter() - preprocess_start,
    )

    # ── Phase 3: Combine ───────────────────────────────────────────────────────
    combine_start = time.perf_counter()
    combined = combine_dataset_frames(processed_frames)
    logger.info(
        '[STARTUP] Combine complete | total_rows=%d | elapsed=%.2fs',
        len(combined), time.perf_counter() - combine_start,
    )

    # ── Phase 4: Analytics ─────────────────────────────────────────────────────
    analytics_start = time.perf_counter()
    analytics = compute_analytics(combined, loaded_files=loaded_files)
    logger.info(
        '[STARTUP] Analytics computed | elapsed=%.2fs',
        time.perf_counter() - analytics_start,
    )

    total_elapsed = time.perf_counter() - wall_start
    memory_mb = round(combined.memory_usage(deep=True).sum() / (1024 * 1024), 3)

    # Aggregate per-file statistics for summary
    total_original_rows = sum(s.get('original_rows', 0) for s in per_file_stats)
    total_after_rows = sum(s.get('rows_after_cleaning', 0) for s in per_file_stats)
    total_duplicates = sum(s.get('duplicate_rows_removed', 0) for s in per_file_stats)
    total_missing = sum(s.get('missing_rows_removed', 0) for s in per_file_stats)

    files_summary = []
    for path, stats in zip(loaded_files, per_file_stats):
        files_summary.append({
            'filename': path.name,
            'dataset_name': clean_dataset_display_name(path.name),
            'rows_original': int(stats.get('original_rows', 0)),
            'rows_after': int(stats.get('rows_after_cleaning', 0)),
            'duplicates_removed': int(stats.get('duplicate_rows_removed', 0)),
            'missing_rows_removed': int(stats.get('missing_rows_removed', 0)),
        })

    summary = {
        'datasets_loaded': len(loaded_files),
        'rows_loaded': int(total_original_rows),
        'rows_after_preprocessing': int(total_after_rows),
        'duplicates_removed': int(total_duplicates),
        'missing_values_removed': int(total_missing),
        'rows_per_dataset': files_summary,
        'protocols_detected': sorted(
            v for v in combined['protocol'].astype('string').dropna().unique()
            if v.strip()
        ),
        'threat_levels': sorted(
            v for v in combined['threat_level'].astype('string').dropna().unique()
            if v.strip()
        ),
        'traffic_labels': sorted(
            v for v in combined['traffic_label'].astype('string').dropna().unique()
            if v.strip()
        ),
        'startup_time_seconds': round(total_elapsed, 3),
        'memory_usage_mb': memory_mb,
        'files_failed': failed_files,
    }

    # ── Summary banner ─────────────────────────────────────────────────────────
    logger.info('=== [STARTUP] Dataset cache build complete ===')
    logger.info('[STARTUP] CSV files loaded : %d', len(loaded_files))
    logger.info('[STARTUP] CSV files failed : %d', len(failed_files))
    logger.info('[STARTUP] Rows in cache    : %d', summary['rows_loaded'])
    logger.info('[STARTUP] Memory usage     : %.2f MB', memory_mb)
    logger.info('[STARTUP] Protocols found  : %s',
                ', '.join(summary['protocols_detected']) or 'None')
    logger.info('[STARTUP] Traffic labels   : %s',
                ', '.join(summary['traffic_labels'][:20]) or 'None')
    logger.info('[STARTUP] Total wall time  : %.2fs', total_elapsed)

    return {
        'status': 'ready',
        'combined': combined,
        'analytics': analytics,
        'summary': summary,
        'error': None,
        'files_loaded': [path.name for path in loaded_files],
        'files_failed': failed_files,
    }


async def _load_dataset_cache_async(data_directory: Path | None = None) -> None:
    _DATASET_READY_EVENT.clear()
    with _CACHE_LOCK:
        _CACHE_STATE['status'] = 'loading'
        _CACHE_STATE['error'] = None
        _CACHE_STATE['background_task'] = asyncio.current_task()
    logger.info('Starting background dataset preparation')
    await log_system_event("INFO", "Dataset Loader", "Dataset Loading Started")

    try:
        built_state = await asyncio.to_thread(_build_dataset_cache, data_directory)
        with _CACHE_LOCK:
            _CACHE_STATE.update(built_state)
            _CACHE_STATE['status'] = built_state.get('status', 'ready')
            _CACHE_STATE['background_task'] = None
        logger.info(
            'Dataset cache ready | rows=%s | startup_time=%ss',
            built_state['summary'].get('rows_loaded'),
            built_state['summary'].get('startup_time_seconds'),
        )
        await log_system_event("SUCCESS", "Dataset Loader", f"Dataset Loaded Successfully ({built_state['summary'].get('rows_loaded')} rows)")
    except Exception as exc:
        logger.exception('Background dataset preparation failed')
        await log_system_event("ERROR", "Dataset Loader", "Dataset Load Failed", exception=str(exc))
        with _CACHE_LOCK:
            _CACHE_STATE['status'] = 'failed'
            _CACHE_STATE['error'] = str(exc)
            _CACHE_STATE['combined'] = pd.DataFrame(columns=COMMON_SCHEMA_COLUMNS)
            _CACHE_STATE['analytics'] = dict(EMPTY_ANALYTICS)
            _CACHE_STATE['summary'] = {}
            _CACHE_STATE['background_task'] = None
    finally:
        _DATASET_READY_EVENT.set()


def reset_network_dataset_cache() -> None:
    global _CACHE_STATE
    with _CACHE_LOCK:
        _CACHE_STATE = {
            'status': 'idle',
            'combined': None,
            'analytics': None,
            'summary': {},
            'error': None,
            'background_task': None,
            'files_loaded': [],
            'files_failed': [],
        }


def get_cached_dataset_state() -> Dict[str, Any]:
    with _CACHE_LOCK:
        return dict(_CACHE_STATE)


def get_dataset_status() -> str:
    with _CACHE_LOCK:
        return str(_CACHE_STATE.get('status', 'idle'))


def get_processed_dataframe() -> pd.DataFrame:
    with _CACHE_LOCK:
        combined = _CACHE_STATE.get('combined')
        if combined is None:
            return pd.DataFrame(columns=COMMON_SCHEMA_COLUMNS)
        return combined


def get_cached_analytics() -> Dict[str, Any]:
    with _CACHE_LOCK:
        analytics = _CACHE_STATE.get('analytics')
        if analytics is None:
            return dict(EMPTY_ANALYTICS)
        return analytics


async def ensure_dataset_loaded_async(data_directory: Path | None = None) -> str:
    with _CACHE_LOCK:
        status = str(_CACHE_STATE.get('status', 'idle'))

    if status == 'idle':
        with _CACHE_LOCK:
            current = str(_CACHE_STATE.get('status', 'idle'))
            if current == 'idle':
                _CACHE_STATE['status'] = 'loading'
                _CACHE_STATE['error'] = None
        asyncio.create_task(_load_dataset_cache_async(data_directory))
        status = 'loading'

    if status == 'loading':
        try:
            await asyncio.wait_for(_DATASET_READY_EVENT.wait(), timeout=600.0)
        except asyncio.TimeoutError:
            logger.warning('ensure_dataset_loaded_async: timed out waiting for dataset load')
        with _CACHE_LOCK:
            status = str(_CACHE_STATE.get('status', 'failed'))

    return status


def ensure_dataset_loaded(data_directory: Path | None = None) -> str:
    with _CACHE_LOCK:
        status = _CACHE_STATE.get('status', 'idle')
        if status in ('ready', 'failed', 'loading'):
            return status
        _CACHE_STATE['status'] = 'loading'
        _CACHE_STATE['error'] = None

    try:
        built_state = _build_dataset_cache(data_directory)
        with _CACHE_LOCK:
            _CACHE_STATE.update(built_state)
            _CACHE_STATE['status'] = built_state.get('status', 'ready')
        return str(_CACHE_STATE.get('status', 'ready'))
    except Exception as exc:
        logger.exception('Dataset loading failed')
        with _CACHE_LOCK:
            _CACHE_STATE['status'] = 'failed'
            _CACHE_STATE['error'] = str(exc)
            _CACHE_STATE['combined'] = pd.DataFrame(columns=COMMON_SCHEMA_COLUMNS)
            _CACHE_STATE['analytics'] = dict(EMPTY_ANALYTICS)
            _CACHE_STATE['summary'] = {}
        return 'failed'


def initialize_network_dataset_cache(data_directory: Path | None = None) -> Dict[str, Any]:
    ensure_dataset_loaded(data_directory)
    return get_cached_dataset_state()


def _apply_traffic_filters(
    frame: pd.DataFrame,
    search: str = '',
    protocol: str = '',
    threat_level: str = '',
    dataset_name: str = '',
    alerts_only: bool = True,
) -> pd.DataFrame:
    filtered = frame
    query = search.strip().lower()
    protocol_filter = protocol.strip().lower()
    threat_filter = threat_level.strip().lower()
    dataset_filter = dataset_name.strip().lower()

    if alerts_only:
        # Exclude benign / normal records for the Security Alerts Feed
        if 'prediction' in filtered.columns:
            pred_mask = ~filtered['prediction'].astype('string').str.lower().isin(['normal', 'benign', 'safe', '0'])
        else:
            pred_mask = pd.Series(True, index=filtered.index)

        if 'traffic_label' in filtered.columns:
            label_mask = ~filtered['traffic_label'].astype('string').str.lower().isin(['benign', 'normal', '0', 'none', 'nan', ''])
        else:
            label_mask = pd.Series(True, index=filtered.index)

        filtered = filtered[pred_mask & label_mask]

    if query:
        mask = pd.Series(False, index=filtered.index)
        for column in ['source_ip', 'destination_ip', 'protocol', 'traffic_label', 'threat_level', 'dataset_name']:
            if column in filtered.columns:
                mask |= filtered[column].astype('string').str.lower().str.contains(query, na=False, regex=False)
        filtered = filtered[mask]

    if protocol_filter and 'protocol' in filtered.columns:
        filtered = filtered[filtered['protocol'].astype('string').str.lower().str.contains(protocol_filter, na=False, regex=False)]

    if threat_filter and 'threat_level' in filtered.columns:
        filtered = filtered[filtered['threat_level'].astype('string').str.lower().str.contains(threat_filter, na=False, regex=False)]

    if dataset_filter and 'dataset_name' in filtered.columns:
        filtered = filtered[filtered['dataset_name'].astype('string').str.lower().str.contains(dataset_filter, na=False, regex=False)]

    return filtered


async def query_traffic_page(
    page: int = 1,
    limit: int = 100,
    search: str = '',
    protocol: str = '',
    threat_level: str = '',
    dataset_name: str = '',
    source_type: str = 'all',
    alerts_only: bool = True,
) -> Tuple[List[Dict[str, Any]], int, int, str]:
    st_lower = str(source_type).strip().lower()

    if st_lower in ('live', 'livenetwork', 'live network'):
        status = get_dataset_status()
    else:
        status = await ensure_dataset_loaded_async()

    if status == 'failed':
        return [], 0, 0, status

    frame = get_processed_dataframe()
    total_ingested = int(len(frame))

    from app.services.live_packet_capture import live_capture_service
    live_alerts = live_capture_service.get_recent_live_alerts()

    dataset_records = []

    if st_lower in ('all', 'dataset') and not frame.empty:
        filtered = _apply_traffic_filters(
            frame,
            search=search,
            protocol=protocol,
            threat_level=threat_level,
            dataset_name=dataset_name,
            alerts_only=alerts_only,
        )
        available_cols = [c for c in CORE_OUTPUT_COLUMNS if c in filtered.columns]
        dataset_records = json.loads(filtered[available_cols].to_json(orient='records', date_format='iso'))
        for r in dataset_records:
            r['source'] = 'Dataset'
            r['is_live'] = False

    filtered_live = []
    if st_lower in ('all', 'live', 'livenetwork', 'live network'):
        mongo_live_alerts = []
        try:
            from app.database.database import db_connection
            if db_connection.database is not None:
                cursor = db_connection.database["alerts"].find({
                    "$or": [
                        {"source": "Live Network"},
                        {"dataset": "LIVE NETWORK"},
                        {"dataset_name": "LIVE NETWORK"}
                    ]
                }).sort("timestamp", -1).limit(500)
                async for doc in cursor:
                    item = dict(doc)
                    if "_id" in item:
                        item["id"] = str(item.pop("_id"))
                    item["source"] = "Live Network"
                    item["dataset"] = "LIVE NETWORK"
                    item["dataset_name"] = "LIVE NETWORK"
                    item["is_live"] = True
                    mongo_live_alerts.append(item)
        except Exception as exc:
            logger.debug(f"MongoDB live alerts fetch skipped: {exc}")

        all_live_sources = live_alerts + mongo_live_alerts
        seen_ids = set()
        unique_live = []
        for item in all_live_sources:
            aid = item.get("alert_id") or item.get("id")
            if aid and aid in seen_ids:
                continue
            if aid:
                seen_ids.add(aid)
            unique_live.append(item)

        q = search.strip().lower()
        p_filt = protocol.strip().lower()
        t_filt = threat_level.strip().lower()
        d_filt = dataset_name.strip().lower()

        for l_item in unique_live:
            if d_filt and d_filt not in ('live', 'live network', 'livenetwork') and d_filt not in str(l_item.get('dataset_name', '')).lower():
                continue
            if p_filt and p_filt not in str(l_item.get('protocol', '')).lower():
                continue
            if t_filt and t_filt not in str(l_item.get('threat_level', '')).lower() and t_filt not in str(l_item.get('severity', '')).lower():
                continue
            if q:
                match = any(
                    q in str(l_item.get(col, '')).lower()
                    for col in ('source_ip', 'destination_ip', 'protocol', 'traffic_label', 'threat_level', 'dataset_name', 'source')
                )
                if not match:
                    continue
            filtered_live.append(l_item)

    if st_lower in ('live', 'livenetwork', 'live network'):
        combined_records = filtered_live
    elif st_lower == 'dataset':
        combined_records = dataset_records
    else:
        combined_records = filtered_live + dataset_records

    total_filtered = len(combined_records)
    start = (page - 1) * limit
    end = start + limit
    page_records = combined_records[start:end]

    return page_records, total_filtered, total_ingested, status

