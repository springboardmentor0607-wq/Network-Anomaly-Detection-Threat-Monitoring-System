import os
import random
import pandas as pd
from flask import Blueprint, jsonify, request

test_samples_bp = Blueprint("test_samples", __name__)

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PROJECT_ROOT = os.path.dirname(BASE_DIR)

DATASET_DIRS = [
    os.path.join(PROJECT_ROOT, "dataset"),
    os.path.join(BASE_DIR, "dataset"),
    os.path.join(os.getcwd(), "dataset"),
    "../dataset",
    "dataset"
]

def find_dataset_file(filename="UNSW_NB15_testing-set.csv"):
    for d in DATASET_DIRS:
        p = os.path.join(d, filename)
        if os.path.exists(p):
            return p
    return None

cached_df = None
cached_manual_df = None

def get_test_df():
    global cached_df
    if cached_df is not None:
        return cached_df

    path = find_dataset_file("UNSW_NB15_testing-set.csv")
    if not path:
        path = find_dataset_file("UNSW_NB15_training-set.csv")

    if path:
        df = pd.read_csv(path)
        df.columns = df.columns.str.strip()
        cached_df = df
        return cached_df
    return None

def get_manual_test_df():
    global cached_manual_df
    if cached_manual_df is not None:
        return cached_manual_df

    path = find_dataset_file("manual_test_samples.csv")
    if path:
        df = pd.read_csv(path)
        df.columns = df.columns.str.strip()
        cached_manual_df = df
        return cached_manual_df
    return None

@test_samples_bp.route("/test-samples", methods=["GET"])
def get_available_test_samples():
    """
    Returns available attack classes present in the held-out test dataset.
    """
    try:
        df = get_test_df()
        if df is not None and "attack_cat" in df.columns:
            raw_classes = df["attack_cat"].dropna().astype(str).str.strip().unique().tolist()
            cleaned_classes = []
            for c in raw_classes:
                c_clean = c.strip()
                if c_clean and c_clean not in cleaned_classes:
                    cleaned_classes.append(c_clean)
            
            if "Normal" in cleaned_classes:
                cleaned_classes.remove("Normal")
                cleaned_classes = ["Normal"] + sorted(cleaned_classes)
            else:
                cleaned_classes = sorted(cleaned_classes)
                
            return jsonify({
                "dataset": "UNSW-NB15",
                "classes": cleaned_classes,
                "total_available": len(cleaned_classes)
            }), 200
        else:
            return jsonify({
                "dataset": "UNSW-NB15 Baseline",
                "classes": ["Normal", "DoS", "Reconnaissance", "Exploits", "Fuzzers", "Generic", "Backdoor", "Shellcode", "Worms", "Analysis"],
                "total_available": 10
            }), 200
    except Exception as e:
        return jsonify({"message": f"Error fetching test sample classes: {str(e)}"}), 500

@test_samples_bp.route("/test-sample/random", methods=["GET"])
@test_samples_bp.route("/test-samples/random", methods=["GET"])
def get_random_test_sample():
    """
    Selects a random record from the real held-out UNSW-NB15 test dataset.
    """
    try:
        df = get_test_df()
        if df is None or len(df) == 0:
            return jsonify({"message": "UNSW-NB15 test dataset not found. Please verify the dataset path."}), 404

        sample_idx = random.randint(0, len(df) - 1)
        row = df.iloc[sample_idx].to_dict()

        raw_cat = row.get("attack_cat")
        if pd.isna(raw_cat) or str(raw_cat).strip().lower() in ["", "nan", "none"]:
            actual_cat = "Normal"
        else:
            actual_cat = str(raw_cat).strip()

        src_ip = f"192.168.1.{random.randint(100, 240)}"
        dst_ip = f"10.0.{random.randint(0, 5)}.{random.randint(1, 50)}"

        features = {}
        excluded_keys = ["id", "label", "attack_cat"]
        for k, v in row.items():
            k_clean = str(k).strip()
            if k_clean not in excluded_keys:
                if pd.isna(v):
                    features[k_clean] = 0
                elif isinstance(v, (int, float, str, bool)):
                    features[k_clean] = v
                else:
                    features[k_clean] = str(v)

        return jsonify({
            "dataset": "UNSW-NB15",
            "actual_class": actual_cat,
            "sample_index": sample_idx,
            "source_ip": src_ip,
            "dest_ip": dst_ip,
            "protocol": str(row.get("proto", "tcp")).lower(),
            "service": str(row.get("service", "http")).lower(),
            "state": str(row.get("state", "FIN")).upper(),
            "features": features
        }), 200

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"message": f"Error fetching random test sample: {str(e)}"}), 500

@test_samples_bp.route("/test-sample/<class_name>", methods=["GET"])
def get_test_sample_by_class(class_name):
    """
    Returns one REAL test sample from specified attack class, or random sample if class_name is 'random'.
    """
    if class_name.strip().lower() == "random":
        return get_random_test_sample()

    try:
        df = get_test_df()
        if df is None or "attack_cat" not in df.columns:
            return jsonify({"message": "UNSW-NB15 test dataset not found. Please verify the dataset path."}), 404

        target = class_name.strip().lower()
        matching_rows = df[df["attack_cat"].astype(str).str.strip().str.lower() == target]

        if matching_rows.empty:
            return jsonify({"message": f"No test sample available for class: {class_name}"}), 404

        sample_idx = random.randint(0, len(matching_rows) - 1)
        row = matching_rows.iloc[sample_idx].to_dict()

        src_ip = f"192.168.1.{random.randint(100, 240)}"
        dst_ip = f"10.0.{random.randint(0, 5)}.{random.randint(1, 50)}"

        raw_cat = row.get("attack_cat")
        if pd.isna(raw_cat) or str(raw_cat).strip().lower() in ["", "nan", "none"]:
            actual_cat = "Normal"
        else:
            actual_cat = str(raw_cat).strip()

        features = {}
        excluded_keys = ["id", "label", "attack_cat"]
        for k, v in row.items():
            k_clean = str(k).strip()
            if k_clean not in excluded_keys:
                if pd.isna(v):
                    features[k_clean] = 0
                elif isinstance(v, (int, float, str, bool)):
                    features[k_clean] = v
                else:
                    features[k_clean] = str(v)

        return jsonify({
            "dataset": "UNSW-NB15",
            "actual_class": actual_cat,
            "sample_index": sample_idx,
            "source_ip": src_ip,
            "dest_ip": dst_ip,
            "protocol": str(row.get("proto", "tcp")).lower(),
            "service": str(row.get("service", "http")).lower(),
            "state": str(row.get("state", "FIN")).upper(),
            "features": features
        }), 200

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"message": f"Error fetching sample for class {class_name}: {str(e)}"}), 500

# ==================================================
# MANUAL TEST DATASET API ENDPOINTS (manual_test_samples.csv)
# ==================================================

@test_samples_bp.route("/manual-test-samples", methods=["GET"])
def get_manual_test_samples_list():
    """
    Returns available samples from dataset/manual_test_samples.csv.
    """
    try:
        df = get_manual_test_df()
        if df is None:
            return jsonify({"message": "manual_test_samples.csv not found in dataset folder."}), 404

        samples = []
        for idx, row in df.iterrows():
            samples.append({
                "sample_id": int(row.get("sample_id", idx + 1)),
                "sample_name": str(row.get("sample_name", f"Sample #{idx + 1}")),
                "expected_attack": str(row.get("expected_attack", "Normal")),
                "source_ip": str(row.get("source_ip", "192.168.1.100")),
                "dest_ip": str(row.get("dest_ip", "10.0.0.1")),
                "proto": str(row.get("proto", "tcp"))
            })

        categories = sorted(list(set(s["expected_attack"] for s in samples)))

        return jsonify({
            "dataset_file": "manual_test_samples.csv",
            "total_samples": len(samples),
            "categories": categories,
            "samples": samples
        }), 200
    except Exception as e:
        return jsonify({"message": f"Error listing manual test samples: {str(e)}"}), 500

@test_samples_bp.route("/manual-test-sample/random", methods=["GET"])
@test_samples_bp.route("/manual-test-sample/load", methods=["GET"])
def load_manual_test_sample():
    """
    Loads a test sample from dataset/manual_test_samples.csv.
    Supports optional query parameters: ?id=1 or ?category=DoS
    """
    try:
        df = get_manual_test_df()
        if df is None or len(df) == 0:
            return jsonify({"message": "manual_test_samples.csv not found in dataset directory."}), 404

        sample_id = request.args.get("id")
        category = request.args.get("category")

        filtered_df = df
        if sample_id is not None:
            try:
                sid = int(sample_id)
                filtered_df = df[df["sample_id"] == sid]
            except ValueError:
                pass
        elif category is not None:
            cat_clean = category.strip().lower()
            filtered_df = df[df["expected_attack"].astype(str).str.strip().str.lower() == cat_clean]

        if filtered_df.empty:
            filtered_df = df

        sample_idx = random.randint(0, len(filtered_df) - 1)
        row = filtered_df.iloc[sample_idx].to_dict()

        expected_attack = str(row.get("expected_attack", "Normal")).strip()
        source_ip = str(row.get("source_ip", "192.168.1.100")).strip()
        dest_ip = str(row.get("dest_ip", "10.0.0.1")).strip()
        sample_name = str(row.get("sample_name", f"Sample #{sample_idx + 1}")).strip()

        features = {}
        meta_keys = ["sample_id", "sample_name", "source_ip", "dest_ip", "expected_attack", "label", "attack_cat"]
        for k, v in row.items():
            k_clean = str(k).strip()
            if k_clean not in meta_keys:
                if pd.isna(v):
                    features[k_clean] = 0
                elif isinstance(v, (int, float, str, bool)):
                    features[k_clean] = v
                else:
                    features[k_clean] = str(v)

        return jsonify({
            "dataset_file": "manual_test_samples.csv",
            "sample_id": int(row.get("sample_id", sample_idx + 1)),
            "sample_name": sample_name,
            "expected_attack": expected_attack,
            "source_ip": source_ip,
            "dest_ip": dest_ip,
            "protocol": str(row.get("proto", "tcp")).lower(),
            "service": str(row.get("service", "http")).lower(),
            "state": str(row.get("state", "FIN")).upper(),
            "features": features
        }), 200
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"message": f"Error loading manual test sample: {str(e)}"}), 500

@test_samples_bp.route("/manual-test-sample/<category>", methods=["GET"])
def load_manual_test_sample_by_category(category):
    """
    Loads a stored record from manual_test_samples.csv matching category.
    """
    try:
        df = get_manual_test_df()
        if df is None or len(df) == 0:
            return jsonify({"message": "manual_test_samples.csv not found in dataset directory."}), 404

        cat_clean = category.strip().lower()
        if cat_clean in ["random", "load"]:
            return load_manual_test_sample()

        matching_rows = df[df["expected_attack"].astype(str).str.strip().str.lower() == cat_clean]

        if matching_rows.empty:
            return jsonify({"message": f"No stored sample found for category '{category}' in manual_test_samples.csv"}), 404

        sample_idx = random.randint(0, len(matching_rows) - 1)
        row = matching_rows.iloc[sample_idx].to_dict()

        expected_attack = str(row.get("expected_attack", "Normal")).strip()
        source_ip = str(row.get("source_ip", "192.168.1.100")).strip()
        dest_ip = str(row.get("dest_ip", "10.0.0.1")).strip()
        sample_name = str(row.get("sample_name", f"{category} Sample")).strip()

        features = {}
        meta_keys = ["sample_id", "sample_name", "source_ip", "dest_ip", "expected_attack", "label", "attack_cat"]
        for k, v in row.items():
            k_clean = str(k).strip()
            if k_clean not in meta_keys:
                if pd.isna(v):
                    features[k_clean] = 0
                elif isinstance(v, (int, float, str, bool)):
                    features[k_clean] = v
                else:
                    features[k_clean] = str(v)

        return jsonify({
            "dataset_file": "manual_test_samples.csv",
            "sample_id": int(row.get("sample_id", sample_idx + 1)),
            "sample_name": sample_name,
            "expected_attack": expected_attack,
            "source_ip": source_ip,
            "dest_ip": dest_ip,
            "protocol": str(row.get("proto", "tcp")).lower(),
            "service": str(row.get("service", "http")).lower(),
            "state": str(row.get("state", "FIN")).upper(),
            "features": features
        }), 200
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"message": f"Error loading sample for category '{category}': {str(e)}"}), 500

