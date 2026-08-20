import os
import joblib
import pandas as pd
import numpy as np
import logging

logger = logging.getLogger(__name__)

class MLService:
    def __init__(self, base_model_dir="app/models"):
        self.base_model_dir = base_model_dir
        self.models = {
            "CICIDS2017": {"is_loaded": False},
            "UNSW-NB15": {"is_loaded": False}
        }
        
        # Load models on initialization
        self.load_models("CICIDS2017", "cicids")
        self.load_models("UNSW-NB15", "unswnb15")

    def load_models(self, dataset_name, subfolder):
        try:
            logger.info(f"Loading ML models for {dataset_name}...")
            model_dir = os.path.join(self.base_model_dir, subfolder)
            
            iso_path = os.path.join(model_dir, "isolation_forest.joblib")
            xgb_path = os.path.join(model_dir, "xgboost_classifier.joblib")
            scaler_path = os.path.join(model_dir, "scaler.joblib")
            le_path = os.path.join(model_dir, "label_encoder.joblib")
            fn_path = os.path.join(model_dir, "feature_names.joblib")
            cat_path = os.path.join(model_dir, "cat_encoders.joblib")

            if os.path.exists(iso_path) and os.path.exists(xgb_path):
                self.models[dataset_name]["iso_forest"] = joblib.load(iso_path)
                self.models[dataset_name]["xgb_model"] = joblib.load(xgb_path)
                self.models[dataset_name]["scaler"] = joblib.load(scaler_path)
                self.models[dataset_name]["label_encoder"] = joblib.load(le_path)
                self.models[dataset_name]["feature_names"] = joblib.load(fn_path)
                
                # Load cat encoders if they exist (for UNSW)
                if os.path.exists(cat_path):
                    self.models[dataset_name]["cat_encoders"] = joblib.load(cat_path)
                
                self.models[dataset_name]["is_loaded"] = True
                logger.info(f"{dataset_name} ML models loaded successfully.")
            else:
                logger.warning(f"{dataset_name} ML models not found in {model_dir}.")
        except Exception as e:
            logger.error(f"Failed to load ML models for {dataset_name}: {e}")

    def compute_risk_score(self, is_anomaly, threat_class, threat_prob):
        """
        Computes a risk score from 0 to 100 based on anomaly status and predicted threat.
        """
        score = 0
        if is_anomaly:
            score += 40
        
        if threat_class != "BENIGN":
            # Add risk based on the probability of the threat
            score += (threat_prob * 60)
            
        return min(max(int(score), 0), 100)

    def predict(self, features_dict, dataset="CICIDS2017"):
        """
        Accepts a dictionary of network features and returns predictions for the specified dataset.
        """
        if dataset not in self.models or not self.models[dataset]["is_loaded"]:
            return {"error": f"Models for {dataset} are not loaded.", "status": "failed"}
            
        model_data = self.models[dataset]
        
        try:
            df = pd.DataFrame([features_dict])
            
            for col in model_data["feature_names"]:
                if col not in df.columns:
                    df[col] = 0.0
            
            X = df[model_data["feature_names"]].copy()
            
            # Handle categorical encoding if required
            if "cat_encoders" in model_data:
                cat_encoders = model_data["cat_encoders"]
                str_cols = ['proto', 'state', 'service']
                for col in str_cols:
                    if col in X.columns:
                        X[col] = X[col].astype(str)
                        X[col] = X[col].map(lambda s: s if s in cat_encoders[col].classes_ else cat_encoders[col].classes_[0])
                        X[col] = cat_encoders[col].transform(X[col])
                        
            # Ensure numeric
            for col in X.columns:
                X[col] = pd.to_numeric(X[col], errors='coerce')
                
            X.replace([np.inf, -np.inf], np.nan, inplace=True)
            X.fillna(0, inplace=True)
            
            X_scaled = model_data["scaler"].transform(X)
            
            # 1. Anomaly Detection (-1 for outliers, 1 for inliers)
            anomaly_pred = model_data["iso_forest"].predict(X_scaled)[0]
            is_anomaly = anomaly_pred == -1
            
            # 2. Threat Classification
            threat_encoded = model_data["xgb_model"].predict(X_scaled)[0]
            threat_class = model_data["label_encoder"].inverse_transform([threat_encoded])[0]
            
            # Get probabilities
            threat_probs = model_data["xgb_model"].predict_proba(X_scaled)[0]
            max_prob = float(np.max(threat_probs))
            
            # 3. Risk Scoring
            risk_score = self.compute_risk_score(is_anomaly, threat_class, max_prob)
            
            return {
                "is_anomaly": bool(is_anomaly),
                "threat_class": threat_class,
                "confidence": max_prob,
                "risk_score": risk_score,
                "status": "success"
            }
        except Exception as e:
            logger.error(f"Prediction error for {dataset}: {e}")
            return {"error": str(e), "status": "failed"}

# Create a singleton instance
ml_service = MLService(base_model_dir=r"e:\NetShield\backend\app\models")
