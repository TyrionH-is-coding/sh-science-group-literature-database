#!/usr/bin/env python3
"""PaperQA integration for the literature database."""

from __future__ import annotations

import logging
import os
from pathlib import Path
from typing import Any
import re

logger = logging.getLogger("paperqa_engine")

ROOT = Path(__file__).resolve().parent
DEFAULT_CORPUS_DIR = ROOT / "paperqa_import" / "high_medium_ready"

_docs: Any | None = None
_docs_loaded = False
_loaded_corpus_dir: Path | None = None


def get_api_key() -> str | None:
    return os.environ.get("DEEPSEEK_API_KEY") or os.environ.get("PAPERQA_API_KEY")


async def init_engine(
    api_key: str | None = None,
    corpus_dir: str | Path | None = None,
):
    """Load the Markdown corpus into a PaperQA Docs object."""
    global _docs, _docs_loaded, _loaded_corpus_dir

    target_dir = Path(
        corpus_dir
        or os.environ.get("PAPERQA_CORPUS_DIR")
        or DEFAULT_CORPUS_DIR
    ).resolve()

    if _docs_loaded and _loaded_corpus_dir == target_dir:
        return _docs

    api_key = api_key or get_api_key()
    if not api_key:
        raise RuntimeError("DEEPSEEK_API_KEY or PAPERQA_API_KEY is not configured")
    if not target_dir.exists():
        raise RuntimeError(f"Corpus directory does not exist: {target_dir}")

    logger.info("Initializing PaperQA engine from %s", target_dir)

    from langchain_deepseek import ChatDeepSeek
    from paperqa import Docs

    llm = ChatDeepSeek(
        model=os.environ.get("PAPERQA_LLM_MODEL", "deepseek-chat"),
        api_key=api_key,
        temperature=float(os.environ.get("PAPERQA_TEMPERATURE", "0.1")),
    )
    docs = Docs(llm="langchain", embedding="sparse", client=llm)

    md_files = sorted(target_dir.glob("*.md"))
    if not md_files:
        raise RuntimeError(f"No Markdown files found in {target_dir}")

    for index, path in enumerate(md_files, start=1):
        try:
            await docs.aadd(str(path), docname=path.stem)
        except Exception as exc:
            logger.warning("Could not add %s: %s", path.name, exc)
        if index % 25 == 0 or index == len(md_files):
            logger.info("Loaded %s/%s Markdown files", index, len(md_files))

    _docs = docs
    _docs_loaded = True
    _loaded_corpus_dir = target_dir
    logger.info("PaperQA ready: %s docs, %s text chunks", len(docs.docs), len(docs.texts))
    return _docs


def init_engine_sync(
    api_key: str | None = None,
    corpus_dir: str | Path | None = None,
):
    import asyncio

    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        return loop.run_until_complete(init_engine(api_key=api_key, corpus_dir=corpus_dir))
    finally:
        loop.close()


async def query(question: str, k: int = 10, max_sources: int = 5) -> dict[str, Any]:
    if _docs is None or not _docs_loaded:
        raise RuntimeError("PaperQA engine is not initialized")

    result = await _docs.aquery(query=question, k=k, max_sources=max_sources)
    contexts = []
    for context in result.contexts:
        text_obj = context.text
        source_name = getattr(text_obj, "name", "")
        pmid_match = re.search(r"pmid[_:\s-]*(\d+)", source_name or "", re.IGNORECASE)
        pmid = pmid_match.group(1) if pmid_match else ""
        contexts.append(
            {
                "name": source_name,
                "pmid": pmid,
                "url": f"/papers/{pmid}" if pmid else "",
                "text": getattr(text_obj, "text", "")[:900],
                "citation": getattr(getattr(text_obj, "doc", None), "citation", "")
                or source_name,
            }
        )

    return {
        "question": question,
        "answer": result.formatted_answer,
        "contexts": contexts,
    }


async def check_health() -> dict[str, Any]:
    return {
        "ready": _docs_loaded,
        "docs_count": len(_docs.docs) if _docs and _docs_loaded else 0,
        "texts_count": len(_docs.texts) if _docs and _docs_loaded else 0,
        "corpus_dir": str(_loaded_corpus_dir) if _loaded_corpus_dir else None,
    }


def get_docs() -> Any:
    return _docs
