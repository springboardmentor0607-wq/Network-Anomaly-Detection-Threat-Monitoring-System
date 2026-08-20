import pandas as pd
import joblib
import os

from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import accuracy_score, classification_report


DATASET_PATH = "../datasets/CICIDS2017/cleaned_CICIDS2017.csv"


print("Loading dataset...")

df = pd.read_csv(
    DATASET_PATH,
    low_memory=False
)


# Remove spaces in column names

df.columns = df.columns.str.strip()


print(df["Label"].value_counts())


# Select important network features

features = [
    "Destination Port",
    "Flow Duration",
    "Total Fwd Packets",
    "Total Backward Packets",
    "Total Length of Fwd Packets",
    "Total Length of Bwd Packets",
    "Flow Bytes/s",
    "Flow Packets/s"
]


X = df[features]

# Replace infinity values

X = X.replace([float("inf"), float("-inf")], 0)


# Remove missing values

X = X.fillna(0)


y = df["Label"]


# Encode attack names

encoder = LabelEncoder()

y_encoded = encoder.fit_transform(y)

print("Checking infinity values...")
print(X.isin([float("inf"), float("-inf")]).sum())

print("Missing values:")
print(X.isnull().sum())


# Split dataset

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y_encoded,
    test_size=0.2,
    random_state=42
)


print("Training classifier...")


model = RandomForestClassifier(
    n_estimators=100,
    random_state=42
)


model.fit(
    X_train,
    y_train
)


# Evaluation

prediction = model.predict(X_test)


accuracy = accuracy_score(
    y_test,
    prediction
)


print("\nAccuracy:", accuracy)

print(
    classification_report(
        y_test,
        prediction,
        target_names=encoder.classes_
    )
)


# Save model

os.makedirs(
    "saved_models",
    exist_ok=True
)


joblib.dump(
    model,
    "saved_models/attack_classifier.pkl"
)


joblib.dump(
    encoder,
    "saved_models/attack_label_encoder.pkl"
)


print("\nThreat classifier saved successfully!")