# Circuit spec: what I verified, and what I changed

You gave me a slide-by-slide vector spec of the dark deck. I checked it against my Console theme and against the two Signal-to-Scale analysis files. Here is what held up and what did not.

## The colour conflict

Three sources, three answers.

| Source | Cyan | Magenta | Ground |
|---|---|---|---|
| Your pasted spec | 00FFFF | FF0055 | 000000 |
| The Signal-to-Scale analysis files | 25F4EE | FE2C55 | 000000 |
| My Console theme | 21E0DC | F0245C | 0B0C10 |

The middle row is the measured truth from the source deck. It is also, exactly, a well known platform's brand palette. Your standing rule is that no deliverable carries that brand, so I did not adopt those hexes and I would advise against it. The pure 00FFFF and FF0055 in your spec look like an eyeball reading of the same colours.

**Decision: the accents stay brand-neutral.** 21E0DC and F0245C sit close enough to read as the same system while belonging to you rather than to someone else.

## The geometry: your spec was better than mine, and I took all of it

Everything below is now in the app as the **Circuit** theme.

| Rule from your spec | What I had | What it is now |
|---|---|---|
| Ground 000000, pure black | 0B0C10 near-black | 000000 in Circuit. Console keeps 0B0C10. |
| Grid: 1px white, 3 percent opacity, 50px squares | 24px grid at full opacity | Circuit grid is 50px white at 3 percent. |
| Corners: 45 degree chamfered cuts, never rounded | radius 6 rounded | Circuit chamfers every rect, card and chip. |
| Routing: orthogonal only, 45 or 90 degree turns | free diagonals | Circuit routes every diagonal line as an elbow. |
| Terminals: 4px hollow circles, 2px stroke | plain line ends | Circuit terminates lines in hollow circles. |
| Mid-grey 808080 | 7A828F | 808080 in Circuit. |

Switch the theme and all of it changes at once, because the geometry is a property of the theme, not of the object.

## The motifs, now first-class objects

Your spec named specific machines. Six of them are now insertable objects with their own controls, and they re-skin with the theme like everything else.

| Motif | From your spec | Controls |
|---|---|---|
| Hex pathway | Slide 3: parallel hexagonal pathways, 8px accent border, 7 internal 1px traces | trace count |
| Split ring | Slide 3: 180 degree cyan arc, 180 degree magenta arc, solid inner ring | accents |
| Hex nest | Slide 3: 3 concentric hex wireframes, padlock, chevrons | accents |
| Iso platform | Slide 9: isometric platform, glowing base, locked or open padlock | lock state |
| Gauge | Slide 10: circular dial, perimeter ticks, needle, digital readout | needle position |
| Fader track | Slide 11: fader with dense trace background and a 3D knob | level |

Four new templates use them: Hex pathways, Locked platforms, Gauges, Fader tracks.

## What I did not take

Slide-specific one-offs (the static/noise overlay on slide 6, the `_ □ x` window chrome on slide 2) are decoration tied to one slide rather than system rules. They are trivial to draw by hand in the editor with the shape tools if you want them on a specific slide.

---

# Part 2: the Blueprint spec

You then gave me the light deck's vector spec. This one I could settle with pixels, because I have the source deck.

## Colours: I measured, and neither of us was right

Modal pixel value per hue family across all sixteen slide images. The modal value is the colour as actually drawn, not the anti-aliased average.

| | Measured | My token | Your spec |
|---|---|---|---|
| Navy | **273D55** | 203048, off by 19.7 | 1B365D, off by 16.0 |
| Green | **1F8C62** | 188860, off by 8.3 | 00875A, off by 32.4 |
| Orange | **F2722B** | F07028, off by 4.1 | F57C00, off by 44.2 |
| Paper | **F3F3EB** | F5F4EF, off by 4.6 | F9F9F9, off by 16.4 |

Your spec was closer on navy. Mine was closer on green, orange and paper. **Neither was right, so the Blueprint theme now carries the measured values.** No more guessing on either side.

The red is the one I could not pin down: the crimson arrows are thin outlines and every sample is contaminated by the paper behind them. The modal came out as DA9B96, which is clearly an edge pixel, not the ink. I kept C0504A. If you want D32F2F it is one line to change.

## Geometry: your spec beat mine again, and I took all of it

The Blueprint theme now has:

- **45 degree chamfered corners** on every rectangle, card and chip. No rounded corners anywhere.
- **Double borders**: 2px outer, 1px inner inset at 75 percent opacity, exactly as specified.
- **Orthogonal routing**: every diagonal line becomes a 90 degree elbow.
- **4px hollow circle terminals** on line ends.
- **25px drafting grid**, driven by the theme rather than by the slide.

The previous, softer reading is preserved as **Blueprint (soft)** so nothing is lost.

## Seven new motifs, straight from your slides

| Motif | From | Controls |
|---|---|---|
| Vault | Slide 7: five nodes with lit centres, concentric rings, five heavy arrows clockwise, hex core | accents |
| Layer stack | Slide 4: three isometric hex planes, dashed connectors | layer count |
| Gear cross | Slide 5: four double-ringed nodes in a diamond around a central gear | accents |
| Shield | Slide 10: three concentric shields, hex core, radiating circuit traces | accents |
| Chevron | Slide 14: heavy chevron connector, navy border, green fill | accents |
| Badge pill | Slide 9: chamfered pill with a green accent line and an icon | accents |
| Gantt chevrons | Slide 11: cascading chevron bars on a column grid, orthogonal connectors | bars, columns |

Seven new templates use them: The vault, Layer stack, Governed loop, Shield and controls, Gantt chevrons, Badge table, Three stages.

## Where the app stands

**5 themes** (Console, Circuit, Blueprint, Blueprint soft, Light Screen), **52 templates**, **13 motifs**, **56 devices**. 260 renders audited: zero off-palette colours.
