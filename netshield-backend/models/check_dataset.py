import pandas as pd

df = pd.read_csv("../dataset/UNSW_NB15_training-set.csv")

print(df.head())

print("\nColumns:\n")
print(df.columns.tolist())

print("\nShape:", df.shape)