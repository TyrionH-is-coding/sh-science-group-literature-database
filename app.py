#!/usr/bin/env python3
"""FastAPI application for the SH Science Group literature database."""

from __future__ import annotations

import csv
import hashlib
import hmac
import io
import json
import logging
import os
import re
import html
import shutil
import uuid
from functools import lru_cache
from datetime import datetime
from pathlib import Path
from typing import Any

import uvicorn
from fastapi import FastAPI, File, Form, HTTPException, Request, UploadFile
from fastapi.responses import FileResponse, HTMLResponse, JSONResponse, Response
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
USER_METADATA_FILE = Path(os.environ.get("LITDB_USERS_FILE", UPLOAD_DIR / "users.json")).resolve()
DRAFT_HISTORY_FILE = Path(os.environ.get("LITDB_DRAFT_HISTORY_FILE", UPLOAD_DIR / "draft_history.json")).resolve()
PAPER_NOTES_FILE = Path(os.environ.get("LITDB_PAPER_NOTES_FILE", UPLOAD_DIR / "paper_notes.json")).resolve()
PAPER_TAGS_FILE = Path(os.environ.get("LITDB_PAPER_TAGS_FILE", UPLOAD_DIR / "paper_tags.json")).resolve()
PAPER_TAG_REGISTRY_FILE = Path(os.environ.get("LITDB_PAPER_TAG_REGISTRY_FILE", UPLOAD_DIR / "paper_tag_registry.json")).resolve()
WORKSPACE_METADATA_FILE = Path(os.environ.get("LITDB_WORKSPACES_FILE", UPLOAD_DIR / "workspaces.json")).resolve()
WORKSPACE_UPLOAD_ROOT = Path(os.environ.get("LITDB_WORKSPACE_UPLOAD_ROOT", UPLOAD_DIR / "workspaces")).resolve()
MAX_UPLOAD_BYTES = int(os.environ.get("MAX_UPLOAD_MB", "50")) * 1024 * 1024
HOST = os.environ.get("HOST", "0.0.0.0")
PORT = int(os.environ.get("PORT", "8081"))
PDF_SUFFIXES = {".pdf"}
MARKDOWN_SUFFIXES = {".md", ".markdown", ".txt"}
SUPPORTED_UPLOAD_SUFFIXES = PDF_SUFFIXES | MARKDOWN_SUFFIXES
UPLOAD_MEDIA_TYPES = {
    ".pdf": "application/pdf",
    ".md": "text/markdown; charset=utf-8",
    ".markdown": "text/markdown; charset=utf-8",
    ".txt": "text/plain; charset=utf-8",
}
DEFAULT_INITIAL_PASSWORD = os.environ.get("LITDB_INITIAL_PASSWORD", "123456")
PASSWORD_HASH_ITERATIONS = int(os.environ.get("LITDB_PASSWORD_HASH_ITERATIONS", "210000"))
TEAM_USER_ROSTER = [
    {"name": "石慧", "module": "模块1"},
    {"name": "余淑仪", "module": "模块2"},
    {"name": "魏筱涵", "module": "模块3"},
    {"name": "周天成", "module": "模块4"},
    {"name": "汪岑一", "module": "模块4"},
    {"name": "顾诗妍", "module": "模块5"},
    {"name": "杨志霞", "module": "模块7"},
    {"name": "贺泽慧", "module": "模块9"},
    {"name": "陈梦思", "module": "模块10"},
    {"name": "吴鉴洲", "module": "模块8"},
    {"name": "潘灏瑜", "module": "模块12"},
    {"name": "李雪钰", "module": "模块13"},
    {"name": "樊豫颖", "module": "模块14"},
    {"name": "钱金奕", "module": ""},
    {"name": "姜懿", "module": ""},
    {"name": "侯星羽", "module": ""},
    {"name": "史鑫鑫", "module": ""},
    {"name": "陈影", "module": ""},
    {"name": "胡鲁诺", "module": ""},
]

UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
WORKSPACE_UPLOAD_ROOT.mkdir(parents=True, exist_ok=True)

logging.basicConfig(
    level=os.environ.get("LOG_LEVEL", "INFO"),
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("literature_app")

# Knowhere bridge for automated PDF parsing
import sys as _sys
_sys.path.insert(0, str(ROOT / "scripts"))
try:
    from knowhere_bridge import (  # type: ignore[import-untyped]
        submit_parse_job,
        handle_webhook_callback,
        verify_webhook_signature,
    )
    KNOWHERE_ENABLED = bool(os.environ.get("KNOWHERE_API_KEY", ""))
    if KNOWHERE_ENABLED:
        logger.info("Knowhere bridge loaded and enabled")
except ImportError:
    KNOWHERE_ENABLED = False
    logger.info("Knowhere bridge not available (import failed)")

SENTENCE_TERMINATORS = ".!?。！？"
SENTENCE_TRAILING_CLOSERS = "\"')]}”’）】"
NON_TERMINAL_ABBREVIATIONS = {
    "a.k.a.",
    "al.",
    "cf.",
    "dr.",
    "e.g.",
    "eq.",
    "fig.",
    "figs.",
    "i.e.",
    "inc.",
    "jr.",
    "ltd.",
    "mr.",
    "mrs.",
    "no.",
    "prof.",
    "ref.",
    "refs.",
    "sr.",
    "st.",
    "vs.",
}

app = FastAPI(
    title="SH Science Group Literature Database",
    description="APS literature review workspace with PaperQA-backed question answering.",
)

templates = Jinja2Templates(directory=str(ROOT / "templates"))
app.mount("/static", StaticFiles(directory=str(ROOT / "static")), name="static")


_engine_ready = False
_engine_error: str | None = None

SOURCE_LINE_RE = re.compile(r"(?:line|lines)\s+(\d+)(?:\s*[-–]\s*(\d+))?", re.IGNORECASE)
DISPLAY_LINE_REF_RE = re.compile(
    r"\s*[\[【(（]\s*(?:line|lines|行)\s*\d+(?:\s*[-–—~至到]\s*\d+)?\s*[\]】)）]",
    re.IGNORECASE,
)
ANSWER_CITATION_GROUP_RE = re.compile(
    r"\((?=[^)]*pmid[_:\s-]*\d+)(?=[^)]*(?:line|lines))([^)]*)\)",
    re.IGNORECASE,
)
ANSWER_CITATION_ITEM_RE = re.compile(
    r"pmid[_:\s-]*(\d+)\s*(?:line|lines)\s*(\d+)(?:\s*[-–—]\s*(\d+))?",
    re.IGNORECASE,
)


def clean_citation_key(value: str) -> str:
    key = str(value or "").strip().lstrip("@").strip("[]")
    key = re.sub(r"\s+", "_", key)
    key = re.sub(r"[\[\];,]+", "", key)
    return key[:160]


def author_year_citekey(authors: str, year: str, title: str = "") -> str:
    first_author = str(authors or "").split(";")[0].strip()
    author_token = re.sub(r"[^A-Za-z0-9]+", "", first_author.split(" ")[0] if first_author else "")
    year_token = re.sub(r"\D", "", str(year or ""))[:4]
    if author_token and year_token:
        return f"{author_token}{year_token}"
    title_token = re.sub(r"[^A-Za-z0-9]+", "", str(title or "").split(" ")[0] if title else "")
    return f"{title_token or 'source'}{year_token or 'nd'}"


def citation_key_for_metadata(metadata: dict[str, Any]) -> str:
    for field in ("citekey", "cite_key", "citation_key", "custom_citekey"):
        key = clean_citation_key(str(metadata.get(field, "")))
        if key:
            return key
    pmid = re.sub(r"\D", "", str(metadata.get("pmid", "")))
    if pmid:
        return f"pmid:{pmid}"
    doi = clean_citation_key(str(metadata.get("doi", "")))
    if doi:
        return f"doi:{doi}"
    return clean_citation_key(author_year_citekey(
        str(metadata.get("authors", "")),
        str(metadata.get("year", "")),
        str(metadata.get("title", "")),
    ))


def citation_key_for_evidence(item: dict[str, Any]) -> str:
    key = clean_citation_key(str(item.get("citekey", "")))
    if key:
        return key
    pmid = re.sub(r"\D", "", str(item.get("pmid", "")))
    if pmid:
        return f"pmid:{pmid}"
    doi = clean_citation_key(str(item.get("doi", "")))
    if doi:
        return f"doi:{doi}"
    doc_id = clean_citation_key(str(item.get("doc_id", "")))
    if doc_id:
        return f"doc:{doc_id}"
    source_name = clean_citation_key(author_year_citekey(
        str(item.get("source_name") or item.get("citation") or ""),
        str(item.get("year", "")),
        str(item.get("title", "")),
    ))
    return f"source:{source_name or 'uploaded'}"


def pandoc_citation(key: str) -> str:
    return f"[@{clean_citation_key(key)}]"


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
    # Strip UTF-8 BOM if present (\ufeff)
    if text.startswith("\ufeff"):
        text = text[1:]
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
        citation_metadata = {**metadata, "pmid": pmid, "title": title}
        papers.append(
            {
                "pmid": pmid,
                "paper_id": metadata.get("paper_id", f"pmid:{pmid}"),
                "citekey": citation_key_for_metadata(citation_metadata),
                "title": title,
                "authors": metadata.get("authors", ""),
                "year": metadata.get("year", ""),
                "journal": metadata.get("journal", ""),
                "doi": metadata.get("doi", ""),
                "priority": metadata.get("priority", ""),
                "priority_score": metadata.get("priority_score", ""),
                "aps_modules": metadata.get("aps_modules", ""),
                "study_types": metadata.get("study_types", ""),
                "is_clinical_case": metadata.get("is_clinical_case", ""),
                "primary_text_source": metadata.get("primary_text_source", ""),
                "knowhere_job_id": metadata.get("knowhere_job_id", ""),
                "abstract": abstract,
                "filename": path.name,
                "bytes": path.stat().st_size,
            }
        )
    return sorted(papers, key=paper_sort_key)


def split_multi_value(value: str) -> list[str]:
    return [item.strip() for item in re.split(r"[;|,]\s*", str(value or "")) if item.strip()]


def join_unique_tags(values: list[str]) -> str:
    seen: set[str] = set()
    tags: list[str] = []
    for value in values:
        clean = re.sub(r"\s+", " ", str(value or "")).strip()[:80]
        key = clean.casefold()
        if clean and key not in seen:
            seen.add(key)
            tags.append(clean)
    return "; ".join(tags)


def paper_tag_records() -> dict[str, dict[str, Any]]:
    records: dict[str, dict[str, Any]] = {}
    for item in load_json_list(PAPER_TAGS_FILE):
        pmid = re.sub(r"\D", "", str(item.get("pmid", "")))
        if pmid:
            records[pmid] = item
    return records


def custom_tag_registry() -> list[str]:
    return sorted(
        {
            tag
            for item in load_json_list(PAPER_TAG_REGISTRY_FILE)
            for tag in split_multi_value(str(item.get("tag", "")))
        },
        key=str.casefold,
    )


def paper_matches_modules(paper: dict[str, Any], module_filters: list[str]) -> bool:
    if not module_filters:
        return True
    values = {item.casefold() for item in split_multi_value(str(paper.get("filter_tags") or paper.get("aps_modules") or ""))}
    requested = {item.casefold() for item in module_filters if item}
    return bool(values & requested)


def priority_values_for_scope(scope: str) -> set[str]:
    clean = str(scope or "all_priorities_with_cases").strip().lower()
    if clean == "high_with_cases":
        return {"high"}
    if clean == "high_medium_with_cases":
        return {"high", "medium"}
    return {"high", "medium", "low"}


def is_unclassified_clinical_case(paper: dict[str, Any]) -> bool:
    priority = str(paper.get("priority", "")).strip().lower()
    if priority not in {"", "missing", "unassigned", "none", "na", "n/a"}:
        return False
    clinical_case = str(paper.get("is_clinical_case", "")).strip().lower()
    if clinical_case in {"1", "true", "yes", "y"}:
        return True
    study_types = str(paper.get("study_types", "")).lower()
    title = str(paper.get("title", "")).lower()
    return "case" in study_types or "case report" in title or "case series" in title


def paper_matches_priority_scope(paper: dict[str, Any], scope: str) -> bool:
    priority = str(paper.get("priority", "")).strip().lower()
    return priority in priority_values_for_scope(scope) or is_unclassified_clinical_case(paper)


def filtered_corpus_paths(module_filters: list[str], priority_scope: str = "all_priorities_with_cases") -> list[Path]:
    if not module_filters and not priority_scope:
        return []
    tag_records = paper_tag_records()
    paths: list[Path] = []
    for paper in load_papers():
        pmid = re.sub(r"\D", "", str(paper.get("pmid", "")))
        custom_tags = split_multi_value(str((tag_records.get(pmid) or {}).get("tags", "")))
        paper["filter_tags"] = join_unique_tags(split_multi_value(str(paper.get("aps_modules", ""))) + custom_tags)
        if not paper_matches_modules(paper, module_filters):
            continue
        if priority_scope and not paper_matches_priority_scope(paper, priority_scope):
            continue
        path = (CORPUS_DIR / str(paper.get("filename", ""))).resolve()
        try:
            path.relative_to(CORPUS_DIR)
        except ValueError:
            continue
        if path.exists():
            paths.append(path)
    return paths


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


LATEX_SYMBOLS = {
    r"\alpha": "α",
    r"\beta": "β",
    r"\gamma": "γ",
    r"\delta": "δ",
    r"\epsilon": "ε",
    r"\kappa": "κ",
    r"\lambda": "λ",
    r"\mu": "μ",
    r"\pi": "π",
    r"\sigma": "σ",
    r"\tau": "τ",
    r"\phi": "φ",
    r"\chi": "χ",
    r"\omega": "ω",
}


def normalize_latex_inline(value: str) -> str:
    """Make common inline LaTeX fragments readable in rendered article text."""

    def render_math(match: re.Match[str]) -> str:
        expr = match.group(1)
        expr = re.sub(r"\\(?:mathrm|text|operatorname)\{([^{}]*)\}", r"\1", expr)
        expr = re.sub(r"\\(?:mathbf|mathit|mathsf)\{([^{}]*)\}", r"\1", expr)
        for command, symbol in LATEX_SYMBOLS.items():
            expr = expr.replace(command, symbol)
        expr = re.sub(r"\\([A-Za-z]+)", r"\1", expr)
        expr = expr.replace("{", "").replace("}", "")
        expr = re.sub(r"\s+", " ", expr).strip()
        expr = re.sub(r"([A-Za-zΑ-ω])\s+(\d)", r"\1\2", expr)
        expr = re.sub(r"(\d)\s+([A-Za-zΑ-ω])", r"\1\2", expr)
        return expr

    cleaned = re.sub(r"\$\s*([^$]+?)\s*\$", render_math, value or "")
    cleaned = re.sub(r"\(\s+([^()]*?)\s+\)", r"(\1)", cleaned)
    cleaned = re.sub(r"(?<=[A-Za-z0-9Α-ω])\s+-\s*(?=[A-Za-zΑ-ω])", "-", cleaned)
    cleaned = re.sub(r"\s+([,.;:!?，。；：！？])", r"\1", cleaned)
    return cleaned


def strip_markdown_inline(value: str) -> str:
    cleaned = normalize_latex_inline(value)
    cleaned = re.sub(r"!\[([^\]]*)\]\([^)]+\)", r"\1", cleaned)
    cleaned = re.sub(r"\[([^\]]+)\]\([^)]+\)", r"\1", cleaned)
    cleaned = re.sub(r"[*_`]+", "", cleaned)
    cleaned = re.sub(r"<[^>]+>", "", cleaned)
    return cleaned.strip()


def strip_display_line_references(value: str) -> str:
    cleaned = DISPLAY_LINE_REF_RE.sub("", value or "")
    cleaned = re.sub(r"\s+(?:line|lines)\s+\d+(?:\s*[-–—]\s*\d+)?", "", cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r"\s+([,.;:!?，。；：！？])", r"\1", cleaned)
    return re.sub(r"[ \t]{2,}", " ", cleaned).strip()


def display_module_label(value: str) -> str:
    clean = (value or "").strip()
    if not clean:
        return ""
    return re.sub(r"^module[_-]?\d+[_-]?", "", clean, flags=re.IGNORECASE).replace("_", " ").title()


def _previous_token(value: str, index: int) -> str:
    prefix = value[: index + 1].rstrip()
    match = re.search(r"([A-Za-z](?:[A-Za-z.]*[A-Za-z])?\.)$", prefix)
    return match.group(1).lower() if match else ""


def _next_content_index(value: str, index: int) -> int:
    cursor = index + 1
    while cursor < len(value) and value[cursor] in SENTENCE_TRAILING_CLOSERS:
        cursor += 1
    while cursor < len(value) and value[cursor].isspace():
        cursor += 1
    return cursor


def _is_sentence_boundary(value: str, index: int) -> bool:
    char = value[index]
    if char not in SENTENCE_TERMINATORS:
        return False
    if char == ".":
        previous_char = value[index - 1] if index > 0 else ""
        next_char = value[index + 1] if index + 1 < len(value) else ""
        if previous_char.isdigit() and next_char.isdigit():
            return False
        token = _previous_token(value, index)
        if token in NON_TERMINAL_ABBREVIATIONS or value[: index + 1].lower().endswith("et al."):
            return False
        if len(token) == 2 and token[0].isalpha():
            initial_start = index - 1
            before_initial = value[initial_start - 1] if initial_start > 0 else " "
            if before_initial.isspace() or before_initial in "([{\"'“‘":
                return False
        if next_char and (next_char.isalpha() or next_char.isdigit()) and not next_char.isspace():
            return False
    next_index = _next_content_index(value, index)
    if next_index >= len(value):
        return True
    next_char = value[next_index]
    if next_char in SENTENCE_TERMINATORS:
        return False
    return next_char.isupper() or next_char.isdigit() or next_char in "([{\"'“‘"


def _merge_sentence_fragments(sentences: list[str]) -> list[str]:
    merged: list[str] = []
    continuation_re = re.compile(
        r"^(and|or|but|whereas|while|which|that|including|however|therefore|thus|then|also)\b",
        re.IGNORECASE,
    )
    for sentence in sentences:
        if merged and continuation_re.match(sentence):
            merged[-1] = f"{merged[-1]} {sentence}".strip()
        else:
            merged.append(sentence)
    return merged


def split_sentences(text: str) -> list[str]:
    cleaned = re.sub(r"\s+", " ", strip_markdown_inline(text)).strip()
    if not cleaned:
        return []
    sentences: list[str] = []
    start = 0
    index = 0
    while index < len(cleaned):
        if _is_sentence_boundary(cleaned, index):
            end = index + 1
            while end < len(cleaned) and cleaned[end] in SENTENCE_TRAILING_CLOSERS:
                end += 1
            sentence = cleaned[start:end].strip()
            if sentence:
                sentences.append(sentence)
            start = end
            while start < len(cleaned) and cleaned[start].isspace():
                start += 1
            index = start
            continue
        index += 1
    tail = cleaned[start:].strip()
    if tail:
        sentences.append(tail)
    return _merge_sentence_fragments(sentences)



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
    citekey = citation_key_for_metadata({**detail["metadata"], "pmid": pmid})
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
                    "doi": detail["metadata"].get("doi", ""),
                    "title": detail["metadata"].get("title", ""),
                    "citekey": citekey,
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


def match_workspace_document(workspace: dict[str, Any], source: dict[str, Any]) -> dict[str, Any] | None:
    docs = workspace.get("documents") or []
    haystack = " ".join(
        str(source.get(key, ""))
        for key in ("name", "citation", "filename", "doc_id")
    ).lower()
    for document in docs:
        filename = str(document.get("filename", ""))
        original = str(document.get("original_filename", ""))
        stem = Path(filename).stem.lower()
        original_stem = Path(original).stem.lower()
        if stem and stem in haystack:
            return document
        if original_stem and original_stem in haystack:
            return document
    return docs[0] if len(docs) == 1 else None


def enrich_workspace_contexts(workspace: dict[str, Any], contexts: list[dict[str, Any]]) -> list[dict[str, Any]]:
    enriched = []
    for source_index, source in enumerate(contexts, start=1):
        item = dict(source)
        document = match_workspace_document(workspace, item)
        if document:
            public_doc = public_workspace_document(workspace, document)
            item["doc_id"] = public_doc["id"]
            item["pdf_url"] = public_doc["pdf_url"]
            item["file_url"] = public_doc["file_url"]
            item["url"] = public_doc["pdf_url"] or public_doc["file_url"]
            item["citation"] = item.get("citation") or public_doc["original_filename"]
        context_text = strip_markdown_inline(str(item.get("text", ""))).strip()
        sentences = [sentence for sentence in split_sentences(context_text) if len(sentence) >= 20]
        if not sentences and context_text:
            sentences = [context_text[:900]]
        evidences = []
        for sentence_index, sentence in enumerate(sentences[:5], start=1):
            evidence_id = f"w{source_index}-{sentence_index}"
            evidences.append(
                {
                    "id": evidence_id,
                    "text": sentence,
                    "section": "File excerpt",
                    "pmid": public_doc.get("pmid", "") if document else "",
                    "citekey": public_doc.get("citekey", "") if document else citation_key_for_evidence(item),
                    "doc_id": item.get("doc_id") or f"source-{source_index}",
                    "source_name": item.get("citation") or item.get("name") or "",
                    "url": item.get("pdf_url") or item.get("file_url") or item.get("url") or "",
                }
            )
        item["evidence"] = evidences
        enriched.append(item)
    return enriched


def answer_citation_url(pmid: str, line_start: int, line_end: int) -> str:
    safe_pmid = re.sub(r"\D", "", pmid)
    if not safe_pmid:
        return ""
    start = max(1, line_start)
    end = max(start, line_end)
    try:
        sentences = list(evidence_index_for_pmid(safe_pmid))
    except HTTPException:
        return f"/papers/{safe_pmid}"
    matches = [
        sentence
        for sentence in sentences
        if sentence["line_start"] <= end and sentence["line_end"] >= start
    ]
    if not matches and sentences:
        matches = sorted(sentences, key=lambda item: abs(item["line_start"] - start))[:1]
    if not matches:
        return f"/papers/{safe_pmid}"
    highlight_ids = ",".join(sentence["id"] for sentence in matches[:8])
    return f"/papers/{safe_pmid}?highlight={highlight_ids}#{matches[0]['id']}"


def parse_answer_citation_segments(answer: str) -> list[dict[str, Any]]:
    segments: list[dict[str, Any]] = []
    last_index = 0
    for group_match in ANSWER_CITATION_GROUP_RE.finditer(answer or ""):
        citations = []
        for item_match in ANSWER_CITATION_ITEM_RE.finditer(group_match.group(1)):
            pmid = item_match.group(1)
            line_start = int(item_match.group(2))
            line_end = int(item_match.group(3) or line_start)
            citations.append(
                {
                    "pmid": pmid,
                    "label": f"PMID {pmid}",
                    "url": answer_citation_url(pmid, line_start, line_end),
                }
            )
        if not citations:
            continue
        if group_match.start() > last_index:
            segments.append({"type": "text", "text": answer[last_index : group_match.start()]})
        segments.append({"type": "citations", "citations": citations})
        last_index = group_match.end()
    if last_index < len(answer or ""):
        segments.append({"type": "text", "text": (answer or "")[last_index:]})
    if not segments:
        return [{"type": "text", "text": strip_display_line_references(answer or "")}]
    return segments


def answer_segments_to_text(segments: list[dict[str, Any]]) -> str:
    parts = []
    for segment in segments:
        if segment.get("type") == "citations":
            labels = [citation.get("label", "") for citation in segment.get("citations", [])]
            parts.append(f" ({'; '.join(label for label in labels if label)})")
        else:
            parts.append(str(segment.get("text", "")))
    return re.sub(r"[ \t]{2,}", " ", "".join(parts)).strip()


def evidence_source_label(item: dict[str, Any]) -> str:
    pmid = str(item.get("pmid", "")).strip()
    if pmid:
        return f"PMID {pmid}"
    source_name = str(item.get("source_name") or item.get("citation") or item.get("doc_id") or "uploaded file").strip()
    return source_name[:140]


def draft_evidence_reference(item: dict[str, Any]) -> dict[str, Any]:
    pmid = re.sub(r"\D", "", str(item.get("pmid", "")))
    metadata: dict[str, Any] = {}
    if pmid:
        try:
            paper = get_paper_by_pmid(pmid)
            metadata = paper.get("metadata", {})
        except HTTPException:
            metadata = {}
    citekey = citation_key_for_evidence({
        **metadata,
        **item,
        "pmid": pmid or item.get("pmid", ""),
    })
    return {
        "citekey": citekey,
        "citation": pandoc_citation(citekey),
        "pmid": pmid,
        "doi": metadata.get("doi") or item.get("doi", ""),
        "title": metadata.get("title") or item.get("title") or item.get("citation") or item.get("source_name", ""),
        "authors": metadata.get("authors") or item.get("authors", ""),
        "year": metadata.get("year") or item.get("year", ""),
        "journal": metadata.get("journal") or item.get("journal", ""),
    }


def normalize_draft_citations(draft: str, allowed_keys: set[str]) -> str:
    cleaned = draft or ""
    for key in allowed_keys:
        if key.startswith("pmid:"):
            pmid = re.escape(key.split(":", 1)[1])
            cleaned = re.sub(rf"\bPMID\s*{pmid}\b", pandoc_citation(key), cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r"\[(\d{1,3}(?:\s*[,;-]\s*\d{1,3})*)\]", "", cleaned)
    cleaned = re.sub(r"\s+([,.;:!?，。；：！？])", r"\1", cleaned)
    return re.sub(r"[ \t]{2,}", " ", cleaned).strip()


def unique_reference_rows(items: list[dict[str, Any]]) -> list[dict[str, Any]]:
    rows = []
    seen = set()
    for item in items:
        citekey = item.get("citekey")
        if not citekey or citekey in seen:
            continue
        seen.add(citekey)
        rows.append({key: item.get(key, "") for key in ("citekey", "citation", "pmid", "doi", "title", "authors", "year", "journal")})
    return rows


NATURE_REVIEW_DRAFTING_PROFILE = "nature_review_synthesis_v1"

NATURE_REVIEW_DRAFTING_RULES = """
Write as a Nature-leaning biomedical review author, but do not imitate a journal house style mechanically.

Core writing task:
- Produce manuscript prose, not a RAG summary, notes, bullets, or a reference list.
- Build synthesis across evidence rather than listing papers one by one.
- Each paragraph must have one controlling idea.
- For important scientific statements, keep claim, evidence, and boundary visible.
- State the shared pattern first, then exceptions, uncertainty, study-type limits, or disagreement.

Evidence discipline:
- Use only the supplied evidence for factual claims.
- Do not merge two retrieved claims into one stronger claim.
- Do not upgrade association to causation.
- Do not imply consensus when evidence is narrow, indirect, or conflicting.
- If evidence conflicts, write the conflict explicitly rather than smoothing it away.
- Do not invent mechanisms, citations, PMIDs, DOIs, statistics, sample sizes, trial results, or novelty claims.

Citation discipline:
- Preserve Pandoc citation keys exactly, for example [@pmid:16420554].
- Keep each citation key next to the specific clause or sentence it supports.
- Do not output numbered citations such as [1] or [2].
- Do not output a bibliography or reference list.
- Do not invent citation keys.

Style:
- Prefer precise, cautious academic prose over confident overstatement.
- Avoid rhetorical questions, bullet points, and conversational phrasing.
- Avoid em dashes. Use commas, parentheses, or shorter sentences.
- Keep sentences controlled; split overloaded sentences.
- Use British spelling in English output.
- Define abbreviations on first use when the evidence makes the definition clear.
- Output only the manuscript draft prose.
""".strip()

APS_REVIEW_CONTEXT_RULES = """
APS review context:
- Respect APS review modules when evidence implies them:
  clinical framing/classification/epidemiology/diagnosis;
  autoantigens/antibodies/laboratory assays/epitope biology;
  immunothrombosis/complement/platelets/NETs/coagulation;
  microvascular disease/organ damage/pregnancy morbidity/pathology;
  therapeutics/anticoagulation/immunomodulation/trials;
  future directions/biomarkers/trial design/emerging methods.
- If a paragraph crosses modules, make the transition explicit.
""".strip()


def draft_style_instruction(language: str) -> str:
    if language == "Chinese":
        return (
            "Write in polished Chinese academic prose suitable for a biomedical review draft. "
            "Preserve standard English technical terms where appropriate, and preserve citation keys exactly."
        )
    return (
        "Write in polished English biomedical review prose with Nature-leaning restraint, clear logic, "
        "British spelling, and precise hedging."
    )


def normalize_library_context(value: str) -> str:
    clean = re.sub(r"[^a-z0-9_-]+", "_", (value or "").strip().lower()).strip("_")
    return clean if clean in {"aps_review", "general_review"} else "general_review"


def context_specific_drafting_rules(library_context: str) -> str:
    if normalize_library_context(library_context) == "aps_review":
        return f"\n{APS_REVIEW_CONTEXT_RULES}\n"
    return ""


def markdown_inline_html(
    text: str,
    highlight_ids: set[str],
    sentence_lookup: dict[str, str],
    sentence_meta: dict[str, dict[str, Any]],
    pmid: str,
    title: str,
) -> str:
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
            meta = sentence_meta.get(sentence_id, {})
            section = html.escape(str(meta.get("section", "")))
            citekey = html.escape(str(meta.get("citekey") or citation_key_for_evidence({"pmid": pmid})))
            url = f"/papers/{pmid}?highlight={sentence_id}#{sentence_id}"
            parts.append(
                f'<span class="{classes}" id="{html.escape(sentence_id)}" '
                f'data-sentence-id="{html.escape(sentence_id)}" '
                f'data-pmid="{html.escape(pmid)}" '
                f'data-citekey="{citekey}" '
                f'data-section="{section}" '
                f'data-title="{html.escape(title)}" '
                f'data-url="{html.escape(url)}">{safe}</span>'
            )
        else:
            parts.append(safe)
        if idx >= 0:
            remaining = remaining[idx + len(sentence) :]
    if not parts:
        return html.escape(strip_markdown_inline(text))
    return " ".join(parts)


def render_markdown_article(body: str, highlight_ids: set[str], pmid: str, title: str) -> str:
    index = evidence_index_for_pmid_from_body(body)
    sentence_lookup = {normalize_text(item["text"]): item["id"] for item in index}
    sentence_meta = {item["id"]: item for item in index}
    html_parts: list[str] = []
    for block in iter_text_blocks(body):
        if normalize_text(block["section"]) == "metadata":
            continue
        if block["type"] == "heading":
            level = min(max(int(block.get("level", 2)), 1), 4)
            text = html.escape(block["text"])
            html_parts.append(f"<h{level}>{text}</h{level}>")
        else:
            rendered = markdown_inline_html(block["text"], highlight_ids, sentence_lookup, sentence_meta, pmid, title)
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
    metadata["citekey"] = citation_key_for_metadata({**metadata, "pmid": safe_pmid})
    return {
        "metadata": metadata,
        "body_preview": body[:8000],
        "body": body,
        "filename": path.name,
        "bytes": path.stat().st_size,
        "pdf_upload": public_pdf_upload(latest_pdf_uploads_by_pmid().get(safe_pmid)),
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


def upload_file_path(item: dict[str, Any]) -> Path | None:
    filename = str(item.get("filename") or "")
    if not filename:
        return None
    path = (UPLOAD_DIR / filename).resolve()
    try:
        path.relative_to(UPLOAD_DIR)
    except ValueError:
        return None
    if path.exists() and path.suffix.lower() in SUPPORTED_UPLOAD_SUFFIXES:
        return path
    return None


def public_file_upload(item: dict[str, Any] | None) -> dict[str, Any] | None:
    if not item or upload_file_path(item) is None:
        return None
    upload_id = int(item.get("id", 0) or 0)
    if not upload_id:
        return None
    file_type = item.get("file_type") or upload_file_type(str(item.get("filename", "")))
    return {
        "available": True,
        "id": upload_id,
        "url": f"/api/uploads/{upload_id}/file",
        "file_type": file_type,
        "filename": item.get("filename", ""),
        "original_filename": item.get("original_filename", ""),
        "uploaded_at": item.get("uploaded_at", ""),
        "uploader_name": item.get("uploader_name", ""),
        "status": item.get("status", "uploaded"),
    }


def public_pdf_upload(item: dict[str, Any] | None) -> dict[str, Any] | None:
    public = public_file_upload(item)
    if not public or public.get("file_type") != "pdf":
        return None
    return public


def latest_pdf_uploads_by_pmid() -> dict[str, dict[str, Any]]:
    uploads = sorted(
        load_uploads_metadata(),
        key=lambda item: (str(item.get("uploaded_at", "")), int(item.get("id", 0) or 0)),
        reverse=True,
    )
    by_pmid: dict[str, dict[str, Any]] = {}
    for item in uploads:
        pmid = re.sub(r"\D", "", str(item.get("pmid", "")))
        if (item.get("file_type") or upload_file_type(str(item.get("filename", "")))) != "pdf":
            continue
        if not pmid or pmid in by_pmid or upload_file_path(item) is None:
            continue
        by_pmid[pmid] = item
    return by_pmid


def paper_with_pdf_upload(paper: dict[str, Any], pdf_uploads: dict[str, dict[str, Any]]) -> dict[str, Any]:
    row = dict(paper)
    pmid = re.sub(r"\D", "", str(row.get("pmid", "")))
    row["pdf_upload"] = public_pdf_upload(pdf_uploads.get(pmid))
    return row


def load_json_list(path: Path) -> list[dict[str, Any]]:
    if not path.exists():
        return []
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
        return data if isinstance(data, list) else []
    except (json.JSONDecodeError, OSError):
        logger.warning("JSON metadata file could not be read: %s", path)
        return []


def save_json_list(path: Path, rows: list[dict[str, Any]]) -> None:
    path.write_text(json.dumps(rows, indent=2, ensure_ascii=False), encoding="utf-8")


def slugify_workspace_name(name: str) -> str:
    clean = re.sub(r"\s+", " ", str(name or "")).strip()
    if not clean:
        raise HTTPException(status_code=400, detail="Workspace name is required")
    slug = re.sub(r"[^A-Za-z0-9._-]+", "-", clean).strip("-._").lower()
    return (slug or "workspace")[:48]


def load_workspaces() -> list[dict[str, Any]]:
    return load_json_list(WORKSPACE_METADATA_FILE)


def save_workspaces(workspaces: list[dict[str, Any]]) -> None:
    save_json_list(WORKSPACE_METADATA_FILE, workspaces)


def workspace_dir(workspace_id: str) -> Path:
    safe_id = re.sub(r"[^A-Za-z0-9._-]+", "", workspace_id or "")
    if not safe_id:
        raise HTTPException(status_code=404, detail="Workspace not found")
    path = (WORKSPACE_UPLOAD_ROOT / safe_id).resolve()
    try:
        path.relative_to(WORKSPACE_UPLOAD_ROOT)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid workspace path")
    return path


def find_workspace(workspace_id: str) -> dict[str, Any]:
    for workspace in load_workspaces():
        if workspace.get("id") == workspace_id:
            return workspace
    raise HTTPException(status_code=404, detail="Workspace not found")


def public_workspace(workspace: dict[str, Any]) -> dict[str, Any]:
    docs = workspace.get("documents") or []
    library_type = str(workspace.get("library_type") or workspace.get("type") or "personal")
    return {
        "id": workspace.get("id", ""),
        "name": workspace.get("name", ""),
        "description": workspace.get("description", ""),
        "library_type": library_type,
        "owner_user_id": workspace.get("owner_user_id", ""),
        "owner_name": workspace.get("owner_name") or workspace.get("created_by", ""),
        "created_by": workspace.get("created_by", ""),
        "created_at": workspace.get("created_at", ""),
        "updated_at": workspace.get("updated_at", ""),
        "document_count": len(docs),
        "requires_pmid": library_type == "team",
        "can_owner_delete": library_type == "personal",
    }


def user_owns_workspace(workspace: dict[str, Any], user: dict[str, Any] | None, body: dict[str, Any]) -> bool:
    owner_id = str(workspace.get("owner_user_id") or "")
    owner_name = str(workspace.get("owner_name") or workspace.get("created_by") or "").casefold()
    request_name = str(body.get("user_name") or "").strip().casefold()
    return bool(user and owner_id and user.get("id") == owner_id) or bool(request_name and request_name == owner_name)


def safe_workspace_upload_name(filename: str) -> str:
    suffix = Path(filename).suffix.lower()
    base = Path(filename).stem
    safe_base = re.sub(r"[^A-Za-z0-9._-]+", "_", base).strip("._") or "paper"
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    return f"{timestamp}_{safe_base}{suffix}"


def workspace_document_path(workspace: dict[str, Any], document: dict[str, Any]) -> Path | None:
    filename = str(document.get("filename") or "")
    if not filename:
        return None
    path = (workspace_dir(str(workspace.get("id", ""))) / "pdfs" / filename).resolve()
    if not path.exists():
        path = (workspace_dir(str(workspace.get("id", ""))) / "files" / filename).resolve()
    try:
        path.relative_to(workspace_dir(str(workspace.get("id", ""))))
    except ValueError:
        return None
    return path if path.exists() and path.suffix.lower() in SUPPORTED_UPLOAD_SUFFIXES else None


def public_workspace_document(workspace: dict[str, Any], document: dict[str, Any]) -> dict[str, Any]:
    workspace_id = str(workspace.get("id", ""))
    document_id = str(document.get("id", ""))
    citekey = citation_key_for_evidence({
        "pmid": document.get("pmid", ""),
        "doc_id": document_id,
        "source_name": document.get("original_filename") or document.get("filename", ""),
    })
    return {
        "id": document_id,
        "workspace_id": workspace_id,
        "filename": document.get("filename", ""),
        "original_filename": document.get("original_filename", ""),
        "uploaded_by": document.get("uploaded_by", ""),
        "uploaded_at": document.get("uploaded_at", ""),
        "file_size": document.get("file_size", 0),
        "pmid": document.get("pmid", ""),
        "citekey": citekey,
        "status": document.get("status", "uploaded"),
        "file_type": document.get("file_type") or upload_file_type(str(document.get("filename", ""))),
        "file_url": f"/api/workspaces/{workspace_id}/pdfs/{document_id}/file",
        "pdf_url": f"/api/workspaces/{workspace_id}/pdfs/{document_id}/file"
        if (document.get("file_type") or upload_file_type(str(document.get("filename", "")))) == "pdf"
        else "",
    }


def normalize_library_type(value: str) -> str:
    raw = str(value or "personal").strip().lower()
    if raw in {"team", "collaborative", "large"}:
        return "team"
    return "personal"


def normalize_user_name(name: str) -> str:
    cleaned = re.sub(r"\s+", " ", str(name or "")).strip()
    if not cleaned:
        raise HTTPException(status_code=400, detail="User name is required")
    return cleaned[:80]


def team_user_by_name(name: str) -> dict[str, str] | None:
    normalized = normalize_user_name(name).casefold()
    for user in TEAM_USER_ROSTER:
        if user["name"].casefold() == normalized:
            return user
    return None


def hash_password(password: str, salt_hex: str | None = None) -> str:
    salt = bytes.fromhex(salt_hex) if salt_hex else os.urandom(16)
    digest = hashlib.pbkdf2_hmac(
        "sha256",
        str(password).encode("utf-8"),
        salt,
        PASSWORD_HASH_ITERATIONS,
    )
    return f"pbkdf2_sha256${PASSWORD_HASH_ITERATIONS}${salt.hex()}${digest.hex()}"


def verify_password(password: str, stored_hash: str) -> bool:
    parts = str(stored_hash or "").split("$")
    if len(parts) != 4 or parts[0] != "pbkdf2_sha256":
        return False
    try:
        iterations = int(parts[1])
        salt = bytes.fromhex(parts[2])
        expected = bytes.fromhex(parts[3])
    except ValueError:
        return False
    digest = hashlib.pbkdf2_hmac("sha256", str(password).encode("utf-8"), salt, iterations)
    return hmac.compare_digest(digest, expected)


def public_user(user: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": user.get("id", ""),
        "name": user.get("name", ""),
        "token": user.get("token", ""),
        "module": user.get("module", ""),
        "must_change_password": not bool(user.get("password_changed")),
        "last_seen_at": user.get("last_seen_at", ""),
    }


def ensure_team_users() -> list[dict[str, Any]]:
    users = load_json_list(USER_METADATA_FILE)
    by_name = {str(item.get("name", "")).casefold(): item for item in users if item.get("name")}
    now = datetime.now().isoformat()
    changed = False
    for roster_user in TEAM_USER_ROSTER:
        key = roster_user["name"].casefold()
        user = by_name.get(key)
        if user is None:
            user = {
                "id": str(uuid.uuid4()),
                "name": roster_user["name"],
                "module": roster_user.get("module", ""),
                "token": str(uuid.uuid4()),
                "password_hash": hash_password(DEFAULT_INITIAL_PASSWORD),
                "password_changed": False,
                "created_at": now,
                "last_seen_at": "",
            }
            users.append(user)
            by_name[key] = user
            changed = True
            continue
        if user.get("name") != roster_user["name"]:
            user["name"] = roster_user["name"]
            changed = True
        if user.get("module", "") != roster_user.get("module", ""):
            user["module"] = roster_user.get("module", "")
            changed = True
        if not user.get("id"):
            user["id"] = str(uuid.uuid4())
            changed = True
        if not user.get("token"):
            user["token"] = str(uuid.uuid4())
            changed = True
        if not user.get("password_hash"):
            user["password_hash"] = hash_password(DEFAULT_INITIAL_PASSWORD)
            user["password_changed"] = False
            changed = True
        if "password_changed" not in user:
            user["password_changed"] = False
            changed = True
    if changed:
        save_json_list(USER_METADATA_FILE, users)
    return users


def find_user_by_token(token: str | None, *, allow_pending_password: bool = False) -> dict[str, Any] | None:
    if not token:
        return None
    for user in ensure_team_users():
        if user.get("token") == token:
            if not allow_pending_password and not bool(user.get("password_changed")):
                return None
            return user
    return None


def resolve_user_from_body(body: dict[str, Any]) -> dict[str, Any] | None:
    user = find_user_by_token(str(body.get("user_token") or ""))
    if user:
        return user
    return None


def note_owner_key(user: dict[str, Any] | None) -> str:
    if not user:
        return ""
    return str(user.get("id") or user.get("name") or "").strip().casefold()


def paper_notes_for_user(user: dict[str, Any] | None) -> dict[str, dict[str, Any]]:
    owner = note_owner_key(user)
    if not owner:
        return {}
    notes: dict[str, dict[str, Any]] = {}
    for item in load_json_list(PAPER_NOTES_FILE):
        item_owner = str(item.get("user_id") or item.get("user_name") or "").strip().casefold()
        pmid = re.sub(r"\D", "", str(item.get("pmid", "")))
        if pmid and item_owner == owner:
            notes[pmid] = item
    return notes


def save_draft_record(
    *,
    user: dict[str, Any] | None,
    draft_type: str,
    draft: str,
    evidence_count: int,
    paragraph_count: int = 1,
    prompt_meta: dict[str, Any] | None = None,
) -> dict[str, Any] | None:
    if not user:
        return None
    records = load_json_list(DRAFT_HISTORY_FILE)
    record = {
        "id": str(uuid.uuid4()),
        "user_id": user.get("id"),
        "user_name": user.get("name", ""),
        "type": draft_type,
        "draft": draft,
        "evidence_count": evidence_count,
        "paragraph_count": paragraph_count,
        "prompt_meta": prompt_meta or {},
        "pinned": False,
        "created_at": datetime.now().isoformat(),
    }
    records.append(record)
    save_json_list(DRAFT_HISTORY_FILE, records[-500:])
    return record


def safe_upload_name(filename: str, pmid: str) -> str:
    suffix = Path(filename).suffix.lower()
    base = Path(filename).stem
    safe_base = re.sub(r"[^A-Za-z0-9._-]+", "_", base).strip("._") or "paper"
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    return f"pmid_{pmid}_{timestamp}_{safe_base}{suffix}"


def upload_suffix(filename: str | None) -> str:
    return Path(filename or "").suffix.lower()


def upload_file_type(filename: str | None) -> str:
    suffix = upload_suffix(filename)
    if suffix in PDF_SUFFIXES:
        return "pdf"
    if suffix in MARKDOWN_SUFFIXES:
        return "markdown"
    return "file"


def ensure_supported_upload(filename: str | None) -> str:
    suffix = upload_suffix(filename)
    if not filename or suffix not in SUPPORTED_UPLOAD_SUFFIXES:
        raise HTTPException(status_code=400, detail="Only PDF, Markdown, and text files are accepted")
    return suffix


def file_response_media_type(path: Path) -> str:
    return UPLOAD_MEDIA_TYPES.get(path.suffix.lower(), "application/octet-stream")


def markdown_upload_to_corpus(pmid: str, source_path: Path, original_filename: str) -> Path:
    safe_pmid = re.sub(r"\D", "", pmid)
    if not safe_pmid:
        raise HTTPException(status_code=400, detail="A numeric PMID is required")

    raw_text = source_path.read_text(encoding="utf-8", errors="replace").strip()
    if not raw_text:
        raise HTTPException(status_code=400, detail="Markdown file is empty")

    metadata, body = parse_frontmatter(raw_text)
    if not metadata:
        title = first_heading(raw_text) or Path(original_filename).stem or f"PMID {safe_pmid}"
        if re.search(r"^#{1,6}\s+", raw_text, flags=re.MULTILINE):
            body = raw_text
        else:
            body = f"# {title}\n\n## Abstract\n\n{raw_text}"
        raw_text = "\n".join([
            "---",
            f"pmid: {safe_pmid}",
            f"title: {title}",
            "primary_text_source: uploaded_markdown",
            "---",
            "",
            body.strip(),
            "",
        ])
    elif "pmid" not in {key.lower() for key in metadata}:
        raw_text = raw_text.replace("---", f"---\npmid: {safe_pmid}", 1)

    target = CORPUS_DIR / f"pmid_{safe_pmid}.md"
    if target.exists():
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        target = CORPUS_DIR / f"pmid_{safe_pmid}_upload_{timestamp}.md"
    target.write_text(raw_text, encoding="utf-8")
    return target


def knowhere_webhook_url() -> str:
    base_url = (
        os.environ.get("PAPERQA_BASE_URL")
        or os.environ.get("PUBLIC_BASE_URL")
        or os.environ.get("APP_BASE_URL")
        or f"http://localhost:{PORT}"
    )
    return f"{base_url.rstrip('/')}/api/knowhere-webhook"


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


def reload_engine_background(reason: str = "") -> None:
    global _engine_error
    api_key = get_api_key()
    if not api_key:
        _engine_error = "DEEPSEEK_API_KEY or PAPERQA_API_KEY is not configured"
        logger.error(_engine_error)
        return

    import threading

    def _reload(k):
        global _engine_ready, _engine_error
        import asyncio
        new_loop = asyncio.new_event_loop()
        asyncio.set_event_loop(new_loop)
        try:
            from paperqa_engine import reload_engine

            docs = new_loop.run_until_complete(reload_engine(api_key=k, corpus_dir=CORPUS_DIR))
            _engine_ready = True
            _engine_error = None
            logger.info("PaperQA engine reloaded after %s: %s docs", reason or "corpus update", len(docs.docs))
        except Exception as exc:
            _engine_error = str(exc)
            logger.exception("PaperQA reload failed after %s", reason or "corpus update")
        finally:
            new_loop.close()

    thread = threading.Thread(target=_reload, args=(api_key,), daemon=True)
    thread.start()
    logger.info("PaperQA background reload started: %s", reason or "corpus update")


def add_paper_to_engine_background(markdown_path: str, reason: str = "") -> None:
    global _engine_error
    api_key = get_api_key()
    if not api_key:
        _engine_error = "DEEPSEEK_API_KEY or PAPERQA_API_KEY is not configured"
        logger.error(_engine_error)
        return
    if not markdown_path:
        logger.warning("Skip PaperQA incremental add: missing markdown path")
        return

    import threading

    def _add(k, path_value):
        global _engine_ready, _engine_error
        import asyncio
        new_loop = asyncio.new_event_loop()
        asyncio.set_event_loop(new_loop)
        try:
            from paperqa_engine import add_markdown_file

            result = new_loop.run_until_complete(add_markdown_file(path_value, api_key=k))
            if result.get("added"):
                _engine_ready = True
                _engine_error = None
                logger.info(
                    "PaperQA incremental add after %s: %s docs",
                    reason or "corpus update",
                    result.get("docs_count"),
                )
            else:
                logger.info(
                    "PaperQA incremental add deferred after %s: %s",
                    reason or "corpus update",
                    result.get("reason"),
                )
        except Exception as exc:
            _engine_error = str(exc)
            logger.exception("PaperQA incremental add failed after %s", reason or "corpus update")
        finally:
            new_loop.close()

    thread = threading.Thread(target=_add, args=(api_key, markdown_path), daemon=True)
    thread.start()
    logger.info("PaperQA incremental add started: %s", reason or markdown_path)


@app.on_event("startup")
async def startup_event() -> None:
    import threading

    logger.info("Starting literature database app")
    logger.info("Corpus directory: %s", CORPUS_DIR)
    logger.info("Upload directory: %s", UPLOAD_DIR)
    ensure_team_users()
    thread = threading.Thread(target=init_engine_background, daemon=True)
    thread.start()


@app.get("/", response_class=HTMLResponse)
async def index(request: Request):
    return templates.TemplateResponse(request, "index.html")


@app.post("/api/auth/login")
async def api_auth_login(request: Request):
    try:
        body = await request.json()
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON body")

    name = normalize_user_name(str(body.get("name", "")))
    password = str(body.get("password", ""))
    roster_user = team_user_by_name(name)
    if not roster_user:
        raise HTTPException(status_code=403, detail="This account is not in the team user list")
    if not password:
        raise HTTPException(status_code=400, detail="Password is required")

    users = ensure_team_users()
    now = datetime.now().isoformat()
    for user in users:
        if str(user.get("name", "")).casefold() == roster_user["name"].casefold():
            if not user.get("password_hash"):
                user["password_hash"] = hash_password(DEFAULT_INITIAL_PASSWORD)
                user["password_changed"] = False
            if not verify_password(password, str(user.get("password_hash", ""))):
                raise HTTPException(status_code=401, detail="Incorrect password")
            user["name"] = roster_user["name"]
            user["module"] = roster_user.get("module", "")
            user["last_seen_at"] = now
            save_json_list(USER_METADATA_FILE, users)
            return {"user": public_user(user)}

    raise HTTPException(status_code=500, detail="Team user seed failed")


@app.post("/api/auth/change-password")
async def api_auth_change_password(request: Request):
    try:
        body = await request.json()
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON body")

    user = find_user_by_token(str(body.get("user_token") or ""), allow_pending_password=True)
    if not user:
        raise HTTPException(status_code=401, detail="Login required")
    current_password = str(body.get("current_password", ""))
    new_password = str(body.get("new_password", ""))
    if not verify_password(current_password, str(user.get("password_hash", ""))):
        raise HTTPException(status_code=401, detail="Current password is incorrect")
    if len(new_password) < 6:
        raise HTTPException(status_code=400, detail="New password must be at least 6 characters")
    if new_password == DEFAULT_INITIAL_PASSWORD:
        raise HTTPException(status_code=400, detail="Please choose a password different from the initial password")

    users = ensure_team_users()
    now = datetime.now().isoformat()
    for item in users:
        if item.get("id") == user.get("id"):
            item["password_hash"] = hash_password(new_password)
            item["password_changed"] = True
            item["password_changed_at"] = now
            item["last_seen_at"] = now
            save_json_list(USER_METADATA_FILE, users)
            return {"user": public_user(item)}
    raise HTTPException(status_code=404, detail="User not found")


@app.get("/api/drafts")
async def api_drafts(request: Request):
    user = find_user_by_token(request.query_params.get("user_token"))
    if not user:
        return {"drafts": []}
    records = [
        item for item in load_json_list(DRAFT_HISTORY_FILE)
        if item.get("user_id") == user.get("id")
    ]
    records.sort(key=lambda item: str(item.get("created_at", "")), reverse=True)
    records.sort(key=lambda item: not bool(item.get("pinned")))
    return {"drafts": records[:100]}


@app.patch("/api/drafts/{record_id}")
async def api_update_draft(record_id: str, request: Request):
    try:
        body = await request.json()
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON body")

    user = find_user_by_token(str(body.get("user_token") or ""))
    if not user:
        raise HTTPException(status_code=401, detail="Login required")

    records = load_json_list(DRAFT_HISTORY_FILE)
    for item in records:
        if item.get("id") == record_id and item.get("user_id") == user.get("id"):
            if "pinned" in body:
                pinned = bool(body.get("pinned"))
                item["pinned"] = pinned
                item["pinned_at"] = datetime.now().isoformat() if pinned else ""
            if "draft" in body:
                draft = str(body.get("draft", "")).strip()
                if not draft:
                    raise HTTPException(status_code=400, detail="Draft text cannot be empty")
                item["draft"] = draft[:30000]
                item["edited_at"] = datetime.now().isoformat()
            save_json_list(DRAFT_HISTORY_FILE, records)
            return {"ok": True, "draft": item}

    raise HTTPException(status_code=404, detail="Draft record not found")


@app.delete("/api/drafts/{record_id}")
async def api_delete_draft(record_id: str, request: Request):
    user = find_user_by_token(request.query_params.get("user_token"))
    if not user:
        raise HTTPException(status_code=401, detail="Login required")

    records = load_json_list(DRAFT_HISTORY_FILE)
    kept = [
        item for item in records
        if not (item.get("id") == record_id and item.get("user_id") == user.get("id"))
    ]
    if len(kept) == len(records):
        raise HTTPException(status_code=404, detail="Draft record not found")
    save_json_list(DRAFT_HISTORY_FILE, kept)
    return {"ok": True}


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
    rendered_body = render_markdown_article(body, highlight_ids, re.sub(r"\D", "", pmid), title)
    pdf_upload = detail.get("pdf_upload")
    pdf_link_html = ""
    if pdf_upload:
        pdf_link_html = (
            f'<a class="source-link pdf-link" data-article-open-pdf '
            f'href="{html.escape(pdf_upload["url"])}" target="_blank" rel="noopener">Open PDF</a>'
        )
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
            {f'<div class="detail-actions">{pdf_link_html}</div>' if pdf_link_html else ''}
            <div class="article-body rendered-markdown">{rendered_body}</div>
        </article>
    </main>
    <script>
        const firstHighlight = document.querySelector(".cited-sentence");
        if (firstHighlight) {{
            firstHighlight.scrollIntoView({{ behavior: "smooth", block: "center" }});
        }}
        const articleLang = localStorage.getItem("litdb.lang") || "en";
        const text = {{
            en: {{ add: "Add selected sentence", added: "Added to Evidence Library", removed: "Removed from Evidence Library", hint: "Click a sentence to add it to your Evidence Library.", compose: "Compose", library: "Evidence Library", empty: "No selected sentences.", remove: "Remove" }},
            zh: {{ add: "加入自选库", added: "已加入自选库", removed: "已从自选库移除", hint: "点击任意句子，可加入你的自选库。", compose: "组文章", library: "自选库", empty: "还没有选择句子。", remove: "移除" }}
        }};
        const labels = text[articleLang] || text.en;
        labels.openPdf = labels.openPdf || (articleLang === "zh" ? "打开 PDF" : "Open PDF");
        document.querySelectorAll("[data-article-open-pdf]").forEach((link) => {{
            link.textContent = labels.openPdf;
        }});
        const notice = document.createElement("div");
        notice.className = "article-selection-toast";
        notice.textContent = labels.hint;
        document.body.appendChild(notice);
        function showArticleToast(message) {{
            notice.textContent = message;
            notice.classList.add("visible");
            window.clearTimeout(notice._timer);
            notice._timer = window.setTimeout(() => notice.classList.remove("visible"), 1800);
        }}
        function loadEvidenceLibrary() {{
            try {{
                const items = JSON.parse(localStorage.getItem("litdb.evidenceLibrary") || "[]");
                return Array.isArray(items) ? items : [];
            }} catch {{
                return [];
            }}
        }}
        function saveEvidenceLibrary(items) {{
            localStorage.setItem("litdb.evidenceLibrary", JSON.stringify(items.slice(0, 60)));
            updateLibraryCartCount();
        }}
        const libraryCart = document.createElement("a");
        libraryCart.className = "article-library-cart";
        libraryCart.href = "/?compose=article#article-compose-page";
        libraryCart.title = labels.compose;
        libraryCart.setAttribute("aria-label", labels.compose);
        libraryCart.innerHTML = `
            <span class="article-cart-icon" aria-hidden="true"></span>
            <span class="article-cart-count">0</span>
        `;
        document.body.appendChild(libraryCart);
        const miniLibrary = document.createElement("aside");
        miniLibrary.className = "article-mini-library";
        document.body.appendChild(miniLibrary);
        let cartDragState = null;
        let cartSuppressClick = false;
        function clampCartPosition(left, top) {{
            const rect = libraryCart.getBoundingClientRect();
            const maxLeft = Math.max(8, window.innerWidth - rect.width - 8);
            const maxTop = Math.max(8, window.innerHeight - rect.height - 8);
            return {{
                left: Math.min(Math.max(8, left), maxLeft),
                top: Math.min(Math.max(8, top), maxTop),
            }};
        }}
        function positionMiniLibrary() {{
            const cartRect = libraryCart.getBoundingClientRect();
            const miniRect = miniLibrary.getBoundingClientRect();
            const miniWidth = Math.min(Math.max(miniRect.width || 240, 220), window.innerWidth - 28);
            const left = Math.min(Math.max(14, cartRect.left), window.innerWidth - miniWidth - 14);
            const top = Math.min(cartRect.bottom + 12, Math.max(14, window.innerHeight - Math.min(miniRect.height || 220, 280) - 14));
            miniLibrary.style.left = `${{left}}px`;
            miniLibrary.style.right = "auto";
            miniLibrary.style.top = `${{top}}px`;
            miniLibrary.style.bottom = "auto";
        }}
        function loadCartPosition() {{
            try {{
                const raw = localStorage.getItem("litdb.articleCartPosition");
                return raw ? JSON.parse(raw) : null;
            }} catch {{
                return null;
            }}
        }}
        function applyCartPosition(position) {{
            if (!position) {{
                window.requestAnimationFrame(positionMiniLibrary);
                return;
            }}
            const next = clampCartPosition(Number(position.left) || 18, Number(position.top) || 128);
            libraryCart.style.left = `${{next.left}}px`;
            libraryCart.style.top = `${{next.top}}px`;
            libraryCart.style.right = "auto";
            libraryCart.style.bottom = "auto";
            window.requestAnimationFrame(positionMiniLibrary);
        }}
        function saveCartPosition() {{
            const rect = libraryCart.getBoundingClientRect();
            localStorage.setItem("litdb.articleCartPosition", JSON.stringify({{ left: rect.left, top: rect.top }}));
        }}
        libraryCart.addEventListener("pointerdown", (event) => {{
            if (event.button !== undefined && event.button !== 0) return;
            const rect = libraryCart.getBoundingClientRect();
            cartDragState = {{
                startX: event.clientX,
                startY: event.clientY,
                left: rect.left,
                top: rect.top,
                moved: false,
            }};
            libraryCart.classList.add("dragging");
            libraryCart.setPointerCapture?.(event.pointerId);
            event.preventDefault();
        }});
        libraryCart.addEventListener("pointermove", (event) => {{
            if (!cartDragState) return;
            const dx = event.clientX - cartDragState.startX;
            const dy = event.clientY - cartDragState.startY;
            if (Math.abs(dx) > 3 || Math.abs(dy) > 3) cartDragState.moved = true;
            const next = clampCartPosition(cartDragState.left + dx, cartDragState.top + dy);
            libraryCart.style.left = `${{next.left}}px`;
            libraryCart.style.top = `${{next.top}}px`;
            libraryCart.style.right = "auto";
            libraryCart.style.bottom = "auto";
            positionMiniLibrary();
        }});
        function finishCartDrag(event) {{
            if (!cartDragState) return;
            if (cartDragState.moved) {{
                cartSuppressClick = true;
                saveCartPosition();
                window.setTimeout(() => {{
                    cartSuppressClick = false;
                }}, 0);
            }}
            libraryCart.classList.remove("dragging");
            libraryCart.releasePointerCapture?.(event.pointerId);
            cartDragState = null;
        }}
        libraryCart.addEventListener("pointerup", finishCartDrag);
        libraryCart.addEventListener("pointercancel", finishCartDrag);
        libraryCart.addEventListener("click", (event) => {{
            if (cartSuppressClick) {{
                event.preventDefault();
                return;
            }}
            sessionStorage.setItem("litdb.project", "aps-review");
            sessionStorage.setItem("litdb.openArticleComposer", "1");
        }});
        window.addEventListener("resize", () => applyCartPosition(loadCartPosition()));
        applyCartPosition(loadCartPosition());
        function escapeHtml(value) {{
            const div = document.createElement("div");
            div.textContent = value == null ? "" : String(value);
            return div.innerHTML;
        }}
        function removeEvidenceItem(key) {{
            const items = loadEvidenceLibrary().filter((item) => item.key !== key);
            saveEvidenceLibrary(items);
            const sentenceId = key.split(":").slice(1).join(":");
            document.querySelector(`[data-sentence-id="${{CSS.escape(sentenceId)}}"]`)?.classList.remove("picked-sentence");
            showArticleToast(labels.removed);
        }}
        function renderMiniLibrary(items) {{
            const shown = items.slice(-5).reverse();
            miniLibrary.innerHTML = `
                <div class="article-mini-head">
                    <div>
                        <strong>${{escapeHtml(labels.library)}}</strong>
                        <span>${{items.length}}</span>
                    </div>
                    <a href="/?compose=article#article-compose-page" class="article-mini-compose">${{escapeHtml(labels.compose)}}</a>
                </div>
                <div class="article-mini-list">
                    ${{shown.length ? shown.map((item) => `
                        <div class="article-mini-item">
                            <p>${{escapeHtml(item.text || "")}}</p>
                            <div>
                                <span>PMID ${{escapeHtml(item.pmid || "")}}</span>
                                <button type="button" data-key="${{escapeHtml(item.key || "")}}">${{escapeHtml(labels.remove)}}</button>
                            </div>
                        </div>
                    `).join("") : `<p class="article-mini-empty">${{escapeHtml(labels.empty)}}</p>`}}
                </div>
            `;
            miniLibrary.querySelector(".article-mini-compose")?.addEventListener("click", () => {{
                sessionStorage.setItem("litdb.project", "aps-review");
                sessionStorage.setItem("litdb.openArticleComposer", "1");
            }});
            miniLibrary.querySelectorAll("button[data-key]").forEach((button) => {{
                button.addEventListener("click", () => removeEvidenceItem(button.dataset.key || ""));
            }});
            window.requestAnimationFrame(positionMiniLibrary);
        }}
        function updateLibraryCartCount() {{
            const items = loadEvidenceLibrary();
            const count = items.length;
            const countNode = libraryCart.querySelector(".article-cart-count");
            if (countNode) countNode.textContent = String(count);
            libraryCart.classList.toggle("has-items", count > 0);
            renderMiniLibrary(items);
        }}
        updateLibraryCartCount();
        window.addEventListener("storage", (event) => {{
            if (event.key === "litdb.evidenceLibrary") updateLibraryCartCount();
        }});
        function articleMeta() {{
            const source = document.querySelector(".article-sentence[data-pmid]");
            return {{
                pmid: source?.dataset.pmid || window.location.pathname.split("/").filter(Boolean).pop() || "",
                citekey: source?.dataset.citekey || "",
                title: source?.dataset.title || document.title,
            }};
        }}
        function addEvidenceItem(item) {{
            const items = loadEvidenceLibrary();
            if (!items.some((existing) => existing.key === item.key)) {{
                items.push(item);
                saveEvidenceLibrary(items);
            }}
        }}
        document.querySelectorAll(".article-sentence[data-sentence-id]").forEach((sentence) => {{
            sentence.title = labels.add;
            sentence.addEventListener("click", () => {{
                const textValue = sentence.textContent.trim();
                if (!textValue) return;
                const key = `${{sentence.dataset.pmid}}:${{sentence.dataset.sentenceId}}`;
                addEvidenceItem({{
                    key,
                    id: sentence.dataset.sentenceId,
                    pmid: sentence.dataset.pmid,
                    citekey: sentence.dataset.citekey || "",
                    section: sentence.dataset.section || "",
                    text: textValue,
                    citation: sentence.dataset.title || document.title,
                    url: sentence.dataset.url || window.location.pathname,
                }});
                sentence.classList.add("picked-sentence");
                showArticleToast(labels.added);
            }});
        }});
        const selectionButton = document.createElement("button");
        selectionButton.type = "button";
        selectionButton.className = "article-selection-popover";
        selectionButton.textContent = labels.add;
        document.body.appendChild(selectionButton);
        let selectedEvidence = null;
        function hideSelectionButton() {{
            selectionButton.classList.remove("visible");
            selectedEvidence = null;
        }}
        function selectedEvidenceFromRange() {{
            const selection = window.getSelection();
            if (!selection || selection.isCollapsed || selection.rangeCount === 0) return null;
            const range = selection.getRangeAt(0);
            const body = document.querySelector(".article-body");
            if (!body || !body.contains(range.commonAncestorContainer)) return null;
            const textValue = selection.toString().replace(/\\s+/g, " ").trim();
            if (textValue.length < 12) return null;
            const node = range.commonAncestorContainer.nodeType === 1
                ? range.commonAncestorContainer
                : range.commonAncestorContainer.parentElement;
            const sentence = node?.closest?.(".article-sentence[data-sentence-id]");
            const meta = articleMeta();
            const keySeed = textValue.slice(0, 80).toLowerCase();
            return {{
                key: `${{meta.pmid}}:manual:${{keySeed}}`,
                id: sentence?.dataset.sentenceId || `manual-${{Date.now()}}`,
                pmid: sentence?.dataset.pmid || meta.pmid,
                citekey: sentence?.dataset.citekey || meta.citekey || (meta.pmid ? `pmid:${{meta.pmid}}` : ""),
                section: sentence?.dataset.section || "",
                text: textValue,
                citation: sentence?.dataset.title || meta.title,
                url: sentence?.dataset.url || window.location.pathname,
                manual: true,
            }};
        }}
        document.addEventListener("mouseup", () => {{
            window.setTimeout(() => {{
                selectedEvidence = selectedEvidenceFromRange();
                if (!selectedEvidence) {{
                    hideSelectionButton();
                    return;
                }}
                const range = window.getSelection().getRangeAt(0);
                const rect = range.getBoundingClientRect();
                selectionButton.style.left = `${{Math.min(rect.left + window.scrollX, window.innerWidth - 180)}}px`;
                selectionButton.style.top = `${{rect.bottom + window.scrollY + 8}}px`;
                selectionButton.classList.add("visible");
            }}, 0);
        }});
        selectionButton.addEventListener("click", () => {{
            if (!selectedEvidence) return;
            addEvidenceItem(selectedEvidence);
            showArticleToast(labels.added);
            window.getSelection()?.removeAllRanges();
            hideSelectionButton();
        }});
        window.addEventListener("scroll", hideSelectionButton, {{ passive: true }});
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
async def api_papers(request: Request):
    papers = load_papers()
    pdf_uploads = latest_pdf_uploads_by_pmid()
    user = find_user_by_token(request.query_params.get("user_token"))
    notes = paper_notes_for_user(user)
    tag_records = paper_tag_records()
    enriched_papers = []
    for paper in papers:
        row = paper_with_pdf_upload(paper, pdf_uploads)
        pmid = re.sub(r"\D", "", str(row.get("pmid", "")))
        note = notes.get(pmid) or {}
        tag_record = tag_records.get(pmid) or {}
        custom_tags = split_multi_value(str(tag_record.get("tags", "")))
        row["user_note"] = note.get("note", "")
        row["note_updated_at"] = note.get("updated_at", "")
        row["custom_tags"] = join_unique_tags(custom_tags)
        row["filter_tags"] = join_unique_tags(split_multi_value(str(row.get("aps_modules", ""))) + custom_tags)
        row["tag_updated_at"] = tag_record.get("updated_at", "")
        enriched_papers.append(row)
    return {
        "papers": enriched_papers,
        "summary": {
            "count": len(papers),
            "priority_counts": count_by(papers, "priority"),
            "source_counts": count_by(papers, "primary_text_source"),
            "module_counts": count_multi_value(enriched_papers, "filter_tags"),
            "custom_tags": custom_tag_registry(),
        },
    }


@app.get("/api/citations.csv")
async def api_citations_csv():
    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=["pmid", "doi", "title", "authors", "year", "journal", "citekey"])
    writer.writeheader()
    for paper in load_papers():
        writer.writerow({
            "pmid": paper.get("pmid", ""),
            "doi": paper.get("doi", ""),
            "title": paper.get("title", ""),
            "authors": paper.get("authors", ""),
            "year": paper.get("year", ""),
            "journal": paper.get("journal", ""),
            "citekey": paper.get("citekey") or citation_key_for_metadata(paper),
        })
    return Response(content=output.getvalue(), media_type="text/csv")


@app.get("/api/papers/{pmid}")
async def api_paper_detail(pmid: str):
    return get_paper_by_pmid(pmid)


@app.patch("/api/papers/{pmid}/note")
async def api_update_paper_note(pmid: str, request: Request):
    safe_pmid = re.sub(r"\D", "", pmid)
    if not safe_pmid:
        raise HTTPException(status_code=400, detail="A numeric PMID is required")
    try:
        body = await request.json()
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON body")
    user = resolve_user_from_body(body)
    if not user:
        raise HTTPException(status_code=401, detail="Login required")

    note = str(body.get("note", "")).strip()[:5000]
    owner = note_owner_key(user)
    now = datetime.now().isoformat()
    records = load_json_list(PAPER_NOTES_FILE)
    kept: list[dict[str, Any]] = []
    updated: dict[str, Any] | None = None
    for item in records:
        item_owner = str(item.get("user_id") or item.get("user_name") or "").strip().casefold()
        item_pmid = re.sub(r"\D", "", str(item.get("pmid", "")))
        if item_owner == owner and item_pmid == safe_pmid:
            if note:
                updated = {
                    **item,
                    "pmid": safe_pmid,
                    "user_id": user.get("id"),
                    "user_name": user.get("name", ""),
                    "note": note,
                    "updated_at": now,
                }
                kept.append(updated)
            continue
        kept.append(item)
    if note and updated is None:
        updated = {
            "id": str(uuid.uuid4()),
            "pmid": safe_pmid,
            "user_id": user.get("id"),
            "user_name": user.get("name", ""),
            "note": note,
            "created_at": now,
            "updated_at": now,
        }
        kept.append(updated)
    save_json_list(PAPER_NOTES_FILE, kept[-2000:])
    return {"ok": True, "note": updated or {"pmid": safe_pmid, "note": "", "updated_at": now}}


@app.patch("/api/papers/{pmid}/tags")
async def api_update_paper_tags(pmid: str, request: Request):
    safe_pmid = re.sub(r"\D", "", pmid)
    if not safe_pmid:
        raise HTTPException(status_code=400, detail="A numeric PMID is required")
    try:
        body = await request.json()
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON body")
    user = resolve_user_from_body(body)
    if not user:
        raise HTTPException(status_code=401, detail="Login required")

    tags_value = body.get("tags", [])
    if isinstance(tags_value, list):
        tags = join_unique_tags([str(item) for item in tags_value])
    else:
        tags = join_unique_tags(split_multi_value(str(tags_value)))
    now = datetime.now().isoformat()
    records = []
    updated: dict[str, Any] | None = None
    for item in load_json_list(PAPER_TAGS_FILE):
        item_pmid = re.sub(r"\D", "", str(item.get("pmid", "")))
        if item_pmid == safe_pmid:
            if tags:
                updated = {
                    **item,
                    "pmid": safe_pmid,
                    "tags": tags,
                    "updated_by": user.get("name", ""),
                    "updated_at": now,
                }
                records.append(updated)
            continue
        records.append(item)
    if tags and updated is None:
        updated = {
            "id": str(uuid.uuid4()),
            "pmid": safe_pmid,
            "tags": tags,
            "created_by": user.get("name", ""),
            "created_at": now,
            "updated_by": user.get("name", ""),
            "updated_at": now,
        }
        records.append(updated)
    save_json_list(PAPER_TAGS_FILE, records[-5000:])
    return {"ok": True, "tags": updated or {"pmid": safe_pmid, "tags": "", "updated_at": now}}


@app.post("/api/tags")
async def api_create_tag(request: Request):
    try:
        body = await request.json()
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON body")
    user = resolve_user_from_body(body)
    if not user:
        raise HTTPException(status_code=401, detail="Login required")
    tag = re.sub(r"\s+", " ", str(body.get("tag", ""))).strip()[:80]
    if not tag:
        raise HTTPException(status_code=400, detail="Tag is required")
    existing = {item.casefold() for item in custom_tag_registry()}
    records = load_json_list(PAPER_TAG_REGISTRY_FILE)
    if tag.casefold() not in existing:
        records.append({
            "id": str(uuid.uuid4()),
            "tag": tag,
            "created_by": user.get("name", ""),
            "created_at": datetime.now().isoformat(),
        })
        save_json_list(PAPER_TAG_REGISTRY_FILE, records[-500:])
    return {"ok": True, "tags": custom_tag_registry()}


@app.get("/api/papers/{pmid}/evidence")
async def api_paper_evidence(pmid: str):
    detail = get_paper_by_pmid(pmid)
    return {
        "pmid": re.sub(r"\D", "", pmid),
        "title": detail["metadata"].get("title", f"PMID {pmid}"),
        "sentences": list(evidence_index_for_pmid(pmid)),
    }


@app.get("/api/workspaces")
async def api_workspaces():
    workspaces = sorted(
        load_workspaces(),
        key=lambda item: str(item.get("updated_at") or item.get("created_at") or ""),
        reverse=True,
    )
    return {"workspaces": [public_workspace(item) for item in workspaces]}


@app.post("/api/workspaces")
async def api_create_workspace(request: Request):
    try:
        body = await request.json()
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON body")
    name = re.sub(r"\s+", " ", str(body.get("name", ""))).strip()
    if not name:
        raise HTTPException(status_code=400, detail="Workspace name is required")
    library_type = normalize_library_type(str(body.get("library_type", "personal")))
    owner = find_user_by_token(str(body.get("user_token") or ""))
    now = datetime.now().isoformat()
    workspace_id = f"{slugify_workspace_name(name)}-{uuid.uuid4().hex[:8]}"
    workspace = {
        "id": workspace_id,
        "name": name[:100],
        "description": str(body.get("description", "")).strip()[:300],
        "library_type": library_type,
        "owner_user_id": owner.get("id") if owner else "",
        "owner_name": owner.get("name") if owner else str(body.get("user_name", "")).strip()[:80],
        "created_by": str(body.get("user_name", "")).strip()[:80],
        "created_at": now,
        "updated_at": now,
        "documents": [],
    }
    workspaces = load_workspaces()
    workspaces.append(workspace)
    save_workspaces(workspaces)
    (workspace_dir(workspace_id) / "pdfs").mkdir(parents=True, exist_ok=True)
    return {"workspace": public_workspace(workspace)}


@app.patch("/api/workspaces/{workspace_id}")
async def api_update_workspace(workspace_id: str, request: Request):
    try:
        body = await request.json()
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON body")
    user = find_user_by_token(str(body.get("user_token") or ""))
    workspaces = load_workspaces()
    target: dict[str, Any] | None = None
    for item in workspaces:
        if item.get("id") == workspace_id:
            target = item
            break
    if not target:
        raise HTTPException(status_code=404, detail="Workspace not found")
    if not user_owns_workspace(target, user, body):
        raise HTTPException(status_code=403, detail="Only the workspace owner can edit this workspace")
    name = re.sub(r"\s+", " ", str(body.get("name", target.get("name", ""))).strip())
    if not name:
        raise HTTPException(status_code=400, detail="Workspace name is required")
    target["name"] = name[:100]
    target["description"] = str(body.get("description", target.get("description", ""))).strip()[:300]
    target["updated_at"] = datetime.now().isoformat()
    save_workspaces(workspaces)
    return {"workspace": public_workspace(target)}


@app.delete("/api/workspaces/{workspace_id}")
async def api_delete_workspace(workspace_id: str, request: Request):
    workspace = find_workspace(workspace_id)
    try:
        body = await request.json()
    except json.JSONDecodeError:
        body = {}
    library_type = normalize_library_type(str(workspace.get("library_type", "personal")))
    if library_type == "team":
        raise HTTPException(status_code=403, detail="Team workspaces can only be deleted by administrators")
    user = find_user_by_token(str(body.get("user_token") or ""))
    if not user_owns_workspace(workspace, user, body):
        raise HTTPException(status_code=403, detail="Only the workspace owner can delete this workspace")
    target_dir = workspace_dir(workspace_id)
    workspaces = [item for item in load_workspaces() if item.get("id") != workspace_id]
    save_workspaces(workspaces)
    if target_dir.exists():
        shutil.rmtree(target_dir)
    return {"deleted": True, "workspace_id": workspace_id}


@app.get("/api/workspaces/{workspace_id}/pdfs")
async def api_workspace_pdfs(workspace_id: str):
    workspace = find_workspace(workspace_id)
    documents = [
        public_workspace_document(workspace, document)
        for document in workspace.get("documents", [])
        if workspace_document_path(workspace, document)
    ]
    documents.sort(key=lambda item: str(item.get("uploaded_at", "")), reverse=True)
    return {"workspace": public_workspace(workspace), "documents": documents}


@app.post("/api/workspaces/{workspace_id}/pdfs")
async def api_workspace_upload_pdf(
    workspace_id: str,
    file: UploadFile = File(...),
    uploader_name: str = Form(""),
    pmid: str = Form(""),
):
    workspace = find_workspace(workspace_id)
    suffix = ensure_supported_upload(file.filename)
    file_type = upload_file_type(file.filename)
    library_type = normalize_library_type(str(workspace.get("library_type", "personal")))
    clean_pmid = re.sub(r"\D", "", pmid)
    if library_type == "team" and not clean_pmid:
        raise HTTPException(status_code=400, detail="A numeric PMID is required for team workspaces")
    if library_type == "personal" and len(workspace.get("documents", [])) >= 99:
        raise HTTPException(status_code=400, detail="Small literature libraries support fewer than 100 files")
    target_dir = workspace_dir(workspace_id) / ("pdfs" if suffix in PDF_SUFFIXES else "files")
    target_dir.mkdir(parents=True, exist_ok=True)
    safe_name = safe_workspace_upload_name(file.filename)
    destination = target_dir / safe_name
    size = 0
    try:
        with destination.open("wb") as out:
            while chunk := await file.read(1024 * 1024):
                size += len(chunk)
                if size > MAX_UPLOAD_BYTES:
                    out.close()
                    destination.unlink(missing_ok=True)
                    raise HTTPException(status_code=413, detail="File exceeds upload size limit")
                out.write(chunk)
    finally:
        await file.close()

    document = {
        "id": str(uuid.uuid4()),
        "filename": safe_name,
        "original_filename": file.filename,
        "uploaded_by": uploader_name.strip()[:80],
        "uploaded_at": datetime.now().isoformat(),
        "file_size": size,
        "pmid": clean_pmid,
        "file_type": file_type,
        "status": "uploaded",
    }
    workspaces = load_workspaces()
    for item in workspaces:
        if item.get("id") == workspace_id:
            item.setdefault("documents", []).append(document)
            item["updated_at"] = datetime.now().isoformat()
            workspace = item
            break
    save_workspaces(workspaces)
    return {"message": "File uploaded successfully", "document": public_workspace_document(workspace, document)}


@app.get("/api/workspaces/{workspace_id}/pdfs/{document_id}/file")
async def api_workspace_pdf_file(workspace_id: str, document_id: str):
    workspace = find_workspace(workspace_id)
    target = None
    for document in workspace.get("documents", []):
        if document.get("id") == document_id:
            target = document
            break
    if not target:
        raise HTTPException(status_code=404, detail="File not found")
    path = workspace_document_path(workspace, target)
    if not path:
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(
        path,
        media_type=file_response_media_type(path),
        filename=str(target.get("original_filename") or path.name),
        content_disposition_type="inline",
    )


@app.post("/api/workspaces/{workspace_id}/paperqa/query")
async def api_workspace_query(workspace_id: str, request: Request):
    workspace = find_workspace(workspace_id)
    try:
        body = await request.json()
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON body")
    question = str(body.get("question", "")).strip()
    if not question:
        raise HTTPException(status_code=400, detail="Question is required")
    paths = [
        path
        for document in workspace.get("documents", [])
        for path in [workspace_document_path(workspace, document)]
        if path
    ]
    if not paths:
        raise HTTPException(status_code=400, detail="Upload at least one file before asking PaperQA")
    from paperqa_engine import query_files

    try:
        result = await query_files(
            question=question,
            file_paths=paths,
            k=int(body.get("k", 10)),
            max_sources=int(body.get("max_sources", 5)),
        )
        result["contexts"] = enrich_workspace_contexts(workspace, result.get("contexts", []))
        result["answer_segments"] = parse_answer_citation_segments(str(result.get("answer", "")))
        result["answer"] = answer_segments_to_text(result["answer_segments"])
        result["draft_llm"] = llm_runtime_config()["draft"]
        return result
    except Exception as exc:
        logger.exception("Workspace PaperQA query failed")
        raise HTTPException(status_code=500, detail=str(exc))


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
    module_filters = [
        str(item).strip()
        for item in (body.get("module_filters") or [])
        if str(item).strip()
    ]
    priority_scope = str(body.get("priority_scope") or "").strip()

    if not _engine_ready and not module_filters and not priority_scope:
        raise HTTPException(
            status_code=503,
            detail={
                "message": "PaperQA engine is not ready",
                "error": _engine_error,
            },
        )

    k = int(body.get("k", 10))
    max_sources = int(body.get("max_sources", 5))
    try:
        if module_filters or priority_scope:
            paths = filtered_corpus_paths(module_filters, priority_scope or "all_priorities_with_cases")
            if not paths:
                raise HTTPException(status_code=400, detail="No papers match the selected evidence filters")
            from paperqa_engine import query_files
            result = await query_files(question=question, file_paths=paths, k=k, max_sources=max_sources)
            result["module_filters"] = module_filters
            result["priority_scope"] = priority_scope or "all_priorities_with_cases"
        else:
            from paperqa_engine import query as engine_query
            result = await engine_query(question=question, k=k, max_sources=max_sources)
        result["contexts"] = enrich_contexts_with_evidence(result.get("contexts", []))
        answer_segments = parse_answer_citation_segments(str(result.get("answer", "")))
        result["answer_segments"] = answer_segments
        result["answer"] = answer_segments_to_text(answer_segments)
        for context in result["contexts"]:
            context["text"] = strip_display_line_references(str(context.get("text", "")))
            context["citation"] = strip_display_line_references(str(context.get("citation", "")))
        result["llm"] = result.get("llm") or llm_runtime_config()["paperqa"]
        result["draft_llm"] = llm_runtime_config()["draft"]
        return result
    except HTTPException:
        raise
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
        reference = draft_evidence_reference(item)
        clean_evidences.append(
            {
                **reference,
                "doc_id": str(item.get("doc_id", "")),
                "source_name": str(item.get("source_name") or item.get("citation") or ""),
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
    library_context = normalize_library_context(str(body.get("library_context", "general_review")))
    instruction = strip_markdown_inline(str(body.get("instruction", ""))).strip()[:1200]
    evidence_lines = "\n".join(
        f"- {item['citation']} {evidence_source_label(item)} [{item['section']}]: {item['text']}"
        for item in clean_evidences
    )
    instruction_block = f"\nParagraph goal from the user: {instruction}\n" if instruction else "\n"
    prompt = (
        f"Task: write one concise {language} biomedical review paragraph using only the selected evidence.\n"
        f"{draft_style_instruction(language)}\n\n"
        f"Writing profile: {NATURE_REVIEW_DRAFTING_PROFILE}\n"
        f"{NATURE_REVIEW_DRAFTING_RULES}\n"
        f"{context_specific_drafting_rules(library_context)}"
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

    citation_keys = sorted({item["citekey"] for item in clean_evidences if item.get("citekey")})
    draft = normalize_draft_citations(getattr(response, "content", str(response)).strip(), set(citation_keys))
    record = save_draft_record(
        user=resolve_user_from_body(body),
        draft_type="paragraph",
        draft=draft,
        evidence_count=len(clean_evidences),
        paragraph_count=1,
        prompt_meta={
            "mode": mode,
            "instruction": instruction,
            "lang": str(body.get("lang", "en")),
            "citation_keys": citation_keys,
            "writing_profile": NATURE_REVIEW_DRAFTING_PROFILE,
            "library_context": library_context,
        },
    )
    return {
        "mode": mode,
        "draft": draft,
        "llm": config,
        "evidence_count": len(clean_evidences),
        "citation_keys": citation_keys,
        "references": unique_reference_rows(clean_evidences),
        "record": record,
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
                reference = draft_evidence_reference(item)
                clean_evidences.append(
                    {
                        **reference,
                        "doc_id": str(item.get("doc_id", "")),
                        "source_name": str(item.get("source_name") or item.get("citation") or ""),
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
    library_context = normalize_library_context(str(body.get("library_context", "general_review")))
    blueprint = str(body.get("blueprint", "")).strip()[:4000]
    paragraph_blocks = []
    for paragraph in clean_paragraphs:
        length_line = f"\nApproximate length: {paragraph['length']}" if paragraph["length"] else ""
        evidence_lines = "\n".join(
            f"  - {item['citation']} {evidence_source_label(item)} [{item['section']}]: {item['text']}"
            for item in paragraph["evidences"]
        ) or "  - No direct evidence assigned."
        paragraph_blocks.append(
            f"Paragraph {paragraph['index']} goal: {paragraph['instruction'] or 'Use the assigned evidence to advance the review argument.'}\n"
            f"{length_line}\n"
            f"Evidence:\n{evidence_lines}"
        )

    prompt = (
        f"Task: write a coherent multi-paragraph {language} biomedical review draft from the ordered paragraph plans below.\n"
        f"{draft_style_instruction(language)}\n\n"
        f"Writing profile: {NATURE_REVIEW_DRAFTING_PROFILE}\n"
        f"{NATURE_REVIEW_DRAFTING_RULES}\n"
        f"{context_specific_drafting_rules(library_context)}"
        "Treat the paragraph plans as an ordered outline. Make transitions between paragraphs explicit and smooth. "
        "Preserve paragraph order unless the supplied evidence forces a clearer logical sequence. "
        "Do not add headings unless the user explicitly asks for them.\n\n"
        f"User-confirmed writing blueprint:\n{blueprint or 'No separate blueprint supplied.'}\n\n"
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

    citation_keys = sorted({
        item["citekey"]
        for paragraph in clean_paragraphs
        for item in paragraph["evidences"]
        if item.get("citekey")
    })
    draft = normalize_draft_citations(getattr(response, "content", str(response)).strip(), set(citation_keys))
    record = save_draft_record(
        user=resolve_user_from_body(body),
        draft_type="article",
        draft=draft,
        evidence_count=total_evidence_count,
        paragraph_count=len(clean_paragraphs),
        prompt_meta={
            "mode": mode,
            "lang": str(body.get("lang", "en")),
            "citation_keys": citation_keys,
            "writing_profile": NATURE_REVIEW_DRAFTING_PROFILE,
            "library_context": library_context,
            "blueprint": blueprint,
            "paragraphs": [
                {
                    "instruction": paragraph["instruction"],
                    "length": paragraph["length"],
                    "evidence_count": len(paragraph["evidences"]),
                }
                for paragraph in clean_paragraphs
            ],
        },
    )
    return {
        "mode": mode,
        "draft": draft,
        "llm": config,
        "paragraph_count": len(clean_paragraphs),
        "evidence_count": total_evidence_count,
        "citation_keys": citation_keys,
        "references": unique_reference_rows([
            item
            for paragraph in clean_paragraphs
            for item in paragraph["evidences"]
        ]),
        "record": record,
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
    suffix = ensure_supported_upload(file.filename)
    file_type = upload_file_type(file.filename)

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
                    raise HTTPException(status_code=413, detail="File exceeds upload size limit")
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
        "file_type": file_type,
        "status": "uploaded",
    }
    metadata.append(entry)
    save_uploads_metadata(metadata)
    logger.info("Uploaded %s for PMID %s", file.filename, clean_pmid)

    # Auto-submit to Knowhere for parsing if enabled
    knowhere_info = None
    if suffix in MARKDOWN_SUFFIXES:
        corpus_path = markdown_upload_to_corpus(clean_pmid, destination, file.filename)
        entry["corpus_path"] = str(corpus_path)
        entry["status"] = "indexed"
        save_uploads_metadata(metadata)
        add_paper_to_engine_background(str(corpus_path), f"Markdown upload PMID {clean_pmid}")
        knowhere_info = {"markdown_indexed": True, "corpus_path": str(corpus_path)}
    elif KNOWHERE_ENABLED and clean_pmid:
        try:
            webhook_url = knowhere_webhook_url()
            result = submit_parse_job(
                pmid=clean_pmid,
                pdf_path=destination,
                webhook_url=webhook_url,
            )
            knowhere_info = {
                "knowhere_job_id": result.get("job_id"),
                "knowhere_status": result.get("status"),
            }
            logger.info(
                "Knowhere job submitted for PMID=%s: job_id=%s",
                clean_pmid, result.get("job_id"),
            )
        except Exception as exc:
            logger.error("Failed to submit Knowhere job for PMID=%s: %s", clean_pmid, exc)
            knowhere_info = {"knowhere_error": str(exc)}

    return {
        "message": "File uploaded successfully",
        "entry": entry,
        "knowhere": knowhere_info,
    }


@app.get("/api/uploads")
async def api_uploads():
    metadata = sorted(
        load_uploads_metadata(),
        key=lambda item: str(item.get("uploaded_at", "")),
        reverse=True,
    )
    uploads = []
    for item in metadata:
        public_pdf = public_pdf_upload(item)
        public_file = public_file_upload(item)
        uploads.append({
            **item,
            "file_type": item.get("file_type") or upload_file_type(str(item.get("filename", ""))),
            "file_url": public_file["url"] if public_file else "",
            "pdf_url": public_pdf["url"] if public_pdf else "",
        })
    return {"uploads": uploads}


@app.post("/api/uploads/batch-delete")
async def api_batch_delete_uploads(request: Request):
    try:
        body = await request.json()
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON")

    raw_ids = body.get("ids")
    if not isinstance(raw_ids, list):
        raise HTTPException(status_code=400, detail="ids must be a list")

    upload_ids: set[int] = set()
    for raw_id in raw_ids:
        try:
            upload_id = int(raw_id)
        except (TypeError, ValueError):
            continue
        if upload_id > 0:
            upload_ids.add(upload_id)
    if not upload_ids:
        raise HTTPException(status_code=400, detail="No valid upload ids")

    metadata = load_uploads_metadata()
    deleted: list[int] = []
    remaining: list[dict[str, Any]] = []
    for item in metadata:
        item_id = int(item.get("id", 0) or 0)
        if item_id in upload_ids:
            deleted.append(item_id)
            pdf_path = UPLOAD_DIR / str(item.get("filename", ""))
            if pdf_path.exists():
                pdf_path.unlink()
            continue
        remaining.append(item)

    if not deleted:
        raise HTTPException(status_code=404, detail="No matching uploads found")

    save_uploads_metadata(remaining)
    missing = sorted(upload_ids - set(deleted))
    logger.info("Batch deleted uploads: %s", deleted)
    return {
        "message": "Uploads deleted",
        "deleted_ids": sorted(deleted),
        "missing_ids": missing,
        "deleted_count": len(deleted),
    }


@app.get("/api/uploads/{upload_id}/file")
async def api_upload_file(upload_id: int):
    target = None
    for item in load_uploads_metadata():
        if int(item.get("id", 0) or 0) == upload_id:
            target = item
            break
    if not target:
        raise HTTPException(status_code=404, detail="Upload not found")
    path = upload_file_path(target)
    if not path:
        raise HTTPException(status_code=404, detail="Uploaded file not found")
    return FileResponse(
        path,
        media_type=file_response_media_type(path),
        filename=str(target.get("original_filename") or path.name),
        content_disposition_type="inline",
    )


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


@app.post("/api/knowhere-webhook")
async def api_knowhere_webhook(request: Request):
    """
    Webhook endpoint for Knowhere to call when a parsing job completes.
    """
    if not KNOWHERE_ENABLED:
        raise HTTPException(status_code=404, detail="Knowhere not configured")

    payload_body = await request.body()

    # Verify signature if secret is configured
    signature = request.headers.get("X-Knowhere-Signature", "")
    if os.environ.get("KNOWHERE_WEBHOOK_SECRET", "") and not signature:
        logger.warning("Knowhere webhook missing signature")
        raise HTTPException(status_code=401, detail="Missing signature")
    if signature:
        if not verify_webhook_signature(payload_body, signature):
            logger.warning("Knowhere webhook signature mismatch")
            raise HTTPException(status_code=401, detail="Invalid signature")

    try:
        payload = json.loads(payload_body)
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON")

    try:
        result = handle_webhook_callback(payload)
        logger.info("Knowhere webhook result: %s", result)
        if result.get("status") == "ok":
            add_paper_to_engine_background(
                str(result.get("corpus_path") or ""),
                f"Knowhere webhook PMID {result.get('pmid', '')}",
            )
        return result
    except Exception as exc:
        logger.error("Knowhere webhook handler error: %s", exc, exc_info=True)
        return {"status": "error", "message": str(exc)}


if __name__ == "__main__":
    uvicorn.run("app:app", host=HOST, port=PORT, reload=False, log_level="info")
