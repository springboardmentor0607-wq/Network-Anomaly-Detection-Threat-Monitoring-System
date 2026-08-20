import pandas as pd

# Load cleaned datasets

cicids = pd.read_csv(
    "datasets/CICIDS2017/cleaned_CICIDS2017.csv"
)

unsw = pd.read_csv(
    "datasets/UNSW-NB15/cleaned_UNSW_NB15.csv"
)

print("CICIDS Shape:", cicids.shape)
print("UNSW Shape:", unsw.shape)


# Keep only common columns

common_columns = list(
    set(cicids.columns) & set(unsw.columns)
)

print("Common Features:")
print(common_columns)


cicids_common = cicids[common_columns]
unsw_common = unsw[common_columns]


# Combine

combined = pd.concat(
    [cicids_common, unsw_common],
    ignore_index=True
)


print("Combined Shape:", combined.shape)


# Save

combined.to_csv(
    "datasets/combined_intrusion_dataset.csv",
    index=False
)


print("Combined dataset saved successfully!")