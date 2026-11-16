#!/usr/bin/env bash
set -euo pipefail

/opt/ml-venv/bin/gunicorn --chdir ml-backend/src --bind 127.0.0.1:5000 --timeout 60 app:app &
ml_pid=$!
node --enable-source-maps artifacts/api-server/dist/index.mjs &
api_pid=$!
trap 'kill -TERM "$ml_pid" "$api_pid" 2>/dev/null || true' EXIT
trap 'exit 0' TERM INT
wait -n "$ml_pid" "$api_pid"
