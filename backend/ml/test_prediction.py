import pandas as pd
import requests


df = pd.read_csv(
    "datasets/combined_intrusion_dataset.csv",
    low_memory=False
)


sample = df[df["label"] == 1].iloc[0]


data = {
    "duration": float(sample["duration"]),
    "src_packets": float(sample["src_packets"]),
    "dst_packets": float(sample["dst_packets"]),
    "src_bytes": float(sample["src_bytes"]),
    "dst_bytes": float(sample["dst_bytes"]),
    "protocol": str(sample["protocol"])
}


response = requests.post(
    "http://127.0.0.1:8000/predict",
    json=data
)


print("Input Traffic:")
print(data)

print("\nPrediction Result:")
print(response.text)