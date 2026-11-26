import glob
import html
import json
import os
import re

BOOK_DIR = "_book"
DEFAULT_DESC = (
    "Enterprise Knowledge Architecture (SSoT), Balaerion Multi-Provider AI Gateway, "
    "and Syndicate Quantitative Systems Portfolio by Jef Aerts."
)

MANIFEST = {
    "name": "Systems Design Portfolio",
    "short_name": "Systems Portfolio",
    "description": DEFAULT_DESC,
    "start_url": "./index.html",
    "scope": "./",
    "display": "standalone",
    "background_color": "#08090D",
    "theme_color": "#08090D",
    "icons": [
        {"src": "assets/icon-192.png", "sizes": "192x192", "type": "image/png"},
        {"src": "assets/icon-512.png", "sizes": "512x512", "type": "image/png"},
    ],
}


def wrap_markdown_tables(doc: str) -> str:
    section_re = re.compile(
        r'(<section\s+class="normal markdown-section">)([\s\S]*?)(</section>)'
    )

    def repl_section(m: re.Match) -> str:
        body = m.group(2)
        if '<div class="table-scroll">' in body:
            return m.group(0)
        body = re.sub(
            r"(<table\b[\s\S]*?</table>)",
            r'<div class="table-scroll">\1</div>',
            body,
        )
        return m.group(1) + body + m.group(3)

    return section_re.sub(repl_section, doc)


def process_html_file(path: str) -> None:
    rel = os.path.relpath(path, BOOK_DIR)
    depth = rel.count(os.sep)
    prefix = "../" * depth

    with open(path, "r", encoding="utf-8") as f:
        doc = f.read()

    # A1: Fix viewport (remove user-scalable=no, add viewport-fit=cover)
    doc = re.sub(
        r'<meta\s+name="viewport"\s+content="[^"]*">',
        '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">',
        doc,
    )

    # A3: Remove deprecated apple-mobile-web-app-capable tags
    doc = re.sub(r'\s*<meta\s+name="apple-mobile-web-app-capable"\s+content="[^"]*">', "", doc)
    doc = re.sub(
        r'\s*<meta\s+name="apple-mobile-web-app-status-bar-style"\s+content="[^"]*">',
        "",
        doc,
    )

    # A2: Fill empty meta description
    doc = re.sub(
        r'<meta\s+name="description"\s+content="">',
        f'<meta name="description" content="{html.escape(DEFAULT_DESC, quote=True)}">',
        doc,
    )

    # A2: Replace HonKit default apple-touch-icon with Signal icon
    doc = re.sub(
        r'<link\s+rel="apple-touch-icon-precomposed"[^>]*>',
        f'<link rel="apple-touch-icon" sizes="180x180" href="{prefix}assets/apple-touch-icon.png">',
        doc,
    )

    # A2: Inject theme-color, Open Graph metadata, and web manifest once
    if 'rel="manifest"' not in doc:
        title_match = re.search(r"<title>(.*?)</title>", doc, re.DOTALL)
        raw_title = html.unescape(title_match.group(1).strip()) if title_match else "Systems Design Portfolio"
        raw_title = raw_title.replace("\u2014", "-").replace("\u2013", "-")
        esc_title = html.escape(raw_title, quote=True)
        esc_desc = html.escape(DEFAULT_DESC, quote=True)
        extra_head = (
            f'    <meta name="theme-color" content="#08090D">\n'
            f'    <meta property="og:type" content="website">\n'
            f'    <meta property="og:title" content="{esc_title}">\n'
            f'    <meta property="og:description" content="{esc_desc}">\n'
            f'    <link rel="manifest" href="{prefix}manifest.webmanifest">\n'
        )
        doc = doc.replace("</head>", extra_head + "    </head>", 1)

    # B1: Wrap markdown tables in overflow-x: auto scroll container
    doc = wrap_markdown_tables(doc)

    with open(path, "w", encoding="utf-8") as f:
        f.write(doc)


def main() -> None:
    if not os.path.isdir(BOOK_DIR):
        raise SystemExit(f"Missing {BOOK_DIR} directory; run honkit build first.")

    # Remove stray dotfiles copied by HonKit if present
    for dotfile in (".gitignore", ".bookignore"):
        p = os.path.join(BOOK_DIR, dotfile)
        if os.path.isfile(p):
            os.remove(p)

    manifest_path = os.path.join(BOOK_DIR, "manifest.webmanifest")
    with open(manifest_path, "w", encoding="utf-8") as f:
        json.dump(MANIFEST, f, indent=2)
        f.write("\n")

    targets = (
        glob.glob(os.path.join(BOOK_DIR, "*.html"))
        + glob.glob(os.path.join(BOOK_DIR, "balaerion", "*.html"))
        + glob.glob(os.path.join(BOOK_DIR, "syndicate", "*.html"))
    )
    for html_path in sorted(targets):
        if os.path.basename(os.path.dirname(html_path)) == "demo":
            continue
        process_html_file(html_path)

    print(f"[OK] Post-processed {len(targets)} HonKit HTML pages and wrote {manifest_path}.")

    import shutil
    stage_pairs = [
        ("DESIGN_SYSTEM_Signal/02_studio", os.path.join(BOOK_DIR, "signal", "02_studio")),
        ("DESIGN_SYSTEM_Signal/07_press/public", os.path.join(BOOK_DIR, "signal", "press")),
        ("DEMO", os.path.join(BOOK_DIR, "demo")),
        ("assets", os.path.join(BOOK_DIR, "assets")),
        ("balaerion/demo", os.path.join(BOOK_DIR, "balaerion", "demo")),
        ("syndicate/demo", os.path.join(BOOK_DIR, "syndicate", "demo")),
    ]
    os.makedirs(os.path.join(BOOK_DIR, "styles"), exist_ok=True)
    if os.path.isfile("styles/website.css"):
        shutil.copy2("styles/website.css", os.path.join(BOOK_DIR, "styles", "website.css"))
    for src_dir, dst_dir in stage_pairs:
        if os.path.isdir(src_dir):
            shutil.copytree(src_dir, dst_dir, dirs_exist_ok=True)
    for stray in (".gitignore", ".bookignore"):
        for root, _dirs, files in os.walk(BOOK_DIR):
            if stray in files:
                os.remove(os.path.join(root, stray))


if __name__ == "__main__":
    main()
