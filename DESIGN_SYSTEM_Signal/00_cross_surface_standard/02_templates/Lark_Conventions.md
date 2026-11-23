# Lark conventions: all surfaces

Lark does not accept a theme or template file on any surface, so consistency comes from applying the same block and formatting choices every time. This file gives the exact mapping for **Wiki / Docs**, **Sheets** and **Slides**, plus a paste-ready Wiki page at the end.

Reach for the palette below on every surface.

| Token | Hex | Role |
|---|---|---|
| Page | `#FFFFFF` | Background (docs and sheets). |
| Surface | `#F5F6F8` | Banding, subtle panels. |
| Ink | `#14161C` | Primary text and table headers. |
| Muted | `#5B6270` | Secondary text, notes. |
| Hairline | `#E1E4EA` | Borders and dividers. |
| Pink | `#F0245C` | Primary accent. |
| Pink deep | `#C71048` | Pink as text on white. |
| Cyan | `#21E0DC` | Secondary accent. |
| Cyan deep | `#0E8A86` | Cyan as text on white. |
| Pink tint | `#FDE7EE` | Key-point callout fill. |
| Cyan tint | `#E4FAF9` | Tip / note callout fill. |
| Background (slides) | `#0B0C10` | Near-black slide canvas. |

Font: use the platform default sans, or **Calibri** where a font can be set, to match the Word and slide editions.

---

## 1  Wiki and Docs

Fastest start: import `Brand_Template_Kit.docx` as a new Wiki page, then swap the boxed callouts for native callout blocks below.

| Brand element | Lark block | How to apply |
|---|---|---|
| Eyebrow | Small text | Caps, coloured **Cyan deep**, above the title. |
| Page title | Heading 1 | One per page, text Ink. |
| Section | Heading 2 | Colour the leading number **Pink** for the chip feel. |
| Sub-section | Heading 3 | Ink, bold. |
| Body | Text | Ink, left-aligned. Never colour whole paragraphs. |
| Key point | Callout, red / pink background | Bold **Pink deep** label, then the point. One per section. |
| Tip / note | Callout, blue / teal background | Bold **Cyan deep** label, then the note. |
| Context | Callout, grey background | Caveats and neutral background. |
| Numbered steps | Numbered list | Start each item with a bold **Pink** or **Cyan deep** number, alternating. |
| Divider | Divider block | Between major sections. |
| Table | Table | Header row filled **Ink** with white text; band alternate rows **Surface**; key value in **Pink deep** bold. |
| Statement | Quote, centred | A single big idea that deserves a pause. |

---

## 2  Lark Sheets

Import `Brand_Template_Kit.xlsx` straight into Lark Sheets. Fills, fonts and borders carry over, so the Palette, Table Style and Tracker arrive already themed. To build from scratch or extend:

| Element | How to apply in Sheets |
|---|---|
| Header row | Fill **Ink** `#14161C`, text White, bold, Calibri. |
| Body rows | White, with alternate rows filled **Surface** `#F5F6F8` for banding. |
| Borders | Thin, **Hairline** `#E1E4EA`, all cells. |
| Key value | Text **Pink deep** `#C71048`, bold, for the number that matters. |
| Totals | Formula cells (`SUM`, `COUNTIF`), header-style fill, total in **Cyan** or White. |
| Status column | Use conditional formatting: On track to **Cyan tint** fill with **Cyan deep** text, At risk to **Pink tint** with **Pink deep**, Done to **Surface** with **Muted**. |
| Freeze | Freeze the header row so it stays visible while scrolling. |

Keep sheets on a white background. Do not use the dark edition in Sheets.

---

## 3  Lark Slides

Lark Slides has no theme import and will not ingest a `.pptx` cleanly, so this surface is built by hand. Treat `Brand_Template_Master.pptx` as the picture to copy. Steps:

1. Set the slide background to **Background** `#0B0C10` on every slide.
2. Text is White for primary, **Mist** `#B9C0CE` for secondary.
3. Cards and panels: rounded rectangles filled **Card** `#15171F` with a thin `#2A2E3A` outline.
4. Motif: a filled circle in **Pink** `#F0245C` or **Cyan** `#21E0DC` with a white (or near-black on cyan) bold number, alternated down a list.
5. Accents: **Pink** as the loud accent, **Cyan** as the quiet one. Use the pink and cyan glow only as decoration behind title and closing slides.
6. Rebuild the layouts you need from the master: title, card grid, split, statement, two panels, two-by-two grid, flow, three-step, comparison, three-phase, closing.

| Element | Lark Slides equivalent |
|---|---|
| Background | Slide background colour `#0B0C10`. |
| Card | Rounded rectangle, fill `#15171F`, outline `#2A2E3A`. |
| Chip | Circle, fill Pink or Cyan, white bold number. |
| Title | Text box, Calibri bold, White. |
| Eyebrow | Small caps text, **Cyan** `#21E0DC`, letter-spaced. |
| Accent bar / stat | Rounded rectangle filled **Pink** `#F0245C`, white text. |

---

## 4  Lark Base

Lark Base is a database, so the styling lives in field setup and views rather than cell fills. Apply the palette through single-select option colours and view design.

| Element | How to apply in Base |
|---|---|
| Status field | Single select. Name options On track, At risk, Done, and colour them so On track reads teal or green, At risk reads red or pink, Done reads grey. This mirrors the tag colours everywhere else. |
| Priority field | Single select: High, Medium, Low. Give High the red or pink swatch, Low a grey one. |
| Progress field | Number or percent field, shown as a progress bar in the view. |
| Owner field | Person field, so avatars carry the chip feel. |
| Grid view | Keep it clean: hide unused fields, freeze the primary column, and group by Status so the coloured options band the rows. |
| Kanban view | Group by Status. The single-select colours become the column headers, which lands the palette without any manual styling. |
| Dashboard blocks | Use the bar and donut widgets. Where a colour can be set, use pink for the primary series and cyan or teal for the secondary. |
| Field names | Plain, human names: Owner, Due, Status, Note. Never expose internal or system names. |

Keep one status vocabulary across Base, Sheets and the trackers so a reader learns the colours once. Do not invent new status words per table.

---

## Components at a glance

The same components, named consistently across every Lark surface, so people recognise them wherever they appear.

| Component | Wiki / Docs | Sheets | Base | Slides |
|---|---|---|---|---|
| Key point | Pink callout block | Pink-tint cell | High-priority flag | Pink accent card |
| Tip / note | Teal callout block | Cyan-tint cell | Note field | Cyan accent card |
| Status | Coloured text | Conditional format | Single-select colour | Coloured chip |
| Steps | Numbered list | Numbered rows | Ordered records | Numbered chips |
| Metric | Bold coloured number | KPI cell | Dashboard number | KPI tile |
| Table | Table block | Styled range | Grid view | Table slide |

---

## Paste-ready Wiki page

> Copy everything below the line into a blank Wiki page, then apply the Wiki mapping above. Replace every bracket.

---

`CYAN DEEP, CAPS →` SECTION LABEL

# Page title goes here

A one-line summary of what this page is and who it is for.

## 1  Overview

Body text. Lead with the point, then support it. One idea per paragraph.

> **KEY POINT**: the single thing a reader must not miss.
> *(Pink / red callout block.)*

## 2  Context

Body text describing background or the current state.

> **TIP / NOTE**: a shortcut, caveat or helpful aside.
> *(Blue / teal callout block.)*

## 3  How it works

**1.** First step. *(number in Pink)*
**2.** Second step. *(number in Cyan deep)*
**3.** Third step. *(alternate down the list)*

## 4  Reference

| Item | Owner | Status | Note |
|---|---|---|---|
| [item] | [name] | [status] | [note] |
| [item] | [name] | [status] | [note] |

*(Header row Ink fill, white text. Band alternate rows Surface. Status value Pink deep bold if it needs attention.)*

---

> Drop a single big idea here, centred, when the page deserves a closing pause.
> *(Centred quote block.)*
