#!/usr/bin/env python3
"""
PaperQA Engine — APS Review Web App
=====================================
Loads all 196 APS markdown files into a PaperQA Docs object on startup,
and provides an async query() function for the web app.

Uses DeepSeek via LangChain bridge with sparse embedding.
"""

import os
import sys
import glob
import logging
from pathlib import Path

logger = logging.getLogger("paperqa_engine")

# ── Configuration ──
MD_DIR = "/root/APS_Review/paperqa_import/high_medium_ready"

# Global Docs instance (lazy-loaded)
_docs = None
_docs_loaded = False
_init_task = None  # Background init task


def get_api_key():
    """Get DeepSeek API key from environment."""
    key = os.environ.get("DEEPSEEK_API_KEY")
    if key:
        return key
    return None


async def init_engine(api_key: str | None = None):
    """Initialize the PaperQA Docs engine by loading all markdown files."""
    global _docs, _docs_loaded

    if _docs_loaded:
        logger.info("Engine already initialized, returning existing instance")
        return _docs

    if api_key is None:
        api_key = get_api_key()

    if not api_key:
        raise RuntimeError(
            "DEEPSEEK_API_KEY not found. Set it in environment or ~/.bashrc"
        )

    logger.info("Initializing PaperQA engine...")

    # Configure DeepSeek via LangChain
    from langchain_deepseek import ChatDeepSeek

    llm = ChatDeepSeek(
        model="deepseek-chat",
        api_key=api_key,
        temperature=0.1,
    )

    # Create PaperQA Docs
    from paperqa import Docs

    _docs = Docs(llm="langchain", embedding="sparse", client=llm)
    logger.info(f"LLM: {_docs.llm_model.name} | Embedding: sparse")

    # Load markdown files — run in a thread pool to avoid ASGI event loop blocking
    import asyncio
    from concurrent.futures import ThreadPoolExecutor

    md_files = sorted(glob.glob(os.path.join(MD_DIR, "*.md")))
    logger.info(f"Found {len(md_files)} markdown files in {MD_DIR}")

    def run_aadd_in_loop(docs, fpath, name):
        """Run aadd in its own event loop (to avoid nesting in the ASGI loop)."""
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            loop.run_until_complete(docs.aadd(fpath, docname=name))
        finally:
            loop.close()

    batch_size = 20
    with ThreadPoolExecutor(max_workers=4) as executor:
        futures = []
        for fpath in md_files:
            name = Path(fpath).stem
            futures.append(
                executor.submit(run_aadd_in_loop, _docs, fpath, name)
            )
            # Log batch progress
            completed = sum(1 for f in futures if f.done())
            if completed % batch_size == 0 and completed > 0:
                logger.info(
                    f"Loaded {completed}/{len(md_files)} files"
                )
        # Wait for all
        for f in futures:
            try:
                f.result(timeout=120)
            except Exception as e:
                logger.warning(f"File load error: {e}")

    logger.info(
        f"Engine ready: {len(_docs.docs)} docs, {len(_docs.texts)} text chunks"
    )
    _docs_loaded = True
    return _docs


def init_engine_sync(api_key: str | None = None):
    """Synchronous wrapper — runs init_engine in its own event loop.
    Used for background startup in the web app."""
    import asyncio
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        return loop.run_until_complete(init_engine(api_key))
    finally:
        loop.close()


async def query(question: str, k: int = 10, max_sources: int = 5) -> dict:
    """
    Run a PaperQA query against the loaded documents.

    Returns a dict with:
        - question: the original question
        - answer: formatted answer text
        - contexts: list of source contexts with text and doc name
    """
    global _docs

    if _docs is None or not _docs_loaded:
        raise RuntimeError("Engine not initialized. Call init_engine() first.")

    logger.info(f"Querying: {question[:100]}...")
    try:
        result = await _docs.aquery(
            query=question, k=k, max_sources=max_sources
        )
        return {
            "question": question,
            "answer": result.formatted_answer,
            "contexts": [
                {
                    "text": c.text.text[:500],
                    "name": c.text.name,
                    "citation": c.text.doc.citation
                    if hasattr(c.text, "doc") and hasattr(c.text.doc, "citation")
                    else c.text.name,
                }
                for c in result.contexts
            ],
        }
    except Exception as e:
        logger.error(f"Query failed: {e}")
        return {
            "question": question,
            "answer": f"[ERROR] {str(e)}",
            "contexts": [],
        }


async def check_health() -> dict:
    """Return engine health status."""
    global _docs, _docs_loaded
    return {
        "ready": _docs_loaded,
        "docs_count": len(_docs.docs) if _docs and _docs_loaded else 0,
        "texts_count": len(_docs.texts) if _docs and _docs_loaded else 0,
    }


def get_docs() -> object:
    """Return the global Docs instance (for direct access if needed)."""
    global _docs
    return _docs
