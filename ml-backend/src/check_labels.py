import pandas as pd
from pathlib import Path

DATASET_DIR = Path("dataset/MachineLearningCVE")

files = list(DATASET_DIR.glob("*.csv"))

print("\nCIC-IDS2017 LABEL SUMMARY")
print("=" * 60)

all_labels = {}

for file in files:
    print(f"\n📄 {file.name}")

    df = pd.read_csv(
        file,
        usecols=[" Label"]
    )

    df[" Label"] = df[" Label"].astype(str).str.strip()

    counts = df[" Label"].value_counts()

    for label, count in counts.items():
        all_labels[label] = all_labels.get(label, 0) + count
        print(f"   {label}: {count:,}")

print("\n" + "=" * 60)
print("TOTAL DATASET LABELS")
print("=" * 60)

for label, count in sorted(
    all_labels.items(),
    key=lambda x: x[1],
    reverse=True
):
    print(f"{label:30} {count:,}")

print(f"\nTotal records: {sum(all_labels.values()):,}")