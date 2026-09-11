from pathlib import Path
import pandas as pd
import numpy as np


# ==========================================
# LOAD DATASET
# ==========================================

def load_unsw():

    print("\n========================================")
    print("Loading UNSW-NB15 Dataset")
    print("========================================\n")

    BASE_DIR = Path(__file__).resolve().parents[3]

    DATASET_DIR = BASE_DIR / "datasets" / "UNSW_NB15"

    train_file = DATASET_DIR / "UNSW_NB15_training-set.csv"
    test_file = DATASET_DIR / "UNSW_NB15_testing-set.csv"

    print("Training File:")
    print(train_file)

    print("\nTesting File:")
    print(test_file)

    if not train_file.exists():
        raise FileNotFoundError(train_file)

    if not test_file.exists():
        raise FileNotFoundError(test_file)

    train_df = pd.read_csv(train_file)

    test_df = pd.read_csv(test_file)

    dataset = pd.concat(
        [train_df, test_df],
        ignore_index=True
    )

    print("\nDatasets merged successfully.")

    return dataset


# ==========================================
# CLEAN DATASET
# ==========================================

def clean_dataset(df):

    print("\n========================================")
    print("Cleaning Dataset")
    print("========================================\n")

    print("Original Shape :", df.shape)

    df.columns = df.columns.str.strip()

    df = df.drop_duplicates().copy()

    df = df.replace([np.inf, -np.inf], np.nan)

    df = df.dropna()

    print("Cleaned Shape  :", df.shape)

    print("\nCleaning completed successfully.")

    return df


# ==========================================
# SHOW INFORMATION
# ==========================================

def show_statistics(df):

    print("\n========================================")
    print("DATASET INFORMATION")
    print("========================================\n")

    print("Rows    :", df.shape[0])
    print("Columns :", df.shape[1])

    print("\nColumn Names:\n")

    print(df.columns.tolist())

    print("\nAttack Distribution:\n")

    print(df["attack_cat"].value_counts())

    print("\nData Types:\n")

    print(df.dtypes)

    print("\n========================================\n")


# ==========================================
# SAVE CLEAN DATASET
# ==========================================

def save_dataset(df):

    BASE_DIR = Path(__file__).resolve().parents[1]

    MODEL_DIR = BASE_DIR / "models"

    MODEL_DIR.mkdir(exist_ok=True)

    output = MODEL_DIR / "cleaned_unsw.csv"

    df.to_csv(output, index=False)

    print("Clean dataset saved successfully.")

    print(output)


# ==========================================
# MAIN
# ==========================================

if __name__ == "__main__":

    dataset = load_unsw()

    dataset = clean_dataset(dataset)

    show_statistics(dataset)

    save_dataset(dataset)