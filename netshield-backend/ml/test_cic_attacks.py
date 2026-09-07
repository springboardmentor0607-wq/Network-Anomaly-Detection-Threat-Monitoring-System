import pandas as pd
from predict import predict_intrusion

DATASET_DIR = "datasets/CIC-IDS2017"

tests = [
    ("Friday-WorkingHours-Afternoon-DDos.pcap_ISCX.csv", "DDoS"),
    ("Friday-WorkingHours-Afternoon-PortScan.pcap_ISCX.csv", "PortScan"),
    ("Friday-WorkingHours-Morning.pcap_ISCX.csv", "Bot"),
    ("Tuesday-WorkingHours.pcap_ISCX.csv", "FTP-Patator"),
    ("Wednesday-workingHours.pcap_ISCX.csv", "DoS Hulk"),
    ("Thursday-WorkingHours-Morning-WebAttacks.pcap_ISCX.csv",
     "Web Attack   Brute Force"),
]

total = 0
correct = 0

for filename, attack_label in tests:

    path = f"{DATASET_DIR}/{filename}"

    print("\n" + "=" * 70)
    print(f"{filename} → {attack_label}")
    print("=" * 70)

    df = pd.read_csv(path)

    # Remove spaces from column names
    df.columns = df.columns.str.strip()

    # Get 5 actual attack records
    attack_df = df[
        df["Label"].astype(str).str.strip() == attack_label
    ].head(5)

    for index, row in attack_df.iterrows():

        data = row.to_dict()

        # Remove actual label before prediction
        actual_label = data.pop("Label")

        result = predict_intrusion(data, "CIC-IDS2017")

        predicted = result["label"]

        # Every non-BENIGN record is an attack
        actual = 1

        match = actual == predicted

        print(
            f"Record {index} | "
            f"Actual=ATTACK ({actual_label}) | "
            f"Predicted={result['prediction']} | "
            f"Attack Probability={result['attack_probability']:.2%} | "
            f"Category={result['attack_category']} | "
            f"Match={match}"
        )

        total += 1

        if match:
            correct += 1

print("\n" + "=" * 70)
print("CIC-IDS2017 ATTACK INTEGRATION TEST SUMMARY")
print("=" * 70)

print(f"Total attack records tested: {total}")
print(f"Correct attack detections: {correct}")
print(f"Missed attacks: {total - correct}")

if total > 0:
    print(f"Attack Detection Accuracy: {(correct / total) * 100:.2f}%")