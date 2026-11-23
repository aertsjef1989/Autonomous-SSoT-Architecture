# Hero device controls

Select any device on the canvas. Twenty controls, in four groups.

## The device

**prev / next / random** cycles the 56 machines in place, keeping size and position. The fastest way to find the right metaphor is to sit on the slide and flick through them.

## Render

| Control | Range | What it does |
|---|---|---|
| Detail | 0 to 3 | structure, machined, shaded, illustrated |
| **Density budget** | 200 to 3000 | the element count to aim for. 300 gives roughly 740 elements, 2000 gives 1980. Use it to trade weight against fidelity when a slide has three devices on it. |
| **Line weight** | 0.3x to 4x | scales every stroke in the drawing. Thin for a background device, heavy for a hero. |
| **Light angle** | -180 to 180 | moves the light source. All tonal shading, terminators and edge lighting follow it. Default is upper left. |
| **Seed** | 1 to 200 | reshuffles every greeble: the hex nuts, the service detail, the scatter. Same machine, different wear. |
| shuffle greebles | | random seed |
| glow | | force the neon glow on or off, independent of the theme |

## Framing

| Control | What it does |
|---|---|
| **Zoom** 0.3x to 3x | scale inside the box. Above 1 with **crop** on, you get a detail shot of one part of the machine. |
| **Pan X / Pan Y** | move the drawing inside its box |
| Rotate | -180 to 180 |
| Opacity | for a device sitting behind text |
| Fit | contain, or fill the box |
| flip H / flip V | |
| **crop** | clips to the box. This plus zoom is how you frame a close-up. |

## Device colour

Every channel of the machine can be overridden independently, by theme role:

- **Line**: the contours and the type
- **Accent 1** and **Accent 2**: the two accents inside the drawing
- **Hatch**: the shading
- **Mist** and **Faint**: secondary and dead detail
- **Backing**: a filled panel behind the device
- **Frame**: a stroke around its box

Leave a channel on "none" and it follows the theme. Override one and only that channel changes. This is how you draw the same machine dead on the left of a compare slide and lit on the right: set Line to `faint` on one, leave the other alone.

**reset device** strips every override in one click.

## Parameters

Below the colour block, the machine's own levers: leak count, stage count, tread count, angle, and so on. They differ per device and are listed with what the machine encodes.
