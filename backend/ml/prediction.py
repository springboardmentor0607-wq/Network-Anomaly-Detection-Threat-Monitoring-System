import numpy as np
import pandas as pd
from ml.risk_scoring import calculate_risk_and_severity

def predict_network_traffic(model, label_encoder, X):
    """
    Executes Random Forest classification and risk scoring on preprocessed features X.
    Returns structured prediction results.
    """
    if model is None or label_encoder is None:
        raise ValueError("AI Model or Label Encoder is not initialized.")
    
    # Handle DataFrame vs array
    if isinstance(X, pd.DataFrame):
        X_input = X.values
    else:
        X_input = X
        
    raw_preds = model.predict(X_input)
    
    # Check if model supports predict_proba
    confidences = []
    if hasattr(model, 'predict_proba'):
        probas = model.predict_proba(X_input)
        confidences = np.max(probas, axis=1).tolist()
    else:
        confidences = [1.0] * len(raw_preds)
    
    # Decode predicted class labels
    if hasattr(label_encoder, 'inverse_transform'):
        predicted_labels = label_encoder.inverse_transform(raw_preds)
    else:
        predicted_labels = raw_preds.astype(str)
    
    results = []
    for label, conf in zip(predicted_labels, confidences):
        label_str = str(label).strip()
        risk_score, severity = calculate_risk_and_severity(label_str)
        results.append({
            'predicted_label': label_str,
            'confidence': round(float(conf), 4),
            'risk_score': risk_score,
            'severity': severity
        })
    
    return results
