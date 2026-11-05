import os
import pandas as pd

from cybervault_pipeline import predict_flow
from database import (
    initialize_database,
    save_alert,
    get_alert
)

BASE_DIR = os.path.dirname(
    os.path.dirname(os.path.abspath(__file__))
)

# Load sample network traffic
dataset_path = os.path.join(
    BASE_DIR, "dataset", "cybervault_training.csv"
)

df = pd.read_csv(dataset_path)
df.columns = df.columns.str.strip()

# Use one known attack flow for demonstration
attack_rows = df[
    df["Threat"].astype(str).str.upper() == "ATTACK"
]

if attack_rows.empty:
    raise ValueError("No attack samples found.")

sample = attack_rows.iloc[[0]]

# Predict using actual trained models
print("\n1. RUNNING ML PREDICTION")

results = predict_flow(sample)

for alert in results:
    print("\nPredicted alert:", alert)

    # Save ML-generated alert
    initialize_database()
    alert_id = save_alert(alert)

    print("\n2. SAVED ALERT ID:", alert_id)

    # Verify database record
    saved_alert = get_alert(alert_id)

    print("\n3. RETRIEVED FROM DATABASE")
    print(saved_alert)

print("\nML + RISK + DATABASE TEST COMPLETED")
