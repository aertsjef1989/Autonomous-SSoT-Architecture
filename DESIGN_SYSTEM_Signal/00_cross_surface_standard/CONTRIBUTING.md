# Contributing to the Signal Design System

This system stays useful only if it stays consistent. Anyone can extend it, but changes follow one rule and one order, so the spec, the tokens, the templates and the reference never drift apart.

---

## The one rule

**Spec first, then propagate.** Nothing is real until it is written in the design language. A component that lives only in a slide someone made is not part of the system. Define it in the spec, then push it out to every surface that needs it.

---

## Propagation order

When you add or change anything, work through these in order. Skipping a step is how a system rots.

1. **Design language** (`01_spec/Design_Language.docx`). Add or edit the definition: what it is, when to use it, its colour, type and spacing. Update the coverage map on page one if it is a new parameter.
2. **Tokens** (`04_tokens/`). If a colour, size or spacing value changed, update all five files: `tokens.json`, `tokens.css`, `tokens.scss`, `tokens.ts`, `tailwind.config.js`. They must agree exactly.
3. **Templates** (`02_templates/`). Add the component to the surfaces it belongs on: the PPTX master, the Word template, the Excel workbook.
4. **Lark conventions** (`02_templates/Lark_Conventions.md`). Add the block mapping for Wiki, Sheets, Base and Slides, and a row in the components-at-a-glance table.
5. **Component library** (`05_reference/Component_Library.html`). Add a live example so the reference shows it in both editions.
6. **Cheat sheet** (`01_spec/Cheat_Sheet.pdf`) if it is common enough to belong on the one-pager.
7. **Changelog** (`CHANGELOG.md`). Record what changed and bump the version.

---

## Definition of done for a new component

A component is finished only when all of these are true.

- It has a clear name that says what it does, reused identically on every surface.
- It uses only existing tokens. If it needs a new colour or size, that token is added first, in all five formats.
- It works in both the light and dark editions.
- It appears in the design language, at least one template, the Lark conventions and the component library.
- It does not duplicate an existing component with a slightly different look. Extend the existing one instead.

---

## Naming

Name components by what they do, not how they look: "key point", not "pink box". Keep one vocabulary for shared concepts, especially status words (On track, At risk, Done) and headings (Title, Heading 1, 2, 3, Body, Muted, Eyebrow). A reader should learn a name once and recognise it everywhere.

---

## Versioning

- **Minor** (2.0 to 2.1): new components, new templates or layouts, new examples. Nothing existing breaks.
- **Major** (2.x to 3.0): a token value changes, a rule changes, or something is removed or renamed. Anything that could make older material look off-brand.

Always bump the version in `CHANGELOG.md` and in `START_HERE.md`.

---

## Review checklist

Before you call a change done, read it back against these.

- White or near-black dominates; pink is the one loud accent, cyan the quiet one.
- Body text is Ink on light and White on dark. Coloured text on white uses the deep variants.
- No dark backgrounds in documents or sheets, no edge stripes, no heading underlines, no more than two accents.
- One statement, one key callout and one chip rhythm per page.
- No em dashes anywhere. No internal names, company names or client names in any template or example.
- The five token files still agree with each other and with the spec.

---

## Proposing a change

Write the change against the design language first as a short note: what, why, and which surfaces it touches. Once the definition is agreed, propagate it in the order above in a single pass, then update the changelog. Small and consistent beats large and divergent.
