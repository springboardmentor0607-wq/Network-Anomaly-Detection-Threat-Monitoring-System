import os
import json
import logging
from pathlib import Path
import pandas as pd
import numpy as np

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)


def find_dataset():
    """Locate processed_dataset.csv in backend/models or backend/ml."""
    base_dir = Path(__file__).resolve().parent.parent
    possible_paths = [
        base_dir / "models" / "processed_dataset.csv",
        base_dir / "ml" / "processed_dataset.csv",
        Path("backend/models/processed_dataset.csv"),
        Path("backend/ml/processed_dataset.csv"),
        Path("processed_dataset.csv")
    ]
    for p in possible_paths:
        if p.exists():
            return p
    raise FileNotFoundError("Could not find processed_dataset.csv.")


def analyze_class_distribution():
    """Analyze target class distribution, calculate sample counts/percentages, check balance, and save reports."""
    dataset_path = find_dataset()
    logger.info(f"Loading dataset from {dataset_path}...")
    
    df = pd.read_csv(dataset_path)
    
    if 'Label' not in df.columns:
        raise KeyError("'Label' column not found in dataset.")
        
    total_samples = len(df)
    class_counts = df['Label'].value_counts().to_dict()
    
    # Mapping numeric label 0 -> Benign, 1 -> Attack
    label_map = {0: "Benign", 1: "Attack"}
    
    distribution_list = []
    distribution_dict = {}
    
    for cls_val in sorted(class_counts.keys()):
        count = class_counts[cls_val]
        cls_name = label_map.get(cls_val, str(cls_val))
        pct = round((count / total_samples) * 100.0, 2)
        distribution_list.append({
            "class_id": int(cls_val),
            "class_name": cls_name,
            "sample_count": int(count),
            "percentage": pct
        })
        distribution_dict[cls_name] = {
            "class_id": int(cls_val),
            "sample_count": int(count),
            "percentage": pct
        }
        
    # Check balance threshold (imbalanced if minority class ratio < 0.40)
    counts = list(class_counts.values())
    min_count = min(counts)
    max_count = max(counts)
    imbalance_ratio = round(min_count / max_count, 4) if max_count > 0 else 1.0
    
    is_balanced = imbalance_ratio >= 0.40
    balance_status = "Balanced" if is_balanced else "Imbalanced (Minority class < 40% of majority class)"
    
    print("\n================ TARGET CLASS DISTRIBUTION ANALYSIS ================")
    print(f"Total Samples: {total_samples}")
    print("--------------------------------------------------------------------")
    for item in distribution_list:
        print(f"Class '{item['class_name']}' ({item['class_id']}): {item['sample_count']} samples ({item['percentage']}%)")
    print("--------------------------------------------------------------------")
    print(f"Imbalance Ratio (Min/Max): {imbalance_ratio:.4f}")
    print(f"Dataset Balance Status  : {balance_status}")
    print("====================================================================\n")
    
    report_data = {
        "total_samples": total_samples,
        "imbalance_ratio": imbalance_ratio,
        "is_balanced": is_balanced,
        "balance_status": balance_status,
        "class_distribution": distribution_dict
    }
    
    dist_df = pd.DataFrame(distribution_list)
    dist_df['balance_status'] = balance_status
    
    reports_dir = Path(__file__).resolve().parent.parent / "reports"
    reports_dir.mkdir(parents=True, exist_ok=True)
    
    json_path = reports_dir / "class_distribution.json"
    csv_path = reports_dir / "class_distribution.csv"
    
    logger.info(f"Saving JSON report to {json_path}...")
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(report_data, f, indent=4)
        
    logger.info(f"Saving CSV report to {csv_path}...")
    dist_df.to_csv(csv_path, index=False)
    
    logger.info("Class distribution analysis completed successfully!")
    return report_data, dist_df


if __name__ == "__main__":
    analyze_class_distribution()
