import pandas as pd
import joblib


model = joblib.load(
    "saved_models/attack_classifier.pkl"
)

encoder = joblib.load(
    "saved_models/attack_label_encoder.pkl"
)


df = pd.read_csv(
    "../datasets/CICIDS2017/cleaned_CICIDS2017.csv",
    low_memory=False
)

df.columns = df.columns.str.strip()


sample = df[df["Label"] != "BENIGN"].iloc[0]


input_data = pd.DataFrame(
    [[
        sample["Destination Port"],
        sample["Flow Duration"],
        sample["Total Fwd Packets"],
        sample["Total Backward Packets"],
        sample["Total Length of Fwd Packets"],
        sample["Total Length of Bwd Packets"],
        sample["Flow Bytes/s"],
        sample["Flow Packets/s"]
    ]],
    columns=[
        "Destination Port",
        "Flow Duration",
        "Total Fwd Packets",
        "Total Backward Packets",
        "Total Length of Fwd Packets",
        "Total Length of Bwd Packets",
        "Flow Bytes/s",
        "Flow Packets/s"
    ]
)


prediction = model.predict(input_data)[0]


print(
    encoder.inverse_transform([prediction])[0]
)