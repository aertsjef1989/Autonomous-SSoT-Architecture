import os
import re
import subprocess
import sys

TERMS_FILE = os.path.join("scripts", "forbidden_terms.txt")
SKIP_DIRS = {".git", "node_modules", ".venv", "venv", "__pycache__", "DESIGN_SYSTEM_Signal"}
SKIP_FILES = {".gitignore", "codebase_audit.txt"}


def load_terms(path: str) -> list[str]:
    with open(path, "r", encoding="utf-8") as f:
        return [s for line in f if (s := line.strip()) and not s.startswith("#")]


def build_pattern(terms: list[str]) -> re.Pattern:
    escaped = "|".join(re.escape(t) for t in terms)
    return re.compile(rf"(?<![A-Za-z0-9])(?:{escaped})(?![A-Za-z0-9])", re.IGNORECASE)


def scan_files(pattern: re.Pattern) -> list[str]:
    hits = []
    for root, dirs, files in os.walk("."):
        dirs[:] = [d for d in dirs if d not in SKIP_DIRS]
        for fname in sorted(files):
            if fname in SKIP_FILES or fname.endswith((".bak",".png",".jpg",".jpeg",".gif",".webp",".ico",".woff",".woff2",".ttf",".pdf",".zip")):
                continue
            fpath = os.path.join(root, fname)
            if os.path.abspath(fpath) == os.path.abspath(TERMS_FILE):
                continue
            try:
                with open(fpath, "r", encoding="utf-8", errors="ignore") as f:
                    for idx, line in enumerate(f, 1):
                        if pattern.search(line):
                            hits.append(f"FILE {fpath}:{idx}: {line.strip()}")
            except OSError:
                continue
    return hits


def main() -> int:
    pattern = build_pattern(load_terms(TERMS_FILE))
    hits = scan_files(pattern)
    if hits:
        print("LEAK GATE FAILED:")
        for h in hits:
            print(" ", h)
        return 1
    print("LEAK GATE PASSED: 0 matches.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
