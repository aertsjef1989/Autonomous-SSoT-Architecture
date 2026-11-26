# Assets and the brand mark

## The asset library

Upload once, use everywhere. **+ Upload asset** in the right panel takes one file or many.

- Each file is stored **once** in the project, and every placement points at that single copy. Place the same logo on twenty slides and the project file still holds one image.
- Click any asset in the library to drop it on the current slide. From there it is an object like any other: drag, resize, snap, z-order, align, lock.
- Per-image controls: opacity, fit (contain, cover, stretch), **reset aspect** (snaps the box back to the file's true ratio), and **lock** (a locked object cannot be grabbed by accident; alt-click to grab it anyway).
- Assets travel inside the saved .json, so a project opens on any machine with its images intact.

## The brand mark

This is the one you want. Set it once, and it appears on every slide.

**BRAND MARK panel:**

| Control | What it does |
|---|---|
| asset | pick any uploaded asset as the mark |
| corner | six presets: three top, three bottom |
| width | 0.4 to 3 inches. Height follows the file's true aspect ratio automatically. |
| margin | distance from the slide edge |
| clear space | draws a dashed guide at the distance the brand guidelines require. **Editor only, never exported.** |
| opacity | for watermark placements |
| on every slide | toggle the whole layer |
| skip cover | most brand guides want the mark absent or larger on slide 1 |

The mark renders **above everything**, on every slide, at z 9999. It is not in the object list, so it cannot be dragged, deleted or nudged by accident. Change the corner once and it moves on all forty slides.

On **Export PPTX** it goes out as a **native image object** on each slide, not baked into a raster. It stays a real, movable, replaceable picture in PowerPoint.

## Why the mark is not built into the system

Signal is deliberately brand-neutral: no template, theme or device carries anyone's logo. That is your own standing rule, and it is the right one, because a logo baked into a template appears on the slides where it should not.

So the mark is a **layer**, not a component. You supply the official file from the brand resource kit, at the approved colour and clear space, and the app places it correctly on every slide. That is the only way to be both consistent and correct.

## Alignment

With two or more objects selected: align left, centre, right, top, middle, bottom, and distribute horizontally or vertically. Everything snaps to the 1/8 inch grid unless you turn snapping off in the toolbar.

---

# Asset colour control

Every image object now carries a full adjustment stack. Filters chain in the order listed.

| Control | Range | What it is for |
|---|---|---|
| Tint to role | any theme role | **Recolours the asset to a theme colour.** A mono logo tinted to `ink` follows the theme: navy on Blueprint, white on Console. This is the one that matters. |
| Tint mode | multiply, normal, screen | multiply keeps the artwork's shading, normal replaces it flat |
| Greyscale | 0 to 100% | knock a photo back behind text |
| Saturation | 0 to 3 | |
| Brightness | 0.2 to 2 | |
| Contrast | 0.2 to 2 | |
| Invert | 0 to 100% | a dark-background logo on a light slide, without a second file |
| Blur | 0 to 8px | background imagery |
| Rotate | -180 to 180 | |
| Flip H / Flip V | | |
| Corner radius | 0 to 60 | clips the image |
| Frame | any theme role | a stroke around the image, in a theme colour |
| Reset colour | | strips every adjustment in one click |

**Invert plus tint is the pair to know.** A single-colour logo supplied as black-on-transparent can be made white for the dark themes and navy for Blueprint from one file, with no editing outside the app.

---

# What the DESIGN.md audit corrected

I had copied your original design system into the package but not read it closely. Reading it properly, six things in my build contradicted it. All are now fixed.

| DESIGN.md says | I had | Now |
|---|---|---|
| The numbered chip is a **full pill**, a circle | square chips | circle in Console, Light Screen and Blueprint soft; chamfered in the measured deck themes, which do use squares |
| The numeral is **white on pink, near-black on cyan** | ground colour on both | correct per accent |
| The eyebrow is **cyanText** | pink everywhere | role-driven, and the deep text variants exist |
| Coloured text on white uses the **deep variants**, never raw pink or cyan | raw accents | text1 and text2 roles: C71048 and 0E8A86 |
| **Tints** exist: pinkTint FDE7EE, cyanTint E4FAF9 | absent | tint1 and tint2 roles, used by the callouts |
| Radius 8 | 6 | theme-driven |

**Five components from DESIGN.md that were missing are now in the toolbar:**

- **Two-dot mark** (••): the signature. Pink dot, cyan dot.
- **Callout** with three kinds: key point (pink tint, pink border), tip (cyan tint, cyan border), context (neutral, no accent). Dark editions get a left marker instead of a tint, as specified.
- **Status tag**: a pill. On track uses cyan tint with cyan text, at risk uses pink tint with pink text, done is neutral.
- **Button**: primary is a pink fill with white text, secondary is a hairline outline with deep-accent text.
- **Chip shape override** per object, if you want to break the theme default on one slide.
