import pandas as pd

df = pd.read_csv("../datasets/combined_intrusion_dataset.csv")

print(df["label"].value_counts())