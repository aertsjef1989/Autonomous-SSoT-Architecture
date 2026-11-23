# XI. Signal Design System

**Document ID:** `11-Signal-Design-System.md`  
**Focus:** Visual Language, Token Architecture & Live Browser Studio

---

| `11-Signal-Design-System.md` | VI. Interfaces & Design System | Visual Language, Token Architecture & Live Browser Studio |
**Signal** is the standalone visual language, token architecture, and browser-based slide studio built to render this architecture suite consistently across slides, technical diagrams, documentation, and internal wikis.

## 1. Launch Live (GitHub Pages)

Both applications are zero-install, standalone HTML builds running directly in your browser:

* **[Launch Signal Studio](https://aertsjef1989.github.io/Autonomous-SSoT-Architecture/signal/02_studio/signal-studio.html)** — Full canvas editor with 6 switchable themes, 56 vector devices, 41 templates, and native `.pptx` export.
* **[Launch Signal Gallery](https://aertsjef1989.github.io/Autonomous-SSoT-Architecture/signal/02_studio/signal-gallery.html)** — Interactive browser for the 56-machine visual vocabulary and template library.

---

## 2. Core Architecture

| Layer | Path | Purpose |
| :--- | :--- | :--- |
| **Cross-Surface Standard** | `DESIGN_SYSTEM_Signal/00_cross_surface_standard/` | Unified styling rules for documents, spreadsheets, wikis, and code |
| **Specification** | `DESIGN_SYSTEM_Signal/01_spec/` | Eleven formal design-language specifications |
| **Browser Studio** | `DESIGN_SYSTEM_Signal/02_studio/` | Standalone HTML editors (`signal-studio.html`, `signal-gallery.html`) |
| **Rendering Engine** | `DESIGN_SYSTEM_Signal/03_engine/` | Kit, model, renderers, and manifests |
| **Templates & Devices** | `DESIGN_SYSTEM_Signal/04_templates/` & `05_devices/` | 41 slide templates across 6 groups + 56 SVG device drawings |
| **Design Tokens** | `DESIGN_SYSTEM_Signal/06_tokens/` | Palette and geometry tokens in 6 formats (including `console` and `print` variants) |

## 3. Colour Semantics

| Token | Hex | Meaning |
| :--- | :--- | :--- |
| **Cyan** | `#21E0DC` | Active safeguard or system behaving as specified |
| **Pink** | `#F0245C` | Silent failure mode, active fault, or the guard that prevents it (never decorative) |
| **Console Ground** | `#08090D` | High-contrast dark ground for dense technical diagrams |
| **Print Ink** | `#14161C` | Ink-on-white standard for rendered documentation |
