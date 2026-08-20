import pandas as pd
import requests


df = pd.read_csv(
    "../datasets/CICIDS2017/cleaned_CICIDS2017.csv",
    low_memory=False
)

df.columns = df.columns.str.strip()


# Pick an attack sample
attack_sample = df[df["Label"] != "BENIGN"].iloc[0]


data = {

    "duration": float(attack_sample["Flow Duration"]),

    "src_packets": float(attack_sample["Total Fwd Packets"]),

    "dst_packets": float(attack_sample["Total Backward Packets"]),

    "src_bytes": float(attack_sample["Total Length of Fwd Packets"]),

    "dst_bytes": float(attack_sample["Total Length of Bwd Packets"]),

    "protocol": "6",

    "destination_port": int(attack_sample["Destination Port"])

}


response = requests.post(
    "http://127.0.0.1:8000/predict",
    json=data
)


print(response.json())