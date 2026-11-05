from pathlib import Path

import joblib
import numpy as np
import pandas as pd

from sklearn.model_selection import train_test_split
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler


# ============================================================
# CONFIG
# ============================================================

INPUT_FILE = Path("dataset/cybervault_training.csv")
OUTPUT_DIR = Path("dataset/processed")

RANDOM_STATE = 42


# ============================================================
# LOAD DATA
# ============================================================

print("=" * 70)
print("CYBERVAULT DATA PREPROCESSING")
print("=" * 70)

print("\nLoading dataset...")

df = pd.read_csv(INPUT_FILE)

print(f"Dataset shape: {df.shape}")


# ============================================================
# CLEAN COLUMN NAMES
# ============================================================

df.columns = df.columns.str.strip()


# ============================================================
# CHECK REQUIRED COLUMNS
# ============================================================

required_columns = [
    "Label",
    "Threat",
    "AttackType"
]

for column in required_columns:
    if column not in df.columns:
        raise ValueError(
            f"Required column '{column}' not found."
        )


# ============================================================
# REMOVE UNNECESSARY LABEL COLUMNS FROM FEATURES
# ============================================================

# Label and AttackType are target/information columns.
# Keeping them as features would cause data leakage.

X = df.drop(
    columns=["Label", "Threat", "AttackType"]
)

# Binary target:
# BENIGN = 0
# ATTACK = 1

y = (
    df["Threat"]
    .map({
        "BENIGN": 0,
        "ATTACK": 1
    })
)


# ============================================================
# VERIFY TARGET
# ============================================================

if y.isna().any():
    raise ValueError(
        "Target contains unknown Threat values."
    )

print("\nTarget distribution:")
print(
    y.value_counts()
    .sort_index()
    .rename(index={
        0: "BENIGN",
        1: "ATTACK"
    })
)


# ============================================================
# CONVERT FEATURES TO NUMERIC
# ============================================================

print("\nConverting features to numeric...")

X = X.apply(
    pd.to_numeric,
    errors="coerce"
)


# ============================================================
# HANDLE INFINITY
# ============================================================

X = X.replace(
    [np.inf, -np.inf],
    np.nan
)


# ============================================================
# REMOVE COMPLETELY EMPTY COLUMNS
# ============================================================

empty_columns = X.columns[
    X.isna().all()
].tolist()

if empty_columns:
    print("\nRemoving completely empty columns:")
    for column in empty_columns:
        print(f"  - {column}")

    X = X.drop(columns=empty_columns)


print(
    f"\nFeatures remaining: {X.shape[1]}"
)


# ============================================================
# TRAIN / VALIDATION / TEST SPLIT
# ============================================================

print("\nCreating train/validation/test split...")

# First:
# 80% train
# 20% temporary

X_train, X_temp, y_train, y_temp = train_test_split(
    X,
    y,
    test_size=0.20,
    random_state=RANDOM_STATE,
    stratify=y
)

# Then divide temporary set:
# 10% validation
# 10% test

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

print("\nFitting missing-value imputer on training data...")

imputer = SimpleImputer(
    strategy="median"
)

X_train = imputer.fit_transform(X_train)

X_val = imputer.transform(X_val)

X_test = imputer.transform(X_test)


# ============================================================
# SCALING
# ============================================================

print("Fitting scaler on training data...")

scaler = StandardScaler()

X_train = scaler.fit_transform(X_train)

X_val = scaler.transform(X_val)

X_test = scaler.transform(X_test)


# ============================================================
# CREATE OUTPUT DIRECTORY
# ============================================================

OUTPUT_DIR.mkdir(
    parents=True,
    exist_ok=True
)


# ============================================================
# SAVE PROCESSED DATA
# ============================================================

print("\nSaving processed datasets...")


np.save(
    OUTPUT_DIR / "X_train.npy",
    X_train
)

np.save(
    OUTPUT_DIR / "X_val.npy",
    X_val
)

np.save(
    OUTPUT_DIR / "X_test.npy",
    X_test
)

np.save(
    OUTPUT_DIR / "y_train.npy",
    y_train.to_numpy()
)

np.save(
    OUTPUT_DIR / "y_val.npy",
    y_val.to_numpy()
)

np.save(
    OUTPUT_DIR / "y_test.npy",
    y_test.to_numpy()
)


# ============================================================
# SAVE PREPROCESSING OBJECTS
# ============================================================

joblib.dump(
    imputer,
    OUTPUT_DIR / "imputer.pkl"
)

joblib.dump(
    scaler,
    OUTPUT_DIR / "scaler.pkl"
)

# Save feature names for later API/dashboard use
joblib.dump(
    X.columns.tolist(),
    OUTPUT_DIR / "feature_names.pkl"
)


# ============================================================
# FINAL REPORT
# ============================================================

print("\n" + "=" * 70)
print("PREPROCESSING COMPLETE")
print("=" * 70)

print("\nSaved files:")

for file in sorted(OUTPUT_DIR.iterdir()):
    print(f"  ✓ {file.name}")

print("\nFinal shapes:")

print(f"X_train: {X_train.shape}")
print(f"X_val:   {X_val.shape}")
print(f"X_test:  {X_test.shape}")

print("\nTarget shapes:")

print(f"y_train: {y_train.shape}")
print(f"y_val:   {y_val.shape}")
print(f"y_test:  {y_test.shape}")

print("\nDone!")