import pandas as pd
import time
from predict import predict_intrusion

DATASET_PATH = "datasets/CIC-IDS2017/Friday-WorkingHours-Afternoon-DDos.pcap_ISCX.csv"

print("=" * 70)
print("NETSHIELD AI - PERFORMANCE TEST")
print("=" * 70)

# Load 100 records
df = pd.read_csv(DATASET_PATH, nrows=100)
df.columns = df.columns.str.strip()

# Remove actual label
if "Label" in df.columns:
    df = df.drop(columns=["Label"])

# Convert each row to independent Python values
records = []

for _, row in df.iterrows():
    record = {}

    for column, value in row.items():
        if pd.isna(value):
            record[column] = None
        else:
            record[column] = value.item() if hasattr(value, "item") else value

    records.append(record)

print(f"Records to process: {len(records)}")

# Warm-up prediction
predict_intrusion(records[0], "CIC-IDS2017")

# Actual benchmark
start_time = time.perf_counter()

results = []

for record in records:
    result = predict_intrusion(record, "CIC-IDS2017")
    results.append(result)

end_time = time.perf_counter()

total_time = end_time - start_time
average_time = total_time / len(records)
records_per_second = len(records) / total_time

print("\n" + "=" * 70)
print("PERFORMANCE RESULTS")
print("=" * 70)

print(f"Total records processed : {len(records)}")
print(f"Total processing time   : {total_time:.4f} seconds")
print(f"Average time per record : {average_time:.6f} seconds")
print(f"Records per second      : {records_per_second:.2f}")

print("\nSample predictions:")

for i, result in enumerate(results[:5]):
    print(
        f"Record {i}: "
        f"Prediction={result['prediction']}, "
        f"Attack Probability={result['attack_probability']:.2%}"
    )

print("\nPerformance test completed successfully.")