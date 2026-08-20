import pandas as pd

train_path = "datasets/UNSW-NB15/UNSW_NB15_training-set.parquet"

df = pd.read_parquet(train_path)

print("UNSW-NB15 Dataset Loaded Successfully")
print("Rows:", df.shape[0])
print("Columns:", df.shape[1])

print("\nColumn Names:")
print(df.columns)

print("\nFirst 5 Rows:")
print(df.head())

if "label" in df.columns:
    print("\nLabel Distribution:")
    print(df["label"].value_counts())