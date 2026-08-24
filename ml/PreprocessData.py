import pandas as pd
import os

RAW_CICIDS_DIR = "data/raw/CICIDS2017/MachineLearningCVE"
RAW_UNSW_DIR = "data/raw/UNSW-NB15/Training and Testing Sets"
PROCESSED_DIR = "data/processed"

os.makedirs(PROCESSED_DIR, exist_ok=True)


def load_and_clean_cicids():
    print("Loading CICIDS2017 files...")
    all_files = [f for f in os.listdir(RAW_CICIDS_DIR) if f.endswith(".csv")]
    dfs = []

    for file in all_files:
        path = os.path.join(RAW_CICIDS_DIR, file)
        df = pd.read_csv(path, low_memory=False)
        df.columns = df.columns.str.strip()  # remove leading/trailing spaces
        dfs.append(df)
        print(f"  Loaded {file}: {df.shape}")

    combined = pd.concat(dfs, ignore_index=True)

    # Drop rows with missing/infinite values (common in this dataset)
    combined = combined.replace([float("inf"), float("-inf")], pd.NA)
    combined = combined.dropna()

    print(f"CICIDS2017 combined shape after cleaning: {combined.shape}")
    print(combined["Label"].value_counts())

    combined.to_csv(os.path.join(PROCESSED_DIR, "cicids2017_clean.csv"), index=False)
    print("Saved cicids2017_clean.csv\n")


def load_and_clean_unsw():
    print("Loading UNSW-NB15 files...")
    train = pd.read_csv(os.path.join(RAW_UNSW_DIR, "UNSW_NB15_training-set.csv"))
    test = pd.read_csv(os.path.join(RAW_UNSW_DIR, "UNSW_NB15_testing-set.csv"))

    combined = pd.concat([train, test], ignore_index=True)
    combined = combined.dropna()

    print(f"UNSW-NB15 combined shape after cleaning: {combined.shape}")
    print(combined["label"].value_counts())

    combined.to_csv(os.path.join(PROCESSED_DIR, "unsw_nb15_clean.csv"), index=False)
    print("Saved unsw_nb15_clean.csv\n")


if __name__ == "__main__":
    load_and_clean_cicids()
    load_and_clean_unsw()