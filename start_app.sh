#!/bin/bash
set -euo pipefail

cd "$(dirname "$0")"

export HOST="${HOST:-0.0.0.0}"
export PORT="${PORT:-8081}"
export PAPERQA_CORPUS_DIR="${PAPERQA_CORPUS_DIR:-paperqa_import/high_medium_ready}"
export PAPER_UPLOAD_DIR="${PAPER_UPLOAD_DIR:-uploads}"
export MAX_UPLOAD_MB="${MAX_UPLOAD_MB:-50}"

# Load API key from .bashrc (non-interactive shells don't source it)
eval "$(grep -E '^export DEEPSEEK_API_KEY=' ~/.bashrc 2>/dev/null || true)"

if [ -z "${DEEPSEEK_API_KEY:-${PAPERQA_API_KEY:-}}" ]; then
    echo "WARNING: DEEPSEEK_API_KEY or PAPERQA_API_KEY is not set. PaperQA queries will be unavailable."
fi

echo "Starting SH Science Group Literature Database on ${HOST}:${PORT}"
exec python3 -m uvicorn app:app --host "${HOST}" --port "${PORT}" --log-level "${LOG_LEVEL:-info}"
