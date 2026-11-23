# Signal v3: Talking-Point Slides

**The unit is not an icon. It is a slide that argues one thing.**

Formatting note: written in the subset Google Docs converts cleanly. No fenced code blocks, no blockquotes, no rules, no angle brackets, no backticks. To import: Drive, Settings, tick "Convert uploaded files to Google Docs editor format", then upload.

## What changed, and why

Versions 1 and 2 were built on my reading of your decks. I then measured the actual images in them, and three of my core rules were wrong. Not slightly wrong. Backwards.

| What I specified | What your deck actually does |
|---|---|
| Pure white ground. "Not beige, not cream." | Bone paper, sampled at F5F4EF. Warm, not white. |
| Generous negative space, a centred object | Full bleed. Ink coverage 33 to 42 percent of the frame. |
| Flat fill, one hatch angle, no shading | Ten to fourteen distinct tonal levels. Form shading with a light direction. |
| Neon pink and cyan as the only accents | Navy ink 203048, emerald 188860, orange F07028, muted rose for loss. |
| No text in any asset | Your images carry the talking point inside the artwork. |

The last row is the important one. A Signal asset was a picture you put text next to. A Signal slide is a picture that makes an argument. That is what you actually want, and it changes the whole system.

---

# 1. Tokens, corrected

**Light edition (blueprint), measured from the source deck**

| Token | Value | Role |
|---|---|---|
| PAPER | F5F4EF | Bone, warm. Never pure white. |
| PANEL | FFFFFF | Card fill, sits brighter than the paper |
| SIDEBAR | C5CCD2 | The governed register column |
| GRID | E2E4E1 | 24px drafting grid, always on |
| INK | 203048 | Deep navy. Every contour and all type. |
| MIST | 8A939E | Body copy, secondary detail |
| FAINT | B6BDC5 | Dead, legacy, the old way |
| HATCH | DCE0E3 | 45 degree shading at 9px |
| EMERALD | 188860 | Value, the governed path, the win |
| ORANGE | F07028 | Heat, escalation, urgency |
| ROSE | C0504A | Loss, leaks, the thing that is bleeding |

**Dark edition (console)**

| Token | Value | Role |
|---|---|---|
| GROUND | 0B0C10 | Near-black |
| PANEL | 15171F | Card |
| GRID | 1A1D26 | Same grid, barely there |
| WHITE | FFFFFF | Primary line |
| MIST | B9C0CE | Secondary |
| FAINT | 7A828F | Dead. Never glows. |
| CYAN | 21E0DC | The quiet accent |
| PINK | F0245C | The single loud accent |
| ORANGE | FF7A3D | Escalation |

Font: Calibri in Office, Carlito on the web. They are metric-compatible, so a deck moves between them without reflowing.

---

# 2. The composition law

This is the part I got wrong, so it gets its own section.

1. **Fill the frame.** Target 25 to 40 percent ink coverage. Below 20 percent a slide reads as unfinished, and that is exactly what my earlier assets were doing.
2. **The grid is always on.** A 24px drafting grid under everything. It costs nothing and it is 80 percent of why the deck looks like one deck.
3. **Circuit traces bleed in from all four corners.** Faint, terminated in pads. This is the signature texture. Without it the slides look like generic consulting.
4. **Every claim sits in a card with corner brackets.** Not floating text. A drawn container with a numbered chip.
5. **Callouts connect to the thing they describe** with a dashed leader line ending in a dot. The leader is what makes it read as an engineering drawing rather than a poster.
6. **A verdict bar closes the slide.** A dark filled bar, full width, one sentence, centred. It is the line the audience leaves with.
7. **Shading is tonal, never a shadow.** Hatch density, stroke weight and grey ramps do the work. No drop shadows anywhere, in either edition.
8. **One hero device per slide.** Two competing metaphors is two slides.

---

# 3. The eight archetypes

Every slide in a Signal deck is one of these. Each is a call in code and a prompt in nano banana.

| Archetype | It says | Hero device sits |
|---|---|---|
| cover | Here is the one idea | Right half, large |
| hero-callouts | Here is the thing, and here are the three parts of it that cost you money | Centre, callouts left and right on leader lines |
| compare | The old way versus the governed way | Two panels: left greyed and hatched, right lit |
| metrics | Here is what it is worth | Three number panels, last one accented |
| flow | It happens in this order | Full-width device, captions beneath each station |
| map-sidebar | Here is the system, and here is the register that governs it | Device left, register column right |
| escalation | Response is proportional to severity | Rising tiers, callouts stepping up beside them |
| decision | One decision, this week | Device centre, do-nothing panel left (dead), commit panel right (lit) |

The compare and the decision archetypes carry most of the persuasive weight in any deck. The left panel is deliberately drawn dead: hatched header, grey strokes, crossed bullets, no glow. The right is lit. That contrast does more work than any argument you can write.

---

# 4. Claude Design track

The code renders finished slides at 1376 by 768, with real vector type.

**This is the key difference from the raster track. Code can carry type.** The no-text rule exists because image models garble letterforms. A renderer does not. So Claude Design slides ship with the talking point set in Carlito, crisp, editable, translatable, and correct at any zoom.

**Files, in load order:**

1. signal-kit.js: tokens, twelve primitives, 56 hero devices as pure functions.
2. signal-detail.js: eleven greeble generators, the ornament layer, densified recipes.
3. signal-slide.js: the eight archetypes, the corrected palette, the composition law.

**How you use it:**

slide("hero-callouts", content, "light") returns a finished SVG.

The content object takes: eyebrow, title, hero (any of the 56 device ids), params (the device's variation levers), callouts (an array of head and body), verdict and sub.

Open signal-slide-studio.html in a browser. Pick the archetype, pick the edition, pick the hero device, type your talking points, and it renders live. Export SVG for vector, or PNG at 2x for pasting into PowerPoint.

**Ingest into Claude Design in three messages.** One: paste the tokens and the composition law from sections 1 and 2. Two: upload the three JS files and tell it to keep them as the slide engine, not to rewrite them. Three: ask it to rebuild the studio and add whatever archetype you find missing.

---

# 5. Nano banana track

Same slides, illustrated rather than drafted. Richer, but the type comes out garbled, so you leave the text out and set it in PowerPoint on top.

## Preamble L, corrected (light edition)

A full-bleed technical infographic slide in engineering blueprint style, filling the entire frame edge to edge, on warm bone-coloured paper, hex F5F4EF, not pure white. A faint drafting grid covers the whole surface. Fine circuit-board traces bleed inward from all four corners and terminate in small round pads.

Line art in deep navy, hex 203048, with three stroke weights: a heavy outer contour, a medium component edge, and a hairline for internal detail. Form is shaded with 45 degree hatching and cross-hatch in pale grey, following the curvature of each surface, with a consistent light direction from the upper left. There are ten or more distinct tonal levels: this is a shaded illustration, not a flat diagram. No drop shadows and no glow anywhere.

Accents used sparingly: emerald green, hex 188860, for value and for the governed path. Orange, hex F07028, for heat and escalation. Muted rose, hex C0504A, for loss and leakage. Everything else is navy, grey and paper.

The composition is dense and fills the frame: the machine occupies the centre, rectangular callout cards with corner brackets sit around it, and thin dashed leader lines connect each card to the exact part of the machine it describes, ending in a small filled dot. A dark navy verdict bar runs the full width at the bottom.

Leave every text area empty: draw the cards, the rules and the bar, but put no letters, numbers or labels anywhere in the image. Type is set on top afterwards.

Subject:

## Preamble D, corrected (dark edition)

A full-bleed technical infographic slide in printed circuit board style, filling the entire frame edge to edge, on near-black, hex 0B0C10. A faint dark grid covers the whole surface, and cyan circuit traces bleed inward from all four corners, terminating in small pads.

Monoline art in white and cool grey, hex FFFFFF and B9C0CE. Accents only in cyan, hex 21E0DC, and hot pink, hex F0245C, with orange, hex FF7A3D, reserved for escalation. Coloured strokes carry a soft neon outer glow. Grey strokes carry no glow at all: that is deliberate and important, because grey means dead.

The composition is dense and fills the frame: the device occupies the centre, panels with clipped corners and bracket accents sit around it, and dashed leader lines connect each panel to the part of the device it describes. A solid bar runs the full width at the bottom.

Leave every text area empty: no letters, no numbers, no labels, no watermark. Type is set on top afterwards.

Subject:

## Subjects, one per archetype

**cover.** A large sectioned cutaway of a machine on the right half of the frame: rotor core, meshed gear train, bolted intake and exhaust pipework, a wedge cut away to reveal the interior, hatched shading throughout. The left half is empty paper with a faint grid, reserved for the title.

**hero-callouts.** A heavy horizontal industrial pipe run across the middle of the frame with bolted flanges and valve wheels, fractured in three places, each fracture dripping into a stain below. Three empty rectangular callout cards with corner brackets sit to the left and right, each connected to one fracture by a thin dashed leader line ending in a dot. An empty verdict bar spans the bottom.

**compare.** The frame split into two large bracketed panels. The left panel is drawn dead: grey strokes, hatched header band, a shattered funnel inside, crossed bullet markers down its lower half. The right panel is lit: a clean machined control ring inside, an emerald header band, ticked bullet markers. Both panels are empty of text.

**metrics.** Three tall bracketed panels side by side, each with a hatched header strip, a large empty rectangular window sized for a number, a hairline rule beneath it, and a small chart skeleton at the base (a bar cluster, a rising line, a gauge arc). The rightmost panel is accented emerald and drawn heavier. An empty verdict bar spans the bottom.

**flow.** A horizontal conveyor with rollers and a drive gear running the full width, carrying a component that becomes more complete at each of four stations, with a robotic arm above each. Beneath, four empty caption cards with corner brackets, connected upward to their station.

**map-sidebar.** A hub-and-spoke system map on the left two thirds: a central node, four satellite nodes on concentric rings, orthogonal traces between them. On the right third, a grey-blue register column: a dark header band and six empty rows, each with a coloured edge tab.

**escalation.** A four-tread isometric staircase drawn as heavy industrial machinery rising to the right, with a cargo block on each tread, cross-braced steel beneath, hydraulic lines up the flight, and warning beacons on the top unit. Four empty callout cards step up alongside it, each on a dashed leader to its tread.

**decision.** A heavy machined throw-lever on a bolted base plate at the centre, in the forward detent position. To its left, a dead panel: hatched header, grey strokes, crossed markers. To its right, a lit panel: emerald header, ticked markers. Both empty of text.

## The reference-image step, which is not optional

Nano banana drifts by the fifth generation on wording alone. Attach one of your existing deck images as a reference to every run and open the prompt with this line:

Match the paper colour, line weight, hatching style, tonal range and colour palette of the attached reference image exactly. Same visual language, new subject.

You already have sixteen of these images in the deck. They are better reference material than anything I can generate.

---

# 6. Writing the talking point

The artwork is half the slide. The line is the other half.

1. **The verdict bar is one sentence and it is the argument.** Not a summary. Not a label. "Recoverable waste is structural, not behavioural" is a verdict. "Overview of findings" is a heading.
2. **A callout is a head of two or three words and a body of one sentence.** If the body needs two sentences, it is two callouts, or it is not important.
3. **Name the number, then name its range.** "945k annual benefit" then "survives a 60 percent haircut and still pays back inside a quarter." A single point estimate invites a fight about the estimate. A range that survives a haircut ends the fight.
4. **The dead panel must be recognisable as their current life.** Specific, not strawman. If they do not see themselves in the left panel, the right panel persuades nobody.
5. **Every slide answers "so what" in the bar.** If you cannot write the bar, the slide has no argument and should be cut.

---

# 7. Build order

1. Open signal-slide-studio.html. Build the deck you need today. Export PNG at 2x, paste into PowerPoint, done.
2. Where a slide has to be beautiful rather than merely correct, generate it in nano banana with the corrected preamble and one of your deck images attached as reference, then set the type on top.
3. Keep the 56 hero devices as your vocabulary. Section 3 of the v2 spec maps the logic of any message to the device that carries it. Name the logic, take the device, drop it into an archetype.

The one rule that survives every version: **one slide, one argument, one line at the bottom that the room repeats afterwards.**
