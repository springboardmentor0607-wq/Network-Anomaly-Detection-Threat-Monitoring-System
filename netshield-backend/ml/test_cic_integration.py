import pandas as pd
from predict import predict_intrusion

DATASET_DIR = "datasets/CIC-IDS2017"

files = [
    "Monday-WorkingHours.pcap_ISCX.csv",
    "Tuesday-WorkingHours.pcap_ISCX.csv",
    "Wednesday-workingHours.pcap_ISCX.csv",
    "Thursday-WorkingHours-Morning-WebAttacks.pcap_ISCX.csv",
    "Friday-WorkingHours-Afternoon-DDos.pcap_ISCX.csv",
]

total = 0
correct = 0

for filename in files:
    path = f"{DATASET_DIR}/{filename}"

    print("\n" + "=" * 70)
    print(filename)
    print("=" * 70)

    try:
        df = pd.read_csv(path)

        # Clean column names
        df.columns = df.columns.str.strip()

        # Test first 5 records from each file
        sample = df.head(5)

        for index, row in sample.iterrows():
            data = row.to_dict()

            # Find actual label
            label_column = None
            for col in df.columns:
                if col.lower() in ["label", "class"]:
                    label_column = col
                    break

            actual = None

            if label_column:
                actual_value = str(row[label_column]).strip().lower()
                actual = 0 if actual_value == "benign" else 1

                # Don't send the actual label to the model
                data.pop(label_column, None)

            result = predict_intrusion(data, "CIC-IDS2017")

            predicted = result["label"]

            match = actual == predicted if actual is not None else None

            print(
                f"Record {index} | "
                f"Actual={actual} | "
                f"Predicted={predicted} | "
                f"Attack Probability={result['attack_probability']:.2%} | "
                f"Category={result['attack_category']} | "
                f"Match={match}"
            )

            if match is not None:
                total += 1
                if match:
                    correct += 1

    except Exception as e:
        print(f"ERROR: {e}")

print("\n" + "=" * 70)
print("CIC-IDS2017 INTEGRATION TEST SUMMARY")
print("=" * 70)

print(f"Total tested: {total}")
print(f"Correct: {correct}")
print(f"Incorrect: {total - correct}")

if total > 0:
    print(f"Integration Accuracy: {(correct / total) * 100:.2f}%")