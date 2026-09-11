import numpy as np
from sklearn.ensemble import RandomForestClassifier

class TwoStageRandomForest:
    """
    Two-Stage Classifier:
    Stage 1: Binary Random Forest (Normal vs Attack)
    Stage 2: Multiclass Random Forest (Categorizes Attack classes only)
    """
    def __init__(self, stage1_params, stage2_params):
        self.stage1_model = RandomForestClassifier(**stage1_params)
        self.stage2_model = RandomForestClassifier(**stage2_params)
        self.target_encoder = None
        self.normal_class_idx = 0
        self.classes_ = None

    def fit(self, X_tr, y_cat_tr, target_encoder):
        self.target_encoder = target_encoder
        self.classes_ = target_encoder.classes_

        normal_labels = [i for i, name in enumerate(self.classes_) if name.lower() == "normal"]
        if normal_labels:
            self.normal_class_idx = normal_labels[0]
        else:
            self.normal_class_idx = 0

        y_stage1 = (y_cat_tr != self.normal_class_idx).astype(int)
        
        print("    [Stage 1] Fitting Binary RF (Normal vs Attack)...")
        self.stage1_model.fit(X_tr, y_stage1)

        attack_mask = (y_stage1 == 1)
        X_tr_attack = X_tr[attack_mask]
        y_tr_attack = y_cat_tr[attack_mask]

        print(f"    [Stage 2] Fitting Attack Multiclass RF on {len(X_tr_attack)} attack records...")
        self.stage2_model.fit(X_tr_attack, y_tr_attack)
        return self

    def predict(self, X_eval):
        stage1_preds = self.stage1_model.predict(X_eval)
        stage2_preds = self.stage2_model.predict(X_eval)

        final_preds = np.where(stage1_preds == 0, self.normal_class_idx, stage2_preds)
        return final_preds

    def predict_proba(self, X_eval):
        s1_proba = self.stage1_model.predict_proba(X_eval)
        s2_proba = self.stage2_model.predict_proba(X_eval)
        
        num_samples = len(X_eval)
        num_classes = len(self.classes_)
        combined_proba = np.zeros((num_samples, num_classes))

        stage2_classes = self.stage2_model.classes_

        for i in range(num_samples):
            prob_normal = s1_proba[i, 0] if s1_proba.shape[1] > 1 else 0.5
            prob_attack = s1_proba[i, 1] if s1_proba.shape[1] > 1 else 0.5

            combined_proba[i, self.normal_class_idx] = prob_normal

            for c_idx, s2_cls in enumerate(stage2_classes):
                combined_proba[i, s2_cls] = prob_attack * s2_proba[i, c_idx]

        row_sums = combined_proba.sum(axis=1, keepdims=True)
        row_sums[row_sums == 0] = 1.0
        combined_proba = combined_proba / row_sums
        return combined_proba


class NetShieldTwoModelPipeline:
    """
    NetShield AI Production Two-Model Architecture:
    Model 1: Primary Binary Anomaly Detector (0 = Normal, 1 = Attack) with Decision Thresholding.
    Model 2: Secondary Threat Classifier (Categorizes Attack classes strictly on attack flows).
    """
    def __init__(self, model1_params, model2_params, decision_threshold=0.5):
        self.model1 = RandomForestClassifier(**model1_params)
        self.model2 = RandomForestClassifier(**model2_params)
        self.decision_threshold = decision_threshold
        self.target_encoder = None
        self.classes_ = None

    def fit(self, X_tr_full, y_bin_tr, X_tr_attack, y_cat_attack, target_encoder):
        self.target_encoder = target_encoder
        self.classes_ = getattr(target_encoder, "classes_", np.array([]))

        print("    [Model 1] Training Primary Binary Anomaly Detector (0=Normal, 1=Attack)...")
        self.model1.fit(X_tr_full, y_bin_tr)

        print(f"    [Model 2] Training Secondary Threat Classifier on {len(X_tr_attack)} attack flows...")
        self.model2.fit(X_tr_attack, y_cat_attack)
        return self

    def predict_binary(self, X_eval):
        probas = self.model1.predict_proba(X_eval)
        prob_attack = probas[:, 1] if probas.shape[1] > 1 else probas[:, 0]
        return (prob_attack >= self.decision_threshold).astype(int)

    def predict_binary_proba(self, X_eval):
        return self.model1.predict_proba(X_eval)

    def predict_threat(self, X_eval):
        return self.model2.predict(X_eval)

    def predict_threat_proba(self, X_eval):
        return self.model2.predict_proba(X_eval)

    def predict(self, X_eval):
        bin_preds = self.predict_binary(X_eval)
        threat_preds = self.model2.predict(X_eval)
        
        # If bin_preds == 0 -> Normal (class idx matching 'Normal' or 0)
        normal_idx = 0
        if self.target_encoder is not None and hasattr(self.target_encoder, "classes_"):
            for idx, cname in enumerate(self.target_encoder.classes_):
                if str(cname).lower() == "normal":
                    normal_idx = idx
                    break

        final_preds = np.where(bin_preds == 0, normal_idx, threat_preds)
        return final_preds

    def predict_proba(self, X_eval):
        m1_proba = self.model1.predict_proba(X_eval)
        m2_proba = self.model2.predict_proba(X_eval)
        
        num_samples = len(X_eval)
        num_classes = len(self.classes_) if self.classes_ is not None and len(self.classes_) > 0 else 10
        combined_proba = np.zeros((num_samples, num_classes))

        normal_idx = 0
        if self.target_encoder is not None and hasattr(self.target_encoder, "classes_"):
            for idx, cname in enumerate(self.target_encoder.classes_):
                if str(cname).lower() == "normal":
                    normal_idx = idx
                    break

        m2_classes = getattr(self.model2, "classes_", np.arange(num_classes))

        for i in range(num_samples):
            prob_normal = m1_proba[i, 0] if m1_proba.shape[1] > 1 else 0.5
            prob_attack = m1_proba[i, 1] if m1_proba.shape[1] > 1 else 0.5

            combined_proba[i, normal_idx] = prob_normal

            for c_idx, s2_cls in enumerate(m2_classes):
                if s2_cls < num_classes:
                    combined_proba[i, s2_cls] = prob_attack * m2_proba[i, c_idx]

        row_sums = combined_proba.sum(axis=1, keepdims=True)
        row_sums[row_sums == 0] = 1.0
        combined_proba = combined_proba / row_sums
        return combined_proba

