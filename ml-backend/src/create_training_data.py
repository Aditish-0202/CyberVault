from pathlib import Path
import pandas as pd
import numpy as np

# ============================================================
# CONFIG
# ============================================================

DATASET_DIR = Path("dataset/MachineLearningCVE")
OUTPUT_FILE = Path("dataset/cybervault_training.csv")

CHUNK_SIZE = 50_000
BENIGN_TARGET = 100_000

# Attack samples to keep from each family.
# Rare attacks are kept instead of artificially duplicating them.
ATTACK_TARGETS = {
    "PortScan": 20_000,
    "DDoS": 20_000,
    "DoS Hulk": 20_000,
    "DoS GoldenEye": 10_000,
    "DoS slowloris": 5_000,
    "DoS Slowhttptest": 5_000,
    "FTP-Patator": 5_000,
    "SSH-Patator": 5_000,
    "Bot": 5_000,

    "Web Attack Brute Force": 2_000,
    "Web Attack XSS": 2_000,

    "Web Attack Sql Injection": 21,
    "Infiltration": 36,
    "Heartbleed": 11,
}

RANDOM_STATE = 42


# ============================================================
# LABEL NORMALIZATION
# ============================================================

def normalize_label(label):
    label = str(label).strip()

    # CIC-IDS2017 sometimes contains encoding artifacts
    replacements = {
        "Web Attack � Brute Force": "Web Attack Brute Force",
        "Web Attack � XSS": "Web Attack XSS",
        "Web Attack � Sql Injection": "Web Attack Sql Injection",
        "Web Attack – Brute Force": "Web Attack Brute Force",
        "Web Attack – XSS": "Web Attack XSS",
        "Web Attack – Sql Injection": "Web Attack Sql Injection",
    }

    return replacements.get(label, label)


def get_attack_family(label):
    label = normalize_label(label)

    if label == "BENIGN":
        return "BENIGN"

    return label


# ============================================================
# STORAGE
# ============================================================

benign_samples = []
attack_samples = {
    label: []
    for label in ATTACK_TARGETS
}

files = sorted(DATASET_DIR.glob("*.csv"))

if not files:
    raise FileNotFoundError(
        f"No CIC-IDS2017 CSV files found in {DATASET_DIR}"
    )

print("=" * 70)
print("CYBERVAULT TRAINING DATA BUILDER")
print("=" * 70)

print(f"\nFound {len(files)} CSV files")

# ============================================================
# READ DATASET IN CHUNKS
# ============================================================

for file_idx, file in enumerate(files, start=1):

    print(f"\n[{file_idx}/{len(files)}] Processing:")
    print(file.name)

    for chunk in pd.read_csv(
        file,
        chunksize=CHUNK_SIZE,
        low_memory=False
    ):

        # Clean column names
        chunk.columns = chunk.columns.str.strip()

        if "Label" not in chunk.columns:
            print("  WARNING: Label column not found")
            continue

        # Clean labels
        chunk["Label"] = chunk["Label"].astype(str).str.strip()
        chunk["Label"] = chunk["Label"].apply(normalize_label)

        # Remove infinite values
        chunk = chunk.replace([np.inf, -np.inf], np.nan)

        # Drop rows containing missing values
        chunk = chunk.dropna()

        # --------------------------------------------------------
        # BENIGN
        # --------------------------------------------------------

        remaining_benign = (
            BENIGN_TARGET - sum(len(x) for x in benign_samples)
        )

        if remaining_benign > 0:

            benign = chunk[chunk["Label"] == "BENIGN"]

            if len(benign) > remaining_benign:
                benign = benign.sample(
                    n=remaining_benign,
                    random_state=RANDOM_STATE
                )

            if len(benign) > 0:
                benign_samples.append(benign)

        # --------------------------------------------------------
        # ATTACK CLASSES
        # --------------------------------------------------------

        for attack_label, target in ATTACK_TARGETS.items():

            current_count = sum(
                len(x) for x in attack_samples[attack_label]
            )

            remaining = target - current_count

            if remaining <= 0:
                continue

            attack = chunk[chunk["Label"] == attack_label]

            if len(attack) > remaining:
                attack = attack.sample(
                    n=remaining,
                    random_state=RANDOM_STATE
                )

            if len(attack) > 0:
                attack_samples[attack_label].append(attack)

    print("  File complete")


# ============================================================
# COMBINE BENIGN
# ============================================================

print("\nCombining samples...")

if benign_samples:
    benign_df = pd.concat(
        benign_samples,
        ignore_index=True
    )
else:
    raise RuntimeError("No BENIGN samples collected.")


# ============================================================
# COMBINE ATTACKS
# ============================================================

attack_frames = []

for label, frames in attack_samples.items():

    if not frames:
        print(f"WARNING: No samples found for {label}")
        continue

    df = pd.concat(frames, ignore_index=True)

    attack_frames.append(df)

    print(f"{label:<30} {len(df):>8,}")


if not attack_frames:
    raise RuntimeError("No attack samples collected.")


attack_df = pd.concat(
    attack_frames,
    ignore_index=True
)


# ============================================================
# CREATE CYBERVAULT LABELS
# ============================================================

benign_df["Threat"] = "BENIGN"
attack_df["Threat"] = "ATTACK"

# Keep original attack family
benign_df["AttackType"] = "BENIGN"
attack_df["AttackType"] = attack_df["Label"]


# ============================================================
# FINAL DATASET
# ============================================================

final_df = pd.concat(
    [benign_df, attack_df],
    ignore_index=True
)

# Shuffle
final_df = final_df.sample(
    frac=1,
    random_state=RANDOM_STATE
).reset_index(drop=True)


# ============================================================
# SAVE
# ============================================================

OUTPUT_FILE.parent.mkdir(
    parents=True,
    exist_ok=True
)

final_df.to_csv(
    OUTPUT_FILE,
    index=False
)


# ============================================================
# REPORT
# ============================================================

print("\n" + "=" * 70)
print("DATASET CREATED")
print("=" * 70)

print(f"\nOutput:")
print(OUTPUT_FILE)

print(f"\nRows:    {len(final_df):,}")
print(f"Columns: {len(final_df.columns)}")

print("\nBinary distribution:")
print(final_df["Threat"].value_counts())

print("\nAttack distribution:")
print(final_df["AttackType"].value_counts())

print("\nDataset shape:")
print(final_df.shape)

print("\nFirst 5 rows:")
print(final_df.head())

print("\nDone!")