import pandas as pd
from pathlib import Path


# ============================================================
# PATHS
# ============================================================

BASE_DIR = Path(__file__).resolve().parent

DATASETS_DIR = BASE_DIR / "datasets"

# UNSW-NB15
UNSW_DIR = DATASETS_DIR / "UNSW-NB15"
UNSW_TRAIN_PATH = (
    UNSW_DIR
    / "Training and Testing Sets"
    / "UNSW_NB15_training-set.csv"
)

# CIC-IDS2017
CIC_DATASET_DIR = DATASETS_DIR / "CIC-IDS2017"

# Processed output folder
PROCESSED_DIR = DATASETS_DIR / "processed"

PROCESSED_DIR.mkdir(
    parents=True,
    exist_ok=True
)


# ============================================================
# UNSW-NB15 PREPROCESSING
# ============================================================

def preprocess_unsw():

    print("\n================================")
    print("Processing UNSW-NB15")
    print("================================")

    if not UNSW_TRAIN_PATH.exists():
        print(
            f"UNSW-NB15 file not found:\n"
            f"{UNSW_TRAIN_PATH}"
        )
        return

    # Load dataset
    df = pd.read_csv(
        UNSW_TRAIN_PATH
    )

    print(
        f"Original records: {len(df):,}"
    )

    # Remove spaces from column names
    df.columns = (
        df.columns
        .str.strip()
    )

    # Remove completely empty rows
    df = df.dropna(
        how="all"
    )

    # Clean categorical text columns
    for column in [
        "proto",
        "service",
        "state",
        "attack_cat",
    ]:

        if column in df.columns:

            df[column] = (
                df[column]
                .astype(str)
                .str.strip()
            )

    # Make sure label is numeric
    if "label" in df.columns:

        df["label"] = pd.to_numeric(
            df["label"],
            errors="coerce"
        )

    # Remove rows where label is invalid
    if "label" in df.columns:

        df = df.dropna(
            subset=["label"]
        )

        df["label"] = (
            df["label"]
            .astype(int)
        )

    # Fill missing categorical values
    for column in [
        "proto",
        "service",
        "state",
        "attack_cat",
    ]:

        if column in df.columns:

            df[column] = (
                df[column]
                .replace(
                    ["nan", "NaN", ""],
                    "Unknown"
                )
                .fillna("Unknown")
            )

    # Save processed dataset
    output_path = (
        PROCESSED_DIR
        / "UNSW_NB15_processed.csv"
    )

    df.to_csv(
        output_path,
        index=False
    )

    print(
        f"Processed records: {len(df):,}"
    )

    print(
        f"Saved to:\n{output_path}"
    )


# ============================================================
# CIC-IDS2017 PREPROCESSING
# ============================================================

# ============================================================
# CIC-IDS2017 PREPROCESSING
# ============================================================

def preprocess_cic():

    print("\n================================")
    print("Processing CIC-IDS2017")
    print("================================")

    if not CIC_DATASET_DIR.exists():

        print(
            f"CIC-IDS2017 folder not found:\n"
            f"{CIC_DATASET_DIR}"
        )

        return

    csv_files = list(
        CIC_DATASET_DIR.glob("*.csv")
    )

    if not csv_files:

        print(
            "No CIC-IDS2017 CSV files found."
        )

        return

    print(
        f"Found {len(csv_files)} CSV files."
    )

    # Process one file at a time
    for file in csv_files:

        output_name = (
            file.stem
            + "_processed.csv"
        )

        output_path = (
            PROCESSED_DIR
            / output_name
        )

        # Skip files that have already been processed
        if output_path.exists():

            print(
                f"\nSkipping already processed file:"
                f"\n{file.name}"
            )

            continue

        print(
            f"\nProcessing: {file.name}"
        )

        first_chunk = True

        try:

            # Read large CSV in chunks
            for chunk_number, df in enumerate(
                pd.read_csv(
                    file,
                    low_memory=False,
                    chunksize=50000
                )
            ):

                print(
                    f"  Processing chunk "
                    f"{chunk_number + 1}..."
                )

                # Clean column names
                df.columns = (
                    df.columns
                    .str.strip()
                )

                # Clean Label column
                if "Label" in df.columns:

                    df["Label"] = (
                        df["Label"]
                        .astype(str)
                        .str.strip()
                    )

                    # Create binary label
                    # 0 = Normal
                    # 1 = Attack

                    df["label"] = (
                        df["Label"]
                        .str.upper()
                        .ne("BENIGN")
                        .astype(int)
                    )

                # Replace infinity values
                df = df.replace(
                    [float("inf"), float("-inf")],
                    pd.NA
                )

                # Remove completely empty rows
                df = df.dropna(
                    how="all"
                )

                # Append chunk to processed file
                df.to_csv(
                    output_path,
                    mode="w" if first_chunk else "a",
                    header=first_chunk,
                    index=False
                )

                first_chunk = False

                # Release memory
                del df

            print(
                f"Saved: {output_name}"
            )

        except Exception as e:

            print(
                f"Could not process "
                f"{file.name}: {e}"
            )

    print(
        "\n================================"
    )

    print(
        "CIC-IDS2017 preprocessing complete."
    )
# ============================================================
# RUN
# ============================================================

if __name__ == "__main__":

    preprocess_unsw()

    preprocess_cic()

    print(
        "\nAll dataset preprocessing completed."
    )