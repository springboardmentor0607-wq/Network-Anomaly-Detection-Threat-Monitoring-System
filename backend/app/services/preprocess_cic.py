from pathlib import Path
import pandas as pd
import numpy as np


def load_cicids2017():
    """
    Load all CICIDS2017 CSV files and merge them into one DataFrame.
    """

    # Project Root (NetShield-AI)
    BASE_DIR = Path(__file__).resolve().parents[3]

    # Dataset Folder
    DATASET_DIR = BASE_DIR / "datasets" / "MachineLearningCVE"

    print("\n==========================================")
    print("Loading CICIDS2017 Dataset")
    print("==========================================")
    print(f"\nDataset Path:\n{DATASET_DIR}\n")

    # Find all CSV files
    csv_files = sorted(DATASET_DIR.glob("*.csv"))

    if len(csv_files) == 0:
        raise FileNotFoundError(
            f"No CSV files found in:\n{DATASET_DIR}"
        )

    dataframes = []

    for file in csv_files:
        print(f"Loading -> {file.name}")

        df = pd.read_csv(
            file,
            low_memory=False
        )

        dataframes.append(df)

    # Merge all CSV files
    dataset = pd.concat(
        dataframes,
        ignore_index=True
    )

    print("\nAll CSV files merged successfully.")

    return dataset


def clean_dataset(df):
    """
    Clean the merged dataset.
    """

    print("\n==========================================")
    print("Cleaning Dataset")
    print("==========================================")

    print(f"\nOriginal Shape : {df.shape}")

    # Remove duplicate rows
    df = df.drop_duplicates().copy()

    # Replace Infinity values with NaN
    df = df.replace(
        [np.inf, -np.inf],
        np.nan
    )

    # Remove rows with missing values
    df = df.dropna()

    # Remove extra spaces from column names
    df.columns = df.columns.str.strip()

    print(f"Cleaned Shape  : {df.shape}")

    print("\nCleaning completed successfully.")

    return df


def show_statistics(df):
    """
    Display dataset statistics.
    """

    print("\n==========================================")
    print("DATASET INFORMATION")
    print("==========================================")

    print(f"\nRows    : {df.shape[0]}")
    print(f"Columns : {df.shape[1]}")

    print("\nColumn Names:\n")
    print(df.columns.tolist())

    print("\nAttack Distribution:\n")
    print(df["Label"].value_counts())

    print("\nData Types:\n")
    print(df.dtypes)

    print("\n==========================================\n")


def save_dataset(df):
    """
    Save cleaned dataset.
    """

    BASE_DIR = Path(__file__).resolve().parents[1]

    MODEL_DIR = BASE_DIR / "models"

    MODEL_DIR.mkdir(
        exist_ok=True
    )

    OUTPUT_FILE = MODEL_DIR / "cleaned_cic.csv"

    df.to_csv(
        OUTPUT_FILE,
        index=False
    )

    print("==========================================")
    print("Dataset Saved Successfully")
    print("==========================================")
    print(f"\nSaved Location:\n{OUTPUT_FILE}\n")


def main():

    dataset = load_cicids2017()

    dataset = clean_dataset(dataset)

    show_statistics(dataset)

    save_dataset(dataset)

    print("==========================================")
    print("CICIDS2017 Preprocessing Completed")
    print("==========================================\n")


if __name__ == "__main__":
    main()