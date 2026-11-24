import os
import re
import subprocess
import sys

TERMS_FILE = os.path.join("scripts", "forbidden_terms.txt")
SKIP_DIRS = {".git", "node_modules", ".venv", "venv", "__pycache__"}


def load_terms(path: str) -> list[str]:
    if not os.path.exists(path):
        print(f"Missing blocklist file: {path}", file=sys.stderr)
        sys.exit(2)
    terms = []
    with open(path, "r", encoding="utf-8") as f:
        for line in f:
            s = line.strip()
            if not s or s.startswith("#"):
                continue
            terms.append(s)
    if not terms:
        print(f"Blocklist file is empty: {path}", file=sys.stderr)
        sys.exit(2)
    return terms


def build_pattern(terms: list[str]) -> re.Pattern:
    escaped = "|".join(re.escape(t) for t in terms)
    return re.compile(rf"(?<![A-Za-z0-9])(?:{escaped})(?![A-Za-z0-9])", re.IGNORECASE)


def scan_files(pattern: re.Pattern) -> list[str]:
    hits = []
    for root, dirs, files in os.walk("."):
        dirs[:] = [d for d in dirs if d not in SKIP_DIRS]
        for fname in sorted(files):
            fpath = os.path.join(root, fname)
            if os.path.abspath(fpath) == os.path.abspath(TERMS_FILE):
                continue
            if fname.endswith(".bak"):
                continue
            try:
                with open(fpath, "r", encoding="utf-8", errors="ignore") as f:
                    for idx, line in enumerate(f, 1):
                        if pattern.search(line):
                            hits.append(f"FILE {fpath}:{idx}: {line.strip()}")
            except OSError:
                continue
    return hits


def scan_git_history(pattern: re.Pattern) -> list[str]:
    hits = []
    try:
        proc = subprocess.run(
            ["git", "log", "-p", "--no-color"],
            capture_output=True,
            text=True,
            check=False,
        )
        if proc.returncode != 0:
            return hits
        for idx, line in enumerate(proc.stdout.splitlines(), 1):
            if line.startswith("+") and not line.startswith("+++") and pattern.search(line[1:]):
                hits.append(f"GIT_HISTORY line {idx}: {line[1:].strip()}")
    except OSError:
        pass
    return hits


def main() -> int:
    include_history = "--include-history" in sys.argv
    terms = load_terms(TERMS_FILE)
    pattern = build_pattern(terms)
    hits = scan_files(pattern)
    if include_history:
        hits.extend(scan_git_history(pattern))

    if hits:
        print("LEAK GATE FAILED:")
        for h in hits:
            print(" ", h)
        return 1

    print("LEAK GATE PASSED: 0 matches.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
