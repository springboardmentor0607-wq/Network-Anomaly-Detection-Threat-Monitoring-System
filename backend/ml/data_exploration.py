import pandas as pd

file_path = "datasets/CICIDS2017/Monday-WorkingHours.pcap_ISCX.csv"

df = pd.read_csv(file_path)

print("Dataset Loaded Successfully")

print("Rows:", df.shape[0])
print("Columns:", df.shape[1])

print("\nColumn Names:")
print(df.columns)

print("\nFirst 5 rows:")
print(df.head())