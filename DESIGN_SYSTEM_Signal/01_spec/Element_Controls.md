# Element controls

Select any object. Every type now gets the same three blocks, plus its own.

## Geometry, on every object

| Control | What it does |
|---|---|
| **X, Y, W, H** | typed in inches, to two decimals. Exact placement, not drag-and-hope. |
| **Rotate** | -180 to 180. Works on *everything* now: text, rects, cards, chips, callouts, lines. |
| **Opacity** | 5 to 100% |
| **lock** | a locked object cannot be grabbed by accident. Alt-click to grab it anyway. |
| **centre** | centres it on the slide |
| **copy style / paste style** | lift fill, stroke, weight, radius, chamfer, dash, glow, shadow, opacity and every type setting off one object and stamp it onto another. Paste onto a multi-selection to hit them all. |
| **Z** | raise or lower in the stack |

## Style, on every shape

Fill, stroke, stroke width (0 to 8), **dash** (solid, dashed, dotted, long dash), corner radius, **chamfer**, glow, shadow. All colours are theme roles, so they re-skin.

## Typography, on every text object

Size, colour, **bold, italic, underline, UPPERCASE**, horizontal align, vertical align, **letter spacing**, **line height**, shadow.

## Type-specific

- **Line**: arrow, terminals (the hollow circles), and **routing** — theme default, elbow across-then-down, or elbow down-then-across.
- **Card**: corner brackets, double border, accent band.
- **Chip**: shape override (circle, chamfered, square).
- **Callout**: kind (key point, tip, context), label, body.
- **Tag**: status (on track, at risk, done).
- **Button**: variant (primary, secondary).
- **Image**: 13 colour and geometry controls, see Assets_And_Brand.md.
- **Device**: 20 controls, see Device_Controls.md.

## Multi-select

Select several objects and the panel changes: set fill, stroke, stroke width, opacity and rotation, then **apply to all**. Or **paste style to all**. The align and distribute tools work on the selection too.

## Verified

Every control above was driven in a live browser DOM across all nine element types: **158 control interactions, zero runtime errors.**
