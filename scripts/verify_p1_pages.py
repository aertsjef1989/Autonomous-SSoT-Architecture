import glob
import http.server
import os
import re
import socketserver
import sys
import threading
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright

BOOK_DIR = "_book"


def main() -> int:
    if not os.path.isdir(BOOK_DIR):
        print("Missing _book directory", file=sys.stderr)
        return 1

    honkit_pages = sorted(
        glob.glob(f"{BOOK_DIR}/*.html")
        + glob.glob(f"{BOOK_DIR}/balaerion/*.html")
        + glob.glob(f"{BOOK_DIR}/syndicate/*.html")
    )
    demo_pages = [
        f"{BOOK_DIR}/demo/index.html",
        f"{BOOK_DIR}/balaerion/demo/index.html",
        f"{BOOK_DIR}/syndicate/demo/index.html",
        f"{BOOK_DIR}/signal/press/index.html",
    ]
    studio_pages = [
        f"{BOOK_DIR}/signal/02_studio/signal-studio.html",
        f"{BOOK_DIR}/signal/02_studio/signal-gallery.html",
    ]

    broken_links = []
    vercel_hits = []
    github_io_hits = []
    dash_hits = []

    for p in honkit_pages + demo_pages:
        txt = open(p, encoding="utf-8", errors="ignore").read()
        if "vercel" in txt.lower():
            vercel_hits.append(p)
        if "github.io" in txt.lower():
            github_io_hits.append(p)
        if "\u2014" in txt or "\u2013" in txt:
            dash_hits.append(p)
        for attr in re.findall(r'(?:href|src)="([^"]+)"', txt):
            u = attr.split("#")[0].split("?")[0].strip()
            if not u or u.startswith(("http://", "https://", "mailto:", "javascript:", "data:")):
                continue
            target = os.path.normpath(os.path.join(os.path.dirname(p), u))
            if os.path.isdir(target):
                target = os.path.join(target, "index.html")
            if not os.path.exists(target):
                broken_links.append((p, attr, target))

    idx_head = open(f"{BOOK_DIR}/index.html", encoding="utf-8").read().split("</head>")[0]
    a1_ok = "viewport-fit=cover" in idx_head and "user-scalable=no" not in idx_head
    a2_ok = 'property="og:title"' in idx_head and 'rel="manifest"' in idx_head and "theme-color" in idx_head
    a3_ok = "apple-mobile-web-app-capable" not in idx_head
    d10_ok = not os.path.exists(f"{BOOK_DIR}/balaerion-app")

    print(f"[STATIC] HonKit pages: {len(honkit_pages)} | Demos: {len(demo_pages)} | Studio: {len(studio_pages)}")
    print(f"  K3 Broken internal links: {len(broken_links)}")
    print(f"  D2 Hardcoded github.io URLs: {len(github_io_hits)}")
    print(f"  D5 Vercel references in public pages/demos: {len(vercel_hits)}")
    print(f"  D10 AI-assist / balaerion-app excluded from _book: {d10_ok}")
    print(f"  A1/A2/A3 metadata checks: A1={a1_ok}, A2={a2_ok}, A3={a3_ok}")
    print(f"  2.8 Em/en dash hits in HonKit/demo HTML: {len(dash_hits)}")

    if broken_links or github_io_hits or vercel_hits or not (a1_ok and a2_ok and a3_ok and d10_ok):
        print("FAILED static checks:", {
            "broken_links": broken_links[:5],
            "github_io_hits": github_io_hits,
            "vercel_hits": vercel_hits,
        })
        return 1

    class QuietHandler(http.server.SimpleHTTPRequestHandler):
        def __init__(self, *args, **kwargs):
            super().__init__(*args, directory=BOOK_DIR, **kwargs)

        def log_message(self, *args):
            pass

    httpd = socketserver.ThreadingTCPServer(("127.0.0.1", 0), QuietHandler)
    port = httpd.server_address[1]
    threading.Thread(target=httpd.serve_forever, daemon=True).start()

    honkit_and_demos = [os.path.relpath(p, BOOK_DIR) for p in (honkit_pages + demo_pages)]
    studio_rel = [os.path.relpath(p, BOOK_DIR) for p in studio_pages]
    widths = [320, 375, 414]
    overflows = []
    studio_overflows = []
    table_overflows = []
    small_taps = []
    external_requests = {}

    with sync_playwright() as pw:
        browser = pw.chromium.launch(
            executable_path="/usr/bin/google-chrome",
            args=[
                "--no-sandbox",
                "--disable-gpu",
                "--disable-dev-shm-usage",
                "--host-resolver-rules=MAP * ~NOTFOUND , EXCLUDE 127.0.0.1",
            ],
        )
        for w in widths:
            ctx = browser.new_context(viewport={"width": w, "height": 800})
            page = ctx.new_page()
            current_route = [None]

            def on_req(req):
                host = urlparse(req.url).hostname
                if host and host != "127.0.0.1":
                    external_requests.setdefault(current_route[0], set()).add(req.url)

            page.on("request", on_req)

            for r in honkit_and_demos + studio_rel:
                current_route[0] = r
                page.goto(f"http://127.0.0.1:{port}/{r}", wait_until="domcontentloaded")
                res = page.evaluate(
                    """() => {
                    const docW = document.documentElement.scrollWidth;
                    const winW = window.innerWidth;
                    const badTables = [];
                    document.querySelectorAll('table').forEach((t, idx) => {
                        const rect = t.getBoundingClientRect();
                        let p = t.parentElement;
                        let insideScroll = false;
                        while (p && p !== document.body) {
                            const ox = getComputedStyle(p).overflowX;
                            if (ox === 'auto' || ox === 'scroll') { insideScroll = true; break; }
                            p = p.parentElement;
                        }
                        if (rect.width > winW + 1 && !insideScroll) {
                            badTables.push({idx, width: Math.round(rect.width), winW});
                        }
                    });
                    const badButtons = [];
                    document.querySelectorAll('button, select, input[type="text"], input[type="number"]').forEach((el) => {
                        const cs = getComputedStyle(el);
                        if (cs.display === 'none' || cs.visibility === 'hidden') return;
                        const rect = el.getBoundingClientRect();
                        if (rect.width > 0 && rect.height > 0 && rect.height < 43.5) {
                            badButtons.push({tag: el.tagName, cls: el.className, h: Math.round(rect.height)});
                        }
                    });
                    return {docW, winW, badTables, badButtons: badButtons.slice(0, 5)};
                }"""
                )
                if res["docW"] > res["winW"] + 1:
                    if r in studio_rel:
                        studio_overflows.append((w, r, res["docW"], res["winW"]))
                    else:
                        overflows.append((w, r, res["docW"], res["winW"]))
                if res["badTables"] and r not in studio_rel:
                    table_overflows.append((w, r, res["badTables"]))
                if w == 320 and res["badButtons"] and r not in studio_rel:
                    small_taps.append((r, res["badButtons"]))
            ctx.close()
        browser.close()

    httpd.shutdown()

    non_studio_ext = {k: sorted(v) for k, v in external_requests.items() if k not in studio_rel}
    studio_ext = {k: sorted(v) for k, v in external_requests.items() if k in studio_rel}

    print(f"[PLAYWRIGHT] Tested {len(honkit_and_demos)} pages/demos + {len(studio_rel)} Studio files across {widths}px:")
    print(f"  B4 Viewport overflows (25 chapters + 3 demos): {len(overflows)} {overflows[:5]}")
    print(f"  K4 Unwrapped table overflows at 320/375/414px: {len(table_overflows)} {table_overflows[:5]}")
    print(f"  B3 Interactive controls < 44px height (chapters + demos): {len(small_taps)} {small_taps[:5]}")
    print(f"  D8 External requests in 25 chapters + 3 demos: {len(non_studio_ext)} {non_studio_ext}")
    print(f"  K1 Studio desktop-canvas notes (untouched per I2): overflows={studio_overflows}, ext_urls={ {k: len(v) for k,v in studio_ext.items()} }")

    if overflows or table_overflows or non_studio_ext:
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
