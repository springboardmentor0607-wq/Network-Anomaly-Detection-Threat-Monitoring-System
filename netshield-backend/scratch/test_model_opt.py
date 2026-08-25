import os
import pandas as pd
import numpy as np
import tensorflow as tf
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.metrics import classification_report, accuracy_score, f1_score, precision_score, recall_score

# Load UNSW-NB15 + CICIDS2017
dataset_dir = "netshield-backend/dataset"
if not os.path.exists(os.path.join(dataset_dir, "UNSW_NB15_training-set.csv")):
    dataset_dir = "dataset"

train_df = pd.read_csv(os.path.join(dataset_dir, "UNSW_NB15_training-set.csv"))
test_df = pd.read_csv(os.path.join(dataset_dir, "UNSW_NB15_testing-set.csv"))

combined_df = pd.concat([train_df, test_df], ignore_index=True)

if "id" in combined_df.columns:
    combined_df.drop(columns=["id"], inplace=True)

combined_df.drop_duplicates(inplace=True)
combined_df.replace([np.inf, -np.inf], np.nan, inplace=True)
combined_df.fillna(0, inplace=True)

combined_df["attack_cat"] = combined_df["attack_cat"].astype(str).str.strip()

y_attack_str = combined_df["attack_cat"].values
X_raw = combined_df.drop(columns=["label", "attack_cat"], errors="ignore")

# One-hot encode key categorical columns
X_raw = pd.get_dummies(X_raw, columns=["proto", "service", "state"], drop_first=False)

# Log transform continuous features
num_cols = [c for c in X_raw.columns if X_raw[c].dtype in [np.float64, np.int64, np.float32, np.int32]]
for col in num_cols:
    X_raw[col] = np.log1p(np.maximum(0, pd.to_numeric(X_raw[col], errors="coerce").fillna(0)))

target_encoder = LabelEncoder()
y_cat = target_encoder.fit_transform(y_attack_str)

scaler = StandardScaler()
X_scaled = scaler.fit_transform(X_raw)

X_train, X_temp, y_train, y_temp = train_test_split(X_scaled, y_cat, test_size=0.3, random_state=42, stratify=y_cat)
X_val, X_test, y_val, y_test = train_test_split(X_temp, y_temp, test_size=0.5, random_state=42, stratify=y_temp)

num_classes = len(target_encoder.classes_)
num_features = X_train.shape[1]

y_train_cat = tf.keras.utils.to_categorical(y_train, num_classes)
y_val_cat = tf.keras.utils.to_categorical(y_val, num_classes)
y_test_cat = tf.keras.utils.to_categorical(y_test, num_classes)

# Deep Neural Network Architecture requested by user
model = tf.keras.models.Sequential([
    tf.keras.layers.Input(shape=(num_features,)),
    tf.keras.layers.Dense(256, activation='relu'),
    tf.keras.layers.BatchNormalization(),
    tf.keras.layers.Dropout(0.3),
    tf.keras.layers.Dense(128, activation='relu'),
    tf.keras.layers.BatchNormalization(),
    tf.keras.layers.Dropout(0.25),
    tf.keras.layers.Dense(64, activation='relu'),
    tf.keras.layers.BatchNormalization(),
    tf.keras.layers.Dropout(0.2),
    tf.keras.layers.Dense(32, activation='relu'),
    tf.keras.layers.Dense(num_classes, activation='softmax')
])

model.compile(
    optimizer=tf.keras.optimizers.Adam(learning_rate=0.001),
    loss='categorical_crossentropy',
    metrics=['accuracy']
)

callbacks = [
    tf.keras.callbacks.EarlyStopping(monitor='val_accuracy', patience=15, restore_best_weights=True),
    tf.keras.callbacks.ReduceLROnPlateau(monitor='val_loss', factor=0.5, patience=4, min_lr=1e-6)
]

print("Training Deep Neural Network model with One-Hot Categoricals...")
history = model.fit(
    X_train, y_train_cat,
    validation_data=(X_val, y_val_cat),
    epochs=50,
    batch_size=256,
    callbacks=callbacks,
    verbose=1
)

y_pred_proba = model.predict(X_test)
y_pred = np.argmax(y_pred_proba, axis=1)

acc = accuracy_score(y_test, y_pred)
prec = precision_score(y_test, y_pred, average='weighted', zero_division=0)
rec = recall_score(y_test, y_pred, average='weighted', zero_division=0)
f1 = f1_score(y_test, y_pred, average='weighted', zero_division=0)

print(f"\nFinal Test Results:\nAccuracy: {acc*100:.2f}%\nPrecision: {prec*100:.2f}%\nRecall: {rec*100:.2f}%\nF1 Score: {f1*100:.2f}%")
