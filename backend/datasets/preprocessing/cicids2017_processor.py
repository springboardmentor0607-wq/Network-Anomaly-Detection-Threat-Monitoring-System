import json
from pathlib import Path
from preprocessing_pipeline import DatasetPreprocessor

if __name__ == "__main__":
    base_dir = Path(__file__).resolve().parent.parent
    raw_path = base_dir / "raw" / "CICIDS2017"
    processed_path = base_dir / "processed" / "CICIDS2017"

    processor = DatasetPreprocessor("CICIDS2017", raw_path, processed_path)
    report = processor.run_pipeline()
    print(json.dumps({"status": "SUCCESS", "report": report}, indent=2))
