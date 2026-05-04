#!/usr/bin/env python3
"""FastAPI application for the SH Science Group literature database."""

from __future__ import annotations

import json
import logging
import os
import re
import html
from functools import lru_cache
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

SENTENCE_RE = re.compile(r"[^.!?。！？;；]+(?:[.!?。！？;；]+|$)", re.MULTILINE)
SOURCE_LINE_RE = re.compile(r"(?:line|lines)\s+(\d+)(?:\s*[-–]\s*(\d+))?", re.IGNORECASE)


def get_api_key() -> str | None:
    """Read the LLM API key from server-side environment variables only."""
    key = os.environ.get("DEEPSEEK_API_KEY") or os.environ.get("PAPERQA_API_KEY")
    if key:
        return key
    bashrc = Path.home() / ".bashrc"
    if bashrc.exists():
        match = re.search(r'export\s+DEEPSEEK_API_KEY="([^"]+)"', bashrc.read_text())
        if match:
            return match.group(1)
    return None


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


def llm_runtime_config() -> dict[str, Any]:
    paperqa_model = os.environ.get("PAPERQA_LLM_MODEL", "deepseek-chat")
    draft_model = os.environ.get("PAPERQA_DRAFT_MODEL", paperqa_model)
    return {
        "paperqa": {
            "provider": os.environ.get("PAPERQA_LLM_PROVIDER", "DeepSeek"),
            "model": paperqa_model,
            "temperature": float(os.environ.get("PAPERQA_TEMPERATURE", "0.1")),
        },
        "draft": {
            "provider": os.environ.get("DRAFT_LLM_PROVIDER", "DeepSeek"),
            "model": draft_model,
            "temperature": float(os.environ.get("DRAFT_TEMPERATURE", "0.2")),
        },
    }


def normalize_text(value: str) -> str:
    return re.sub(r"\s+", " ", value or "").strip().lower()


def strip_markdown_inline(value: str) -> str:
    cleaned = re.sub(r"!\[([^\]]*)\]\([^)]+\)", r"\1", value)
    cleaned = re.sub(r"\[([^\]]+)\]\([^)]+\)", r"\1", cleaned)
    cleaned = re.sub(r"[*_`]+", "", cleaned)
    cleaned = re.sub(r"<[^>]+>", "", cleaned)
    return cleaned.strip()


def display_module_label(value: str) -> str:
    clean = (value or "").strip()
    if not clean:
        return ""
    return re.sub(r"^module[_-]?\d+[_-]?", "", clean, flags=re.IGNORECASE).replace("_", " ").title()


def split_sentences(text: str) -> list[str]:
    cleaned = strip_markdown_inline(text)
    sentences = [match.group(0).strip() for match in SENTENCE_RE.finditer(cleaned)]
    return [sentence for sentence in sentences if sentence]


def iter_text_blocks(body: str) -> list[dict[str, Any]]:
    blocks: list[dict[str, Any]] = []
    paragraph_lines: list[str] = []
    paragraph_start = 1
    section = "Document"

    def flush_paragraph(end_line: int) -> None:
        nonlocal paragraph_lines
        if not paragraph_lines:
            return
        text = " ".join(line.strip() for line in paragraph_lines).strip()
        if text:
            blocks.append(
                {
                    "type": "paragraph",
                    "text": text,
                    "section": section,
                    "line_start": paragraph_start,
                    "line_end": end_line,
                }
            )
        paragraph_lines = []

    for line_no, line in enumerate(body.splitlines(), start=1):
        stripped = line.strip()
        heading = re.match(r"^(#{1,6})\s+(.+)$", stripped)
        if heading:
            flush_paragraph(line_no - 1)
            section = strip_markdown_inline(heading.group(2))
            blocks.append(
                {
                    "type": "heading",
                    "level": len(heading.group(1)),
                    "text": section,
                    "section": section,
                    "line_start": line_no,
                    "line_end": line_no,
                }
            )
            continue
        if not stripped:
            flush_paragraph(line_no - 1)
            continue
        if stripped.startswith(("---", "```")):
            flush_paragraph(line_no - 1)
            continue
        if not paragraph_lines:
            paragraph_start = line_no
        paragraph_lines.append(stripped)

    flush_paragraph(len(body.splitlines()))
    return blocks


@lru_cache(maxsize=512)
def evidence_index_for_pmid(pmid: str) -> tuple[dict[str, Any], ...]:
    detail = get_paper_by_pmid(pmid)
    sentences: list[dict[str, Any]] = []
    for block in iter_text_blocks(detail["body"]):
        if block["type"] != "paragraph":
            continue
        if normalize_text(block["section"]) == "metadata":
            continue
        for index, sentence in enumerate(split_sentences(block["text"]), start=1):
            if len(sentence) < 24:
                continue
            sentence_id = f"s{block['line_start']}-{index}"
            sentences.append(
                {
                    "id": sentence_id,
                    "text": sentence,
                    "section": block["section"],
                    "line_start": block["line_start"],
                    "line_end": block["line_end"],
                    "pmid": re.sub(r"\D", "", pmid),
                }
            )
    return tuple(sentences)


def line_range_from_context(source: dict[str, Any]) -> tuple[int | None, int | None]:
    haystack = " ".join(str(source.get(key, "")) for key in ("name", "citation", "text"))
    match = SOURCE_LINE_RE.search(haystack)
    if not match:
        return None, None
    start = int(match.group(1))
    end = int(match.group(2) or start)
    return start, end


def sentence_overlap_score(sentence: str, context_text: str) -> float:
    sentence_words = set(re.findall(r"[a-zA-Z0-9βακ]+", normalize_text(sentence)))
    context_words = set(re.findall(r"[a-zA-Z0-9βακ]+", normalize_text(context_text)))
    if not sentence_words or not context_words:
        return 0.0
    return len(sentence_words & context_words) / max(len(sentence_words), 1)


def resolve_context_to_evidence(source: dict[str, Any], limit: int = 4) -> list[dict[str, Any]]:
    pmid = str(source.get("pmid") or "")
    if not pmid:
        match = re.search(r"pmid[:_\s-]*(\d+)", str(source.get("name", "")), re.IGNORECASE)
        pmid = match.group(1) if match else ""
    if not pmid:
        return []

    context_text = str(source.get("text") or "")
    normalized_context = normalize_text(context_text)
    line_start, line_end = line_range_from_context(source)
    candidates: list[tuple[float, dict[str, Any]]] = []
    for sentence in evidence_index_for_pmid(pmid):
        score = 0.0
        normalized_sentence = normalize_text(sentence["text"])
        if normalized_sentence and normalized_sentence in normalized_context:
            score = 1.0
        elif normalized_context and normalized_context in normalized_sentence:
            score = 0.95
        elif line_start and line_end and sentence["line_start"] <= line_end and sentence["line_end"] >= line_start:
            score = 0.8
        else:
            score = sentence_overlap_score(sentence["text"], context_text)
        if score >= 0.28:
            candidates.append((score, dict(sentence)))

    candidates.sort(key=lambda item: (-item[0], item[1]["line_start"]))
    evidences = []
    seen = set()
    for score, sentence in candidates:
        if sentence["id"] in seen:
            continue
        seen.add(sentence["id"])
        sentence["score"] = round(score, 3)
        sentence["url"] = f"/papers/{pmid}?highlight={sentence['id']}#{sentence['id']}"
        evidences.append(sentence)
        if len(evidences) >= limit:
            break
    return evidences


def enrich_contexts_with_evidence(contexts: list[dict[str, Any]]) -> list[dict[str, Any]]:
    enriched = []
    for source in contexts:
        item = dict(source)
        evidences = resolve_context_to_evidence(item)
        item["evidence"] = evidences
        if evidences:
            ids = ",".join(evidence["id"] for evidence in evidences)
            item["url"] = f"/papers/{item.get('pmid')}?highlight={ids}#{evidences[0]['id']}"
        enriched.append(item)
    return enriched


def markdown_inline_html(text: str, highlight_ids: set[str], sentence_lookup: dict[str, str]) -> str:
    parts = []
    remaining = text
    for sentence in split_sentences(text):
        idx = normalize_text(remaining).find(normalize_text(sentence))
        sentence_id = sentence_lookup.get(normalize_text(sentence))
        classes = "article-sentence"
        if sentence_id in highlight_ids:
            classes += " cited-sentence"
        safe = html.escape(sentence)
        if sentence_id:
            parts.append(f'<span class="{classes}" id="{html.escape(sentence_id)}">{safe}</span>')
        else:
            parts.append(safe)
        if idx >= 0:
            remaining = remaining[idx + len(sentence) :]
    if not parts:
        return html.escape(strip_markdown_inline(text))
    return " ".join(parts)


def render_markdown_article(body: str, highlight_ids: set[str]) -> str:
    index = evidence_index_for_pmid_from_body(body)
    sentence_lookup = {normalize_text(item["text"]): item["id"] for item in index}
    html_parts: list[str] = []
    for block in iter_text_blocks(body):
        if normalize_text(block["section"]) == "metadata":
            continue
        if block["type"] == "heading":
            level = min(max(int(block.get("level", 2)), 1), 4)
            text = html.escape(block["text"])
            html_parts.append(f"<h{level}>{text}</h{level}>")
        else:
            rendered = markdown_inline_html(block["text"], highlight_ids, sentence_lookup)
            html_parts.append(f"<p>{rendered}</p>")
    return "\n".join(html_parts)


def evidence_index_for_pmid_from_body(body: str) -> list[dict[str, Any]]:
    sentences: list[dict[str, Any]] = []
    for block in iter_text_blocks(body):
        if block["type"] != "paragraph":
            continue
        if normalize_text(block["section"]) == "metadata":
            continue
        for index, sentence in enumerate(split_sentences(block["text"]), start=1):
            if len(sentence) < 24:
                continue
            sentences.append(
                {
                    "id": f"s{block['line_start']}-{index}",
                    "text": sentence,
                    "section": block["section"],
                    "line_start": block["line_start"],
                    "line_end": block["line_end"],
                }
            )
    return sentences


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
    api_key = get_api_key()
    if not api_key:
        _engine_error = "DEEPSEEK_API_KEY or PAPERQA_API_KEY is not configured"
        logger.error(_engine_error)
        return

    import threading

    def _load(k):
        global _engine_ready, _engine_error
        import asyncio
        new_loop = asyncio.new_event_loop()
        asyncio.set_event_loop(new_loop)
        try:
            from paperqa_engine import init_engine_sync, check_health

            docs = init_engine_sync(api_key=k, corpus_dir=CORPUS_DIR)
            # init_engine_sync sets module-level _docs, but only in this thread's view.
            # We need to ensure the main process sees it too.
            _engine_ready = True
            _engine_error = None
            logger.info("PaperQA engine initialized: %s docs", len(docs.docs))
        except Exception as exc:
            _engine_error = str(exc)
            logger.exception("PaperQA init failed")
        finally:
            new_loop.close()

    t = threading.Thread(target=_load, args=(api_key,), daemon=True)
    t.start()
    # Don't wait - the health endpoint will see _engine_ready=True once loading finishes
    logger.info("PaperQA background loading started")


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
async def paper_page(pmid: str, request: Request):
    detail = get_paper_by_pmid(pmid)
    metadata = detail["metadata"]
    title = metadata.get("title") or f"PMID {pmid}"
    body = detail["body"]
    highlight_ids = {
        item.strip()
        for item in request.query_params.get("highlight", "").split(",")
        if item.strip()
    }
    rendered_body = render_markdown_article(body, highlight_ids)
    fields = [
        ("PMID", metadata.get("pmid", pmid)),
        ("DOI", metadata.get("doi", "")),
        ("Year", metadata.get("year", "")),
        ("Journal", metadata.get("journal", "")),
        ("Priority", metadata.get("priority", "")),
        ("Module", display_module_label(metadata.get("aps_modules", ""))),
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
            <p class="eyebrow">Rendered paper</p>
            <h1>{html.escape(title)}</h1>
            <dl class="detail-grid">{field_html}</dl>
            <div class="article-body rendered-markdown">{rendered_body}</div>
        </article>
    </main>
    <script>
        const firstHighlight = document.querySelector(".cited-sentence");
        if (firstHighlight) {{
            firstHighlight.scrollIntoView({{ behavior: "smooth", block: "center" }});
        }}
    </script>
</body>
</html>"""
    )


@app.get("/api/health")
async def api_health():
    docs_count = 0
    texts_count = 0
    if _engine_ready:
        try:
            from paperqa_engine import check_health as engine_health

            health = await engine_health()
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
            "loading": _engine_ready and docs_count == 0,
            "error": _engine_error,
            "docs_count": docs_count,
            "texts_count": texts_count,
        },
        "llm": llm_runtime_config(),
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


@app.get("/api/papers/{pmid}/evidence")
async def api_paper_evidence(pmid: str):
    detail = get_paper_by_pmid(pmid)
    return {
        "pmid": re.sub(r"\D", "", pmid),
        "title": detail["metadata"].get("title", f"PMID {pmid}"),
        "sentences": list(evidence_index_for_pmid(pmid)),
    }


@app.post("/api/paperqa/resolve-evidence")
async def api_resolve_evidence(request: Request):
    try:
        body = await request.json()
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON body")
    contexts = body.get("contexts") or []
    if not isinstance(contexts, list):
        raise HTTPException(status_code=400, detail="contexts must be a list")
    return {"contexts": enrich_contexts_with_evidence(contexts)}


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
    try:
        result = await engine_query(question=question, k=k, max_sources=max_sources)
        result["contexts"] = enrich_contexts_with_evidence(result.get("contexts", []))
        result["llm"] = result.get("llm") or llm_runtime_config()["paperqa"]
        result["draft_llm"] = llm_runtime_config()["draft"]
        return result
    except Exception as exc:
        logger.exception("PaperQA query failed")
        raise HTTPException(status_code=500, detail=str(exc))


@app.post("/api/draft/paragraph")
async def api_draft_paragraph(request: Request):
    try:
        body = await request.json()
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON body")

    mode = str(body.get("mode", "review")).strip().lower()
    if mode != "review":
        raise HTTPException(status_code=400, detail="Only review paragraph generation is enabled")

    evidences = body.get("evidences") or []
    if not isinstance(evidences, list) or not evidences:
        raise HTTPException(status_code=400, detail="Select at least one evidence sentence")

    clean_evidences = []
    for item in evidences[:12]:
        text = strip_markdown_inline(str(item.get("text", ""))).strip()
        if not text:
            continue
        clean_evidences.append(
            {
                "pmid": str(item.get("pmid", "")),
                "section": str(item.get("section", "")),
                "text": text,
            }
        )
    if not clean_evidences:
        raise HTTPException(status_code=400, detail="Selected evidence is empty")

    api_key = get_api_key()
    if not api_key:
        raise HTTPException(status_code=503, detail="DEEPSEEK_API_KEY or PAPERQA_API_KEY is not configured")

    language = "Chinese" if str(body.get("lang", "en")).lower().startswith("zh") else "English"
    instruction = strip_markdown_inline(str(body.get("instruction", ""))).strip()[:1200]
    evidence_lines = "\n".join(
        f"- PMID {item['pmid']} [{item['section']}]: {item['text']}"
        for item in clean_evidences
    )
    instruction_block = f"\nParagraph goal from the user: {instruction}\n" if instruction else "\n"
    prompt = (
        f"Write one concise {language} review paragraph for a scientific manuscript using only the evidence below.\n"
        "Do not add claims that are not supported by the selected evidence. "
        "Keep the tone suitable for a biomedical review article. "
        "Mention PMID citations inline where useful.\n"
        f"{instruction_block}\n"
        f"Selected evidence:\n{evidence_lines}"
    )

    from langchain_deepseek import ChatDeepSeek

    config = llm_runtime_config()["draft"]
    llm = ChatDeepSeek(
        model=config["model"],
        api_key=api_key,
        temperature=config["temperature"],
    )
    try:
        response = await llm.ainvoke(prompt)
    except Exception as exc:
        logger.exception("Draft generation failed")
        raise HTTPException(status_code=500, detail=str(exc))

    return {
        "mode": mode,
        "draft": getattr(response, "content", str(response)).strip(),
        "llm": config,
        "evidence_count": len(clean_evidences),
    }


@app.post("/api/draft/article")
async def api_draft_article(request: Request):
    try:
        body = await request.json()
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON body")

    mode = str(body.get("mode", "review")).strip().lower()
    if mode != "review":
        raise HTTPException(status_code=400, detail="Only review article generation is enabled")

    paragraphs = body.get("paragraphs") or []
    if not isinstance(paragraphs, list) or not paragraphs:
        raise HTTPException(status_code=400, detail="Add at least one paragraph plan")

    clean_paragraphs = []
    total_evidence_count = 0
    for index, paragraph in enumerate(paragraphs[:8], start=1):
        if not isinstance(paragraph, dict):
            continue
        instruction = strip_markdown_inline(str(paragraph.get("instruction", ""))).strip()[:800]
        length = strip_markdown_inline(str(paragraph.get("length", ""))).strip()[:80]
        evidences = paragraph.get("evidences") or []
        clean_evidences = []
        if isinstance(evidences, list):
            for item in evidences[:10]:
                if not isinstance(item, dict):
                    continue
                text = strip_markdown_inline(str(item.get("text", ""))).strip()
                if not text:
                    continue
                clean_evidences.append(
                    {
                        "pmid": str(item.get("pmid", "")),
                        "section": str(item.get("section", "")),
                        "text": text,
                    }
                )
        if instruction or clean_evidences:
            clean_paragraphs.append(
                {
                    "index": index,
                    "instruction": instruction,
                    "length": length,
                    "evidences": clean_evidences,
                }
            )
            total_evidence_count += len(clean_evidences)

    if not clean_paragraphs:
        raise HTTPException(status_code=400, detail="Selected paragraph plans are empty")
    if total_evidence_count == 0:
        raise HTTPException(status_code=400, detail="Assign evidence to at least one paragraph")

    api_key = get_api_key()
    if not api_key:
        raise HTTPException(status_code=503, detail="DEEPSEEK_API_KEY or PAPERQA_API_KEY is not configured")

    language = "Chinese" if str(body.get("lang", "en")).lower().startswith("zh") else "English"
    paragraph_blocks = []
    for paragraph in clean_paragraphs:
        length_line = f"\nApproximate length: {paragraph['length']}" if paragraph["length"] else ""
        evidence_lines = "\n".join(
            f"  - PMID {item['pmid']} [{item['section']}]: {item['text']}"
            for item in paragraph["evidences"]
        ) or "  - No direct evidence assigned."
        paragraph_blocks.append(
            f"Paragraph {paragraph['index']} goal: {paragraph['instruction'] or 'Use the assigned evidence to advance the review argument.'}\n"
            f"{length_line}\n"
            f"Evidence:\n{evidence_lines}"
        )

    prompt = (
        f"Write a coherent multi-paragraph {language} biomedical review draft using the paragraph plans below.\n"
        "Treat the plans as an ordered outline. Make transitions between paragraphs explicit and smooth. "
        "Use only the supplied evidence for factual claims; do not invent unsupported claims. "
        "Mention PMID citations inline where useful. Do not use bullet points unless the user asks for them.\n\n"
        "Paragraph plans:\n"
        + "\n\n".join(paragraph_blocks)
    )

    from langchain_deepseek import ChatDeepSeek

    config = llm_runtime_config()["draft"]
    llm = ChatDeepSeek(
        model=config["model"],
        api_key=api_key,
        temperature=config["temperature"],
    )
    try:
        response = await llm.ainvoke(prompt)
    except Exception as exc:
        logger.exception("Article draft generation failed")
        raise HTTPException(status_code=500, detail=str(exc))

    return {
        "mode": mode,
        "draft": getattr(response, "content", str(response)).strip(),
        "llm": config,
        "paragraph_count": len(clean_paragraphs),
        "evidence_count": total_evidence_count,
    }


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


@app.delete("/api/uploads/{upload_id}")
async def api_delete_upload(upload_id: int):
    metadata = load_uploads_metadata()
    target = None
    for item in metadata:
        if int(item.get("id", 0)) == upload_id:
            target = item
            break
    if not target:
        raise HTTPException(status_code=404, detail="Upload not found")

    metadata = [item for item in metadata if int(item.get("id", 0)) != upload_id]
    save_uploads_metadata(metadata)

    pdf_path = UPLOAD_DIR / target.get("filename", "")
    if pdf_path.exists():
        pdf_path.unlink()

    logger.info("Deleted upload %s (PMID %s)", upload_id, target.get("pmid"))
    return {"message": "Upload deleted"}


@app.patch("/api/uploads/{upload_id}")
async def api_update_upload(upload_id: int, request: Request):
    metadata = load_uploads_metadata()
    target = None
    for item in metadata:
        if int(item.get("id", 0)) == upload_id:
            target = item
            break
    if not target:
        raise HTTPException(status_code=404, detail="Upload not found")

    try:
        body = await request.json()
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON")

    for key in ("status",):
        if key in body:
            target[key] = str(body[key])

    save_uploads_metadata(metadata)
    logger.info("Updated upload %s: %s", upload_id, {k: body[k] for k in body if k in ("status",)})
    return {"message": "Upload updated", "entry": target}


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
