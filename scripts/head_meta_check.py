#!/usr/bin/env python3
"""HTML <head> metadata validator (Phase Q5 R35, standard library only).

Verifies that every standalone HTML page in `--book-dir` (all HonKit pages,
standalone demos, Signal Studio pages, and Signal Press index.html; skipping
inline email-body sample fragments `*-email.html`) contains non-empty:
  1. <title>
  2. <meta name="viewport" content="...">
  3. <meta name="description" content="...">
  4. <meta name="theme-color" content="...">

Usage: python3 scripts/head_meta_check.py --book-dir _book
"""
import argparse
import os
import sys
from html.parser import HTMLParser


class HeadParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.in_head = False
        self.in_title = False
        self.title_parts: list[str] = []
        self.metas: dict[str, str] = {}

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        t = tag.lower()
        if t == "head":
            self.in_head = True
        elif t == "title" and self.in_head:
            self.in_title = True
        elif t == "meta":
            ad = {k.lower(): (v or "").strip() for k, v in attrs}
            name = ad.get("name", "").lower()
            if name:
                self.metas[name] = ad.get("content", "")

    def handle_endtag(self, tag: str) -> None:
        t = tag.lower()
        if t == "title":
            self.in_title = False
        elif t == "head":
            self.in_head = False

    def handle_data(self, data: str) -> None:
        if self.in_title:
            self.title_parts.append(data)


def check_book(book_dir: str) -> tuple[int, list[str]]:
    checked = 0
    errors: list[str] = []
    for root, _dirs, files in os.walk(book_dir):
        for fname in sorted(files):
            if not fname.endswith(".html") or fname.endswith("-email.html"):
                continue
            fpath = os.path.join(root, fname)
            rel = os.path.relpath(fpath, book_dir)
            checked += 1
            hp = HeadParser()
            with open(fpath, "r", encoding="utf-8", errors="replace") as f:
                hp.feed(f.read())
            title = "".join(hp.title_parts).strip()
            if not title:
                errors.append(f"{rel}: missing or empty <title>")
            for req in ("viewport", "description", "theme-color"):
                if not hp.metas.get(req):
                    errors.append(f"{rel}: missing or empty <meta name=\"{req}\">")
    return checked, errors


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--book-dir", default="_book")
    args = ap.parse_args()
    if not os.path.isdir(args.book_dir):
        print(f"HEAD META CHECK FAILED: directory '{args.book_dir}' not found")
        return 1
    checked, errors = check_book(args.book_dir)
    if checked == 0:
        print("HEAD META CHECK FAILED: 0 HTML pages found")
        return 1
    if errors:
        print(f"HEAD META CHECK FAILED: {len(errors)} issue(s) across {checked} standalone HTML page(s):")
        for e in errors:
            print("  " + e)
        return 1
    print(f"HEAD META CHECK PASSED: {checked}/{checked} standalone HTML pages verified (<title>, viewport, description, theme-color).")
    return 0


if __name__ == "__main__":
    sys.exit(main())
