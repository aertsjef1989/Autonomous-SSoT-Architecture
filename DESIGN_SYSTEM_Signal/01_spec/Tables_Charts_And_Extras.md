# Tables, segmented charts, and what else went in

## Table

A real table object: **▦** in the toolbar.

| Control | What it does |
|---|---|
| **Cells** | one big text box, tab separated, one row per line. **Paste straight out of a spreadsheet and it lands.** |
| + row / − row / + col / − col | structure |
| Column alignment | one letter per column: `l`, `c`, `r`. So `lrr` = label left, numbers right. |
| **Key cells** | `row,col; row,col`. Those cells print bold in the deep accent. This is DESIGN.md's rule: the value that matters is the one you colour. |
| Accent column | a whole column in the second accent |
| header / banding | on by default |
| row rules / column rules | independently switchable |
| Header fill, plate fill, font size | any theme role |

On **PPTX export it becomes a native PowerPoint table**, editable in PowerPoint, not a picture.

## Segmented chart

One object, five shapes: **◱** in the toolbar.

- **stackbar**: a single stacked bar, percentages inside, labels under
- **donut**: a ring, with an optional big number in the middle
- **bars**: labelled progress rows against the largest value
- **funnel**: tapering stages, adjustable taper
- **waffle**: a 10x10 grid, one cell per percent

Each **segment** has its own label, value and theme role, added and removed one at a time. Plus gap, label size, ring thickness, show values, show labels, and **sort** (biggest first).

Change the shape and the same data redraws as a donut, a funnel or a waffle. That is the point: pick the shape that argues best, without re-entering anything.

## Bigger controls

A **UI** switch in the header: S, M, **L**, XL. It scales every label, slider, dropdown and button in both panels, and the panel width with them. Sliders are now a 7px track with a 17px thumb at base size, up to 25px at XL. The setting is remembered.

## What else went in

| Feature | |
|---|---|
| **Smart guides** | Drag an object and it snaps to the edges and centres of every other object, and to the slide's own axes. A cyan dashed line shows what it locked onto. |
| **Speaker notes** | Per slide, and they travel into the PPTX as real notes. |
| **Present mode** | Full screen. Arrow keys, space, or click to advance. Esc to leave. |
| **PNG / SVG export** | The current slide, on its own, at 2752px. For a Slack message or a doc. |
| **Autosave** | Every 8 seconds to browser storage, and on close. It offers to restore on the next open. Large videos will not fit the storage quota; the deck still saves, so keep using Save for anything that matters. |
| Native PPTX tables | see above |

## Worth adding next, if you want them

- **Find and replace** across the whole deck
- **Grouping**, so a card and its contents move as one
- **A chart from a pasted CSV**, the way the table takes a paste
- **Deck-level text styles**, so changing "title" changes all forty
- **A contact sheet** export: all slides as one PNG grid, for review
