import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report
from sklearn.preprocessing import LabelEncoder
import joblib


# Load dataset

data = pd.read_csv(
    "datasets/combined_intrusion_dataset.csv",
    low_memory=False
)

print("Dataset Shape:", data.shape)


# Encode protocol column

encoder = LabelEncoder()

data["protocol"] = encoder.fit_transform(
    data["protocol"]
)


# Separate features and label

X = data.drop("label", axis=1)
y = data["label"]


# Split dataset

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    random_state=42
)


# Model

model = RandomForestClassifier(
    n_estimators=100,
    random_state=42,
    n_jobs=-1
)


print("Training started...")


# Train

model.fit(
    X_train,
    y_train
)


# Test

prediction = model.predict(X_test)


accuracy = accuracy_score(
    y_test,
    prediction
)

print("Accuracy:", accuracy)

print(classification_report(
    y_test,
    prediction
))


# Save model

joblib.dump(
    model,
    "ml/saved_models/intrusion_model.pkl"
)

joblib.dump(
    encoder,
    "ml/saved_models/protocol_encoder.pkl"
)


print("Model saved successfully!")