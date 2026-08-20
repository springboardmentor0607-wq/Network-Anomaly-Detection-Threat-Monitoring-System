from fastapi import APIRouter, UploadFile, File, HTTPException
import pandas as pd
import joblib
import os

from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score
)

router = APIRouter()

MODEL_PATH = "ml/saved_models/intrusion_model.pkl"
ENCODER_PATH = "ml/saved_models/protocol_encoder.pkl"

REQUIRED_COLUMNS = [
    "duration",
    "src_packets",
    "dst_packets",
    "src_bytes",
    "dst_bytes",
    "protocol"
]


@router.post("/model-testing/upload")
async def test_uploaded_file(
    file: UploadFile = File(...)
):

    # Check file type
    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(
            status_code=400,
            detail="Please upload a CSV file."
        )

    try:

        # Load uploaded CSV
        contents = await file.read()

        from io import BytesIO

        data = pd.read_csv(
            BytesIO(contents)
        )

        print(
            "Uploaded test file:",
            file.filename
        )

        print(
            "Test dataset shape:",
            data.shape
        )

        # Check required columns
        missing_columns = [
            column
            for column in REQUIRED_COLUMNS
            if column not in data.columns
        ]

        if missing_columns:
            raise HTTPException(
                status_code=400,
                detail={
                    "message": "Missing required columns.",
                    "missing_columns": missing_columns
                }
            )

        # Load trained model
        if not os.path.exists(MODEL_PATH):
            raise HTTPException(
                status_code=500,
                detail="Trained intrusion model not found."
            )

        model = joblib.load(
            MODEL_PATH
        )

        encoder = joblib.load(
            ENCODER_PATH
        )

        # Prepare features
        X = data[REQUIRED_COLUMNS].copy()

        # Convert numeric columns
        numeric_columns = [
            "duration",
            "src_packets",
            "dst_packets",
            "src_bytes",
            "dst_bytes"
        ]

        for column in numeric_columns:
            X[column] = pd.to_numeric(
                X[column],
                errors="coerce"
            )

        # Remove invalid rows
        X = X.dropna()

        # Encode protocol
        try:

            X["protocol"] = encoder.transform(
                X["protocol"].astype(str)
            )

        except ValueError as error:

            raise HTTPException(
                status_code=400,
                detail=(
                    "CSV contains protocol values "
                    "not seen during model training."
                )
            )

        # Run prediction
        predictions = model.predict(X)

        total = len(predictions)

        attack_count = int(
            (predictions == 1).sum()
        )

        normal_count = int(
            (predictions == 0).sum()
        )

        attack_percentage = (
            (attack_count / total) * 100
            if total > 0
            else 0
        )

        result = {
            "filename": file.filename,
            "total_records": total,
            "normal_records": normal_count,
            "attack_records": attack_count,
            "attack_percentage": round(
                attack_percentage,
                2
            )
        }

        # ==================================
        # OPTIONAL LABEL EVALUATION
        # ==================================

        if "label" in data.columns:

            actual = pd.to_numeric(
                data.loc[
                    X.index,
                    "label"
                ],
                errors="coerce"
            )

            valid = actual.notna()

            actual = actual[valid]
            predicted = pd.Series(
                predictions,
                index=X.index
            )[valid]

            if len(actual) > 0:

                result["evaluation"] = {
                    "accuracy": round(
                        accuracy_score(
                            actual,
                            predicted
                        ) * 100,
                        2
                    ),

                    "precision": round(
                        precision_score(
                            actual,
                            predicted,
                            zero_division=0
                        ) * 100,
                        2
                    ),

                    "recall": round(
                        recall_score(
                            actual,
                            predicted,
                            zero_division=0
                        ) * 100,
                        2
                    ),

                    "f1_score": round(
                        f1_score(
                            actual,
                            predicted,
                            zero_division=0
                        ) * 100,
                        2
                    )
                }

        return result

    except HTTPException:
        raise

    except Exception as error:

        print(
            "Model testing error:",
            error
        )

        raise HTTPException(
            status_code=500,
            detail=str(error)
        )

