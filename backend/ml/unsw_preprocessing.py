import pandas as pd
from sklearn.preprocessing import LabelEncoder

# Load dataset

path = "datasets/UNSW-NB15/UNSW_NB15_training-set.parquet"

df = pd.read_parquet(path)

print("Original Shape:", df.shape)


# Remove duplicates

df.drop_duplicates(inplace=True)


# Handle missing values

df.dropna(inplace=True)


# Encode categorical columns

categorical_columns = df.select_dtypes(include=["object"]).columns

encoder = LabelEncoder()

for col in categorical_columns:
    df[col] = encoder.fit_transform(df[col])


print("After Cleaning:", df.shape)


# Save cleaned dataset

output = "datasets/UNSW-NB15/cleaned_UNSW_NB15.csv"

df.to_csv(output, index=False)


print("UNSW-NB15 preprocessing completed!")