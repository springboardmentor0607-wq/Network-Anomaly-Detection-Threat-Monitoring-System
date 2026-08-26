def generate_risk_report(result):
    prediction = result["prediction"]
    category = result["attack_category"]

    risk_score = result["risk_score"]
    risk_level = result["risk_level"]

    confidence = round(
        result["category_confidence"] * 100,
        2
    )

    if prediction == "Normal":

        summary = (
            "No significant network threat was detected."
        )

        recommendation = (
            "Continue monitoring network traffic."
        )

        threat_detected = False

    else:

        threat_detected = True

        summary = (
            f"Potential {category} intrusion detected "
            f"in the network traffic."
        )

        if risk_level == "CRITICAL":

            recommendation = (
                "Immediate investigation is recommended. "
                "Review the affected traffic and source."
            )

        elif risk_level == "HIGH":

            recommendation = (
                "Investigate the detected traffic "
                "and monitor the affected source."
            )

        else:

            recommendation = (
                "Continue monitoring the traffic "
                "for additional suspicious activity."
            )

    return {
        "threat_detected": threat_detected,
        "threat_type": category,
        "risk_score": risk_score,
        "risk_level": risk_level,
        "confidence": confidence,
        "summary": summary,
        "recommendation": recommendation
    }