import pandas as pd
import requests


DATASET_PATH = (
    "datasets/CICIDS2017/cleaned_CICIDS2017.csv"
)


df = pd.read_csv(
    DATASET_PATH,
    low_memory=False
)

df.columns = df.columns.str.strip()


# Select a real attack record
attack_sample = df[
    df["Label"] != "BENIGN"
].iloc[0]


data = {

    "source_ip": "192.168.1.50",

    "destination_ip": "10.0.0.20",

    "protocol": "TCP",

    "destination_port":
        int(attack_sample["Destination Port"]),

    "duration":
        float(attack_sample["Flow Duration"]),

    "src_packets":
        float(attack_sample["Total Fwd Packets"]),

    "dst_packets":
        float(attack_sample["Total Backward Packets"]),

    "src_bytes":
        float(attack_sample["Total Length of Fwd Packets"]),

    "dst_bytes":
        float(attack_sample["Total Length of Bwd Packets"]),

    "flow_bytes_per_sec":
        float(attack_sample["Flow Bytes/s"]),

    "flow_packets_per_sec":
        float(attack_sample["Flow Packets/s"])
}


print("Actual CICIDS2017 attack:")
print(attack_sample["Label"])

print("\nSending to /predict/cicids...")


response = requests.post(
    "http://127.0.0.1:8000/predict/cicids",
    json=data
)


print("\nPrediction Result:")
print(response.text)