# Changelog

All notable changes to the Signal Design System are recorded here. Versions follow major.minor.

## 2.0

A major expansion of the Office and Workspace surfaces. Web and tokens unchanged.

Added
- Presentation master grown from eleven to forty layouts: section divider, agenda, KPI dashboard, big number, quote, quadrant matrix, process flow, feature grid, three-column comparison, timeline, quarter roadmap, team grid, pricing tiers, image and text, two-column text, data table, callout highlight, thank-you and contact, executive summary, funnel, progress bars, before and after, testimonial trio, metric with trend and key term, and more.
- Excel rebuilt as a twelve-sheet workbook: Start index, Palette, Type and Spacing, Table Gallery, a KPI Dashboard with in-cell bars, a Tracker with dropdowns and conditional formatting, a Roadmap with duration bars, a Budget with variance colouring, a Chart Lab with native brand-coloured charts, a Scorecard with in-cell progress bars and automatic status, a Calendar heatmap, and a Kanban board.
- Word template gained two new sections: advanced blocks (metric row, quote, checklist, comparison table) and page patterns (context callout, status tags, definition list, two-column text, feature grid).
- Workspace conventions extended to cover Workspace Base, plus a components-at-a-glance table across all four Workspace surfaces.
- `CONTRIBUTING.md`: how to add or change a component without breaking consistency.

Changed
- Version bumped across the spec, workbook and index.

## 1.0

First complete release. The system is ready to use across every surface.

Added
- Design language spec (PDF and DOCX) with a front-page coverage map of all 22 parameters.
- One-page cheat sheet (PDF, landscape).
- Presentation master (PPTX): cover, tokens, and eleven layout archetypes.
- Document template (DOCX) with named styles and copy-ready blocks.
- Spreadsheet template (XLSX): palette, table style and themed tracker with live formulas.
- Workspace conventions (Markdown) for Wiki, Sheets and Slides, plus a paste-ready page.
- Filled examples for the document, sheet and slide surfaces.
- Tokens in five code formats: JSON, CSS, SCSS, TypeScript and a Tailwind theme extension.
- Live component library (HTML) with a light and dark toggle and click-to-copy swatches.

Defined
- Two editions, light and dark, sharing one palette and one motif.
- Full colour, type, spacing, motif and component specifications.
- Per-surface application rules, including the stated manual path for Workspace Slides.

Known limits
- The numbered chip renders as a filled square in Word and Excel, round only on slides and on the web.
- Workspace Slides has no theme import, so it is built by hand from the PPTX master.
- Web surfaces fall back from Calibri to a system sans by design.
