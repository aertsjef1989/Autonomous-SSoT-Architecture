# Signal

A slide system in six switchable themes, a 56-machine visual vocabulary, 41 templates, and a browser editor that behaves like PowerPoint and exports to it.

**Open `02_studio/signal-studio.html`.** No install, no server. That is the whole app.

---

## The one thing to understand

The unit is not an icon. It is **a slide that argues one thing**: a machine that carries the logic, callouts on leader lines, and a verdict bar with the sentence the room repeats afterwards.

**If you cannot write the verdict bar, the slide has no argument and should be cut.**

---

## Folder map

| Folder | Contains | Open this if |
|---|---|---|
| **`00_cross_surface_standard/`** | **The standard for documents, spreadsheets, wikis and Workspace** | **You are making anything that is not a slide** |
| **`02_studio/`** | **The three applications** | **You want to make a slide deck** |
| `01_spec/` | Eleven specification documents | You want to know why something behaves as it does |
| `03_engine/` | The engine: kit, model, renderers, manifests | You are extending the system |
| `04_templates/` | 41 templates across six groups, 184 files | You want a starting point |
| `05_devices/` | 56 device drawings as SVG | You want a machine on its own |
| **`06_tokens/`** | **The palette, in six formats** | **You are building anything else that must match** |
| `07_examples/` | Two exported decks | You want to see the output before building |


### The three applications

| File | What it does |
|---|---|
| **`signal-studio.html`** | **The full editor.** Canvas, templates, devices, themes, PPTX export |
| `signal-slide-studio.html` | The earlier single-slide editor |
| `signal-gallery.html` | Browse the 56 devices and the templates |

All three are **standalone HTML**. They fetch fonts and the PPTX library from a CDN and nothing else. Move this folder anywhere and they still work.

---

## The six themes

| Theme | What it is | Ground | Ink | Geometry |
|---|---|---|---|---|
| **Master** | The original deck, as a theme. Glow canvas, soft shadow | `0B0C10` | `FFFFFF` | rounded, circle chips |
| **Console** | The same dark neon, on a drafting canvas | `0B0C10` | `FFFFFF` | rounded |
| **Circuit** | Measured dark: pure black, 3 percent 50px grid | `000000` | `FFFFFF` | chamfered, orthogonal, hollow terminals |
| **Blueprint** | Measured light: bone paper, navy ink | `F3F3EB` | `273D55` | chamfered, double border, 25px grid |
| **Blueprint (soft)** | The earlier, gentler reading. Kept | `F5F4EF` | `203048` | rounded |
| **Light Screen** | The original light edition, unchanged | `FFFFFF` | `14161C` | rounded |

**Geometry is a property of the theme, not the object.** Switch the theme and the corners, the routing, the terminals and the grid change with the palette.

---

## Two variants that are not themes

Added so the token set describes what actually exists.

| Variant | What it is | Used by |
|---|---|---|
| **`console`** | The dark palette with deeper grounds | **The Autonomous SSoT diagram set, 54 images** |
| **`print`** | Ink on white, same accents | **The Autonomous SSoT rendered documents, 72 PDFs** |

Accents are identical to the `dark` theme. Only the grounds differ, and only by a few points.

**See `SIGNAL_AND_SSOT.md`** for why they diverged and why naming them was the right fix.

---

## Keys

`T` text · `R` rect · `O` ellipse · `L` line · `Del` delete
`Ctrl+Z` undo · `Ctrl+Y` redo · `Ctrl+C/V` copy paste · `Ctrl+D` duplicate · `Ctrl+A` select all
arrows nudge · `shift+arrows` nudge far

---

## What exports natively

| Native PowerPoint objects | Images |
|---|---|
| Text, shapes, lines, chips, images | **Devices** |

Devices export as images because 3,000 vector elements each would choke PowerPoint. **Everything else stays editable after export.**

---

## Two systems, one palette

**This folder contains a slide system built on top of a broader standard.**

| | `00_cross_surface_standard/` | The rest of this folder |
|---|---|---|
| Version | 2.0 | Later |
| Covers | **Slides, documents, wikis, spreadsheets, code** | **Slides, in depth** |
| Templates | Word, Excel, PowerPoint | 41 slide templates |
| Platform guidance | **Workspace Wiki, Docs, Sheets, Slides** | None |
| Editor | None. Template files | **The studio** |

**Neither supersedes the other.** The slide system goes deeper on slides. The cross-surface standard is the only thing that covers Word, Excel and Workspace.

### If you are working on Autonomous SSoT

**`00_cross_surface_standard/02_templates/Workspace_Conventions.md` is operationally relevant.**

It maps every brand element onto a Workspace block, per surface, with exact colours. Workspace accepts no theme file on any surface, so consistency comes from applying the same choices every time, and that document is the mapping.

### Nothing was overwritten

`Console` and `Light Screen` are themes from the earlier build, preserved exactly. `Blueprint` is the one measured from the decks that were actually liked: bone paper, navy ink, 33 to 42 percent ink coverage, ten to fourteen tonal levels.
