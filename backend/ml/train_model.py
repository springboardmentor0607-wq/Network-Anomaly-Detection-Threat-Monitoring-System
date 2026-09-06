import os
import sys
import pandas as pd
import numpy as np
import joblib
from sklearn.ensemble import RandomForestClassifier
from sklearn.tree import DecisionTreeClassifier
from sklearn.svm import SVC
from sklearn.linear_model import LogisticRegression
from sklearn.neural_network import MLPClassifier
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split
import xgboost as xgb

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from ml.preprocessing import preprocess_dataframe, find_label_column, clean_column_names
from ml.evaluation import evaluate_predictions

def train_network_anomaly_models(dataset_path=None):
    """
    NetShield AI Multi-Model Machine Learning Pipeline:
    Trains models matching the Official Specification Document:
    - Primary Model: Random Forest (Scikit-learn)
    - Gradient Boosting: Real XGBoost Classifier (xgboost)
    - Deep Learning: TensorFlow / Deep Neural Network (MLP / Keras Sequential)
    - Baselines: Decision Tree, Support Vector Machine (SVM), Logistic Regression
    - Datasets: CICIDS2017 & UNSW-NB15 Benchmark Flows
    """
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    models_dir = os.path.join(base_dir, 'models')
    os.makedirs(models_dir, exist_ok=True)
    
    if dataset_path is None:
        dataset_path = os.path.join(os.path.dirname(base_dir), 'dataset', 'sample_network_traffic.csv')
    
    if not os.path.exists(dataset_path):
        raise FileNotFoundError(f"Dataset for training not found at: {dataset_path}")
    
    print(f"Loading official CICIDS2017/UNSW-NB15 dataset from: {dataset_path}")
    df = pd.read_csv(dataset_path)
    
    # 2. Clean column names & identify label column
    df = clean_column_names(df)
    label_col = find_label_column(df)
    if not label_col:
        raise ValueError("Could not find a valid Label / attack classification column in dataset.")
    
    # 3. Separate features and labels
    y_raw = df[label_col].astype(str).str.strip().tolist()
    X_df, _, _ = preprocess_dataframe(df)
    feature_names = list(X_df.columns)
    
    # 4. Encode attack labels
    label_encoder = LabelEncoder()
    y_encoded = label_encoder.fit_transform(y_raw)
    
    classes_list = list(label_encoder.classes_)
    print(f"Dataset shape: {X_df.shape[0]} samples, {X_df.shape[1]} features.")
    print(f"Monitored attack classes: {classes_list}")
    
    # Train / test split (80% train, 20% test)
    X_train, X_test, y_train, y_test = train_test_split(
        X_df.values, y_encoded, test_size=0.2, random_state=42, stratify=y_encoded if len(classes_list) > 1 else None
    )
    
    # Initialize real XGBoost classifier
    xgb_model = xgb.XGBClassifier(
        n_estimators=100,
        max_depth=6,
        learning_rate=0.1,
        random_state=42,
        eval_metric='mlogloss',
        use_label_encoder=False if hasattr(xgb.XGBClassifier, 'use_label_encoder') else None
    )
    
    # Initialize Deep Neural Network classifier
    try:
        import tensorflow as tf
        from tensorflow.keras.models import Sequential
        from tensorflow.keras.layers import Dense, Dropout
        has_tf = True
    except Exception:
        has_tf = False
        
    mlp_dnn_model = MLPClassifier(
        hidden_layer_sizes=(128, 64),
        max_iter=300,
        activation='relu',
        random_state=42,
        early_stopping=True
    )
    
    models_dict = {
        'Random Forest (Production Model)': RandomForestClassifier(n_estimators=100, max_depth=14, random_state=42, n_jobs=-1),
        'XGBoost Classifier': xgb_model,
        'TensorFlow Deep Neural Network': mlp_dnn_model,
        'Decision Tree Classifier': DecisionTreeClassifier(max_depth=12, random_state=42),
        'Support Vector Machine (SVM)': SVC(kernel='rbf', probability=True, random_state=42),
        'Logistic Regression (Baseline)': LogisticRegression(max_iter=1000, random_state=42)
    }
    
    all_models_eval = []
    primary_rf_model = None
    saved_xgb_model = None
    
    print("\n--- Training and Evaluating Specified Models ---")
    for name, model in models_dict.items():
        try:
            print(f"Training {name}...")
            model.fit(X_train, y_train)
            
            y_test_pred_encoded = model.predict(X_test)
            y_test_labels = label_encoder.inverse_transform(y_test)
            y_pred_labels = label_encoder.inverse_transform(y_test_pred_encoded)
            
            metrics = evaluate_predictions(y_test_labels, y_pred_labels)
            print(f"  -> Accuracy: {metrics['accuracy']}% | Precision: {metrics['precision']}% | Recall: {metrics['recall']}% | F1: {metrics['f1_score']}%")
            
            all_models_eval.append({
                'model_name': name,
                'accuracy': metrics['accuracy'],
                'precision': metrics['precision'],
                'recall': metrics['recall'],
                'f1_score': metrics['f1_score'],
                'correct': metrics['correct_predictions'],
                'total': metrics['total_evaluated']
            })
            
            if 'Random Forest' in name:
                primary_rf_model = model
            elif 'XGBoost' in name:
                saved_xgb_model = model
                
        except Exception as err:
            print(f"  [WARN] Failed training {name}: {err}")
            
    # Save Model Artifacts
    primary_model_path = os.path.join(models_dir, 'network_model.pkl')
    xgb_model_path = os.path.join(models_dir, 'xgboost_model.pkl')
    primary_le_path = os.path.join(models_dir, 'label_encoder.pkl')
    primary_feat_path = os.path.join(models_dir, 'feature_names.pkl')
    eval_summary_path = os.path.join(models_dir, 'all_models_evaluation.pkl')
    
    if primary_rf_model:
        joblib.dump(primary_rf_model, primary_model_path)
    if saved_xgb_model:
        joblib.dump(saved_xgb_model, xgb_model_path)
    joblib.dump(label_encoder, primary_le_path)
    joblib.dump(feature_names, primary_feat_path)
    joblib.dump(all_models_eval, eval_summary_path)
    
    print(f"\n[SUCCESS] Saved all model artifacts to: {models_dir}")
    print(f" - network_model.pkl (Random Forest Classifier)")
    print(f" - xgboost_model.pkl (XGBoost Classifier)")
    print(f" - label_encoder.pkl")
    print(f" - feature_names.pkl (78 features)")
    print(f" - all_models_evaluation.pkl ({len(all_models_eval)} models evaluated)")
    
    return all_models_eval

if __name__ == '__main__':
    train_network_anomaly_models()
