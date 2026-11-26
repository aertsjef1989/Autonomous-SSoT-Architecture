#!/usr/bin/env python3
"""Canonical numbers & phrasing validator (Phase Q2 R8, standard library only).

Verifies that:
1. Every registered fact in `facts/facts.json` is attested in its canonical
   source file (`derived_in`).
2. Zero conflicting/drifted phrasings (`conflict_patterns`) appear across the
   landing page, chapters, architecture topology, or standalone demos.

Usage: python3 scripts/facts_check.py [--root .]
"""
import argparse
import glob
import json
import os
import re
import sys


def collect_targets(root: str) -> list[str]:
    patterns = [
        "README.md",
        "SUMMARY.md",
        "ARCHITECTURE_FLOW.md",
        "[0-9][0-9]-*.md",
        "balaerion/*.md",
        "syndicate/*.md",
        "DEMO/index.html",
        "balaerion/demo/index.html",
        "syndicate/demo/index.html",
    ]
    out: list[str] = []
    for pat in patterns:
        for p in sorted(glob.glob(os.path.join(root, pat))):
            if os.path.isfile(p) and p not in out:
                out.append(p)
    return out


def check_facts(root: str, facts_path: str) -> list[str]:
    with open(facts_path, "r", encoding="utf-8") as f:
        registry = json.load(f)

    facts = registry.get("facts", [])
    if not facts:
        return ["FACTS REGISTRY EMPTY: no facts found in facts.json"]

    targets = collect_targets(root)
    contents: dict[str, list[str]] = {}
    full_texts: dict[str, str] = {}
    for fp in targets:
        rel = os.path.relpath(fp, root)
        txt = open(fp, "r", encoding="utf-8", errors="replace").read()
        full_texts[rel] = txt
        contents[rel] = txt.splitlines()

    errors: list[str] = []
    for item in facts:
        fid = item["id"]
        src_file = item["derived_in"].split("#", 1)[0]
        req_pat = re.compile(item["required_pattern"], re.IGNORECASE)
        if src_file not in full_texts:
            errors.append(f"[{fid}] missing derived_in file '{src_file}'")
        elif not req_pat.search(full_texts[src_file]):
            errors.append(
                f"[{fid}] canonical value ({item['canonical_value']} {item['unit']}) "
                f"not attested by pattern /{item['required_pattern']}/ in {src_file}"
            )

        for cpat_str in item.get("conflict_patterns", []):
            cpat = re.compile(cpat_str, re.IGNORECASE)
            for rel, lines in contents.items():
                for idx, line in enumerate(lines, 1):
                    if cpat.search(line):
                        errors.append(
                            f"[{fid}] conflict pattern /{cpat_str}/ matched at {rel}:{idx}: {line.strip()[:100]}"
                        )
    return errors


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--root", default=".")
    ap.add_argument("--facts", default=os.path.join("facts", "facts.json"))
    args = ap.parse_args()

    facts_path = args.facts if os.path.isabs(args.facts) else os.path.join(args.root, args.facts)
    if not os.path.isfile(facts_path):
        print(f"FACTS CHECK FAILED: missing {facts_path}")
        return 1

    errors = check_facts(args.root, facts_path)
    if errors:
        print(f"FACTS CHECK FAILED: {len(errors)} violation(s) detected:")
        for e in errors:
            print("  " + e)
        return 1

    with open(facts_path, "r", encoding="utf-8") as f:
        n_facts = len(json.load(f).get("facts", []))
    n_targets = len(collect_targets(args.root))
    print(f"FACTS CHECK PASSED: {n_facts} canonical facts verified across {n_targets} source/demo files (0 conflicts).")
    return 0


if __name__ == "__main__":
    sys.exit(main())
