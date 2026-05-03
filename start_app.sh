#!/bin/bash
# Start APS Review Web App
# Port 8081 — does not conflict with ASReview (port 80)

cd /root/APS_Review

# Get API key from .bashrc (needs interactive mode)
export DEEPSEEK_API_KEY=$(bash -l -i -c 'echo $DEEPSEEK_API_KEY' 2>/dev/null)

# System python3 has all deps (fastapi, uvicorn, paper-qa, langchain-deepseek)
# No need for a special venv

if [ -z "$DEEPSEEK_API_KEY" ]; then
    echo "WARNING: DEEPSEEK_API_KEY is not set!"
    echo "Upload will work but queries will fail."
else
    echo "DeepSeek API key: ${DEEPSEEK_API_KEY:0:8}... (len=${#DEEPSEEK_API_KEY})"
fi

echo "Starting APS Review Web App on port 8081..."
exec python3 -m uvicorn app:app --host 0.0.0.0 --port 8081 --log-level info
