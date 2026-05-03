#!/usr/bin/env python3
"""
PaperQA2 Pilot — APS Systematic Review
========================================
Runs PaperQA2 on 196 APS literature markdown files using DeepSeek via LangChain bridge.
Uses sparse embedding (no API key needed) for indexing.

Usage:
    cd /root/APS_Review && source ~/envs/asreview/bin/activate && python3 paperqa_pilot.py

Important:
    - DEEPSEEK_API_KEY must be set (it's in ~/.bashrc)
    - Use 'bash -l -i -c' or source ~/.bashrc before running
    - This file must be run from inside the asreview venv
"""

import os
import sys
import glob
import asyncio
import subprocess
from pathlib import Path

# ── Configuration ──
MD_DIR = "/root/APS_Review/paperqa_import/high_medium_ready"
RESULTS_FILE = "/root/APS_Review/paperqa_pilot_results.md"

SAMPLE_QUESTIONS = [
    "What are the current diagnostic criteria for Antiphospholipid Syndrome (APS)?",
    "What is the recommended first-line anticoagulation therapy for APS patients with thrombosis?",
    "How does complement activation contribute to pregnancy loss in APS?",
    "What are the differences between primary and secondary APS in terms of clinical presentation?",
    "What is the role of direct oral anticoagulants (DOACs) in APS management?",
]

SUMMARY_QUESTIONS = [
    "What are the main treatment strategies for APS?",
    "What are the major clinical manifestations of APS?",
]


def get_api_key():
    """Get DeepSeek API key from environment (works with bash -l -i or after sourcing .bashrc)."""
    key = os.environ.get("DEEPSEEK_API_KEY")
    if key:
        return key
    # Fallback: try bash -l -i
    result = subprocess.run(
        ["bash", "-l", "-i", "-c", "echo $DEEPSEEK_API_KEY"],
        capture_output=True, text=True, timeout=10,
    )
    key = result.stdout.strip()
    if key:
        os.environ["DEEPSEEK_API_KEY"] = key
        return key
    return None


async def main():
    # ── Step 0: Get API key ──
    print("=" * 60)
    print("  PaperQA2 Pilot — APS Systematic Review")
    print("=" * 60)

    api_key = get_api_key()
    if not api_key:
        print("ERROR: DEEPSEEK_API_KEY not found.")
        print("Run with: bash -l -i -c 'source ~/envs/asreview/bin/activate && python3 paperqa_pilot.py'")
        sys.exit(1)
    print(f"\n[0/6] DeepSeek API key: {api_key[:8]}... (len={len(api_key)})")

    # ── Step 1: Configure DeepSeek via LangChain ──
    print("\n[1/6] Configuring LLM (DeepSeek via LangChain)...")
    from langchain_deepseek import ChatDeepSeek
    from langchain_core.messages import HumanMessage

    llm = ChatDeepSeek(
        model="deepseek-chat",
        api_key=api_key,
        temperature=0.1,
    )
    # Quick connectivity test
    test_resp = await llm.ainvoke([HumanMessage(content="Say 'OK' and nothing else.")])
    print(f"  LLM test: {test_resp.content}")
    assert "OK" in test_resp.content, "LLM not responding correctly"

    # ── Step 2: Create PaperQA Docs ──
    print("\n[2/6] Creating PaperQA Docs (LangChain LLM + sparse embedding)...")
    from paperqa import Docs

    docs = Docs(llm="langchain", embedding="sparse", client=llm)
    print(f"  LLM: {docs.llm_model.name} (type={docs.llm_model.llm_type})")
    print(f"  Embedding: {docs.texts_index.embedding_model.name}")

    # ── Step 3: Load markdown files ──
    print(f"\n[3/6] Loading markdown files from {MD_DIR}...")
    md_files = sorted(glob.glob(os.path.join(MD_DIR, "*.md")))
    print(f"  Found {len(md_files)} files")

    batch_size = 20
    for i in range(0, len(md_files), batch_size):
        batch = md_files[i : i + batch_size]
        for fpath in batch:
            name = Path(fpath).stem
            try:
                await docs.aadd(fpath, docname=name)
            except Exception as e:
                print(f"  WARNING: Could not add {name}: {e}")
        print(f"  Added {min(i + batch_size, len(md_files))}/{len(md_files)} files")

    print(f"\n  Total docs: {len(docs.docs)}")
    print(f"  Total text chunks: {len(docs.texts)}")

    # ── Step 4: Run sample queries ──
    all_questions = SAMPLE_QUESTIONS + SUMMARY_QUESTIONS
    print(f"\n[4/6] Running {len(all_questions)} queries...")

    results = []
    for i, question in enumerate(all_questions, 1):
        print(f"\n  --- Query {i}/{len(all_questions)} ---")
        print(f"  Q: {question}")
        try:
            answer = await docs.aquery(question)
            print(f"  A: {answer.formatted_answer[:200]}...")
            results.append(
                {
                    "question": question,
                    "answer": answer.formatted_answer,
                    "contexts": [
                        {
                            "text": c.text.text[:300],
                            "name": c.text.name,
                        }
                        for c in answer.contexts
                    ],
                }
            )
        except Exception as e:
            print(f"  ERROR: {e}")
            results.append(
                {
                    "question": question,
                    "answer": f"[ERROR] {e}",
                    "contexts": [],
                }
            )

    # ── Step 5: Save results ──
    print(f"\n[5/6] Saving results to {RESULTS_FILE}...")
    from datetime import datetime

    with open(RESULTS_FILE, "w", encoding="utf-8") as f:
        f.write("# PaperQA2 Pilot Results — APS Systematic Review\n\n")
        f.write(f"- **Date**: {datetime.now().strftime('%Y-%m-%d %H:%M')}\n")
        f.write(f"- **Documents**: {len(md_files)} markdown files\n")
        f.write(f"- **Text chunks**: {len(docs.texts)}\n")
        f.write(f"- **Model**: DeepSeek Chat (via LangChain bridge)\n")
        f.write(f"- **Embedding**: Sparse (keyword-based, no API key)\n")
        f.write(f"- **Queries**: {len(all_questions)}\n\n")
        f.write("---\n\n")

        for r in results:
            f.write(f"## Query: {r['question']}\n\n")
            f.write(f"{r['answer']}\n\n")
            if r["contexts"]:
                f.write("### Sources cited:\n\n")
                for ctx in r["contexts"]:
                    f.write(f"- **{ctx['name']}**: {ctx['text'][:200]}...\n")
                f.write("\n")
            f.write("---\n\n")

    print(f"  Results saved to {RESULTS_FILE}")

    # ── Step 6: Summary ──
    successes = sum(1 for r in results if not r["answer"].startswith("[ERROR]"))
    print(f"\n[6/6] Pilot complete!")
    print(f"  {'=' * 50}")
    print(f"  Results file:   {RESULTS_FILE}")
    print(f"  Documents:      {len(docs.docs)}")
    print(f"  Text chunks:    {len(docs.texts)}")
    print(f"  Queries run:    {len(results)} ({successes}/{len(results)} successful)")
    print(f"  {'=' * 50}")


if __name__ == "__main__":
    asyncio.run(main())
