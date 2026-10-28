# Site design system (Oct 28 2026)

Israel approved this on Oct 28 2026: "From now on, that's going to be the design system we're going to follow." It started as /homepage-15 and is now the Home page (/), /about and /logo-gallery-3.

## Type
- **Halyard Display** for all live text (headings, paragraphs, name, nav, Lab, footer). From the Adobe Fonts web project "IOD" (kit `gwt5tgs`, family `halyard-display`, weights 200 / 300 / 400 / 500 / 600 / 700).
- **Hierarchy by size and weight, never italics.** Headers Medium (500). The name under the avatar SemiBold (600). Body Regular.
- Header sizes (desktop / tablet / phone): big headers 54 / 42 / 30 (line 2 of the hero 54 / 42 / 25); case-card and Lab titles 26 / 24 / 20, tracking -0.005em, line height 1.12.
- **Nohemi** for details only (uploaded to the Framer workspace fonts; CSS names "Nohemi Medium" and "Nohemi Light"):
  - Nohemi Medium (500): the role under the name (red), every button, the nav "Get in touch".
  - Nohemi Light (300): eyebrows and tags, lowercase, in the button red, on a light block with 7px 14px padding.

## Color
Darkest to lightest, so each layer stands out from the one behind it:
1. Page background **#CDD2EB**
2. Rooms (Selected work, contact box, Kind words) **#E5E8F4**
3. Cards **white**

Red for buttons and red text: **#E54633** (token Colors/V4/Signal). Text: ink #111110 and the muted greys.

## Shapes and depth
- Case cards: radius 28, 1px border at 6% ink, shadow `0px -8px 40px rgba(0,0,0,0.0625)`.
- Contact box: same side margins as the case cards (64px desktop, 40px tablet, 24px phone), 64px under it so the floating nav never covers it, and the `withDockLast` entrance so it always lands.
- Lab cards: 448px tall.

## How it's built in Framer
- One **Font kit** layer (`FontKit.tsx`) at the top of each page loads the Adobe kit and sets Halyard on everything; layers named `Button ·` get Nohemi Medium; text set to Nohemi on the layer keeps it. A font from a text *style* can't get past the kit, so set Nohemi on the layer itself.
- The agent tool can't list uploaded fonts, but `fontName="Nohemi"` with weight 500 or 300 resolves to Medium or Light.
- Contact block: the component "Closing · contact room (V8, light)".
- New pages: copy the Font kit layer from Home and follow the colors above.

## Not done yet
- Logo gallery tiles are still the old warm grey (the logos are white, so the tiles need to stay darker than the logos).
- "In their own voice · hover or tap" on /about is inside a code component and still in capitals.
- The /about section labels ("about", "capabilities") use the new eyebrow font but sit above their headings, not on a light block under them.
