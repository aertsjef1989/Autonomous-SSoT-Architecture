# Signal Design System

A single-file design system for import. Dark, high-contrast, technical but friendly. A near-black canvas with one loud pink accent and one quiet cyan accent. Two editions share one palette and one motif: a dark edition (default, for apps and slides) and a light edition (for documents and sheets). White or near-black always dominates; the accents stay rare and deliberate.

Scaffold this as the project's design system: read the tokens, build the components, and keep every new screen on these tokens.

## 1. Personality

Disciplined and confident, never loud for its own sake. The signature is a numbered chip in pink or cyan, alternated down a list, plus a two-dot pink and cyan mark. Pink is the single loud accent; cyan is the quiet one; they are never swapped. One statement, one key callout and one chip rhythm per screen.

## 2. Color tokens

### Dark edition (default)

| Token | Hex | Role |
|---|---|---|
| bg | #0B0C10 | App background |
| surface | #15171F | Cards, panels |
| surfaceDeep | #1E2230 | Raised or emphasised panels |
| border | #2A2E3A | Hairlines, card outlines |
| text | #FFFFFF | Primary text |
| textMuted | #B9C0CE | Secondary text |
| textFaint | #7A828F | Tertiary text, placeholders |
| accentPrimary | #F0245C | Pink, primary accent |
| accentPrimarySoft | #FF5C86 | Pink highlight, glow |
| accentSecondary | #21E0DC | Cyan, secondary accent |
| accentSecondarySoft | #7BF0EE | Cyan highlight, glow |

### Light edition

| Token | Hex | Role |
|---|---|---|
| bg | #FFFFFF | Page background |
| surface | #F5F6F8 | Cards, row banding |
| text | #14161C | Primary text |
| textMuted | #5B6270 | Secondary text |
| border | #E1E4EA | Hairlines |
| pink | #F0245C | Primary accent fill |
| pinkText | #C71048 | Pink as text or links on white |
| cyan | #21E0DC | Secondary accent fill |
| cyanText | #0E8A86 | Cyan as text or icons on white |
| pinkTint | #FDE7EE | Key-point callout background |
| cyanTint | #E4FAF9 | Tip callout background |

### Semantic mapping

Primary action uses pink. Secondary action uses cyan. Positive or on-track status uses cyan. Attention or at-risk status uses pink. For coloured text on a white background, always use the deep variants (pinkText, cyanText), never the raw pink or cyan. Body text is never pink or cyan.

## 3. Typography

Font family: Carlito, loaded from Google Fonts. Carlito is metric-compatible with Calibri, which is the brand font used in the Office and slide editions. Fallback stack: `"Carlito", "Calibri", system-ui, Arial, sans-serif`.

Hierarchy comes from size and weight, never from switching family or colouring text.

| Role | Size | Weight | Notes |
|---|---|---|---|
| Display | 38px | 700 | Hero and cover titles |
| Title | 32px | 700 | Page title |
| H1 | 24px | 700 | Section |
| H2 | 18px | 700 | Sub-section |
| H3 | 15px | 700 | Minor heading |
| Body | 15px | 400 | line-height 1.5 |
| Small | 13px | 400 | Captions, helper text |
| Eyebrow | 11px | 700 | UPPERCASE, letter-spacing 0.18em, in cyanText |

## 4. Spacing, radius, elevation

Base unit 4px. Spacing scale: 4, 8, 12, 16, 20, 32. Card padding 16. Gap between cards 20. Section gap 32.

Radius: 8px for cards, inputs, buttons and tags. Full pill (9999px) for the numbered chips and status tags.

Elevation: cards carry a subtle shadow only. Dark edition `0 1px 2px rgba(0,0,0,0.3)`, light edition `0 1px 2px rgba(0,0,0,0.06)`. No heavy drop shadows.

Layout: a 12-column grid with generous gutters. Common splits are halves, thirds and a 2 by 3 card grid. Never let content touch the edge.

## 5. Components

Build each of these and reference them by name in later prompts.

- **Button, primary**: pink background, white text, radius 8, padding 10px 18px, weight 700. Hover uses pinkSoft.
- **Button, secondary**: transparent background, 1px border in border colour, text in pinkText (light) or white (dark).
- **Card**: surface background, 1px border, radius 8, padding 16, subtle shadow.
- **Numbered chip (signature)**: a 30px circle filled pink or cyan with a bold number, white on pink and near-black on cyan. Alternate pink and cyan down a list.
- **Callout, key point**: light uses pinkTint background with a pink border; dark uses surfaceDeep with a pink left marker. Label in pinkText, uppercase. One per section.
- **Callout, tip**: cyanTint background (dark: surfaceDeep), cyan border, label in cyanText.
- **Callout, context**: neutral surface background, no accent, for caveats.
- **Table**: header row in near-black (#14161C) with white bold text; body rows white with surface banding on alternate rows; the value that matters set in pinkText bold.
- **Status tag**: a pill. On track uses cyanTint with cyanText. At risk uses pinkTint with pinkText. Done uses surface with textMuted.
- **Statement block**: large centred bold text on a surface background with generous padding, for a single big idea.
- **Eyebrow**: a small uppercase cyanText label directly above a title.
- **Divider**: a 1px hairline in the border colour.

## 6. Layout patterns

Cover or hero with the two-dot pink and cyan mark and an eyebrow above the title. Card grids in two, three or four columns. Split concept with text on one side and a visual on the other. KPI tiles in a row. Two-panel comparison. Centred statement. Before and after. Funnel. Horizontal progress bars.

## 7. Motion

Restrained. 200ms ease transitions on hover and on theme switch. Respect prefers-reduced-motion. At most one orchestrated reveal per screen; scattered effects read as generic.

## 8. Do and avoid

Do: let the canvas dominate, use pink as the one loud accent and cyan as the quiet one, keep one statement and one key callout and one chip rhythm per screen, and use the deep accent variants for any coloured text on white.

Avoid: dark backgrounds in the light edition, accent stripes or coloured bars down an edge, underlines beneath headings, body text in pink or cyan, more than two accent colours on one screen, and mixing icon styles.

## 9. Signature

The numbered pink and cyan chip and the two-dot mark. Near-black plus pink plus cyan. That combination is the identity; keep it present and keep everything else quiet.
