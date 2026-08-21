import joblib
import numpy as np

# Load the trained model
model = joblib.load("app/models/anomaly_model.pkl")

def detect_anomaly(packet_size, duration, connection_count):
    data = np.array([[packet_size, duration, connection_count]])

    prediction = model.predict(data)

    if prediction[0] == -1:
        return "Threat Detected"
    else:
        return "Normal Traffic"

# Test the model
result = detect_anomaly(8500, 75, 38)
print(result)