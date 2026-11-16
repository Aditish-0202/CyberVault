import os
import threading

import joblib
import numpy as np
import pandas as pd

from risk_engine import generate_security_alert


BASE_DIR = os.path.dirname(
    os.path.dirname(os.path.abspath(__file__))
)

# Directories can be overridden for deployments where the artifacts live
# outside the repo (e.g. a mounted volume).
MODELS_DIR = os.environ.get(
    "CYBERVAULT_MODELS_DIR",
    os.path.join(BASE_DIR, "models")
)

PROCESSED_DIR = os.environ.get(
    "CYBERVAULT_PROCESSED_DIR",
    os.path.join(BASE_DIR, "dataset", "processed")
)


# name -> (directory, filename)
ARTIFACTS = {
    "binary_model": (
        MODELS_DIR,
        "cybervault_random_forest.pkl"
    ),
    "binary_imputer": (
        PROCESSED_DIR,
        "imputer.pkl"
    ),
    "binary_scaler": (
        PROCESSED_DIR,
        "scaler.pkl"
    ),
    "binary_features": (
        PROCESSED_DIR,
        "feature_names.pkl"
    ),
    "multiclass_model": (
        MODELS_DIR,
        "cybervault_multiclass_random_forest.pkl"
    ),
    "multiclass_imputer": (
        MODELS_DIR,
        "multiclass_imputer.pkl"
    ),
    "multiclass_features": (
        MODELS_DIR,
        "multiclass_feature_names.pkl"
    ),
    "label_encoder": (
        MODELS_DIR,
        "attack_label_encoder.pkl"
    ),
}


class ModelsUnavailableError(RuntimeError):
    """Raised when the trained artifacts are missing on disk."""

    def __init__(self, missing):
        self.missing = missing

        names = ", ".join(item["name"] for item in missing)

        super().__init__(
            "Trained model artifacts are missing: "
            f"{names}. Place the .pkl files in {MODELS_DIR} "
            f"and {PROCESSED_DIR}."
        )


# Loaded artifacts, populated on first prediction.
_models = {}
_lock = threading.Lock()


def artifact_paths():
    """Return the expected path of every artifact."""

    return {
        name: os.path.join(directory, filename)
        for name, (directory, filename) in ARTIFACTS.items()
    }


def missing_artifacts():
    """List artifacts that are not present on disk."""

    return [
        {"name": name, "path": path}
        for name, path in artifact_paths().items()
        if not os.path.isfile(path)
    ]


def models_available():
    return len(missing_artifacts()) == 0


def load_models(force=False):
    """
    Load every artifact once and cache the result.

    Raises ModelsUnavailableError if any file is missing.
    """

    if _models and not force:
        return _models

    with _lock:

        if _models and not force:
            return _models

        missing = missing_artifacts()

        if missing:
            raise ModelsUnavailableError(missing)

        loaded = {
            name: joblib.load(path)
            for name, path in artifact_paths().items()
        }

        _models.clear()
        _models.update(loaded)

        return _models


def model_status():
    """Summary used by the /health and /model-info endpoints."""

    missing = missing_artifacts()

    return {
        "loaded": len(missing) == 0,
        "models_dir": MODELS_DIR,
        "processed_dir": PROCESSED_DIR,
        "missing": missing,
        "artifacts": sorted(ARTIFACTS.keys()),
    }


# --------------------------------------------------
# PREDICTION FUNCTION
# --------------------------------------------------

def predict_flow(flow_data):

    models = load_models()

    binary_model = models["binary_model"]
    binary_imputer = models["binary_imputer"]
    binary_scaler = models["binary_scaler"]
    binary_features = models["binary_features"]

    multiclass_model = models["multiclass_model"]
    multiclass_imputer = models["multiclass_imputer"]
    multiclass_features = models["multiclass_features"]
    label_encoder = models["label_encoder"]

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

    status = model_status()

    print(f"\nModels directory:    {status['models_dir']}")
    print(f"Processed directory: {status['processed_dir']}")

    if not status["loaded"]:

        print("\nMissing artifacts:")

        for item in status["missing"]:
            print(f"  - {item['path']}")

        print(
            "\nDrop the trained .pkl files in place, "
            "then run this script again."
        )
        raise SystemExit(1)

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
