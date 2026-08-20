import pandas as pd

# Load the combined dataset
df = pd.read_csv("datasets/combined_intrusion_dataset.csv")

print("========== NetShield AI Traffic Analysis ==========\n")

print(f"Total Packets: {len(df)}")

print("\nAttack Distribution:\n")
print(df["label"].value_counts())

print("\nProtocols:\n")
print(df["protocol"].value_counts())