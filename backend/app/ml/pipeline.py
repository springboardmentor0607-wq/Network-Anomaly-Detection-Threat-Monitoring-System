import numpy as np
import pandas as pd
from typing import Dict, Any, List, Tuple

class CICIDS2017Preprocessor:
    """Preprocessor pipeline for CICIDS2017 network traffic dataset."""
    
    FEATURE_COLUMNS = [
        "Destination Port", "Flow Duration", "Total Fwd Packets", 
        "Total Backward Packets", "Flow Bytes/s", "Flow Packets/s",
        "Fwd Packet Length Max", "Fwd Packet Length Min", "Bwd Packet Length Max"
    ]
    
    def process_raw_dataframe(self, df: pd.DataFrame) -> Tuple[np.ndarray, np.ndarray]:
        # Strip column whitespace
        df.columns = df.columns.str.strip()
        # Drop inf/nan
        df = df.replace([np.inf, -np.inf], np.nan).dropna()
        X = df[self.FEATURE_COLUMNS].values
        y = df["Label"].values if "Label" in df.columns else None
        return X, y

class UNSWNB15Preprocessor:
    """Preprocessor pipeline for UNSW-NB15 dataset."""
    
    FEATURE_COLUMNS = ["dur", "spkts", "dpkts", "sbytes", "dbytes", "rate", "sttl", "dttl"]
    
    def process_raw_dataframe(self, df: pd.DataFrame) -> Tuple[np.ndarray, np.ndarray]:
        df = df.dropna()
        X = df[self.FEATURE_COLUMNS].values
        y = df["attack_cat"].values if "attack_cat" in df.columns else None
        return X, y

class RiskScoringEngine:
    """
    Transparent 0-100 Risk Scoring Engine for NetShield AI.
    
    Factors considered:
    - Model anomaly confidence (0-1)
    - Severity of attack type (0-40)
    - Frequency of IP appearance (repeat offender boost)
    - Protocol vulnerability weight
    """
    
    SEVERITY_WEIGHTS = {
        "DoS SYN Flood": 40,
        "DDoS": 40,
        "Command Injection": 38,
        "SQL Injection": 35,
        "SSH Brute Force": 30,
        "DNS Tunneling": 28,
        "Port Scan": 20,
        "Reconnaissance": 15,
        "Normal": 0
    }
    
    PROTOCOL_WEIGHTS = {
        "SSH": 1.2,
        "HTTP": 1.1,
        "DNS": 1.15,
        "TCP": 1.0,
        "UDP": 1.05,
        "ICMP": 0.9
    }

    def compute_risk_score(
        self,
        attack_type: str,
        anomaly_confidence: float,
        protocol: str = "TCP",
        repeat_offender_count: int = 1
    ) -> Dict[str, Any]:
        base_severity = self.SEVERITY_WEIGHTS.get(attack_type, 15)
        confidence_multiplier = min(max(anomaly_confidence, 0.0), 1.0)
        proto_multiplier = self.PROTOCOL_WEIGHTS.get(protocol.upper(), 1.0)
        repeat_boost = min(repeat_offender_count * 3, 15)
        
        raw_score = ((base_severity * 1.5) + (confidence_multiplier * 35)) * proto_multiplier + repeat_boost
        score = int(min(max(raw_score, 0), 100))
        
        if score <= 20:
            band = "LOW"
        elif score <= 40:
            band = "MODERATE"
        elif score <= 60:
            band = "ELEVATED"
        elif score <= 80:
            band = "HIGH"
        else:
            band = "CRITICAL"
            
        return {
            "score": score,
            "band": band,
            "factors": {
                "base_severity": base_severity,
                "confidence_multiplier": confidence_multiplier,
                "protocol_multiplier": proto_multiplier,
                "repeat_boost": repeat_boost
            }
        }

class MLInferenceEngine:
    """Inference engine performing real-time classification and anomaly detection."""
    
    def __init__(self):
        self.risk_engine = RiskScoringEngine()
        
    def predict_packet(self, packet_data: Dict[str, Any]) -> Dict[str, Any]:
        protocol = packet_data.get("protocol", "TCP")
        packets = packet_data.get("packets", 100)
        bytes_count = packet_data.get("bytes", 5000)
        
        # Heuristic anomaly evaluation
        is_anomaly = False
        attack_type = "Normal"
        confidence = 0.15
        
        if packets > 3000 or bytes_count > 500000:
            is_anomaly = True
            attack_type = "DoS SYN Flood"
            confidence = 0.94
        elif protocol == "SSH" and packets > 1200:
            is_anomaly = True
            attack_type = "SSH Brute Force"
            confidence = 0.91
        elif protocol == "DNS" and bytes_count > 100000:
            is_anomaly = True
            attack_type = "DNS Tunneling"
            confidence = 0.88
            
        risk_details = self.risk_engine.compute_risk_score(
            attack_type=attack_type,
            anomaly_confidence=confidence,
            protocol=protocol
        )
        
        return {
            "is_anomaly": is_anomaly,
            "predicted_category": attack_type,
            "anomaly_confidence": confidence,
            "risk_score": risk_details["score"],
            "risk_band": risk_details["band"],
            "scoring_breakdown": risk_details["factors"]
        }

ml_inference_engine = MLInferenceEngine()
