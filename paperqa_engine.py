#!/usr/bin/env python3
"""PaperQA integration for the literature database."""

from __future__ import annotations

import logging
import os
import re
from pathlib import Path
from typing import Any

logger = logging.getLogger("paperqa_engine")

ROOT = Path(__file__).resolve().parent
DEFAULT_CORPUS_DIR = ROOT / "paperqa_import" / "high_medium_ready"

_docs: Any = None
_docs_loaded = False


def get_llm_config() -> dict[str, Any]:
    return {
        "provider": os.environ.get("PAPERQA_LLM_PROVIDER", "DeepSeek"),
        "model": os.environ.get("PAPERQA_LLM_MODEL", "deepseek-chat"),
        "temperature": float(os.environ.get("PAPERQA_TEMPERATURE", "0.1")),
    }


def get_api_key() -> str | None:
    key = os.environ.get("DEEPSEEK_API_KEY") or os.environ.get("PAPERQA_API_KEY")
    if key:
        return key
    bashrc = Path.home() / ".bashrc"
    if bashrc.exists():
        match = re.search(r'export\s+DEEPSEEK_API_KEY="([^"]+)"', bashrc.read_text())
        if match:
            return match.group(1)
    return None


async def _load_all(api_key: str, corpus_dir: Path) -> Any:
    """Load all markdown files into a PaperQA Docs object."""
    from langchain_deepseek import ChatDeepSeek
    from paperqa import Docs

    config = get_llm_config()
    llm = ChatDeepSeek(
        model=config["model"],
        api_key=api_key,
        temperature=config["temperature"],
    )
    docs = Docs(llm="langchain", embedding="sparse", client=llm)

    md_files = sorted(corpus_dir.glob("*.md"))
    logger.info("PaperQA: loading %s files from %s", len(md_files), corpus_dir)

    for i in range(0, len(md_files), 10):
        batch = md_files[i : i + 10]
        for path in batch:
            try:
                await docs.aadd(str(path), docname=path.stem)
            except Exception as exc:
                logger.warning("PaperQA: skip %s - %s", path.name, exc)
        loaded = min(i + 10, len(md_files))
        logger.info("PaperQA: loaded %s/%s (%s docs)", loaded, len(md_files), len(docs.docs))

    logger.info("PaperQA ready: %s docs, %s chunks", len(docs.docs), len(docs.texts))
    return docs


def init_engine_sync(api_key: str | None = None, corpus_dir: str | Path | None = None) -> Any:
    """Synchronous wrapper to load all docs."""
    import asyncio
    global _docs, _docs_loaded

    if _docs_loaded:
        return _docs

    target = Path(corpus_dir or DEFAULT_CORPUS_DIR).resolve()
    api_key = api_key or get_api_key()

    async def _run():
        docs = await _load_all(api_key, target)
        return docs

    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        _docs = loop.run_until_complete(_run())
        _docs_loaded = True
        return _docs
    finally:
        loop.close()


async def query(question: str, k: int = 10, max_sources: int = 5) -> dict[str, Any]:
    global _docs, _docs_loaded

    if not _docs_loaded:
        api_key = get_api_key()
        if not api_key:
            raise RuntimeError("DEEPSEEK_API_KEY not configured")
        corpus_dir = Path(
            os.environ.get("PAPERQA_CORPUS_DIR") or DEFAULT_CORPUS_DIR
        ).resolve()
        _docs = await _load_all(api_key, corpus_dir)
        _docs_loaded = True

    result = await _docs.aquery(query=question, k=k, max_sources=max_sources)
    contexts = []
    for context in result.contexts:
        text_obj = context.text
        source_name = getattr(text_obj, "name", "")
        pmid_match = re.search(r"pmid[:_\s-]*(\d+)", source_name or "", re.IGNORECASE)
        pmid = pmid_match.group(1) if pmid_match else ""
        contexts.append(
            {
                "name": source_name,
                "pmid": pmid,
                "url": f"/papers/{pmid}" if pmid else "",
                "text": getattr(text_obj, "text", "")[:900],
                "citation": getattr(getattr(text_obj, "doc", None), "citation", "") or source_name,
            }
        )
    return {
        "question": question,
        "answer": result.formatted_answer,
        "contexts": contexts,
        "llm": get_llm_config(),
    }


async def check_health() -> dict[str, Any]:
    if _docs and _docs_loaded:
        return {"ready": True, "docs_count": len(_docs.docs), "texts_count": len(_docs.texts), "corpus_dir": str(DEFAULT_CORPUS_DIR)}
    return {"ready": True, "docs_count": 0, "texts_count": 0, "corpus_dir": str(DEFAULT_CORPUS_DIR)}
