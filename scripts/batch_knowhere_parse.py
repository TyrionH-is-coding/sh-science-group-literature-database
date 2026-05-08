#!/usr/bin/env python3
"""
Batch process all uploaded PDFs through Knowhere API.
For each unparsed upload: submit → poll → write markdown to corpus → update upload metadata.

Usage:
  KNOWHERE_API_KEY=sk_xxx python3 scripts/batch_knowhere_parse.py
  KNOWHERE_API_KEY=sk_xxx python3 scripts/batch_knowhere_parse.py --pmid 25139939
  KNOWHERE_API_KEY=sk_xxx python3 scripts/batch_knowhere_parse.py --pmid 25139939,16735457
  KNOWHERE_API_KEY=sk_xxx python3 scripts/batch_knowhere_parse.py --skip-existing
"""

import json
import logging
import os
import sys
import time
from pathlib import Path

# Add project root to path
ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "scripts"))

from knowhere_bridge import (
    CORPUS_DIR,
    UPLOAD_DIR,
    UPLOAD_METADATA_FILE,
    create_job,
    upload_file,
    get_job_status,
    download_result,
    build_paper_markdown_from_knowhere,
    save_paper_to_corpus,
    _load_uploads_metadata,
    _save_uploads_metadata,
    _update_upload_entry,
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)
logger = logging.getLogger("batch_knowhere")

POLL_INTERVAL = 10  # seconds between status checks
MAX_WAIT = 600      # max seconds to wait per paper


def get_unparsed_uploads() -> list[dict]:
    """Get all upload entries that haven't been parsed yet."""
    meta = _load_uploads_metadata()
    unparsed = []
    for item in meta:
        pmid = str(item.get("pmid", "")).strip()
        status = str(item.get("status", "")).strip()
        # Skip if already parsed or currently parsing
        if not pmid:
            continue
        if status in ("done", "parsing", "failed"):
            continue
        # Check if corpus file already exists
        md_path = CORPUS_DIR / f"pmid_{pmid}.md"
        if md_path.exists():
            continue
        # Check if PDF file exists
        pdf_name = item.get("filename", "")
        pdf_path = UPLOAD_DIR / pdf_name if pdf_name else None
        if pdf_path and pdf_path.exists():
            unparsed.append(item)
    return unparsed


def process_one(pmid: str, pdf_path: Path) -> bool:
    """Process a single paper: submit to Knowhere, wait, save."""
    logger.info("Processing PMID=%s (PDF: %s, %d bytes)", pmid, pdf_path.name, pdf_path.stat().st_size)

    # Step 1: Create Knowhere job
    try:
        job_resp = create_job(pmid, f"{pmid}.pdf")
    except Exception as e:
        logger.error("  FAILED to create job for PMID=%s: %s", pmid, e)
        return False

    job_id = job_resp.get("job_id", "")
    logger.info("  Job created: id=%s status=%s", job_id, job_resp.get("status", ""))

    # Step 2: Upload PDF
    upload_url = job_resp.get("upload_url")
    if upload_url:
        try:
            upload_file(upload_url, job_resp.get("upload_headers", {}), pdf_path)
            logger.info("  PDF uploaded")
        except Exception as e:
            logger.error("  FAILED to upload PDF for PMID=%s: %s", pmid, e)
            return False
    else:
        logger.error("  No upload_url in response")
        return False

    # Step 3: Update upload status to parsing
    _update_upload_entry(pmid, {
        "knowhere_job_id": job_id,
        "knowhere_status": "parsing",
        "status": "parsing",
    })

    # Step 4: Poll for completion
    waited = 0
    while waited < MAX_WAIT:
        time.sleep(POLL_INTERVAL)
        waited += POLL_INTERVAL
        try:
            status = get_job_status(job_id)
        except Exception as e:
            logger.warning("  Poll error for %s: %s (will retry)", pmid, e)
            continue

        s = status.get("status", "")
        logger.info("  [%ds] PMID=%s status=%s", waited, pmid, s)

        if s == "done":
            result_url = status.get("result_url", "")
            if not result_url:
                logger.error("  Done but no result_url for PMID=%s", pmid)
                return False

            # Download and save
            try:
                result = download_result(result_url)
                content = build_paper_markdown_from_knowhere(
                    pmid=pmid,
                    content_md_path=result.get("content_md"),
                    manifest_path=result.get("manifest"),
                )
                md_path = save_paper_to_corpus(pmid, content)
                _update_upload_entry(pmid, {
                    "knowhere_status": s,
                    "knowhere_job_id": job_id,
                    "status": "done",
                })
                logger.info("  SUCCESS: %s (%d bytes)", md_path.name, md_path.stat().st_size)
                return True
            except Exception as e:
                logger.error("  FAILED to save result for PMID=%s: %s", pmid, e)
                _update_upload_entry(pmid, {
                    "knowhere_status": s,
                    "knowhere_job_id": job_id,
                    "status": "failed",
                    "knowhere_error": str(e),
                })
                return False

        elif s == "failed":
            err = status.get("error", {})
            err_msg = err.get("message", str(err)) if isinstance(err, dict) else str(err)
            logger.error("  Knowhere job failed for PMID=%s: %s", pmid, err_msg)
            _update_upload_entry(pmid, {
                "knowhere_status": s,
                "knowhere_job_id": job_id,
                "status": "failed",
                "knowhere_error": err_msg,
            })
            return False

    # Timeout
    logger.error("  TIMEOUT after %ds for PMID=%s", MAX_WAIT, pmid)
    _update_upload_entry(pmid, {
        "knowhere_status": "timeout",
        "knowhere_job_id": job_id,
    })
    return False


def main():
    import argparse
    parser = argparse.ArgumentParser(description="Batch parse PDFs through Knowhere")
    parser.add_argument("--pmid", help="Specific PMID(s) to process (comma-separated)")
    parser.add_argument("--skip-existing", action="store_true", help="Skip if corpus file already exists")
    parser.add_argument("--limit", type=int, default=0, help="Max papers to process (0 = all)")
    args = parser.parse_args()

    if args.pmid:
        pmids = [p.strip() for p in args.pmid.split(",")]
        items = []
        meta = _load_uploads_metadata()
        for item in meta:
            if str(item.get("pmid", "")).strip() in pmids:
                pdf_name = item.get("filename", "")
                pdf_path = UPLOAD_DIR / pdf_name if pdf_name else None
                if pdf_path and pdf_path.exists():
                    items.append(item)
    else:
        items = get_unparsed_uploads()

    if not items:
        logger.info("No unparsed uploads found")
        return

    if args.limit and len(items) > args.limit:
        items = items[:args.limit]

    logger.info("Found %d papers to process", len(items))

    success = 0
    failed = 0
    for i, item in enumerate(items, 1):
        pmid = str(item.get("pmid", "")).strip()
        pdf_name = item.get("filename", "")
        pdf_path = UPLOAD_DIR / pdf_name

        # Check existing
        if args.skip_existing and (CORPUS_DIR / f"pmid_{pmid}.md").exists():
            logger.info("[%d/%d] PMID=%s already parsed, skipping", i, len(items), pmid)
            continue

        logger.info("--- [%d/%d] PMID=%s ---", i, len(items), pmid)
        ok = process_one(pmid, pdf_path)
        if ok:
            success += 1
        else:
            failed += 1

        # Small delay between papers
        if i < len(items):
            time.sleep(2)

    logger.info("=" * 40)
    logger.info("Batch complete: %d success, %d failed out of %d", success, failed, len(items))


if __name__ == "__main__":
    main()
