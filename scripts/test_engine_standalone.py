#!/usr/bin/env python3
"""Quick test of init_engine_sync() — run standalone."""
import sys, os, logging
sys.path.insert(0, "/root/APS_Review")

# Get API key
import subprocess
result = subprocess.run(
    ["bash", "-l", "-i", "-c", "echo $DEEPSEEK_API_KEY"],
    capture_output=True, text=True, timeout=10,
)
api_key = result.stdout.strip()
os.environ["DEEPSEEK_API_KEY"] = api_key

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

from paperqa_engine import init_engine_sync
print("STARTING init_engine_sync...")
try:
    docs = init_engine_sync(api_key)
    print(f"DONE! docs={len(docs.docs)}, texts={len(docs.texts)}")
except Exception as e:
    print(f"ERROR: {e}")
    import traceback
    traceback.print_exc()
