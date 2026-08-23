from backend.ai.config.config import RISK_SCORE_MAPPING

def calculate_risk(threat_class, probability=1.0):
    """
    Enterprise Risk Scoring Engine.
    Returns:
      risk_score: int (0 to 100)
      risk_level: str ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')
    """
    mapped_info = RISK_SCORE_MAPPING.get(threat_class)
    if not mapped_info:
        # Check case-insensitive match
        for k, v in RISK_SCORE_MAPPING.items():
            if k.lower() in str(threat_class).lower():
                mapped_info = v
                break

    if not mapped_info:
        mapped_info = {"score": 50, "severity": "MEDIUM"}

    base_score = mapped_info["score"]
    # Adjust score based on probability if probability < 1
    adjusted_score = int(round(base_score * (0.5 + 0.5 * float(probability))))
    adjusted_score = max(0, min(100, adjusted_score))

    if adjusted_score <= 25:
        level = "LOW"
    elif adjusted_score <= 50:
        level = "MEDIUM"
    elif adjusted_score <= 75:
        level = "HIGH"
    else:
        level = "CRITICAL"

    return {
        "risk_score": adjusted_score,
        "risk_level": level,
        "base_risk_score": base_score,
        "severity": mapped_info["severity"]
    }
