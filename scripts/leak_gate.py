#!/usr/bin/env python3
"""Salted-hash + optional local runtime denylist leak gate (standard library only).

Scans the entire repository and built `_book/` output with zero project directory
exclusions (including `DESIGN_SYSTEM_Signal/` and OOXML `.docx`/`.pptx`/`.xlsx` archives).
Never prints matched tokens.
"""
import hashlib
import json
import os
import re
import sys
import zipfile

HASHES_FILE = os.path.join("scripts", "forbidden_hashes.json")
LOCAL_RUNTIME_TERMS = os.path.join(".dev", "employer_terms.txt")

SKIP_DIRS = {".git", "node_modules", ".next", ".vercel", ".dev", ".venv", "venv", "__pycache__"}
SKIP_FILES = {".gitignore", "codebase_audit.txt"}
OOXML_EXTS = (".docx", ".pptx", ".xlsx")
BINARY_EXTS = (
    ".bak", ".png", ".jpg", ".jpeg", ".gif", ".webp", ".ico",
    ".woff", ".woff2", ".ttf", ".pdf", ".zip", ".tsbuildinfo",
)
TOKEN_RE = re.compile(r"[a-z0-9]+")


def load_hash_spec(path: str) -> tuple[str, int, set[str]]:
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)
    return str(data["salt"]), int(data["ngram_max"]), set(data["hashes"])


def load_optional_runtime_pattern(path: str) -> re.Pattern | None:
    if not os.path.isfile(path):
        return None
    terms = []
    with open(path, "r", encoding="utf-8") as f:
        for line in f:
            s = line.strip()
            if s and not s.startswith("#"):
                terms.append(re.escape(s))
    if not terms:
        return None
    return re.compile(rf"(?<![A-Za-z0-9])(?:{'|'.join(terms)})(?![A-Za-z0-9])", re.IGNORECASE)


def line_matches_hashes(
    line: str,
    salt_prefix: str,
    ngram_max: int,
    target_hashes: set[str],
    memo: dict[str, bool],
) -> bool:
    tokens = TOKEN_RE.findall(line.lower())
    n = len(tokens)
    if n == 0:
        return False
    for i in range(n):
        max_k = min(ngram_max, n - i)
        phrase = tokens[i]
        res = memo.get(phrase)
        if res is None:
            res = hashlib.sha256((salt_prefix + phrase).encode("utf-8")).hexdigest() in target_hashes
            memo[phrase] = res
        if res:
            return True
        for k in range(1, max_k):
            phrase = phrase + " " + tokens[i + k]
            res = memo.get(phrase)
            if res is None:
                res = hashlib.sha256((salt_prefix + phrase).encode("utf-8")).hexdigest() in target_hashes
                memo[phrase] = res
            if res:
                return True
    return False


def scan_files(root_dir: str = ".") -> list[str]:
    salt, ngram_max, target_hashes = load_hash_spec(HASHES_FILE)
    salt_prefix = f"{salt}:"
    memo: dict[str, bool] = {}
    runtime_pat = load_optional_runtime_pattern(LOCAL_RUNTIME_TERMS)
    abs_hashes = os.path.abspath(HASHES_FILE)
    hits: list[str] = []

    for root, dirs, files in os.walk(root_dir):
        dirs[:] = [d for d in dirs if d not in SKIP_DIRS]
        for fname in sorted(files):
            if fname in SKIP_FILES or fname.endswith(BINARY_EXTS):
                continue
            fpath = os.path.join(root, fname)
            if os.path.abspath(fpath) == abs_hashes:
                continue
            if fname.endswith(OOXML_EXTS):
                try:
                    with zipfile.ZipFile(fpath) as zf:
                        for zname in zf.namelist():
                            if not zname.endswith((".xml", ".rels")):
                                continue
                            ztxt = zf.read(zname).decode("utf-8", errors="ignore")
                            for idx, line in enumerate(ztxt.splitlines(), 1):
                                matched = line_matches_hashes(line, salt_prefix, ngram_max, target_hashes, memo)
                                if not matched and runtime_pat is not None:
                                    matched = bool(runtime_pat.search(line))
                                if matched:
                                    hits.append(f"OOXML {fpath}!{zname}:{idx}: [REDACTED DENYLIST MATCH]")
                except (OSError, zipfile.BadZipFile):
                    continue
                continue
            try:
                with open(fpath, "r", encoding="utf-8", errors="ignore") as f:
                    for idx, line in enumerate(f, 1):
                        matched = line_matches_hashes(line, salt_prefix, ngram_max, target_hashes, memo)
                        if not matched and runtime_pat is not None:
                            matched = bool(runtime_pat.search(line))
                        if matched:
                            hits.append(f"FILE {fpath}:{idx}: [REDACTED DENYLIST MATCH]")
            except OSError:
                continue
    return hits


def main() -> int:
    scan_target = sys.argv[1] if len(sys.argv) > 1 else "."
    hits = scan_files(scan_target)
    if hits:
        print(f"LEAK GATE FAILED: {len(hits)} match(es) detected.")
        for h in hits[:50]:
            print(" ", h)
        return 1
    print("LEAK GATE PASSED: 0 matches.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
