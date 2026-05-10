import json, os
from collections import defaultdict

meta_path = "/root/APS_Review/uploads/uploads_metadata.json"
uploads_dir = "/root/APS_Review/uploads"

with open(meta_path) as f:
    meta = json.load(f)

# Group by PMID
pmid_to_records = defaultdict(list)
for r in meta:
    pmid_to_records[r["pmid"]].append(r)

duplicates = {pmid: recs for pmid, recs in pmid_to_records.items() if len(recs) > 1}
print(f"Total unique PMIDs: {len(pmid_to_records)}")
print(f"Total records in metadata: {len(meta)}")
print(f"Duplicated PMIDs: {len(duplicates)}")

# For each PMID, keep earliest upload
to_keep = {}  # pmid -> record
to_remove = []  # records to remove from metadata

for pmid, recs in pmid_to_records.items():
    recs_sorted = sorted(recs, key=lambda x: x["uploaded_at"])
    to_keep[pmid] = recs_sorted[0]
    for r in recs_sorted[1:]:
        to_remove.append(r)

print(f"Records to keep: {len(to_keep)}")
print(f"Duplicate records to remove: {len(to_remove)}")

# Step 1: Delete duplicate files
deleted_count = 0
for r in to_remove:
    fp = os.path.join(uploads_dir, r["filename"])
    if os.path.exists(fp):
        os.remove(fp)
        deleted_count += 1
        print(f"  Deleted duplicate: {r['filename']}")
    else:
        print(f"  (not found) {r['filename']}")

print(f"\nDeleted {deleted_count} duplicate files")

# Step 2: Rename kept files to PMID.pdf
new_meta = []
renamed_count = 0
for pmid, rec in to_keep.items():
    old_name = rec["filename"]
    new_name = f"{pmid}.pdf"
    old_path = os.path.join(uploads_dir, old_name)
    new_path = os.path.join(uploads_dir, new_name)
    
    if os.path.exists(old_path):
        if old_name != new_name:
            os.rename(old_path, new_path)
            renamed_count += 1
        rec["filename"] = new_name
    else:
        print(f"WARNING: PMID {pmid} file missing: {old_name}")
    
    new_meta.append(rec)

print(f"Renamed {renamed_count} files to PMID.pdf format")

# Step 3: Clean up any leftover .pdf files in uploads that have no metadata
all_meta_filenames = {r["filename"] for r in new_meta}
all_disk_files = {f for f in os.listdir(uploads_dir) if f.endswith(".pdf")}
orphans = all_disk_files - all_meta_filenames
if orphans:
    print(f"\nOrphan files on disk (no metadata): {len(orphans)}")
    for f in sorted(orphans):
        fp = os.path.join(uploads_dir, f)
        os.remove(fp)
        print(f"  Deleted orphan: {f}")

# Step 4: Write updated metadata
with open(meta_path, "w") as f:
    json.dump(new_meta, f, indent=2, ensure_ascii=False)

print(f"\n=== Complete ===")
print(f"New metadata records: {len(new_meta)}")
print(f"Files in uploads dir: {len([f for f in os.listdir(uploads_dir) if f.endswith('.pdf')])}")
