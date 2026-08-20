import pandas as pd

df = pd.read_csv(
    "../datasets/CICIDS2017/cleaned_CICIDS2017.csv",
    low_memory=False
)

df.columns = df.columns.str.strip()

print("Columns:")
print(df.columns)

print("\nLabels:")
print(df["Label"].value_counts())