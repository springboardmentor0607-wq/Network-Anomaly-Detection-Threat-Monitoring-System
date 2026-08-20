import joblib
import pandas as pd


MODEL_PATH = "ml/saved_models/intrusion_model.pkl"
ENCODER_PATH = "ml/saved_models/protocol_encoder.pkl"


model = joblib.load(MODEL_PATH)
protocol_encoder = joblib.load(ENCODER_PATH)


def predict_threat(features):

    df = pd.DataFrame([features])


    # Encode protocol
    if "protocol" in df.columns:
        df["protocol"] = protocol_encoder.transform(
            df["protocol"]
        )


    prediction = model.predict(df)[0]


    if prediction == 1:
        result = {
            "status": "Threat Detected",
            "prediction": "Attack",
            "severity": "HIGH"
        }

    else:
        result = {
            "status": "Normal Traffic",
            "prediction": "BENIGN",
            "severity": "LOW"
        }


    return result


if __name__ == "__main__":

    test_packet = {
    "duration": 10,
    "src_packets": 20,
    "dst_packets": 15,
    "src_bytes": 5000,
    "dst_bytes": 3000,
    "protocol": "80"
}


    print(predict_threat(test_packet))