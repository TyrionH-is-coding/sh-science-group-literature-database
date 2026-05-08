#!/usr/bin/env python3
"""
Import and fix Markdown corpus metadata.

1. Fix specific PMIDs with priority values from user
2. Fix empty is_clinical_case -> 0
3. Fix empty study_types -> "unknown"
4. Use manifest CSV to update metadata where available
5. Verify all files have non-empty priority
"""

import csv
import os
import re
import sys

CORPUS_DIR = "/root/APS_Review/paperqa_import/high_medium_ready"
MANIFEST_PATH = "/root/APS_Review/server_markdown_upload_ready/markdown_upload_manifest_high_medium.csv"

# Fixed priority values from user
PRIORITY_FIXES = {
    "24713713": "low",
    "30898956": "low",
    "35929896": "high",
}

def parse_frontmatter(text):
    """Parse YAML front matter from Markdown text."""
    if not text.startswith("---"):
        return {}, text
    parts = text.split("---", 2)
    if len(parts) < 3:
        return {}, text
    frontmatter_text = parts[1]
    body = parts[2]
    
    metadata = {}
    for line in frontmatter_text.strip().splitlines():
        line = line.strip()
        match = re.match(r'^(\w[\w_]*):\s*(.*)$', line)
        if match:
            key = match.group(1)
            value = match.group(2).strip()
            # Remove surrounding quotes
            if value.startswith('"') and value.endswith('"'):
                value = value[1:-1]
            elif value.startswith("'") and value.endswith("'"):
                value = value[1:-1]
            metadata[key] = value
    return metadata, body


def build_frontmatter(metadata):
    """Build YAML front matter string from metadata dict."""
    lines = ["---"]
    for key, value in metadata.items():
        lines.append(f'{key}: "{value}"')
    lines.append("---")
    return "\n".join(lines)


def reconstruct_file(metadata, body):
    """Reconstruct full file content from metadata and body."""
    return build_frontmatter(metadata) + body


def load_manifest(path):
    """Load manifest CSV into dict keyed by pmid."""
    manifest = {}
    if not os.path.exists(path):
        print(f"WARNING: Manifest not found: {path}")
        return manifest
    with open(path, encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        for row in reader:
            pmid = row.get("pmid", "").strip()
            if pmid:
                manifest[pmid] = row
    print(f"Loaded {len(manifest)} entries from manifest")
    return manifest


def main():
    manifest = load_manifest(MANIFEST_PATH)
    
    files = sorted(os.listdir(CORPUS_DIR))
    total = len(files)
    
    stats = {
        "total": total,
        "fixed_priority": 0,
        "fixed_clinical_case": 0,
        "fixed_study_types": 0,
        "updated_from_manifest": 0,
        "still_empty_priority": 0,
        "errors": [],
    }
    
    for filename in files:
        if not filename.endswith(".md"):
            continue
        
        filepath = os.path.join(CORPUS_DIR, filename)
        match = re.match(r"pmid_(\d+)\.md", filename)
        if not match:
            continue
        pmid = match.group(1)
        
        with open(filepath, encoding="utf-8", errors="replace") as f:
            text = f.read()
        
        metadata, body = parse_frontmatter(text)
        
        modified = False
        
        # 1. Fix specific priority values from user
        if pmid in PRIORITY_FIXES:
            old_val = metadata.get("priority", "")
            new_val = PRIORITY_FIXES[pmid]
            if old_val != new_val:
                print(f"  FIX priority {pmid}: '{old_val}' -> '{new_val}'")
                metadata["priority"] = new_val
                modified = True
                stats["fixed_priority"] += 1
        
        # 2. Fix empty is_clinical_case
        if metadata.get("is_clinical_case", "") == "":
            metadata["is_clinical_case"] = "0"
            modified = True
            stats["fixed_clinical_case"] += 1
        
        # 3. Fix empty study_types
        if metadata.get("study_types", "") == "":
            metadata["study_types"] = "unknown"
            modified = True
            stats["fixed_study_types"] += 1
        
        # 4. Update from manifest if available
        if pmid in manifest:
            man = manifest[pmid]
            manifest_updates = {
                "title": man.get("title", ""),
                "year": man.get("year", ""),
                "journal": man.get("journal", ""),
                "doi": man.get("doi", ""),
            }
            for key, value in manifest_updates.items():
                if value and not metadata.get(key, ""):
                    metadata[key] = value
                    modified = True
                    if key not in locals().get("manifest_keys_fixed", {}):
                        stats["updated_from_manifest"] += 1
        
        if modified:
            new_text = reconstruct_file(metadata, body)
            with open(filepath, "w", encoding="utf-8") as f:
                f.write(new_text)
    
    # Verification pass
    print(f"\n=== Verification ===")
    empty_priority = []
    for filename in os.listdir(CORPUS_DIR):
        if not filename.endswith(".md"):
            continue
        filepath = os.path.join(CORPUS_DIR, filename)
        match = re.match(r"pmid_(\d+)\.md", filename)
        if not match:
            continue
        pmid = match.group(1)
        with open(filepath, encoding="utf-8", errors="replace") as f:
            text = f.read()
        meta, _ = parse_frontmatter(text)
        if not meta.get("priority", ""):
            empty_priority.append(pmid)
    
    stats["still_empty_priority"] = len(empty_priority)
    
    print(f"Total files: {stats['total']}")
    print(f"Priority fixes: {stats['fixed_priority']}")
    print(f"Clinical case fixes: {stats['fixed_clinical_case']}")
    print(f"Study type fixes: {stats['fixed_study_types']}")
    print(f"Updated from manifest: {stats['updated_from_manifest']}")
    print(f"Still empty priority: {stats['still_empty_priority']}")
    if empty_priority:
        print(f"  Empty priority PMIDs: {empty_priority}")
    
    return stats


if __name__ == "__main__":
    stats = main()
    sys.exit(0 if stats["still_empty_priority"] == 0 else 1)
