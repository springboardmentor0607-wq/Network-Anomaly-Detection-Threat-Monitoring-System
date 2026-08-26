import joblib
import os


BASE_DIR = os.path.dirname(__file__)


model = joblib.load(
    os.path.join(BASE_DIR, "model.pkl")
)


def classify_attack(features):

    prediction = model.predict(
        [features]
    )

    probability = model.predict_proba(
        [features]
    )


    confidence = max(probability[0]) * 100


    if prediction[0] == 0:

        return {
            "threat_type": "Normal Traffic",
            "severity": "Low",
            "confidence": f"{confidence:.2f}%"
        }


    else:

        return {
            "threat_type": "Network Attack",
            "severity": "High",
            "confidence": f"{confidence:.2f}%"
        }