#!/usr/bin/env python3
"""
Knowhere API bridge for PaperQA.

Flow:
  1. User uploads PDF via PaperQA web UI
  2. Server saves PDF, creates Knowhere parsing job with data_id=PMID
  3. If local file: upload PDF to Knowhere presigned URL
  4. Knowhere parses and calls our webhook endpoint
  5. Webhook handler downloads result ZIP, extracts content.md + chunks.json
  6. Saves pmid_{PMID}.md to corpus + updates uploads_metadata with parsing status
  7. App auto-reloads

Configuration (set in environment or .env):
  KNOWHERE_API_KEY=sk-xxx
  KNOWHERE_WEBHOOK_SECRET=whsec_xxx   (secret for verifying webhook callbacks)
  KNOWHERE_MODEL=base|advanced         (default: base)
  KNOWHERE_OCR_ENABLED=true|false      (default: false)
  PAPERQA_BASE_URL=http://localhost:8081  (for self-call to reload)
"""

import hashlib
import hmac
import json
import logging
import os
import re
import shutil
import tempfile
import time
import zipfile
from pathlib import Path
from typing import Any
from urllib.parse import urljoin

import httpx
import yaml

logger = logging.getLogger("knowhere_bridge")

# ── Configuration ──────────────────────────────────────────────────

KNOWHERE_API_KEY = os.environ.get("KNOWHERE_API_KEY", "")
KNOWHERE_WEBHOOK_SECRET = os.environ.get("KNOWHERE_WEBHOOK_SECRET", "")
KNOWHERE_API_BASE = os.environ.get("KNOWHERE_API_BASE", "https://api.knowhereto.ai")
KNOWHERE_MODEL = os.environ.get("KNOWHERE_MODEL", "base")
KNOWHERE_OCR = os.environ.get("KNOWHERE_OCR_ENABLED", "").lower() in ("true", "1", "yes")

# PaperQA paths (same as app.py)
ROOT = Path(__file__).resolve().parent.parent
CORPUS_DIR = Path(os.environ.get("PAPERQA_CORPUS_DIR", ROOT / "paperqa_import" / "high_medium_ready")).resolve()
UPLOAD_DIR = Path(os.environ.get("PAPER_UPLOAD_DIR", ROOT / "uploads")).resolve()
UPLOAD_METADATA_FILE = Path(os.environ.get("PAPER_UPLOAD_METADATA", UPLOAD_DIR / "uploads_metadata.json")).resolve()

# ── Helpers ────────────────────────────────────────────────────────

def _load_uploads_metadata() -> list[dict[str, Any]]:
    if not UPLOAD_METADATA_FILE.exists():
        return []
    try:
        return json.loads(UPLOAD_METADATA_FILE.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        logger.warning("Could not read uploads metadata file")
        return []


def _save_uploads_metadata(metadata: list[dict[str, Any]]) -> None:
    UPLOAD_METADATA_FILE.write_text(
        json.dumps(metadata, indent=2, ensure_ascii=False),
        encoding="utf-8",
    )


def _find_upload_entry(pmid: str) -> dict[str, Any] | None:
    """Find the most recent upload entry for a PMID."""
    meta = _load_uploads_metadata()
    entries = [e for e in meta if e.get("pmid") == pmid and e.get("status") == "uploaded"]
    return max(entries, key=lambda e: e.get("id", 0)) if entries else None


def _update_upload_entry(pmid: str, updates: dict[str, Any]) -> None:
    """Update the most recent upload entry for a PMID."""
    meta = _load_uploads_metadata()
    for i, e in enumerate(meta):
        if e.get("pmid") == pmid and e.get("status") in ("uploaded", "parsing", "done"):
            meta[i].update(updates)
            _save_uploads_metadata(meta)
            return


def _pmid_from_data_id(data_id: str) -> str | None:
    """Extract PMID from data_id. data_id is usually just the PMID string."""
    digits = re.sub(r"\D", "", data_id)
    return digits if digits else None


# ── Knowhere API calls ────────────────────────────────────────────

def create_job(pmid: str, file_name: str, webhook_url: str | None = None) -> dict[str, Any]:
    """
    Step 1: Create a Knowhere parsing job.

    For local files: returns upload_url to upload the PDF.
    Returns the job response dict.
    """
    url = f"{KNOWHERE_API_BASE}/v1/jobs"
    headers = {
        "Authorization": f"Bearer {KNOWHERE_API_KEY}",
        "Content-Type": "application/json",
    }
    payload: dict[str, Any] = {
        "source_type": "file",
        "file_name": file_name,
        "data_id": pmid,
        "parsing_params": {
            "model": KNOWHERE_MODEL,
            "ocr_enabled": KNOWHERE_OCR,
        },
    }
    if webhook_url:
        payload["webhook_url"] = webhook_url

    logger.info("Creating Knowhere job for PMID=%s file=%s", pmid, file_name)
    resp = httpx.post(url, headers=headers, json=payload, timeout=30)
    resp.raise_for_status()
    return resp.json()


def upload_file(upload_url: str, upload_headers: dict[str, str], pdf_path: Path) -> None:
    """
    Step 2: Upload the PDF file to Knowhere's presigned URL.
    """
    pdf_path = Path(pdf_path) if not isinstance(pdf_path, Path) else pdf_path
    logger.info("Uploading PDF to Knowhere storage: %s", pdf_path.name)
    with open(pdf_path, "rb") as f:
        resp = httpx.put(upload_url, headers=upload_headers, content=f, timeout=300)
    resp.raise_for_status()
    logger.info("Upload complete: %s", pdf_path.name)


def get_job_status(job_id: str) -> dict[str, Any]:
    """Poll job status from Knowhere."""
    url = f"{KNOWHERE_API_BASE}/v1/jobs/{job_id}"
    headers = {"Authorization": f"Bearer {KNOWHERE_API_KEY}"}
    resp = httpx.get(url, headers=headers, timeout=30)
    resp.raise_for_status()
    return resp.json()


def download_result(result_url: str) -> Path:
    """
    Download result ZIP to a temp directory and return the path to extracted content.md.
    Returns the path to content.md (or None if not found).
    """
    logger.info("Downloading result from: %s", result_url[:80] + "...")
    resp = httpx.get(result_url, timeout=300)
    resp.raise_for_status()

    tmp_dir = Path(tempfile.mkdtemp(prefix="knowhere_result_"))
    zip_path = tmp_dir / "result.zip"
    zip_path.write_bytes(resp.content)

    extract_dir = tmp_dir / "extracted"
    with zipfile.ZipFile(zip_path, "r") as zf:
        zf.extractall(extract_dir)

    # Find content.md or full.md
    content_md = extract_dir / "content.md"
    if not content_md.exists():
        content_md = extract_dir / "full.md"
    manifest_path = extract_dir / "manifest.json"
    chunks_path = extract_dir / "chunks.json"

    result = {
        "content_md": str(content_md) if content_md.exists() else None,
        "manifest": str(manifest_path) if manifest_path.exists() else None,
        "chunks": str(chunks_path) if chunks_path.exists() else None,
        "extract_dir": str(extract_dir),
    }
    logger.info("Result downloaded. content.md=%s, chunks=%s", result["content_md"], result["chunks"])
    return result


def build_paper_markdown_from_knowhere(
    pmid: str,
    content_md_path: str | None,
    manifest_path: str | None,
    original_pdf_name: str = "",
) -> str:
    """
    Build a pmid_{PMID}.md file from Knowhere's output.
    Uses the content.md as body, with YAML frontmatter.
    """
    # Read manifest for metadata
    title = ""
    year = ""
    source_file = original_pdf_name

    if manifest_path:
        try:
            manifest = json.loads(Path(manifest_path).read_text(encoding="utf-8"))
            source_file = manifest.get("source_file_name", source_file)
        except (json.JSONDecodeError, OSError):
            pass

    # Read content.md for body
    body = ""
    if content_md_path:
        try:
            body = Path(content_md_path).read_text(encoding="utf-8", errors="replace")
        except OSError:
            body = ""

    if not body:
        body = f"(Knowhere parsed PDF: {source_file or pmid})"

    # Build YAML frontmatter
    now = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    frontmatter = {
        "paper_id": f"pmid:{pmid}",
        "pmid": pmid,
        "doi": "",
        "title": title,
        "authors": "",
        "year": year,
        "journal": "",
        "priority": "unassigned",
        "priority_score": "0",
        "aps_modules": "",
        "study_types": "",
        "is_clinical_case": "0",
        "supervisor_note": "",
        "abstract": "",
        "primary_text_source": "knowhere_auto_parse",
        "source_markdown_path": "",
        "source_result_dir": "",
        "knowhere_job_id": "",
        "parsed_at": now,
    }

    # Try to extract abstract from body
    import re as _re
    abstract_match = _re.search(r'(?i)##\s*abstract\s*\n(.*?)(?=\n##\s|\Z)', body, _re.DOTALL)
    if abstract_match:
        frontmatter["abstract"] = abstract_match.group(1).strip()[:900]

    # Build final file content
    yaml_str = yaml.dump(frontmatter, default_flow_style=False, allow_unicode=True).strip()
    return f"---\n{yaml_str}\n---\n\n{body}"


def save_paper_to_corpus(pmid: str, markdown_content: str) -> Path:
    """Write pmid_{PMID}.md to the corpus directory."""
    md_path = CORPUS_DIR / f"pmid_{pmid}.md"
    md_path.write_text(markdown_content, encoding="utf-8")
    logger.info("Saved paper to corpus: %s", md_path)
    return md_path


# ── Main pipeline ─────────────────────────────────────────────────

def submit_parse_job(pmid: str, pdf_path: Path, webhook_url: str | None = None) -> dict[str, Any]:
    """
    Full pipeline: submit PDF to Knowhere for parsing.
    Returns the Knowhere job response.
    """
    # Step 1: Create job
    file_name = f"{pmid}.pdf"
    job_resp = create_job(pmid, file_name, webhook_url=webhook_url)

    job_id = job_resp.get("job_id", "")
    status = job_resp.get("status", "")

    # Step 2: Upload file if we got an upload_url
    upload_url = job_resp.get("upload_url")
    upload_headers = job_resp.get("upload_headers", {})

    if upload_url:
        upload_file(upload_url, upload_headers, pdf_path)

    # Update upload metadata
    _update_upload_entry(pmid, {
        "knowhere_job_id": job_id,
        "knowhere_status": status,
        "status": "parsing",
    })

    return {
        "job_id": job_id,
        "status": status,
        "upload_url": upload_url,
    }


def handle_webhook_callback(payload: dict[str, Any]) -> dict[str, Any]:
    """
    Handle a Knowhere webhook callback.

    Expected payload:
      {
        "event": "job.completed" | "job.failed",
        "job_id": "job_xxx",
        "data_id": "PMID_value",
        "status": "done" | "failed",
        "result_url": "https://...",
        "result_url_expires_at": "...",
        "error": { ... }  # only on failure
      }
    """
    event = payload.get("event", "")
    job_id = payload.get("job_id", "")
    data_id = payload.get("data_id", "")
    status = payload.get("status", "")
    result_url = payload.get("result_url", "")
    error_info = payload.get("error")

    pmid = _pmid_from_data_id(data_id)
    if not pmid:
        logger.warning("Webhook received with invalid data_id: %s", data_id)
        return {"status": "ignored", "reason": "invalid data_id"}

    logger.info("Webhook: job=%s event=%s status=%s pmid=%s", job_id, event, status, pmid)

    if status == "failed":
        err_msg = error_info.get("message", "unknown error") if error_info else "unknown error"
        logger.error("Knowhere job failed for PMID=%s: %s", pmid, err_msg)
        _update_upload_entry(pmid, {
            "knowhere_status": status,
            "knowhere_error": err_msg,
            "status": "failed",
        })
        return {"status": "failed", "pmid": pmid, "error": err_msg}

    if status != "done" or not result_url:
        logger.warning("Webhook received unexpected status=%s for PMID=%s", status, pmid)
        return {"status": "ignored", "reason": f"unexpected status: {status}"}

    # Download result
    result = download_result(result_url)
    content_md_path = result.get("content_md")

    # Build pmid_{PMID}.md
    markdown_content = build_paper_markdown_from_knowhere(
        pmid=pmid,
        content_md_path=content_md_path,
        manifest_path=result.get("manifest"),
    )

    # Write to corpus
    md_path = save_paper_to_corpus(pmid, markdown_content)

    # Update upload metadata
    _update_upload_entry(pmid, {
        "knowhere_status": status,
        "knowhere_job_id": job_id,
        "knowhere_result_url": result_url,
        "status": "done",
    })

    # Clean up temp dir
    extract_dir = result.get("extract_dir")
    if extract_dir:
        shutil.rmtree(extract_dir, ignore_errors=True)

    logger.info("Knowhere parsing complete for PMID=%s", pmid)
    return {"status": "ok", "pmid": pmid, "job_id": job_id, "corpus_path": str(md_path)}


def verify_webhook_signature(payload_body: bytes, signature_header: str) -> bool:
    """
    Verify HMAC-SHA256 signature from Knowhere webhook.
    Knowhere sends signature in X-Knowhere-Signature header.
    """
    if not KNOWHERE_WEBHOOK_SECRET:
        logger.warning("KNOWHERE_WEBHOOK_SECRET not set, skipping signature verification")
        return True

    expected = hmac.new(
        KNOWHERE_WEBHOOK_SECRET.encode(),
        payload_body,
        hashlib.sha256,
    ).hexdigest()

    return hmac.compare_digest(expected, signature_header)
