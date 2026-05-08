# Markdown upload package

This folder contains Markdown documents prepared for server-side import.

## Contents

- `markdown_docs/`: all high + medium PaperQA-ready Markdown documents
- `knowhere_markdown_only/`: subset generated from Knowhere PDF parsing
- `markdown_upload_manifest_high_medium.csv`: metadata for all Markdown docs
- `knowhere_markdown_upload_manifest.csv`: metadata for Knowhere-only Markdown docs

## Counts

- all high + medium Markdown: 225
- Knowhere PDF Markdown subset: 
49

## Filename convention

Each file is named `pmid_<PMID>.md`. The PMID is also present in YAML front matter and the manifest.

Note: the current web `/api/upload` endpoint rejects Markdown and accepts PDF only. This package is ready for a future Markdown import endpoint or direct server-side copy/import.
