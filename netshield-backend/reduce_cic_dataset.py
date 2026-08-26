import pandas as pd
from pathlib import Path

# ===========================================
# FOLDERS
# ===========================================

BASE_DIR = Path(__file__).resolve().parent

SOURCE_DIR = BASE_DIR / "datasets" / "processed"

OUTPUT_DIR = BASE_DIR / "datasets" / "processed_small"

OUTPUT_DIR.mkdir(exist_ok=True)

# Number of rows to keep from each file
ROWS_TO_KEEP = 100000

# ===========================================
# Reduce every CIC processed file
# ===========================================

for file in SOURCE_DIR.glob("*_processed.csv"):

    if "UNSW_NB15" in file.name:
        continue

    print(f"Processing {file.name}...")

    df = pd.read_csv(
        file,
        nrows=ROWS_TO_KEEP,
        low_memory=False
    )

    output_file = OUTPUT_DIR / file.name

    df.to_csv(
        output_file,
        index=False
    )

    print(f"Saved {output_file.name}")

print("\nDone!")