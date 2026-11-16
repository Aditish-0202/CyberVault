# CyberVault ML service

Flask API that classifies network flows with the trained Random Forest models and
stores incidents in SQLite. The Express API server (`artifacts/api-server`) calls
this service and exposes it to the dashboard under `/api/ml/*`.

## 1. Install

Python 3.11+ is required.

```bash
cd ml-backend
python -m venv .venv

# Windows
.venv\Scripts\activate
# macOS / Linux
source .venv/bin/activate

pip install -r requirements-api.txt
```

`requirements.txt` is the full research environment (Jupyter, XGBoost, plots).
Use it only if you plan to retrain models.

## 2. Model files

The trained artifacts live in `ml-backend/models/` (committed) and
`ml-backend/dataset/processed/` (gitignored, because the processed training
arrays are large):

```
ml-backend/
├── models/
│   ├── cybervault_random_forest.pkl           # binary ATTACK / BENIGN
│   ├── cybervault_multiclass_random_forest.pkl
│   ├── multiclass_imputer.pkl
│   ├── multiclass_feature_names.pkl
│   └── attack_label_encoder.pkl
└── dataset/
    └── processed/
        ├── imputer.pkl                        # binary preprocessing
        ├── scaler.pkl                         # binary preprocessing
        └── feature_names.pkl                  # optional: derived from
                                               # multiclass_feature_names.pkl
```

The binary model was trained on **standardized** features, so
`dataset/processed/imputer.pkl` and `dataset/processed/scaler.pkl` are required
before `/predict` can run. The feature list is optional: when `feature_names.pkl`
is absent it is derived from `multiclass_feature_names.pkl` (same 78 CIC-IDS
columns; inputs are reindexed by name).

The service starts even when artifacts are missing and reports exactly which
ones through `/health` and `/model-info`. `POST /predict` answers `503` with the
same list. Artifacts are loaded lazily on the first prediction.

To rebuild the binary preprocessing artifacts from the training CSV:

```bash
cd ml-backend
python src/preprocess_data.py
```

### Retraining (optional)

Training expects the CIC-IDS2017 CSV files in `dataset/MachineLearningCVE/`:

```bash
cd ml-backend
python src/create_training_data.py     # builds dataset/cybervault_training.csv
python src/preprocess_data.py          # writes dataset/processed/*.pkl
python src/train_binary_model.py       # writes models/cybervault_random_forest.pkl
python src/train_multiclass_model.py   # writes the multiclass artifacts
```

All scripts use paths relative to `ml-backend/`, so always run them from there.

## 3. Run

```bash
cd ml-backend
python src/app.py
```

Listens on `http://127.0.0.1:5000`. Check it with:

```bash
curl http://127.0.0.1:5000/health
curl http://127.0.0.1:5000/model-info
```

The service starts **even if the model files are missing**, so the dashboard can
show a useful status instead of "offline":

```json
{
  "status": "online",
  "service": "CyberVault API",
  "models_loaded": false,
  "missing_artifacts": ["binary_model", "binary_scaler", "..."]
}
```

`POST /predict` then answers `503` with the same list of missing files until the
artifacts are in place. Artifacts are loaded lazily on the first prediction.

Override artifact locations (e.g. a mounted volume) with:

```bash
CYBERVAULT_MODELS_DIR=/data/models CYBERVAULT_PROCESSED_DIR=/data/processed python src/app.py
```

## 4. Endpoints

| Method | Path | Purpose |
|---|---|---|
| GET | `/health` | Liveness probe |
| GET | `/model-info` | Loaded model metadata |
| POST | `/predict` | Classify one flow (`{...}` or `{"flow": {...}}`) |
| GET | `/alerts` | All stored incidents |
| GET | `/alerts/<id>` | One incident |
| PUT | `/alerts/<id>/status` | `NEW` / `INVESTIGATING` / `RESOLVED` |

The dashboard does not call this service directly — it calls the Express API
server, which proxies `/api/ml/*` here. That keeps the browser on a single
origin and avoids CORS. Point the API server at a different host with
`ML_SERVICE_URL` in the repo-root `.env`.
