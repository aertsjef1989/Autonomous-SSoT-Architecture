# Signal Design System, cross-surface standard

A single visual system for everything you publish: **slides, documents, wikis, sheets** and anything built in code. One palette, one type scale, one motif, adapted to each surface. Version 2.0.

If a choice is not written down here or in the design language, it is not part of the system.

---

## Read this first if you are not making slides

**This folder is the cross-surface standard.** It covers Word, Excel, Lark Wiki, Lark Sheets and code, as well as slides.

The folders alongside it, `01_spec` through `07_examples` at the parent level, are a **deeper slide system** built later on top of this one. They do not replace it and they do not cover documents or spreadsheets.

| You are making | Go to |
|---|---|
| **A document, a wiki page, a spreadsheet** | **Here. `02_templates/`** |
| **Anything in Lark** | **Here. `02_templates/Lark_Conventions.md`** |
| A slide deck, quickly | Here. `02_templates/Brand_Template_Master.pptx` |
| A slide deck, in depth | **`../02_studio/signal-studio.html`** |
| Anything in code | `../06_tokens/` |

---

## Start here

New to the system, pick your task:

| I want to... | Open |
|---|---|
| Understand the whole system | `01_spec/Design_Language.pdf` |
| Keep one thing next to my screen | `01_spec/Cheat_Sheet.pdf` |
| Make a presentation | `02_templates/Brand_Template_Master.pptx` |
| Write a document or Wiki page | `02_templates/Brand_Template_Kit.docx` |
| Build a spreadsheet or tracker | `02_templates/Brand_Template_Kit.xlsx` |
| Apply it in Lark (any surface) | `02_templates/Lark_Conventions.md` |
| See it filled with real content | anything in `03_examples/` |
| Build something in code | `../06_tokens/` (json, css, scss, ts, tailwind) |
| See every component live in a browser | `05_reference/Component_Library.html` |
| **Make a slide deck in depth** | **`../02_studio/signal-studio.html`** |
| Add or change a component safely | `CONTRIBUTING.md` |

---

## What is in the box

**01_spec**: the source of truth.
- `Design_Language.pdf` / `.docx`: every parameter: colour, type, spacing, motif, components, and how it applies per surface. Page one is a coverage map.
- `Cheat_Sheet.pdf`: the one-page quick reference.

**02_templates**: start your work from these.
- `Brand_Template_Master.pptx`: dark slide master with forty layouts to duplicate, from title, agenda and section dividers to KPI dashboards, roadmaps, timelines, pricing, funnels, progress bars, before and after, testimonials and a metric with trend. Save As to `.potx` to add it to the PowerPoint template picker.
- `Brand_Template_Kit.docx`: light document template with real named styles and copy-ready blocks. Import it into a Wiki page for a head start.
- `Brand_Template_Kit.xlsx`: a twelve-sheet workbook (start index, palette, type and spacing, table gallery, KPI dashboard, tracker, roadmap, budget, chart lab, scorecard, calendar heatmap, kanban board) with live formulas, dropdowns, conditional formatting and native charts. Imports into Lark Sheets.
- `Lark_Conventions.md`: block-by-block mapping for Lark Wiki, Sheets and Slides, plus a paste-ready page.

**03_examples**: the system in use, not as a spec.
- `Example_Doc_In_Use.docx`: a filled one-page playbook.
- `Example_Sheet_In_Use.xlsx`: a filled tracker with status tags and live counts.
- `A_Single_Place_For_Everything.pptx`: a full slide deck running the dark edition.

**04_tokens**: the system in code.
- `tokens.json`: both editions plus type, spacing, motif and roles.
- `tokens.css`: CSS custom properties (light default, dark prefixed `--d-`).
- `tokens.scss`: SCSS variables.
- `tokens.ts`: typed export for React and other JS or TS work.
- `tailwind.config.js`: a `theme.extend` block: `bg-pink`, `text-cyan-deep`, `rounded-card` and so on.

**05_reference**
- `Component_Library.html`: open in any browser. Toggle light and dark to see the tokens remap; click a swatch to copy its hex.

---

## The rules in one breath

Let the canvas dominate. Pink is the one loud accent, cyan the quiet one. One statement, one key callout and one chip rhythm per page. Numbered chips alternate pink and cyan. Keep body text in Ink on light, White on dark, and use the deep accent variants for any coloured text on white. No dark backgrounds in documents, no edge stripes, no heading underlines, no more than two accents.

---

## A note on the font

The brand font is **Calibri**, which every Office and Lark surface has. On the web there is no guaranteed Calibri, so the code tokens fall back to `system-ui, Arial, sans-serif`. That is intentional and on-brand; do not swap in a different display face.

---

## Keeping it consistent

Reuse the templates and components rather than restyling from scratch. When you add a new component, define it in the design language first, then add it to the component library, so the spec and the reference never drift apart. Bump the version in `CHANGELOG.md` whenever a token or rule changes.
