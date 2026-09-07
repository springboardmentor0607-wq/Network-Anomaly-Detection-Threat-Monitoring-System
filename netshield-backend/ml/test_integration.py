import pandas as pd
from predict import predict_intrusion


# ============================================================
# LOAD UNSW TEST DATA
# ============================================================

DATASET_PATH = (
    "datasets/UNSW-NB15/"
    "Training and Testing Sets/"
    "UNSW_NB15_testing-set.csv"
)

df = pd.read_csv(DATASET_PATH)

print("=" * 60)
print("NETSHIELD UNSW INTEGRATION TEST")
print("=" * 60)


# ============================================================
# SELECT NORMAL AND ATTACK RECORDS
# ============================================================

normal_records = df[df["label"] == 0].head(10)
attack_records = df[df["label"] == 1].head(10)

test_records = pd.concat(
    [normal_records, attack_records]
)


# ============================================================
# TEST
# ============================================================

correct = 0
total = len(test_records)

print(f"\nRecords tested: {total}")
print("-" * 60)

for index, row in test_records.iterrows():

    actual = int(row["label"])

    data = row.drop(
        labels=["label", "attack_cat"]
    ).to_dict()

    result = predict_intrusion(
        data,
        "UNSW-NB15"
    )

    predicted = int(result["label"])

    match = actual == predicted

    if match:
        correct += 1

    print(
        f"Record {index}: "
        f"Actual={actual}, "
        f"Predicted={predicted}, "
        f"Attack Probability="
        f"{result['attack_probability']:.2%}, "
        f"Match={match}"
    )


# ============================================================
# SUMMARY
# ============================================================

accuracy = correct / total

print("\n" + "=" * 60)
print("TEST SUMMARY")
print("=" * 60)

print(f"Total records:       {total}")
print(f"Correct predictions: {correct}")
print(f"Incorrect:           {total - correct}")
print(f"Integration accuracy: {accuracy:.2%}")

print("=" * 60)