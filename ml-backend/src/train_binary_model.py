from pathlib import Path

import joblib
import numpy as np

from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
)


# ============================================================
# CONFIG
# ============================================================

DATA_DIR = Path("dataset/processed")
MODEL_DIR = Path("models")

MODEL_FILE = MODEL_DIR / "cybervault_random_forest.pkl"

RANDOM_STATE = 42


# ============================================================
# LOAD PROCESSED DATA
# ============================================================

print("=" * 70)
print("CYBERVAULT — BINARY THREAT DETECTION")
print("=" * 70)

print("\nLoading processed data...")

X_train = np.load(DATA_DIR / "X_train.npy")
X_val = np.load(DATA_DIR / "X_val.npy")
X_test = np.load(DATA_DIR / "X_test.npy")

y_train = np.load(DATA_DIR / "y_train.npy")
y_val = np.load(DATA_DIR / "y_val.npy")
y_test = np.load(DATA_DIR / "y_test.npy")


print("\nDataset shapes:")
print(f"X_train: {X_train.shape}")
print(f"X_val:   {X_val.shape}")
print(f"X_test:  {X_test.shape}")


# ============================================================
# TRAIN RANDOM FOREST
# ============================================================

print("\n" + "=" * 70)
print("TRAINING RANDOM FOREST")
print("=" * 70)

model = RandomForestClassifier(
    n_estimators=200,
    max_depth=None,
    min_samples_split=2,
    min_samples_leaf=1,
    max_features="sqrt",
    class_weight="balanced",
    random_state=RANDOM_STATE,
    n_jobs=-1
)

print("\nTraining...")
print("This may take some time on the first run.")

model.fit(
    X_train,
    y_train
)

print("Training complete!")


# ============================================================
# VALIDATION
# ============================================================

print("\n" + "=" * 70)
print("VALIDATION RESULTS")
print("=" * 70)

y_val_pred = model.predict(X_val)
y_val_prob = model.predict_proba(X_val)[:, 1]

val_accuracy = accuracy_score(
    y_val,
    y_val_pred
)

val_precision = precision_score(
    y_val,
    y_val_pred,
    zero_division=0
)

val_recall = recall_score(
    y_val,
    y_val_pred,
    zero_division=0
)

val_f1 = f1_score(
    y_val,
    y_val_pred,
    zero_division=0
)

val_auc = roc_auc_score(
    y_val,
    y_val_prob
)


print(f"\nAccuracy : {val_accuracy:.4f}")
print(f"Precision: {val_precision:.4f}")
print(f"Recall   : {val_recall:.4f}")
print(f"F1 Score : {val_f1:.4f}")
print(f"ROC-AUC  : {val_auc:.4f}")


print("\nClassification Report:")
print(
    classification_report(
        y_val,
        y_val_pred,
        target_names=["BENIGN", "ATTACK"],
        zero_division=0
    )
)


print("Confusion Matrix:")
print(
    confusion_matrix(
        y_val,
        y_val_pred
    )
)


# ============================================================
# FINAL TEST EVALUATION
# ============================================================

print("\n" + "=" * 70)
print("FINAL TEST RESULTS")
print("=" * 70)

y_test_pred = model.predict(X_test)
y_test_prob = model.predict_proba(X_test)[:, 1]

test_accuracy = accuracy_score(
    y_test,
    y_test_pred
)

test_precision = precision_score(
    y_test,
    y_test_pred,
    zero_division=0
)

test_recall = recall_score(
    y_test,
    y_test_pred,
    zero_division=0
)

test_f1 = f1_score(
    y_test,
    y_test_pred,
    zero_division=0
)

test_auc = roc_auc_score(
    y_test,
    y_test_prob
)


print(f"\nAccuracy : {test_accuracy:.4f}")
print(f"Precision: {test_precision:.4f}")
print(f"Recall   : {test_recall:.4f}")
print(f"F1 Score : {test_f1:.4f}")
print(f"ROC-AUC  : {test_auc:.4f}")


print("\nClassification Report:")
print(
    classification_report(
        y_test,
        y_test_pred,
        target_names=["BENIGN", "ATTACK"],
        zero_division=0
    )
)


print("Confusion Matrix:")
print(
    confusion_matrix(
        y_test,
        y_test_pred
    )
)


# ============================================================
# FEATURE IMPORTANCE
# ============================================================

print("\n" + "=" * 70)
print("TOP 20 IMPORTANT FEATURES")
print("=" * 70)

feature_names = joblib.load(
    DATA_DIR / "feature_names.pkl"
)

importance = model.feature_importances_

feature_importance = sorted(
    zip(feature_names, importance),
    key=lambda x: x[1],
    reverse=True
)

for rank, (feature, score) in enumerate(
    feature_importance[:20],
    start=1
):
    print(
        f"{rank:2}. {feature:<35} {score:.6f}"
    )


# ============================================================
# SAVE MODEL
# ============================================================

MODEL_DIR.mkdir(
    parents=True,
    exist_ok=True
)

joblib.dump(
    model,
    MODEL_FILE
)


print("\n" + "=" * 70)
print("MODEL SAVED")
print("=" * 70)

print(f"\nModel:")
print(MODEL_FILE)

print("\nCyberVault binary detector is ready.")


# ============================================================
# SUMMARY
# ============================================================

print("\n" + "=" * 70)
print("SUMMARY")
print("=" * 70)

print(f"""
Test Accuracy : {test_accuracy:.4f}
Test Precision: {test_precision:.4f}
Test Recall   : {test_recall:.4f}
Test F1       : {test_f1:.4f}
Test ROC-AUC   : {test_auc:.4f}
""")