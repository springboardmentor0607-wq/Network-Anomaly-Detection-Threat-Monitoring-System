import pandas as pd
from ml.predict import predict_intrusion
from analytics import load_cic_dataset

print("Loading CIC-IDS2017...")
df = load_cic_dataset()

print("Total records:", len(df))
print("Searching for a MEDIUM-risk record...")

# Randomly sample attack records instead of scanning everything
attacks = df[
    df["label"] == 1
].sample(
    n=min(100, (df["label"] == 1).sum()),
    random_state=42
)

for record_id, row in attacks.iterrows():

    data = {
        k: (
            None
            if pd.isna(v)
            else v.item()
            if hasattr(v, "item")
            else v
        )
        for k, v in row.items()
        if k not in ["label", "Label"]
    }

    try:
        result = predict_intrusion(
            data,
            dataset="CIC-IDS2017"
        )

        probability = result["attack_probability"] * 100

        if 60 <= probability < 80:

            print()
            print("==============================")
            print("MEDIUM-RISK RECORD FOUND")
            print("==============================")
            print("Record ID:", record_id)
            print("Attack Probability:", round(probability, 2), "%")
            print("Prediction:", result["prediction"])
            print("Risk Score:", round(probability))
            print("Risk Level: MEDIUM")
            print("==============================")

            break

    except Exception as e:
        print("Error on record", record_id, ":", e)

else:
    print("No MEDIUM-risk record found in this sample.")