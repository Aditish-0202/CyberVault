import pandas as pd
from pathlib import Path

DATASET_DIR = Path("dataset")

# Search inside all subfolders
files = list(DATASET_DIR.rglob("*.csv"))

print(f"\nFound {len(files)} CSV files:\n")

for file in files:
    # Ignore the old 72-row summary dataset
    if file.name == "combined.csv":
        continue

    print("=" * 70)
    print(f"📄 {file.name}")

    try:
        # Read only 5 rows for inspection
        df = pd.read_csv(file, nrows=5)

        print(f"   Columns: {len(df.columns)}")
        print(f"   Rows preview: {len(df)}")

        print("\n   Column names:")
        for col in df.columns:
            print(f"      - {col}")

        # Find label column
        label_cols = [
            c for c in df.columns
            if "label" in c.lower()
        ]

        print("\n   Label column(s):", label_cols)

    except Exception as e:
        print(f"   ❌ ERROR: {e}")

print("\nInspection complete.")