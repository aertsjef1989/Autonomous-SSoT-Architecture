# XVI. Signal Press: Client-Side Document Designer

Signal Studio (Chapter XI) solves `16:9` presentation design by separating structured JSON content from theme rendering. **Signal Press** extends the exact same principle to portrait `A4` operational documents (`210mm x 297mm`), targeting Microsoft Word (`.docx`), Google Docs, enterprise wikis, selectable-text Dark and Light PDFs, inline-CSS Email HTML, and Markdown.

* **Launch Offline Editor:** [Open Signal Press (Browser-Only Offline Mode)](signal/press/index.html)
* **Companion Slide Surface:** [Open Signal Studio (16:9 Slide Editor)](signal/02_studio/signal-studio.html)

---

## 1. Architectural Premise: Theme-Free Content, Surface-Specific Rendering

Most document generators fail across enterprise tools because they hardcode visual styling into the authored text or export dark-canvas graphics into word processors where reviewers cannot edit them cleanly.

Signal Press enforces three strict invariants:

1. **Manual-First, Zero-Network Offline Core:** Editing, template switching, Markdown/JSON import, pre-export linting, and `.docx` / PDF / HTML / Markdown generation run completely inside the browser. Nothing leaves the tab in offline mode, and `localStorage` autosave is off by default with a one-click clear control.
2. **Theme-Free Block Schema (`signal-press-doc-v1`):** Content is authored as typed blocks (`heading`, `paragraph`, `bullets`, `numbered`, `table`, `kpi_row`, `callout`, `quote`, `hero_image`, `divider`, `source_note`, `page_break`, `toc`) plus explicit source provenance (`verified`, `reported`, `unconfirmable`). Colour roles and typography are bound only at render time.
3. **Surface-Appropriate Export Parity:**
   * **DOCX, Google Docs, and Enterprise Wikis:** Always render on the Signal Light surface (`#FFFFFF` ground, `#14161C` ink, `#F5F6F8` table banding, `#B80D42` deep pink, `#0A7571` deep cyan tuned to `5.53:1` for `8.5pt` A4 eyebrows) using metric-matched `Calibri` / `Carlito` styles. Callouts export as single-cell shaded OOXML tables rather than floating Word textboxes so Google Docs and enterprise wikis preserve flow without converting callouts into uneditable drawing canvases.
   * **A4 PDF (Dark and Print-Safe Light):** Renders semantic HTML with `@page { size: A4 portrait; margin: 14mm 15mm }`, self-hosted `Carlito` (`SIL OFL-1.1`), selectable text, and WCAG AA contrast (`>= 4.5:1`) in both Console Dark (`#0B0C10`) and Light Screen (`#FFFFFF`).
   * **Email-Body HTML:** Client-facing follow-ups export as `600px` table-based HTML with `100%` inline CSS and zero external image or font requests, surviving Gmail, Outlook Word-engine tables, and Apple Mail without PDF attachments.

---

## 2. Shipped Templates & Allowed Export Surfaces

Every shipped template uses synthetic calibration entities (`*.example`) and enforces audience-specific export rules:

| Template | Audience | Primary Structure | Permitted Exports |
| :--- | :--- | :--- | :--- |
| **1. Executive One-Pager** | Internal | Live A4 single-page fit meter (`<= 269mm`), KPI tiles, numbered controls, governance invariant | DOCX, Google Docs, PDF (Dark/Light), Email HTML, Markdown |
| **2. Prospect Research Brief** | Internal | Entity snapshot table, `1 to 10` readiness rubric, `verified` / `reported` / `unconfirmable` source notes | DOCX, Google Docs, PDF (Dark/Light), Email HTML, Markdown |
| **3. Client Activation Plan** | Client | 30-minute discovery summary, self-service client steps, province-level NL geo rules, advisory framing | Email HTML, DOCX, Google Docs, Markdown *(PDF blocked)* |
| **4. Technical Integration Guide** | Client | Prerequisites, server-side `event_id` deduplication steps, verification threshold table | Email HTML, DOCX, Google Docs, Markdown *(PDF blocked)* |
| **5. SSoT Operational Playbook** | Internal | Literal answer-first summary, numbered sequence, Mover protocol guardrail quote | DOCX, Google Docs, PDF (Dark/Light), Email HTML, Markdown |
| **6. Architecture & Governance Report** | Internal | Cover emblem, auto-generated table of contents, executive summary, page break, audit telemetry table | DOCX, Google Docs, PDF (Dark/Light), Email HTML, Markdown |

---

## 3. Blocking Pre-Export Lint Gate

In keeping with the portfolio's fail-closed control philosophy, clicking any export button runs a synchronous **Blocking Pre-Export Lint** before generating bytes. If any check fails, export halts and lists each finding inline:

* **Employer & Brand Leak Gate:** Blocks flagged employer names plus any custom client/employer terms entered in browser memory.
* **Typography Hygiene:** Catches em dashes and en dashes and offers a deterministic one-click normalizer.
* **Commercial & Outreach Discipline:** Blocks daily ad spend or budget minimums in one-pagers and client materials, enforces a `30-minute` discovery call duration, and blocks non-synthetic contact emails or domains in generic templates.
* **Client-Audience Isolation:** Blocks PDF exports, internal commercial margin terms, internal OSINT/agency tool names, cross-client comparisons, and "attached PDF" phrasing whenever `audience = client`.
* **Provenance Completeness:** Requires every quantitative KPI or numeric claim block to reference a registered `source_id` in the document's source table, and requires every section heading mandated by the active template to remain non-empty.
* **Optional NL/BE Rule Pack:** Flags city-level or radius geo targeting on Netherlands documents (requiring province-level regions such as `Noord-Holland` or `Zuid-Holland`) and blocks agency-managed promises in client activation plans in favour of self-service advisory instructions.

---

## 4. Client-Side Importers & Mismatch Reporting

Signal Press imports existing portfolio artifacts without a server round-trip:

* **SSoT Markdown & Structured Filenames:** Parses `[PREFIX]_[FOLDER]_[CC]_[COUNTER]_[TOPIC].md` filenames, YAML frontmatter, GFM tables, callouts, and `## Sources` lists. Unknown frontmatter keys or heading levels deeper than `H3` are reported in an explicit **Importer Mismatch Report** rather than silently discarded.
* **ProspectHub Brief JSON:** Maps deterministic account brief JSON payloads into the `1 to 10` Research Brief structure while preserving any unrecognized JSON properties in a visible context callout for human review.

---

## 5. Pre-Rendered Synthetic Sample Exports (`[Status: Implemented]`)

Every shipped template is pre-rendered from synthetic calibration fixtures (`*.example`) and verified in CI so reviewers can inspect native output quality immediately without opening an editor:

| Template | Editable OOXML (`.docx` / Google Docs Route) | A4 Dark PDF (`#0B0C10`) | A4 Print-Safe Light PDF (`#FFFFFF`) | Inline-CSS Email / Markdown |
| :--- | :--- | :--- | :--- | :--- |
| **1. Executive One-Pager** (`1` page) | [tpl-one-pager.docx](signal/press/press-samples/tpl-one-pager.docx) | [tpl-one-pager-dark.pdf](signal/press/press-samples/tpl-one-pager-dark.pdf) | [tpl-one-pager-light.pdf](signal/press/press-samples/tpl-one-pager-light.pdf) | [Email HTML](signal/press/press-samples/tpl-one-pager-email.html) · [MD](signal/press/press-samples/tpl-one-pager.md) |
| **2. Prospect Research Brief** | [tpl-research-brief.docx](signal/press/press-samples/tpl-research-brief.docx) | [tpl-research-brief-dark.pdf](signal/press/press-samples/tpl-research-brief-dark.pdf) | [tpl-research-brief-light.pdf](signal/press/press-samples/tpl-research-brief-light.pdf) | [Email HTML](signal/press/press-samples/tpl-research-brief-email.html) · [MD](signal/press/press-samples/tpl-research-brief.md) |
| **3. Client Activation Plan** *(Client)* | [tpl-activation-plan.docx](signal/press/press-samples/tpl-activation-plan.docx) | *(Blocked by client lint)* | *(Blocked by client lint)* | [Email HTML](signal/press/press-samples/tpl-activation-plan-email.html) · [MD](signal/press/press-samples/tpl-activation-plan.md) |
| **4. Technical Integration Guide** *(Client)* | [tpl-integration-guide.docx](signal/press/press-samples/tpl-integration-guide.docx) | *(Blocked by client lint)* | *(Blocked by client lint)* | [Email HTML](signal/press/press-samples/tpl-integration-guide-email.html) · [MD](signal/press/press-samples/tpl-integration-guide.md) |
| **5. SSoT Operational Playbook** | [tpl-playbook-page.docx](signal/press/press-samples/tpl-playbook-page.docx) | [tpl-playbook-page-dark.pdf](signal/press/press-samples/tpl-playbook-page-dark.pdf) | [tpl-playbook-page-light.pdf](signal/press/press-samples/tpl-playbook-page-light.pdf) | [Email HTML](signal/press/press-samples/tpl-playbook-page-email.html) · [MD](signal/press/press-samples/tpl-playbook-page.md) |
| **6. Architecture & Governance Report** (`2` pages) | [tpl-executive-report.docx](signal/press/press-samples/tpl-executive-report.docx) | [tpl-executive-report-dark.pdf](signal/press/press-samples/tpl-executive-report-dark.pdf) | [tpl-executive-report-light.pdf](signal/press/press-samples/tpl-executive-report-light.pdf) | [Email HTML](signal/press/press-samples/tpl-executive-report-email.html) · [MD](signal/press/press-samples/tpl-executive-report.md) |

---

## 6. Known Limits & Architectural Trade-Offs

1. **Google Docs Path Uses the `.docx` Import Route:** Because Signal Press runs offline in the browser with zero OAuth scopes or Google API calls, exporting for Google Docs generates a standards-compliant OOXML `.docx` tuned for *File -> Open / Import* in Google Drive (`Carlito` / `Calibri` metric parity, single-cell shaded table callouts instead of floating Word `<w:txbxContent>` boxes). Direct `docs.googleapis.com` mutation is intentionally out of scope.
2. **OOXML-to-Google-Docs Fidelity Bounds:** Google Docs normalizes custom paragraph keep-with-next rules, subtle table cell padding (`1pt` to `2pt` variance), and running footer tab stops upon `.docx` conversion; single-page budgets (`<= 269mm` on the Executive One-Pager) include vertical safety margin so converted pages do not spill onto page 2.
3. **Selectable-Text PDF vs. Full PDF/UA Tagging:** Exported Dark and Light PDFs render real selectable vector text, semantic HTML heading hierarchy, self-hosted `Carlito` fonts, and WCAG AA colour contrast (`>= 4.5:1`), but Chromium headless/browser print pipelines do not emit full ISO `14289-1` (`PDF/UA-1`) reading-order tag trees or Matterhorn-certified structure dictionaries without post-processing.
4. **Desktop-First A4 Authoring Stage (Mobile Editing Out of Scope):** While Signal Press stacks cleanly without horizontal overflow at `320px` to `414px` for mobile inspection and one-click sample export, dense multi-block A4 authoring and live `210mm x 297mm` pagination preview are designed for desktop/tablet viewports (`>= 900px`).

---

## 7. Automated Verification & Test Evidence Summary (`scripts/verify_p3_press.mjs`)

| Verification Gate | Method | Verified Result |
| :--- | :--- | :--- |
| **DOCX / LibreOffice / PDF Parity (`G12`)** | Headless Chromium PDF render + LibreOffice `--headless --convert-to pdf` on generated `.docx` + OOXML XML inspection | `tpl-one-pager` = `1` page across Dark PDF, Light PDF, and LibreOffice `.docx -> .pdf`; `tpl-executive-report` = `2` pages; `0` `<w:txbxContent>` floating textboxes; `16/16` WCAG AA foreground/background pairs `>= 4.5:1`. |
| **Two-Way Blocking Lint (`G13`)** | Automated positive pass across all `6` templates + negative injection of `17` defect fixtures | `6/6` clean templates export (`0` errors); `17/17` planted violations (employer tokens, em/en dashes, unsourced KPIs, client PDF attempt, NL city targeting, daily spend) hard-block export. |
| **Strict Offline Execution (`G14`)** | Playwright `context.set_offline(True)` network-socket monitor during edit, lint, dash normalizer, and export | `0` outbound network requests; `0` passive cookies; `localStorage` autosave off by default. |
