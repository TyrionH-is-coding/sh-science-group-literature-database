#!/usr/bin/env python3
"""
APS Review Web App — FastAPI Application
===========================================
Two features:
1. PaperQA Query Interface — chat-like Q&A over 196 APS papers
2. Paper Upload Tool — upload PDFs for papers needing manual download

Runs on port 8081 with dark medical/research theme.

Architecture note:
- PaperQA engine initialized in a background thread (not blocking ASGI startup)
- Use /api/health to check if engine is ready
- Query endpoint returns 503 if engine not ready yet
"""

import os
import sys
import json
import glob
import shutil
import logging
from pathlib import Path
from datetime import datetime
from typing import Optional
import threading

import uvicorn
from fastapi import FastAPI, Request, UploadFile, File, Form, HTTPException
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

# ── Configuration ──
UPLOAD_DIR = Path("/root/APS_Review/uploads")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
UPLOAD_METADATA_FILE = UPLOAD_DIR / "uploads_metadata.json"
HOST = "0.0.0.0"
PORT = 8081

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("aps_review_app")

# ── FastAPI App ──
app = FastAPI(
    title="SH Science Group Literature Database",
    description="Literature Review Platform — Powered by AI-assisted PaperQA",
)

# Templates
templates_dir = Path(__file__).parent / "templates"
templates_dir.mkdir(exist_ok=True)
templates = Jinja2Templates(directory=str(templates_dir))


# ── Upload metadata helpers ──
def load_uploads_metadata() -> list[dict]:
    """Load uploaded files metadata from JSON."""
    if UPLOAD_METADATA_FILE.exists():
        try:
            with open(UPLOAD_METADATA_FILE, "r") as f:
                return json.load(f)
        except (json.JSONDecodeError, Exception):
            return []
    return []


def save_uploads_metadata(metadata: list[dict]):
    """Save uploaded files metadata to JSON."""
    with open(UPLOAD_METADATA_FILE, "w") as f:
        json.dump(metadata, f, indent=2)


def get_api_key():
    """Get DeepSeek API key from environment or ~/.bashrc."""
    key = os.environ.get("DEEPSEEK_API_KEY")
    if key:
        return key
    import subprocess
    result = subprocess.run(
        ["bash", "-l", "-i", "-c", "echo $DEEPSEEK_API_KEY"],
        capture_output=True, text=True, timeout=10,
    )
    key = result.stdout.strip()
    if key:
        os.environ["DEEPSEEK_API_KEY"] = key
        return key
    return None


# ── Background engine init ──
_engine_ready = False
_engine_error = None


def _init_engine_background():
    """Initialize PaperQA engine in background thread."""
    global _engine_ready, _engine_error
    try:
        from paperqa_engine import init_engine_sync
        api_key = get_api_key()
        if not api_key:
            _engine_error = "DEEPSEEK_API_KEY not found"
            logger.error(_engine_error)
            return
        logger.info("Initializing PaperQA engine in background thread...")
        init_engine_sync(api_key)
        _engine_ready = True
        logger.info("PaperQA engine initialized successfully!")
    except Exception as e:
        _engine_error = str(e)
        logger.error(f"Failed to initialize PaperQA engine: {e}")


# ── Events: Startup ──
@app.on_event("startup")
async def startup_event():
    """Start PaperQA engine initialization in background thread."""
    logger.info("=" * 60)
    logger.info("  APS Review Web App starting up...")
    logger.info("=" * 60)

    # Start engine init in background thread
    thread = threading.Thread(target=_init_engine_background, daemon=True)
    thread.start()
    logger.info("PaperQA engine initialization started in background thread.")


# ── Routes ──
@app.get("/", response_class=HTMLResponse)
async def index(request: Request):
    """Main page with Query and Upload tabs."""
    return templates.TemplateResponse(request, "index.html")


@app.post("/api/query")
async def api_query(request: Request):
    """Handle PaperQA query."""
    global _engine_ready, _engine_error
    try:
        body = await request.json()
        question = body.get("question", "").strip()
        if not question:
            return JSONResponse(
                status_code=400,
                content={"error": "Question is required"},
            )

        if not _engine_ready:
            msg = "Engine initializing" if not _engine_error else f"Engine error: {_engine_error}"
            return JSONResponse(
                status_code=503,
                content={
                    "error": msg,
                    "health": {
                        "ready": _engine_ready,
                        "docs_count": 0,
                        "texts_count": 0,
                    },
                },
            )

        from paperqa_engine import query as engine_query

        result = await engine_query(question)
        return JSONResponse(content=result)

    except json.JSONDecodeError:
        return JSONResponse(
            status_code=400,
            content={"error": "Invalid JSON body"},
        )
    except Exception as e:
        logger.exception("Query error")
        return JSONResponse(
            status_code=500,
            content={"error": f"Internal error: {str(e)}"},
        )


@app.post("/api/upload")
async def api_upload(
    request: Request,
    file: UploadFile = File(...),
    pmid: str = Form(...),
    uploader_name: str = Form(...),
):
    """Handle PDF upload."""
    if not file.filename:
        return JSONResponse(
            status_code=400,
            content={"error": "No file selected"},
        )

    if not pmid.strip():
        return JSONResponse(
            status_code=400,
            content={"error": "PMID is required"},
        )

    if not uploader_name.strip():
        return JSONResponse(
            status_code=400,
            content={"error": "Uploader name is required"},
        )

    # Save file
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    safe_filename = f"pmid_{pmid}_{timestamp}_{file.filename.replace(' ', '_')}"
    filepath = UPLOAD_DIR / safe_filename

    try:
        content = await file.read()
        with open(filepath, "wb") as f:
            f.write(content)
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"error": f"Failed to save file: {str(e)}"},
        )

    # Save metadata
    metadata = load_uploads_metadata()
    entry = {
        "id": len(metadata) + 1,
        "filename": safe_filename,
        "original_filename": file.filename,
        "pmid": pmid,
        "uploader_name": uploader_name,
        "uploaded_at": datetime.now().isoformat(),
        "file_size": len(content),
        "status": "uploaded",
    }
    metadata.append(entry)
    save_uploads_metadata(metadata)

    logger.info(
        f"Upload: {file.filename} (PMID:{pmid}) by {uploader_name} -> {safe_filename}"
    )

    return JSONResponse(
        content={
            "message": "File uploaded successfully",
            "entry": entry,
        }
    )


@app.get("/api/uploads")
async def api_uploads():
    """Return list of uploaded files with metadata."""
    metadata = load_uploads_metadata()
    # Return most recent first
    metadata.reverse()
    return JSONResponse(content={"uploads": metadata})


@app.get("/api/health")
async def api_health():
    """Health check endpoint."""
    global _engine_ready, _engine_error
    docs_count = 0
    texts_count = 0
    if _engine_ready:
        try:
            from paperqa_engine import check_health
            health = await check_health()
            docs_count = health["docs_count"]
            texts_count = health["texts_count"]
        except Exception:
            pass

    return JSONResponse(
        content={
            "status": "ok",
            "timestamp": datetime.now().isoformat(),
            "engine": {
                "ready": _engine_ready,
                "docs_count": docs_count,
                "texts_count": texts_count,
                "error": _engine_error,
            },
            "uploads_count": len(load_uploads_metadata()),
        }
    )


# ── Entry point ──
if __name__ == "__main__":
    uvicorn.run(
        "app:app",
        host=HOST,
        port=PORT,
        reload=False,
        log_level="info",
    )
