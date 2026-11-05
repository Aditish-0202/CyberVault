from pathlib import Path

import joblib
import numpy as np
import pandas as pd

from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    f1_score,
)


# ============================================================
# CONFIG
# ============================================================

DATASET_FILE = Path("dataset/cybervault_training.csv")
MODEL_DIR = Path("models")

MODEL_FILE = MODEL_DIR / "cybervault_multiclass_random_forest.pkl"
LABEL_ENCODER_FILE = MODEL_DIR / "attack_label_encoder.pkl"

RANDOM_STATE = 42


# ============================================================
# LOAD DATA
# ============================================================

print("=" * 70)
print("CYBERVAULT — MULTICLASS ATTACK CLASSIFICATION")
print("=" * 70)

print("\nLoading dataset...")

df = pd.read_csv(DATASET_FILE)

df.columns = df.columns.str.strip()

print(f"Dataset shape: {df.shape}")


# ============================================================
# REMOVE BENIGN FLOWS
# ============================================================

print("\nSelecting attack traffic only...")

attack_df = df[
    df["Threat"] == "ATTACK"
].copy()

print(f"Attack samples: {len(attack_df):,}")


# ============================================================
# ATTACK DISTRIBUTION
# ============================================================

print("\nAttack distribution:")

print(
    attack_df["AttackType"]
    .value_counts()
)


# ============================================================
# FEATURES
# ============================================================

# Remove target/information columns.
#
# Label and AttackType directly reveal the answer.
# Threat is also excluded because this is a multiclass
# attack-type model.

DROP_COLUMNS = [
    "Label",
    "Threat",
    "AttackType"
]

X = attack_df.drop(
    columns=DROP_COLUMNS
)

X = X.apply(
    pd.to_numeric,
    errors="coerce"
)

X = X.replace(
    [np.inf, -np.inf],
    np.nan
)


# ============================================================
# REMOVE EMPTY FEATURES
# ============================================================

empty_columns = X.columns[
    X.isna().all()
].tolist()

if empty_columns:

    print("\nRemoving completely empty features:")

    for column in empty_columns:
        print(f"  - {column}")

    X = X.drop(
        columns=empty_columns
    )


# ============================================================
# TARGET
# ============================================================

y = attack_df["AttackType"].astype(str)


# ============================================================
# LABEL ENCODING
# ============================================================

from sklearn.preprocessing import LabelEncoder

label_encoder = LabelEncoder()

y_encoded = label_encoder.fit_transform(y)

print("\nClasses:")

for index, class_name in enumerate(
    label_encoder.classes_
):
    print(
        f"{index:2} -> {class_name}"
    )


# ============================================================
# TRAIN / VALIDATION / TEST SPLIT
# ============================================================

from sklearn.model_selection import train_test_split

print("\nCreating train/validation/test split...")

X_train, X_temp, y_train, y_temp = train_test_split(
    X,
    y_encoded,
    test_size=0.20,
    random_state=RANDOM_STATE,
    stratify=y_encoded
)

X_val, X_test, y_val, y_test = train_test_split(
    X_temp,
    y_temp,
    test_size=0.50,
    random_state=RANDOM_STATE,
    stratify=y_temp
)


print("\nSplit sizes:")

print(f"Train:      {len(X_train):,}")
print(f"Validation: {len(X_val):,}")
print(f"Test:       {len(X_test):,}")


# ============================================================
# IMPUTATION
# ============================================================

from sklearn.impute import SimpleImputer

print("\nFitting imputer...")

imputer = SimpleImputer(
    strategy="median"
)

X_train = imputer.fit_transform(
    X_train
)

X_val = imputer.transform(
    X_val
)

X_test = imputer.transform(
    X_test
)


# ============================================================
# RANDOM FOREST
# ============================================================

print("\n" + "=" * 70)
print("TRAINING MULTICLASS RANDOM FOREST")
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

y_val_pred = model.predict(
    X_val
)

val_accuracy = accuracy_score(
    y_val,
    y_val_pred
)

val_f1 = f1_score(
    y_val,
    y_val_pred,
    average="weighted"
)

print(f"\nAccuracy : {val_accuracy:.4f}")
print(f"F1 Score : {val_f1:.4f}")

print("\nClassification Report:")

print(
    classification_report(
        y_val,
        y_val_pred,
        labels=np.arange(
            len(label_encoder.classes_)
        ),
        target_names=label_encoder.classes_,
        zero_division=0
    )
)


# ============================================================
# FINAL TEST
# ============================================================

print("\n" + "=" * 70)
print("FINAL TEST RESULTS")
print("=" * 70)

y_test_pred = model.predict(
    X_test
)

test_accuracy = accuracy_score(
    y_test,
    y_test_pred
)

test_f1_weighted = f1_score(
    y_test,
    y_test_pred,
    average="weighted"
)

test_f1_macro = f1_score(
    y_test,
    y_test_pred,
    average="macro"
)


print(f"\nAccuracy       : {test_accuracy:.4f}")
print(f"Weighted F1    : {test_f1_weighted:.4f}")
print(f"Macro F1       : {test_f1_macro:.4f}")


print("\nClassification Report:")

print(
    classification_report(
        y_test,
        y_test_pred,
        labels=np.arange(
            len(label_encoder.classes_)
        ),
        target_names=label_encoder.classes_,
        zero_division=0
    )
)


# ============================================================
# CONFUSION MATRIX
# ============================================================

print("\nConfusion Matrix:")

cm = confusion_matrix(
    y_test,
    y_test_pred,
    labels=np.arange(
        len(label_encoder.classes_)
    )
)

cm_df = pd.DataFrame(
    cm,
    index=label_encoder.classes_,
    columns=label_encoder.classes_
)

print(cm_df)


# ============================================================
# FEATURE IMPORTANCE
# ============================================================

print("\n" + "=" * 70)
print("TOP 20 IMPORTANT FEATURES")
print("=" * 70)

feature_names = X.columns.tolist()

importance = model.feature_importances_

feature_importance = sorted(
    zip(feature_names, importance),
    key=lambda item: item[1],
    reverse=True
)

for rank, (feature, score) in enumerate(
    feature_importance[:20],
    start=1
):

    print(
        f"{rank:2}. "
        f"{feature:<35} "
        f"{score:.6f}"
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

joblib.dump(
    label_encoder,
    LABEL_ENCODER_FILE
)

joblib.dump(
    imputer,
    MODEL_DIR / "multiclass_imputer.pkl"
)

joblib.dump(
    feature_names,
    MODEL_DIR / "multiclass_feature_names.pkl"
)


# ============================================================
# SAVE SUMMARY
# ============================================================

results = {
    "accuracy": test_accuracy,
    "weighted_f1": test_f1_weighted,
    "macro_f1": test_f1_macro,
    "classes": label_encoder.classes_.tolist()
}

joblib.dump(
    results,
    MODEL_DIR / "multiclass_results.pkl"
)


# ============================================================
# COMPLETE
# ============================================================

print("\n" + "=" * 70)
print("MULTICLASS MODEL SAVED")
print("=" * 70)

print(f"\nModel:")
print(MODEL_FILE)

print(f"\nLabel encoder:")
print(LABEL_ENCODER_FILE)

print("\nCyberVault attack classifier is ready.")