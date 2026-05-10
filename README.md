# SH Science Group Literature Database

FastAPI web workspace for an APS literature review corpus. The app provides:

- a searchable table for the prepared Markdown corpus
- PaperQA-backed question answering
- a PDF upload queue for manually collected papers

## Local Run

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
export DEEPSEEK_API_KEY="..."
python app.py
```

Open `http://127.0.0.1:8081`.

## Configuration

Use environment variables rather than editing source files:

- `DEEPSEEK_API_KEY` or `PAPERQA_API_KEY`: server-side LLM key
- `PAPERQA_CORPUS_DIR`: Markdown corpus directory
- `PAPER_UPLOAD_DIR`: uploaded PDF staging directory
- `MAX_UPLOAD_MB`: upload size limit
- `HOST` and `PORT`: server bind settings

See `.env.example` for defaults.

## Change Log

Project-level changes are recorded in [CHANGELOG.md](CHANGELOG.md). Update it before pushing user-visible feature, data, or deployment changes.

## Repository Layout

- `app.py`, `paperqa_engine.py`: FastAPI app and PaperQA bridge.
- `templates/`, `static/`: web UI templates, JavaScript, and CSS.
- `paperqa_import/high_medium_ready/`: main APS Markdown corpus.
- `server_markdown_upload_ready/`: server import bundle and manifests.
- `scripts/`: one-off import, parsing, rename, and PaperQA pilot utilities.
- `docs/`: planning notes, pilot reports, and team assignment files.
- `uploads/`: local runtime data, ignored by Git.

## API

- `GET /api/health`
- `GET /api/papers`
- `GET /api/papers/{pmid}`
- `POST /api/paperqa/query`
- `POST /api/upload`
- `GET /api/uploads`
