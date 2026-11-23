# The 40 master layouts, ported

Your `Brand_Template_Master.pptx` held 40 layouts. I had copied the file into the package but never ported them. They are now in the app.

## The design, not just the geometry

My first port carried the shapes but dressed them in **my** chrome: the drafting grid and the corner circuitry. That is my deck language, not your original's. Three things were missing, and all three are now in.

**1. The glow backgrounds.** The original slides carry a background image: near-black with two soft radial blooms. I measured all four variants and reproduced them procedurally, from the theme's own accents, so they re-skin instead of being a baked raster.

| Variant | Slides | Pink bloom | Cyan bloom |
|---|---|---|---|
| hero | 1, 39, 40 | 19%, 73% | 85%, 21% |
| statement | 3, 8, 9, 19, 38 | 30%, 41% | 76%, 67% |
| plain | the other 32 | one faint wash | |

Rendered and sampled back: pink `#881939` against the original's `#821837`, cyan `#167575` against `#146262`. Close enough to be the same design.

**2. No drafting grid, no corner circuitry.** Those 40 layouts now render on the clean canvas they were drawn on.

**3. The soft drop shadow.** The original puts an `outerShdw` on **127 of its 727 shapes**: black, 35% alpha, 8px blur, 3px down. All 127 are back, on 30 of the 40 layouts. It is a theme property, so the deck editions (Blueprint, Circuit) correctly suppress it while Console and Light Screen carry it.

## How they were ported

Not redrawn. **Extracted shape by shape from the actual file**: 727 shapes across 40 slides, with their real geometry, fills, strokes, text, font sizes, weights and alignment.

- The original canvas is 10 x 5.625in. Everything was scaled to 13.3 x 7.5, uniformly, at 1.333x. Font sizes scaled with it, so the layouts look the same, only larger.
- **Every colour was mapped back to a theme role.** The original's `#F0245C` became `accent1`, `#21E0DC` became `accent2`, `#0B0C10` became `ground`, and so on. That is why the 40 layouts now work in *all five themes*, not just the dark one they were drawn in.
- Ovals with an accent fill sitting under a one or two character label were merged back into **numbered chips**, so they behave as components rather than as loose shapes.

## The 40

| | | | |
|---|---|---|---|
| 01 Master index | 11 Feature grid | 21 Testimonial trio | 31 Team |
| 02 Design tokens | 12 Bulleted list | 22 Metric with trend | 32 Matrix 2x2 |
| 03 Section divider | 13 Split concept | 23 Timeline | 33 Callout row |
| 04 Agenda | 14 Icon feature row | 24 Roadmap | 34 Numbered steps |
| 05 Key metrics | 15 Before and after | 25 Image and text | 35 KPI tiles |
| 06 Card grid | 16 Comparison table | 26 Full bleed statement | 36 Table |
| 07 Two column | 17 Process steps | 27 Dense dashboard | 37 Two panel |
| 08 Statement | 18 Funnel | 28 Three pillars | 38 Key term |
| 09 Big percentage | 19 Progress bars | 29 Executive summary | 39 Thank you |
| 10 Quote | 20 Do and avoid | 30 Stat block | 40 Closing / CTA |

Pick **Master 40** in the template group dropdown.

## Verification

- All 40 build, in all 5 themes: **zero render failures, zero empty layouts**.
- 120 renders audited for colour: **every drawn colour is a theme role, zero leaks.** The only hexes appearing in the output are on layout 02, which is the token swatch slide and is *supposed* to print them as labels.
- Driven in a real browser DOM: 120 template-and-theme clicks, **no runtime errors**.

## The app now

**92 templates** in nine groups: Open, Content, Data, Persuade, Signal, Close, Circuit, Blueprint, and the Master 40. Plus 56 devices, 13 motifs, 5 themes.
