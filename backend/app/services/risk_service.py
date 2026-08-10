from typing import Dict, Any, Tuple
from sqlalchemy.orm import Session
from app.models.traffic import TrafficFlow
from app.models.risk import RiskScore, SeverityBand

class RiskService:
    ATTACK_SEVERITY_WEIGHTS: Dict[str, int] = {
        "DOS": 100,
        "DDOS": 100,
        "DOS SYN FLOOD": 100,
        "EXPLOITS": 100,
        "INFILTRATION": 100,
        "SQL INJECTION": 95,
        "BRUTE FORCE": 80,
        "SSH-PATATOR": 80,
        "WEB ATTACK": 80,
        "BOT": 85,
        "PORTSCAN": 60,
        "RECONNAISSANCE": 60,
        "FUZZERS": 65,
        "BENIGN": 0,
        "NORMAL": 0,
    }

    CRITICAL_PORTS = {22, 443, 80, 8080, 3389, 53}

    @classmethod
    def calculate_risk(
        cls,
        anomaly_score: float,
        predicted_class: str,
        confidence: float,
        dst_ip: str,
        dst_port: int
    ) -> Tuple[int, SeverityBand, Dict[str, Any]]:
        # 1. Anomaly Component (35%)
        anomaly_contrib = round(0.35 * (anomaly_score * 100), 2)

        # 2. Attack Severity Component (45%)
        clean_class = predicted_class.upper().strip()
        sev_weight = 50 # default fallback weight
        for key, weight in cls.ATTACK_SEVERITY_WEIGHTS.items():
            if key in clean_class:
                sev_weight = weight
                break

        attack_contrib = round(0.45 * (sev_weight * confidence), 2)

        # 3. Asset Criticality Component (20%)
        asset_weight = 50
        if dst_port in cls.CRITICAL_PORTS or dst_ip.startswith("10.0.0."):
            asset_weight = 90
        asset_contrib = round(0.20 * asset_weight, 2)

        # 4. Total Composite Risk Score (0 - 100)
        raw_score = int(round(anomaly_contrib + attack_contrib + asset_contrib))
        score = min(100, max(0, raw_score))

        # 5. Severity Band
        if score >= 80:
            severity = SeverityBand.CRITICAL
        elif score >= 60:
            severity = SeverityBand.HIGH
        elif score >= 30:
            severity = SeverityBand.MEDIUM
        else:
            severity = SeverityBand.LOW

        explanation = {
            "formula": "RiskScore = min(100, round(0.35*AnomalyScore*100 + 0.45*SeverityWeight*Confidence + 0.20*AssetCriticality))",
            "anomaly_score_input": round(anomaly_score, 4),
            "anomaly_contribution_pts": anomaly_contrib,
            "predicted_class_input": predicted_class,
            "severity_weight_input": sev_weight,
            "confidence_input": round(confidence, 4),
            "attack_contribution_pts": attack_contrib,
            "destination_port": dst_port,
            "asset_criticality_weight": asset_weight,
            "asset_contribution_pts": asset_contrib,
            "final_score": score,
            "severity_band": severity.value
        }

        return score, severity, explanation

    @classmethod
    def evaluate_and_persist_flow_risk(cls, db: Session, flow: TrafficFlow) -> RiskScore:
        # Retrieve anomaly score
        anomaly_score = 0.1
        if flow.anomalies:
            anomaly_score = flow.anomalies[0].anomaly_score

        # Retrieve prediction class
        pred_class = "BENIGN"
        confidence = 0.95
        if flow.predictions:
            pred_class = flow.predictions[0].predicted_class
            confidence = flow.predictions[0].confidence

        score, severity, explanation = cls.calculate_risk(
            anomaly_score=anomaly_score,
            predicted_class=pred_class,
            confidence=confidence,
            dst_ip=flow.destination_ip,
            dst_port=flow.destination_port
        )

        risk_obj = RiskScore(
            flow_id=flow.id,
            score=score,
            severity=severity,
            explanation=explanation
        )
        db.add(risk_obj)
        db.commit()
        db.refresh(risk_obj)
        return risk_obj
