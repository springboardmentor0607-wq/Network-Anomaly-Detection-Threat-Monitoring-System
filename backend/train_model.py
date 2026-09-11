print("=" * 60)
print("        NetShield AI - Model Training")
print("=" * 60)

print("\nTraining CICIDS2017 Model...\n")

import app.services.train_cic

print("\nCICIDS2017 Training Completed")

print("\n----------------------------------------")

print("\nTraining UNSW-NB15 Model...\n")

import app.services.train_unsw

print("\nUNSW-NB15 Training Completed")

print("\n========================================")
print("ALL MODELS TRAINED SUCCESSFULLY")
print("========================================")