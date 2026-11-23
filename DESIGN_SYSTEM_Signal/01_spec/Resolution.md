# Resolution

## The slide

**13.333 x 7.5 inches. Exactly PowerPoint 16:9.** That is the deck's real size; everything else derives from it.

Internally the canvas is **1280 x 720 SVG units at 96 PPI**. 96 is the standard CSS and Office pixel, so an inch on the slide is an inch in PowerPoint.

Nothing is rasterised while you work. The canvas is vector, so **zoom does not degrade anything** and the slide has no resolution until you export it.

## What I found and fixed while checking this

The canvas was **13.3 x 7.5in on a 1376 x 768 grid**. Those do not agree:

- The inch aspect was 1.7733, the pixel aspect was 1.7917.
- PPI derived from the width was 103.46; from the height, 102.40.
- Because the code used a single PPI (the width one), **anything below y = 7.42in was drawn past the bottom of the canvas and silently clipped**: the last 0.077in of the slide.
- And 13.3 is not PowerPoint's 13.333, so a deck was very slightly the wrong shape.

Now 13.333 x 7.5in on 1280 x 720, PPI 96 in both directions, aspect 1.7778 both ways. Nothing clips.

I also found the font stacks were emitting **malformed SVG**: `font-family=""Carlito","Calibri",...`, double quotes inside a double-quoted attribute. Browsers forgave it; a strict XML parser did not, which means the SVG export was technically broken. The stacks now use single quotes. All 92 slides parse as valid XML.

## Export

An **export resolution** selector sits next to the export buttons:

| | Pixels | Use |
|---|---|---|
| 1x | 1280 x 720 | drafts, quick shares |
| **2x** | **2560 x 1440** | the default. Sharp on any screen, sane file size. |
| 3x | 3840 x 2160 | 4K. Big screens, printed handouts. |
| 4x | 5120 x 2880 | archival, or a poster crop |

It applies to **PNG, PDF, the contact sheet, and any rasterised object in the PPTX**.

## What actually rasterises

| Export | Text and shapes | Hero illustrations and circuit graphics | Pictures and video |
|---|---|---|---|
| **PPTX** | native, editable | rasterised at the chosen scale | native, at their own resolution |
| **PDF** | rasterised at the chosen scale | same | same |
| **SVG** | vector, infinite | vector, infinite | embedded at native resolution |
| **PNG** | rasterised at the chosen scale | same | same |

If you want a slide that never loses a pixel, **export SVG**: it stays vector all the way down.
