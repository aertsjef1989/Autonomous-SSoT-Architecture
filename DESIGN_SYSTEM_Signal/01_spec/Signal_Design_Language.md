# Signal Design Language

The complete system. Tokens, type, spacing, components, all 18 slide layouts, and the rules that decide when each one is right.

Formatting note: written in the subset Google Docs converts cleanly. No fenced code blocks, no blockquotes, no rules, no angle brackets, no backticks. Import via Drive, Settings, tick "Convert uploaded files to Google Docs editor format", then upload.

## The one sentence

Signal is a brand-neutral engineering-drawing system in two editions that share one grammar. Light is the blueprint: navy ink on bone paper. Dark is the console: neon on near-black. Every slide argues one thing, carries one machine that encodes the logic of the argument, and closes with one line the room repeats afterwards.

---

# 1. Tokens

## Light edition, the blueprint

| Token | Value | Role |
|---|---|---|
| PAPER | F5F4EF | Bone, warm. Never pure white. |
| PANEL | FFFFFF | Card fill. Sits brighter than the paper. |
| SIDEBAR | C5CCD2 | The governed register column |
| GRID | E2E4E1 | The 24px drafting grid, always on |
| INK | 203048 | Deep navy. Every contour and all type. |
| MIST | 8A939E | Body copy, secondary detail |
| FAINT | B6BDC5 | Dead, legacy, the old way |
| HATCH | DCE0E3 | 45 degree shading at 9px |
| EMERALD | 188860 | Value, the governed path, the win |
| ORANGE | F07028 | Heat, escalation, urgency |
| ROSE | C0504A | Loss, leaks, the thing that is bleeding |

## Dark edition, the console

| Token | Value | Role |
|---|---|---|
| GROUND | 0B0C10 | Near-black |
| PANEL | 15171F | Card |
| SIDEBAR | 1E2230 | Register column |
| GRID | 1A1D26 | Same grid, barely there |
| WHITE | FFFFFF | Primary line |
| MIST | B9C0CE | Secondary |
| FAINT | 7A828F | Dead. Never glows. |
| HATCH | 2A2E3A | Shading |
| CYAN | 21E0DC | The quiet accent |
| PINK | F0245C | The single loud accent, stays rare |
| ORANGE | FF7A3D | Escalation |

Glow is dark-edition only, on cyan and pink strokes: a drop-shadow at 4px then 10px at 60 percent. Grey never glows. That is how "dead" reads without a label.

## Type

Calibri in Office. Carlito on the web, from Google Fonts. They are metric-compatible, so a deck moves between them without reflowing.

| Role | Size | Weight |
|---|---|---|
| Cover title | 46 to 56 | Bold |
| Slide title | 27 to 34 | Bold |
| Section numeral | 150 | Bold, in GRID colour, as a watermark |
| Card head | 14 to 15 | Bold |
| Body | 12.5 to 13.5 | Regular |
| Eyebrow | 9.5 to 11 | Bold, caps, 2.2 tracking |
| Verdict bar | 17 to 24 | Bold, centred |

Sentence case everywhere except the eyebrow. Left-align body copy. Centre only titles and the verdict bar.

## Spacing

Base 4. Card radius 6. Slide margin 0.46 inches. Card gutter 0.3 inches. Canvas 13.3 by 7.5 inches, which is 1376 by 768 pixels in the renderer.

---

# 2. The eight grammar rules

1. **Cyan to pink encodes progression.** Left to right, low to high, early to late, foundation to value. Never reversed.
2. **Pink is the single loud accent and stays rare. Cyan is the quiet one.** They are never swapped.
3. **Faint grey means dead, and never glows.** In the light edition the same job is done by hatching plus a dashed contour.
4. **Solid fill is reserved** for chips, giant numerals and header bands. Everything structural is stroke.
5. **Never an edge stripe. Never an underline beneath a heading. Never a circular icon holder.** Icons sit in squares or hexagons.
6. **Depth comes from texture, never from shadow.** Hatch density, stroke weight, grey ramps. No drop shadows in either edition.
7. **One hero device per slide.** Two competing metaphors is two slides.
8. **The verdict bar is the argument, not a summary.** If you cannot write it, the slide has no argument and should be cut.

---

# 3. The composition law

Measured from real decks, not invented.

1. **Fill the frame.** Target 25 to 40 percent ink coverage. Below 20 percent a slide reads as unfinished.
2. **The grid is always on.** 24px, under everything, on native and artwork slides alike. It is most of why the deck looks like one deck.
3. **Circuit traces bleed in from all four corners,** terminating in pads. This is the signature texture.
4. **Every claim sits in a card with corner brackets.** Not floating text.
5. **Callouts connect to what they describe** with a dashed leader line ending in a dot.
6. **Shading is tonal.** Ten to fourteen distinct levels, produced by layering hatch densities and edge lighting. That is what separates an illustration from a diagram.

---

# 4. Components

| Component | What it is | Where it appears |
|---|---|---|
| Eyebrow | A filled square, a short rule, caps text in the accent. Sits ABOVE the title, never under it. | Every slide except the cover |
| Card | Rounded rect, radius 6, with corner brackets clipped at 45 degrees | Everywhere |
| Numbered chip | Small filled square holding a numeral, alternating accents down a set | Callouts, agenda, cards |
| Leader line | Dashed, one right-angle jog, ending in a filled dot on the thing it names | Callouts, escalation |
| Verdict bar | Full-width dark bar, one bold sentence centred, optional subtitle | The close of most slides |
| Register column | Grey-blue sidebar with a dark header and edge-tabbed rows | map-sidebar |
| Dead panel | Hatched header, grey strokes, crossed bullets, no glow | compare, decision |
| Hero device | One of 56 machines that encode the logic of the message | Artwork slides |
| Ghost numeral | A giant section number in the GRID colour, behind everything | std-section |

---

# 5. The 56 hero devices

Each device encodes one logic. Name the logic of the message and the machine is already decided. The full list, with a nano banana prompt and a Claude Design recipe for each, is in the device library document. The short version of the generator:

| The logic | The machine |
|---|---|
| It leaks | Cracked vessel, dripping, pooling |
| It is bottlenecked | Choke point, jammed traces |
| It compounds | Flywheel, ratchet, spiral |
| It is governed | Closed control loop, control ring |
| It escalates | Rising tiers, beacons, warning triangles |
| It is a single point of failure | Keystone in an arch |
| Most of it is hidden | Iceberg, submerged machinery |
| It can be stopped | Kill switch, breaker |
| It is opaque | Black box beside a glass box |
| The decision is one act | Throw-lever in a slotted gate |

To invent a device: write the sentence the slide must prove, underline the verb, and find the machine that does that verb. If no machine does it, you are making an argument you cannot support.

---

# 6. The 18 layouts

## Artwork layouts (8): rendered as images, richly shaded

| Layout | It says |
|---|---|
| cover | Here is the one idea |
| hero-callouts | Here is the machine, and here are the three parts of it that cost you money |
| compare | The old way versus the governed way |
| metrics | Here is what it is worth |
| flow | It happens in this order |
| map-sidebar | Here is the system, and here is the register that governs it |
| escalation | Response is proportional to severity |
| decision | One decision, this week |

## Standard layouts (10): native PowerPoint shapes and text, editable after export

| Layout | It says |
|---|---|
| std-agenda | Here is the shape of the next twenty minutes |
| std-section | We are moving to a new part of the argument |
| std-bullets | Here are the points, with an optional note panel |
| std-cards | Six things, of equal weight |
| std-table | The numbers, in rows, with an owner column |
| std-timeline | Here is the sequence and the dates |
| std-checklist | How this goes right, and how it goes wrong |
| std-progress | Where each track actually stands |
| std-quote | Someone else said it better |
| std-closing | The ask, and the three things you are agreeing to |

**Why the split matters.** Artwork slides carry 1,000 to 3,500 elements of shading and machining, so they go into PowerPoint as images. Standard slides go in as native shapes and text, so you can edit the words after export. Both sit on the same grid, with the same corner circuitry, so the deck reads as one thing.

---

# 7. The detail dial

Every artwork slide takes a detail level.

| Level | Name | Elements | Use it for |
|---|---|---|---|
| 0 | Structure | ~90 | Wireframing the argument |
| 1 | Machined | ~240 | Working drafts |
| 2 | Shaded | ~590 | The default |
| 3 | Illustrated | ~1050, up to 3500 | The cover, the compare, the close |

Level 3 adds tonal shading with a light direction from the upper left, turning rings, bolt circles with slotted heads, rivet rows, seams, chamfers, edge lighting, hex nuts, connectors and service greebles. It is roughly eleven times the element count of the old default, and it is what makes the frame feel drawn rather than plotted.

---

# 8. Writing the slide

The artwork is half of it. The line is the other half.

1. **The verdict bar is one sentence and it is the argument.** "Recoverable waste is structural, not behavioural" is a verdict. "Overview of findings" is a heading.
2. **A callout is a head of two or three words and a body of one sentence.** If it needs two sentences, it is two callouts, or it is not important.
3. **Name the number, then name its range.** A point estimate invites a fight about the estimate. A range that survives a haircut ends the fight.
4. **The dead panel must be recognisable as their current life.** Specific, not strawman. If they do not see themselves on the left, the right persuades nobody.
5. **Every slide answers "so what" in the bar.**

---

# 9. The tools

| Tool | What it does |
|---|---|
| signal-slide-studio.html | The studio. Pick a layout, type the talking points, dial the detail, add to deck, export PPTX. Self-contained, no install. |
| build-deck.js | Command line. A deck definition in, a real PowerPoint file out. Standard slides native, artwork slides as images, talking points in the speaker notes. |
| signal-gallery.html | Browse the 56 devices on their own, with a slider per parameter. |
| signal-kit.js | Tokens, twelve primitives, 56 devices as pure functions. |
| signal-detail.js | Greeble generators and the ornament layer. |
| signal-shade.js | The 10x detail engine: tonal shading, machining, edge lighting. |
| signal-slide.js | The eight artwork archetypes and the composition law. |
| signal-standard.js | The ten standard layouts, in both SVG and native PowerPoint. |

## Nano banana

For the illustrated register on cover art, where a slide must be beautiful rather than merely correct. Use the corrected preambles in the v3 spec, leave the text out, and always attach one of your existing deck images as a reference or it drifts by the fifth generation.

---

# 10. What not to do

- Do not put text inside a generated image. Type goes on top, always.
- Do not use a third accent. Two, plus orange for escalation, is the whole vocabulary.
- Do not let a grey element glow.
- Do not use a circular icon holder.
- Do not put an accent rule under a heading. The eyebrow rule goes above, and it is never full width.
- Do not ship a slide whose verdict bar you could not write.
- Do not use pure white in the light edition. The paper is bone, F5F4EF, and that warmth is doing more work than it looks like.
