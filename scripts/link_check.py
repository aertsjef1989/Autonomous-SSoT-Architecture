#!/usr/bin/env python3
"""Internal link checker for the built HonKit book (standard library only).

Scans every .html file under --book-dir, collects href/src targets that are
internal (relative paths or root-relative paths without a scheme), and fails
loudly (exit 1) if a target file does not exist or if a fragment (#id) points
to an id/name that is not present in the target HTML page.

Usage: python3 scripts/link_check.py --book-dir _book
"""
import argparse
import os
import sys
from html.parser import HTMLParser
from urllib.parse import unquote, urlsplit

SKIP_SCHEMES = ("http:", "https:", "mailto:", "tel:", "data:", "javascript:", "blob:")


class Collector(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.refs: list[tuple[int, str]] = []
        self.ids: set[str] = set()

    def handle_starttag(self, tag, attrs):
        for name, value in attrs:
            if value is None:
                continue
            if name in ("id",) or (name == "name" and tag == "a"):
                self.ids.add(value)
            if name in ("href", "src") and tag in ("a", "link", "script", "img", "iframe", "source", "video", "audio"):
                self.refs.append((self.getpos()[0], value.strip()))


_cache: dict[str, Collector] = {}


def parse(path: str) -> Collector:
    if path not in _cache:
        c = Collector()
        with open(path, "r", encoding="utf-8", errors="replace") as f:
            c.feed(f.read())
        _cache[path] = c
    return _cache[path]


def is_internal(ref: str) -> bool:
    if not ref or ref.startswith("//"):
        return False
    low = ref.lower()
    if low.startswith(SKIP_SCHEMES):
        return False
    if "${" in ref or "{{" in ref:  # template placeholders in inline JS/HTML
        return False
    return True


def check(book_dir: str) -> list[str]:
    book_dir = os.path.abspath(book_dir)
    errors: list[str] = []
    for root, _dirs, files in os.walk(book_dir):
        for fname in sorted(files):
            if not fname.endswith(".html"):
                continue
            src = os.path.join(root, fname)
            col = parse(src)
            for line, ref in col.refs:
                if not is_internal(ref):
                    continue
                parts = urlsplit(ref)
                path = unquote(parts.path)
                frag = unquote(parts.fragment)
                if path == "":
                    target = src
                elif path.startswith("/"):
                    target = os.path.join(book_dir, path.lstrip("/"))
                else:
                    target = os.path.normpath(os.path.join(root, path))
                if os.path.isdir(target):
                    target = os.path.join(target, "index.html")
                rel_src = os.path.relpath(src, book_dir)
                if not os.path.exists(target):
                    errors.append(f"{rel_src}:{line}: missing target '{ref}'")
                    continue
                if frag and target.endswith(".html"):
                    if frag not in parse(target).ids:
                        errors.append(f"{rel_src}:{line}: missing anchor '{ref}'")
    return errors


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--book-dir", default="_book")
    args = ap.parse_args()
    if not os.path.isdir(args.book_dir):
        print(f"LINK CHECK FAILED: book dir '{args.book_dir}' not found")
        return 1
    errors = check(args.book_dir)
    n_pages = len(_cache)
    if errors:
        print(f"LINK CHECK FAILED: {len(errors)} broken internal reference(s) across {n_pages} parsed page(s)")
        for e in errors:
            print("  " + e)
        return 1
    print(f"LINK CHECK PASSED: 0 broken internal references across {n_pages} parsed page(s)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
