from datetime import datetime, timezone
import logging
from typing import Dict, Any, List, Optional

logger = logging.getLogger(__name__)

# In-memory store for real-time prediction history
_PREDICTION_HISTORY: List[Dict[str, Any]] = []
_MAX_HISTORY_SIZE = 5000


import asyncio
from app.database.database import db_connection


def record_prediction(
    attack_type: str,
    confidence: float,
    severity: str,
    risk_score: int,
    timestamp: Optional[str] = None,
    extra: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Save a new prediction record into history and persist in MongoDB.

    Args:
        attack_type (str): Name of predicted attack class (e.g. 'DoS', 'DDoS', 'Malware', 'Benign').
        confidence (float): Model confidence score.
        severity (str): Severity level ('Safe', 'Low', 'Medium', 'High', 'Critical').
        risk_score (int): Risk score (0-100).
        timestamp (str, optional): ISO timestamp string. Auto-generated if omitted.
        extra (dict, optional): Additional metadata.

    Returns:
        dict: The recorded history entry.
    """
    if not timestamp:
        timestamp = datetime.now(timezone.utc).isoformat()

    entry = {
        "timestamp": timestamp,
        "attack_type": attack_type,
        "confidence": round(float(confidence), 4),
        "severity": severity,
        "risk_score": int(round(risk_score)),
    }
    if extra:
        entry.update(extra)

    _PREDICTION_HISTORY.append(entry)

    if len(_PREDICTION_HISTORY) > _MAX_HISTORY_SIZE:
        _PREDICTION_HISTORY.pop(0)

    # Asynchronously persist prediction history to MongoDB collection
    try:
        if db_connection.database is not None:
            loop = asyncio.get_event_loop()
            if loop.is_running():
                doc = dict(entry)
                loop.create_task(db_connection.database["predictions"].insert_one(doc))
    except Exception as e:
        logger.debug(f"MongoDB async prediction recording note: {e}")

    return entry


def get_prediction_history(limit: int = 100) -> List[Dict[str, Any]]:
    """Return the list of recent prediction history entries (most recent first)."""
    return list(reversed(_PREDICTION_HISTORY[-limit:]))


def get_threat_insights() -> Dict[str, Any]:
    """
    Generate dashboard statistics from prediction history.

    Returns:
        dict: {
            "total_predictions": 150,
            "total_threats": 35,
            "benign_traffic": 115,
            "critical_threats": 10,
            "high_threats": 15,
            "medium_threats": 10,
            "low_threats": 115,
            "attack_distribution": {
                "Benign": 115,
                "DDoS": 10,
                "DoS": 15,
                "PortScan": 10
            }
        }
    """
    total_predictions = len(_PREDICTION_HISTORY)

    benign_count = 0
    total_threats = 0
    critical_count = 0
    high_count = 0
    medium_count = 0
    low_count = 0

    attack_dist: Dict[str, int] = {}

    for entry in _PREDICTION_HISTORY:
        atk = entry.get("attack_type", "Benign")
        sev = entry.get("severity", "Low")

        attack_dist[atk] = attack_dist.get(atk, 0) + 1

        if str(atk).lower() in ("benign", "normal"):
            benign_count += 1
        else:
            total_threats += 1

        if sev == "Critical":
            critical_count += 1
        elif sev == "High":
            high_count += 1
        elif sev == "Medium":
            medium_count += 1
        elif sev == "Low":
            low_count += 1

    total = max(total_predictions, 1)
    attack_dist_pct = {
        atk: {
            "count": cnt,
            "percentage": round((cnt / total) * 100.0, 2)
        }
        for atk, cnt in attack_dist.items()
    }

    return {
        "total_predictions": total_predictions,
        "total_threats": total_threats,
        "benign_traffic": benign_count,
        "critical_threats": critical_count,
        "high_threats": high_count,
        "medium_threats": medium_count,
        "low_threats": low_count,
        "attack_distribution": attack_dist,
        "attack_distribution_detailed": attack_dist_pct
    }
