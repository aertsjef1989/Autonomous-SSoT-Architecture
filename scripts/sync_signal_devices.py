#!/usr/bin/env python3
"""
Authors H57..H63 geometric Signal vector devices (pure text-free Signal Asset Kit v1 grammar),
bridges all 63 devices (H01..H63) into balaerion-app/public/press-assets/heroes/,
and renders PNG counterparts via headless Chromium for offline OOXML .docx image embedding.
"""

import math
import shutil
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent
DEVICES_DIR = ROOT / "DESIGN_SYSTEM_Signal" / "05_devices"
HEROES_DIR = ROOT / "balaerion-app" / "public" / "press-assets" / "heroes"

SVG_HEADER = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 576" width="1024" height="576"><defs>
<filter id="glow" x="-60%" y="-60%" width="220%" height="220%">
  <feDropShadow dx="0" dy="0" stdDeviation="3" flood-color="currentColor" flood-opacity="0.85"/>
  <feDropShadow dx="0" dy="0" stdDeviation="8" flood-color="currentColor" flood-opacity="0.45"/>
</filter>
<pattern id="hatch" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
  <line x1="0" y1="0" x2="0" y2="10" stroke="#2A2E3A" stroke-width="1.4"/>
</pattern>
</defs><rect width="1024" height="576" fill="#0B0C10"/>
<rect x="20" y="20" width="984" height="536" rx="10" fill="none" stroke="#2A2E3A" stroke-width="1.2"/>
<g transform="translate(26,26)"><line x1="0" y1="0" x2="32" y2="0" stroke="#B9C0CE" stroke-width="2.4"/><line x1="0" y1="0" x2="0" y2="32" stroke="#B9C0CE" stroke-width="2.4"/><rect x="12" y="12" width="5" height="5" fill="#B9C0CE"/></g>
<g transform="translate(998,550) rotate(180)"><line x1="0" y1="0" x2="32" y2="0" stroke="#B9C0CE" stroke-width="2.4"/><line x1="0" y1="0" x2="0" y2="32" stroke="#B9C0CE" stroke-width="2.4"/><rect x="12" y="12" width="5" height="5" fill="#B9C0CE"/></g>
"""

SVG_FOOTER = "</svg>\n"


def wrap_svg(inner: str) -> str:
    return SVG_HEADER + inner + SVG_FOOTER


def build_h57_multi_llm_router() -> str:
    # Two-lane 12-provider router: left ingress -> hatch firewall -> 3 EU safe nodes (top) + 9 General nodes (bottom) -> right arbiter
    parts = [
        '<g color="#21E0DC">',
        '<circle cx="120" cy="288" r="38" fill="#15171F" stroke="#21E0DC" stroke-width="2.5" filter="url(#glow)"/>',
        '<circle cx="120" cy="288" r="12" fill="#21E0DC"/>',
        # Horizontal cross-lane firewall barrier
        '<rect x="250" y="254" width="520" height="28" fill="url(#hatch)" stroke="#F0245C" stroke-width="2"/>',
        '<circle cx="904" cy="288" r="38" fill="#15171F" stroke="#21E0DC" stroke-width="2.5" filter="url(#glow)"/>',
        '<polygon points="904,268 924,288 904,308 884,288" fill="#F0245C"/>',
    ]
    # 3 EU Safe lane nodes (top)
    for i in range(3):
        x = 340 + i * 160
        y = 148
        parts.append(f'<path d="M158 274 L240 148 L{x - 32} {y}" fill="none" stroke="#21E0DC" stroke-width="1.8"/>')
        parts.append(f'<rect x="{x - 32}" y="{y - 26}" width="64" height="52" rx="6" fill="#15171F" stroke="#21E0DC" stroke-width="2.2" filter="url(#glow)"/>')
        parts.append(f'<circle cx="{x}" cy="{y}" r="7" fill="#21E0DC"/>')
        parts.append(f'<path d="M{x + 32} {y} L790 148 L866 274" fill="none" stroke="#21E0DC" stroke-width="1.8"/>')
    # 9 General lane nodes (bottom 3x3)
    for idx in range(9):
        col = idx % 3
        row = idx // 3
        x = 330 + col * 170
        y = 344 + row * 68
        col_hex = "#21E0DC" if idx < 5 else "#B9C0CE"
        parts.append(f'<line x1="158" y1="302" x2="{x - 28}" y2="{y}" stroke="{col_hex}" stroke-width="1.2" opacity="0.75"/>')
        parts.append(f'<rect x="{x - 28}" y="{y - 18}" width="56" height="36" rx="4" fill="#15171F" stroke="{col_hex}" stroke-width="1.8"/>')
        parts.append(f'<rect x="{x - 6}" y="{y - 6}" width="12" height="12" fill="{col_hex}"/>')
        parts.append(f'<line x1="{x + 28}" y1="{y}" x2="866" y2="302" stroke="{col_hex}" stroke-width="1.2" opacity="0.75"/>')
    parts.append("</g>")
    return wrap_svg("".join(parts))


def build_h58_pii_gate() -> str:
    # Pre-dispatch optical PII gate: clean cyan vectors pass through central gate; pink PII vectors deflect downward into quarantine
    parts = [
        '<g color="#21E0DC">',
        '<rect x="476" y="76" width="72" height="424" fill="url(#hatch)" stroke="#21E0DC" stroke-width="2.5"/>',
        '<circle cx="512" cy="230" r="24" fill="#0B0C10" stroke="#21E0DC" stroke-width="2.5" filter="url(#glow)"/>',
        '<circle cx="512" cy="230" r="8" fill="#21E0DC"/>',
        # Clean cyan streams passing right through
        '<line x1="96" y1="180" x2="920" y2="180" stroke="#21E0DC" stroke-width="3" filter="url(#glow)"/>',
        '<line x1="96" y1="230" x2="920" y2="230" stroke="#21E0DC" stroke-width="3" filter="url(#glow)"/>',
        '<polygon points="928,180 912,172 912,188" fill="#21E0DC"/>',
        '<polygon points="928,230 912,222 912,238" fill="#21E0DC"/>',
        # Flagged pink PII streams deflected pre-socket into quarantine vault
        '<path d="M96 340 L456 340 L370 468" fill="none" stroke="#F0245C" stroke-width="3.2"/>',
        '<path d="M96 390 L456 390 L410 468" fill="none" stroke="#F0245C" stroke-width="3.2"/>',
        '<circle cx="456" cy="340" r="9" fill="#F0245C"/>',
        '<circle cx="456" cy="390" r="9" fill="#F0245C"/>',
        '<rect x="300" y="468" width="160" height="62" rx="6" fill="#15171F" stroke="#F0245C" stroke-width="2.4"/>',
        '<line x1="330" y1="499" x2="430" y2="499" stroke="#F0245C" stroke-width="3"/>',
        "</g>",
    ]
    return wrap_svg("".join(parts))


def build_h59_capi_event_dedup() -> str:
    # Browser Pixel (top) + Server CAPI (bottom) twin streams converging on deterministic event_id diamond deduplicator
    parts = [
        '<g color="#21E0DC">',
        '<rect x="96" y="124" width="150" height="84" rx="8" fill="#15171F" stroke="#B9C0CE" stroke-width="2"/>',
        '<circle cx="171" cy="166" r="18" fill="none" stroke="#21E0DC" stroke-width="2"/>',
        '<rect x="96" y="368" width="150" height="84" rx="8" fill="#15171F" stroke="#21E0DC" stroke-width="2.2"/>',
        '<rect x="141" y="392" width="60" height="36" fill="url(#hatch)" stroke="#21E0DC" stroke-width="1.8"/>',
        # Twin pulses carrying identical event_id tokens
        '<path d="M246 166 L410 166 L484 264" fill="none" stroke="#B9C0CE" stroke-width="2.5" stroke-dasharray="8 6"/>',
        '<path d="M246 410 L410 410 L484 312" fill="none" stroke="#21E0DC" stroke-width="3" filter="url(#glow)"/>',
        # Central diamond deduplicator chamber
        '<polygon points="536,204 620,288 536,372 452,288" fill="#15171F" stroke="#21E0DC" stroke-width="3" filter="url(#glow)"/>',
        '<polygon points="536,248 576,288 536,328 496,288" fill="#F0245C"/>',
        # Single canonical conversion output vector
        '<line x1="620" y1="288" x2="896" y2="288" stroke="#21E0DC" stroke-width="4" filter="url(#glow)"/>',
        '<polygon points="914,288 892,276 892,300" fill="#21E0DC"/>',
        '<circle cx="760" cy="288" r="14" fill="#0B0C10" stroke="#21E0DC" stroke-width="2.5"/>',
        "</g>",
    ]
    return wrap_svg("".join(parts))


def build_h60_readiness_radar_funnel() -> str:
    # Left 8-spoke readiness radar polygon + Right 7-state HITL stepped commercial funnel
    cx, cy, r_max = 280, 288, 168
    parts = ['<g color="#21E0DC">']
    for ring in (0.35, 0.68, 1.0):
        pts = " ".join(
            f"{cx + math.cos(a * math.pi / 4) * r_max * ring:.1f},{cy + math.sin(a * math.pi / 4) * r_max * ring:.1f}"
            for a in range(8)
        )
        parts.append(f'<polygon points="{pts}" fill="none" stroke="#2A2E3A" stroke-width="1.4"/>')
    radii = [0.88, 0.76, 0.92, 0.64, 0.85, 0.78, 0.90, 0.72]
    data_pts = []
    for idx, rad in enumerate(radii):
        ang = idx * math.pi / 4 - math.pi / 2
        px = cx + math.cos(ang) * r_max * rad
        py = cy + math.sin(ang) * r_max * rad
        data_pts.append(f"{px:.1f},{py:.1f}")
        parts.append(f'<line x1="{cx}" y1="{cy}" x2="{cx + math.cos(ang) * r_max:.1f}" y2="{cy + math.sin(ang) * r_max:.1f}" stroke="#2A2E3A" stroke-width="1.2"/>')
    parts.append(f'<polygon points="{" ".join(data_pts)}" fill="#21E0DC" fill-opacity="0.14" stroke="#21E0DC" stroke-width="2.6" filter="url(#glow)"/>')
    # Right 7-state stepped funnel
    for st in range(7):
        w = 340 - st * 34
        x = 740 - w / 2
        y = 92 + st * 56
        stroke = "#21E0DC" if st in (3, 4) else "#B9C0CE" if st < 5 else "#F0245C"
        parts.append(f'<rect x="{x:.1f}" y="{y}" width="{w:.1f}" height="40" rx="5" fill="#15171F" stroke="{stroke}" stroke-width="2"/>')
        parts.append(f'<circle cx="{x + 20:.1f}" cy="{y + 20}" r="5" fill="{stroke}"/>')
    parts.append("</g>")
    return wrap_svg("".join(parts))


def build_h61_poisson_heatmap() -> str:
    # 6x6 Bivariate Poisson scoreline probability matrix (0..5 x 0..5)
    parts = ['<g color="#21E0DC">']
    lam_h, lam_a = 1.85, 1.25
    start_x, start_y, cell = 256, 68, 74
    for h in range(6):
        ph = (lam_h ** h) * math.exp(-lam_h) / math.factorial(h)
        for a in range(6):
            pa = (lam_a ** a) * math.exp(-lam_a) / math.factorial(a)
            prob = ph * pa
            alpha = min(0.92, max(0.08, prob * 7.2))
            x = start_x + a * (cell + 6)
            y = start_y + h * (cell + 4)
            is_peak = (h, a) in ((1, 1), (2, 1), (1, 0), (2, 0))
            fill = "#21E0DC" if h >= a else "#F0245C"
            stroke = "#21E0DC" if is_peak else "#2A2E3A"
            sw = "2.4" if is_peak else "1.2"
            parts.append(
                f'<rect x="{x}" y="{y}" width="{cell}" height="{cell - 4}" rx="4" fill="{fill}" fill-opacity="{alpha:.2f}" stroke="{stroke}" stroke-width="{sw}"/>'
            )
            if is_peak:
                parts.append(f'<circle cx="{x + cell / 2:.1f}" cy="{y + (cell - 4) / 2:.1f}" r="6" fill="#FFFFFF"/>')
    parts.append("</g>")
    return wrap_svg("".join(parts))


def build_h62_xg_quadrant() -> str:
    # Attack vs Defense xG 4-quadrant tactical scatter chart
    parts = [
        '<g color="#21E0DC">',
        '<rect x="140" y="72" width="744" height="432" fill="#11141B" stroke="#2A2E3A" stroke-width="1.8"/>',
        '<line x1="512" y1="72" x2="512" y2="504" stroke="#B9C0CE" stroke-width="1.6" stroke-dasharray="6 6"/>',
        '<line x1="140" y1="288" x2="884" y2="288" stroke="#B9C0CE" stroke-width="1.6" stroke-dasharray="6 6"/>',
        '<line x1="180" y1="472" x2="844" y2="104" stroke="#2A2E3A" stroke-width="1.5"/>',
    ]
    pts = [
        (740, 142, 16, "#21E0DC"),
        (690, 178, 14, "#21E0DC"),
        (782, 196, 12, "#21E0DC"),
        (620, 224, 11, "#21E0DC"),
        (560, 260, 10, "#B9C0CE"),
        (440, 320, 11, "#B9C0CE"),
        (360, 370, 13, "#F0245C"),
        (270, 410, 15, "#F0245C"),
        (660, 360, 12, "#F0245C"),
    ]
    for x, y, r, col in pts:
        parts.append(f'<circle cx="{x}" cy="{y}" r="{r}" fill="{col}" fill-opacity="0.24" stroke="{col}" stroke-width="2.4"/>')
        parts.append(f'<circle cx="{x}" cy="{y}" r="4" fill="{col}"/>')
    parts.append("</g>")
    return wrap_svg("".join(parts))


def build_h63_nav_waterfall() -> str:
    # Unit-Share NAV Waterfall & Zero-Dilution Datum Beam
    parts = [
        '<g color="#21E0DC">',
        '<line x1="110" y1="476" x2="914" y2="476" stroke="#B9C0CE" stroke-width="2"/>',
        # Constant post-settlement NAV datum line across Mint and Burn columns
        '<line x1="320" y1="212" x2="890" y2="212" stroke="#21E0DC" stroke-width="2.6" stroke-dasharray="10 6" filter="url(#glow)"/>',
        # Bar 1: Initial Seed
        '<rect x="150" y="296" width="110" height="180" rx="4" fill="url(#hatch)" stroke="#B9C0CE" stroke-width="2.2"/>',
        # Bar 2: Positive Slip Settlement Step-Up
        '<rect x="330" y="212" width="110" height="84" rx="4" fill="#21E0DC" fill-opacity="0.22" stroke="#21E0DC" stroke-width="2.4" filter="url(#glow)"/>',
        # Bar 3: Member Mint at Current NAV
        '<rect x="510" y="148" width="110" height="328" rx="4" fill="#15171F" stroke="#21E0DC" stroke-width="2.4"/>',
        '<line x1="510" y1="212" x2="620" y2="212" stroke="#21E0DC" stroke-width="3"/>',
        # Bar 4: Partial Member Burn at Current NAV
        '<rect x="690" y="148" width="110" height="76" rx="4" fill="#F0245C" fill-opacity="0.24" stroke="#F0245C" stroke-width="2.2"/>',
        '<rect x="690" y="224" width="110" height="252" rx="4" fill="#15171F" stroke="#B9C0CE" stroke-width="2"/>',
        "</g>",
    ]
    return wrap_svg("".join(parts))


def main() -> None:
    DEVICES_DIR.mkdir(parents=True, exist_ok=True)
    HEROES_DIR.mkdir(parents=True, exist_ok=True)

    custom_svgs = {
        "H57": build_h57_multi_llm_router(),
        "H58": build_h58_pii_gate(),
        "H59": build_h59_capi_event_dedup(),
        "H60": build_h60_readiness_radar_funnel(),
        "H61": build_h61_poisson_heatmap(),
        "H62": build_h62_xg_quadrant(),
        "H63": build_h63_nav_waterfall(),
    }
    for hid, content in custom_svgs.items():
        (DEVICES_DIR / f"{hid}.svg").write_text(content, encoding="utf-8")

    all_ids = [f"H{i:02d}" for i in range(1, 64)]
    for hid in all_ids:
        src = DEVICES_DIR / f"{hid}.svg"
        dst = HEROES_DIR / f"{hid}.svg"
        shutil.copyfile(src, dst)

    # Render PNG counterparts for any missing or newly generated hero SVGs
    to_render = [
        hid
        for hid in all_ids
        if hid in custom_svgs or not (HEROES_DIR / f"{hid}.png").exists()
    ]
    if to_render:
        with sync_playwright() as p:
            browser = p.chromium.launch(
                executable_path="/usr/bin/google-chrome",
                args=["--no-sandbox", "--disable-gpu"],
            )
            page = browser.new_page(viewport={"width": 720, "height": 405})
            for hid in to_render:
                svg_path = (HEROES_DIR / f"{hid}.svg").resolve()
                png_path = HEROES_DIR / f"{hid}.png"
                page.goto(f"file://{svg_path}", wait_until="load")
                loc = page.locator("svg")
                loc.screenshot(path=str(png_path))
            browser.close()

    print(f"Synced 63/63 Signal SVG + PNG hero devices in {HEROES_DIR} (rendered {len(to_render)} PNGs).")


if __name__ == "__main__":
    main()
