#!/usr/bin/env python3
"""FastAPI application for the SH Science Group literature database."""

from __future__ import annotations

import json
import logging
import os
import re
import html
from datetime import datetime
from pathlib import Path
from typing import Any

import uvicorn
from fastapi import FastAPI, File, Form, HTTPException, Request, UploadFile
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates


ROOT = Path(__file__).resolve().parent
CORPUS_DIR = Path(
    os.environ.get("PAPERQA_CORPUS_DIR", ROOT / "paperqa_import" / "high_medium_ready")
).resolve()
UPLOAD_DIR = Path(os.environ.get("PAPER_UPLOAD_DIR", ROOT / "uploads")).resolve()
UPLOAD_METADATA_FILE = Path(
    os.environ.get("PAPER_UPLOAD_METADATA", UPLOAD_DIR / "uploads_metadata.json")
).resolve()
MAX_UPLOAD_BYTES = int(os.environ.get("MAX_UPLOAD_MB", "50")) * 1024 * 1024
HOST = os.environ.get("HOST", "0.0.0.0")
PORT = int(os.environ.get("PORT", "8081"))

UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

logging.basicConfig(
    level=os.environ.get("LOG_LEVEL", "INFO"),
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("literature_app")


app = FastAPI(
    title="SH Science Group Literature Database",
    description="APS literature review workspace with PaperQA-backed question answering.",
)

templates = Jinja2Templates(directory=str(ROOT / "templates"))
app.mount("/static", StaticFiles(directory=str(ROOT / "static")), name="static")


_engine_ready = False
_engine_error: str | None = None


def get_api_key() -> str | None:
    """Read the LLM API key from server-side environment variables only."""
    return os.environ.get("DEEPSEEK_API_KEY") or os.environ.get("PAPERQA_API_KEY")


def parse_frontmatter(text: str) -> tuple[dict[str, str], str]:
    """Parse simple YAML-style key/value frontmatter from prepared Markdown files."""
    if not text.startswith("---"):
        return {}, text

    parts = text.split("---", 2)
    if len(parts) < 3:
        return {}, text

    metadata: dict[str, str] = {}
    for line in parts[1].splitlines():
        if ":" not in line:
            continue
        key, value = line.split(":", 1)
        clean_key = key.strip()
        clean_value = value.strip().strip('"').strip("'")
        if clean_key:
            metadata[clean_key] = clean_value
    return metadata, parts[2].lstrip()


def paper_sort_key(paper: dict[str, Any]) -> tuple[int, str, str]:
    priority_rank = {"high": 0, "medium": 1, "low": 2}
    priority = str(paper.get("priority", "")).lower()
    year = str(paper.get("year", ""))
    return (priority_rank.get(priority, 9), f"{9999 - int(year)}" if year.isdigit() else "9999", paper.get("pmid", ""))


def load_papers() -> list[dict[str, Any]]:
    papers: list[dict[str, Any]] = []
    for path in sorted(CORPUS_DIR.glob("*.md")):
        try:
            text = path.read_text(encoding="utf-8", errors="replace")
        except OSError as exc:
            logger.warning("Could not read %s: %s", path, exc)
            continue

        metadata, body = parse_frontmatter(text)
        pmid = metadata.get("pmid") or path.stem.replace("pmid_", "")
        title = metadata.get("title") or first_heading(body) or path.stem
        abstract = extract_section(body, "Abstract", max_chars=900)
        papers.append(
            {
                "pmid": pmid,
                "paper_id": metadata.get("paper_id", f"pmid:{pmid}"),
                "title": title,
                "authors": metadata.get("authors", ""),
                "year": metadata.get("year", ""),
                "journal": metadata.get("journal", ""),
                "doi": metadata.get("doi", ""),
                "priority": metadata.get("priority", ""),
                "priority_score": metadata.get("priority_score", ""),
                "aps_modules": metadata.get("aps_modules", ""),
                "study_types": metadata.get("study_types", ""),
                "primary_text_source": metadata.get("primary_text_source", ""),
                "knowhere_job_id": metadata.get("knowhere_job_id", ""),
                "abstract": abstract,
                "filename": path.name,
                "bytes": path.stat().st_size,
            }
        )
    return sorted(papers, key=paper_sort_key)


def first_heading(body: str) -> str:
    for line in body.splitlines():
        if line.startswith("# "):
            return line[2:].strip()
    return ""


def extract_section(body: str, heading: str, max_chars: int = 2000) -> str:
    pattern = re.compile(rf"^##\s+{re.escape(heading)}\s*$", re.IGNORECASE | re.MULTILINE)
    match = pattern.search(body)
    if not match:
        return ""
    rest = body[match.end() :].lstrip()
    next_heading = re.search(r"^##\s+", rest, re.MULTILINE)
    section = rest[: next_heading.start()] if next_heading else rest
    return re.sub(r"\s+", " ", section).strip()[:max_chars]


def get_paper_by_pmid(pmid: str) -> dict[str, Any]:
    safe_pmid = re.sub(r"\D", "", pmid)
    path = CORPUS_DIR / f"pmid_{safe_pmid}.md"
    if not safe_pmid or not path.exists():
        raise HTTPException(status_code=404, detail="Paper not found")

    text = path.read_text(encoding="utf-8", errors="replace")
    metadata, body = parse_frontmatter(text)
    return {
        "metadata": metadata,
        "body_preview": body[:8000],
        "body": body,
        "filename": path.name,
        "bytes": path.stat().st_size,
    }


def paper_source_url(source_name: str) -> str | None:
    match = re.search(r"pmid[_:\s-]*(\d+)", source_name or "", re.IGNORECASE)
    if not match:
        return None
    return f"/papers/{match.group(1)}"


def load_uploads_metadata() -> list[dict[str, Any]]:
    if not UPLOAD_METADATA_FILE.exists():
        return []
    try:
        return json.loads(UPLOAD_METADATA_FILE.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        logger.warning("Upload metadata file could not be read: %s", UPLOAD_METADATA_FILE)
        return []


def save_uploads_metadata(metadata: list[dict[str, Any]]) -> None:
    UPLOAD_METADATA_FILE.write_text(
        json.dumps(metadata, indent=2, ensure_ascii=False),
        encoding="utf-8",
    )


def safe_upload_name(filename: str, pmid: str) -> str:
    suffix = Path(filename).suffix.lower()
    base = Path(filename).stem
    safe_base = re.sub(r"[^A-Za-z0-9._-]+", "_", base).strip("._") or "paper"
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    return f"pmid_{pmid}_{timestamp}_{safe_base}{suffix}"


def init_engine_background() -> None:
    global _engine_ready, _engine_error
    try:
        from paperqa_engine import init_engine_sync

        api_key = get_api_key()
        if not api_key:
            _engine_error = "DEEPSEEK_API_KEY or PAPERQA_API_KEY is not configured"
            logger.error(_engine_error)
            return
        init_engine_sync(api_key=api_key, corpus_dir=CORPUS_DIR)
        _engine_ready = True
        _engine_error = None
    except Exception as exc:  # pragma: no cover - logged for deployment diagnosis
        _engine_error = str(exc)
        logger.exception("Failed to initialize PaperQA engine")


@app.on_event("startup")
async def startup_event() -> None:
    import threading

    logger.info("Starting literature database app")
    logger.info("Corpus directory: %s", CORPUS_DIR)
    logger.info("Upload directory: %s", UPLOAD_DIR)
    thread = threading.Thread(target=init_engine_background, daemon=True)
    thread.start()


@app.get("/", response_class=HTMLResponse)
async def index(request: Request):
    return templates.TemplateResponse(request, "index.html")


@app.get("/papers/{pmid}", response_class=HTMLResponse)
async def paper_page(pmid: str):
    detail = get_paper_by_pmid(pmid)
    metadata = detail["metadata"]
    title = metadata.get("title") or f"PMID {pmid}"
    body = detail["body"]
    fields = [
        ("PMID", metadata.get("pmid", pmid)),
        ("DOI", metadata.get("doi", "")),
        ("Year", metadata.get("year", "")),
        ("Journal", metadata.get("journal", "")),
        ("Priority", metadata.get("priority", "")),
        ("Module", metadata.get("aps_modules", "")),
    ]
    field_html = "".join(
        f"<div><dt>{html.escape(label)}</dt><dd>{html.escape(value or 'missing')}</dd></div>"
        for label, value in fields
    )
    return HTMLResponse(
        f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{html.escape(title)}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;450;500;600;650&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="/static/styles.css">
</head>
<body>
    <main class="article-page">
        <a class="back-link" href="/">Back to workspace</a>
        <article class="article-shell">
            <p class="eyebrow">Original Markdown</p>
            <h1>{html.escape(title)}</h1>
            <dl class="detail-grid">{field_html}</dl>
            <pre class="article-body">{html.escape(body)}</pre>
        </article>
    </main>
</body>
</html>"""
    )


@app.get("/api/health")
async def api_health():
    docs_count = 0
    texts_count = 0
    if _engine_ready:
        try:
            from paperqa_engine import check_health

            health = await check_health()
            docs_count = health["docs_count"]
            texts_count = health["texts_count"]
        except Exception as exc:
            logger.warning("Health check could not read engine stats: %s", exc)

    papers = load_papers()
    return {
        "status": "ok",
        "timestamp": datetime.now().isoformat(),
        "corpus": {
            "directory": str(CORPUS_DIR),
            "papers_count": len(papers),
            "priority_counts": count_by(papers, "priority"),
        },
        "engine": {
            "ready": _engine_ready,
            "error": _engine_error,
            "docs_count": docs_count,
            "texts_count": texts_count,
        },
        "uploads_count": len(load_uploads_metadata()),
    }


@app.get("/api/papers")
async def api_papers():
    papers = load_papers()
    return {
        "papers": papers,
        "summary": {
            "count": len(papers),
            "priority_counts": count_by(papers, "priority"),
            "source_counts": count_by(papers, "primary_text_source"),
            "module_counts": count_multi_value(papers, "aps_modules"),
        },
    }


@app.get("/api/papers/{pmid}")
async def api_paper_detail(pmid: str):
    return get_paper_by_pmid(pmid)


@app.post("/api/paperqa/query")
@app.post("/api/query")
async def api_query(request: Request):
    try:
        body = await request.json()
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON body")

    question = str(body.get("question", "")).strip()
    if not question:
        raise HTTPException(status_code=400, detail="Question is required")

    if not _engine_ready:
        raise HTTPException(
            status_code=503,
            detail={
                "message": "PaperQA engine is not ready",
                "error": _engine_error,
            },
        )

    from paperqa_engine import query as engine_query

    k = int(body.get("k", 10))
    max_sources = int(body.get("max_sources", 5))
    return await engine_query(question=question, k=k, max_sources=max_sources)


@app.post("/api/upload")
async def api_upload(
    file: UploadFile = File(...),
    pmid: str = Form(...),
    uploader_name: str = Form(...),
):
    clean_pmid = re.sub(r"\D", "", pmid)
    if not clean_pmid:
        raise HTTPException(status_code=400, detail="A numeric PMID is required")
    if not uploader_name.strip():
        raise HTTPException(status_code=400, detail="Uploader name is required")
    if not file.filename or Path(file.filename).suffix.lower() != ".pdf":
        raise HTTPException(status_code=400, detail="Only PDF files are accepted")

    safe_name = safe_upload_name(file.filename, clean_pmid)
    destination = UPLOAD_DIR / safe_name
    size = 0

    try:
        with destination.open("wb") as out:
            while chunk := await file.read(1024 * 1024):
                size += len(chunk)
                if size > MAX_UPLOAD_BYTES:
                    out.close()
                    destination.unlink(missing_ok=True)
                    raise HTTPException(status_code=413, detail="PDF exceeds upload size limit")
                out.write(chunk)
    finally:
        await file.close()

    metadata = load_uploads_metadata()
    entry = {
        "id": (max((item.get("id", 0) for item in metadata), default=0) + 1),
        "filename": safe_name,
        "original_filename": file.filename,
        "pmid": clean_pmid,
        "uploader_name": uploader_name.strip(),
        "uploaded_at": datetime.now().isoformat(),
        "file_size": size,
        "status": "uploaded",
    }
    metadata.append(entry)
    save_uploads_metadata(metadata)
    logger.info("Uploaded %s for PMID %s", file.filename, clean_pmid)
    return {"message": "File uploaded successfully", "entry": entry}


@app.get("/api/uploads")
async def api_uploads():
    metadata = sorted(
        load_uploads_metadata(),
        key=lambda item: str(item.get("uploaded_at", "")),
        reverse=True,
    )
    return {"uploads": metadata}


def count_by(rows: list[dict[str, Any]], key: str) -> dict[str, int]:
    counts: dict[str, int] = {}
    for row in rows:
        value = str(row.get(key) or "missing").strip() or "missing"
        counts[value] = counts.get(value, 0) + 1
    return counts


def count_multi_value(rows: list[dict[str, Any]], key: str) -> dict[str, int]:
    counts: dict[str, int] = {}
    for row in rows:
        values = re.split(r"[;|,]\s*", str(row.get(key) or "missing"))
        for value in values:
            clean = value.strip() or "missing"
            counts[clean] = counts.get(clean, 0) + 1
    return counts


if __name__ == "__main__":
    uvicorn.run("app:app", host=HOST, port=PORT, reload=False, log_level="info")
