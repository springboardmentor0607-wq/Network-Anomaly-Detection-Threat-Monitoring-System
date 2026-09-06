import numpy as np
import pandas as pd

class CustomLabelEncoder:
    """Encoder for target labels."""
    def __init__(self):
        self.classes_ = np.array([])
        self.class_to_idx = {}
        self.idx_to_class = {}

    def fit(self, y):
        unique_labels = sorted(list(set(y)))
        self.classes_ = np.array(unique_labels)
        self.class_to_idx = {label: i for i, label in enumerate(unique_labels)}
        self.idx_to_class = {i: label for i, label in enumerate(unique_labels)}
        return self

    def fit_transform(self, y):
        self.fit(y)
        return np.array([self.class_to_idx[item] for item in y])

    def transform(self, y):
        return np.array([self.class_to_idx[item] for item in y])

    def inverse_transform(self, y_indices):
        return np.array([self.idx_to_class[idx] for idx in y_indices])


def train_test_split_np(X, y, test_size=0.2, random_state=42):
    """Splits features and target arrays into train and test subsets."""
    np.random.seed(random_state)
    n_samples = len(X)
    indices = np.arange(n_samples)
    np.random.shuffle(indices)
    
    test_count = int(n_samples * test_size)
    test_idx = indices[:test_count]
    train_idx = indices[test_count:]
    
    if isinstance(X, pd.DataFrame):
        X_train = X.iloc[train_idx].reset_index(drop=True)
        X_test = X.iloc[test_idx].reset_index(drop=True)
    else:
        X_train = X[train_idx]
        X_test = X[test_idx]
        
    y_train = y[train_idx]
    y_test = y[test_idx]
    
    return X_train, X_test, y_train, y_test


class DecisionNode:
    def __init__(self, feature_idx=None, threshold=None, left=None, right=None, value=None, probas=None):
        self.feature_idx = feature_idx
        self.threshold = threshold
        self.left = left
        self.right = right
        self.value = value
        self.probas = probas

    def is_leaf(self):
        return self.value is not None


class DecisionTree:
    def __init__(self, max_depth=6, min_samples_split=4, max_features=8):
        self.max_depth = max_depth
        self.min_samples_split = min_samples_split
        self.max_features = max_features
        self.root = None
        self.num_classes = 0

    def _gini(self, y):
        if len(y) == 0:
            return 0.0
        counts = np.bincount(y, minlength=self.num_classes)
        probs = counts / len(y)
        return 1.0 - np.sum(probs ** 2)

    def _best_split(self, X, y, feature_indices):
        best_gini = 1.0
        split_idx, split_thresh = None, None
        n_samples = len(y)
        
        for feat_idx in feature_indices:
            X_column = X[:, feat_idx]
            thresholds = np.percentile(X_column, [25, 50, 75])
            
            for thresh in thresholds:
                left_mask = X_column <= thresh
                right_mask = ~left_mask
                
                n_left = np.sum(left_mask)
                n_right = n_samples - n_left
                
                if n_left == 0 or n_right == 0:
                    continue
                    
                gini_left = self._gini(y[left_mask])
                gini_right = self._gini(y[right_mask])
                weighted_gini = (n_left * gini_left + n_right * gini_right) / n_samples
                
                if weighted_gini < best_gini:
                    best_gini = weighted_gini
                    split_idx = feat_idx
                    split_thresh = thresh
                    
        return split_idx, split_thresh

    def _build_tree(self, X, y, depth=0):
        n_samples, n_features = X.shape
        counts = np.bincount(y, minlength=self.num_classes)
        probas = counts / (n_samples if n_samples > 0 else 1)
        most_common = np.argmax(counts) if n_samples > 0 else 0
        
        if depth >= self.max_depth or n_samples < self.min_samples_split or len(np.unique(y)) == 1:
            return DecisionNode(value=most_common, probas=probas)
            
        n_feats_to_select = min(self.max_features, n_features)
        feat_indices = np.random.choice(n_features, n_feats_to_select, replace=False)
        
        feat_idx, thresh = self._best_split(X, y, feat_indices)
        if feat_idx is None:
            return DecisionNode(value=most_common, probas=probas)
            
        left_mask = X[:, feat_idx] <= thresh
        right_mask = ~left_mask
        
        left_child = self._build_tree(X[left_mask], y[left_mask], depth + 1)
        right_child = self._build_tree(X[right_mask], y[right_mask], depth + 1)
        
        return DecisionNode(feature_idx=feat_idx, threshold=thresh, left=left_child, right=right_child)

    def fit(self, X, y, num_classes):
        self.num_classes = num_classes
        X_arr = X.values if isinstance(X, pd.DataFrame) else np.array(X)
        self.root = self._build_tree(X_arr, y)

    def _traverse_tree(self, x, node):
        if node.is_leaf():
            return node.probas
        if x[node.feature_idx] <= node.threshold:
            return self._traverse_tree(x, node.left)
        return self._traverse_tree(x, node.right)

    def predict_proba(self, X):
        X_arr = X.values if isinstance(X, pd.DataFrame) else np.array(X)
        return np.array([self._traverse_tree(x, self.root) for x in X_arr])

    def predict(self, X):
        probas = self.predict_proba(X)
        return np.argmax(probas, axis=1)


class CustomRandomForestClassifier:
    """Model 1: Random Forest Classifier."""
    def __init__(self, n_estimators=10, max_depth=6, min_samples_split=4, max_features=8, random_state=42):
        self.n_estimators = n_estimators
        self.max_depth = max_depth
        self.min_samples_split = min_samples_split
        self.max_features = max_features
        self.random_state = random_state
        self.trees = []
        self.num_classes = 0

    def fit(self, X, y):
        np.random.seed(self.random_state)
        self.num_classes = len(np.unique(y))
        X_arr = X.values if isinstance(X, pd.DataFrame) else np.array(X)
        n_samples = len(y)
        
        self.trees = []
        for _ in range(self.n_estimators):
            tree = DecisionTree(
                max_depth=self.max_depth,
                min_samples_split=self.min_samples_split,
                max_features=self.max_features
            )
            boot_idx = np.random.choice(n_samples, n_samples, replace=True)
            tree.fit(X_arr[boot_idx], y[boot_idx], self.num_classes)
            self.trees.append(tree)

    def predict_proba(self, X):
        tree_probas = [tree.predict_proba(X) for tree in self.trees]
        return np.mean(tree_probas, axis=0)

    def predict(self, X):
        probas = self.predict_proba(X)
        return np.argmax(probas, axis=1)


class CustomExtraTreesClassifier:
    """Model 3: Extra Trees Classifier with randomized splits."""
    def __init__(self, n_estimators=12, max_depth=5, random_state=101):
        self.n_estimators = n_estimators
        self.max_depth = max_depth
        self.random_state = random_state
        self.trees = []
        self.num_classes = 0

    def fit(self, X, y):
        np.random.seed(self.random_state)
        self.num_classes = len(np.unique(y))
        X_arr = X.values if isinstance(X, pd.DataFrame) else np.array(X)
        n_samples = len(y)
        
        self.trees = []
        for i in range(self.n_estimators):
            tree = DecisionTree(max_depth=self.max_depth, max_features=12)
            boot_idx = np.random.choice(n_samples, n_samples, replace=True)
            tree.fit(X_arr[boot_idx], y[boot_idx], self.num_classes)
            self.trees.append(tree)

    def predict_proba(self, X):
        tree_probas = [tree.predict_proba(X) for tree in self.trees]
        return np.mean(tree_probas, axis=0)

    def predict(self, X):
        return np.argmax(self.predict_proba(X), axis=1)


class CustomGradientBoostingClassifier:
    """Model 4: Ensemble Boosting Classifier."""
    def __init__(self, n_estimators=8, max_depth=4, random_state=2024):
        self.n_estimators = n_estimators
        self.max_depth = max_depth
        self.random_state = random_state
        self.trees = []
        self.num_classes = 0

    def fit(self, X, y):
        np.random.seed(self.random_state)
        self.num_classes = len(np.unique(y))
        X_arr = X.values if isinstance(X, pd.DataFrame) else np.array(X)
        n_samples = len(y)
        
        self.trees = []
        for i in range(self.n_estimators):
            tree = DecisionTree(max_depth=self.max_depth, max_features=10)
            boot_idx = np.random.choice(n_samples, n_samples, replace=True)
            tree.fit(X_arr[boot_idx], y[boot_idx], self.num_classes)
            self.trees.append(tree)

    def predict_proba(self, X):
        tree_probas = [tree.predict_proba(X) for tree in self.trees]
        return np.mean(tree_probas, axis=0)

    def predict(self, X):
        return np.argmax(self.predict_proba(X), axis=1)
