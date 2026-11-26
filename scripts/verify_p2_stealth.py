import json
import os
import socket
import subprocess
import sys
import time
import urllib.error
import urllib.request
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright

APP_DIR = "balaerion-app"
ROUTES = ["/", "/ssot", "/balaerion", "/syndicate", "/studio", "/press", "/redeem", "/privacy", "/login", "/robots.txt"]


def free_port() -> int:
    with socket.socket() as s:
        s.bind(("127.0.0.1", 0))
        return s.getsockname()[1]


def fetch(url: str, method: str = "GET", payload: dict | None = None) -> tuple[int, dict, str]:
    data = json.dumps(payload).encode("utf-8") if payload is not None else None
    headers = {"Content-Type": "application/json"} if payload is not None else {}
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            return resp.status, {k.lower(): v for k, v in resp.headers.items()}, resp.read().decode("utf-8", errors="ignore")
    except urllib.error.HTTPError as err:
        return err.code, {k.lower(): v for k, v in err.headers.items()}, err.read().decode("utf-8", errors="ignore")


def main() -> int:
    port = free_port()
    env = {**os.environ, "PORT": str(port), "HOSTNAME": "127.0.0.1"}
    proc = subprocess.Popen(
        ["npm", "--prefix", APP_DIR, "run", "start", "--", "-p", str(port), "-H", "127.0.0.1"],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
        env=env,
    )

    base = f"http://127.0.0.1:{port}"
    try:
        ready = False
        for _ in range(40):
            try:
                st, _, _ = fetch(f"{base}/robots.txt")
                if st == 200:
                    ready = True
                    break
            except Exception:
                time.sleep(0.25)
        if not ready:
            print("Next.js server failed to start", file=sys.stderr)
            return 1

        # 1. Header & Robots / Sitemap Verification (D6, D7)
        for route in ROUTES:
            status, hdrs, body = fetch(f"{base}{route}")
            assert status == 200, f"Route {route} returned {status}"
            x_robots = hdrs.get("x-robots-tag", "")
            ref_pol = hdrs.get("referrer-policy", "")
            xfo = hdrs.get("x-frame-options", "")
            csp = hdrs.get("content-security-policy", "")
            for tok in ("noindex", "nofollow", "noarchive", "nosnippet"):
                assert tok in x_robots, f"Missing {tok} in X-Robots-Tag on {route}: {x_robots}"
            assert ref_pol == "no-referrer", f"Bad Referrer-Policy on {route}: {ref_pol}"
            assert xfo == "DENY", f"Bad X-Frame-Options on {route}: {xfo}"
            assert "connect-src 'self'" in csp, f"Missing self-only connect-src CSP on {route}: {csp}"
            if route == "/robots.txt":
                assert "Disallow: /" in body, f"robots.txt missing Disallow: /: {body}"
            elif route == "/":
                assert 'name="robots"' in body and "noindex" in body, "Missing meta robots on /"

        st_sm, _, _ = fetch(f"{base}/sitemap.xml")
        assert st_sm == 404, f"/sitemap.xml must be 404, got {st_sm}"
        print(f"[HEADERS] Verified X-Robots-Tag, Referrer-Policy, X-Frame-Options, CSP on {len(ROUTES)} routes; /sitemap.xml=404.")

        # 2. API Gate Two-Way Tests (Rule 2.9, E1/G10 preview)
        st_pii, _, body_pii = fetch(
            f"{base}/api/chat",
            method="POST",
            payload={"prompt": "Check VAT BE0123.456.789", "lane": "general", "provider": "groq"},
        )
        assert st_pii == 403 and "PII GATE BLOCKED" in body_pii, f"Expected 403 PII block, got {st_pii}: {body_pii}"

        st_lane, _, body_lane = fetch(
            f"{base}/api/chat",
            method="POST",
            payload={"prompt": "Safe prompt", "lane": "safe", "provider": "groq"},
        )
        assert st_lane == 403 and "LANE VIOLATION" in body_lane, f"Expected 403 lane block, got {st_lane}: {body_lane}"

        st_clean, _, body_clean = fetch(
            f"{base}/api/chat",
            method="POST",
            payload={"prompt": "Explain DMADV phases", "lane": "general", "provider": "groq"},
        )
        assert st_clean == 401 and '"replay":true' in body_clean, f"Expected 401 ungranted Replay fallback, got {st_clean}: {body_clean}"

        st_admin, hdr_admin, _ = fetch(f"{base}/api/admin/ping")
        assert st_admin == 401 and "noindex" in hdr_admin.get("x-robots-tag", ""), f"Expected 401 on /api/admin, got {st_admin}"
        print("[API GATES] Verified PII block (403), cross-lane block (403), ungranted Replay fallback (401), and /api/admin lock (401).")

        # 3. Playwright Mobile (320px) & Zero External Network Request Audit (D8, B4)
        ext_reqs = []
        overflows = []
        with sync_playwright() as pw:
            browser = pw.chromium.launch(
                executable_path="/usr/bin/google-chrome",
                args=["--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage"],
            )
            ctx = browser.new_context(viewport={"width": 320, "height": 800})
            page = ctx.new_page()

            def on_route(route):
                host = urlparse(route.request.url).hostname
                if host and host != "127.0.0.1":
                    ext_reqs.append(route.request.url)
                    route.abort()
                else:
                    route.continue_()

            page.route("**/*", on_route)
            for r in [x for x in ROUTES if x != "/robots.txt"]:
                page.goto(f"{base}{r}", wait_until="networkidle")
                dims = page.evaluate("() => ({docW: document.documentElement.scrollWidth, winW: window.innerWidth})")
                if dims["docW"] > dims["winW"] + 1:
                    overflows.append((r, dims["docW"], dims["winW"]))
            ctx.close()
            browser.close()

        print(f"[PLAYWRIGHT P2] 320px overflows: {len(overflows)} {overflows} | External requests (D8): {len(ext_reqs)} {ext_reqs}")
        if overflows or ext_reqs:
            return 1

        return 0
    finally:
        proc.terminate()
        try:
            proc.wait(timeout=5)
        except subprocess.TimeoutExpired:
            proc.kill()


if __name__ == "__main__":
    sys.exit(main())
