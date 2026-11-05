import os
import joblib
import numpy as np
import pandas as pd

from risk_engine import generate_security_alert


BASE_DIR = os.path.dirname(
    os.path.dirname(os.path.abspath(__file__))
)

MODELS_DIR = os.path.join(BASE_DIR, "models")
PROCESSED_DIR = os.path.join(BASE_DIR, "dataset", "processed")


# Binary model
binary_model = joblib.load(
    os.path.join(
        MODELS_DIR,
        "cybervault_random_forest.pkl"
    )
)

binary_imputer = joblib.load(
    os.path.join(
        PROCESSED_DIR,
        "imputer.pkl"
    )
)

binary_scaler = joblib.load(
    os.path.join(
        PROCESSED_DIR,
        "scaler.pkl"
    )
)

binary_features = joblib.load(
    os.path.join(
        PROCESSED_DIR,
        "feature_names.pkl"
    )
)


# Multiclass model
multiclass_model = joblib.load(
    os.path.join(
        MODELS_DIR,
        "cybervault_multiclass_random_forest.pkl"
    )
)

multiclass_imputer = joblib.load(
    os.path.join(
        MODELS_DIR,
        "multiclass_imputer.pkl"
    )
)

multiclass_features = joblib.load(
    os.path.join(
        MODELS_DIR,
        "multiclass_feature_names.pkl"
    )
)

label_encoder = joblib.load(
    os.path.join(
        MODELS_DIR,
        "attack_label_encoder.pkl"
    )
)
# --------------------------------------------------
# PREDICTION FUNCTION
# --------------------------------------------------

def predict_flow(flow_data):

    df = flow_data.copy()
    df.columns = df.columns.str.strip()

    results = []

    # ================================
    # BINARY THREAT DETECTION
    # ================================

    X_binary = df.reindex(columns=binary_features)

    X_binary = X_binary.apply(
        pd.to_numeric,
        errors="coerce"
    )

    X_binary = X_binary.replace(
        [np.inf, -np.inf],
        np.nan
    )

    X_binary = binary_imputer.transform(X_binary)
    X_binary = binary_scaler.transform(X_binary)

    binary_prediction = binary_model.predict(X_binary)
    binary_probability = binary_model.predict_proba(X_binary)

    # ================================
    # PROCESS EACH FLOW
    # ================================

    for i in range(len(df)):

        threat_prediction = int(binary_prediction[i])

        binary_confidence = float(
            binary_probability[i][threat_prediction]
        )

        # ================================
        # BENIGN
        # ================================

        if threat_prediction == 0:

            alert = generate_security_alert(
                threat="BENIGN",
                attack_type=None,
                confidence=binary_confidence
            )

            alert["binary_confidence"] = round(
                binary_confidence,
                4
            )

            results.append(alert)

            continue

        # ================================
        # ATTACK CLASSIFICATION
        # ================================

        current_row = df.iloc[[i]]

        X_multi = current_row.reindex(
            columns=multiclass_features
        )

        X_multi = X_multi.apply(
            pd.to_numeric,
            errors="coerce"
        )

        X_multi = X_multi.replace(
            [np.inf, -np.inf],
            np.nan
        )

        X_multi = multiclass_imputer.transform(
            X_multi
        )

        multiclass_prediction = (
            multiclass_model.predict(X_multi)
        )

        multiclass_probabilities = (
            multiclass_model.predict_proba(X_multi)
        )

        predicted_class = multiclass_prediction[0]

        attack_confidence = float(
            np.max(multiclass_probabilities[0])
        )

        attack_type = label_encoder.inverse_transform(
            [predicted_class]
        )[0]

        # ================================
        # FLOW INFORMATION
        # ================================

        flow_packets = None

        if "Total Fwd Packets" in df.columns:

            value = df.iloc[i]["Total Fwd Packets"]

            if pd.notna(value):
                flow_packets = float(value)

        # ================================
        # RISK ENGINE
        # ================================

        alert = generate_security_alert(
            threat="ATTACK",
            attack_type=attack_type,
            confidence=attack_confidence,
            flow_packets=flow_packets
        )

        alert["binary_confidence"] = round(
            binary_confidence,
            4
        )

        results.append(alert)

    return results


# --------------------------------------------------
# TEST THE COMPLETE PIPELINE
# --------------------------------------------------

if __name__ == "__main__":

    print("\n" + "=" * 60)
    print("CYBERVAULT INTELLIGENT THREAT DETECTION")
    print("=" * 60)

    dataset_path = os.path.join(
        BASE_DIR,
        "dataset",
        "cybervault_training.csv"
    )

    print("\nLoading training dataset...")

    df = pd.read_csv(dataset_path)

    print(f"Dataset loaded: {df.shape}")

    # Select one known attack example
    attack_rows = df[
        df["Threat"].astype(str).str.upper() == "ATTACK"
    ]

    sample = attack_rows.iloc[[0]]

    print("\nRunning sample through pipeline...")

    result = predict_flow(sample)

    print("\n" + "-" * 60)
    print("CYBERVAULT SECURITY ALERT")
    print("-" * 60)

    for key, value in result[0].items():
        print(f"{key}: {value}")

    print("-" * 60)
    print("Pipeline execution completed.")
    print("=" * 60)
