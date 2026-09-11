import os
import shutil
from pathlib import Path

from fastapi import APIRouter, File, Form, UploadFile, HTTPException

from app.schemas.upload import UploadResponse
from app.services.csv_prediction import predict_csv


# ==========================================
# Router
# ==========================================

router = APIRouter(
    prefix="/api/upload",
    tags=["CSV Upload"]
)


# ==========================================
# Upload Directory
# ==========================================

BASE_DIR = Path(__file__).resolve().parents[1]

UPLOAD_DIR = BASE_DIR / "uploads"

UPLOAD_DIR.mkdir(
    parents=True,
    exist_ok=True
)


# ==========================================
# Upload CSV and Predict
# ==========================================

@router.post(
    "/predict",
    response_model=UploadResponse
)
async def upload_and_predict(
    dataset: str = Form(...),
    file: UploadFile = File(...)
):

    # --------------------------------------
    # Validate Dataset
    # --------------------------------------

    dataset = dataset.strip().lower()

    if dataset not in ["cic", "unsw"]:
        raise HTTPException(
            status_code=400,
            detail="Invalid Dataset. Use 'cic' or 'unsw'."
        )


    # --------------------------------------
    # Validate File
    # --------------------------------------

    if not file.filename:
        raise HTTPException(
            status_code=400,
            detail="No file selected."
        )

    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(
            status_code=400,
            detail="Only CSV files are allowed."
        )


    # --------------------------------------
    # Create Safe File Name
    # --------------------------------------

    safe_filename = Path(file.filename).name

    file_path = UPLOAD_DIR / safe_filename


    try:

        # ----------------------------------
        # Save Uploaded CSV
        # ----------------------------------

        with open(file_path, "wb") as buffer:

            shutil.copyfileobj(
                file.file,
                buffer
            )


        # ----------------------------------
        # Run AI Prediction
        # ----------------------------------

        result = predict_csv(
            str(file_path),
            dataset
        )


        # ----------------------------------
        # Return Prediction Result
        # ----------------------------------

        return result


    except HTTPException:
        raise


    except Exception as e:

        print("\n==========================================")
        print("CSV UPLOAD ERROR")
        print("==========================================")
        print(f"Error Type : {type(e).__name__}")
        print(f"Error      : {str(e)}")
        print("==========================================\n")

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


    finally:

        # ----------------------------------
        # Delete Temporary Uploaded File
        # ----------------------------------

        try:

            if file_path.exists():

                file_path.unlink()

        except Exception as cleanup_error:

            print(
                f"Warning: Could not delete temporary file: "
                f"{cleanup_error}"
            )