import pandas as pd
import joblib


MODEL_PATH = "ml/saved_models/intrusion_model.pkl"

model = joblib.load(MODEL_PATH)


# Load sample from your combined dataset
df = pd.read_csv(
    "datasets/combined_intrusion_dataset.csv"
)


# Take one sample row
sample = df.drop(columns=["label"]).iloc[0:1]


prediction = model.predict(sample)


print("Prediction:")
print(prediction[0])