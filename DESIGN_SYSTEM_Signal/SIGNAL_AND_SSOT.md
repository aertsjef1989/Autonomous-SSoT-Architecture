# SIGNAL_AND_SSOT.md

**How the design system and the documentation suite relate**

| Field | Value |
|---|---|
| Document ID | `SIGNAL_AND_SSOT` |
| Version | 1.0 |
| Purpose | One document, so nobody has to work out which is authoritative for what |
| Date | 23 July 2026 |

---

## 1. Two things, one visual language

| | Signal | Autonomous SSoT |
|---|---|---|
| What it is | **A design system.** Themes, devices, templates, a studio | **A knowledge library programme.** Specification, content, governance |
| Produces | Slides and visual artefacts | Documents, diagrams, prototypes |
| Lives | This folder | The suite root |
| **Relationship** | **Signal is the visual language Autonomous SSoT is rendered in** | |

**Neither depends on the other to function.** Signal works for any deck. Autonomous SSoT could have been rendered in anything. They share a palette because one was used to build the other.

---

## 2. What Autonomous SSoT actually uses from Signal

| Used | Where |
|---|---|
| **The palette** | 54 diagrams and interface renders, 72 rendered documents |
| The typographic pairing, Calibri and Carlito | Every rendered document |
| The two-dot motif, pink and cyan | Every document footer, every diagram |
| The motherboard cover treatment | Every PDF cover |
| **Nothing else, yet** | No templates, no devices, no studio output |

### 2.0 What it should use and does not

**`00_cross_surface_standard/02_templates/Lark_Conventions.md`.**

It maps every brand element onto a Lark block for Wiki, Docs, Sheets and Slides, with exact colours, because **Lark accepts no theme file on any surface.**

The knowledge library is 3,386 wiki pages. **That document specifies how those pages should look**, and nothing in the Autonomous SSoT suite currently references it.

| Should reference it | Currently does not |
|---|---|
| `LW-TL-025_Content_Template_Library` | Correct |
| `LW-CG-032_Content_Creation_Field_Guide` | Correct |
| `LW-WA-020_Wiki_Master_Architecture` | Correct |

**Logged rather than fixed**, because those documents are frozen. It belongs in the decision log as a formatting-standard item for the next revision.

### 2.1 What it does not use

**Autonomous SSoT does not use the 56 devices, the 41 templates or the studio.**

Its diagrams were drawn directly in SVG against the palette, and its documents were rendered through a separate pipeline.

**That is worth stating plainly**, because a reader who assumes the documentation was produced in the studio will look for source files that do not exist.

---

## 3. The token reconciliation

**The two were never reconciled and had drifted. They are now.**

| Role | `dark` theme | **What Autonomous SSoT used** | State |
|---|---|---|---|
| pink | `#F0245C` | `#F0245C` | **Identical** |
| cyan | `#21E0DC` | `#21E0DC` | **Identical** |
| ground | `#0B0C10` | `#08090D` | Diverged by 3 points |
| panel | `#15171F` | `#11141B` | Diverged |
| faint | `#7A828F` | `#79828F` | Diverged by 1 point |

### 3.1 What was done about it

**Two named variants added to the token set** rather than either side being changed to match the other.

**A correction worth recording.** The `print` variant was not a discovery. `00_cross_surface_standard/02_templates/Lark_Conventions.md` already specified Ink `#14161C`, Pink `#F0245C` and Cyan `#21E0DC` for documents and wiki pages.

**The values were already the documented standard.** Adding them to the token file names something that existed rather than establishing something new, and the reason it was missed is that the folder holding it was labelled an archive.

| Variant | Contains | Used by |
|---|---|---|
| `console` | The deeper grounds, identical accents | The 54 diagrams and 3 prototypes |
| `print` | Ink on white, same accents | The 72 rendered documents |

**The accents were already identical**, which is the part that matters. The grounds diverged because dense technical diagrams and slide decks want slightly different backgrounds, and both readings are defensible.

### 3.2 Why not just align them

**Aligning would mean regenerating 54 diagrams and 72 documents to change a background by three points.**

That is a real cost for no visible difference. **Naming the variant is the honest fix**: the system now describes what exists rather than what was intended.

---

## 4. Which is authoritative for what

| Question | Authority |
|---|---|
| What colour is the pink | **`06_tokens/tokens.json`** |
| What does a slide look like | **Signal.** `01_spec/Signal_Design_Language.md` |
| What does a rendered document look like | **Autonomous SSoT.** `25_FORMAT_POLICY` |
| What does a diagram look like | **Autonomous SSoT.** The `console` variant plus the diagram set |
| How is a deck built | **Signal.** `02_studio/signal-studio.html` |
| How is a document built | **Autonomous SSoT.** The build pipeline |

### 4.1 The rule

**Signal owns the visual language. Autonomous SSoT owns its own rendering.**

Where they disagree on a colour, the token file wins and the variant should be named rather than silently diverging again.

---

## 5. If you are building the product

**Signal is not a dependency of the platform.** Nothing in the knowledge library requires it at runtime.

It matters in three places:

| Where | Why |
|---|---|
| **Executive materials** | The proposal deck, the one-pager, anything shown to a sponsor |
| **Training delivery** | Module slides, if delivered as slides rather than live in the tool |
| **Any future diagram** | So the fifty-fifth image looks like the first fifty-four |

### 5.1 What to do first

**Open `02_studio/signal-studio.html`.** No install, no server. It is the whole application.

Everything else in this folder is either input to it, output from it, or documentation about it.
