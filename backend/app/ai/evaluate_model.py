import os
import pandas as pd
import joblib

from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score
)


# ============================================================
# PATHS
# ============================================================

BASE_DIR = os.path.dirname(
    os.path.dirname(
        os.path.dirname(
            os.path.abspath(__file__)
        )
    )
)

MODEL_PATH = os.path.join(
    BASE_DIR,
    "app",
    "ai",
    "random_forest_model.pkl"
)

TEST_DATA_PATH = os.path.join(
    BASE_DIR,
    "dataset",
    "KDDTest+.txt"
)


# ============================================================
# NSL-KDD COLUMN NAMES
# ============================================================

COLUMNS = [
    "duration",
    "protocol_type",
    "service",
    "flag",
    "src_bytes",
    "dst_bytes",
    "land",
    "wrong_fragment",
    "urgent",
    "hot",
    "num_failed_logins",
    "logged_in",
    "num_compromised",
    "root_shell",
    "su_attempted",
    "num_root",
    "num_file_creations",
    "num_shells",
    "num_access_files",
    "num_outbound_cmds",
    "is_host_login",
    "is_guest_login",
    "count",
    "srv_count",
    "serror_rate",
    "srv_serror_rate",
    "rerror_rate",
    "srv_rerror_rate",
    "same_srv_rate",
    "diff_srv_rate",
    "srv_diff_host_rate",
    "dst_host_count",
    "dst_host_srv_count",
    "dst_host_same_srv_rate",
    "dst_host_diff_srv_rate",
    "dst_host_same_src_port_rate",
    "dst_host_srv_diff_host_rate",
    "dst_host_serror_rate",
    "dst_host_srv_serror_rate",
    "dst_host_rerror_rate",
    "dst_host_srv_rerror_rate",
    "label",
    "difficulty"
]


# ============================================================
# LOAD DATASET
# ============================================================

def load_test_data():

    print("Loading test dataset...")
    print("Dataset:", TEST_DATA_PATH)

    if not os.path.exists(TEST_DATA_PATH):
        raise FileNotFoundError(
            f"Dataset not found: {TEST_DATA_PATH}"
        )

    # --------------------------------------------------------
    # Your KDDTest+.txt file is whitespace separated
    # --------------------------------------------------------

    data = pd.read_csv(
        TEST_DATA_PATH,
        sep=r"\s+",
        header=None,
        engine="python"
    )

    print(
        "Columns detected:",
        data.shape[1]
    )

    # --------------------------------------------------------
    # Display first row for debugging
    # --------------------------------------------------------

    print(
        "First row:",
        data.iloc[0].tolist()
    )

    # --------------------------------------------------------
    # Your dataset should contain 42 fields because
    # the final label appears attached to the last value.
    # --------------------------------------------------------

    if data.shape[1] != 42:

        raise ValueError(
            f"Unexpected number of columns: "
            f"{data.shape[1]}. "
            f"Expected 42 for this dataset format."
        )

    # --------------------------------------------------------
    # Use first 41 columns as features
    # and final column as label/difficulty information.
    # --------------------------------------------------------

    feature_columns = COLUMNS[:41]

    data.columns = feature_columns + ["label"]

    return data


# ============================================================
# PREPARE DATA
# ============================================================

def prepare_data(data):

    X = data.drop(
        columns=["label"]
    ).copy()

    y = data["label"].astype(str).copy()

    # --------------------------------------------------------
    # Clean labels
    # --------------------------------------------------------

    y = y.str.strip()

    # Your dataset contains labels such as:
    #
    # 1Attack
    #
    # Convert them into binary labels.
    # Normal = 0
    # Attack = 1
    # --------------------------------------------------------

    y = y.apply(
        lambda value:
        0
        if "normal" in value.lower()
        else 1
    )

    # --------------------------------------------------------
    # Categorical columns
    # --------------------------------------------------------

    categorical_columns = [
        "protocol_type",
        "service",
        "flag"
    ]

    for column in categorical_columns:

        if column in X.columns:

            X[column] = pd.factorize(
                X[column].astype(str)
            )[0]

    # --------------------------------------------------------
    # Convert everything to numeric
    # --------------------------------------------------------

    X = X.apply(
        pd.to_numeric,
        errors="coerce"
    )

    X = X.fillna(0)

    return X, y


# ============================================================
# EVALUATE MODEL
# ============================================================

def evaluate_model():

    print()
    print("==============================")
    print("Loading Random Forest model...")
    print("==============================")

    model = joblib.load(
        MODEL_PATH
    )

    print()
    print("==============================")
    print("Loading test dataset...")
    print("==============================")

    data = load_test_data()

    print()
    print("==============================")
    print("Preparing test data...")
    print("==============================")

    X, y = prepare_data(data)

    print(
        "Feature shape:",
        X.shape
    )

    print(
        "Target shape:",
        y.shape
    )

    # --------------------------------------------------------
    # Check model expected features
    # --------------------------------------------------------

    if hasattr(
        model,
        "n_features_in_"
    ):

        print(
            "Model expects:",
            model.n_features_in_,
            "features"
        )

        print(
            "Dataset provides:",
            X.shape[1],
            "features"
        )

    # --------------------------------------------------------
    # Prediction
    # --------------------------------------------------------

    print()
    print("==============================")
    print("Running predictions...")
    print("==============================")

    predictions = model.predict(X)

    # --------------------------------------------------------
    # Metrics
    # --------------------------------------------------------

    accuracy = accuracy_score(
        y,
        predictions
    )

    precision = precision_score(
        y,
        predictions,
        zero_division=0
    )

    recall = recall_score(
        y,
        predictions,
        zero_division=0
    )

    f1 = f1_score(
        y,
        predictions,
        zero_division=0
    )

    results = {

        "accuracy":
            round(
                accuracy * 100,
                2
            ),

        "precision":
            round(
                precision * 100,
                2
            ),

        "recall":
            round(
                recall * 100,
                2
            ),

        "f1_score":
            round(
                f1 * 100,
                2
            )
    }

    # --------------------------------------------------------
    # Display results
    # --------------------------------------------------------

    print()
    print("======================================")
    print("       RANDOM FOREST EVALUATION")
    print("======================================")

    print(
        f"Accuracy  : {results['accuracy']}%"
    )

    print(
        f"Precision : {results['precision']}%"
    )

    print(
        f"Recall    : {results['recall']}%"
    )

    print(
        f"F1 Score  : {results['f1_score']}%"
    )

    print("======================================")

    return results


# ============================================================
# RUN
# ============================================================

if __name__ == "__main__":

    evaluate_model()