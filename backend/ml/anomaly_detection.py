import pandas as pd
from sklearn.ensemble import IsolationForest
import joblib
import os


# Dataset path
DATASET_PATH = "../datasets/combined_intrusion_dataset.csv"

# Load dataset
print("Loading dataset...")
df = pd.read_csv(DATASET_PATH)

print("Dataset Shape:", df.shape)


# Select features used for anomaly detection
features = [
    "duration",
    "src_packets",
    "dst_packets",
    "src_bytes",
    "dst_bytes"
]


X = df[features]


# Train Isolation Forest model
print("Training Isolation Forest...")

model = IsolationForest(
    n_estimators=100,
    contamination=0.1,
    random_state=42
)


model.fit(X)


# Predict anomalies
predictions = model.predict(X)


# Convert output:
# 1  = Normal
# -1 = Anomaly

df["anomaly"] = predictions


# Count results
normal = (df["anomaly"] == 1).sum()
anomalies = (df["anomaly"] == -1).sum()


print("\nAnomaly Detection Results")
print("-------------------------")
print("Normal Traffic:", normal)
print("Anomalies Detected:", anomalies)


# Save model

model_path = "saved_models/isolation_forest.pkl"

os.makedirs("saved_models", exist_ok=True)

joblib.dump(model, model_path)


print("\nModel saved successfully!")
print(model_path)