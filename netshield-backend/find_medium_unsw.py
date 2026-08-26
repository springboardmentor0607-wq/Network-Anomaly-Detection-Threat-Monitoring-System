import pandas as pd
from ml.predict import predict_intrusion

df = pd.read_csv(
    "datasets/processed/UNSW_NB15_processed.csv",
    low_memory=False
)

found = []

print("Searching UNSW records...")

for _, row in df.iterrows():

    if row["label"] != 1:
        continue

    data = {
        k: (
            None
            if pd.isna(v)
            else v.item()
            if hasattr(v, "item")
            else v
        )
        for k, v in row.items()
        if k not in ["label", "attack_cat"]
    }

    result = predict_intrusion(
        data,
        dataset="UNSW-NB15"
    )

    probability = result["attack_probability"] * 100

    if 60 <= probability < 80:

        found.append(
            (
                int(row["id"]),
                round(probability, 2)
            )
        )

        print(
            f"FOUND → ID: {int(row['id'])} | "
            f"Attack Probability: {probability:.2f}%"
        )

        if len(found) >= 10:
            break

print("\nResults:")
print(found)