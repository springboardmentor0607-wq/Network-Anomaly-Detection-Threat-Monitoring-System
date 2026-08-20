import pandas as pd

# Load combined CICIDS2017 dataset
df = pd.read_csv("datasets/CICIDS2017/combined_CICIDS2017.csv")

print("Original Shape:", df.shape)

# Remove duplicate rows
df = df.drop_duplicates()

# Remove rows with missing values
df = df.dropna()

print("After Cleaning:", df.shape)

# Save cleaned dataset
df.to_csv("datasets/CICIDS2017/cleaned_CICIDS2017.csv", index=False)

print("Cleaned dataset saved successfully!")