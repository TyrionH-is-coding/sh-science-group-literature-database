# APS Review Web App — Build Plan

## Overview

A single Flask/FastAPI web application running on the server that provides:

1. **Paper Upload Tool** — Team members upload PDFs for papers that need manual download. Uploaded files go to a staging directory where they can later be processed into .md for PaperQA.

2. **PaperQA Query Interface** — A chat-like interface where users type a question, the server runs PaperQA against the 196 indexed papers (plus any newly added ones), and returns the answer with citations.

## Requirements

### Feature 1: Paper Upload
- Simple drag-and-drop or file picker for PDF upload
- Each upload records: PMID (manual input), filename, uploader name, timestamp
- List view showing all uploaded files (pending/processed status)
- Optional: basic validation that it's a PDF

### Feature 2: PaperQA Query
- A clean chat-like interface
- User types a question → backend runs PaperQA → returns answer with source citations
- Loading state while querying
- History of queries in the session
- The backend reuses the existing Docs object (or reloads it on server start)

### Tech Stack
- Backend: FastAPI or Flask (FastAPI preferred for async)
- Frontend: Vanilla HTML+CSS+JS (no React build step needed), or a simple framework
- File storage: local filesystem (`/root/APS_Review/uploads/`)
- Port: Let's say 8080 (not conflicting with ASReview on 80)

## Server-Side Considerations
- The `~/envs/asreview/` venv has all deps (paper-qa, langchain-deepseek, etc.)
- PaperQA Docs object should be initialized once on startup (takes ~10s to load 196 files)
- DEEPSEEK_API_KEY needs to be available — we'll source ~/.bashrc in the startup script
- Need a start/stop mechanism (systemd or a simple bash script)

## File Structure (within /root/APS_Review/)
```
/root/APS_Review/
├── app.py              # FastAPI app
├── paperqa_engine.py   # PaperQA singleton that loads on startup
├── uploads/            # Directory for uploaded PDFs
├── uploads_db.json     # Simple JSON file tracking uploads
├── templates/
│   ├── index.html      # Main page with both tabs (Query + Upload)
│   └── ... (CSS+JS inline or linked)
└── start_app.sh        # Startup script
```

## Nice-to-Have UI Elements
- Dark mode that matches a medical/research theme
- Side-by-side: query on left, results on right with source thumbnails
- Loading spinner while PaperQA is thinking
- Upload progress bar
- List of previously uploaded files with status badges
