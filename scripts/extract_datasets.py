import os
import zipfile
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

RAW_CICIDS_DIR = os.path.abspath("data/raw/cicids2017")
RAW_UNSW_DIR = os.path.abspath("data/raw/unsw_nb15")

def extract_archive(zip_path: str, target_dir: str):
    if not os.path.exists(zip_path):
        logger.warning(f"Archive zip file not found at: {zip_path}")
        return
    logger.info(f"Extracting {zip_path} to {target_dir}...")
    os.makedirs(target_dir, exist_ok=True)
    with zipfile.ZipFile(zip_path, 'r') as zip_ref:
        zip_ref.extractall(target_dir)
    logger.info(f"Extraction complete for {zip_path}.")

if __name__ == "__main__":
    # Check for provided archives in root or data root
    extract_archive("CIC-IDS-2017-Dataset-main(1).zip", RAW_CICIDS_DIR)
    extract_archive("UNSW-NB15-Dataset-main(1).zip", RAW_UNSW_DIR)
