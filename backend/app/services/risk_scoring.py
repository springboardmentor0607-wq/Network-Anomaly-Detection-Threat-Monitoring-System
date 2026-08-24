import logging
from typing import Dict, Any, Union

logger = logging.getLogger(__name__)

# Base Risk Configurations per Attack Class
# Format: (min_score, max_score, default_severity, default_color)
ATTACK_RISK_MAP: Dict[str, Dict[str, Any]] = {
    "benign": {
        "min_score": 0.0,
        "max_score": 20.0,
        "base_severity": "Low",
        "color": "Green"
    },
    "normal": {
        "min_score": 0.0,
        "max_score": 20.0,
        "base_severity": "Low",
        "color": "Green"
    },
    "portscan": {
        "min_score": 30.0,
        "max_score": 50.0,
        "base_severity": "Medium",
        "color": "Yellow"
    },
    "bruteforce": {
        "min_score": 40.0,
        "max_score": 60.0,
        "base_severity": "Medium",
        "color": "Yellow"
    },
    "bot": {
        "min_score": 50.0,
        "max_score": 70.0,
        "base_severity": "High",
        "color": "Orange"
    },
    "dos": {
        "min_score": 60.0,
        "max_score": 80.0,
        "base_severity": "High",
        "color": "Orange"
    },
    "malware": {
        "min_score": 80.0,
        "max_score": 90.0,
        "base_severity": "Critical",
        "color": "Red"
    },
    "ddos": {
        "min_score": 90.0,
        "max_score": 100.0,
        "base_severity": "Critical",
        "color": "Red"
    },
    "infiltration": {
        "min_score": 95.0,
        "max_score": 100.0,
        "base_severity": "Critical",
        "color": "Red"
    }
}


class RiskScoringService:
    """
    Modular Risk Scoring Service for NetShield AI.
    Calculates risk score (0-100), severity level, and risk color based on
    predicted attack class and prediction confidence.
    """

    @staticmethod
    def calculate_risk(attack_class: str, confidence: Union[float, int]) -> Dict[str, Any]:
        """
        Calculate risk score, severity level, and risk color.

        Args:
            attack_class (str): Name of predicted attack class (e.g. 'Benign', 'DDoS', 'DoS', 'Malware').
            confidence (float): Model prediction confidence between 0.0 and 1.0 (or 0 to 100).

        Returns:
            dict: {
                "risk_score": 85.5,
                "severity": "Critical",
                "risk_color": "Red",
                "attack_class": "Malware",
                "confidence": 0.95
            }
        """
        raw_class = str(attack_class).strip().lower() if attack_class else "benign"
        
        # Normalize confidence to [0.0, 1.0] range
        conf_val = float(confidence) if confidence is not None else 0.5
        if conf_val > 1.0:
            conf_val = conf_val / 100.0
        conf_val = min(max(conf_val, 0.0), 1.0)

        # Lookup attack class configuration or default fallback
        risk_config = ATTACK_RISK_MAP.get(raw_class)
        if not risk_config:
            # Fallback for unknown attack types
            if "attack" in raw_class or "malicious" in raw_class:
                risk_config = {
                    "min_score": 60.0,
                    "max_score": 85.0,
                    "base_severity": "High",
                    "color": "Orange"
                }
            else:
                risk_config = {
                    "min_score": 30.0,
                    "max_score": 60.0,
                    "base_severity": "Medium",
                    "color": "Yellow"
                }

        min_s = risk_config["min_score"]
        max_s = risk_config["max_score"]

        # Calculate score adjusted by confidence within class range
        if raw_class in ("benign", "normal"):
            risk_score = round(min(max((1.0 - conf_val) * 100.0, 0.0), 100.0), 1)
        else:
            raw_score = min_s + (conf_val * (max_s - min_s))
            risk_score = round(min(max(raw_score, 0.0), 100.0), 1)

        # Determine Severity Level & Color based on final probability/risk score (Task 6 thresholds)
        if risk_score >= 95.0:
            severity = "Critical"
            risk_color = "Red"
        elif risk_score >= 80.0:
            severity = "High"
            risk_color = "Orange"
        elif risk_score >= 60.0:
            severity = "Medium"
            risk_color = "Yellow"
        elif risk_score >= 30.0:
            severity = "Low"
            risk_color = "Blue"
        else:
            severity = "Safe"
            risk_color = "Green"

        return {
            "risk_score": risk_score,
            "severity": severity,
            "risk_color": risk_color,
            "attack_class": attack_class,
            "confidence": round(conf_val, 4)
        }


# Global helper shortcut function
def get_risk_score(attack_class: str, confidence: Union[float, int]) -> Dict[str, Any]:
    return RiskScoringService.calculate_risk(attack_class, confidence)
