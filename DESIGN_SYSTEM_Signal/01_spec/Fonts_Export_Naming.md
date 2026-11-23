# Fonts, PDF, the add-ons, and what things are called now

## Fonts

Eleven families, loaded as web fonts so they render on the canvas exactly as they will export.

Carlito, Inter, Manrope, Space Grotesk, Archivo, IBM Plex Sans, IBM Plex Mono, Roboto Mono, Playfair Display, Georgia, System.

**Carlito stays the default** because it is metric-compatible with Calibri, which is the font your Office and slide editions use. Swap it and nothing reflows.

Three levels, each overriding the one above:

1. **Deck default** (DECK TYPOGRAPHY panel) plus **apply to every text object** if you want it retrofitted.
2. **Text style** (title, eyebrow, body, caption).
3. **The object itself**, in its own Font dropdown.

On PPTX export each object carries its real font name, so PowerPoint gets Space Grotesk, not a substitute.

## Deck text styles

Tag a text object with a style, then edit the style once and **every tagged object on every slide follows**. Size, weight, colour and font per style. This is the thing that makes a forty slide deck survive a change of mind.

## PDF

**PDF** button: the whole deck, landscape, at the true 13.3 x 7.5in page size, one slide per page, rendered at 2752px. Videos become their still frame.

## Contact sheet

**Sheet** button: every slide as one PNG grid, numbered. For review, for a Slack thread, for pinning next to your screen.

## The other add-ons, all in

| | |
|---|---|
| **Find and replace** | Across the whole deck: text, tables, chart labels, callouts, pills, buttons, and speaker notes. Count first, then replace. |
| **Grouping** | Ctrl+G groups a selection, Ctrl+Shift+G ungroups. Clicking any member selects the group; alt-click to reach one member inside it. |
| **Chart from pasted data** | Paste "label, value" lines and the segments build themselves, with roles assigned in order. |
| **Deck text styles** | above |
| **Contact sheet** | above |

## Renamed, so the names say what the things are

The internal type never changed, so old projects still open. Only the labels.

| Was | Is now |
|---|---|
| rect | **Box** |
| card | **Panel** |
| chip | **Number badge** |
| mark | **Signature dots** |
| tag | **Status pill** |
| line | **Connector** |
| motif | **Circuit graphic** |
| device | **Hero illustration** |
| chart | **Data graphic** |
| image | **Picture** |

The properties panel now leads with the name of the thing you have selected, in the panel header, rather than the internal type.
