import os
import joblib
import pandas as pd


# ============================================================
# PATHS
# ============================================================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# All ML models are inside ml/models
MODEL_DIR = os.path.join(
    BASE_DIR,
    "models"
)

CIC_MODEL_DIR = os.path.join(
    BASE_DIR,
    "models"
)


# ============================================================
# LOAD UNSW MODELS
# ============================================================

model = joblib.load(
    os.path.join(
        MODEL_DIR,
        "netshield_model.pkl"
    )
)

category_model = joblib.load(
    os.path.join(
        MODEL_DIR,
        "netshield_attack_category_model.pkl"
    )
)

encoder = joblib.load(
    os.path.join(
        MODEL_DIR,
        "netshield_encoder.pkl"
    )
)

scaler = joblib.load(
    os.path.join(
        MODEL_DIR,
        "netshield_scaler.pkl"
    )
)


# ============================================================
# LOAD CIC MODELS
# ============================================================

cic_model = joblib.load(
    os.path.join(
        CIC_MODEL_DIR,
        "cic_model.pkl"
    )
)

cic_scaler = joblib.load(
    os.path.join(
        CIC_MODEL_DIR,
        "cic_scaler.pkl"
    )
)

cic_imputer = joblib.load(
    os.path.join(
        CIC_MODEL_DIR,
        "cic_imputer.pkl"
    )
)

cic_features = joblib.load(
    os.path.join(
        CIC_MODEL_DIR,
        "cic_features.pkl"
    )
)


# ============================================================
# UNSW FEATURE DEFINITIONS
# ============================================================

CATEGORICAL_COLS = [
    "proto",
    "service",
    "state"
]


# ============================================================
# UNSW PREDICTION
# ============================================================

def predict_unsw(data):

    # Convert input into DataFrame
    df = pd.DataFrame([data])

    # --------------------------------------------------------
    # Encode categorical features
    # --------------------------------------------------------

    encoded = encoder.transform(
        df[CATEGORICAL_COLS]
    )

    encoded_df = pd.DataFrame(
        encoded,
        columns=encoder.get_feature_names_out(
            CATEGORICAL_COLS
        )
    )

    # --------------------------------------------------------
    # Numerical features
    # --------------------------------------------------------

    numerical_cols = [
        col
        for col in df.columns
        if col not in CATEGORICAL_COLS
    ]

    numerical_df = df[
        numerical_cols
    ].reset_index(drop=True)

    # --------------------------------------------------------
    # Combine features
    # --------------------------------------------------------

    final_features = pd.concat(
        [numerical_df, encoded_df],
        axis=1
    )

    # Ensure exact training feature order
    final_features = final_features[
        scaler.feature_names_in_
    ]

    # --------------------------------------------------------
    # Scale
    # --------------------------------------------------------

    scaled_features = scaler.transform(
        final_features
    )

    # ========================================================
    # BINARY PREDICTION
    # ========================================================

    prediction = model.predict(
        scaled_features
    )[0]

    probabilities = model.predict_proba(
        scaled_features
    )[0]

    attack_probability = float(
        probabilities[1]
    )

    # ========================================================
    # CATEGORY PREDICTION
    # ========================================================

    if prediction == 1:

        category = category_model.predict(
            scaled_features
        )[0]

        category_probabilities = (
            category_model.predict_proba(
                scaled_features
            )[0]
        )

        category_confidence = float(
            max(category_probabilities)
        )

    else:

        category = "Normal"

        category_confidence = float(
            probabilities[0]
        )

    # ========================================================
    # RESULT
    # ========================================================

    return {
        "prediction": (
            "Attack"
            if prediction == 1
            else "Normal"
        ),

        "label": int(prediction),

        "attack_probability": attack_probability,

        "attack_category": str(category),

        "category_confidence": category_confidence
    }


# ============================================================
# CIC-IDS2017 PREDICTION
# ============================================================

def predict_cic(data):

    # Convert input into DataFrame
    df = pd.DataFrame([data])

    # --------------------------------------------------------
    # Ensure exact CIC feature columns
    # --------------------------------------------------------

    # Add missing features as NaN
    for column in cic_features:

        if column not in df.columns:
            df[column] = float("nan")

    # Keep only features used during training
    df = df[cic_features]

    # --------------------------------------------------------
    # Replace infinity
    # --------------------------------------------------------

    df = df.replace(
        [float("inf"), float("-inf")],
        pd.NA
    )

    # --------------------------------------------------------
    # Imputation
    # --------------------------------------------------------

    imputed = cic_imputer.transform(
        df
    )

    # --------------------------------------------------------
    # Scaling
    # --------------------------------------------------------

    scaled_features = cic_scaler.transform(
        imputed
    )

    # ========================================================
    # BINARY PREDICTION
    # ========================================================

    prediction = cic_model.predict(
        scaled_features
    )[0]

    probabilities = cic_model.predict_proba(
        scaled_features
    )[0]

    # Find probability belonging to attack label
    classes = list(
        cic_model.classes_
    )

    if 1 in classes:

        attack_index = classes.index(1)

        attack_probability = float(
            probabilities[attack_index]
        )

    else:

        attack_probability = 0.0

    # ========================================================
    # CATEGORY
    # ========================================================

    if prediction == 1:

        category = "Attack"

        category_confidence = float(
            max(probabilities)
        )

    else:

        category = "Normal"

        category_confidence = float(
            max(probabilities)
        )

    # ========================================================
    # RESULT
    # ========================================================

    return {
        "prediction": (
            "Attack"
            if prediction == 1
            else "Normal"
        ),

        "label": int(prediction),

        "attack_probability": attack_probability,

        "attack_category": category,

        "category_confidence": category_confidence
    }


# ============================================================
# MAIN PREDICTION FUNCTION
# ============================================================

def predict_intrusion(data, dataset="UNSW-NB15"):

    dataset = str(dataset).strip().upper()

    # --------------------------------------------------------
    # UNSW-NB15
    # --------------------------------------------------------

    if dataset in [
        "UNSW-NB15",
        "UNSW"
    ]:

        return predict_unsw(data)

    # --------------------------------------------------------
    # CIC-IDS2017
    # --------------------------------------------------------

    elif dataset in [
        "CIC-IDS2017",
        "CIC"
    ]:

        return predict_cic(data)

    # --------------------------------------------------------
    # Unsupported dataset
    # --------------------------------------------------------

    else:

        raise ValueError(
            f"Unsupported dataset: {dataset}"
        )